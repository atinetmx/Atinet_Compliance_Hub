# 📊 Propuesta Arquitectónica - Historial de Búsquedas Fase 3
## Multi-Tenant Global Scope

**Fecha:** 13 de Febrero, 2026  
**Versión:** 1.0 (Propuesta)  
**Status:** 📋 Para Aprobación

---

## 🎯 Visión General

Implementar un **historial de búsquedas global y escalable** que:

✅ **Mantiene contexto multi-tenant** (scope: por notaría y por usuario)  
✅ **Reutiliza infraestructura existente** (modelo `Busqueda` ya existe)  
✅ **Se integra sin cambios disruptivos** (aprovecha controllers existentes)  
✅ **Escala para múltiples notarías** (a diferencia del legacy que era local)  
✅ **Permite análisis global y por notaría** (reportes duales)  

---

## 🏗️ Arquitectura Propuesta

### Nivel 1: Base de Datos (YA EXISTE ✅)

#### Tabla: `busquedas` (Actual)
```sql
CREATE TABLE busquedas (
    id BIGINT PRIMARY KEY,
    notaria_id BIGINT NOT NULL FK,              -- Multi-tenant
    user_id BIGINT NOT NULL FK,                 -- Usuario específico
    tipo_busqueda VARCHAR(50),                  -- 'Persona Física', 'RFC', etc.
    termino_busqueda VARCHAR(255),              -- Lo que buscó
    resultados JSON,                            -- Array de resultados
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    -- Índices recomendados
    INDEX(notaria_id),
    INDEX(user_id),
    INDEX(created_at),
    UNIQUE(notaria_id, user_id, termino_busqueda, created_at) -- Para deduplicar
);
```

#### Por qué esta estructura:
- ✅ `notaria_id` → Scope multi-tenant (cada notaría ve sus búsquedas)
- ✅ `user_id` → Rastrear quién buscó (auditoría)
- ✅ `tipo_busqueda` → Filtrar por tipo
- ✅ `resultados` → JSON permite flexibilidad para OFAC/SAT
- ✅ Timestamps → Historial con fecha/hora

---

### Nivel 2: Modelos (YA EXISTEN ✅)

#### `Busqueda.php` (Existente - MEJORAR)
```php
<?php
namespace App\Models;

class Busqueda extends Model
{
    use BelongsToNotaria, HasFactory;

    protected $fillable = [
        'notaria_id',
        'user_id',
        'tipo_busqueda',
        'termino_busqueda',
        'resultados',
    ];

    protected $casts = [
        'resultados' => 'array',
    ];

    // RELACIONES EXISTENTES
    public function notaria(): BelongsTo
    {
        return $this->belongsTo(Notaria::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // NUEVOS SCOPES/MÉTODOS
    public function scopeRecientes($query, $dias = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($dias));
    }

    public function scopeDelUsuario($query, $usuario_id)
    {
        return $query->where('user_id', $usuario_id);
    }

    public function scopeDelaTipo($query, $tipo)
    {
        return $query->where('tipo_busqueda', $tipo);
    }

    public function scopeDeLaNotaria($query, $notaria_id)
    {
        return $query->where('notaria_id', $notaria_id);
    }

    public function tieneResultados(): bool
    {
        return !empty($this->resultados);
    }

    public function cantidadResultados(): int
    {
        return count($this->resultados ?? []);
    }
}
```

#### `User.php` (Existente - YA TIENE)
```php
public function busquedas(): HasMany
{
    return $this->hasMany(Busqueda::class);
}
```

#### `Notaria.php` (Existente - YA TIENE)
```php
public function busquedas(): HasMany
{
    return $this->hasMany(Busqueda::class);
}
```

---

### Nivel 3: Backend - Integración en Controller Existente

#### Opción A: En `SuperAdminSearchController.php` (RECOMENDADO)

Después de cada búsqueda exitosa, guardar en historial:

```php
<?php
namespace App\Http\Controllers\SuperAdmin;

class SuperAdminSearchController extends Controller
{
    public function searchPersonaFisica(Request $request)
    {
        // ... búsqueda actual ...
        
        $resultadosOfac = OfacNombres::searchPersonaFisica($nombre);
        $resultadosSat = Sat69B::searchNombre($nombre);
        
        // NUEVO: Guardar en historial
        $this->saveSearchHistory(
            tipo: 'Persona Física',
            termino: $nombre,
            resultados: [
                'ofac' => $resultadosOfac,
                'sat' => $resultadosSat,
            ]
        );
        
        return response()->json($response);
    }

    public function searchPersonaMoral(Request $request)
    {
        // ... búsqueda actual ...
        
        // NUEVO: Guardar en historial
        $this->saveSearchHistory(
            tipo: 'Persona Moral',
            termino: $denominacion,
            resultados: [...]
        );
        
        return response()->json($response);
    }

    public function searchRfc(Request $request)
    {
        // ... búsqueda actual ...
        
        // NUEVO: Guardar en historial
        $this->saveSearchHistory(
            tipo: 'RFC',
            termino: $rfc,
            resultados: [...]
        );
        
        return response()->json($response);
    }

    public function searchCombined(Request $request)
    {
        // ... búsqueda actual ...
        
        // NUEVO: Guardar en historial
        $this->saveSearchHistory(
            tipo: 'Combinada',
            termino: "{$nombre} + {$rfc}",
            resultados: [...]
        );
        
        return response()->json($response);
    }

    /**
     * NUEVO MÉTODO: Guardar búsqueda en historial
     */
    private function saveSearchHistory(
        string $tipo,
        string $termino,
        array $resultados,
        ?array $metadata = null
    ): void {
        try {
            $user = Auth::user();
            $notaria = $user->notaria;

            if (!$notaria) {
                return; // No guardar si no hay notaría
            }

            Busqueda::create([
                'notaria_id' => $notaria->id,
                'user_id' => $user->id,
                'tipo_busqueda' => $tipo,
                'termino_busqueda' => $termino,
                'resultados' => [
                    'data' => $resultados,
                    'total' => count($resultados['ofac'] ?? []) + count($resultados['sat'] ?? []),
                    'metadata' => $metadata,
                ],
            ]);

            Log::info('Búsqueda guardada en historial', [
                'user_id' => $user->id,
                'notaria_id' => $notaria->id,
                'tipo' => $tipo,
                'termino' => $termino,
            ]);
        } catch (\Exception $e) {
            Log::error('Error guardando búsqueda en historial', [
                'error' => $e->getMessage(),
            ]);
            // No fallar la búsqueda si el historial falla
        }
    }
}
```

#### Ventajas:
- ✅ Integración limpia en métodos existentes
- ✅ Usa infraestructura ya establecida
- ✅ No cambia rutas ni APIs
- ✅ Sin breaking changes

---

### Nivel 4: Backend - Nuevos Endpoints para Historial

#### Crear `SearchHistoryController` (NUEVO)

```php
<?php
namespace App\Http\Controllers\SuperAdmin;

use App\Models\Busqueda;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SearchHistoryController extends Controller
{
    /**
     * GET /admin/search-history
     * Listar búsquedas recientes del usuario
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $notaria = $user->notaria;

        $query = Busqueda::where('notaria_id', $notaria->id);

        // Filtros opcionales
        if ($request->has('tipo_busqueda')) {
            $query->where('tipo_busqueda', $request->tipo_busqueda);
        }

        if ($request->has('dias')) {
            $query->recientes($request->dias);
        }

        if ($request->has('usuario_id')) {
            $query->where('user_id', $request->usuario_id);
        }

        if ($request->has('termino')) {
            $query->where('termino_busqueda', 'like', '%' . $request->termino . '%');
        }

        $busquedas = $query
            ->with(['user', 'notaria'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $busquedas,
        ]);
    }

    /**
     * GET /admin/search-history/{id}
     * Obtener detalles de una búsqueda específica
     */
    public function show($id)
    {
        $busqueda = Busqueda::findOrFail($id);
        $user = Auth::user();

        // Verificar que pertenece a su notaría o es super_admin
        if ($busqueda->notaria_id !== $user->notaria_id && !$user->isSuperAdmin()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $busqueda,
        ]);
    }

    /**
     * DELETE /admin/search-history/{id}
     * Eliminar una búsqueda del historial
     */
    public function destroy($id)
    {
        $busqueda = Busqueda::findOrFail($id);
        $user = Auth::user();

        // Solo el autor o super_admin puede eliminar
        if ($busqueda->user_id !== $user->id && !$user->isSuperAdmin()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $busqueda->delete();

        return response()->json([
            'success' => true,
            'message' => 'Búsqueda eliminada del historial',
        ]);
    }

    /**
     * POST /admin/search-history/clear
     * Limpiar historial completo de la notaría (admin only)
     */
    public function clearNotaría(Request $request)
    {
        $user = Auth::user();
        $notaria = $user->notaria;

        // Solo admins de la notaría
        if (!in_array($user->tipo_cuenta, ['super_admin', 'admin_notaria'])) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $cantidad = Busqueda::where('notaria_id', $notaria->id)->delete();

        return response()->json([
            'success' => true,
            'message' => "Se eliminaron $cantidad búsquedas del historial",
        ]);
    }

    /**
     * GET /admin/search-history/stats
     * Estadísticas del historial
     */
    public function stats()
    {
        $user = Auth::user();
        $notaria = $user->notaria;

        $stats = [
            'total_busquedas' => Busqueda::where('notaria_id', $notaria->id)->count(),
            'busquedas_hoy' => Busqueda::where('notaria_id', $notaria->id)->whereDate('created_at', today())->count(),
            'busquedas_semana' => Busqueda::where('notaria_id', $notaria->id)->recientes(7)->count(),
            'busquedas_mes' => Busqueda::where('notaria_id', $notaria->id)->recientes(30)->count(),
            'por_tipo' => Busqueda::where('notaria_id', $notaria->id)
                ->groupBy('tipo_busqueda')
                ->selectRaw('tipo_busqueda, count(*) as total')
                ->get(),
            'por_usuario' => Busqueda::where('notaria_id', $notaria->id)
                ->with('user:id,name,email')
                ->groupBy('user_id')
                ->selectRaw('user_id, count(*) as total')
                ->get(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }
}
```

#### Rutas (Agregar a `routes/web.php`)
```php
Route::prefix('admin')->middleware(['auth', 'subscription'])->group(function () {
    // Historial de búsquedas
    Route::get('search-history', [\App\Http\Controllers\SuperAdmin\SearchHistoryController::class, 'index'])
        ->name('search-history.index');
    Route::get('search-history/{id}', [\App\Http\Controllers\SuperAdmin\SearchHistoryController::class, 'show'])
        ->name('search-history.show');
    Route::delete('search-history/{id}', [\App\Http\Controllers\SuperAdmin\SearchHistoryController::class, 'destroy'])
        ->name('search-history.destroy');
    Route::post('search-history/clear', [\App\Http\Controllers\SuperAdmin\SearchHistoryController::class, 'clearNotaría'])
        ->name('search-history.clear');
    Route::get('search-history/stats', [\App\Http\Controllers\SuperAdmin\SearchHistoryController::class, 'stats'])
        ->name('search-history.stats');
});
```

---

### Nivel 5: Frontend - React Component

#### Crear: `SearchHistorySidebar.tsx` (NUEVO)

```typescript
import { useState, useEffect } from 'react';
import { Clock, Trash2, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface SearchHistoryItem {
    id: number;
    tipo_busqueda: string;
    termino_busqueda: string;
    resultados_count: number;
    created_at: string;
    user: { name: string };
}

export function SearchHistorySidebar({ onSelectSearch }) {
    const [history, setHistory] = useState<SearchHistoryItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const response = await fetch('/admin/search-history');
            const data = await response.json();
            if (data.success) {
                setHistory(data.data.data); // Paginated response
            }
        } catch (error) {
            console.error('Error loading history', error);
        } finally {
            setLoading(false);
        }
    };

    const removeFromHistory = async (id: number) => {
        try {
            await fetch(`/admin/search-history/${id}`, { method: 'DELETE' });
            setHistory(history.filter(h => h.id !== id));
        } catch (error) {
            console.error('Error removing from history', error);
        }
    };

    const clearHistory = async () => {
        if (confirm('¿Eliminar todo el historial?')) {
            try {
                await fetch('/admin/search-history/clear', { method: 'POST' });
                setHistory([]);
            } catch (error) {
                console.error('Error clearing history', error);
            }
        }
    };

    return (
        <Card className="p-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Búsquedas Recientes
                </h3>
                {history.length > 0 && (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={clearHistory}
                        className="text-xs"
                    >
                        Limpiar
                    </Button>
                )}
            </div>

            {loading && <p className="text-sm text-gray-500">Cargando...</p>}

            {!loading && history.length === 0 && (
                <p className="text-sm text-gray-500">Sin búsquedas recientes</p>
            )}

            <div className="space-y-2">
                {history.map((item) => (
                    <div
                        key={item.id}
                        className="p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer text-sm"
                    >
                        <div
                            onClick={() => onSelectSearch(item)}
                            className="flex justify-between items-start gap-2"
                        >
                            <div className="flex-1">
                                <p className="font-medium text-xs text-gray-600">
                                    {item.tipo_busqueda}
                                </p>
                                <p className="text-gray-800 truncate">
                                    {item.termino_busqueda}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {item.resultados_count} resultados
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-1">
                            <button
                                onClick={() => removeFromHistory(item.id)}
                                className="text-gray-400 hover:text-red-500 text-xs"
                            >
                                <X className="w-3 h-3" />
                            </button>
                            <span className="text-gray-400 text-xs">
                                {new Date(item.created_at).toLocaleString()}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}
```

#### Integrar en `Search.tsx`
```typescript
import { SearchHistorySidebar } from './SearchHistorySidebar';

export default function ListasNegrasSearch() {
    const handleSelectFromHistory = (search: SearchHistoryItem) => {
        // Reutilizar búsqueda anterior
        // Ejemplo: si era Persona Física
        setPersonaFisicaForm({ nombre: search.termino_busqueda });
        setActiveTab('persona-fisica');
        // Ejecutar búsqueda
        handlePersonaFisicaSearch();
    };

    return (
        <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
                {/* Búsqueda actual */}
            </div>
            <div className="col-span-1">
                <SearchHistorySidebar onSelectSearch={handleSelectFromHistory} />
            </div>
        </div>
    );
}
```

---

## 📊 Comparación: Legacy vs. Nuevo

| Aspecto | Legacy | Propuesta Nueva |
|--------|--------|-----------------|
| **Scope** | Solo 1 notaría | Multi-notaría (global) |
| **Visibilidad** | Local | Global + Local |
| **Usuarios** | Solo super_admin | Todos los usuarios |
| **Datos históricos** | Solo del mes | Todos (con filtros) |
| **Reutilización** | Manual | Click → buscar de nuevo |
| **Escalabilidad** | Limitada | Escalable |
| **Reportes** | Simples | Complejos (por user/tipo) |

---

## 🎯 Ventajas de Esta Propuesta

✅ **Reutiliza infraestructura existente**
- Modelo: `Busqueda` ya existe
- Relationships: Ya configuradas
- Tabla: Ya migrada

✅ **Integración limpia**
- Cambios mínimos en controllers existentes
- Método `saveSearchHistory()` privado
- No afecta lógica actual de búsqueda

✅ **Multi-tenant desde inicio**
- `notaria_id` como primera dimensión
- Aislamiento de datos automático
- Permite análisis por notaría

✅ **Escalable**
- Índices en tabla existente
- Queries optimizadas (evita N+1)
- Paginación incluida

✅ **Flexible**
- JSON para diferentes tipos de búsqueda
- Scopes reutilizables
- Fácil agregar más filtros

---

## 🛠️ Implementación Recomendada

### Fase 3.1 - Backend (Día 1)

1. ✅ Mejorar modelo `Busqueda` (agregar métodos)
2. ✅ Agregar método `saveSearchHistory()` en controller
3. ✅ Modificar cada `search*()` para guardar
4. ✅ Crear `SearchHistoryController`
5. ✅ Agregar rutas en `routes/web.php`
6. ✅ Testing de endpoints

### Fase 3.2 - Frontend (Día 2)

7. ✅ Crear `SearchHistorySidebar.tsx` component
8. ✅ Integrar en `Search.tsx`
9. ✅ Eventos de click para reutilizar búsquedas
10. ✅ Testing de UI
11. ✅ Compilar con `npm run build`

### Fase 3.3 - Testing & Deploy (Día 3)

12. ✅ Tests unitarios backend
13. ✅ Tests E2E
14. ✅ Performance testing (queries)
15. ✅ Deploy a producción

---

## 📈 Próximas Expansiones

Después de Historial, estos pueden reutilizar esta infraestructura:

- **Excel Export:** Query `Busqueda` y exportar
- **Dashboard Stats:** Agregar sobre `Busqueda` (GROUP BY tipo, user, etc.)
- **Alertas:** Monitorear cambios en `Busqueda`
- **Cache:** Cachear basado en `termino_busqueda` exacto

---

## ✅ Checklist de Implementación

- [ ] Actualizar modelo `Busqueda.php` con scopes
- [ ] Crear método `saveSearchHistory()` en controller
- [ ] Modificar `searchPersonaFisica()` para guardar
- [ ] Modificar `searchPersonaMoral()` para guardar
- [ ] Modificar `searchRfc()` para guardar
- [ ] Modificar `searchCombined()` para guardar
- [ ] Crear `SearchHistoryController`
- [ ] Agregar rutas en `routes/web.php`
- [ ] Crear tests backend
- [ ] Crear `SearchHistorySidebar.tsx` component
- [ ] Integrar en `Search.tsx`
- [ ] Compilar frontend
- [ ] Tests end-to-end
- [ ] Deploy

---

**Propuesta Preparada:** 13 de Febrero, 2026  
**Status:** 📋 Lista para Aprobación y Ejecución

¿Aprobado para proceder con implementación? 🚀
