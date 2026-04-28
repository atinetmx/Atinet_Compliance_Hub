# 🔍 Análisis Sistema VB - Gestión Interna Atinet
**📅 Fecha:** 14 de Abril 2026  
**🎯 Objetivo:** Identificar funcionalidades del sistema VB que se usan para gestión interna y migrarlas a Laravel

---

## 📝 Notas de Sesión — 22 de Abril 2026

### Fixes aplicados en esta sesión

#### 1. Timezone — `config/app.php`
- **Problema:** App corría en UTC. Registros creados después de las 6 PM hora México aparecían con fecha de "ayer".
- **Fix:** `'timezone' => env('APP_TIMEZONE', 'America/Mexico_City')`
- **Commit:** `0a8a59c`

#### 2. Registro Web — campo `notaria` en `atinet65_aplicativos.registro`
- El sistema legacy guarda el slug de la notaría (ej. `60ecatepec`) en el campo `notaria` de la tabla `registro`.
- La URL del iframe en nuestro sistema usa `legacy_identifier` de la notaría, que coincide exactamente con ese slug.
- **Verificado:** registros hechos desde el nuevo sistema aparecen correctamente en VB Control Notarial.
- No se requirió ningún cambio de código.

---

### Aclaración importante — `atinet65_aplicativos`

Esta BD **solo contiene los sistemas web legacy** de Atinet, todos considerados mal implementados y en proceso de reemplazo:
- `registro` → Registro Web (anterior al actual)
- `agenda` → Agenda Web (mal hecha)
- `busquedas` → Listas negras / OFAC (mal hechas)

**NO es la BD del sistema Control Notarial VB.** No mezclar.

---

### Próximo paso: Feature Tree / Customización por Notaría

#### Objetivo
Construir un panel en Compliance Hub donde los **admins de Atinet** puedan configurar qué herramientas, módulos, botones y reportes ve cada notaría en Control Notarial, replicando la customización manual que hoy se hace editando el ejecutable VB.

#### Arquitectura acordada (pendiente de implementar)
```
features  (catálogo master — árbol de todas las herramientas CN)
├── id
├── parent_id        → estructura jerárquica
├── code             → 'REGISTRO.NUEVO_REGISTRO'
├── label            → 'Nuevo Registro'
├── tipo             → 'modulo' | 'herramienta' | 'boton' | 'reporte'
└── orden

notaria_features  (config por notaría)
├── notaria_id
├── feature_id
└── is_enabled       (default: según plan)
```

Lógica de herencia: **Plan → Notaría → (futuro) Usuario**

#### Pre-requisito bloqueante
Antes de implementar se necesita un inventario completo del sistema VB:
- Módulos, formularios, botones, reportes de la versión **master**
- Versiones para **notarías** y **corredurías**

El usuario tiene acceso al código fuente VB y BDs de ambas versiones. Pendiente de analizar en sesión dedicada con acceso a esos archivos.

---

## 📊 Resumen Ejecutivo

El sistema VB legacy (`Sistema Atinet-/`) es un sistema completo de Control Notarial con **cientos de formularios**, pero según el usuario **solo se usa una pequeña parte para gestión interna** (control de usuarios y clientes). NO necesitamos migrar todo el sistema, solo lo que se usa actualmente.

### Base de Datos
```
Servidor: SRVATINET
Base de Datos: sistemaatinet
Usuario: root
Contraseña: 123456
Driver: MySQL ODBC 5.1
```

### Modo de Operación
- **Online:** 192.185.226.133 (atinet65_sistemaatinet)
- **Local:** Configuración desde archivo `scn.ini`

---

## 🔍 Funcionalidades Core Usadas

### **1. Sistema de Login y Usuarios** ✅

#### **Formularios:**
- `Login.frm` - Login de usuarios
- `AltaUsuarios.frm` - CRUD de usuarios
- `BusquedaUsuario.frm` - Búsqueda de usuarios

#### **Tabla BD:**
```sql
usuarios (
    usuario VARCHAR(10) - Username
    clave VARCHAR - Password (encriptado con *)
    nombre VARCHAR - Nombre completo
    fecha_alta DATE - Fecha de creación
    permisos TEXT - Permisos del usuario
    tipo_cuenta VARCHAR - Tipo de cuenta
)
```

#### **Características:**
- Login con usuario/contraseña
- Sistema de permisos por usuario
- Registro de actividad `ActividadUsuario()`
- Fechas de alta
- **Ya hay equivalente en Laravel:** ✅ Laravel tiene sistema de usuarios completo

---

### **2. Sistema de Alarmas/Recordatorios** 🔔

#### **Formularios:**
- `Alarmas.frm` - Configurar alarmas
- `ActualizaAlarma.frm` - Actualizar/listar alarmas
- `MensajeAlarma.frm` - Ver mensaje de alarma
- `Recordatorio.frm` - Sistema de recordatorios
- `Recordartorio2.frm` - Vista de recordatorios

#### **Tabla BD:**
```sql
alarmas (
    indice INT AUTO_INCREMENT - ID
    concepto TEXT - Descripción de la alarma
    dia DATE - Fecha de la alarma
    hora TIME - Hora de la alarma
    estado VARCHAR - activo/inactivo
    usuario VARCHAR - Usuario que creó la alarma
    expediente VARCHAR - Expediente relacionado (nullable)
    alarma BOOLEAN - Si debe sonar alarma
)
```

#### **Queries encontrados:**
```sql
-- Obtener alarmas del día
SELECT * FROM alarmas WHERE dia = CURDATE() AND usuario = ?

-- Alarmas vencidas (pasadas)
SELECT * FROM alarmas WHERE dia < CURDATE()

-- Alarmas expiradas del día
SELECT * FROM alarmas 
WHERE dia = CURDATE() AND hora < CURTIME()

-- Máximo ID
SELECT Max(alarmas.indice) AS NINDICE FROM alarmas
```

#### **Características:**
- Crear alarmas con fecha/hora
- Concepto/descripción de la alarma
- Estados: activo/inactivo
- Relacionar con expediente (opcional)
- Verificación automática: `Recordatorio.VerficiaAlarmas`
- Timer que cada 5 segundos verifica alarmas
- Eliminar alarmas al cerrar expediente

#### **Estado en Laravel:**
- ❌ **NO existe** - Necesita implementación completa
- ReportsController tiene "alertas" pero son diferentes (límites de servicio)

---

### **3. Sistema de Chat Interno** 💬

#### **Formularios:**
- `AltaChat.frm` - Chat principal
- `AltaGruposChat.frm` - Administrar grupos
- `BusquedaGruposChat.frm` - Buscar grupos

#### **Tablas BD:**
```sql
chat (
    id INT AUTO_INCREMENT
    usuario VARCHAR - Usuario que envía
    para VARCHAR - Usuario/grupo destino
    mensaje TEXT - Contenido del mensaje
    fecha DATETIME - Fecha y hora del mensaje
    grupo BOOLEAN - Si es mensaje de grupo
)

chatgrupo (
    grupo VARCHAR - Nombre del grupo
    usuariogrupo VARCHAR - Usuario miembro del grupo
    admin BOOLEAN - Si es administrador del grupo
)
```

#### **Queries encontrados:**
```sql
-- Mensajes de chat individual
SELECT * FROM chat 
WHERE (para = ? AND usuario = ?) 
   OR (usuario = ? AND para = ?)
   AND grupo = FALSE
ORDER BY fecha DESC

-- Mensajes de grupo
SELECT chat.*, chatgrupo.grupo 
FROM chat 
INNER JOIN chatgrupo ON chat.para = chatgrupo.grupo
WHERE chatgrupo.usuariogrupo = ?
ORDER BY fecha DESC

-- Grupos del usuario
SELECT DISTINCT grupo FROM chatgrupo 
WHERE usuariogrupo = ?
ORDER BY grupo ASC

-- Todos los miembros de un grupo
SELECT * FROM chatgrupo WHERE grupo = ?

-- Eliminar grupo completo
DELETE FROM chatgrupo WHERE grupo = ?
DELETE FROM chat WHERE para = ?
```

#### **Características:**
- Chat 1-a-1 entre usuarios
- Chat grupal
- Crear/eliminar grupos
- Administradores de grupo
- Mensajes "Todos" (broadcast)
- Actualización en tiempo real (Timer cada 5 seg)
- Notificación de mensajes nuevos
- Vista de mensajes por usuario o grupo
- Eliminar mensajes

#### **Estado en Laravel:**
- ❌ **NO existe** - Necesita implementación completa
- Requiere WebSockets o polling para tiempo real

---

### **4. Gestión de Clientes** 👥

#### **Formularios:**
- `AltaClientes.frm` - Alta de clientes
- `BusquedaCliente.frm` - Búsqueda de clientes
- `BusquedaCliente2.frm` - Búsqueda avanzada
- `SelCte.frm` - Selector de clientes

#### **Tabla BD:**
```sql
clientes (
    cliente INT AUTO_INCREMENT - ID único
    id INT - ID secundario
    nombre VARCHAR - Nombre completo
    apellidopat VARCHAR - Apellido paterno
    apellidomat VARCHAR - Apellido materno
    curp VARCHAR(18) - CURP
    rfc VARCHAR(13) - RFC
    direccion TEXT - Domicilio completo
    calle VARCHAR
    numero VARCHAR
    codigo_postal VARCHAR
    colonia VARCHAR
    municipio VARCHAR
    estado VARCHAR
    pais VARCHAR - Default: México
    telefono VARCHAR
    email VARCHAR
    fecha_nacimiento DATE
    lugar_nacimiento VARCHAR
    pais_nac VARCHAR
    estado_nac VARCHAR
    municipio_nac VARCHAR
    nacionalidad VARCHAR
    ocupacion VARCHAR
    estado_civil VARCHAR - Soltero, Casado, etc.
    conyuge VARCHAR - Nombre del cónyuge
    identificacion VARCHAR - Tipo de ID (INE, Pasaporte, etc.)
    ife VARCHAR - Número INE
    pasaporte VARCHAR
    num_for_mig VARCHAR - Forma migratoria
    sexo VARCHAR(1) - M/F
    edad INT
    usuario VARCHAR - Usuario que lo creó
    fecha_recabacion DATE - Fecha registro
    act_eco VARCHAR - Actividad económica
    firma BOOLEAN - Si tiene firma escaneada
    firma_fecha DATE
    tel_ofic VARCHAR
    tel_particular VARCHAR
    pag_web VARCHAR
    regimen_con VARCHAR - Régimen conyugal
    doc_iden VARCHAR - Documento identificación
    tipo_persona VARCHAR - Física/Moral
)
```

#### **Queries encontrados:**
```sql
-- Buscar cliente por ID
SELECT * FROM clientes WHERE cliente = ?

-- Buscar por nombre
SELECT * FROM clientes 
WHERE nombre LIKE ? 
   OR apellidopat LIKE ? 
   OR apellidomat LIKE ?
ORDER BY nombre ASC

-- Buscar duplicados (CURP)
SELECT * FROM clientes 
WHERE nombre = ? AND curp = ?

-- Máximo ID
SELECT Max(cliente) AS MaxDeCliente FROM clientes

-- Búsqueda ordenada
SELECT * FROM clientes ORDER BY cliente
SELECTлось * FROM clientes ORDER BY nombre
SELECT * FROM clientes ORDER BY paterno
SELECT * FROM clientes ORDER BY materno
```

#### **Características:**
- Alta de clientes completos
- Búsqueda por:
  - ID de cliente
  - Nombre/Apellidos
  - CURP
  - RFC
- Validación de duplicados (CURP)
- Datos de ubicación completos (dirección, CP, colonia)
- Datos de nacimiento
- Datos de identificación (INE, Pasaporte, FM)
- Estado civil
- Actividad económica
- Firma digital
- Auditoría (usuario, fecha recabación)

#### **Estado en Laravel:**
- ✅ **Parcialmente existe:** Modelo `Notaria` tiene `nombre`, `email`, `telefono`
- ❌ **Falta:** Sistema completo de clientes con todos los campos
- ❌ **Falta:** CURP, RFC, validaciones
- ❌ **Falta:** Datos de nacimiento, identificación
- ❌ **Nota:** En Laravel actual, "clientes" son las Notarías

---

### **5. Integraciones Notariales (LIMITADO)** ⚠️

**El usuario menciona que NO usan la mayoría de los formularios notariales**, solo necesitan:

#### **Relación con sistema legacy:**
- Los usuarios del sistema VB son los mismos que en Control Notarial
- Los clientes se comparten entre sistemas
- **NO usan:** Expedientes, Escrituras, Trámites, Recibos, etc. (eso está en el .NET)

#### **Tablas que SÍ necesitamos por integración:**
```sql
expedientes - Referencia para alarmas
notarias - Ya migrado a Laravel
```

---

## 📋 Funcionalidades NO Usadas (No Migrar)

El sistema VB tiene **cientos de formularios** que NO se usan para gestión interna:

### **❌ NO Migrar:**
- ❌ Sistema completo de Expedientes (está en .NET)
- ❌ Gestión de Escrituras (está en .NET)
- ❌ Trámites y Gestión notarial (está en .NET)
- ❌ Recibos (Provisional, Gastos, Honorarios, ISR, etc.)
- ❌ Facturación electrónica
- ❌ Control bancario (cheques, depósitos, conciliación)
- ❌ Reportes de expedientes
- ❌ Cotejos, Ratificaciones, Certificaciones, Actas FP
- ❌ Control de dependencias (Catastro, Registro, SRE, etc.)
- ❌ Presupuestos
- ❌ Inmuebles
- ❌ Otorgantes
- ❌ Impuestos y derechos
- ❌ Gestores
- ❌ Pasantes, Secretarias, Responsables
- ❌ Volúmenes, Folios intercalados

**Razón:** Todas estas funcionalidades están en el sistema .NET de Control Notarial legacy. El sistema VB solo se usa para:
1. Login de usuarios (compartido)
2. Clientes base (compartido)
3. Alarmas (gestión interna)
4. Chat (gestión interna)

---

## 🎯 Plan de Implementación Laravel

### **Fase 1: Sistema de Alarmas/Recordatorios** (Prioridad ALTA) 🔔

#### **1. Base de Datos**
```bash
php artisan make:migration create_alarmas_table
```

```php
Schema::create('alarmas', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->foreignId('notaria_id')->nullable()->constrained()->onDelete('set null');
    $table->string('titulo', 100);
    $table->text('descripcion')->nullable();
    $table->date('fecha');
    $table->time('hora');
    $table->enum('estado', ['activa', 'finalizada', 'cancelada'])->default('activa');
    $table->boolean('notificar')->default(true);
    $table->timestamp('notificado_at')->nullable();
    $table->string('expediente_referencia')->nullable(); // Por compatibilidad legacy
    $table->timestamps();
    
    $table->index(['user_id', 'fecha', 'estado']);
    $table->index(['notaria_id', 'fecha']);
});
```

#### **2. Modelo**
```bash
php artisan make:model Alarma -mfs
```

```php
// app/Models/Alarma.php
class Alarma extends Model
{
    protected $fillable = [
        'user_id', 'notaria_id', 'titulo', 'descripcion',
        'fecha', 'hora', 'estado', 'notificar', 'expediente_referencia'
    ];
    
    protected $casts = [
        'fecha' => 'date',
        'hora' => 'datetime:H:i',
        'notificar' => 'boolean',
        'notificado_at' => 'datetime',
    ];
    
    public function user() {
        return $this->belongsTo(User::class);
    }
    
    public function notaria() {
        return $this->belongsTo(Notaria::class);
    }
    
    public function scopeActivas($query) {
        return $query->where('estado', 'activa');
    }
    
    public function scopeVencidas($query) {
        return $query->where('fecha', '<', now()->toDateString())
                     ->orWhere(function($q) {
                         $q->where('fecha', '=', now()->toDateString())
                           ->where('hora', '<', now()->toTimeString());
                     });
    }
    
    public function scopeHoy($query) {
        return $query->where('fecha', now()->toDateString());
    }
    
    public function scopeProximas($query) {
        return $query->where('fecha', '>=', now()->toDateString());
    }
}
```

#### **3. Controller**
```bash
php artisan make:controller Admin/AlarmaController --resource
```

```php
// app/Http/Controllers/Admin/AlarmaController.php
class AlarmaController extends Controller
{
    public function index(Request $request)
    {
        $query = Alarma::with(['user', 'notaria'])
            ->where('user_id', Auth::id());
        
        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }
        
        if ($request->filled('fecha')) {
            $query->where('fecha', $request->fecha);
        }
        
        $alarmas = $query->orderBy('fecha')
                         ->orderBy('hora')
                         ->get();
        
        return Inertia::render('Admin/Alarmas/Index', [
            'alarmas' => $alarmas,
            'vencidas' => Alarma::where('user_id', Auth::id())->vencidas()->activas()->count(),
            'hoy' => Alarma::where('user_id', Auth::id())->hoy()->activas()->count(),
        ]);
    }
    
    public function store(StoreAlarmaRequest $request)
    {
        $alarma = Alarma::create([
            'user_id' => Auth::id(),
            'notaria_id' => Auth::user()->notaria_id,
            ...$request->validated()
        ]);
        
        return redirect()->route('admin.alarmas.index')
            ->with('success', 'Alarma creada correctamente');
    }
    
    public function update(UpdateAlarmaRequest $request, Alarma $alarma)
    {
        $this->authorize('update', $alarma);
        
        $alarma->update($request->validated());
        
        return redirect()->route('admin.alarmas.index')
            ->with('success', 'Alarma actualizada correctamente');
    }
    
    public function destroy(Alarma $alarma)
    {
        $this->authorize('delete', $alarma);
        
        $alarma->delete();
        
        return redirect()->route('admin.alarmas.index')
            ->with('success', 'Alarma eliminada correctamente');
    }
    
    public function marcarFinalizada(Alarma $alarma)
    {
        $this->authorize('update', $alarma);
        
        $alarma->update(['estado' => 'finalizada']);
        
        return back()->with('success', 'Alarma marcada como finalizada');
    }
}
```

#### **4. Comando de Verificación**
```bash
php artisan make:command VerificarAlarmas
```

```php
// app/Console/Commands/VerificarAlarmas.php
class VerificarAlarmas extends Command
{
    protected $signature = 'alarmas:verificar';
    protected $description = 'Verifica alarmas pendientes y envía notificaciones';
    
    public function handle()
    {
        $alarmasPendientes = Alarma::with(['user'])
            ->activas()
            ->where('notificar', true)
            ->whereNull('notificado_at')
            ->where(function($query) {
                $query->where('fecha', '<', now()->toDateString())
                    ->orWhere(function($q) {
                        $q->where('fecha', '=', now()->toDateString())
                          ->where('hora', '<=', now()->toTimeString());
                    });
            })
            ->get();
        
        foreach ($alarmasPendientes as $alarma) {
            // Enviar notificación
            $alarma->user->notify(new AlarmaVencidaNotification($alarma));
            
            // Marcar como notificado
            $alarma->update(['notificado_at' => now()]);
            
            $this->info("Alarma #{$alarma->id} notificada a {$alarma->user->name}");
        }
        
        $this->info("Verificación completada: {$alarmasPendientes->count()} alarmas notificadas");
    }
}
```

#### **5. Programar en Cron**
```php
// routes/console.php
Schedule::command('alarmas:verificar')
    ->everyMinute()
    ->withoutOverlapping();
```

#### **6. Notificación**
```bash
php artisan make:notification AlarmaVencidaNotification
```

```php
class AlarmaVencidaNotification extends Notification
{
    public function via($notifiable)
    {
        return ['database', 'mail'];
    }
    
    public function toDatabase($notifiable)
    {
        return [
            'alarma_id' => $this->alarma->id,
            'titulo' => $this->alarma->titulo,
            'descripcion' => $this->alarma->descripcion,
            'fecha' => $this->alarma->fecha->format('d/m/Y'),
            'hora' => $this->alarma->hora->format('H:i'),
        ];
    }
    
    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('🔔 Recordatorio: ' . $this->alarma->titulo)
            ->line('Tienes una alarma programada:')
            ->line('**' . $this->alarma->titulo . '**')
            ->line($this->alarma->descripcion)
            ->line('Fecha/Hora: ' . $this->alarma->fecha->format('d/m/Y') . ' ' . $this->alarma->hora->format('H:i'))
            ->action('Ver Alarma', route('admin.alarmas.show', $this->alarma));
    }
}
```

#### **7. Frontend React/Inertia**
```bash
# Crear páginas
resources/js/Pages/Admin/Alarmas/Index.tsx
resources/js/Pages/Admin/Alarmas/Create.tsx
resources/js/Pages/Admin/Alarmas/Edit.tsx
```

**Características UI:**
- Lista de alarmas con filtros (fecha, estado)
- Calendario visual
- Crear alarma con DatePicker + TimePicker
- Notificaciones browser (Web Notifications API)
- Badge de alarmas pendientes en navbar
- Modal para ver detalles
- Marcar como finalizada/cancelada

---

### **Fase 2: Sistema de Chat Interno** (Prioridad MEDIA) 💬

#### **1. Base de Datos**
```bash
php artisan make:migration create_chat_system_tables
```

```php
// Chat messages
Schema::create('chat_messages', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Quien envía
    $table->foreignId('destinatario_id')->nullable()->constrained('users')->onDelete('cascade'); // 1-a-1
    $table->foreignId('chat_grupo_id')->nullable()->constrained()->onDelete('cascade'); // Grupal
    $table->text('mensaje');
    $table->boolean('leido')->default(false);
    $table->timestamp('leido_at')->nullable();
    $table->timestamps();
    $table->softDeletes();
    
    $table->index(['user_id', 'destinatario_id']);
    $table->index(['chat_grupo_id', 'created_at']);
    $table->index('leido');
});

// Chat groups
Schema::create('chat_grupos', function (Blueprint $table) {
    $table->id();
    $table->string('nombre', 100)->unique();
    $table->text('descripcion')->nullable();
    $table->foreignId('creador_id')->constrained('users')->onDelete('cascade');
    $table->timestamps();
});

// Group members
Schema::create('chat_grupo_miembros', function (Blueprint $table) {
    $table->id();
    $table->foreignId('chat_grupo_id')->constrained()->onDelete('cascade');
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->boolean('es_admin')->default(false);
    $table->timestamp('ultimo_visto')->nullable();
    $table->timestamps();
    
    $table->unique(['chat_grupo_id', 'user_id']);
});
```

#### **2. Modelos**
```bash
php artisan make:model ChatMessage
php artisan make:model ChatGrupo
php artisan make:model ChatGrupoMiembro
```

```php
// app/Models/ChatMessage.php
class ChatMessage extends Model
{
    use SoftDeletes;
    
    protected $fillable = [
        'user_id', 'destinatario_id', 'chat_grupo_id',
        'mensaje', 'leido', 'leido_at'
    ];
    
    protected $casts = [
        'leido' => 'boolean',
        'leido_at' => 'datetime',
    ];
    
    public function user() {
        return $this->belongsTo(User::class);
    }
    
    public function destinatario() {
        return $this->belongsTo(User::class, 'destinatario_id');
    }
    
    public function grupo() {
        return $this->belongsTo(ChatGrupo::class, 'chat_grupo_id');
    }
    
    public function scopeDirectos($query, $userId, $otrUserId) {
        return $query->where(function($q) use ($userId, $otroUserId) {
            $q->where('user_id', $userId)->where('destinatario_id', $otroUserId);
        })->orWhere(function($q) use ($userId, $otroUserId) {
            $q->where('user_id', $otroUserId)->where('destinatario_id', $userId);
        })->whereNull('chat_grupo_id');
    }
    
    public function scopeNoLeidos($query, $userId) {
        return $query->where('destinatario_id', $userId)
                     ->where('leido', false);
    }
}

// app/Models/ChatGrupo.php
class ChatGrupo extends Model
{
    protected $fillable = ['nombre', 'descripcion', 'creador_id'];
    
    public function creador() {
        return $this->belongsTo(User::class, 'creador_id');
    }
    
    public function miembros() {
        return $this->belongsToMany(User::class, 'chat_grupo_miembros')
                    ->withPivot('es_admin', 'ultimo_visto')
                    ->withTimestamps();
    }
    
    public function mensajes() {
        return $this->hasMany(ChatMessage::class);
    }
    
    public function esAdmin($userId) {
        return $this->miembros()->wherePivot('user_id', $userId)
                                ->wherePivot('es_admin', true)
                                ->exists();
    }
}
```

#### **3. Broadcasting (Tiempo Real)**
```bash
composer require pusher/pusher-php-server
php artisan make:event NuevoMensajeChat
```

```php
// app/Events/NuevoMensajeChat.php
class NuevoMensajeChat implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;
    
    public function __construct(public ChatMessage $mensaje) {}
    
    public function broadcastOn()
    {
        // Si es mensaje directo
        if ($this->mensaje->destinatario_id) {
            return new PrivateChannel('chat.user.' . $this->mensaje->destinatario_id);
        }
        
        // Si es mensaje de grupo
        return new PrivateChannel('chat.grupo.' . $this->mensaje->chat_grupo_id);
    }
    
    public function broadcastWith()
    {
        return [
            'mensaje' => $this->mensaje->load(['user', 'destinatario', 'grupo']),
        ];
    }
}
```

#### **4. Controller**
```php
class ChatController extends Controller
{
    public function enviarMensaje(Request $request)
    {
        $validated = $request->validate([
            'destinatario_id' => 'nullable|exists:users,id',
            'chat_grupo_id' => 'nullable|exists:chat_grupos,id',
            'mensaje' => 'required|string|max:2000',
        ]);
        
        $mensaje = ChatMessage::create([
            'user_id' => Auth::id(),
            ...$validated
        ]);
        
        broadcast(new NuevoMensajeChat($mensaje))->toOthers();
        
        return response()->json($mensaje->load(['user', 'destinatario', 'grupo']));
    }
    
    public function obtenerConversacion(User $otroUsuario)
    {
        $mensajes = ChatMessage::directos(Auth::id(), $otroUsuario->id)
            ->with(['user', 'destinatario'])
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();
        
        // Marcar como leídos
        ChatMessage::where('user_id', $otroUsuario->id)
            ->where('destinatario_id', Auth::id())
            ->where('leido', false)
            ->update(['leido' => true, 'leido_at' => now()]);
        
        return response()->json($mensajes);
    }
    
    public function obtenerMensajesGrupo(ChatGrupo $grupo)
    {
        $this->authorize('view', $grupo);
        
        $mensajes = $grupo->mensajes()
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get();
        
        // Actualizar último visto
        $grupo->miembros()->updateExistingPivot(Auth::id(), [
            'ultimo_visto' => now()
        ]);
        
        return response()->json($mensajes);
    }
    
    public function contadorNoLeidos()
    {
        $noLeidos = ChatMessage::noLeidos(Auth::id())->count();
        
        return response()->json(['no_leidos' => $noLeidos]);
    }
}
```

#### **5. Frontend (React + Laravel Echo)**
```tsx
// resources/js/Pages/Admin/Chat/Index.tsx
import { useEffect, useState } from 'react';
import Echo from 'laravel-echo';

export default function Chat() {
    const [mensajes, setMensajes] = useState([]);
    const [mensaje, setMensaje] = useState('');
    
    useEffect(() => {
        // Suscribirse al canal privado
        window.Echo.private(`chat.user.${userId}`)
            .listen('NuevoMensajeChat', (e) => {
                setMensajes(prev => [...prev, e.mensaje]);
                // Mostrar notificación browser
                new Notification('Nuevo mensaje', {
                    body: e.mensaje.mensaje,
                    icon: '/icon-chat.png'
                });
            });
        
        return () => {
            window.Echo.leave(`chat.user.${userId}`);
        };
    }, []);
    
    const enviarMensaje = async () => {
        await axios.post('/api/chat/mensaje', {
            destinatario_id: destinatarioId,
            mensaje
        });
        setMensaje('');
    };
    
    return (
        <div className="flex h-screen">
            {/* Lista de conversaciones */}
            <div className="w-1/3 bg-gray-100">
                {/* ... */}
            </div>
            
            {/* Mensajes */}
            <div className="w-2/3 flex flex-col">
                {/* Header */}
                <div className="p-4 bg-white border-b">
                    <h2>{destinatario.name}</h2>
                </div>
                
                {/* Mensajes */}
                <div className="flex-1 overflow-y-auto p-4">
                    {mensajes.map(msg => (
                        <div key={msg.id} className={msg.user_id === userId ? 'text-right' : ''}>
                            <div className="inline-block bg-blue-500 text-white rounded-lg px-4 py-2">
                                {msg.mensaje}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                {msg.created_at}
                            </div>
                        </div>
                    ))}
                </div>
                
                {/* Input */}
                <div className="p-4 bg-white border-t">
                    <input
                        value={mensaje}
                        onChange={(e) => setMensaje(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && enviarMensaje()}
                        className="w-full px-4 py-2 border rounded"
                        placeholder="Escribe un mensaje..."
                    />
                </div>
            </div>
        </div>
    );
}
```

---

### **Fase 3: Clientes Mejorados** (Prioridad BAJA) 👥

**Nota:** En Laravel actual, las "Notarías" son los "clientes". Si se necesita un sistema de clientes adicional:

#### **Opción A: Extender modelo Notaria**
Agregar campos faltantes a `notarias`:
- CURP, RFC
- Datos de nacimiento
- Identificación (INE, Pasaporte)
- Estado civil
- Actividad económica

#### **Opción B: Crear tabla `clientes` separada**
Para diferenciar entre:
- **Notarías:** Clientes del servicio de compliance
- **Clientes:** Personas que manejan las notarías (otorgantes, etc.)

**Recomendación:** Esperar feedback del usuario sobre si realmente necesita este módulo.

---

## 🚀 Resumen de Implementación

### **Lo que SÍ necesitamos migrar:**
✅ **Sistema de Alarmas/Recordatorios** - Completo  
✅ **Sistema de Chat Interno** - Completo  
⚠️ **Clientes extendidos** - Evaluar necesidad real

### **Lo que NO migramos (ya está en .NET):**
❌ Expedientes, Escrituras, Trámites  
❌ Recibos, Facturas  
❌ Control bancario  
❌ Dependencias notariales  
❌ Reportes notariales

### **Orden de Implementación:**
```
1. Sistema de Alarmas (1-2 días)
   - Migración + Modelo + Controller + Comando + Notificaciones + UI
   
2. Emails de Notificación OPCIÓN A (0.5 días)
   - Completar emails de suscripciones y límites
   
3. PDF Facturas básicas (0.5 días)
   - Template básico para suscripciones
   
4. Sistema de Chat (2-3 días)
   - Opcional: solo si es crítico para gestión interna
   - Requiere setup de Laravel Echo + Pusher/Soketi
```

### **Tiempo Total Estimado:**
- **MVP OPCIÓN A:** 2 días (solo alarmas + emails + PDF)
- **MVP OPCIÓN A + Chat:** 4-5 días

---

## 🔍 Próximos Pasos

**Preguntas para el usuario:**

1. **¿Confirmas que solo necesitan Alarmas y Chat del sistema VB?**
   - O hay otras funcionalidades?

2. **¿Sistema de Chat es crítico?**
   - El chat requiere más tiempo (WebSockets)
   - ¿Pueden usar otro sistema (Slack, Teams) temporalmente?

3. **¿Necesitan sistema de Clientes extendido?**
   - ¿Las Notarías son sus únicos clientes?
   - ¿O necesitan gestionar personas físicas/morales adicionales?

4. **¿Acceso a la BD `sistemaatinet` está disponible?**
   - Para migrar datos históricos de alarmas
   - Para migrar historial de chat (si es necesario)

5. **¿Quieren mantener compatibilidad con sistema VB?**
   - ¿Usuarios usarán ambos sistemas en paralelo?
   - ¿O migran 100% a Laravel?

---

**🎯 Recomendación Final:**

Implementar **OPCIÓN A + Sistema de Alarmas**:
- Tiempo: 2.5 días
- Cubre necesidades críticas inmediatas
- Chat puede esperar o usar herramienta terceros
- Permite lanzar MVP funcional rápidamente
