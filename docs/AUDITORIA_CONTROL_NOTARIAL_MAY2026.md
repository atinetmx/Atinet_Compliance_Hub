# Auditoría Control Notarial — 22 Mayo 2026

## Contexto

Auditoría realizada post-merge de la rama `dev-alex` hacia `master` (commit `c2fc431`).
Se detectaron y corrigieron inconsistencias que quedaron en el merge, con énfasis en el
módulo de Alta de Expedientes / Inmuebles.

---

## Cambios realizados

### 1. `PresupuestoPrevio/Index.tsx` — ReferenceError por estado huérfano

**Problema:** La llamada `setLoginModalOpen(true)` en `fetchPresupuestos` hacía referencia a un
estado que fue eliminado durante la resolución del merge. Causaba un `ReferenceError` en runtime
cuando el JWT de C# expiraba estando en esa vista.

**Corrección:** Se eliminó la llamada `setLoginModalOpen(true)`. El hook `useAuthGuard` ya maneja el
re-login silencioso internamente — es el patrón estándar del módulo.

---

### 2. `FormatosIlimitados/Index.tsx` — Patrón de autenticación antiguo mezclado

**Problema:** El archivo mezclaba el patrón viejo (`LoginModal` + estado `loginModalOpen`) con el
nuevo (`useAuthGuard`). El `<LoginModal>` estaba renderizado con `open={false}` hardcodeado, por lo
que nunca se abría aunque se llamara `setLoginModalOpen(true)` en 6 lugares. Los errores de sesión
expirada eran silenciosos para el usuario.

**Corrección:**
- Eliminado `import LoginModal from '@/components/Modals/LoginModal'`
- Eliminado estado `const [loginModalOpen, setLoginModalOpen] = useState(false)`
- Reemplazado `useAuthGuard({ onUnauthorized: () => { setLoginModalOpen(true); addToast(...) } })` por `useAuthGuard()` sin argumentos
- Eliminado `onUnauthorized: () => setLoginModalOpen(true)` de los 5 lugares en `handleControlNotarialResponse`
- Eliminado `<LoginModal open={false} onOpenChange={() => {}} />` del JSX

**Correcciones adicionales en este archivo:**
- `response.status` → `response.statusCode`
- `response.data` → `response.dataResponse`
- `response?.data?.message` → `response?.message`

  (Las tres propiedades no existen en `ApiResponse<T>` — residuo del merge.)

---

### 3. `Reportes/Index.tsx` — Toasts silenciados y sin autenticación

**Problema:** El componente tenía una función local `addToast` que solo ejecutaba `console.log`,
sin conectar el `useToast()` real. Los errores y confirmaciones del módulo de Reportes nunca eran
visibles para el usuario. Tampoco usaba `useAuthGuard`, por lo que un 401 solo se registraba en
consola sin feedback visual.

**Corrección:**
- Agregado `import { useAuthGuard } from '@/hooks/useAuthGuard'`
- Agregado `import { useToast } from '@/contexts/ToastContext'`
- Reemplazada la función local `addToast` por `const { addToast } = useToast()`
- Agregado `const { isReady } = useAuthGuard()`
- `useEffect` de carga ahora espera `isReady` antes de hacer fetch
- Cuando `isUnauthorized`, se retorna sin llamar `addToast` (lo maneja `useAuthGuard`)
- Importado `BreadcrumbItem` desde `@/types` (eliminada interfaz local con `href?` opcional que
  era incompatible con `AppLayout`)

---

### 4. `Recibos/Expediente/Index.tsx` — Estado muerto y sin autenticación

**Problema:** El archivo tenía `const [loginModalOpen, setLoginModalOpen] = useState(false)` como
estado muerto (declarado pero nunca usado en JSX). No usaba `useAuthGuard` ni manejaba
`isUnauthorized`. El import de `handleControlNotarialResponse` estaba presente pero no se aplicaba
en `fetchExpedientes`.

**Corrección:**
- Eliminado estado `loginModalOpen`
- Eliminado `import { handleControlNotarialResponse }`
- Agregado `import { useAuthGuard } from '@/hooks/useAuthGuard'` y llamada `useAuthGuard()`
- Agregado check `if (response?.isUnauthorized)` en `fetchExpedientes` con limpieza de estado

---

### 5. `InmueblesForm.tsx` — Tipos de inputs incorrectos ⚠️ CRÍTICO PARA CREAR INMUEBLE

**Este es el cambio más relevante para el bug de creación de inmuebles.**

**Contexto:** La interfaz `FormInmuebleData` define todos sus campos como `string`. Sin embargo,
8 inputs del formulario tenían `type="number"` en el HTML. Esto tiene dos efectos directos:

1. **El navegador bloquea el ingreso** de caracteres alfanuméricos (guiones, letras, espacios).
   Un usuario no puede escribir `"A-1234"` o `"III"` en un campo `type="number"`.
2. **React puede enviar `""` o `NaN`** al intentar leer el valor de un input numérico vacío,
   en lugar del string vacío esperado por la interfaz — lo que puede provocar que el payload
   enviado a la API de C# tenga campos con tipos incorrectos y el servidor rechace la operación.

**Campos corregidos (`type="number"` → `type="text"`):**

| Campo en interfaz | Label en UI | Razón del cambio |
|---|---|---|
| `ctaAgua` | Cta Agua | Número de cuenta: puede contener guiones y letras (ej. `"MEX-00123-4"`) |
| `ctaPredial` | Cta Predial | Número de cuenta predial: puede contener guiones y letras |
| `folioInicial` | Folio Inicial | Folio registral: alfanumérico (ej. `"F-001"`) |
| `folioFinal` | Folio Final | Folio registral: alfanumérico |
| `folioElectronico` | Folio Electrónico | Puede contener guiones y prefijos |
| `partida` | Partida | Partida registral: puede ser alfanumérica |
| `volumen` | Volumen | Puede ser número romano (ej. `"I"`, `"III"`, `"XIV"`) |
| `seccion` | Sección | Puede ser alfanumérico |

**Campos que se mantienen como `type="number"` (valores exclusivamente numéricos):**

| Campo | Label en UI |
|---|---|
| `valorAvaluo` | Valor Avalúo |
| `valorCatastral` | Valor Catastral |
| `valorOperacion` | Valor Operación |
| `superficieTerreno` | Superficie del Terreno |
| `superficieConstruida` | Superficie Construida |
| `montoTotal` | Monto Total |

---

## Estado de la auditoría

| # | Problema | Archivo | Estado |
|---|---|---|---|
| 1 | `setLoginModalOpen` huérfano → crash | `PresupuestoPrevio/Index.tsx` | ✅ Corregido |
| 2 | `LoginModal` hardcodeado `open={false}` | `FormatosIlimitados/Index.tsx` | ✅ Corregido |
| 3 | Propiedades inexistentes en `ApiResponse` | `FormatosIlimitados/Index.tsx` | ✅ Corregido |
| 4 | Toasts silenciados, sin `useAuthGuard` | `Reportes/Index.tsx` | ✅ Corregido |
| 5 | Estado muerto, sin `useAuthGuard` | `Recibos/Expediente/Index.tsx` | ✅ Corregido |
| 6 | 8 inputs con `type="number"` incorrectos | `InmueblesForm.tsx` | ✅ Corregido |
| 7 | Vistas `Escrituras` y `Presupuestos` inexistentes | Controller + rutas | 🔴 Pendiente |
| 8 | Link a "Reportes" ausente en sidebar | `app-sidebar.tsx` | 🟡 Pendiente |
| 9 | Archivo `Index.tsx.backup` en repo | `AltaExpedientes/` | 🟡 Pendiente |
| 10 | Dos imports en una línea (merge residuo) | `ReporteUsuarios/Index.tsx` | 🟡 Pendiente |
