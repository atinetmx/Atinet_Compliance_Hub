<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreRegistroRequest;
use App\Models\LegacyRegistro;
use App\Models\Notaria;
use App\Models\RegistroPersona;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class RegistroWebController extends Controller
{
    /**
     * Mostrar formulario de registro + historial
     */
    public function index(): Response
    {
        $user = Auth::user();
        $notaria = $user->notaria_code ?? optional($user->notaria)->legacy_identifier ?? null;

        // Registros NUEVOS (BD nueva) - últimos 50
        $registrosNuevos = RegistroPersona::query()
            ->when($notaria, fn ($q) => $q->where('notaria', $notaria))
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn ($r) => [
                'source' => 'nuevo',
                'id' => $r->id,
                'nombre_completo' => $r->nombre_completo,
                'curp' => $r->curp,
                'rfc' => $r->rfc,
                'persona' => $r->persona,
                'dia_registro' => $r->dia_registro,
                'created_at' => $r->created_at,
            ]);

        // Registros LEGACY (solo lectura) - últimos 50
        $registrosLegacy = LegacyRegistro::query()
            ->when($notaria, fn ($q) => $q->where('notaria', $notaria))
            ->orderBy('idregistro', 'desc')
            ->limit(50)
            ->get()
            ->map(fn ($r) => [
                'source' => 'legacy',
                'id' => $r->idregistro,
                'nombre_completo' => $r->nombre_completo,
                'curp' => $r->curp,
                'rfc' => $r->rfc,
                'persona' => strtolower($r->Persona),
                'dia_registro' => $r->dia_registro,
                'created_at' => $r->dia_registro,
            ]);

        // Combinar y ordenar por fecha
        $historial = $registrosNuevos
            ->concat($registrosLegacy)
            ->sortByDesc('created_at')
            ->values();

        $isSuperAdmin = $user->tipo_cuenta === 'super_admin';
        $registroWebUrl = $notaria
            ? 'https://notariosatinet.com.mx/'.$notaria.'/'
            : null;

        return Inertia::render('Admin/RegistroWeb/Index', [
            'historial' => $historial,
            'notaria' => $notaria,
            'is_super_admin' => $isSuperAdmin,
            'registro_web_url' => $registroWebUrl,
            'stats' => [
                'total_nuevos' => RegistroPersona::when($notaria, fn ($q) => $q->where('notaria', $notaria))->count(),
                'total_legacy' => LegacyRegistro::when($notaria, fn ($q) => $q->where('notaria', $notaria))->count(),
            ],
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }

    /**
     * Guardar NUEVO registro (en BD NUEVA)
     *
     * Usa StoreRegistroRequest que valida:
     * - CURP: 18 caracteres con regex específico (solo persona física)
     * - RFC: 12-13 caracteres con regex específico
     * - Validación diferenciada según tipo de persona
     * - 85 campos completos
     */
    public function store(StoreRegistroRequest $request): JsonResponse|RedirectResponse
    {
        // Los datos ya están validados por StoreRegistroRequest
        $validated = $request->validated();

        // Detectar si ya existe registro con mismo CURP o RFC (auto-update)
        $existente = null;

        if (! empty($validated['curp'])) {
            $existente = RegistroPersona::where('curp', $validated['curp'])->first();
        }

        if (! $existente && ! empty($validated['rfc'])) {
            $existente = RegistroPersona::where('rfc', $validated['rfc'])->first();
        }

        // Normalizar datos (convertir a MAYÚSCULAS según PHP original)
        $validated = $this->normalizeData($validated);

        // Agregar metadata automática
        $validated['dia_registro'] = $validated['dia_registro'] ?? now()->toDateString();
        $validated['notaria'] = $validated['notaria'] ?? Auth::user()->notaria_code ?? Auth::user()->notaria->legacy_identifier ?? '';
        $validated['envio_de_correo'] = $validated['envio_de_correo'] ?? false;

        // Valores por defecto (si no vienen del request)
        $validated['alias'] = $validated['alias'] ?? '';
        $validated['pais'] = $validated['pais'] ?? 'MEXICO';
        $validated['pais_fiscal'] = $validated['pais_fiscal'] ?? 'MEXICO';
        $validated['paisnac'] = $validated['paisnac'] ?? 'MEXICO';
        $validated['nacionalidad'] = $validated['nacionalidad'] ?? 'MEXICANA';

        // INSERT o UPDATE según detección de duplicados
        if ($existente) {
            $existente->update($validated);
            $accion = 'actualizado';
            $registro = $existente;

            Log::info('Registro actualizado por duplicado', [
                'id' => $existente->id,
                'curp' => $validated['curp'] ?? null,
                'rfc' => $validated['rfc'],
            ]);
        } else {
            $registro = RegistroPersona::create($validated);
            $accion = 'creado';

            Log::info('Registro creado', [
                'id' => $registro->id,
                'persona' => $validated['persona'],
                'curp' => $validated['curp'] ?? null,
                'rfc' => $validated['rfc'],
            ]);
        }

        // Inertia requests esperan un redirect; llamadas API directas esperan JSON
        if ($request->header('X-Inertia')) {
            return redirect()->route('registro-web.index')
                ->with('success', "Registro #{$registro->id} {$accion} correctamente");
        }

        return response()->json([
            'success' => true,
            'message' => "Registro #{$registro->id} {$accion} correctamente",
            'data' => $registro,
            'action' => $accion, // 'creado' o 'actualizado'
        ]);
    }

    /**
     * Normalizar datos según sistema PHP original
     * Convierte a MAYÚSCULAS y ajusta tipos de datos
     */
    protected function normalizeData(array $data): array
    {
        // Campos que deben ir en MAYÚSCULAS
        $camposMayusculas = [
            'nombre', 'apellidopat', 'apellidomat', 'curp', 'rfc',
            'nombre_conyuge', 'apellido_paterno_conyuge', 'apellido_materno_conyuge',
            'calle', 'colonia', 'municipio', 'estado', 'ciudad', 'pais',
            'calle_fiscal', 'colonia_fiscal', 'municipio_fiscal', 'estado_fiscal', 'ciudad_fiscal', 'pais_fiscal',
            'calle_notificaciones', 'colonia_notificaciones', 'municipio_notificaciones', 'estado_notificaciones', 'ciudad_notificaciones', 'pais_notificaciones',
            'paisnac', 'nacionalidad', 'estado_nac', 'ciudad_nac', 'municipio_nac',
            'padre_nombre', 'madre_nombre', 'autoridad_emisora', 'autoridad_emisora_usuario',
        ];

        foreach ($camposMayusculas as $campo) {
            if (isset($data[$campo]) && is_string($data[$campo])) {
                $data[$campo] = mb_strtoupper(trim($data[$campo]), 'UTF-8');
            }
        }

        // Normalizar códigos postales: preservar ceros iniciales como string de 5 dígitos
        foreach (['cp', 'cp_fiscal', 'cp_notificaciones'] as $cpField) {
            if (isset($data[$cpField]) && $data[$cpField] !== '' && $data[$cpField] !== null) {
                $data[$cpField] = str_pad(preg_replace('/\D/', '', (string) $data[$cpField]), 5, '0', STR_PAD_LEFT);
            }
        }

        // Normalizar vigencia INE: si viene solo el año (4 dígitos), convertir a último día del año
        if (isset($data['vigiencia_de_ine']) && preg_match('/^\d{4}$/', (string) $data['vigiencia_de_ine'])) {
            $data['vigiencia_de_ine'] = $data['vigiencia_de_ine'].'-12-31';
        }

        // Convertir num_doc_identificacion a entero si viene
        if (isset($data['num_doc_identificacion']) && ! empty($data['num_doc_identificacion'])) {
            $data['num_doc_identificacion'] = (int) $data['num_doc_identificacion'];
        }

        return $data;
    }

    /**
     * Mostrar un registro específico
     */
    public function show(Request $request, $id): JsonResponse
    {
        $source = $request->query('source', 'nuevo');

        if ($source === 'legacy') {
            $registro = LegacyRegistro::findOrFail($id);
        } else {
            $registro = RegistroPersona::findOrFail($id);
        }

        return response()->json([
            'success' => true,
            'data' => $registro,
            'source' => $source,
        ]);
    }

    /**
     * Actualizar registro (solo registros nuevos)
     *
     * Usa la misma validación y normalización que store()
     * para mantener consistencia en el formato de datos
     */
    public function update(StoreRegistroRequest $request, int $id): JsonResponse
    {
        $registro = RegistroPersona::findOrFail($id);

        // Obtener datos validados
        $validated = $request->validated();

        // Normalizar datos (MAYÚSCULAS, tipos)
        $validated = $this->normalizeData($validated);

        // Aplicar defaults si no vienen
        $validated['dia_registro'] = $validated['dia_registro'] ?? $registro->dia_registro ?? now()->toDateString();
        $validated['notaria'] = $validated['notaria'] ?? $registro->notaria ?? Auth::user()->notaria->legacy_identifier ?? '';
        $validated['envio_de_correo'] = $validated['envio_de_correo'] ?? $registro->envio_de_correo ?? false;

        // Defaults de ubicación
        $validated['pais'] = $validated['pais'] ?? 'MEXICO';
        $validated['pais_fiscal'] = $validated['pais_fiscal'] ?? 'MEXICO';
        $validated['paisnac'] = $validated['paisnac'] ?? 'MEXICO';
        $validated['nacionalidad'] = $validated['nacionalidad'] ?? 'MEXICANA';

        // Actualizar registro
        $registro->update($validated);

        Log::info('Registro actualizado', [
            'id' => $registro->id,
            'curp' => $validated['curp'] ?? null,
            'rfc' => $validated['rfc'] ?? null,
            'persona' => $validated['persona'] ?? null,
            'updated_by' => Auth::id(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Registro #{$registro->id} actualizado correctamente",
            'data' => $registro->fresh(),
        ]);
    }

    /**
     * Eliminar registro (soft delete, solo registros nuevos)
     */
    public function destroy(int $id): JsonResponse
    {
        $registro = RegistroPersona::findOrFail($id);

        // Guardar datos para el log antes de eliminar
        $info = [
            'id' => $registro->id,
            'nombre' => trim(($registro->nombre ?? '').' '.($registro->apellidopat ?? '').' '.($registro->apellidomat ?? '')),
            'curp' => $registro->curp,
            'rfc' => $registro->rfc,
            'deleted_by' => Auth::id(),
        ];

        $registro->delete(); // soft delete

        Log::warning('Registro de persona eliminado por super_admin', $info);

        return response()->json([
            'success' => true,
            'message' => "Registro #{$id} eliminado correctamente",
        ]);
    }

    /**
     * Buscar por CURP (busca en AMBAS tablas)
     * Valida formato según sistema PHP original: 18 caracteres con patrón específico
     */
    public function searchCurp(Request $request): JsonResponse
    {
        $curp = strtoupper(trim($request->query('curp', '')));

        if (empty($curp)) {
            return response()->json([
                'found' => false,
                'message' => 'CURP no proporcionado',
            ], 400);
        }

        // Validar formato CURP (18 caracteres): 4 letras + 6 dígitos + H/M + 5 letras + 1 alfanumérico + 1 dígito
        if (! preg_match('/^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/', $curp)) {
            return response()->json([
                'found' => false,
                'message' => 'Formato de CURP inválido. Debe tener 18 caracteres alfanuméricos con el patrón: 4 letras + 6 dígitos + H/M + 5 letras + 1 alfanumérico + 1 dígito',
                'curp_recibido' => $curp,
                'longitud' => strlen($curp),
            ], 422);
        }

        // Buscar primero en BD nueva
        $persona = RegistroPersona::where('curp', $curp)->first();

        if ($persona) {
            return response()->json([
                'found' => true,
                'source' => 'nuevo',
                'data' => $persona,
                'message' => 'Registro encontrado en base de datos nueva',
            ]);
        }

        // Si no existe, buscar en legacy
        $legacyPersona = LegacyRegistro::where('curp', $curp)->first();

        if ($legacyPersona) {
            return response()->json([
                'found' => true,
                'source' => 'legacy',
                'data' => $legacyPersona,
                'message' => 'Registro encontrado en sistema legacy (solo lectura)',
            ]);
        }

        return response()->json([
            'found' => false,
            'message' => 'No se encontró ningún registro con ese CURP',
            'curp_buscado' => $curp,
        ]);
    }

    /**
     * Buscar por RFC (busca en AMBAS tablas)
     * Valida formato según sistema PHP original: 12-13 caracteres con patrón específico
     */
    public function searchRfc(Request $request): JsonResponse
    {
        $rfc = strtoupper(trim($request->query('rfc', '')));

        if (empty($rfc)) {
            return response()->json([
                'found' => false,
                'message' => 'RFC no proporcionado',
            ], 400);
        }

        // Validar formato RFC (12-13 caracteres): 3-4 letras + 6 dígitos + 2-3 alfanuméricos
        if (! preg_match('/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{2,3}$/u', $rfc)) {
            return response()->json([
                'found' => false,
                'message' => 'Formato de RFC inválido. Debe tener 12-13 caracteres con el patrón: 3-4 letras + 6 dígitos + 2-3 alfanuméricos',
                'rfc_recibido' => $rfc,
                'longitud' => strlen($rfc),
            ], 422);
        }

        // Buscar primero en BD nueva
        $persona = RegistroPersona::where('rfc', $rfc)->first();

        if ($persona) {
            return response()->json([
                'found' => true,
                'source' => 'nuevo',
                'data' => $persona,
                'message' => 'Registro encontrado en base de datos nueva',
            ]);
        }

        // Si no existe, buscar en legacy
        $legacyPersona = LegacyRegistro::where('rfc', $rfc)->first();

        if ($legacyPersona) {
            return response()->json([
                'found' => true,
                'source' => 'legacy',
                'data' => $legacyPersona,
                'message' => 'Registro encontrado en sistema legacy (solo lectura)',
            ]);
        }

        return response()->json([
            'found' => false,
            'message' => 'No se encontró ningún registro con ese RFC',
            'rfc_buscado' => $rfc,
        ]);
    }

    /**
     * Listado de registros con filtros y paginación.
     * Super admin: puede ver todos y filtrar por notaría.
     * Otros: solo ven su notaría.
     */
    public function listado(Request $request): Response
    {
        $user = Auth::user();
        $isSuperAdmin = $user->tipo_cuenta === 'super_admin';
        $userNotaria = $user->notaria_code ?? optional($user->notaria)->legacy_identifier ?? null;

        // Filtros recibidos
        $filtroNotaria = $request->query('notaria');
        $filtroNombre = $request->query('nombre');
        $filtroFechaDesde = $request->query('fecha_desde');
        $filtroFechaHasta = $request->query('fecha_hasta');

        $query = RegistroPersona::query()
            ->select([
                'id', 'notaria', 'persona', 'nombre', 'apellidopat', 'apellidomat',
                'curp', 'rfc', 'dia_registro', 'created_at',
            ])
            ->when(! $isSuperAdmin, fn ($q) => $q->where('notaria', $userNotaria))
            ->when($isSuperAdmin && $filtroNotaria, fn ($q) => $q->where('notaria', $filtroNotaria))
            ->when($filtroNombre, function ($q) use ($filtroNombre) {
                $term = '%'.strtoupper(trim($filtroNombre)).'%';
                $q->where(function ($inner) use ($term, $filtroNombre) {
                    $inner->whereRaw("UPPER(CONCAT(nombre, ' ', apellidopat, ' ', IFNULL(apellidomat,''))) LIKE ?", [$term])
                        ->orWhere('curp', 'like', strtoupper($filtroNombre).'%')
                        ->orWhere('rfc', 'like', strtoupper($filtroNombre).'%');
                });
            })
            ->when($filtroFechaDesde, fn ($q) => $q->whereDate('dia_registro', '>=', $filtroFechaDesde))
            ->when($filtroFechaHasta, fn ($q) => $q->whereDate('dia_registro', '<=', $filtroFechaHasta))
            ->latest('dia_registro');

        $registros = $query->paginate(20)->withQueryString();

        // Lista de notarías para el filtro (solo super_admin)
        $notarias = $isSuperAdmin
            ? Notaria::query()
                ->select('id', 'nombre', 'numero_notaria', 'legacy_identifier')
                ->orderBy('numero_notaria')
                ->get()
            : collect();

        return Inertia::render('Admin/RegistroWeb/Listado', [
            'registros' => $registros,
            'notarias' => $notarias,
            'can_delete' => $isSuperAdmin,
            'is_super_admin' => $isSuperAdmin,
            'filters' => [
                'notaria' => $filtroNotaria,
                'nombre' => $filtroNombre,
                'fecha_desde' => $filtroFechaDesde,
                'fecha_hasta' => $filtroFechaHasta,
            ],
        ]);
    }
}
