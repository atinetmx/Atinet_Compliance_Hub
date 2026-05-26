<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DocumentoEscaneado;
use App\Services\OpenAIDocumentAnalyzer;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\PhpWord;
use Smalot\PdfParser\Parser as PdfParser;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class EscanerInteligenteController extends Controller
{
    protected OpenAIDocumentAnalyzer $analyzer;

    public function __construct(OpenAIDocumentAnalyzer $analyzer)
    {
        $this->analyzer = $analyzer;
    }

    /**
     * Mostrar listado de documentos escaneados
     */
    public function index(Request $request): InertiaResponse
    {
        $user = Auth::user();

        $query = DocumentoEscaneado::with(['user', 'notaria'])
            ->where('user_id', $user->id);

        // Filtros
        if ($request->filled('tipo_documento')) {
            $query->where('tipo_documento', $request->tipo_documento);
        }

        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->filled('analizado')) {
            $query->where('analizado_ia', $request->analizado === 'true');
        }

        // Búsqueda
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nombre_original', 'like', "%{$search}%")
                    ->orWhere('tipo_documento', 'like', "%{$search}%");
            });
        }

        $documentos = $query->latest()
            ->paginate(20)
            ->withQueryString();

        // Estadísticas
        $stats = [
            'total' => DocumentoEscaneado::where('user_id', $user->id)->count(),
            'pendientes' => DocumentoEscaneado::where('user_id', $user->id)->pendientes()->count(),
            'completados' => DocumentoEscaneado::where('user_id', $user->id)->completados()->count(),
            'analizados' => DocumentoEscaneado::where('user_id', $user->id)->analizados()->count(),
            'espacio_usado' => DocumentoEscaneado::where('user_id', $user->id)->sum('tamano_bytes'),
        ];

        return Inertia::render('Admin/EscanerInteligente/Index', [
            'documentos' => $documentos,
            'stats' => $stats,
            'filters' => $request->only(['tipo_documento', 'estado', 'analizado', 'search']),
        ]);
    }

    /**
     * Upload y procesar documento
     */
    public function store(Request $request)
    {
        $request->validate([
            'documento' => 'required|file|mimes:jpg,jpeg,png,pdf,doc,docx|max:20480', // 20MB max
            'tipo_documento' => 'nullable|string|in:escritura,contrato,poder,testamento,acta_constitutiva,otro',
            'procesar_a' => 'nullable|array',
            'procesar_a.*' => 'in:pdf,word,texto',
            'analizar_ia' => 'boolean',
        ]);

        try {
            DB::beginTransaction();

            $user = Auth::user();
            $file = $request->file('documento');

            // Generar nombre único
            $hash = Str::random(40);
            $extension = $file->getClientOriginalExtension();
            $nombreArchivo = "{$hash}.{$extension}";

            // Guardar archivo original
            $rutaOriginal = $file->storeAs('documentos/originales', $nombreArchivo, 'private');

            // Crear registro
            $documento = DocumentoEscaneado::create([
                'user_id' => $user->id,
                'notaria_id' => $user->notaria_id,
                'nombre_original' => $file->getClientOriginalName(),
                'ruta_original' => $rutaOriginal,
                'tipo_mime_original' => $file->getMimeType(),
                'tamano_bytes' => $file->getSize(),
                'tipo_documento' => $request->tipo_documento,
                'estado' => 'pendiente',
            ]);

            DB::commit();

            // Procesar en segundo plano (o síncronamente si es pequeño)
            $this->procesarDocumento($documento, $request->input('procesar_a', []), $request->boolean('analizar_ia'));

            return redirect()->back()->with('success', 'Documento subido correctamente');

        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error al subir documento', ['error' => $e->getMessage()]);

            return redirect()->back()->with('error', 'Error al subir el documento: '.$e->getMessage());
        }
    }

    /**
     * Ver detalles del documento
     */
    public function show(DocumentoEscaneado $documento)
    {
        $user = Auth::user();

        // Verificar que el usuario sea propietario
        if ($documento->user_id !== $user->id) {
            abort(403, 'No tienes permiso para ver este documento');
        }

        $documento->load(['user', 'notaria']);

        return Inertia::render('Admin/EscanerInteligente/Show', [
            'documento' => $documento,
        ]);
    }

    /**
     * Descargar archivo procesado
     */
    public function download(DocumentoEscaneado $documento, string $formato): BinaryFileResponse
    {
        $user = Auth::user();

        // Verificar permisos
        if ($documento->user_id !== $user->id) {
            abort(403);
        }

        // Determinar ruta según formato
        $ruta = match ($formato) {
            'original' => $documento->ruta_original,
            'pdf' => $documento->ruta_pdf,
            'word' => $documento->ruta_word,
            'texto' => $documento->ruta_texto,
            default => null,
        };

        if (! $ruta || ! Storage::disk('private')->exists($ruta)) {
            abort(404, 'Archivo no encontrado');
        }

        // Incrementar contador
        $documento->incrementarDescargas();

        return response()->download(
            Storage::disk('private')->path($ruta),
            $this->generarNombreDescarga($documento, $formato)
        );
    }

    /**
     * Analizar con IA
     */
    public function analyze(DocumentoEscaneado $documento)
    {
        $user = Auth::user();

        if ($documento->user_id !== $user->id) {
            abort(403);
        }

        try {
            $documento->update(['estado' => 'procesando']);

            // Analizar según tipo de documento
            $datosExtraidos = match ($documento->tipo_documento) {
                'escritura' => $this->analyzer->analyzeEscritura($documento->ruta_original),
                'contrato' => $this->analyzer->analyzeContrato($documento->ruta_original),
                'poder' => $this->analyzer->analyzePoder($documento->ruta_original),
                'testamento' => $this->analyzer->analyzeTestamento($this->obtenerTextoDocumento($documento)),
                default => $this->analyzer->analyzeDocument($documento->ruta_original, $documento->tipo_documento),
            };

            // Generar resumen
            $resumen = $this->analyzer->generateSummary($documento->ruta_original);

            // Actualizar documento
            $documento->update([
                'analizado_ia' => true,
                'datos_extraidos' => $datosExtraidos,
                'resumen_ia' => $resumen,
                'metadatos_ia' => [
                    'modelo' => config('services.openai.model'),
                    'fecha_analisis' => now()->toIso8601String(),
                    'confianza' => $datosExtraidos['confianza'] ?? null,
                ],
                'estado' => 'completado',
            ]);

            return redirect()->back()->with('success', 'Documento analizado correctamente');

        } catch (Exception $e) {
            $documento->update([
                'estado' => 'error',
                'error_mensaje' => $e->getMessage(),
            ]);

            Log::error('Error al analizar documento', [
                'documento_id' => $documento->id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->with('error', 'Error al analizar documento: '.$e->getMessage());
        }
    }

    /**
     * Eliminar documento
     */
    public function destroy(DocumentoEscaneado $documento)
    {
        $user = Auth::user();

        if ($documento->user_id !== $user->id) {
            abort(403);
        }

        try {
            // Eliminar archivos
            $archivos = array_filter([
                $documento->ruta_original,
                $documento->ruta_pdf,
                $documento->ruta_word,
                $documento->ruta_texto,
            ]);

            foreach ($archivos as $archivo) {
                if (Storage::disk('private')->exists($archivo)) {
                    Storage::disk('private')->delete($archivo);
                }
            }

            $documento->delete();

            return redirect()->back()->with('success', 'Documento eliminado correctamente');

        } catch (Exception $e) {
            Log::error('Error al eliminar documento', ['error' => $e->getMessage()]);

            return redirect()->back()->with('error', 'Error al eliminar documento');
        }
    }

    /**
     * Procesar documento (convertir formatos)
     */
    protected function procesarDocumento(DocumentoEscaneado $documento, array $formatos, bool $analizarIA = false): void
    {
        try {
            $documento->update(['estado' => 'procesando']);

            // Convertir a PDF si se solicita
            if (in_array('pdf', $formatos) && ! $documento->ruta_pdf) {
                $this->convertirAPDF($documento);
            }

            // Convertir a Word si se solicita
            if (in_array('word', $formatos) && ! $documento->ruta_word) {
                $this->convertirAWord($documento);
            }

            // Extraer texto si se solicita
            if (in_array('texto', $formatos) && ! $documento->ruta_texto) {
                $this->extraerTexto($documento);
            }

            // Analizar con IA si se solicita
            if ($analizarIA && ! $documento->analizado_ia) {
                $datosExtraidos = $this->analyzer->analyzeDocument(
                    $documento->ruta_original,
                    $documento->tipo_documento
                );

                $resumen = $this->analyzer->generateSummary($documento->ruta_original);

                $documento->update([
                    'analizado_ia' => true,
                    'datos_extraidos' => $datosExtraidos,
                    'resumen_ia' => $resumen,
                    'metadatos_ia' => [
                        'modelo' => config('services.openai.model'),
                        'fecha_analisis' => now()->toIso8601String(),
                    ],
                ]);
            }

            $documento->update(['estado' => 'completado']);

        } catch (Exception $e) {
            $documento->update([
                'estado' => 'error',
                'error_mensaje' => $e->getMessage(),
            ]);

            Log::error('Error al procesar documento', [
                'documento_id' => $documento->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Convertir documento a PDF
     */
    protected function convertirAPDF(DocumentoEscaneado $documento): void
    {
        // TODO: Implementar conversión a PDF según tipo de archivo original
        // Por ahora, solo copiamos si ya es PDF
        if ($documento->tipo_mime_original === 'application/pdf') {
            $contenido = Storage::disk('private')->get($documento->ruta_original);
            $nombrePDF = Str::random(40).'.pdf';
            $rutaPDF = "documentos/pdf/{$nombrePDF}";
            Storage::disk('private')->put($rutaPDF, $contenido);
            $documento->update(['ruta_pdf' => $rutaPDF]);
        }
    }

    /**
     * Convertir documento a Word
     */
    protected function convertirAWord(DocumentoEscaneado $documento): void
    {
        try {
            $phpWord = new PhpWord;
            $section = $phpWord->addSection();

            // Si es PDF, extraer texto y crear documento Word
            if ($documento->tipo_mime_original === 'application/pdf') {
                $parser = new PdfParser;
                $pdf = $parser->parseFile(Storage::disk('private')->path($documento->ruta_original));
                $texto = $pdf->getText();

                // Dividir texto en párrafos y agregar al documento
                $parrafos = explode("\n\n", $texto);
                foreach ($parrafos as $parrafo) {
                    if (! empty(trim($parrafo))) {
                        $section->addText(trim($parrafo), ['size' => 11], ['alignment' => 'both']);
                        $section->addTextBreak();
                    }
                }
            } elseif (in_array($documento->tipo_mime_original, ['image/jpeg', 'image/jpg', 'image/png'])) {
                // Si es imagen, insertar directamente en Word
                $rutaImagen = Storage::disk('private')->path($documento->ruta_original);
                $section->addImage($rutaImagen, [
                    'width' => 450,
                    'height' => 600,
                    'alignment' => \PhpOffice\PhpWord\SimpleType\Jc::CENTER,
                ]);
            }

            // Guardar documento Word
            $nombreWord = Str::random(40).'.docx';
            $rutaWord = storage_path("app/private/documentos/word/{$nombreWord}");

            // Crear directorio si no existe
            if (! file_exists(dirname($rutaWord))) {
                mkdir(dirname($rutaWord), 0755, true);
            }

            $objWriter = IOFactory::createWriter($phpWord, 'Word2007');
            $objWriter->save($rutaWord);

            $documento->update(['ruta_word' => "documentos/word/{$nombreWord}"]);

        } catch (Exception $e) {
            Log::warning('Error al convertir a Word', [
                'documento_id' => $documento->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Extraer texto del documento
     */
    protected function extraerTexto(DocumentoEscaneado $documento): void
    {
        try {
            $texto = '';

            if ($documento->tipo_mime_original === 'application/pdf') {
                // Extraer texto de PDF
                $parser = new PdfParser;
                $pdf = $parser->parseFile(Storage::disk('private')->path($documento->ruta_original));
                $texto = $pdf->getText();
            }

            if (! empty($texto)) {
                $nombreTxt = Str::random(40).'.txt';
                $rutaTxt = "documentos/texto/{$nombreTxt}";
                Storage::disk('private')->put($rutaTxt, $texto);
                $documento->update(['ruta_texto' => $rutaTxt]);
            }

        } catch (Exception $e) {
            Log::warning('Error al extraer texto', [
                'documento_id' => $documento->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Obtener el texto extraído de un documento.
     *
     * Prioridad: archivo de texto ya generado (ruta_texto) → extracción inline del original.
     * Usado por analyzeTestamento(), que recibe texto plano en lugar de imagen.
     */
    protected function obtenerTextoDocumento(DocumentoEscaneado $documento): string
    {
        // Si ya se extrajo el texto, usarlo directamente
        if ($documento->ruta_texto && Storage::disk('private')->exists($documento->ruta_texto)) {
            return Storage::disk('private')->get($documento->ruta_texto) ?? '';
        }

        // Extraer texto al vuelo del documento original
        $ruta = $documento->ruta_original;

        if (! $ruta || ! Storage::disk('private')->exists($ruta)) {
            return '';
        }

        $rutaAbsoluta = Storage::disk('private')->path($ruta);
        $extension = strtolower(pathinfo($ruta, PATHINFO_EXTENSION));

        if ($extension === 'pdf') {
            try {
                $parser = new \Smalot\PdfParser\Parser;
                $pdf = $parser->parseFile($rutaAbsoluta);

                return $pdf->getText();
            } catch (\Exception $e) {
                Log::warning('Error extrayendo texto del PDF para testamento', ['error' => $e->getMessage()]);
            }
        } elseif (in_array($extension, ['docx', 'doc', 'odt'])) {
            try {
                $phpWord = \PhpOffice\PhpWord\IOFactory::load($rutaAbsoluta);
                $texto = '';
                foreach ($phpWord->getSections() as $section) {
                    foreach ($section->getElements() as $element) {
                        if (method_exists($element, 'getText')) {
                            $texto .= $element->getText().' ';
                        }
                    }
                }

                return trim($texto);
            } catch (\Exception $e) {
                Log::warning('Error extrayendo texto del Word para testamento', ['error' => $e->getMessage()]);
            }
        }

        return '';
    }

    /**
     * Generar nombre de descarga
     */
    protected function generarNombreDescarga(DocumentoEscaneado $documento, string $formato): string
    {
        $nombreBase = pathinfo($documento->nombre_original, PATHINFO_FILENAME);

        $extension = match ($formato) {
            'original' => pathinfo($documento->nombre_original, PATHINFO_EXTENSION),
            'pdf' => 'pdf',
            'word' => 'docx',
            'texto' => 'txt',
            default => 'bin',
        };

        return "{$nombreBase}.{$extension}";
    }
}
