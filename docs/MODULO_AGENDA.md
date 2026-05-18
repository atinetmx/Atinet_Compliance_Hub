# 📅 Módulo de Agenda - Documentación Completa

**Versión:** 1.0  
**Fecha de Implementación:** 19-20 de Marzo, 2026  
**Estado:** ✅ Completado y en Producción

---

## 📋 Tabla de Contenidos

1. [Descripción General](#-descripción-general)
2. [Características Implementadas](#-características-implementadas)
3. [Arquitectura Técnica](#-arquitectura-técnica)
4. [Base de Datos](#-base-de-datos)
5. [Backend - Laravel](#-backend---laravel)
6. [Frontend - React](#-frontend---react)
7. [Sistema de Permisos](#-sistema-de-permisos)
8. [Migración desde Sistema Legacy](#-migración-desde-sistema-legacy)
9. [Uso y Funcionalidades](#-uso-y-funcionalidades)
10. [Testing y Validación](#-testing-y-validación)
11. [Troubleshooting](#-troubleshooting)

---

## 🎯 Descripción General

El **Módulo de Agenda** es un sistema completo de gestión de eventos y citas para notarías, integrado con el sistema legacy y con soporte para eventos recurrentes. Permite a los usuarios gestionar su calendario personal y compartido, con visualización en múltiples formatos y seguimiento de actividades.

### Objetivo

Proporcionar una herramienta moderna y eficiente de gestión de calendario que:
- Reemplace la agenda del sistema legacy
- Soporte eventos recurrentes con reglas complejas
- Permita visualización compartida y personal
- Mantenga un historial de actividades

---

## ✨ Características Implementadas

### Gestión de Eventos

- ✅ **Crear eventos** con título, fechas, comentarios y color
- ✅ **Editar eventos** propios (usuarios) o de la notaría (admins)
- ✅ **Eliminar eventos** con confirmación
- ✅ **Drag & Drop** para mover eventos entre fechas
- ✅ **Resize** para cambiar duración de eventos
- ✅ **4 tipos de eventos:** General, Cita, Recordatorio, Festivo

### Eventos Recurrentes

- ✅ **Frecuencia:** Diaria, Semanal, Mensual, Anual
- ✅ **Días de la semana:** Selección múltiple para eventos semanales
- ✅ **Duración personalizada:** Define tiempo de cada ocurrencia
- ✅ **Visualización automática** en todas las fechas correspondientes
- ✅ Basado en **RFC 5545 (iCalendar RRule)**

### Visualización

- ✅ **3 pestañas principales:**
  1. **Calendario** - Vista mensual/semanal/diaria/lista con FullCalendar
  2. **Citas del día** - Lista filtrada por fecha específica
  3. **Bitácora** - Historial de actividades del sistema legacy

- ✅ **Múltiples vistas de calendario:**
  - Vista Mensual (Grid)
  - Vista Semanal (Timeline)
  - Vista Diaria (Timeline)
  - Vista Lista

- ✅ **Selector de vista** (solo admins):
  - "Ver todo" - Eventos propios + legacy + otros usuarios de la notaría
  - "Solo míos" - Solo eventos propios + legacy compartidos

### Permisos y Visibilidad

- ✅ **Super Admin:**
  - Ve todos los eventos de 'atinet'
  - Puede ver eventos de otros super_admins en "Ver todo"
  - Solo ve sus propios + legacy en "Solo míos"

- ✅ **Admin Notaría:**
  - Ve todos los eventos de su notaría
  - Puede ver eventos de otros usuarios en "Ver todo"
  - Solo ve sus propios + legacy en "Solo míos"

- ✅ **Usuario Normal:**
  - Solo ve sus propios eventos
  - Ve eventos legacy compartidos de su notaría

### Migración Legacy

- ✅ **1,020 eventos migrados** desde `atinet65_aplicativos.agenda`
- ✅ **Eventos legacy identificados** con `user_id=NULL` y `legacy_notaria='atinet'`
- ✅ **Modal read-only** para eventos legacy (no editables)
- ✅ **Sincronización automática** con `BlacklistSyncService`

### UI/UX

- ✅ **Interfaz moderna** con Shadcn UI components
- ✅ **Responsive design** - funciona en desktop y tablet
- ✅ **Color picker** para personalizar eventos
- ✅ **Tooltips y badges** para información adicional
- ✅ **Loading states** con spinners
- ✅ **Confirmaciones** antes de eliminar

---

## 🏗️ Arquitectura Técnica

### Stack Tecnológico

**Backend:**
- Laravel 12
- PHP 8.2+
- MySQL 8.0

**Frontend:**
- React 19
- TypeScript 5.x
- Inertia.js v2
- Tailwind CSS v4
- Shadcn UI

**Librerías Especializadas:**
- FullCalendar v7 (React)
- @fullcalendar/rrule (eventos recurrentes)
- rrule (generación de reglas RFC 5545)
- Axios (HTTP requests)

### Flujo de Datos

```
Usuario
  ↓
React Component (Index.tsx)
  ↓
Inertia.js / Axios
  ↓
AgendaController (Laravel)
  ↓
AgendaEvent Model (Eloquent)
  ↓
MySQL (agenda_events table)
```

### Sincronización Legacy

```
Sistema Legacy (MySQL)
  ↓
atinet65_aplicativos.agenda
  ↓
BlacklistSyncService
  ↓
Comando: php artisan blacklists:sync
  ↓
agenda_events (sistema nuevo)
```

---

## 💾 Base de Datos

### Tabla Principal: `agenda_events`

```sql
CREATE TABLE `agenda_events` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `notaria_id` bigint unsigned DEFAULT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `legacy_notaria` varchar(50) DEFAULT NULL,
  `titulo` varchar(145) NOT NULL,
  `start_fecha` datetime NOT NULL,
  `end_fecha` datetime DEFAULT NULL,
  `comentarios` varchar(255) DEFAULT NULL,
  `color` varchar(10) DEFAULT '#2563eb',
  `tipo` enum('general','cita','recordatorio','festivo') DEFAULT 'general',
  `all_day` tinyint(1) DEFAULT '0',
  `rrule` json DEFAULT NULL,
  `duration` varchar(10) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `agenda_events_notaria_id_foreign` (`notaria_id`),
  KEY `agenda_events_user_id_foreign` (`user_id`),
  KEY `idx_agenda_start_end` (`start_fecha`,`end_fecha`),
  KEY `idx_agenda_legacy` (`legacy_notaria`),
  CONSTRAINT `agenda_events_notaria_id_foreign` 
    FOREIGN KEY (`notaria_id`) REFERENCES `notarias` (`id`) ON DELETE CASCADE,
  CONSTRAINT `agenda_events_user_id_foreign` 
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Campos Importantes

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `user_id` | bigint | Usuario creador (NULL = legacy) |
| `notaria_id` | bigint | Notaría asociada (NULL = super_admin) |
| `legacy_notaria` | varchar | Identificador legacy ('atinet', '71monterrey', etc.) |
| `rrule` | json | Regla de recurrencia RFC 5545 |
| `duration` | varchar | Duración eventos recurrentes (ej: '01:00') |
| `all_day` | boolean | Evento de día completo |

### Tabla Legacy: `atinet65_aplicativos.agenda`

```sql
CREATE TABLE `agenda` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(145) NOT NULL,
  `start_fecha` datetime NOT NULL,
  `end_fecha` datetime DEFAULT NULL,
  `comentarios` varchar(255) DEFAULT NULL,
  `color` varchar(10) DEFAULT NULL,
  `notaria` varchar(50) DEFAULT NULL,
  `id_usuario_creador` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
```

---

## 🔧 Backend - Laravel

### Controlador: `AgendaController`

**Ubicación:** `app/Http/Controllers/AgendaController.php`

**Métodos principales:**

```php
class AgendaController extends Controller
{
    // Renderiza la vista principal
    public function index(): Response
    
    // Retorna eventos para el calendario (formato FullCalendar)
    public function events(Request $request): JsonResponse
    
    // Retorna citas de un día específico
    public function today(Request $request): JsonResponse
    
    // Retorna bitácora de actividades (legacy)
    public function log(Request $request): JsonResponse
    
    // Crea un nuevo evento
    public function store(Request $request): JsonResponse
    
    // Actualiza un evento existente
    public function update(Request $request, AgendaEvent $agendaEvent): JsonResponse
    
    // Elimina un evento
    public function destroy(Request $request, AgendaEvent $agendaEvent): JsonResponse
}
```

### Modelo: `AgendaEvent`

**Ubicación:** `app/Models/AgendaEvent.php`

**Características:**

```php
class AgendaEvent extends Model
{
    // Casts automáticos
    protected $casts = [
        'start_fecha' => 'datetime',
        'end_fecha' => 'datetime',
        'all_day' => 'boolean',
        'rrule' => 'array',
    ];
    
    // Scope de visibilidad
    public function scopeVisiblePara($query, User $user, string $vista = 'todos'): void
    
    // Relaciones
    public function notaria(): BelongsTo
    public function user(): BelongsTo
    
    // Conversión a formato FullCalendar
    public function toFullCalendar(): array
}
```

### Scope `visiblePara()`

Gestiona la lógica de visibilidad según tipo de usuario y vista:

**Vista 'propio' (Solo míos):**
```php
// Eventos propios + eventos legacy compartidos
$query->where('user_id', $user->id)
    ->orWhere(function($q) {
        $q->whereNull('user_id')
          ->where('legacy_notaria', 'atinet'); // o notaria específica
    });
```

**Vista 'todos' (Ver todo):**
```php
// Eventos propios + legacy + otros usuarios de la notaría
$query->where('user_id', $user->id)
    ->orWhereNull('user_id') // legacy
    ->orWhere(/* otros usuarios si es admin */);
```

### Rutas

**Ubicación:** `routes/web.php`

```php
Route::middleware(['auth', 'verified'])->group(function () {
    Route::prefix('admin/agenda')->name('admin.agenda.')->group(function () {
        Route::get('/', [AgendaController::class, 'index'])->name('index');
        Route::get('/events', [AgendaController::class, 'events'])->name('events');
        Route::get('/today', [AgendaController::class, 'today'])->name('today');
        Route::get('/log', [AgendaController::class, 'log'])->name('log');
        Route::post('/', [AgendaController::class, 'store'])->name('store');
        Route::put('/{agendaEvent}', [AgendaController::class, 'update'])->name('update');
        Route::delete('/{agendaEvent}', [AgendaController::class, 'destroy'])->name('destroy');
    });
});
```

---

## ⚛️ Frontend - React

### Componente Principal

**Ubicación:** `resources/js/pages/Agenda/Index.tsx` (950+ líneas)

### Estructura del Componente

```typescript
export default function AgendaIndex() {
    // Estados principales
    const [vista, setVista] = useState<'propio' | 'todos'>('todos');
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState<EventForm>(emptyForm());
    const [readOnly, setReadOnly] = useState(false);
    
    // Referencias
    const calendarRef = useRef<FullCalendar>(null);
    const vistaRef = useRef<'propio' | 'todos'>('todos');
    
    // Funciones de manejo
    function handleVistaChange(newVista) { ... }
    function openCreate(start, end) { ... }
    function openEdit(eventArg) { ... }
    function handleSubmit(e) { ... }
    function handleDelete() { ... }
    function handleDrop(info) { ... }
    function handleResize(info) { ... }
    
    return (
        <AppLayout>
            {/* Header con selector de vista */}
            {/* Tabs: Calendario, Citas del día, Bitácora */}
            {/* Modal de creación/edición */}
        </AppLayout>
    );
}
```

### Componentes UI

**FullCalendar:**
```typescript
<FullCalendar
    ref={calendarRef}
    plugins={[rrulePlugin, dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
    initialView="dayGridMonth"
    locale="es"
    events={fetchCalendarEvents}
    selectable={true}
    editable={isAdmin}
    eventResizableFromStart={isAdmin}
    select={handleSelect}
    dateClick={handleDateClick}
    eventClick={openEdit}
    eventDrop={handleDrop}
    eventResize={handleResize}
/>
```

**Selector de Vista (Admins):**
```typescript
{isAdmin && (
    <Select value={vista} onValueChange={handleVistaChange}>
        <SelectTrigger className="w-[160px]">
            <SelectValue />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="todos">
                <Eye className="h-4 w-4" /> Ver todo
            </SelectItem>
            <SelectItem value="propio">
                <User className="h-4 w-4" /> Solo míos
            </SelectItem>
        </SelectContent>
    </Select>
)}
```

### Tipos TypeScript

```typescript
interface EventForm {
    id: number | null;
    titulo: string;
    start_fecha: string;
    end_fecha: string;
    comentarios: string;
    color: string;
    tipo: 'general' | 'cita' | 'recordatorio' | 'festivo';
    all_day: boolean;
    recurrente: boolean;
    rrule_freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    rrule_byweekday: number[];
    duration: string;
}

interface CitaItem {
    id: number;
    titulo: string;
    start_fecha: string;
    end_fecha: string;
    comentarios: string | null;
    color: string;
    tipo: string;
    user_id: number | null;
}

interface LogEntry {
    mail: string;
    accion: string;
    fecha: string;
    hora: string;
}
```

---

## 🔐 Sistema de Permisos

### Niveles de Acceso

| Usuario | Ver Eventos | Crear | Editar | Eliminar |
|---------|-------------|-------|--------|----------|
| **Super Admin** | Todos de 'atinet' | ✅ | ✅ Propios + otros super_admins | ✅ Propios + otros super_admins |
| **Admin Notaría** | Todos de su notaría | ✅ | ✅ Propios + usuarios notaría | ✅ Propios + usuarios notaría |
| **Usuario** | Solo propios + legacy | ✅ | ✅ Solo propios | ✅ Solo propios |

### Middleware

```php
Route::middleware(['auth', 'verified'])->group(function () {
    // Rutas de agenda
});
```

### Validación de Permisos

**En el controlador:**
```php
private function authorizeEvent(AgendaEvent $event, User $user): void
{
    $esAdmin = in_array($user->tipo_cuenta, ['super_admin', 'admin_notaria']);
    
    // Verificar que el evento pertenece a la notaría del usuario
    abort_if(
        $event->notaria_id !== $user->notaria_id,
        403,
        'No tienes acceso a este evento.'
    );
    
    // Solo admins pueden modificar eventos de otros
    abort_if(
        !$esAdmin && $event->user_id !== $user->id,
        403,
        'Solo puedes modificar tus propios eventos.'
    );
}
```

---

## 🔄 Migración desde Sistema Legacy

### Script de Migración

**Ubicación:** `migrate_agenda_to_new_system.php`

### Proceso de Migración

**1. Sincronización de datos legacy:**
```bash
php artisan blacklists:sync
```

**2. Migración de eventos 'atinet':**
```bash
php migrate_agenda_to_new_system.php --dry-run  # Prueba
php migrate_agenda_to_new_system.php            # Migración real
```

### Lógica de Migración

```php
// Eventos sin id_usuario_creador → user_id = NULL (legacy compartido)
if (!$legacyEvento->id_usuario_creador) {
    $user_id = null;
}
// Eventos con id_usuario_creador → buscar y mapear
else {
    $legacyUser = DB::connection('aplicativos')
        ->table('usuario')
        ->where('id', $legacyEvento->id_usuario_creador)
        ->first();
    
    if ($legacyUser) {
        $newUser = User::where('email', $legacyUser->USER)->first();
        $user_id = $newUser?->id ?? null;
    }
}

// Crear evento en sistema nuevo
AgendaEvent::create([
    'user_id' => $user_id,
    'notaria_id' => $notaria_id,
    'legacy_notaria' => 'atinet',
    'titulo' => $legacyEvento->titulo,
    'start_fecha' => $legacyEvento->start_fecha,
    'end_fecha' => $legacyEvento->end_fecha,
    'comentarios' => $legacyEvento->comentarios,
    'color' => $legacyEvento->color ?? '#2563eb',
    'tipo' => 'general',
]);
```

### Resultados de Migración

**Estadísticas (19 de Marzo, 2026):**
- **Total eventos migrados:** 1,020
- **Eventos de 'atinet':** 1,017 sin usuario + 3 usuarios no encontrados
- **Todos marcados como:** `user_id=NULL`, `legacy_notaria='atinet'`

---

## 💡 Uso y Funcionalidades

### Crear Evento Simple

1. Click en "Nuevo evento" o en una fecha del calendario
2. Llenar formulario:
   - Título (requerido)
   - Fecha inicio (requerido)
   - Fecha fin (opcional)
   - Comentarios
   - Color
   - Tipo (General/Cita/Recordatorio/Festivo)
3. Click en "Crear evento"

### Crear Evento Recurrente

1. Marcar checkbox "Recurrente"
2. Seleccionar frecuencia: Diaria, Semanal, Mensual, Anual
3. Si es semanal, seleccionar días (L, M, Mi, J, V, S, D)
4. Definir duración (ej: "01:00" para 1 hora)
5. Crear evento

**Ejemplo - Reunión Semanal:**
- Título: "Reunión de equipo"
- Inicio: 2026-03-24 10:00
- Recurrente: ✅
- Frecuencia: Semanal
- Días: Lunes, Miércoles, Viernes
- Duración: 01:30

Resultado: Evento se repite L/Mi/V a las 10:00 con duración de 1.5 horas

### Editar Evento

1. Click en evento del calendario o en lista
2. Si eres propietario o admin → Modal en modo edición
3. Si es evento legacy → Modal en modo solo lectura
4. Modificar campos necesarios
5. Click en "Guardar cambios"

### Eliminar Evento

1. Abrir evento en modo edición
2. Click en "Eliminar evento"
3. Confirmar eliminación
4. Evento se elimina de todas las vistas

### Mover Evento (Drag & Drop)

1. Arrastrar evento a nueva fecha
2. Confirmar en diálogo: "¿Mover [título] a [nueva fecha]?"
3. Evento se actualiza automáticamente

### Cambiar Duración (Resize)

1. Posicionar cursor en borde inferior del evento
2. Arrastrar hacia arriba o abajo
3. Nueva duración se guarda automáticamente

### Cambiar Vista (Admins)

1. En selector "Ver todo" / "Solo míos"
2. Seleccionar vista deseada
3. Calendario y lista se actualizan automáticamente

**"Ver todo":**
- Eventos propios
- Eventos legacy compartidos
- Eventos de otros usuarios de la notaría (si admin)

**"Solo míos":**
- Solo eventos propios
- Eventos legacy compartidos

### Ver Bitácora

1. Ir a pestaña "Bitácora"
2. Seleccionar fecha
3. Ver actividades del sistema legacy para esa fecha
4. Información: email, acción, hora

---

## 🧪 Testing y Validación

### Scripts de Verificación

**1. Verificar visibilidad:**
```bash
php verify_agenda_visibility.php
```

Valida que:
- Super admin ve eventos de 'atinet'
- Admin notaría ve eventos de su notaría
- Usuario normal solo ve propios

**2. Test de vistas:**
```bash
php test_vista_selector.php
```

Valida que:
- Vista 'propio' filtra correctamente
- Vista 'todos' incluye eventos adicionales
- Backend retorna conteos correctos

**3. Tracking completo:**
```bash
php test_vista_tracking.php
```

Muestra desglose detallado:
- Eventos propios por usuario
- Eventos legacy compartidos
- Eventos de otros usuarios
- SQL queries generadas

**4. Test de diferencia:**
```bash
php test_diferencia_vistas.php
```

Crea segundo super_admin y valida diferencia entre vistas

### Validaciones Manuales

**✅ Calendario:**
- [ ] Se muestran eventos correctamente
- [ ] Drag & drop funciona
- [ ] Resize funciona
- [ ] Click en evento abre modal
- [ ] Eventos recurrentes se repiten correctamente

**✅ Modal:**
- [ ] Formulario de creación funciona
- [ ] Formulario de edición funciona
- [ ] Modo solo lectura para legacy
- [ ] Validaciones muestran errores
- [ ] Color picker funciona

**✅ Permisos:**
- [ ] Usuario normal no puede editar eventos de otros
- [ ] Admin puede editar eventos de su notaría
- [ ] Super admin puede editar eventos de 'atinet'
- [ ] Eventos legacy no son editables

**✅ Vistas:**
- [ ] Selector de vista solo visible para admins
- [ ] "Ver todo" muestra eventos adicionales
- [ ] "Solo míos" filtra correctamente
- [ ] Cambio de vista actualiza calendario y lista

---

## 🔧 Troubleshooting

### Problema: Loop infinito al cambiar vista

**Síntoma:** Las vistas cambian automáticamente 4+ veces por segundo

**Causa:** React re-render loop por dependencias mal configuradas

**Solución:**
```typescript
// ✅ CORRECTO
const vistaRef = useRef<'propio' | 'todos'>('todos');

function handleVistaChange(newVista: 'propio' | 'todos') {
    vistaRef.current = newVista;  // Actualizar ref SINCRÓNICAMENTE
    setVista(newVista);
    calendarRef.current?.getApi().refetchEvents();
}
```

### Problema: Vista "Solo míos" muestra todos los eventos

**Síntoma:** No hay diferencia entre "Ver todo" y "Solo míos"

**Solución:** Verificar que el parámetro `vista` llega al backend

```bash
# Verificar SQL generada
php debug_vista_param.php
```

Asegurar que `handleVistaChange` actualiza el ref antes de refetch

### Problema: Eventos legacy no se muestran

**Síntoma:** Eventos migrados no aparecen en calendario

**Diagnóstico:**
```sql
-- Verificar eventos legacy
SELECT COUNT(*) FROM agenda_events WHERE user_id IS NULL;

-- Verificar legacy_notaria
SELECT DISTINCT legacy_notaria FROM agenda_events WHERE user_id IS NULL;
```

**Solución:** Verificar scope `visiblePara()` incluye condición para `legacy_notaria`

### Problema: Error al crear evento

**Síntoma:** "All Inertia requests must receive a valid Inertia response"

**Causa:** Controlador retorna JSON pero frontend usa `router.post()` (Inertia)

**Solución:** Usar `axios.post()` en lugar de `router.post()`

```typescript
// ❌ INCORRECTO
router.post('/admin/agenda', payload);

// ✅ CORRECTO
axios.post('/admin/agenda', payload)
    .then(() => onFinish())
    .catch((error) => console.error(error));
```

### Problema: Eventos recurrentes no se muestran

**Síntoma:** Evento recurrente solo aparece en primera fecha

**Solución:** Verificar que FullCalendar tiene `rrulePlugin` cargado

```typescript
import rrulePlugin from '@fullcalendar/rrule';

<FullCalendar
    plugins={[rrulePlugin, ...otroPlugins]}
    events={fetchCalendarEvents}
/>
```

### Problema: Bitácora vacía

**Síntoma:** Tab "Bitácora" no muestra actividades

**Diagnóstico:**
```bash
# Verificar conexión a BD legacy
php artisan tinker
> DB::connection('aplicativos')->table('log')->count();
```

**Solución:** Verificar configuración de conexión `aplicativos` en `config/database.php`

---

## 📊 Estadísticas del Proyecto

### Líneas de Código

| Componente | Archivo | Líneas |
|------------|---------|--------|
| Frontend | Index.tsx | 950+ |
| Backend | AgendaController.php | 190 |
| Modelo | AgendaEvent.php | 150 |
| Migración | DB Migration | 50 |
| **TOTAL** | - | **~1,340** |

### Tiempo de Desarrollo

| Fase | Duración | Fecha |
|------|----------|-------|
| Análisis y diseño | 1 hora | 19 Mar 2026 |
| Implementación backend | 2 horas | 19 Mar 2026 |
| Implementación frontend | 3 horas | 19 Mar 2026 |
| Migración legacy | 1.5 horas | 19 Mar 2026 |
| Selector de vistas | 2 horas | 19-20 Mar 2026 |
| Testing y fixes | 2 horas | 20 Mar 2026 |
| **TOTAL** | **11.5 horas** | - |

### Eventos Migrados

- **Sistema Legacy:** 5,834 eventos (local) / 6,052 eventos (Hostgator)
- **Migrados a nuevo sistema:** 1,020 eventos de 'atinet'
- **Pendientes:** 71monterrey (2,279), 12Colima (706), otras notarías

---

## 🚀 Próximos Pasos

### Mejoras Sugeridas

1. **📧 Notificaciones por email** - Recordatorios antes de citas
2. **🔔 Notificaciones push** - Alertas en tiempo real
3. **📱 Vista móvil optimizada** - App responsive completa
4. **🔍 Búsqueda de eventos** - Filtro por título/fecha/tipo
5. **📤 Exportar calendario** - iCal, Google Calendar, Outlook
6. **👥 Eventos compartidos** - Invitar otros usuarios a eventos
7. **🎨 Temas de color** - Personalización por usuario
8. **📈 Estadísticas** - Uso de calendario por usuario/notaría

### Migraciones Pendientes

| Notaría | Eventos | Estado |
|---------|---------|--------|
| 71monterrey | 2,279 | ⏸️ Pendiente |
| 12Colima | 706 | ⏸️ Pendiente |
| 79Cancun | 622 | ⏸️ Pendiente |
| 7silao | 327 | ⏸️ Pendiente |

---

## 📚 Referencias

### Documentación Externa

- [FullCalendar Docs](https://fullcalendar.io/docs)
- [RFC 5545 (iCalendar)](https://tools.ietf.org/html/rfc5545)
- [rrule.js](https://github.com/jakubroztocil/rrule)
- [Inertia.js](https://inertiajs.com/)
- [Shadcn UI](https://ui.shadcn.com/)

### Archivos Relacionados

- `routes/web.php` - Rutas de agenda
- `database/migrations/*_create_agenda_events_table.php` - Migración
- `app/Http/Controllers/AgendaController.php` - Controlador
- `app/Models/AgendaEvent.php` - Modelo
- `resources/js/pages/Agenda/Index.tsx` - Componente React

---

**Última actualización:** 20 de Marzo, 2026  
**Autor:** Equipo de Desarrollo Atinet  
**Versión del Documento:** 1.0
