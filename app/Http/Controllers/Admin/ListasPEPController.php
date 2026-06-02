<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ListaPepBusqueda;
use App\Models\ListaPepPersona;
use App\Models\ListaPepResultado;
use App\Models\Notaria;
use App\Services\PepQuotaService;
use App\Services\PrevencionDeLavadoService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class ListasPEPController extends Controller
{
    /**
     * Retorna el consumo actual del plan PLD contratado (GET /Listas/Consumos).
     * Usado por el frontend para mostrar consultas disponibles en tiempo real.
     */
    public function consumos(PrevencionDeLavadoService $pld): JsonResponse
    {
        $resultado = $pld->getConsumos();

        if (! $resultado['success']) {
            return response()->json([
                'success' => false,
                'message' => $resultado['message'],
            ], 503);
        }

        return response()->json([
            'success' => true,
            'data' => $resultado['data'],
        ]);
    }

    /**
     * Realiza una búsqueda en listas PEP.
     *
     * Flujo:
     *   1. Verifica cuota disponible (PepQuotaService).
     *   2. Busca en BD interna (listas_pep_personas) — sin consumir token.
     *   3. Si no hay resultados en BD interna → llama a API PrevencionDeLavado.com.
     *   4. Guarda la búsqueda + resultados + UPSERT en listas_pep_personas.
     *   5. Consume 1 token del pool (solo si se usó la API externa).
     */
    public function buscar(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'apellido_denominacion' => ['required', 'string', 'max:255'],
            'nombres' => ['nullable', 'string', 'max:255'],
            'identificacion' => ['nullable', 'string', 'max:50'],
            'pepsOtrosPaises' => ['boolean'],
            'satXDenominacion' => ['boolean'],
            'documentosSimilares' => ['boolean'],
            'forzarApellidos' => ['boolean'],
            'generarCertificados' => ['boolean'],
        ]);

        $user = Auth::user();

        // 1. Verificar cuota
        try {
            app(PepQuotaService::class)->verificarDisponibilidad($user);
        } catch (\RuntimeException $e) {
            // Sin cuota → intentar BD interna de todas formas
        }

        $termino = trim(($validated['apellido_denominacion'] ?? '').' '.($validated['nombres'] ?? ''));

        // 2. Buscar en BD interna (offline, sin consumir token)
        $resultadosBdInterna = ListaPepPersona::query()
            ->buscar($validated['apellido_denominacion'])
            ->limit(50)
            ->get();

        if ($resultadosBdInterna->isNotEmpty()) {
            $busqueda = ListaPepBusqueda::create([
                'user_id' => $user->id,
                'notaria_id' => $user->notaria_id,
                'apellido_denominacion' => $validated['apellido_denominacion'],
                'nombres' => $validated['nombres'] ?? null,
                'identificacion' => $validated['identificacion'] ?? null,
                'opciones' => $this->extraerOpciones($validated),
                'total_resultados' => $resultadosBdInterna->count(),
                'fecha_consulta' => now(),
                'ip_address' => $request->ip(),
                'estado_busqueda' => 'BD_INTERNA',
            ]);

            return response()->json([
                'success' => true,
                'fuente' => 'BD_INTERNA',
                'busqueda_id' => $busqueda->id,
                'codigo_certificado' => null,
                'fecha_consulta' => $busqueda->fecha_consulta->toISOString(),
                'total_resultados' => $resultadosBdInterna->count(),
                'resultados' => $resultadosBdInterna->map(fn (ListaPepPersona $p) => $this->personaToResultado($p)),
            ]);
        }

        // 3. Verificar cuota antes de llamar a la API externa
        try {
            app(PepQuotaService::class)->verificarDisponibilidad($user);
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Sin cuota de búsquedas PEP disponible. Contacte a su administrador.',
            ], 402);
        }

        // 4. Llamar a la API externa
        $resultado = app(PrevencionDeLavadoService::class)->buscarEnListas($validated);

        if (! $resultado['success']) {
            return response()->json([
                'success' => false,
                'message' => $resultado['message'] ?? 'Error al consultar el servicio externo.',
            ], 503);
        }

        $data = $resultado['data'];
        $resultadosApi = $data['resultados'] ?? [];

        // 5. Guardar en BD — envuelto en transacción
        $busqueda = DB::transaction(function () use ($user, $validated, $data, $resultadosApi, $request): ListaPepBusqueda {
            $busqueda = ListaPepBusqueda::create([
                'user_id' => $user->id,
                'notaria_id' => $user->notaria_id,
                'apellido_denominacion' => $validated['apellido_denominacion'],
                'nombres' => $validated['nombres'] ?? null,
                'identificacion' => $validated['identificacion'] ?? null,
                'opciones' => $this->extraerOpciones($validated),
                'total_resultados' => count($resultadosApi),
                'codigo_certificado' => $data['codigo_certificado'] ?? null,
                'fecha_consulta' => now(),
                'ip_address' => $request->ip(),
                'estado_busqueda' => 'PROCESADA',
            ]);

            foreach ($resultadosApi as $orden => $item) {
                $camposResultado = $this->mapearResultadoApi($item, $busqueda->id, $orden + 1);

                // Guardar en listas_pep_resultados (log por búsqueda)
                ListaPepResultado::create($camposResultado);

                // UPSERT en listas_pep_personas (1 fila por individuo)
                $camposPersona = $this->mapearPersonaDesdeApi($item);
                ListaPepPersona::upsertDesdeApi($camposPersona, $busqueda->id);
            }

            return $busqueda;
        });

        // 6. Consumir 1 token
        app(PepQuotaService::class)->consumir($user);

        return response()->json([
            'success' => true,
            'fuente' => 'API_PLD',
            'busqueda_id' => $busqueda->id,
            'codigo_certificado' => $data['codigo_certificado'] ?? null,
            'fecha_consulta' => $busqueda->fecha_consulta->toISOString(),
            'total_resultados' => count($resultadosApi),
            'resultados' => $resultadosApi,
        ]);
    }

    /**
     * Extrae solo los campos booleanos de opciones del request validado.
     *
     * @param  array<string, mixed>  $validated
     * @return array<string, bool>
     */
    private function extraerOpciones(array $validated): array
    {
        return [
            'pepsOtrosPaises' => (bool) ($validated['pepsOtrosPaises'] ?? false),
            'satXDenominacion' => (bool) ($validated['satXDenominacion'] ?? false),
            'documentosSimilares' => (bool) ($validated['documentosSimilares'] ?? false),
            'forzarApellidos' => (bool) ($validated['forzarApellidos'] ?? false),
            'generarCertificados' => (bool) ($validated['generarCertificados'] ?? true),
        ];
    }

    /**
     * Mapea un ítem de la respuesta API a los campos de listas_pep_resultados.
     *
     * @param  array<string, mixed>  $item
     * @return array<string, mixed>
     */
    private function mapearResultadoApi(array $item, int $busquedaId, int $orden): array
    {
        return [
            'busqueda_id' => $busquedaId,
            'codigo_individuo' => $item['codigoIndividuo'] ?? $item['codigo_individuo'] ?? 0,
            'denominacion' => $item['denominacion'] ?? '',
            'identificacion' => $item['identificacion'] ?? null,
            'id_tributaria' => $item['idTributaria'] ?? $item['id_tributaria'] ?? null,
            'otra_identificacion' => $item['otraIdentificacion'] ?? $item['otra_identificacion'] ?? null,
            'fecha_nacimiento' => $item['fechaNacimiento'] ?? $item['fecha_nacimiento'] ?? null,
            'tipo' => $item['tipo'] ?? '',
            'sub_tipo' => $item['subTipo'] ?? $item['sub_tipo'] ?? '',
            'estado' => $item['estado'] ?? '',
            'cargo' => $item['cargo'] ?? '',
            'finalizacion_cargo' => $item['finalizacionCargo'] ?? $item['finalizacion_cargo'] ?? null,
            'lugar_trabajo' => $item['lugarTrabajo'] ?? $item['lugar_trabajo'] ?? '',
            'direccion' => $item['direccion'] ?? '',
            'lista' => $item['lista'] ?? '',
            'pais_lista' => $item['paisLista'] ?? $item['pais_lista'] ?? '',
            'supuesto' => $item['supuesto'] ?? null,
            'situacion' => $item['situacion'] ?? null,
            'exactitud_denominacion' => $item['exactitudDenominacion'] ?? $item['exactitud_denominacion'] ?? 'N/D',
            'exactitud_identificacion' => $item['exactitudIdentificacion'] ?? $item['exactitud_identificacion'] ?? 'N/D',
            'enlace' => $item['enlace'] ?? null,
            'orden_relevancia' => $orden,
            'hash_registro' => ListaPepResultado::calcularHash($item),
            'es_coincidencia_exacta' => false,
        ];
    }

    /**
     * Mapea un ítem de la respuesta API a los campos de listas_pep_personas.
     *
     * @param  array<string, mixed>  $item
     * @return array<string, mixed>
     */
    private function mapearPersonaDesdeApi(array $item): array
    {
        return [
            'codigo_individuo' => $item['codigoIndividuo'] ?? $item['codigo_individuo'] ?? 0,
            'denominacion' => $item['denominacion'] ?? '',
            'identificacion' => $item['identificacion'] ?? null,
            'id_tributaria' => $item['idTributaria'] ?? $item['id_tributaria'] ?? null,
            'otra_identificacion' => $item['otraIdentificacion'] ?? $item['otra_identificacion'] ?? null,
            'fecha_nacimiento' => $item['fechaNacimiento'] ?? $item['fecha_nacimiento'] ?? null,
            'tipo' => $item['tipo'] ?? '',
            'sub_tipo' => $item['subTipo'] ?? $item['sub_tipo'] ?? '',
            'estado' => $item['estado'] ?? '',
            'cargo' => $item['cargo'] ?? '',
            'finalizacion_cargo' => $item['finalizacionCargo'] ?? $item['finalizacion_cargo'] ?? null,
            'lugar_trabajo' => $item['lugarTrabajo'] ?? $item['lugar_trabajo'] ?? '',
            'direccion' => $item['direccion'] ?? '',
            'lista' => $item['lista'] ?? '',
            'pais_lista' => $item['paisLista'] ?? $item['pais_lista'] ?? '',
            'supuesto' => $item['supuesto'] ?? null,
            'situacion' => $item['situacion'] ?? null,
            'enlace' => $item['enlace'] ?? null,
            'hash_registro' => ListaPepResultado::calcularHash($item),
        ];
    }

    /**
     * Convierte un modelo ListaPepPersona al formato de resultado esperado por el frontend.
     *
     * @return array<string, mixed>
     */
    private function personaToResultado(ListaPepPersona $persona): array
    {
        return [
            'codigoIndividuo' => $persona->codigo_individuo,
            'denominacion' => $persona->denominacion,
            'identificacion' => $persona->identificacion,
            'idTributaria' => $persona->id_tributaria,
            'otraIdentificacion' => $persona->otra_identificacion,
            'fechaNacimiento' => $persona->fecha_nacimiento,
            'tipo' => $persona->tipo,
            'subTipo' => $persona->sub_tipo,
            'estado' => $persona->estado,
            'cargo' => $persona->cargo,
            'finalizacionCargo' => $persona->finalizacion_cargo,
            'lugarTrabajo' => $persona->lugar_trabajo,
            'direccion' => $persona->direccion,
            'lista' => $persona->lista,
            'paisLista' => $persona->pais_lista,
            'supuesto' => $persona->supuesto,
            'situacion' => $persona->situacion,
            'exactitudDenominacion' => 'N/D',
            'exactitudIdentificacion' => 'N/D',
            'enlace' => $persona->enlace,
            'relaciones' => null,
        ];
    }

    /**
     * Renderiza la página de historial de búsquedas PEP con datos paginados.
     *
     * Super-admin ve todas las notarías y puede filtrar por una en particular.
     * El resto solo ve su propia notaría.
     */
    public function historialPage(Request $request): InertiaResponse
    {
        $user = Auth::user();
        $termino = $request->query('q');
        $dias = $request->query('dias', 30);
        $notariaId = $request->query('notaria_id');

        $query = ListaPepBusqueda::with([
            'user:id,name',
            'notaria:id,nombre,numero_notaria',
        ])->latest('fecha_consulta');

        if (! $user->isSuperAdmin()) {
            $query->deNotaria($user->notaria_id);
        } elseif ($notariaId) {
            $query->deNotaria((int) $notariaId);
        }

        if ($termino) {
            $query->buscar($termino);
        }

        if (is_numeric($dias) && (int) $dias > 0) {
            $query->ultimosDias((int) $dias);
        }

        $busquedas = $query->paginate(20)->withQueryString();

        $notarias = $user->isSuperAdmin()
            ? Notaria::query()
                ->select('id', 'nombre', 'numero_notaria')
                ->orderBy('numero_notaria')
                ->get()
            : collect();

        $paquete = app(PepQuotaService::class)->getPaqueteInfo($user);

        return Inertia::render('Admin/ListasPEP/History', [
            'historial' => $busquedas,
            'notarias' => $notarias,
            'is_super_admin' => $user->isSuperAdmin(),
            'paquete' => $paquete,
            'filters' => [
                'q' => $termino,
                'dias' => $dias,
                'notaria_id' => $notariaId ? (int) $notariaId : null,
            ],
        ]);
    }

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
            'filtros_activos' => ['present', 'array'],
            'filtros_activos.*' => ['string'],
            'total_resultados' => ['required', 'integer', 'min:0'],
            'fecha_consulta' => ['required', 'string'],
            'resultados' => ['present', 'array'],
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
