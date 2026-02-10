# 📊 Sistema de Visualización de Suscripciones

## 🎯 Objetivo

Proporcionar al SuperAdmin un sistema avanzado de análisis visual que permita comprender la distribución y estado de las suscripciones mediante diferentes tipos de gráficos interactivos.

---

## 📈 Características Principales

### 4 Tipos de Gráficos Disponibles

| Tipo | Ícono | Componente | Uso Recomendado |
|------|-------|------------|-----------------|
| **Circular (Pie)** | 🥧 | `PieChart` | Ver proporciones y porcentajes de distribución |
| **Barras (Bar)** | 📊 | `BarChart` | Comparación directa de cantidades entre estados |
| **Radial** | 🎯 | `RadialBarChart` | Visualización de progreso en formato circular |
| **Mapa de Árbol** | 🗺️ | `Treemap` | Jerarquías y proporciones de espacio visual |

### Selector Interactivo

```tsx
<Select value={chartType} onValueChange={handleChartTypeChange}>
    <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Tipo de gráfico" />
    </SelectTrigger>
    <SelectContent>
        <SelectItem value="pie">🥧 Circular</SelectItem>
        <SelectItem value="bar">📊 Barras</SelectItem>
        <SelectItem value="radial">🎯 Radial</SelectItem>
        <SelectItem value="treemap">🗺️ Mapa de Árbol</SelectItem>
    </SelectContent>
</Select>
```

---

## 🎨 Paleta de Colores Estandarizada

Todos los gráficos utilizan una paleta consistente basada en el estado de la suscripción:

```typescript
const COLORS = [
    'hsl(205, 100%, 50%)',  // 🔵 Trial - Azul brillante
    'hsl(125, 60%, 42%)',   // ✅ Activa - Verde éxito
    'hsl(25, 90%, 54%)',    // 🟠 Vencida - Naranja advertencia
    'hsl(0, 72%, 51%)',     // 🔴 Suspendida - Rojo peligro
    'hsl(0, 0%, 60%)',      // ⚫ Cancelada - Gris neutral
];
```

### Mapeo Estado → Color → Significado

| Estado | Color | HSL | Psicología del Color |
|--------|-------|-----|----------------------|
| **trial** | 🔵 Azul | `hsl(205, 100%, 50%)` | Confianza, inicio, prueba |
| **activa** | ✅ Verde | `hsl(125, 60%, 42%)` | Éxito, activo, saludable |
| **vencida** | 🟠 Naranja | `hsl(25, 90%, 54%)` | Advertencia, requiere atención |
| **suspendida** | 🔴 Rojo | `hsl(0, 72%, 51%)` | Peligro, bloqueado, inactivo |
| **cancelada** | ⚫ Gris | `hsl(0, 0%, 60%)` | Neutral, finalizado, archivado |

---

## 💾 Persistencia de Preferencias

### localStorage

El sistema guarda automáticamente la preferencia del administrador:

**Clave:** `subscriptions-chart-type`  
**Valores posibles:** `'pie'` | `'bar'` | `'radial'` | `'treemap'`  
**Valor por defecto:** `'pie'`

### Implementación

```typescript
const [chartType, setChartType] = useState<'pie' | 'bar' | 'radial' | 'treemap'>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('subscriptions-chart-type');
        return (saved as 'pie' | 'bar' | 'radial' | 'treemap') || 'pie';
    }
    return 'pie';
});

const handleChartTypeChange = (value: 'pie' | 'bar' | 'radial' | 'treemap') => {
    setChartType(value);
    if (typeof window !== 'undefined') {
        localStorage.setItem('subscriptions-chart-type', value);
    }
};
```

### Comportamiento

1. **Primera visita**: Muestra gráfico circular (pie) por defecto
2. **Cambio de tipo**: Guarda automáticamente la selección
3. **Recarga de página**: Restaura la última selección
4. **Múltiples dispositivos**: Cada dispositivo mantiene su preferencia

---

## 📊 Estructura de Datos

### Formato de Entrada

```typescript
type ChartDataItem = {
    name: string;      // Nombre del estado (ej: "Activas")
    value: number;     // Cantidad de suscripciones
    color: string;     // Color HSL asignado
};
```

### Ejemplo Real

```typescript
const chartData = [
    { name: 'Trial', value: 2, color: 'hsl(205, 100%, 50%)' },
    { name: 'Activas', value: 5, color: 'hsl(125, 60%, 42%)' },
    { name: 'Vencidas', value: 2, color: 'hsl(25, 90%, 54%)' },
    { name: 'Suspendidas', value: 1, color: 'hsl(0, 72%, 51%)' },
    { name: 'Canceladas', value: 1, color: 'hsl(0, 0%, 60%)' },
];
```

### Generación de Datos

```typescript
const chartData = [
    { name: 'Trial', value: stats.trial, color: COLORS[0] },
    { name: 'Activas', value: stats.activas, color: COLORS[1] },
    { name: 'Vencidas', value: stats.vencidas, color: COLORS[2] },
    { name: 'Suspendidas', value: stats.suspendidas, color: COLORS[3] },
    { name: 'Canceladas', value: stats.canceladas, color: COLORS[4] },
].filter(item => item.value > 0); // Solo mostrar estados con datos
```

---

## 🔧 Implementación Técnica

### Dependencias

```json
{
    "recharts": "^2.12.7",
    "@radix-ui/react-select": "^2.1.4",
    "lucide-react": "^0.468.0"
}
```

### Imports

```typescript
import {
    PieChart, Pie, Cell,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    RadialBarChart, RadialBar,
    Treemap, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
```

### Estructura del Componente

```typescript
const Index = ({ subscriptions, stats }: Props) => {
    // 1. Estado del tipo de gráfico
    const [chartType, setChartType] = useState<ChartType>('pie');
    
    // 2. Preparación de datos
    const chartData = [...]; // Array de ChartDataItem
    
    // 3. Componente custom para TreeMap
    const CustomTreeMapContent = (props) => { /* ... */ };
    
    // 4. Función de renderizado
    const renderChart = () => {
        switch (chartType) {
            case 'pie': return <PieChart>...</PieChart>;
            case 'bar': return <BarChart>...</BarChart>;
            case 'radial': return <RadialBarChart>...</RadialBarChart>;
            case 'treemap': return <Treemap>...</Treemap>;
        }
    };
    
    // 5. UI
    return (
        <Card>
            <CardHeader>
                <Select value={chartType} onValueChange={...}>
                    {/* Selector */}
                </Select>
            </CardHeader>
            <CardContent>
                {renderChart()}
            </CardContent>
        </Card>
    );
};
```

---

## 📐 Detalles de Implementación por Tipo

### 1. Gráfico Circular (Pie)

```typescript
<ResponsiveContainer width="100%" height={300}>
    <PieChart>
        <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) =>
                `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
            }
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
        >
            {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
        </Pie>
        <Tooltip formatter={(value) => [value ?? 0, 'Suscripciones']} />
        <Legend />
    </PieChart>
</ResponsiveContainer>
```

**Características:**
- Muestra porcentajes directamente en el gráfico
- Tooltip con cantidad exacta
- Leyenda con nombres y colores
- Radio exterior de 100px

### 2. Gráfico de Barras (Bar)

```typescript
<ResponsiveContainer width="100%" height={300}>
    <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip formatter={(value) => [value ?? 0, 'Suscripciones']} />
        <Legend />
        <Bar dataKey="value" fill="#8884d8">
            {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
        </Bar>
    </BarChart>
</ResponsiveContainer>
```

**Características:**
- Eje X con nombres de estados
- Eje Y con escala automática
- Grilla para facilitar lectura
- Colores individuales por barra

### 3. Gráfico Radial

```typescript
<ResponsiveContainer width="100%" height={300}>
    <RadialBarChart
        cx="50%"
        cy="50%"
        innerRadius="10%"
        outerRadius="90%"
        data={chartData}
        startAngle={90}
        endAngle={-270}
    >
        <RadialBar
            background
            dataKey="value"
            cornerRadius={10}
        >
            {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
        </RadialBar>
        <Tooltip formatter={(value) => [value ?? 0, 'Suscripciones']} />
        <Legend iconSize={10} layout="vertical" verticalAlign="middle" />
    </RadialBarChart>
</ResponsiveContainer>
```

**Características:**
- Diseño circular de 360°
- Radio interno 10%, externo 90%
- Esquinas redondeadas (cornerRadius: 10)
- Leyenda vertical en el medio

### 4. Mapa de Árbol (Treemap)

```typescript
<ResponsiveContainer width="100%" height={300}>
    <Treemap
        data={chartData}
        dataKey="value"
        aspectRatio={4 / 3}
        stroke="#fff"
        content={<CustomTreeMapContent />}
    />
</ResponsiveContainer>
```

**Componente Custom:**

```typescript
const CustomTreeMapContent = (props: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    name?: string;
    value?: number;
    color?: string;
}) => {
    const { x = 0, y = 0, width = 0, height = 0, 
            name = '', value = 0, color = '#000' } = props;
    
    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: color,
                    stroke: '#fff',
                    strokeWidth: 2,
                }}
            />
            {width > 60 && height > 30 && (
                <>
                    <text
                        x={x + width / 2}
                        y={y + height / 2 - 10}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={14}
                        fontWeight="bold"
                    >
                        {name}
                    </text>
                    <text
                        x={x + width / 2}
                        y={y + height / 2 + 10}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={12}
                    >
                        {value}
                    </text>
                </>
            )}
        </g>
    );
};
```

**Características:**
- Tamaño proporcional al valor
- Etiquetas con nombre y cantidad
- Oculta texto si el rectángulo es muy pequeño (< 60x30)
- Borde blanco de 2px para separación

---

## 🎨 UX/UI Considerations

### Responsive Design

Todos los gráficos utilizan `ResponsiveContainer`:
```typescript
<ResponsiveContainer width="100%" height={300}>
```

- **Width**: 100% del contenedor padre
- **Height**: 300px fijo (balance entre detalle y espacio)

### Estados Sin Datos

```typescript
if (chartData.length === 0) {
    return (
        <div className="flex items-center justify-center h-[300px]">
            <p className="text-sm text-muted-foreground">
                Aún no hay suscripciones para mostrar en el gráfico
            </p>
        </div>
    );
}
```

### Accesibilidad

- ✅ Tooltips en todos los gráficos
- ✅ Leyendas con iconos y colores
- ✅ Etiquetas descriptivas
- ✅ Contraste de colores optimizado

---

## 🧪 Testing

### Script de Datos de Prueba

**Archivo:** `add_sample_subscriptions.php`

```bash
# Crear suscripciones de ejemplo
php add_sample_subscriptions.php
```

**Distribución generada:**
- 2 suscripciones Trial
- 5 suscripciones Activas
- 2 suscripciones Vencidas
- 1 suscripción Suspendida
- 1 suscripción Cancelada

### Casos de Prueba

| Caso | Descripción | Resultado Esperado |
|------|-------------|-------------------|
| **Sin datos** | No hay suscripciones | Mensaje "Aún no hay suscripciones" |
| **1 estado** | Solo suscripciones activas | Gráfico muestra 1 segmento verde |
| **Todos los estados** | Distribución completa | Gráfico con 5 colores diferentes |
| **Cambio rápido** | Cambiar tipo 10 veces | Sin lag, transición suave |
| **Persistencia** | Cambiar tipo y recargar | Mantiene última selección |

---

## 📂 Ubicación del Código

### Archivo Principal
**Path:** `resources/js/Pages/Admin/Subscriptions/Index.tsx`

### Secciones Relevantes

| Líneas | Contenido |
|--------|-----------|
| 1-20 | Imports y dependencias |
| 120-150 | CustomTreeMapContent component |
| 151-160 | Generación de chartData |
| 161-320 | renderChart function (switch con 4 tipos) |
| 350-380 | UI del selector y card |

### Componentes Relacionados

- `@/components/ui/card` - Card container
- `@/components/ui/select` - Selector de tipo de gráfico
- `@/components/admin/subscription-status-badge` - Badges de estado

---

## 🚀 Roadmap de Mejoras Futuras

### Corto Plazo (Sprint actual)
- ✅ Implementar 4 tipos de gráficos
- ✅ Selector interactivo
- ✅ Persistencia con localStorage
- ✅ Paleta de colores consistente

### Mediano Plazo (Próximo sprint)
- ⏳ Exportar gráfico como imagen PNG/SVG
- ⏳ Comparación temporal (mes actual vs anterior)
- ⏳ Gráfico de línea para evolución histórica
- ⏳ Filtros por fecha/plan/notaría

### Largo Plazo (Q2 2026)
- 📅 Dashboard personalizable con drag & drop
- 📅 Reportes automáticos por email
- 📅 Predicción de cancelaciones con ML
- 📅 Alertas proactivas de riesgo

---

## 💡 Mejores Prácticas

### 1. Performance

```typescript
// ✅ BIEN: Filtrar datos vacíos
const chartData = stats.filter(item => item.value > 0);

// ❌ MAL: Renderizar todos aunque estén en 0
const chartData = stats; // Incluye estados con value: 0
```

### 2. TypeScript

```typescript
// ✅ BIEN: Props tipadas con valores por defecto
const CustomTreeMapContent = (props: {
    x?: number;
    // ...
}) => {
    const { x = 0 } = props;
};

// ❌ MAL: Props con any
const CustomTreeMapContent = (props: any) => { };
```

### 3. Colores

```typescript
// ✅ BIEN: Usar constante centralizada
const COLORS = [...];
<Cell fill={COLORS[index]} />

// ❌ MAL: Colores hardcoded
<Cell fill="#ff0000" />
```

---

## 🐛 Troubleshooting

### Problema: Gráfico no se muestra

**Síntomas:** Card vacío, sin errores en consola  
**Causa:** chartData está vacío  
**Solución:** Verificar que hay suscripciones en la BD

```bash
php artisan tinker
>>> \App\Models\Subscription::count()
```

### Problema: Colores inconsistentes

**Síntomas:** Mismo estado con diferente color al recargar  
**Causa:** Orden de estados cambia en chartData  
**Solución:** Mantener orden fijo en la generación de datos

```typescript
// Orden fijo: trial, activa, vencida, suspendida, cancelada
const chartData = [
    { name: 'Trial', value: stats.trial, color: COLORS[0] },
    { name: 'Activas', value: stats.activas, color: COLORS[1] },
    // ...
];
```

### Problema: localStorage no persiste

**Síntomas:** Preferencia se pierde al recargar  
**Causa:** SSR (Server-Side Rendering) de Inertia  
**Solución:** Verificar `typeof window !== 'undefined'`

```typescript
if (typeof window !== 'undefined') {
    localStorage.setItem('subscriptions-chart-type', value);
}
```

---

## 📚 Referencias

### Documentación Externa
- [Recharts Documentation](https://recharts.org/en-US/)
- [Radix UI Select](https://www.radix-ui.com/primitives/docs/components/select)
- [shadcn/ui Components](https://ui.shadcn.com/)

### Archivos Relacionados
- [GESTION_SUSCRIPCIONES.md](GESTION_SUSCRIPCIONES.md) - Sistema completo de suscripciones
- [RESUMEN_EJECUTIVO_FASE_1.5.md](RESUMEN_EJECUTIVO_FASE_1.5.md) - Resumen ejecutivo
- [add_sample_subscriptions.php](add_sample_subscriptions.php) - Script de datos de prueba

---

## ✅ Checklist de Implementación

- [x] Instalar dependencias (recharts, radix-ui)
- [x] Crear constante COLORS con paleta
- [x] Implementar estado chartType con localStorage
- [x] Crear componente CustomTreeMapContent
- [x] Implementar función renderChart con switch
- [x] Agregar selector de tipo de gráfico
- [x] Configurar PieChart con labels de porcentaje
- [x] Configurar BarChart con ejes y grilla
- [x] Configurar RadialBarChart circular
- [x] Configurar Treemap con custom content
- [x] Agregar manejo de estado sin datos
- [x] Tipado completo con TypeScript
- [x] Testing con datos de ejemplo
- [x] Compilación exitosa sin errores
- [x] Documentación completa

---

**Última actualización:** 10 de Febrero, 2026  
**Autor:** Equipo de Desarrollo ATINET  
**Estado:** ✅ COMPLETADO
