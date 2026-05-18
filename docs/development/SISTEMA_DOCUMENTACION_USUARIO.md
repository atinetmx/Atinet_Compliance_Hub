# 📚 Sistema de Documentación para Usuarios Finales

## 🎯 Objetivo

Proporcionar a los usuarios finales (notarios, administradores de notaría, usuarios) un **manual de usuario integrado** en el sistema que les permita aprender a usar todas las funcionalidades sin necesidad de documentación externa.

## 📅 Última Actualización: 2 de Abril, 2026

---

## 📋 Características Implementadas

### 1. Vista Interactiva React

- **Ruta:** `/admin/documentacion`
- **Componente:** `resources/js/pages/Admin/Documentation/Index.tsx`
- **Controlador:** `app/Http/Controllers/Admin/DocumentationController.php`

### 2. Navegación por Módulos

El sistema incluye una **sidebar de navegación** con todas las secciones del manual:

```
📖 Manual de Usuario
  ├─ 🏠 Introducción
  ├─ ▶️ Primeros Pasos (Nuevo)
  ├─ 👤 Gestión de Usuarios
  │   ├─ Crear Usuario
  │   ├─ Editar Usuario
  │   └─ Roles y Permisos
  ├─ 💳 Suscripciones
  │   ├─ Crear Suscripción
  │   ├─ Múltiples Suscripciones (Nuevo)
  │   └─ Renovar Suscripción
  ├─ 🛡️ Listas Negras OFAC/SAT
  │   ├─ Realizar Búsqueda
  │   ├─ Ver Historial
  │   └─ Exportar Resultados
  ├─ 📅 Agenda Web
  │   ├─ Crear Evento
  │   └─ Compartir Agenda
  ├─ 🔵 Registro Web
  ├─ ⚖️ Control Notarial
  │   ├─ Expedientes
  │   ├─ Presupuesto Previo
  │   └─ Configuración
  ├─ 📊 Reportes
  ├─ ⚙️ Configuración
  └─ ❓ Preguntas Frecuentes
```

### 3. Buscador Integrado

- Campo de búsqueda en la sidebar
- Permite encontrar temas rápidamente
- (Funcionalidad completa pendiente)

### 4. Feedback del Usuario

- Botones "👍 Sí" / "👎 No" al final de cada página
- Permite medir utilidad de la documentación
- (Tracking de respuestas pendiente)

---

## 🏗️ Arquitectura Técnica

### Backend

**Controlador: `DocumentationController.php`**
```php
namespace App\Http\Controllers\Admin;

class DocumentationController extends Controller
{
    public function index(Request $request)
    {
        $section = $request->query('section', 'introduccion');
        
        return Inertia::render('Admin/Documentation/Index', [
            'currentSection' => $section,
        ]);
    }
}
```

**Ruta: `routes/web.php`**
```php
Route::get('documentacion', [DocumentationController::class, 'index'])
    ->name('documentation.index');
```

### Frontend

**Componente: `Documentation/Index.tsx`**

Estructura:
- **Sidebar izquierda:** Navegación por secciones y subsecciones
- **Contenido principal:** Contenido de la sección activa
- **ScrollArea:** Para scroll independiente en sidebar y contenido

**Navegación:**
```typescript
const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);
    router.get(`/admin/documentacion?section=${sectionId}`, 
        {}, 
        { preserveState: true }
    );
};
```

**Contenido:**
```typescript
const sectionContent: Record<string, { title: string; content: React.ReactNode }> = {
    introduccion: { ... },
    'primeros-pasos': { ... },
    // Más secciones...
};
```

---

## 📝 Contenido Implementado

### ✅ Secciones Completadas

1. **Introducción**
   - Descripción del sistema
   - Módulos principales (cards visuales)
   - CTA a "Primeros Pasos"

2. **Primeros Pasos**
   - Guía de inicio rápido
   - 3 pasos numerados

3. **Gestión de Servicios** ✅ _(sesión 2 de abril 2026)_
   - Catálogo de Servicios
   - Crear Servicio (con generación automática de código)
   - Editar Servicio
   - Ver Detalles
   - Manual con 4 subsecciones

4. **Gestión de Planes** ✅ _(sesión 2 de abril 2026)_
   - Catálogo de Planes
   - Crear Plan
   - Editar Plan
   - Ver Detalles
   - Configurar Servicios del Plan
   - Manual con 5 subsecciones

5. **Gestión de Notarías** ✅ _(sesión 2 de abril 2026)_
   - Catálogo de Notarías
   - Crear Notaría
   - Editar Notaría
   - Ver Detalles
   - Configurar Servicios Personalizados
   - **Eliminar / Inhabilitar Notaría** _(nueva subsección)_

6. **Gestión de Usuarios** ✅ _(sesión 6 de abril 2026)_
   - Catálogo de Usuarios
   - Crear Usuario
   - Editar Usuario
   - Ver Detalles del Usuario
   - Reportes de Usuarios
   - Filtros y Búsqueda
   - Manual con 6 subsecciones

7. **Listas Negras OFAC/SAT** ✅ _(sesión 6 de abril 2026)_
   - Realizar Búsqueda (4 tipos)
   - Búsqueda Persona Física
   - Búsqueda Persona Moral
   - Búsqueda por RFC
   - Búsqueda Combinada
   - Ver Historial de Búsquedas
   - Exportar PDFs profesionales
   - Estadísticas de Uso
   - Manual con 8 subsecciones

### ⏳ Secciones Pendientes

- [ ] Agenda Web
- [ ] Control Notarial
- [ ] Registro Web
- [ ] Reportes
- [ ] Configuración
- [ ] FAQ

---

## 🗂️ Estructura de Navegación Actual

```
📖 Manual de Usuario
  ├─ 🏠 Introducción
  ├─ ▶️ Primeros Pasos
  ├─ 📦 Gestión de Servicios
  │   ├─ Catálogo de Servicios
  │   ├─ Crear Servicio
  │   ├─ Editar Servicio
  │   └─ Ver Detalles
  ├─ 💳 Gestión de Planes
  │   ├─ Catálogo de Planes
  │   ├─ Crear Plan
  │   ├─ Editar Plan
  │   ├─ Ver Detalles
  │   └─ Configurar Servicios
  ├─ 🏛️ Gestión de Notarías
  │   ├─ Catálogo de Notarías
  │   ├─ Crear Notaría
  │   ├─ Editar Notaría
  │   ├─ Ver Detalles
  │   ├─ Configurar Servicios
  │   └─ Eliminar / Inhabilitar ← NUEVO
  ├─ 👤 Gestión de Usuarios
  │   ├─ Catálogo de Usuarios
  │   ├─ Crear Usuario
  │   ├─ Editar Usuario
  │   ├─ Ver Detalles
  │   ├─ Reportes de Usuarios
  │   └─ Filtros y Búsqueda
  ├─ 🔑 Suscripciones           (pendiente)
  ├─ 🛡️ Listas Negras OFAC/SAT
  │   ├─ Realizar Búsqueda
  │   ├─ Búsqueda Persona Física
  │   ├─ Búsqueda Persona Moral
  │   ├─ Búsqueda por RFC
  │   ├─ Búsqueda Combinada
  │   ├─ Ver Historial
  │   ├─ Exportar PDFs
  │   └─ Estadísticas de Uso
  ├─ 📅 Agenda Web              (pendiente)
  ├─ ⚖️ Control Notarial        (pendiente)
  ├─ 🔵 Registro Web            (pendiente)
  ├─ 📊 Reportes                (pendiente)
  ├─ ⚙️ Configuración           (pendiente)
  └─ ❓ Preguntas Frecuentes    (pendiente)
```

---

## 🎨 Diseño Visual

### Componentes UI Utilizados

- **Card:** Para presentar módulos y pasos
- **Badge:** Para marcar secciones "Nuevo"
- **Button:** Navegación y acciones
- **ScrollArea:** Scroll independiente
- **Separator:** Divisores visuales

### Esquema de Colores

- **Activo/Principal:** Amarillo ámbar (`amber-100`, `amber-600`)
- **Informativo:** Azul (`blue-50`, `blue-600`)
- **Advertencia:** Amarillo (`amber-50`, `amber-600`)

### Estados Visuales

```tsx
// Sección activa
className="bg-amber-100 dark:bg-amber-900/30 text-amber-900"

// Subsección activa
className="bg-amber-50 dark:bg-amber-900/20"

// Hover
className="hover:bg-amber-500/80 hover:text-amber-50"
```

---

## 🔄 Integración con el Sistema

### Sidebar Global

**Archivo: `app-sidebar.tsx`**

```typescript
const footerNavItems: NavItem[] = [
    {
        title: 'Documentación',
        href: '/admin/documentacion',
        icon: BookOpen,
    },
];
```

### Breadcrumbs

```typescript
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Documentación',
        href: '/admin/documentacion',
        icon: BookOpen,
    },
];
```

---

## 🚀 Roadmap de Contenido

### Fase 1: Contenido Básico ✅
- [x] Introducción
- [x] Primeros Pasos

### Fase 2: Módulos Admin (En progreso)
- [x] Gestión de Servicios ✅
- [x] Gestión de Planes ✅
- [x] Gestión de Notarías (incluyendo Eliminar/Inhabilitar) ✅
- [x] Gestión de Usuarios
- [x] Suscripciones

### Fase 3: Módulos Notaría
- [x] Listas Negras OFAC/SAT ✅
- [ ] Agenda Web
- [ ] Control Notarial
- [ ] Registro Web
- [ ] Reportes
- [ ] Configuración
- [ ] FAQ

### Fase 4: Mejoras Interactivas (Futuro)
- [ ] Búsqueda funcional
- [ ] Videos/GIFs demostrativos
- [ ] Tours interactivos
- [ ] Exportar a PDF
- [ ] Tracking de feedback

---

## 🎬 Opción 4: Ayuda Contextual (Planificado)

### Características Futuras

1. **Tours Guiados (Wizards)**
   - Tour de bienvenida para nuevos usuarios
   - Tours específicos por módulo
   - Destacar botones y campos importantes

2. **Tooltips Informativos**
   - Ayuda en hover sobre campos complejos
   - Explicaciones de validaciones
   - Tips rápidos

3. **Biblioteca Sugerida: Shepherd.js o Intro.js**
   ```bash
   npm install shepherd.js
   ```

4. **Implementación Ejemplo:**
   ```typescript
   const tour = new Shepherd.Tour({
       useModalOverlay: true,
       defaultStepOptions: {
           cancelIcon: { enabled: true },
           classes: 'shadow-md bg-purple-dark',
       }
   });
   
   tour.addStep({
       id: 'crear-suscripcion',
       text: 'Aquí puedes crear una nueva suscripción para la notaría',
       attachTo: {
           element: '#btn-crear-suscripcion',
           on: 'bottom'
       },
       buttons: [
           { action: tour.next, text: 'Siguiente' }
       ]
   });
   ```

---

## 📊 Estrategia de Contenido

### Principios de Redacción

1. **Lenguaje simple y claro**
   - Evitar tecnicismos innecesarios
   - Usar ejemplos prácticos
   - Paso a paso numerado

2. **Visual y esquemático**
   - Cards para agrupar información
   - Listas claras (✅ / ❌)
   - Screenshots cuando sea necesario

3. **Progresivo**
   - De lo simple a lo complejo
   - Enlaces entre secciones relacionadas
   - Rutas de aprendizaje sugeridas

### Proceso de Creación de Contenido

**Al revisar cada vista del sistema:**

1. Capturar screenshots de la vista
2. Documentar flujo de uso paso a paso
3. Identificar puntos de confusión comunes
4. Agregar ejemplos reales
5. Actualizar sección correspondiente en `Index.tsx`

---

## 🛠️ Mantenimiento

### Cómo Agregar una Nueva Sección

1. **Agregar a `docSections`:**
```typescript
{
    id: 'nueva-seccion',
    title: 'Nueva Sección',
    icon: IconName,
    badge: 'Nuevo',
    subsections: [...]
}
```

2. **Agregar contenido a `sectionContent`:**
```typescript
'nueva-seccion': {
    title: 'Título de la Nueva Sección',
    content: (
        <div className="space-y-6">
            {/* Contenido aquí */}
        </div>
    ),
}
```

3. **Compilar assets:**
```bash
npm run build
```

### Actualizar Contenido Existente

Simplemente editar el objeto `sectionContent` en `Index.tsx` y recompilar.

---

## ✅ Checklist de Implementación

- [x] Crear `DocumentationController`
- [x] Agregar ruta `/admin/documentacion`
- [x] Crear componente `Documentation/Index.tsx`
- [x] Implementar navegación por secciones
- [x] Agregar contenido de "Introducción"
- [x] Agregar contenido de "Primeros Pasos"
- [x] Actualizar sidebar global
- [x] Agregar buscador (UI solamente)
- [x] Agregar botones de feedback (UI solamente)
- [ ] **PENDIENTE:** Completar contenido de todas las secciones
- [ ] **PENDIENTE:** Implementar funcionalidad de búsqueda
- [ ] **PENDIENTE:** Implementar tracking de feedback
- [ ] **PENDIENTE:** Agregar screenshots
- [ ] **PENDIENTE:** Implementar tours interactivos (Opción 4)
- [ ] **PENDIENTE:** Exportar a PDF

---

---

## 📝 Contenido Detallado por Módulo

### 👤 Gestión de Usuarios

#### 📊 Catálogo de Usuarios

**Ruta:** `/admin/users`

**Descripción:**
Vista principal que muestra el listado completo de todos los usuarios registrados en el sistema.

**Características:**
- ✅ **Búsqueda en Tiempo Real:** Campo de búsqueda con debounce (500ms) que filtra por nombre o email
- ✅ **Filtros Avanzados:**
  - Por tipo de cuenta (Super Admin, Admin Notaría, Usuario Notaría, Invitado)
  - Por notaría asignada
- ✅ **Tabla de Usuarios** con columnas:
  - Usuario (nombre + ID)
  - Email
  - Tipo de Cuenta (badge con colores)
  - Notaría (con número y nombre)
  - Estado (Verificado/Pendiente)
  - Acciones (Ver, Editar, Eliminar)
- ✅ **Paginación:** Navegación por páginas con información de registros
- ✅ **Botones de Acción:**
  - "Nuevo Usuario" - Crear nuevo usuario
  - "Ver Reportes" - Ir a panel de reportes
  - "Limpiar" - Restablecer filtros

**Colores de Badges por Tipo de Cuenta:**
- 🔴 **Super Admin:** Rojo (bg-red-100)
- 🔵 **Admin Notaría:** Azul (bg-blue-100)
- 🟢 **Usuario Notaría:** Verde (bg-green-100)
- ⚪ **Invitado:** Gris (bg-gray-100)

**Restricciones:**
- ❌ No se puede eliminar usuarios con tipo "super_admin"

---

#### ➕ Crear Usuario

**Ruta:** `/admin/users/create`

**Descripción:**
Formulario para dar de alta un nuevo usuario en el sistema.

**Campos Requeridos:**
1. **Nombre** * (obligatorio)
   - Nombre completo del usuario
   - Placeholder: "Nombre completo del usuario"

2. **Email** * (obligatorio)
   - Correo electrónico único
   - Formato: email@example.com
   - Se valida que no exista previamente

3. **Tipo de Cuenta** * (obligatorio)
   - Super Administrador
   - Admin Notaría
   - Usuario Notaría
   - Invitado
   - Valor por defecto: "Usuario Notaría"

4. **Notaría Asignada** (opcional para super_admin e invitado)
   - Lista desplegable con todas las notarías
   - Formato: "Número - Nombre de la notaría"
   - **Nota:** Los usuarios de tipo Admin Notaría y Usuario Notaría requieren una notaría asignada

5. **Contraseña** * (obligatorio)
   - Mínimo 8 caracteres
   - Campo tipo password
   - Placeholder: "Mínimo 8 caracteres"

6. **Confirmar Contraseña** * (obligatorio)
   - Debe coincidir con la contraseña
   - Validación en tiempo real

**Botones:**
- 🔙 **Volver:** Regresa al catálogo de usuarios
- 💾 **Guardar:** Crea el usuario y redirige al catálogo
  - Muestra spinner al procesar: "Creando..."

**Validaciones:**
- Email único en el sistema
- Contraseñas deben coincidir
- Mínimo 8 caracteres en contraseña
- Admin Notaría y Usuario Notaría requieren notaría asignada

---

#### ✏️ Editar Usuario

**Ruta:** `/admin/users/{id}/edit`

**Descripción:**
Formulario para modificar la información de un usuario existente.

**Campos Editables:**
1. **Nombre**
2. **Email** (se valida que sea único excepto para el usuario actual)
3. **Tipo de Cuenta**
4. **Notaría Asignada**
5. **Contraseña** (opcional)
   - Si se deja vacío, no se modifica
   - Si se llena, requiere confirmación
   - Mínimo 8 caracteres

**Comportamiento:**
- Los campos vienen pre-llenados con la información actual
- El cambio de contraseña es opcional
- Se puede cambiar el tipo de cuenta
- Se puede reasignar a otra notaría

**Botones:**
- 🔙 **Volver:** Regresa al catálogo
- 💾 **Actualizar:** Guarda los cambios

**Validaciones:**
- Mismas que en crear
- Email único (excepto el propio usuario)
- Si se modifica la contraseña, debe cumplir requisitos mínimos

---

#### 👁️ Ver Detalles del Usuario

**Ruta:** `/admin/users/{id}`

**Descripción:**
Vista de solo lectura que muestra toda la información del usuario y sus estadísticas de uso.

**Secciones:**

**1. Información del Usuario**
- ✉️ **Email:** Correo electrónico del usuario
- 🛡️ **Tipo de Cuenta:** Badge con color según el tipo
- 📅 **Email Verificado:** Fecha y hora de verificación (formato español)
- 🏢 **Notaría Asignada:** Número y nombre de la notaría (si aplica)
- 📆 **Fecha de Creación:** Cuándo se registró en el sistema

**2. Estadísticas de Uso**
- 🔍 **Total de Búsquedas:** Búsquedas OFAC/SAT realizadas históricamente
- 📊 **Búsquedas del Mes:** Búsquedas en el mes actual

**3. Información de Notaría** (si tiene asignada)
- Número de notaría
- Nombre completo
- Link para ver detalles de la notaría

**Botones:**
- 🔙 **Volver:** Regresa al catálogo
- ✏️ **Editar Usuario:** Va a la vista de edición

---

#### 📊 Reportes de Usuarios

**Ruta:** `/admin/users/reports`

**Descripción:**
Panel de análisis y estadísticas de todos los usuarios del sistema.

**Métricas Principales (Cards):**

1. **Total Usuarios** 👥
   - Contador total de usuarios registrados
   - Icono: Users (azul)

2. **Usuarios Activos** ✅
   - Usuarios con email verificado
   - Icono: UserCheck (verde)

3. **Registros Recientes** 📅
   - Usuarios registrados en los últimos 30 días
   - Icono: Calendar (morado)

4. **Tipos de Cuenta** 🛡️
   - Cantidad de tipos de cuenta diferentes
   - Icono: Shield (amarillo)

**Sección: Usuarios por Tipo de Cuenta**
- Lista visual con badges de colores
- Muestra cantidad por cada tipo
- Porcentaje respecto al total
- Barra de progreso visual

**Sección: Usuarios por Notaría**
- Lista de notarías con su cantidad de usuarios
- Formato: "Notaría #X - Nombre (N usuarios)"
- Icono de edificio (Building2)
- Ordenado por cantidad de usuarios

**Botón:**
- 🔙 **Volver:** Regresa al catálogo de usuarios

---

#### 🔍 Uso de Filtros y Búsqueda

**Búsqueda Dinámica:**
1. Escribir en el campo de búsqueda (icono de lupa)
2. La tabla se filtra automáticamente después de 500ms
3. Busca en: nombre y email del usuario
4. Mantiene los filtros aplicados

**Aplicar Filtros:**
1. Click en botón "Filtros"
2. Se despliega panel con opciones:
   - **Tipo de Cuenta:** Dropdown con todos los tipos
   - **Notaría:** Dropdown con todas las notarías
3. Los filtros se aplican automáticamente (sin botón submit)
4. Se pueden combinar búsqueda + filtros

**Limpiar Filtros:**
1. Aparece botón "Limpiar" cuando hay filtros activos
2. Click en "Limpiar" para restablecer vista original
3. Se mantiene la paginación
### 🛡️ Listas Negras OFAC/SAT

#### 🔍 Realizar Búsqueda

**Ruta:** `/admin/listas-negras`

**Descripción:**
Módulo principal para realizar búsquedas en las listas negras de OFAC (Office of Foreign Assets Control - Estados Unidos) y SAT (Lista del Artículo 69-B - México).

**Pestañas de Búsqueda:**

El sistema ofrece **4 tipos de búsqueda** mediante tabs:

1. **🧑 Persona Física**
2. **🏢 Persona Moral**
3. **📄 Búsqueda por RFC**
4. **🔄 Búsqueda Combinada**

---

#### 🧑 Búsqueda Persona Física

**Descripción:**
Búsqueda de individuos (personas físicas) en las listas OFAC.

**Campos:**
- **Nombre Completo** * (obligatorio)
  - Placeholder: "Ej: Juan Pérez García"
  - Se busca coincidencia parcial o total
  - Permite nombres con acentos y caracteres especiales

**Proceso de Búsqueda:**
1. Ingresar el nombre de la persona a buscar
2. Click en "Buscar en OFAC"
3. El sistema muestra:
   - Spinner de carga con mensaje: "Buscando..."
   - Resultados con porcentaje de similitud
   - Información detallada de cada coincidencia

**Resultados Mostrados:**
- 🔴 **Alert si hay coincidencias:** "Se encontraron X coincidencias en OFAC"
- 🟢 **Alert si no hay coincidencias:** "No se encontraron coincidencias"
- **Cards de resultados** con:
  - Nombre completo
  - Porcentaje de similitud (%)
  - Tipo de sanción
  - Detalles adicionales
  - Botón "Descargar PDF" individual

**Botón de Descarga:**
- 📄 **Generar PDF:** Crea reporte profesional con:
  - Logo corporativo
  - Fecha y hora de la búsqueda
  - Término buscado
  - Tabla de resultados
  - Legal disclaimer
  - Fuentes consultadas

---

#### 🏢 Búsqueda Persona Moral

**Descripción:**
Búsqueda de empresas y organizaciones (personas morales) en las listas OFAC.

**Campos:**
- **Razón Social / Empresa** * (obligatorio)
  - Placeholder: "Ej: Acme Corporation S.A. de C.V."
  - Búsqueda por nombre comercial o razón social
  - Admite siglas y abreviaturas

**Proceso:**
Identical al de Persona Física, pero optimizado para nombres de empresas.

**Resultados:**
Misma estructura que Persona Física, con información específica de entidades:
- Nombre de la empresa
- País de origen
- Tipo de sanción
- Fecha de publicación en OFAC
- Detalles adicionales

---

#### 📄 Búsqueda por RFC

**Descripción:**
Búsqueda directa en la lista del SAT (Artículo 69-B) usando el RFC del contribuyente.

**Campos:**
- **RFC** * (obligatorio)
  - Formato: 12 o 13 caracteres
  - Validación automática de formato
  - Se muestra error si el formato es inválido
  - Ejemplo: "XAXX010101000"

**Validaciones:**
- ✅ Mínimo 12 caracteres
- ✅ Máximo 13 caracteres
- ✅ Solo letras mayúsculas y números
- ❌ Error si no cumple formato

**Resultados de SAT:**
- 🔵 **Badge azul:** "Lista SAT 69-B"
- **Información mostrada:**
  - RFC consultado
  - Situación del contribuyente
  - Fecha de publicación SAT
  - Estado (Definitivo/Presunto)
  - Número de veces publicado

**Botón PDF:**
- Genera reporte específico de SAT
- Incluye artículo 69-B del Código Fiscal
- Disclaimer legal

---

#### 🔄 Búsqueda Combinada

**Descripción:**
Búsqueda simultánea en OFAC y SAT con nombre y RFC opcionales.

**Campos:**
1. **Nombre** * (obligatorio)
   - Nombre de persona física o moral
   - Se busca en OFAC

2. **RFC** (opcional)
   - Si se proporciona, se busca en SAT
   - Debe cumplir formato válido
   - Validación en tiempo real

3. **Tipo de Persona** (selector)
   - 🧑 Persona Física
   - 🏢 Persona Moral
   - Afecta cómo se busca en OFAC

**Proceso de Búsqueda:**
1. Llenar nombre (obligatorio)
2. Opcionalmente agregar RFC
3. Seleccionar tipo de persona
4. Click en "Buscar en OFAC y SAT"
5. Resultados separados por fuente:
   - **Sección OFAC** (si hay resultados)
   - **Sección SAT** (si se proporcionó RFC)

**Resultados Combinados:**
- 🔴 **Sección OFAC:** Cards con coincidencias de OFAC
- 🔵 **Sección SAT:** Cards con coincidencias de SAT
- **Separador visual** entre secciones
- Cada sección tiene su botón "Descargar PDF" independiente

**Ventaja:**
- Consulta completa en una sola búsqueda
- Cumplimiento integral (nacional + internacional)
- Reportes separados para cada fuente

---

#### 📊 Estadísticas de Uso

**Ubicación:** Panel superior de la vista de búsqueda

**Cards de Estadísticas:**

1. **Total de Búsquedas** 📈
   - Contador de búsquedas históricas
   - Icono: TrendingUp (azul)
   - Muestra el acumulado total

2. **Búsquedas Este Mes** 📅
   - Búsquedas del mes en curso
   - Icono: Calendar (verde)
   - Se reinicia cada mes

3. **Búsquedas Esta Semana** 📊
   - Búsquedas de la semana actual
   - Icono: BarChart3 (púrpura)
   - Lunes a domingo

4. **Búsquedas Hoy** 🕐
   - Búsquedas del día actual
   - Icono: Clock (amarillo)
   - Se reinicia a medianoche

**Métricas Adicionales:**
- **Promedio de Resultados:** Promedio de coincidencias por búsqueda
- **Tipo Más Usado:** Tipo de búsqueda más frecuente

**Gráfico de Dispersión:**
- **Título:** "Búsquedas por Tipo y Usuario"
- **Eje X:** Tipo de búsqueda
- **Eje Y:** Usuarios
- **Tamaño:** Cantidad de búsquedas
- **Interactivo:** Tooltip al hacer hover

---

#### 📜 Ver Historial

**Ruta:** `/admin/search-history`

**Descripción:**
Vista completa del historial de todas las búsquedas realizadas en el sistema.

**Tabla de Historial:**

**Columnas:**
1. **Usuario** - Nombre y email del usuario que realizó la búsqueda
2. **Notaría** - Notaría asociada (si aplica)
3. **Tipo de Búsqueda** - Badge con color según tipo:
   - 🔵 Persona Física
   - 🟢 Persona Moral
   - 🟡 RFC
   - 🟣 Combinada
4. **Término Buscado** - Nombre o RFC consultado
5. **Resultados** - Cantidad de coincidencias encontradas
6. **Fecha** - Fecha y hora de la búsqueda (formato español)
7. **Acciones** - Botones para repetir o eliminar

**Filtros Disponibles:**

1. **Tipo de Búsqueda**
   - Dropdown con opciones:
     - Todas
     - Persona Física
     - Persona Moral
     - RFC
     - Combinada

2. **Período**
   - Dropdown con opciones:
     - Últimos 30 días
     - Últimos 7 días
     - Hoy
     - Todo el historial

3. **Término de Búsqueda**
   - Campo de texto libre
   - Búsqueda parcial en términos

**Botones de Acción:**

- 🔁 **Repetir Búsqueda:** Navega a la página de búsqueda con el término precargado
- 🗑️ **Eliminar:** Borra la entrada del historial (confirmación requerida)
- 🔄 **Refrescar:** Recarga el historial
- 📥 **Exportar:** Descarga el historial en formato Excel/CSV

**Paginación:**
- Vista paginada con 20 registros por página
- Navegación estándar: Anterior | Páginas | Siguiente
- Información de registros: "Mostrando X a Y de Z búsquedas"
- Filtros se mantienen al cambiar de página

**Permisos:**
- **Super Admin:** Ve todas las búsquedas del sistema
- **Admin Notaría:** Ve solo búsquedas de su notaría
- **Usuario Notaría:** Ve solo sus propias búsquedas

---

#### 📄 Exportar PDFs

**Descripción:**
Generación automática de reportes profesionales en PDF para cada búsqueda realizada.

**Tipos de PDF:**

1. **PDF OFAC** (Persona Física/Moral)
   - Logo corporativo de la notaría
   - Fecha y hora de emisión (español)
   - Datos de la búsqueda:
     - Tipo (Persona Física/Moral)
     - Nombre buscado
   - **Tabla de resultados:**
     - Nombre completo
     - Porcentaje de similitud
     - Tipo de registro
     - Detalles adicionales
   - **Legal Disclaimer de OFAC**
   - Anexos (A, B, C, D) con información legal
   - Fuentes consultadas

2. **PDF SAT** (Artículo 69-B)
   - Logo corporativo
   - Fecha y hora de emisión
   - RFC consultado
   - **Tabla de resultados:**
     - RFC
     - Estado del contribuyente
     - Situación
     - Fecha de publicación SAT
   - **Texto completo del Artículo 69-B** del Código Fiscal de la Federación
   - Legal disclaimer
   - Fuentes consultadas

3. **PDF Combinado**
   - Se generan DOS archivos separados:
     - Uno para resultados OFAC
     - Uno para resultados SAT
   - Cada uno con su formato específico

**Características de los PDFs:**
- ✅ **UTF-8 completo:** Soporta acentos y caracteres especiales
- ✅ **tFPDF v1.33:** Biblioteca moderna compatible con PHP 8.2+
- ✅ **Formato profesional:** Idéntico al sistema legacy
- ✅ **Descarga automática:** Se descarga al hacer click en botón
- ✅ **Nombre de archivo:** Incluye tipo de búsqueda y fecha

**Formato de Nombre:**
- OFAC: `reporte_ofac_APELLIDO_NOMBRE_YYYYMMDD_HHMMSS.pdf`
- SAT: `reporte_sat_RFC_YYYYMMDD_HHMMSS.pdf`

**Botones de Descarga:**
- 📥 **En resultados de búsqueda:** Botón individual por cada card de resultado
- 📥 **En historial:** Botón para regenerar PDF de búsquedas anteriores

---

**Características Técnicas:**

**Validaciones Frontend:**
- RFC: Formato 12-13 caracteres alfanuméricos
- Nombres: No vacíos, mínimo 3 caracteres
- Trim automático de espacios

**Validaciones Backend:**
- Verificación de suscripción activa
- Servicio "Listas Negras OFAC/SAT" habilitado
- Control de límites de uso
- Logs completos con Activity Log

**Indicadores Visuales:**
- 🔴 **Coincidencias:** Alert rojo con icono de advertencia
- 🟢 **Sin coincidencias:** Alert verde con checkmark
- ⏳ **Cargando:** Spinner con mensaje
- 📊 **Estadísticas:** Cards con iconos de colores

**Performance:**
- Búsqueda en tiempo real (< 2 segundos)
- Debounce en filtros del historial
- Paginación optimizada
- Cache de estadísticas

---

**Fecha de implementación:** Febrero 13, 2026  
**Última actualización:** 6 de abril, 2026  
**Estado:** ✅ Completamente funcional en produccióno X a Y de Z usuarios"
- Botones: Anterior | Números de página | Siguiente
- Se mantienen filtros al cambiar de página

---

**Fecha de implementación inicial:** 1 de abril, 2026  
**Última actualización:** 6 de abril, 2026  
**Estado:** En desarrollo activo  
**Responsable:** Equipo de Desarrollo Atinet
