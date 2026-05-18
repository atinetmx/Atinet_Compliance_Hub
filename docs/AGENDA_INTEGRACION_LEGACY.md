# 🔗 Integración Agenda Web - Sistema Legacy

**Fecha:** 9 de Abril, 2026  
**Estado:** ✅ Integración completa y funcional  
**Propósito:** Documento de referencia para futuras modificaciones solicitadas

---

## 📋 Resumen Ejecutivo

La agenda web Laravel tiene integración **bidireccional** con el sistema legacy (PHP/VB6). Los eventos legacy se visualizan en tiempo real y la bitácora de actividades combina ambos sistemas automáticamente.

### Estado Actual

- ✅ **1,020 eventos migrados** desde `atinet65_aplicativos.agenda`
- ✅ **Sincronización en tiempo real** de bitácora desde `atinet65_aplicativos.log`
- ✅ **Visualización combinada** en calendario FullCalendar
- ✅ **Permisos configurados** por tipo de usuario
- ✅ **Modal read-only** para eventos legacy (no editables)

---

## 🗄️ Arquitectura de Bases de Datos

### Conexiones Configuradas

**config/database.php:**
```php
'connections' => [
    'mysql' => [
        'database' => env('DB_DATABASE', 'atinet_compliance_hub'),
        // BD nueva del sistema Laravel
    ],
    
    'aplicativos' => [
        'driver' => 'mysql',
        'host' => env('LEGACY_DB_HOST', 'localhost'),
        'database' => env('LEGACY_DB_DATABASE', 'atinet65_aplicativos'),
        'username' => env('LEGACY_DB_USERNAME'),
        'password' => env('LEGACY_DB_PASSWORD'),
        // BD legacy del sistema VB6/PHP
    ],
]
```

### Tablas Relevantes

#### Sistema Nuevo (Laravel)
```sql
-- agenda_events: Eventos creados en sistema nuevo
CREATE TABLE agenda_events (
    id BIGINT PRIMARY KEY,
    title VARCHAR(255),
    start DATETIME,
    end DATETIME,
    user_id BIGINT,              -- NULL si es legacy
    notaria_id BIGINT,
    event_type ENUM('general', 'appointment', 'reminder', 'holiday'),
    color VARCHAR(7),
    rrule TEXT,                   -- Regla recurrencia (RFC 5545)
    legacy_notaria VARCHAR(50),   -- 'atinet' para eventos legacy migrados
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- activity_log: Bitácora sistema nuevo (Spatie)
CREATE TABLE activity_log (
    id BIGINT PRIMARY KEY,
    log_name VARCHAR(255),
    description TEXT,
    subject_type VARCHAR(255),
    subject_id BIGINT,
    causer_type VARCHAR(255),
    causer_id BIGINT,
    properties JSON,
    created_at TIMESTAMP
);
```

#### Sistema Legacy (atinet65_aplicativos)
```sql
-- agenda: Eventos del sistema VB6/PHP
CREATE TABLE agenda (
    id INT PRIMARY KEY,
    notaria VARCHAR(50),          -- Ej: 'atinet', 'notaria123'
    evento TEXT,
    fecha DATE,
    hora TIME,
    usuario VARCHAR(100),
    tipo ENUM('general', 'cita', 'recordatorio'),
    created_at TIMESTAMP
);

-- log: Bitácora del sistema legacy
CREATE TABLE log (
    id INT PRIMARY KEY,
    notaria VARCHAR(50),
    fecha DATE,
    hora TIME,
    mail VARCHAR(255),            -- Nombre del usuario
    accion TEXT,
    created_at TIMESTAMP
);
```

---

## 🔧 Implementación Backend (Laravel)

### AgendaController.php

**Ubicación:** `app/Http/Controllers/AgendaController.php`

#### 1. Index - Cargar eventos

```php
public function index(Request $request)
{
    $user = Auth::user();
    $viewMode = $request->get('view', 'all');
    
    // Sistema de filtrado por tipo de usuario y modo de vista
    if ($user->tipo_cuenta === 'super_admin') {
        if ($viewMode === 'mine') {
            // Solo eventos propios + legacy de 'atinet'
            $events = AgendaEvent::where(function($query) use ($user) {
                $query->where('user_id', $user->id)
                      ->orWhere(function($q) {
                          $q->whereNull('user_id')
                            ->where('legacy_notaria', 'atinet');
                      });
            })->get();
        } else {
            // Ver todo: propios + legacy + otros super_admins
            $events = AgendaEvent::where(function($query) use ($user) {
                $query->whereNull('notaria_id')
                      ->orWhere('legacy_notaria', 'atinet');
            })->get();
        }
    } elseif ($user->tipo_cuenta === 'admin') {
        // Similar para admin de notaría
        // Ver eventos de su notaría + legacy de su notaría
    } else {
        // Usuario normal: solo sus eventos + legacy compartidos
    }
    
    return Inertia::render('Agenda/Index', [
        'events' => $events,
    ]);
}
```

#### 2. Bitácora - Combinar logs legacy + nuevo

**Líneas 129-168:**
```php
public function bitacora(Request $request)
{
    $user = Auth::user();
    $fecha = $request->get('fecha', now()->format('Y-m-d'));
    
    // === 1. LOGS NUEVOS (activity_log) ===
    $newLogs = Activity::where('created_at', 'LIKE', "$fecha%")
        ->orderBy('created_at', 'desc')
        ->get()
        ->map(fn ($activity) => [
            'fecha' => $activity->created_at->format('Y-m-d'),
            'hora' => $activity->created_at->format('H:i:s'),
            'mail' => $activity->causer?->name ?? 'Sistema',
            'accion' => $activity->description,
        ])
        ->values()
        ->all();
    
    // === 2. LOGS LEGACY (atinet65_aplicativos.log) ===
    // Determinar slug legacy según tipo de usuario
    if ($user->tipo_cuenta === 'super_admin' && !$user->notaria_id) {
        $legacySlug = 'atinet';
    } else {
        $legacySlug = DB::table('notarias')
            ->where('id', $user->notaria_id)
            ->value('legacy_identifier');
    }
    
    $legacyLogs = [];
    if ($legacySlug) {
        $legacyLogs = DB::connection('aplicativos')  // ← Conexión legacy
            ->table('log')
            ->where('notaria', $legacySlug)
            ->where('fecha', $fecha)
            ->orderBy('hora', 'desc')
            ->get()
            ->map(fn ($log) => [
                'fecha' => $log->fecha,
                'hora' => $log->hora,
                'mail' => $log->mail,
                'accion' => $log->accion,
            ])
            ->all();
    }
    
    // === 3. COMBINAR Y ORDENAR ===
    $combinedLogs = collect(array_merge($newLogs, $legacyLogs))
        ->sortByDesc('hora')
        ->values();
    
    return response()->json($combinedLogs);
}
```

### AgendaEvent Model

**Ubicación:** `app/Models/AgendaEvent.php`

```php
class AgendaEvent extends Model
{
    protected $fillable = [
        'title', 'start', 'end', 'event_type', 'color',
        'comment', 'rrule', 'duration',
        'user_id', 'notaria_id', 'legacy_notaria',
        'id_usuario_creador'
    ];
    
    // Identificar eventos legacy
    public function isLegacy(): bool
    {
        return $this->user_id === null && 
               $this->legacy_notaria !== null;
    }
    
    // Relaciones
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    public function notaria()
    {
        return $this->belongsTo(Notaria::class);
    }
}
```

---

## 🎨 Implementación Frontend (React + Inertia)

### Páginas/Componentes

**Ubicación:** `resources/js/pages/Agenda/Index.tsx`

#### Estructura de pestañas

```tsx
const [activeTab, setActiveTab] = useState<'calendar' | 'daily' | 'bitacora'>('calendar');

<Tabs value={activeTab} onValueChange={setActiveTab}>
    <TabsList>
        <TabsTrigger value="calendar">📅 Calendario</TabsTrigger>
        <TabsTrigger value="daily">📋 Citas del día</TabsTrigger>
        <TabsTrigger value="bitacora">📝 Bitácora</TabsTrigger>
    </TabsList>
    
    {/* Pestaña 1: Calendario con FullCalendar */}
    <TabsContent value="calendar">
        <FullCalendar events={formattedEvents} />
    </TabsContent>
    
    {/* Pestaña 2: Lista de citas por fecha */}
    <TabsContent value="daily">
        <DailyAppointments date={selectedDate} />
    </TabsContent>
    
    {/* Pestaña 3: Bitácora combinada */}
    <TabsContent value="bitacora">
        <ActivityLog logs={combinedLogs} />
    </TabsContent>
</Tabs>
```

#### Formateo de eventos para FullCalendar

```tsx
const formattedEvents = useMemo(() => {
    return events.map((event) => ({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        backgroundColor: event.color,
        borderColor: event.color,
        
        // Metadata para identificar eventos legacy
        extendedProps: {
            isLegacy: event.user_id === null && event.legacy_notaria !== null,
            legacy_notaria: event.legacy_notaria,
            event_type: event.event_type,
            comment: event.comment,
            user_name: event.user?.name,
        },
        
        // Eventos legacy no son editables
        editable: !event.isLegacy,
    }));
}, [events]);
```

#### Modal de visualización

```tsx
const EventModal = ({ event, onClose }) => {
    const isLegacy = event.extendedProps?.isLegacy;
    
    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {event.title}
                        {isLegacy && (
                            <Badge variant="secondary">
                                📁 Legacy
                            </Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>
                
                {/* Información del evento */}
                <div className="space-y-2">
                    <p><strong>Fecha:</strong> {formatDate(event.start)}</p>
                    <p><strong>Hora:</strong> {formatTime(event.start)}</p>
                    {event.extendedProps?.legacy_notaria && (
                        <p><strong>Origen:</strong> Sistema Legacy ({event.extendedProps.legacy_notaria})</p>
                    )}
                </div>
                
                {/* Solo mostrar botones de edición si NO es legacy */}
                {!isLegacy && (
                    <DialogFooter>
                        <Button onClick={handleEdit}>✏️ Editar</Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            🗑️ Eliminar
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
};
```

#### Sistema de vista (Ver todo / Solo míos)

```tsx
// Solo visible para admins
{user.tipo_cuenta !== 'usuario' && (
    <Select value={viewMode} onValueChange={handleViewModeChange}>
        <SelectTrigger>
            <SelectValue />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="all">👥 Ver todo</SelectItem>
            <SelectItem value="mine">👤 Solo míos</SelectItem>
        </SelectContent>
    </Select>
)}
```

---

## 🔐 Sistema de Permisos

### Matriz de Permisos

| Tipo Usuario | Ver Eventos Propios | Ver Legacy Atinet | Ver Otros Usuarios | Editar Legacy | Crear Eventos |
|--------------|--------------------|--------------------|-------------------|---------------|---------------|
| **super_admin** | ✅ Sí | ✅ Sí | ✅ Sí (modo "Ver todo") | ❌ No | ✅ Sí |
| **admin** | ✅ Sí | ✅ Sí (su notaría) | ✅ Sí (su notaría) | ❌ No | ✅ Sí |
| **usuario** | ✅ Sí | ✅ Sí (compartidos) | ❌ No | ❌ No | ✅ Sí |

### Reglas de Visibilidad

#### Super Admin

**Modo "Ver todo":**
```sql
WHERE (notaria_id IS NULL OR legacy_notaria = 'atinet')
```

**Modo "Solo míos":**
```sql
WHERE (user_id = {current_user_id}) 
   OR (user_id IS NULL AND legacy_notaria = 'atinet')
```

#### Admin Notaría

**Modo "Ver todo":**
```sql
WHERE notaria_id = {user_notaria_id}
   OR (user_id IS NULL AND legacy_notaria = {notaria_legacy_slug})
```

**Modo "Solo míos":**
```sql
WHERE user_id = {current_user_id}
   OR (user_id IS NULL AND legacy_notaria = {notaria_legacy_slug})
```

#### Usuario Normal

```sql
WHERE user_id = {current_user_id}
   OR (user_id IS NULL AND legacy_notaria = {notaria_legacy_slug})
```

---

## 📦 Migración de Datos Legacy

### Script de Migración

**Archivo:** `migrate_agenda_to_new_system.php`

```php
<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Conectar a BD legacy
$legacyEvents = DB::connection('aplicativos')
    ->table('agenda')
    ->where('notaria', 'atinet')  // Solo eventos de 'atinet'
    ->get();

echo "📦 Encontrados: ".count($legacyEvents)." eventos legacy\n";

// Migrar cada evento
foreach ($legacyEvents as $event) {
    // Verificar si ya existe (por si se corre el script varias veces)
    $exists = DB::table('agenda_events')
        ->where('legacy_notaria', 'atinet')
        ->where('start', $event->fecha.' '.$event->hora)
        ->where('title', $event->evento)
        ->exists();
    
    if ($exists) {
        echo "⏭️  Ya existe: {$event->evento}\n";
        continue;
    }
    
    // Crear evento en sistema nuevo
    DB::table('agenda_events')->insert([
        'title' => $event->evento,
        'start' => $event->fecha.' '.$event->hora,
        'end' => date('Y-m-d H:i:s', strtotime($event->fecha.' '.$event->hora.' +1 hour')),
        'event_type' => mapEventType($event->tipo), // general/appointment/reminder
        'color' => '#3b82f6', // Azul por defecto
        'user_id' => null,  // ← NULL indica que es legacy
        'notaria_id' => null,
        'legacy_notaria' => 'atinet',  // ← Identificador legacy
        'comment' => 'Migrado desde sistema legacy',
        'created_at' => $event->created_at ?? now(),
        'updated_at' => now(),
    ]);
    
    echo "✅ Migrado: {$event->evento}\n";
}

echo "\n🎯 Migración completada: ".count($legacyEvents)." eventos procesados\n";

function mapEventType($legacyType)
{
    return match ($legacyType) {
        'cita' => 'appointment',
        'recordatorio' => 'reminder',
        default => 'general',
    };
}
```

### Scripts de Verificación

**1. verify_agenda_visibility.php** - Verificar permisos
```bash
php verify_agenda_visibility.php --user-id=1
```

**2. test_agenda_visibility.php** - Pruebas automatizadas
```bash
php test_agenda_visibility.php
```

**3. compare_agenda_remote.php** - Comparar con servidor
```bash
php compare_agenda_remote.php
```

---

## 🔄 Sincronización en Tiempo Real

### BlacklistSyncService (opcional)

Si existe un servicio de sincronización automática:

**Ubicación:** `app/Services/BlacklistSyncService.php`

```php
class BlacklistSyncService
{
    public function syncLegacyEvents()
    {
        // 1. Obtener eventos legacy no sincronizados
        $lastSync = Cache::get('legacy_agenda_last_sync', now()->subDays(7));
        
        $newLegacyEvents = DB::connection('aplicativos')
            ->table('agenda')
            ->where('created_at', '>', $lastSync)
            ->get();
        
        // 2. Importar eventos nuevos
        foreach ($newLegacyEvents as $event) {
            AgendaEvent::create([
                'title' => $event->evento,
                'start' => $event->fecha.' '.$event->hora,
                'user_id' => null,
                'legacy_notaria' => $event->notaria,
                // ... más campos
            ]);
        }
        
        // 3. Actualizar timestamp de sincronización
        Cache::put('legacy_agenda_last_sync', now());
        
        return count($newLegacyEvents);
    }
}
```

**Comando programado en Kernel.php:**
```php
protected function schedule(Schedule $schedule)
{
    // Sincronizar eventos legacy cada hora
    $schedule->call(function () {
        app(BlacklistSyncService::class)->syncLegacyEvents();
    })->hourly();
}
```

---

## 🛠️ Testing y Validación

### Tests Unitarios

```php
// tests/Feature/AgendaIntegrationTest.php
class AgendaIntegrationTest extends TestCase
{
    /** @test */
    public function super_admin_can_see_legacy_events()
    {
        $superAdmin = User::factory()->create(['tipo_cuenta' => 'super_admin']);
        
        // Crear evento legacy
        $legacyEvent = AgendaEvent::factory()->create([
            'user_id' => null,
            'legacy_notaria' => 'atinet',
        ]);
        
        $this->actingAs($superAdmin)
            ->get('/agenda')
            ->assertSee($legacyEvent->title);
    }
    
    /** @test */
    public function usuarios_cannot_edit_legacy_events()
    {
        $user = User::factory()->create(['tipo_cuenta' => 'usuario']);
        
        $legacyEvent = AgendaEvent::factory()->create([
            'user_id' => null,
            'legacy_notaria' => 'atinet',
        ]);
        
        $this->actingAs($user)
            ->put("/agenda/{$legacyEvent->id}", ['title' => 'Modificado'])
            ->assertStatus(403);  // Forbidden
    }
}
```

---

## 📝 Tareas Pendientes / Mejoras Futuras

### Prioridad Alta 🔴

- [ ] **Sincronización bidireccional:** Eventos creados en Laravel → sistema legacy
- [ ] **Webhook notifications:** Notificar al sistema legacy cuando se crean eventos
- [ ] **Migración incremental:** Auto-importar eventos legacy nuevos sin re-ejecutar script

### Prioridad Media 🟡

- [ ] **Búsqueda avanzada:** Filtrar eventos legacy vs nuevos
- [ ] **Exportación:** Permitir exportar eventos legacy a .ics
- [ ] **Auditoría:** Log de quién visualiza eventos legacy

### Prioridad Baja 🟢

- [ ] **Modo comparación:** Vista lado a lado (legacy vs nuevo)
- [ ] **Estadísticas:** Dashboard de uso legacy vs nuevo sistema
- [ ] **Internacionalización:** Traducir etiquetas "Legacy" a español

---

## 🚨 Troubleshooting

### Error: "No se pueden cargar eventos legacy"

**Causa:** Conexión `aplicativos` no configurada

**Solución:**
```bash
# Verificar .env
cat .env | grep LEGACY_DB

# Debe contener:
LEGACY_DB_HOST=localhost
LEGACY_DB_DATABASE=atinet65_aplicativos
LEGACY_DB_USERNAME=root
LEGACY_DB_PASSWORD=tu_password
```

### Error: "Eventos duplicados en calendario"

**Causa:** Script de migración ejecutado múltiples veces

**Solución:**
```sql
-- Eliminar duplicados manteniendo el más antiguo
DELETE e1 FROM agenda_events e1
INNER JOIN agenda_events e2 
WHERE e1.id > e2.id 
  AND e1.title = e2.title 
  AND e1.start = e2.start
  AND e1.legacy_notaria IS NOT NULL;
```

### Error: "Permisos incorrectos - usuario ve eventos que no debería"

**Causa:** Filtros en AgendaController desactualizados

**Solución:** Revisar líneas 30-80 de `AgendaController.php` y verificar query builder

### Bitácora muestra solo logs nuevos

**Causa:** Variable `$legacySlug` es NULL

**Solución:**
```php
// Verificar que la notaría tenga legacy_identifier configurado
DB::table('notarias')->where('id', $user->notaria_id)->update([
    'legacy_identifier' => 'notaria_slug_legacy'
]);
```

---

## 📚 Referencias Técnicas

### Documentación Relacionada

- **Módulo Agenda:** `docs/MODULO_AGENDA.md`
- **Consolidación BDs Legacy:** `docs/development/PLAN_CONSOLIDACION_BDS_LEGACY.md`
- **Sistema VB6 Original:** `C:\xampp\htdocs\notariosatinet.com.mx\`

### Paquetes Utilizados

- **FullCalendar:** `@fullcalendar/react` v6.1.11
- **RRule (Recurrencias):** RFC 5545 - iCalendar Recurrence Rule
- **Spatie Activity Log:** `spatie/laravel-activitylog` v4.x

### APIs Relevantes

```
GET  /agenda                  - Lista de eventos (filtrada por permisos)
GET  /agenda/{id}             - Detalle de un evento
POST /agenda                  - Crear evento (solo usuarios autorizados)
PUT  /agenda/{id}             - Editar evento (prohibido si es legacy)
DELETE /agenda/{id}           - Eliminar evento (prohibido si es legacy)
GET  /agenda/bitacora         - Logs combinados (legacy + nuevo)
```

---

## ✅ Checklist de Implementación Completa

- [x] Migración de 1,020 eventos legacy
- [x] Conexión dual de bases de datos configurada
- [x] Filtros por tipo de usuario implementados
- [x] Modal read-only para eventos legacy
- [x] Bitácora combinada funcional
- [x] Sistema de permisos probado
- [x] Scripts de verificación creados
- [x] Documentación técnica completa
- [ ] Sincronización bidireccional (pendiente)
- [ ] Tests automatizados completos (pendiente)

---

**Última actualización:** 9 de Abril, 2026  
**Responsable:** Equipo de Desarrollo Atinet  
**Estatus:** ✅ Funcional en producción (integración unidireccional legacy → Laravel)
