<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class ListasPEPController extends Controller
{
    /**
     * Genera y descarga un certificado PDF de tipo SIN_COINCIDENCIAS.
     *
     * Recibe el conjunto completo de datos de búsqueda y resultados desde
     * el frontend React (modo demo) o los recupera de la base de datos.
     */
    public function certificadoSinCoincidencias(Request $request): Response
    {
        $validated = $request->validate([
            'apellido_denominacion' => ['required', 'string', 'max:255'],
            'nombres' => ['nullable', 'string', 'max:255'],
            'identificacion' => ['nullable', 'string', 'max:100'],
            'filtros_activos' => ['nullable', 'array'],
            'filtros_activos.*' => ['string'],
            'total_resultados' => ['required', 'integer', 'min:0'],
            'fecha_consulta' => ['required', 'string'],
            'resultados' => ['required', 'array'],
            'notaria_nombre' => ['nullable', 'string', 'max:255'],
            'usuario_nombre' => ['nullable', 'string', 'max:255'],
        ]);

        $uuidCert = Str::uuid()->toString();
        $fechaGen = now()->format('d/m/Y H:i:s');

        $data = [
            'apellido_denominacion' => $validated['apellido_denominacion'],
            'nombres' => $validated['nombres'] ?? null,
            'identificacion' => $validated['identificacion'] ?? null,
            'filtros_activos' => $validated['filtros_activos'] ?? [],
            'total_resultados' => $validated['total_resultados'],
            'fecha_consulta' => $validated['fecha_consulta'],
            'resultados' => $validated['resultados'],
            'notaria_nombre' => $validated['notaria_nombre'] ?? (Auth::user()?->notaria?->nombre ?? 'N/D'),
            'usuario_nombre' => $validated['usuario_nombre'] ?? Auth::user()?->name ?? 'N/D',
            'uuid_certificado' => $uuidCert,
            'fecha_generacion' => $fechaGen,
            'hash_preview' => '—',
        ];

        $pdf = Pdf::loadView('pdf.listas-pep.certificado-sin-coincidencias', $data)
            ->setPaper('letter', 'portrait')
            ->setOptions([
                'defaultFont' => 'Arial',
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => false,
                'dpi' => 110,
            ]);

        // Calcular hash del PDF generado
        $pdfContent = $pdf->output();
        $hash = hash('sha256', $pdfContent);
        $data['hash_preview'] = substr($hash, 0, 16).'…';

        // Re-renderizar con hash incluido
        $pdf = Pdf::loadView('pdf.listas-pep.certificado-sin-coincidencias', $data)
            ->setPaper('letter', 'portrait')
            ->setOptions([
                'defaultFont' => 'Arial',
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => false,
                'dpi' => 110,
            ]);

        $pdfContent = $pdf->output();
        $filename = 'pep-sin-coincidencias-'.now()->format('Ymd-His').'.pdf';

        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'Content-Length' => strlen($pdfContent),
        ]);
    }

    /**
     * Genera y descarga un certificado PDF de tipo CON_COINCIDENCIA.
     *
     * Recibe los datos de búsqueda y el resultado específico seleccionado
     * por el usuario como coincidencia confirmada.
     */
    public function certificadoConCoincidencia(Request $request): Response
    {
        $validated = $request->validate([
            'apellido_denominacion' => ['required', 'string', 'max:255'],
            'nombres' => ['nullable', 'string', 'max:255'],
            'identificacion' => ['nullable', 'string', 'max:100'],
            'filtros_activos' => ['nullable', 'array'],
            'filtros_activos.*' => ['string'],
            'fecha_consulta' => ['required', 'string'],
            'resultado' => ['required', 'array'],
            'resultado.denominacion' => ['required', 'string'],
            'resultado.lista' => ['nullable', 'string'],
            'resultado.tipo' => ['nullable', 'string'],
            'notaria_nombre' => ['nullable', 'string', 'max:255'],
            'usuario_nombre' => ['nullable', 'string', 'max:255'],
            'observaciones' => ['nullable', 'string', 'max:2000'],
        ]);

        $uuidCert = Str::uuid()->toString();
        $fechaGen = now()->format('d/m/Y H:i:s');

        $data = [
            'apellido_denominacion' => $validated['apellido_denominacion'],
            'nombres' => $validated['nombres'] ?? null,
            'identificacion' => $validated['identificacion'] ?? null,
            'filtros_activos' => $validated['filtros_activos'] ?? [],
            'fecha_consulta' => $validated['fecha_consulta'],
            'resultado' => $validated['resultado'],
            'notaria_nombre' => $validated['notaria_nombre'] ?? (Auth::user()?->notaria?->nombre ?? 'N/D'),
            'usuario_nombre' => $validated['usuario_nombre'] ?? Auth::user()?->name ?? 'N/D',
            'observaciones' => $validated['observaciones'] ?? null,
            'uuid_certificado' => $uuidCert,
            'fecha_generacion' => $fechaGen,
            'hash_preview' => '—',
        ];

        $pdf = Pdf::loadView('pdf.listas-pep.certificado-con-coincidencia', $data)
            ->setPaper('letter', 'portrait')
            ->setOptions([
                'defaultFont' => 'Arial',
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => false,
                'dpi' => 110,
            ]);

        $pdfContent = $pdf->output();
        $hash = hash('sha256', $pdfContent);
        $data['hash_preview'] = substr($hash, 0, 16).'…';

        // Re-renderizar con hash incluido
        $pdf = Pdf::loadView('pdf.listas-pep.certificado-con-coincidencia', $data)
            ->setPaper('letter', 'portrait')
            ->setOptions([
                'defaultFont' => 'Arial',
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => false,
                'dpi' => 110,
            ]);

        $pdfContent = $pdf->output();
        $filename = 'pep-coincidencia-'.now()->format('Ymd-His').'.pdf';

        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'Content-Length' => strlen($pdfContent),
        ]);
    }

    /**
     * Genera y descarga uno de los listados complementarios en PDF con branding Atinet.
     *
     * Tipos disponibles:
     *   - refipre → Regímenes Fiscales Preferentes (SAT — LISR Título VI)
     *   - ocde    → Países y Territorios con Paraísos Fiscales (OCDE)
     *   - gafi    → Territorios bajo Revisión del GAFI/FATF
     */
    public function descargarListado(string $tipo): Response
    {
        $config = match ($tipo) {
            'refipre' => [
                'view' => 'pdf.listas-pep.listado-refipre',
                'nombre' => 'Atinet-REFIPRE-Regimenes-Fiscales-Preferentes.pdf',
            ],
            'ocde' => [
                'view' => 'pdf.listas-pep.listado-ocde',
                'nombre' => 'Atinet-OCDE-Paraisos-Fiscales.pdf',
            ],
            'gafi' => [
                'view' => 'pdf.listas-pep.listado-gafi',
                'nombre' => 'Atinet-GAFI-Territorios-Revisados.pdf',
            ],
            default => null,
        };

        abort_unless($config !== null, 404, 'Listado no disponible.');

        // Mientras las plantillas OCDE/GAFI no estén listas, servir el PDF original
        if (! view()->exists($config['view'])) {
            $ruta = storage_path('app/listas-pep/'.strtoupper($tipo).'.pdf');
            abort_unless(file_exists($ruta), 404, 'El archivo no se encuentra en el servidor.');

            return response(file_get_contents($ruta), 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="'.$config['nombre'].'"',
            ]);
        }

        $data = ['fecha_generacion' => now()->format('d/m/Y H:i:s')];

        $pdf = Pdf::loadView($config['view'], $data)
            ->setPaper('letter', 'portrait')
            ->setOptions([
                'defaultFont' => 'Arial',
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => false,
                'dpi' => 110,
            ]);

        $pdfContent = $pdf->output();

        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$config['nombre'].'"',
            'Content-Length' => strlen($pdfContent),
        ]);
    }
}
