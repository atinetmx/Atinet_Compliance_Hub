# 📊 Propuesta de Mejoras - Sistema de Reportes
## Integración con Categorías y Modelos de Facturación

**Fecha:** 7 de Abril, 2026  
**Versión:** 1.0  
**Estado:** 📋 Propuesta para Revisión

---

## 🎯 Objetivo

Mejorar el sistema de reportes para aprovechar la **categorización de servicios** (CONSULTA, API, SISTEMA, etc.) y los **modelos de facturación** (INCLUDED, LIMITED, PER_USE, UNLIMITED), proporcionando análisis más profundos y accionables.

---

## 📋 Estado Actual

### Servicios Principales del Sistema (4 Módulos Core)

1. **🛡️ Listas Negras (OFAC/SAT)** - ✅ IMPLEMENTADO
   - Categoría: `CONSULTA`
   - Modelo: `PER_USE`
   - Descripción: Búsqueda en listas de prevención de lavado de dinero
   - Servicios: BLACKLIST_OFAC, BLACKLIST_SAT

2. **📅 Agenda** - ✅ IMPLEMENTADO
   - Categoría: `SISTEMA`
   - Modelo: `INCLUDED` o `LIMITED`
   - Descripción: Sistema de calendario y eventos para notarías
   - Tabla: `agenda_events`

3. **📝 Registro Web** - ✅ IMPLEMENTADO
   - Categoría: `SISTEMA`
   - Modelo: `LIMITED`
   - Descripción: Captura de datos de clientes (80+ campos) con QR y OCR
   - Tabla: `registro_web`
   - Features: Generación de códigos QR, OCR de documentos, envío de correos

4. **⚖️ Control Notarial** - ⏳ EN MIGRACIÓN
   - Categoría: `SISTEMA`
   - Modelo: `UNLIMITED` (plan base)
   - Descripción: Sistema principal de gestión notarial (legacy VB6 con 516 formularios)
   - Estado: Coexiste con sistema legacy, migración gradual

### Limitaciones del Sistema Actual de Reportes
1. **Reportes Genéricos**: No distinguen entre tipos de servicios
2. **Sin Análisis por Categoría**: No se sabe cuánto cuesta cada categoría
3. **Modelos de Facturación Invisibles**: No se diferencia entre servicios incluidos vs pagados
4. **Falta de Contexto**: Los superadmins no pueden ver patrones de adopción por categoría
5. **Costo No Segmentado**: No se puede ver "¿Cuánto gastamos en consultas vs APIs?"

---

## 🚀 Mejoras Propuestas

### 1. Dashboard Principal - Nuevas Tarjetas

#### **Tarjeta: Distribución por Categoría**
```
┌─────────────────────────────────────┐
│ 📊 Uso por Categoría               │
├─────────────────────────────────────┤
│ ⚙️ Sistema      1,250 (75%) $  0.00│
│   ├─ Agenda: 450 req.               │
│   ├─ Registro Web: 650 req.         │
│   └─ Control Notarial: 150 req.     │
│ 🔍 Consulta      400 (24%) $200.00 │
│   ├─ OFAC: 250 req. ($125.00)       │
│   └─ SAT: 150 req. ($75.00)         │
│ 📊 Análisis       15 ( 1%)  $ 0.00 │
│ 🔌 API             5 (<1%)  $15.00 │
└─────────────────────────────────────┘
```

**Valor:**
- Identifica que Sistema (75%) es la categoría más usada pero no genera costo
- Consultas (24%) generan el 100% del costo ($200)
- Permite optimizar desarrollo: Agenda y Registro Web son los servicios core más usados

---

#### **Tarjeta: Servicios por Modelo de Facturación**
```
┌─────────────────────────────────────┐
│ 💰 Impacto por Modelo               │
├─────────────────────────────────────┤
│ ♾️ UNLIMITED     150 req.   $  0.00 │
│    Control Notarial (plan base)     │
│ ✅ INCLUDED      450 req.   $  0.00 │
│    Agenda (incluida en plan)        │
│ 🔢 LIMITED       650 req.   $  0.00 │
│    ⚠️ Registro Web: 78% del límite  │
│    📊 650/850 usados este mes       │
│ 💰 PER_USE       400 req.   $200.00 │
│    📈 +15% vs mes pasado            │
│    OFAC: $125 | SAT: $75            │
└─────────────────────────────────────┘
```

**Valor:**
- Alerta: Registro Web está en 78% del límite (crítico)
- PER_USE (Listas Negras) genera todo el costo mensual
- Servicios core (Agenda, Control Notarial) no generan costo adicional

---

### 2. Reporte "Uso por Servicio" - Columnas Adicionales

**Columnas Actuales:**
- Fecha y Hora, Notaría, Servicio, Usuario, Cantidad, Costo

**Nuevas Columnas Propuestas:**
- **Categoría del Servicio** (🔍 Consulta, ⚙️ Sistema, etc.)
- **Modelo de Facturación** (💰 PER_USE, 🔢 LIMITED, etc.)
- **% del Límite** (solo para LIMITED) - Ej: "78% usado"

**Vista Mejorada:**
```
┌─────────┬──────────┬──────────────────┬───────────┬────────┬────────┬────────────┬────────────┐
│ Fecha   │ Notaría  │ Servicio         │ Categoría │ Modelo │ Cant.  │ Costo      │ % Límite   │
├─────────┼──────────┼──────────────────┼───────────┼────────┼────────┼────────────┼────────────┤
│ 07-Abr  │ Not. 1   │ BLACKLIST_OFAC   │ 🔍        │ 💰     │ 5      │ $25.00     │ N/A        │
│ 07-Abr  │ Not. 2   │ REGISTRO_WEB     │ ⚙️        │ 🔢     │ 120    │ $ 0.00     │ 78% ⚠️    │
│ 07-Abr  │ Not. 1   │ AGENDA           │ ⚙️        │ ✅     │ 15     │ $ 0.00     │ N/A        │
│ 06-Abr  │ Not. 3   │ BLACKLIST_SAT    │ 🔍        │ 💰     │ 3      │ $15.00     │ N/A        │
│ 06-Abr  │ Not. 1   │ CONTROL_NOTARIAL │ ⚙️        │ ♾️     │ 8      │ $ 0.00     │ N/A        │
└─────────┴──────────┴──────────────────┴───────────┴────────┴────────┴────────────┴────────────┘
```

---

### 3. Nuevo Reporte: "Análisis por Categoría"

**Ubicación:** Reports > Análisis por Categoría

**Contenido:**
```
┌─ RESUMEN POR CATEGORÍA ────────────────────────────────────────────────┐
│                                                                         │
│ 🔍 CONSULTA (Búsquedas en Listas Negras)                               │
│   Servicios activos: 2 (BLACKLIST_OFAC, BLACKLIST_SAT)                 │
│   Total solicitudes: 400                                                │
│   Costo total: $200.00                                                  │
│   Notarías usando: 12/15 (80% adopción)                                │
│   Tendencia: 📈 +15% vs mes pasado                                     │
│   Desglose:                                                             │
│     • BLACKLIST_OFAC: 250 req. ($125.00) - 62% del total               │
│     • BLACKLIST_SAT: 150 req. ($75.00) - 38% del total                 │
│                                                                         │
│ ⚙️ SISTEMA (Herramientas Base Notarial)                                │
│   Servicios activos: 3 (Agenda, Registro Web, Control Notarial)        │
│   Total solicitudes: 1,250                                              │
│   Costo total: $0.00 (Incluidos en planes)                             │
│   Notarías usando: 15/15 (100% adopción)                               │
│   Tendencia: ➡️ Estable                                                │
│   Desglose:                                                             │
│     • Registro Web: 650 req. (52%) - ⚠️ Límite 78% usado               │
│     • Agenda: 450 req. (36%)                                            │
│     • Control Notarial: 150 req. (12%) - Legacy en migración           │
│                                                                         │
│ 📊 ANÁLISIS (Reportes y Estadísticas)                                  │
│   Servicios activos: 0 (Categoría sin servicios configurados)          │
│   Oportunidad: Crear servicios de análisis avanzado                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Exportación Excel:**
- Hoja 1: Resumen por categoría
- Hoja 2: Detalle de servicios por categoría
- Hoja 3: Adopción por notaría y categoría

---

### 4. Alertas Inteligentes

#### **Alerta 1: Servicios LIMITED Cerca del Límite**
```
⚠️ ALERTA - Límite de Servicio Próximo

Notaría: Número 1 - García López
Servicio: REGISTRO_WEB
Modelo: LIMITED (Límite: 850/mes)
Uso actual: 650 (76%)
Quedan: 200 registros (24%)
Proyección fin de mes: 820 (96%)

Acciones sugeridas:
✅ Contactar para upgrade a UNLIMITED
📊 Ver historial de capturas web de este mes
📧 Enviar notificación preventiva
💡 Analizar si necesitan aumentar límite por alta demanda
```

#### **Alerta 2: Aumento Significativo en Servicios PER_USE**
```
📈 ALERTA - Aumento en Costos PER_USE

Notaría: Número 5 - Martínez Ruiz
Período: Marzo 2026
Servicios PER_USE (Listas Negras):
  - BLACKLIST_OFAC: $125.00 (+45% vs Feb)
  - BLACKLIST_SAT: $75.00 (+30% vs Feb)
Total incremento: $85.00 (+38%)

¿Es un cambio esperado o hay un problema?
✅ Revisar tendencias de esta notaría
📊 Comparar con promedio de sector
💬 Contactar para feedback
🎯 Posible alta demanda de verificaciones (buen indicador)
```

---

## 🎨 Nuevos Filtros Propuestos

### En Todos los Reportes:
- **Por Categoría**: Dropdown con iconos (🔍 Consulta, ⚙️ Sistema, etc.)
- **Por Modelo de Facturación**: Filtrar solo PER_USE, solo LIMITED, etc.
- **Por Estado de Límite**: Normal (<60%), Precaución (60-80%), Alerta (>80%)

---

## 💾 Exportación Excel Mejorada

### **Reporte de Uso Detallado (Actualización)**
**Agregar columnas:**
- F: Categoría (con color de fondo por categoría)
- G: Modelo de Facturación (con icono)
- H: % Límite Usado (solo si aplica)

**Colores por Categoría:**
- 🔍 Consulta: Azul (#0066CC)
- ⚙️ Sistema: Verde (#16A34A)
- 🔌 API: Naranja (#F59E0B)
- 📊 Análisis: Púrpura (#9333EA)
- 💾 Almacenamiento: Gris (#6B7280)
- 🔗 Integración: Cyan (#06B6D4)

---

### **Nuevo Reporte: Análisis por Categoría (Excel)**
**3 Hojas:**

#### **Hoja 1: Resumen**
| Categoría | Servicios Activos | Total Solicitudes | Costo Total | Adopción (%) |
|-----------|-------------------|-------------------|-------------|--------------|
| Consulta  | 3                 | 850               | $425.00     | 80%          |
| Sistema   | 2                 | 320               | $0.00       | 100%         |

#### **Hoja 2: Servicios por Categoría**
| Categoría | Servicio         | Código           | Modelo    | Solicitudes | Costo    |
|-----------|------------------|------------------|-----------|-------------|----------|
| Consulta  | Lista OFAC       | BLACKLIST_OFAC   | PER_USE   | 250         | $125.00  |
| Consulta  | Lista SAT        | BLACKLIST_SAT    | PER_USE   | 150         | $75.00   |
| Sistema   | Registro Web     | REGISTRO_WEB     | LIMITED   | 650         | $0.00    |
| Sistema   | Agenda           | AGENDA           | INCLUDED  | 450         | $0.00    |
| Sistema   | Control Notarial | CONTROL_NOTARIAL | UNLIMITED | 150         | $0.00    |

#### **Hoja 3: Matriz de Adopción**
| Notaría    | Consulta (OFAC/SAT) | Agenda | Registro Web | Control Notarial |
|------------|---------------------|--------|--------------|------------------|
| Notaría 1  | ✅ 120              | ✅ 50  | ✅ 85        | ✅ 20            |
| Notaría 2  | ✅ 85               | ✅ 40  | ✅ 70        | ✅ 15            |
| Notaría 3  | ❌                  | ✅ 35  | ✅ 95        | ✅ 10            |
| Notaría 4  | ✅ 45               | ✅ 60  | ⚠️ 250 (78%)| ✅ 25            |

---

## 🏗️ Implementación Técnica

### **1. Backend - Actualizar ReportsController**

#### **Método nuevo: `getCategoryStats()`**
```php
protected function getCategoryStats(string $period, ?int $notariaId): array
{
    return ServiceUsage::with('service:id,name,code,category,billing_model')
        ->when($notariaId, fn($q) => $q->where('notaria_id', $notariaId))
        ->when($period === 'month', fn($q) => $q->whereMonth('consumed_at', now()->month))
        ->when($period === 'week', fn($q) => $q->whereBetween('consumed_at', [now()->startOfWeek(), now()->endOfWeek()]))
        ->when($period === 'year', fn($q) => $q->whereYear('consumed_at', now()->year))
        ->get()
        ->groupBy('service.category')
        ->map(function ($categoryUsages, $category) {
            return [
                'category' => $category,
                'total_requests' => $categoryUsages->count(),
                'total_cost' => $categoryUsages->sum('cost'),
                'total_quantity' => $categoryUsages->sum('quantity'),
                'unique_notarias' => $categoryUsages->pluck('notaria_id')->unique()->count(),
                'services_count' => $categoryUsages->pluck('service_id')->unique()->count(),
            ];
        })
        ->values();
}
```

#### **Método nuevo: `getBillingModelStats()`**
```php
protected function getBillingModelStats(string $period, ?int $notariaId): array
{
    return ServiceUsage::with('service:id,name,code,billing_model')
        ->when($notariaId, fn($q) => $q->where('notaria_id', $notariaId))
        ->when($period === 'month', fn($q) => $q->whereMonth('consumed_at', now()->month))
        ->when($period === 'week', fn($q) => $q->whereBetween('consumed_at', [now()->startOfWeek(), now()->endOfWeek()]))
        ->when($period === 'year', fn($q) => $q->whereYear('consumed_at', now()->year))
        ->get()
        ->groupBy('service.billing_model')
        ->map(function ($modelUsages, $model) {
            return [
                'billing_model' => $model,
                'total_requests' => $modelUsages->count(),
                'total_cost' => $modelUsages->sum('cost'),
                'percentage_of_limit' => $model === 'limited' ? $this->calculateLimitPercentage($modelUsages) : null,
            ];
        })
        ->values();
}
```

---

### **2. Frontend - Nuevos Componentes**

#### **CategoryDistributionCard.tsx**
```tsx
interface CategoryStat {
    category: string;
    total_requests: number;
    total_cost: number;
    percentage: number;
}

const CategoryDistributionCard = ({ stats }: { stats: CategoryStat[] }) => {
    const categoryIcons = {
        consulta: '🔍',
        api: '🔌',
        sistema: '⚙️',
        analisis: '📊',
        storage: '💾',
        integration: '🔗',
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Distribución por Categoría</CardTitle>
            </CardHeader>
            <CardContent>
                {stats.map(({ category, total_requests, total_cost, percentage }) => (
                    <div key={category} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">{categoryIcons[category]}</span>
                            <span className="text-sm font-medium capitalize">{category}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">
                                {total_requests} ({percentage}%)
                            </span>
                            <span className="text-sm font-semibold">${total_cost.toFixed(2)}</span>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};
```

---

## 📈 Beneficios Esperados

### **Para Superadmin:**
✅ Identificar servicios más rentables  
✅ Detectar problemas de adopción por categoría  
✅ Prever necesidades de upgrade de notarías  
✅ Tomar decisiones basadas en datos por tipo de servicio  

### **Para Notarías:**
✅ Entender qué categorías usan más  
✅ Ver cuándo se aproximan a límites  
✅ Justificar upgrades con datos  
✅ Optimizar uso de servicios PER_USE  

### **Para Desarrollo:**
✅ Priorizar nuevas funcionalidades en categorías populares  
✅ Diseñar planes basados en categorías  
✅ Crear alertas automáticas por modelo de facturación  

---

## 🚦 Priorización

### **Fase 1 (Crítico) - Esta Sesión**
- [ ] Agregar tarjeta "Distribución por Categoría" al dashboard
- [ ] Agregar tarjeta "Impacto por Modelo de Facturación"
- [ ] Incluir columnas de categoría y modelo en tabla de uso

### **Fase 2 (Alta Prioridad) - Próxima Sesión**
- [ ] Crear vista "Análisis por Categoría"
- [ ] Implementar alertas de límites
- [ ] Exportar Excel con categorías

### **Fase 3 (Media Prioridad) - Futuro**
- [ ] Matriz de adopción
- [ ] Predicción de consumo por categoría
- [ ] Sugerencias automáticas de upgrade

---

## 💡 Ejemplos de Insights

Con estas mejoras, el sistema podrá responder preguntas como:

1. **"¿Cuál categoría genera más costo?"**  
   → Consulta (Listas Negras): $200/mes (100% del costo total)  
   → Sistema: $0 (todos incluidos en planes)

2. **"¿Qué notarías están cerca del límite en Registro Web?"**  
   → Notaría 4: 78% del límite (650/850 registros usados)  
   → Se proyecta alcanzar 96% para fin de mes

3. **"¿Cuál servicio del sistema tiene mayor adopción?"**  
   → Registro Web: 15/15 notarías (100%)  
   → Agenda: 14/15 notarías (93%)  
   → Control Notarial: 10/15 notarías (67% - en migración desde VB6)

4. **"¿Cuánto se ahorra con servicios INCLUDED/LIMITED?"**  
   → 1,100 solicitudes de Agenda + Registro Web = $0 de costo  
   → Valor estimado si fueran PER_USE: ~$550/mes

5. **"¿Qué servicio genera más solicitudes?"**  
   → Registro Web (SISTEMA): 650 registros/mes  
   → BLACKLIST_OFAC (CONSULTA): 250 búsquedas/mes  
   → Agenda (SISTEMA): 450 eventos/mes

6. **"¿Las búsquedas OFAC/SAT están creciendo?"**  
   → OFAC: +45% vs mes anterior ($125 este mes)  
   → SAT: +30% vs mes anterior ($75 este mes)  
   → Indicador: Alta demanda de due diligence

---

## 🎯 Conclusión

Esta propuesta transforma el sistema de reportes de **genérico a específico**, aprovechando la arquitectura de categorías y modelos de facturación ya implementada. Los cambios son **incrementales** y **no disruptivos**, agregando valor sin modificar funcionalidad existente.

**Próximo paso sugerido:** Implementar Fase 1 (tarjetas de categoría y modelo) en esta sesión.
