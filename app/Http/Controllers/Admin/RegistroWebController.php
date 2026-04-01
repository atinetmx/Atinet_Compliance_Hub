<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LegacyRegistro;
use App\Models\RegistroPersona;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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

        return Inertia::render('Admin/RegistroWeb/Index', [
            'historial' => $historial,
            'notaria' => $notaria,
            'stats' => [
                'total_nuevos' => RegistroPersona::when($notaria, fn ($q) => $q->where('notaria', $notaria))->count(),
                'total_legacy' => LegacyRegistro::when($notaria, fn ($q) => $q->where('notaria', $notaria))->count(),
            ],
        ]);
    }

    /**
     * Guardar NUEVO registro (en BD NUEVA)
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            // Metadata
            'persona' => 'required|in:fisica,moral',

            // Datos personales
            'nombre' => 'required|string|max:30',
            'apellidopat' => 'required_if:persona,fisica|nullable|string|max:30',
            'apellidomat' => 'nullable|string|max:30',
            'alias' => 'nullable|string|max:100',
            'curp' => 'nullable|string|size:18',
            'rfc' => 'required|string|max:13',
            'dia' => 'required|date',
            'genero' => 'required_if:persona,fisica|nullable|string|max:50',
            'paisnac' => 'nullable|string|max:100',
            'nacionalidad' => 'nullable|string|max:100',
            'estado_nac' => 'nullable|string|max:100',
            'ciudad_nac' => 'nullable|string|max:100',
            'municipio_nac' => 'nullable|string|max:100',
            'ocupacion' => 'nullable|string|max:100',
            'edo_civil' => 'nullable|string|max:100',
            'conyuge' => 'nullable|string|max:100',

            // Datos del cónyuge
            'nombre_conyuge' => 'nullable|string|max:50',
            'apellido_paterno_conyuge' => 'nullable|string|max:50',
            'apellido_materno_conyuge' => 'nullable|string|max:50',
            'doc_identificacion' => 'nullable|string|max:100',
            'num_doc_identificacion' => 'nullable|integer',
            'autoridad_emisora' => 'nullable|string|max:100',

            // Domicilio particular
            'calle' => 'nullable|string|max:100',
            'no_exterior' => 'nullable|string|max:100',
            'no_interior' => 'nullable|string|max:100',
            'manzana' => 'nullable|string|max:100',
            'lote' => 'nullable|string|max:100',
            'cp' => 'nullable|integer',
            'colonia' => 'nullable|string|max:100',
            'municipio' => 'nullable|string|max:100',
            'estado' => 'nullable|string|max:100',
            'ciudad' => 'nullable|string|max:100',
            'pais' => 'nullable|string|max:100',

            // Domicilio fiscal
            'calle_fiscal' => 'nullable|string|max:100',
            'no_exterior_fiscal' => 'nullable|string|max:100',
            'no_interior_fiscal' => 'nullable|string|max:100',
            'manzana_fiscal' => 'nullable|string|max:100',
            'lote_fiscal' => 'nullable|string|max:100',
            'cp_fiscal' => 'nullable|integer',
            'colonia_fiscal' => 'nullable|string|max:100',
            'municipio_fiscal' => 'nullable|string|max:100',
            'estado_fiscal' => 'nullable|string|max:100',
            'ciudad_fiscal' => 'nullable|string|max:100',
            'pais_fiscal' => 'nullable|string|max:100',

            // Contacto
            'telefono' => 'nullable|string|max:50',
            'telefonos' => 'nullable|string|max:100',
            'telefono_oficina' => 'nullable|string|max:20',
            'telefono_movil' => 'nullable|string|max:20',
            'correo' => 'nullable|email|max:150',
            'gmail2' => 'nullable|email|max:225',

            // Identificación
            'documento' => 'nullable|string|max:100',
            'no_identificacion' => 'nullable|string|max:100',
            'vigiencia_de_ine' => 'nullable|date',
            'autoridad_emisora_usuario' => 'nullable|string|max:225',

            // Información adicional
            'regimen_fiscal' => 'nullable|string|max:225',
            'servicios_medicos' => 'nullable|string|max:225',
            'id_y_cartainmigracion' => 'nullable|string|max:225',
            'observaciones_adicionales' => 'nullable|string|max:500',

            // Datos del testador
            'sabe_escribir' => 'nullable|string|max:10',
            'sabe_leer' => 'nullable|string|max:10',
            'padre_nombre' => 'nullable|string|max:255',
            'padre_vive' => 'nullable|string|max:10',
            'madre_nombre' => 'nullable|string|max:255',
            'madre_vive' => 'nullable|string|max:10',
            'hijos' => 'nullable|string|max:200',
            'herederos' => 'nullable|string|max:200',
            'herederos_sustitutos' => 'nullable|string',
            'albacea' => 'nullable|string|max:45',
            'albacea_sustituto' => 'nullable|string|max:255',
            'tutor_tutriz' => 'nullable|string|max:255',
            'tutor_sustituto' => 'nullable|string|max:255',
            'observaciones' => 'nullable|string|max:45',
        ]);

        // Agregar metadata automática
        $validated['dia_registro'] = now()->toDateString();
        $validated['notaria'] = Auth::user()->notaria_code ?? Auth::user()->notaria->legacy_identifier ?? '';
        $validated['envio_de_correo'] = false;

        // Valores por defecto
        $validated['alias'] = $validated['alias'] ?? '';
        $validated['pais'] = $validated['pais'] ?? 'MEXICO';
        $validated['pais_fiscal'] = $validated['pais_fiscal'] ?? 'MEXICO';
        $validated['paisnac'] = $validated['paisnac'] ?? 'MEXICO';
        $validated['nacionalidad'] = $validated['nacionalidad'] ?? 'MEXICANA';

        // Guardar en BD NUEVA (registro_web)
        $registro = RegistroPersona::create($validated);

        return response()->json([
            'success' => true,
            'message' => "Registro #{$registro->id} creado correctamente",
            'data' => $registro,
        ]);
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
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $registro = RegistroPersona::findOrFail($id);

        $validated = $request->validate([
            // Same validation rules as store
            'persona' => 'required|in:fisica,moral',
            'nombre' => 'required|string|max:30',
            // ... (same fields as store)
        ]);

        $registro->update($validated);

        return response()->json([
            'success' => true,
            'message' => "Registro #{$registro->id} actualizado correctamente",
            'data' => $registro,
        ]);
    }

    /**
     * Eliminar registro (soft delete, solo registros nuevos)
     */
    public function destroy(int $id): JsonResponse
    {
        $registro = RegistroPersona::findOrFail($id);
        $registro->delete();

        return response()->json([
            'success' => true,
            'message' => "Registro #{$id} eliminado correctamente",
        ]);
    }

    /**
     * Buscar por CURP (busca en AMBAS tablas)
     */
    public function searchCurp(Request $request): JsonResponse
    {
        $curp = strtoupper($request->query('curp', ''));

        if (empty($curp)) {
            return response()->json([
                'found' => false,
                'message' => 'CURP no proporcionado',
            ], 400);
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
        ]);
    }

    /**
     * Buscar por RFC (busca en AMBAS tablas)
     */
    public function searchRfc(Request $request): JsonResponse
    {
        $rfc = strtoupper($request->query('rfc', ''));

        if (empty($rfc)) {
            return response()->json([
                'found' => false,
                'message' => 'RFC no proporcionado',
            ], 400);
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
        ]);
    }
}
