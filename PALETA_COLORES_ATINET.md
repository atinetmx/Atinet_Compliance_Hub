# Paleta de Colores Atinet

Sistema de colores corporativos de Atinet implementado en el sistema de Listas Negras V2.

## 🎨 Colores Principales

### Modo Light
- **Primary (Azul Atinet)**: `#0066cc` 
  - Uso: Botones principales, enlaces, elementos interactivos
  - OKLCH: `oklch(0.45 0.12 240)`

- **Secondary (Dorado Atinet)**: `#f5d06c`
  - Uso: Elementos secundarios, badges, highlights suaves
  - OKLCH: `oklch(0.85 0.12 85)`

- **Accent (Dorado Brillante)**: `#ffc107`
  - Uso: CTAs importantes, notificaciones, elementos destacados
  - OKLCH: `oklch(0.80 0.15 85)`

### Modo Dark
- **Primary (Azul Claro)**: `#4d9fff`
  - Azul más brillante para mejor contraste en dark mode
  - OKLCH: `oklch(0.60 0.15 240)`

- **Secondary (Dorado Vibrante)**: `#f9d45e`
  - OKLCH: `oklch(0.75 0.15 85)`

- **Accent (Dorado Luminoso)**: `#ffca28`
  - OKLCH: `oklch(0.85 0.18 85)`

## 🌓 Sistema de Temas

### Light Mode
```css
--background: oklch(0.99 0.002 240)    /* Blanco con tinte azul sutil */
--foreground: oklch(0.25 0.015 240)    /* Azul oscuro para texto */
--card: oklch(1 0 0)                    /* Blanco puro */
--border: oklch(0.90 0.01 240)          /* Bordes azul grisáceo */
```

### Dark Mode
```css
--background: oklch(0.18 0.015 240)    /* Azul muy oscuro */
--foreground: oklch(0.95 0.005 240)    /* Blanco azulado */
--card: oklch(0.22 0.015 240)          /* Azul oscuro */
--border: oklch(0.35 0.015 240)         /* Bordes azul oscuro */
```

## 🎯 Sidebar Atinet

### Light Mode
- **Background**: `oklch(0.48 0.12 240)` - Azul corporativo
- **Text**: Blanco
- **Active Item**: Dorado `oklch(0.80 0.15 85)`
- **Hover**: Azul más claro `oklch(0.55 0.12 240)`

### Dark Mode
- **Background**: `oklch(0.25 0.020 240)` - Azul oscuro profundo
- **Text**: Blanco azulado
- **Active Item**: Dorado brillante `oklch(0.85 0.18 85)`
- **Hover**: Azul medio `oklch(0.35 0.020 240)`

## 📊 Colores para Gráficas

### Light Mode
1. **Chart 1**: Azul Atinet `oklch(0.45 0.12 240)`
2. **Chart 2**: Dorado Atinet `oklch(0.80 0.15 85)`
3. **Chart 3**: Azul oscuro `oklch(0.35 0.10 240)`
4. **Chart 4**: Cyan `oklch(0.70 0.12 200)`
5. **Chart 5**: Violeta `oklch(0.65 0.10 270)`

### Dark Mode
1. **Chart 1**: Azul brillante `oklch(0.60 0.15 240)`
2. **Chart 2**: Dorado brillante `oklch(0.85 0.18 85)`
3. **Chart 3**: Cyan brillante `oklch(0.70 0.15 200)`
4. **Chart 4**: Violeta `oklch(0.65 0.15 270)`
5. **Chart 5**: Verde azulado `oklch(0.75 0.12 150)`

## ✅ Estados de Componentes

### Success (Implícito en primary)
- Light: Azul Atinet
- Dark: Azul brillante

### Destructive/Error
- Light: `oklch(0.577 0.245 27.325)` - Rojo
- Dark: `oklch(0.55 0.22 25)` - Rojo suave

### Muted (Texto secundario)
- Light: `oklch(0.50 0.01 240)` - Gris azulado
- Dark: `oklch(0.65 0.01 240)` - Gris claro azulado

## 🔧 Implementación

Los colores están definidos en:
- **Archivo**: `resources/css/app.css`
- **Sistema**: CSS Variables con OKLCH
- **Compilación**: `npm run build`

### Cómo usar en componentes:

```tsx
// Botón primario (azul Atinet)
<button className="bg-primary text-primary-foreground">
  Buscar
</button>

// Badge dorado
<Badge variant="secondary">
  Resultado
</Badge>

// Accent para CTAs
<button className="bg-accent text-accent-foreground">
  ¡Importante!
</button>
```

## 📐 Guía de Uso

### ¿Cuándo usar cada color?

**Primary (Azul Atinet)**:
- Acciones principales
- Enlaces
- Indicadores de estado activo
- Encabezados importantes

**Secondary (Dorado suave)**:
- Información complementaria
- Badges informativos
- Fondos alternativos
- Separadores sutiles

**Accent (Dorado brillante)**:
- Llamados a la acción críticos
- Notificaciones importantes
- Elementos que requieren atención inmediata
- Resaltados especiales

**Destructive (Rojo)**:
- Errores
- Advertencias críticas
- Acciones destructivas (eliminar, cancelar)

## 🎨 Referencias Visuales

Basado en:
- **Sitio web**: https://www.atinet.com.mx/
- **Logo**: https://notariosatinet.com.mx/utilerias_appliweb/Logocabecera.png
- **Identidad corporativa**: Azul #0066cc + Dorado #ffc107

## 📝 Notas Técnicas

- **Formato**: OKLCH (perceptualmente uniforme)
- **Accesibilidad**: Contrastes WCAG AA cumplidos
- **Adaptación inteligente**: Colores ajustados automáticamente en dark mode
- **Consistencia**: Todos los componentes Radix UI respetan estos colores


Opciones de Nombre para el Sistema
Tier 1: Premium / Enterprise
Atinet Compliance Hub

✅ Comunica: control, cumplimiento, integración
✅ Professional para pitchs corporativos
✅ Refleja todas las herramientas (listas, reportes, tickets)
Atinet Office Suite

✅ "Suite" implica múltiples herramientas integradas
✅ "Office" sugiere solución completa para trabajo diario
✅ Posiciona como "Microsoft Office para notarías"
CheckPoint Atinet

✅ Suena a control y verificación (core del negocio)
✅ Fácil de recordar
✅ Implica seguridad + cumplimiento
Tier 2: Directo / Funcional
Atinet Control Central

✅ Comunica que es el "centro de control" de la notaría
✅ Describe exactamente qué es
✅ Suena a herramienta profesional
Atinet Platform

✅ Simple, claro, profesional
✅ Flexible para agregar subproductos
✅ Moderno
Atinet Integral (o Atinet Plus)

✅ Directo: comunica que es "todo en uno"
✅ Suena expansión del concepto original
Tier 3: Orientado a Usuario Final
NotariaHub (sin Atinet)

✅ Enfocado en el usuario (notarios/notarías)
✅ Moderno, tech
✅ Posiciona Atinet como proveedor detrás
Atinet WorkFlow

✅ Implica que gestiona procesos completos
✅ Moderno y profesional


ustificación Técnica
Migración del Sistema ATINET de VB 6.0 / VB.NET a Plataforma Web Moderna
1. Contexto Actual

El sistema actual de ATINET está compuesto por:

Un sistema principal desarrollado en Visual Basic 6.0

Herramientas adicionales desarrolladas en VB.NET

Base de datos central en MySQL 5.0

Implementación mayormente local, instalada en los servidores de las notarías

Si bien el sistema ha sido funcional durante años, actualmente presenta limitaciones técnicas y operativas que dificultan su mantenimiento, escalabilidad y evolución tecnológica.

2. Problemáticas Identificadas

Tecnologías obsoletas

Visual Basic 6.0 se encuentra oficialmente descontinuado.

Escasez de soporte, librerías modernas y desarrolladores especializados.

Riesgo alto a nivel de continuidad operativa.

Dificultad de mantenimiento

Código acoplado a lógica de escritorio.

Duplicidad de lógica entre sistemas VB6 y VB.NET.

Correcciones y mejoras requieren despliegues manuales en cada cliente.

Escalabilidad limitada

No existe una arquitectura preparada para crecimiento.

Monitoreo y soporte técnico dependen de revisiones manuales.

No hay visibilidad en tiempo real del estado de los clientes.

Nuevas necesidades del negocio

Soporte en tiempo real.

Seguimiento de tickets.

Monitoreo de instalaciones, actualizaciones y fallas.

Integración futura con nuevas plataformas y servicios.

3. Propuesta de Solución

Se propone la migración gradual del sistema ATINET hacia una plataforma web moderna, manteniendo compatibilidad con el modelo de operación local que requieren las notarías.

Arquitectura Propuesta

Backend: Laravel (API REST)

Frontend: React (SPA)

Base de datos: MySQL actualizado

Autenticación: Tokens seguros (Laravel Sanctum)

Modelo: Arquitectura híbrida (local + central)

4. Arquitectura Híbrida (Ventaja Clave)

La solución propuesta NO obliga a las notarías a trabajar en la nube, respetando su modelo actual.

Operación en Notarías

El sistema se instala en un servidor local de la notaría.

Acceso vía navegador dentro de la red interna.

Operación completa sin conexión a internet.

Experiencia similar a una aplicación de escritorio.

Operación Central ATINET

Plataforma centralizada para:

Monitoreo de clientes

Gestión de tickets

Listas negras

Estado de instalaciones y actualizaciones

Visibilidad en tiempo real.

Soporte técnico más eficiente.

Sincronización

Cuando hay conexión a internet:

Se sincroniza información relevante con ATINET.

Sin afectar la operación local.

Con mecanismos de reintento y control de errores.

5. Beneficios Técnicos

Eliminación de dependencias obsoletas (VB6).

Arquitectura moderna, documentada y mantenible.

Código reutilizable y desacoplado.

Mayor facilidad para:

Mantenimiento

Nuevas funcionalidades

Integraciones futuras

Preparación para escalabilidad y crecimiento del negocio.

6. Beneficios Operativos y de Negocio

Menor tiempo de respuesta en soporte técnico.

Menor costo de mantenimiento a mediano y largo plazo.

Mejor control de clientes y servicios.

Capacidad de ofrecer nuevos servicios a notarías.

Reducción de riesgos tecnológicos.

7. Estrategia de Implementación

La migración se plantea de forma progresiva, evitando interrupciones:

Análisis del sistema actual y base de datos.

Diseño del nuevo modelo de datos.

Desarrollo del núcleo del sistema web.

Integración con sistemas existentes.

Migración controlada de clientes.

Retiro gradual de sistemas legados.

8. Conclusión

La migración del sistema ATINET a una plataforma web moderna no es solo una mejora tecnológica, sino una decisión estratégica que:

Garantiza la continuidad del sistema.

Reduce riesgos futuros.

Permite a ATINET evolucionar y competir con mejores herramientas.

Respeta el modelo operativo actual de las notarías.
