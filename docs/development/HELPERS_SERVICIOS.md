# Helpers Globales de Servicios

Este documento describe las funciones helper disponibles para facilitar el trabajo con el sistema de servicios y suscripciones.

## Ubicación

Las funciones helper están definidas en: [`bootstrap/helpers.php`](bootstrap/helpers.php)

## Funciones Disponibles

### `can_use_service(string $serviceCode, ?Notaria $notaria = null): bool`

Verifica si el usuario autenticado actual puede usar un servicio específico.

**Parámetros:**
- `$serviceCode`: Código del servicio (ej: 'sat-consulta', 'curp-validacion')
- `$notaria`: (Opcional) Notaría específica. Si no se proporciona, usa la notaría del usuario autenticado

**Retorna:** `true` si el usuario puede acceder al servicio, `false` en caso contrario

**Ejemplo:**
```php
use App\Services\ServiceAccessManager;

if (app(ServiceAccessManager::class)->canAccess(auth()->user()->notaria, 'sat-consulta')) {
    // El usuario puede usar el servicio SAT
    // Proceder con la consulta
}
```

**Nota:** Requiere que el usuario esté autenticado y tenga una notaría asignada.

---

### `has_service_limit(string $serviceCode, ?Notaria $notaria = null): bool`

Verifica si el usuario ha alcanzado el límite de uso mensual de un servicio.

**Parámetros:**
- `$serviceCode`: Código del servicio
- `$notaria`: (Opcional) Notaría específica

**Retorna:** `true` si ha alcanzado el límite, `false` si aún tiene uso disponible

**Ejemplo:**
```php
use App\Services\ServiceAccessManager;

if (app(ServiceAccessManager::class)->hasReachedLimit(auth()->user()->notaria, 'sat-consulta')) {
    return response()->json([
        'error' => 'Has alcanzado el límite mensual de consultas SAT'
    ], 429);
}
```

---

### `record_service_usage(string $serviceCode, int $quantity = 1, array $metadata = [], ?float $cost = null, bool $billable = true): ?ServiceUsage`

Registra el uso de un servicio por el usuario autenticado.

**Parámetros:**
- `$serviceCode`: Código del servicio usado
- `$quantity`: Cantidad consumida (default: 1)
- `$metadata`: Array con metadata adicional del uso (opcional)
- `$cost`: Costo del uso (opcional, se calcula automáticamente si no se especifica)
- `$billable`: Si el uso debe ser cobrado (default: true)

**Retorna:** Objeto `ServiceUsage` creado, o `null` si  falla

**Ejemplo:**
```php
use App\Models\ServiceUsage;

// Registrar una consulta SAT con metadata
$usage = ServiceUsage::create([
    'notaria_id' => auth()->user()->notaria_id,
    'service_id' => $service->id,
    'user_id' => auth()->id(),
    'consumed_at' => now(),
    'quantity' => 1,
    'cost' => $service->unit_price,
    'billable' => true,
    'metadata' => [
        'rfc' => 'RFC123456789',
        'consulta_tipo' => 'verificacion_fiscal'
    ]
]);
```

**Nota:** El costo se calcula automáticamente como `unit_price * quantity` si no se especifica.

---

### `get_service_stats(string $serviceCode, ?Notaria $notaria = null): array`

Obtiene estadísticas de uso de un servicio para el mes actual.

**Parámetros:**
- `$serviceCode`: Código del servicio
- `$notaria`: (Opcional) Notaría específica

**Retorna:** Array con las estadísticas:
```php
[
    'service_code' => 'sat-consulta',
    'current_usage' => 45,     // Uso del mes actual
    'usage_limit' => 100,      // Límite mensual (null si es ilimitado)
    'remaining' => 55,         // Uso restante (null si es ilimitado)
    'percentage' => 45.0       // Porcentaje usado
]
```

**Ejemplo:**
```php
use App\Services\ServiceAccessManager;

$stats = app(ServiceAccessManager::class)->getUsageStats(auth()->user()->notaria, 'sat-consulta');

return view('dashboard.services', [
    'usage_stats' => $stats
]);
```

**Nota:** Devuelve array vacío si el usuario no está autenticado o no tiene notaría.

---

### `get_remaining_service_usage(string $serviceCode, ?Notaria $notaria = null): ?int`

Obtiene la cantidad restante de uso disponible para un servicio en el mes actual.

**Parámetros:**
- `$serviceCode`: Código del servicio
- `$notaria`: (Opcional) Notaría específica

**Retorna:** 
- `int`: Cantidad restante de uso
- `null`: Si el servicio es ilimitado
- `0`: Si el usuario no está autenticado o no tiene acceso

**Ejemplo:**
```php
use App\Services\ServiceAccessManager;

$remaining = app(ServiceAccessManager::class)->getRemainingUsage(
    auth()->user()->notaria, 
    'sat-consulta'
);

if ($remaining !== null && $remaining < 10) {
    // Advertir al usuario que se está quedando sin consultas
    session()->flash('warning', "Solo te quedan {$remaining} consultas SAT este mes");
}
```

---

## Uso del ServiceAccessManager

Todas estas funciones helper utilizan internamente el servicio `ServiceAccessManager`. Puedes usar este servicio directamente para mayor control:

```php
use App\Services\ServiceAccessManager;

class SATController extends Controller
{
    public function __construct(
        private ServiceAccessManager $accessManager
    ) {}
    
    public function consultarRFC(Request $request)
    {
        $notaria = auth()->user()->notaria;
        $serviceCode = 'sat-consulta';
        
        // Verificar acceso
        if (! $this->accessManager->canAccess($notaria, $serviceCode)) {
            abort(403, 'No tienes acceso a este servicio');
        }
        
        // Verificar límites
        if ($this->accessManager->hasReachedLimit($notaria, $serviceCode)) {
            abort(429, 'Has alcanzado el límite mensual');
        }
        
        // Realizar la consulta...
        $resultado = $this->consultarSAT($request->rfc);
        
        // Registrar uso (usando ServiceUsageRecorder)
        app(ServiceUsageRecorder::class)->record(
            notaria: $notaria,
            service: $serviceCode,
            metadata: ['rfc' => $request->rfc]
        );
        
        return response()->json($resultado);
    }
}
```

## ServiceUsageRecorder

Para un control más avanzado del registro de uso, utiliza directamente `ServiceUsageRecorder`:

```php
use App\Services\ServiceUsageRecorder;

$recorder = app(ServiceUsageRecorder::class);

// Registrar uso simple
$usage = $recorder->record(
    notaria: $notaria,
    service: 'sat-consulta',
    quantity: 1,
    metadata: ['rfc' => 'RFC123456789']
);

// Registrar múltiples usos en batch
$recorder->recordBatch(
    notaria: $notaria,
    usages: [
        'sat-consulta' => 5,
        'curp-validacion' => [
            'quantity' => 3,
            'metadata' => ['source' => 'importacion_masiva'],
            'billable' => false
        ]
    ]
);

// Obtener uso del mes actual
$monthlyUsage = $recorder->getCurrentMonthUsage($notaria, 'sat-consulta');

// Obtener costo del mes actual
$monthlyCost = $recorder->getCurrentMonthCost($notaria, 'sat-consulta');

// Marcar registros como facturados
$recorder->markAsBilled([1, 2, 3, 4, 5]);

// Obtener registros pendientes de facturación
$pending = $recorder->getPendingBilling($notaria);
```

## Recomendaciones de Uso

1. **Verificación de acceso**: Siempre verifica el acceso ANTES de ejecutar operaciones costosas
2. **Registro de uso**: Registra el uso DESPUÉS de ejecutar la operación exitosamente
3. **Metadata útil**: Incluye información relevante en metadata para auditoría y debugging
4. **Manejo de límites**: Proporciona feedback claro al usuario cuando se acerque a los límites
5. **Cache**: El `ServiceAccessManager` utiliza cache de 5 minutos para optimizar performance

## Middleware de Protección

Para proteger rutas automáticamente, usa el middleware `CheckServiceAccess`:

```php
// En routes/web.php o controladores
Route::middleware(['auth', 'service:sat-consulta'])->group(function () {
    Route::get('/sat/consultar', [SATController::class, 'index']);
    Route::post('/sat/consultar', [SATController::class, 'consultar']);
});
```

El middleware manejará automáticamente:
- Verificación de autenticación (401)
- Verificación de acceso al servicio (403) 
- Verificación de límites (429)

Ver documentación completa del middleware en los tests: [`tests/Feature/Http/Middleware/CheckServiceAccessTest.php`](tests/Feature/Http/Middleware/CheckServiceAccessTest.php)

## Tests

Los helpers y servicios están completamente testeados:

- **ServiceAccessManager**: 14 tests → [`tests/Feature/Services/ServiceAccessManagerTest.php`](tests/Feature/Services/ServiceAccessManagerTest.php)
- **CheckServiceAccess Middleware**: 11 tests → [`tests/Feature/Http/Middleware/CheckServiceAccessTest.php`](tests/Feature/Http/Middleware/CheckServiceAccessTest.php)
- **ServiceUsageRecorder**: 23 tests → [`tests/Feature/Services/ServiceUsageRecorderTest.php`](tests/Feature/Services/ServiceUsageRecorderTest.php)

Total: **126 tests passing** ✅

## Nota sobre Autoload

ℹ️ **Importante**: Las funciones helper aún no están disponibles globalmente via autoload de Composer. Para usar estas funciones, utiliza directamente las clases `Service AccessManager` y `ServiceUsageRecorder` como se muestra en los ejemplos anteriores.

Si necesitas las funciones helper, puedes incluir manualmente el archivo:
```php
require_once base_path('bootstrap/helpers.php');
```

O inyectar los servicios en tu controlador/servicio:
```php
public function __construct(
    private ServiceAccessManager $accessManager,
    private ServiceUsageRecorder $usageRecorder
) {}
```
