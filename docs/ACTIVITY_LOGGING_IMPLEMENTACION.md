# Activity Logging - Implementación Completada

## 📋 Resumen de Implementación

Se ha implementado exitosamente el sistema de logging de actividades utilizando **Spatie Laravel Activity Log v4.12.3** para registrar todas las acciones realizadas en el sistema, comenzando con el módulo de Agenda.

## ✅ Componentes Implementados

### 1. Migraciones Ejecutadas

- ✅ `2026_03_30_092331_create_activity_log_table.php`
- ✅ `2026_03_30_092411_add_batch_uuid_column_to_activity_log_table.php`
- ✅ `2026_03_30_092413_add_event_column_to_activity_log_table.php`

**Tabla creada:** `activity_log`

**Estructura:**
```sql
- id (bigint, autoincrement)
- log_name (varchar, nullable) -- Categoría: 'agenda', 'listas_negras', 'control_notarial', etc.
- description (text) -- Descripción legible de la acción
- subject_type (varchar, nullable) -- Tipo de modelo afectado (polymorphic)
- subject_id (bigint, nullable) -- ID del modelo afectado (polymorphic)
- causer_type (varchar, nullable) -- Tipo del usuario que realizó la acción (polymorphic)
- causer_id (bigint, nullable) -- ID del usuario que realizó la acción (polymorphic)
- properties (json, nullable) -- Datos antes/después, metadatos
- batch_uuid (uuid, nullable) -- Para agrupar múltiples actividades
- event (varchar, nullable) -- Tipo de evento: 'created', 'updated', 'deleted'
- created_at, updated_at (timestamps)
```

### 2. Configuración Publicada

- ✅ `config/activitylog.php` - Archivo de configuración del paquete

### 3. Modelo AgendaEvent Actualizado

**Cambios realizados:**
```php
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class AgendaEvent extends Model
{
    use LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['titulo', 'start_fecha', 'end_fecha', 'comentarios', 'tipo', 'color', 'all_day'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('agenda')
            ->setDescriptionForEvent(fn(string $eventName) => match($eventName) {
                'created' => "Creó evento de agenda: {$this->titulo}",
                'updated' => "Actualizó evento de agenda: {$this->titulo}",
                'deleted' => "Eliminó evento de agenda: {$this->titulo}",
                default => "Modificó evento de agenda: {$this->titulo}",
            });
    }
}
```

**Comportamiento:**
- ✅ **Logging automático** de create, update, delete
- ✅ **Solo registra campos modificados** (logOnlyDirty)
- ✅ **Descripciones personalizadas** según el tipo de evento
- ✅ **Categorización** bajo log_name = 'agenda'
- ✅ **Propiedades JSON** con before/after de los campos especificados

### 4. AgendaController Actualizado

**Método log() refactorizado:**
```php
use Spatie\Activitylog\Models\Activity;

public function log(Request $request): JsonResponse
{
    // 1. Consulta actividades de la nueva tabla activity_log
    $newActivities = Activity::query()
        ->where('log_name', 'agenda')
        ->whereDate('created_at', $fecha)
        // Filtros por notaría y usuario...
    
    // 2. Consulta datos legacy de atinet65_aplicativos.log
    $legacyLogs = DB::connection('aplicativos')->table('log')...
    
    // 3. Combina y ordena ambas fuentes
    $combinedLogs = $newLogs->merge($legacyLogs)
        ->sortByDesc('hora')
        ->take($limit);
    
    return response()->json($combinedLogs);
}
```

**Características:**
- ✅ Lee de **activity_log** (nuevo sistema)
- ✅ Lee de **atinet65_aplicativos.log** (sistema legacy)
- ✅ **Combina ambas fuentes** en una sola respuesta ordenada
- ✅ **Filtra por notaría** según el usuario
- ✅ **Filtra por usuario** si no es admin
- ✅ **Formato unificado** para el frontend

## 🧪 Pruebas Realizadas

### Test de Logging Automático (test_activity_log.php)

**Resultados:**
```
✅ LOG CREATE registrado correctamente
   - Descripción: Creó evento de agenda: Evento de prueba - Activity Log
   - Propiedades: {"attributes":{"titulo":"...","start_fecha":"...","end_fecha":"...","comentarios":"...","tipo":"general","color":"#3b82f6","all_day":false}}

✅ LOG UPDATE registrado correctamente
   - Descripción: Actualizó evento de agenda: Evento ACTUALIZADO - Activity Log
   - Propiedades: {"attributes":{"titulo":"...","comentarios":"..."},"old":{"titulo":"...","comentarios":"..."}}

✅ LOG DELETE registrado correctamente
   - Descripción: Eliminó evento de agenda: Evento ACTUALIZADO - Activity Log
   - Propiedades: {"old":{"titulo":"...","start_fecha":"...","end_fecha":"...","comentarios":"...","tipo":"general","color":"#3b82f6","all_day":false}}

Total de logs generados: 3
✅ Test completado exitosamente
```

## 🎯 Funcionalidad Actual

### Logging Automático Activo

Cuando un usuario:

1. **Crea un evento** → Se registra automáticamente en `activity_log`
   - log_name: 'agenda'
   - event: 'created'
   - description: "Creó evento de agenda: {titulo}"
   - properties: todos los atributos del evento
   - subject: referencia al AgendaEvent creado
   - causer: referencia al User autenticado (automático en peticiones HTTP)

2. **Actualiza un evento** → Se registra automáticamente
   - log_name: 'agenda'
   - event: 'updated'
   - description: "Actualizó evento de agenda: {titulo}"
   - properties: solo campos modificados (before/after)
   - subject: referencia al AgendaEvent actualizado
   - causer: referencia al User autenticado

3. **Elimina un evento** → Se registra automáticamente
   - log_name: 'agenda'
   - event: 'deleted'
   - description: "Eliminó evento de agenda: {titulo}"
   - properties: todos los atributos antes de eliminar
   - subject: referencia al AgendaEvent eliminado (soft-deleted ID)
   - causer: referencia al User autenticado

### Bitácora (Pestaña en Frontend)

- ✅ Muestra actividades del día seleccionado
- ✅ Combina datos nuevos (activity_log) + datos legacy (atinet65_aplicativos.log)
- ✅ Ordenados por hora descendente
- ✅ Formato: [Hora | Usuario | Acción]
- ✅ Filtrado por notaría del usuario
- ✅ Filtrado por usuario si no es admin

## 📝 Próximos Pasos

### Fase 1: Pruebas en Navegador (RECOMENDADO AHORA)

1. **Iniciar servidor de desarrollo:**
   ```bash
   php artisan serve
   # O si usa Sail:
   ./vendor/bin/sail up
   ```

2. **Compilar assets frontend:**
   ```bash
   npm run dev
   # O build para producción:
   npm run build
   ```

3. **Probar funcionalidad:**
   - Iniciar sesión en el sistema
   - Navegar a **Agenda**
   - **Crear** un evento nuevo
   - **Editar** un evento existente
   - **Eliminar** un evento
   - Ir a pestaña **Bitácora**
   - Seleccionar la fecha de hoy
   - Verificar que aparecen los logs de las acciones realizadas

### Fase 2: Extensión a Otros Módulos

#### Módulo: Listas Negras (Búsquedas OFAC/SAT)

**Modelo: app/Models/Busqueda.php**

```php
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Busqueda extends Model
{
    use LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['tipo', 'nombre_buscado', 'rfc', 'resultados', 'es_lista_negra'])
            ->logOnlyDirty()
            ->useLogName('listas_negras')
            ->setDescriptionForEvent(fn(string $eventName) => 
                "Realizó búsqueda {$this->tipo}: {$this->nombre_buscado}"
            );
    }
}
```

#### Módulo: Suscripciones

**Modelo: app/Models/Subscription.php**

```php
use Spatie\Activitylog\Traits\LogsActivity;

class Subscription extends Model
{
    use LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['status', 'plan_id', 'trial_ends_at', 'ends_at'])
            ->logOnlyDirty()
            ->useLogName('suscripciones')
            ->setDescriptionForEvent(fn(string $eventName) => match($eventName) {
                'created' => "Creó suscripción al plan {$this->plan?->nombre}",
                'updated' => "Actualizó suscripción (nuevo estado: {$this->status})",
                'deleted' => "Eliminó suscripción",
            });
    }
}
```

#### Módulo: Control Notarial (Cuando se migre de VB6)

Categorías sugeridas:
- `log_name = 'control_notarial_expedientes'`
- `log_name = 'control_notarial_presupuestos'`
- `log_name = 'control_notarial_clientes'`
- `log_name = 'control_notarial_usuarios'`

### Fase 3: Vista Unificada de Actividad (Opcional)

Crear una vista de administrador que muestre todas las actividades del sistema:

**Ruta:** `/admin/actividad` o `/admin/bitacora-general`

**Funcionalidad:**
- Muestra activity_log de todos los módulos
- Filtros por:
  - Fecha/rango de fechas
  - log_name (módulo)
  - causer_id (usuario)
  - notaría
  - tipo de evento (created/updated/deleted)
- Exportación a Excel/PDF
- Búsqueda por descripción

### Fase 4: Limpieza Automática (Opcional)

Configurar en `config/activitylog.php`:

```php
return [
    'delete_records_older_than_days' => 90, // Eliminar logs mayores a 90 días
    
    'clean_log_command' => [
        'enabled' => true,
        'older_than_days' => 90,
    ],
];
```

Programar en `routes/console.php`:

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('activitylog:clean')->weekly();
```

## 📚 Documentación de Referencia

- **Spatie Activity Log:** https://spatie.be/docs/laravel-activitylog/v4/introduction
- **Logging manual:** https://spatie.be/docs/laravel-activitylog/v4/advanced-usage/logging-model-events
- **Personalización:** https://spatie.be/docs/laravel-activitylog/v4/advanced-usage/customizing-the-log-model

## ⚠️ Notas Importantes

1. **Causer Automático:** En peticiones HTTP, el trait LogsActivity detecta automáticamente al usuario autenticado via `auth()->user()`. En scripts CLI (como test_activity_log.php), el causer será NULL a menos que se establezca manualmente.

2. **Propiedades Personalizadas:** Se pueden agregar propiedades adicionales manualmente:
   ```php
   activity()
       ->causedBy($user)
       ->performedOn($model)
       ->withProperties(['ip' => request()->ip(), 'user_agent' => request()->userAgent()])
       ->log('Acción personalizada');
   ```

3. **Rendimiento:** La tabla activity_log puede crecer rápidamente. Se recomienda:
   - Implementar limpieza programada
   - Agregar índices adicionales si hay consultas lentas
   - Considerar particionamiento por fecha en producción con alto tráfico

4. **Legacy Log:** El sistema mantiene compatibilidad con `atinet65_aplicativos.log` (solo lectura) para mostrar el historial completo en la bitácora.

## 🎉 Estado Actual

**IMPLEMENTACIÓN BASE COMPLETA ✅**

- ✅ Paquete instalado y configurado
- ✅ Migraciones ejecutadas
- ✅ Modelo AgendaEvent con logging automático
- ✅ Controlador actualizado para consultar activity_log
- ✅ Frontend funcionando (sin cambios necesarios)
- ✅ Tests de verificación pasados
- ✅ Código formateado con Pint

**LISTO PARA PRUEBAS EN NAVEGADOR** 🚀
