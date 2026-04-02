# 📚 Sistema de Documentación para Usuarios Finales

## 🎯 Objetivo

Proporcionar a los usuarios finales (notarios, administradores de notaría, usuarios) un **manual de usuario integrado** en el sistema que les permita aprender a usar todas las funcionalidades sin necesidad de documentación externa.

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
   - 3 pasos numerados:
     1. Acceso al Sistema
     2. Navegación del Sistema
     3. Tu Primera Búsqueda

### ⏳ Secciones Pendientes

Todas las demás secciones están **estructuradas pero sin contenido**. Se irán completando a medida que se revisen las vistas del sistema.

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
- [ ] FAQ básicas

### Fase 2: Módulos Core (En progreso)
- [ ] Gestión de Usuarios (completa)
- [ ] Suscripciones (completa)
- [ ] Listas Negras OFAC/SAT (completa)

### Fase 3: Módulos Avanzados
- [ ] Agenda Web
- [ ] Control Notarial
- [ ] Registro Web
- [ ] Reportes
- [ ] Configuración

### Fase 4: Mejoras Interactivas (Futuro)
- [ ] Búsqueda funcional
- [ ] Videos/GIFs demostrativos
- [ ] Tours interactivos (Opción 4)
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

**Fecha de implementación inicial:** 1 de abril, 2026  
**Última actualización:** 1 de abril, 2026  
**Estado:** En desarrollo activo  
**Responsable:** Equipo de Desarrollo Atinet
