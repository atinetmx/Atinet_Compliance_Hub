# 📊 REPORTE DE NOTARÍAS ACTIVAS POR TIPO DE BÚSQUEDA

**Fecha de Generación:** 22 de abril de 2026  
**Base de datos:** atinet65_aplicativos (Gator)  
**Script:** `generar_reporte_notarias_activas.php`

---

## 📝 Resumen Ejecutivo

Este reporte analiza las **27 notarías activas** en el sistema, clasificándolas según:
- **Tipo de búsqueda:** Lista Negra (OFAC) y Lista SAT
- **Plataforma:** WEB, ESCRITORIO, MIXTA

### 🎯 Hallazgos Clave

1. **27 notarías activas** realizaron un total de **29,856 búsquedas**
2. **22 notarías (81.5%)** usan AMBOS tipos de búsqueda (Lista Negra + SAT)
3. **5 notarías (18.5%)** están LIMITADAS a Lista Negra únicamente
4. **La funcionalidad SAT NO existe en la aplicación ESCRITORIO**

---

## 🔴 LISTA NEGRA (OFAC) - 27 Notarías Activas

### Distribución por Plataforma

| Categoría | Cantidad | Porcentaje | Total Búsquedas |
|-----------|----------|------------|-----------------|
| **Solo WEB** | 21 | 77.8% | 12,153 |
| **Solo ESCRITORIO** | 5 | 18.5% | 7,475 |
| **MIXTAS** | 1 | 3.7% | 1,492 |
| **TOTAL** | **27** | **100%** | **21,120** |

### Notarías por Categoría

#### 🌐 Solo WEB (21 notarías)
1. **79oaxaca** - 3,898 búsquedas
2. **180Puruandiro** - 1,696 búsquedas
3. **37Oaxaca** - 1,367 búsquedas
4. **1nacajuca** - 1,182 búsquedas
5. **101Oaxaca** - 962 búsquedas
6. **101Guadalajara** - 946 búsquedas
7. **41Tampico** - 550 búsquedas
8. **3huimanguillo** - 416 búsquedas
9. **108teotitlan** - 273 búsquedas
10. **113huatulco** - 238 búsquedas
11. **177ixtlahuaca** - 145 búsquedas
12. **156tuxtla** - 131 búsquedas
13. **65riobravo** - 121 búsquedas
14. **84arteaga** - 85 búsquedas
15. **atinet** - 57 búsquedas
16. **15piedrasnegras** - 40 búsquedas
17. **4Ixmiquilpan** - 33 búsquedas
18. **1Tampico** - 9 búsquedas
19. **7cordoba** - 2 búsquedas
20. **13Villahermosa** - 1 búsqueda
21. **14villahermosa** - 1 búsqueda

#### 💻 Solo ESCRITORIO (5 notarías)
1. **99maravatio** - 3,271 búsquedas
2. **36Villahermosa** - 1,296 búsquedas
3. **126Tuxtla** - 1,253 búsquedas
4. **37Puebla** - 1,075 búsquedas
5. **2zihuatanejo** - 580 búsquedas

#### 🔄 MIXTAS (1 notaría)
1. **30Aguascalientes** - 1,492 búsquedas (5 WEB + 1,487 ESCRITORIO)

---

## 🟡 LISTA SAT - 22 Notarías Activas

### Distribución por Plataforma

| Categoría | Cantidad | Porcentaje | Total Búsquedas |
|-----------|----------|------------|-----------------|
| **Solo WEB** | 22 | 100% | 8,736 |
| **Solo ESCRITORIO** | 0 | 0% | 0 |
| **MIXTAS** | 0 | 0% | 0 |
| **TOTAL** | **22** | **100%** | **8,736** |

### ⚠️ Importante: Funcionalidad SAT

> **La aplicación de ESCRITORIO NO tiene funcionalidad para búsquedas en Lista SAT.**  
> Solo la plataforma WEB puede realizar este tipo de búsquedas.

### Notarías Activas en Lista SAT

#### 🌐 WEB (22 notarías)
1. **79oaxaca** - 2,488 búsquedas
2. **37Oaxaca** - 1,362 búsquedas
3. **101Guadalajara** - 861 búsquedas
4. **180Puruandiro** - 817 búsquedas
5. **101Oaxaca** - 792 búsquedas
6. **1nacajuca** - 521 búsquedas
7. **41Tampico** - 500 búsquedas
8. **3huimanguillo** - 409 búsquedas
9. **108teotitlan** - 265 búsquedas
10. **113huatulco** - 228 búsquedas
11. **177ixtlahuaca** - 145 búsquedas
12. **65riobravo** - 117 búsquedas
13. **84arteaga** - 81 búsquedas
14. **156tuxtla** - 67 búsquedas
15. **15piedrasnegras** - 30 búsquedas
16. **atinet** - 27 búsquedas
17. **4Ixmiquilpan** - 10 búsquedas
18. **1Tampico** - 9 búsquedas
19. **7cordoba** - 3 búsquedas
20. **13Villahermosa** - 2 búsquedas
21. **14villahermosa** - 1 búsqueda
22. **99maravatio** - 1 búsqueda

---

## 📊 ANÁLISIS COMPARATIVO

### Adopción de Tipos de Búsqueda

| Categoría | Notarías | Porcentaje |
|-----------|----------|------------|
| **Usan AMBAS** (Lista Negra + SAT) | 22 | 81.5% |
| **Usan SOLO Lista Negra** | 5 | 18.5% |
| **Usan SOLO Lista SAT** | 0 | 0% |

### 🎯 Notarías con Adopción Completa (22)

Estas notarías usan AMBOS tipos de búsqueda (Lista Negra + SAT):

✓ 79oaxaca  
✓ 180Puruandiro  
✓ 37Oaxaca  
✓ 1nacajuca  
✓ 101Oaxaca  
✓ 101Guadalajara  
✓ 41Tampico  
✓ 3huimanguillo  
✓ 108teotitlan  
✓ 113huatulco  
✓ 177ixtlahuaca  
✓ 156tuxtla  
✓ 65riobravo  
✓ 84arteaga  
✓ atinet  
✓ 15piedrasnegras  
✓ 4Ixmiquilpan  
✓ 1Tampico  
✓ 7cordoba  
✓ 13Villahermosa  
✓ 14villahermosa  
✓ 99maravatio  

### ⚠️ Notarías Limitadas a Lista Negra (5)

Estas notarías **NO usan búsquedas SAT**, solo Lista Negra:

• **30Aguascalientes** (1,492 búsquedas) - Principalmente ESCRITORIO  
• **36Villahermosa** (1,296 búsquedas) - Solo ESCRITORIO  
• **126Tuxtla** (1,253 búsquedas) - Solo ESCRITORIO  
• **37Puebla** (1,075 búsquedas) - Solo ESCRITORIO  
• **2zihuatanejo** (580 búsquedas) - Solo ESCRITORIO  

**Patrón identificado:** Todas las notarías limitadas a Lista Negra usan principalmente o exclusivamente la aplicación ESCRITORIO, que no tiene funcionalidad SAT.

---

## 🔍 Insights Estratégicos

### 1. Gap Funcional en ESCRITORIO
- **Impacto:** 5 notarías (18.5%) no pueden realizar búsquedas SAT
- **Causa:** La aplicación ESCRITORIO carece de esta funcionalidad
- **Total búsquedas afectadas:** 7,475 búsquedas de Lista Negra sin acceso a SAT
- **Recomendación:** Considerar agregar funcionalidad SAT a la app ESCRITORIO

### 2. Alta Adopción de SAT en WEB
- **81.5% de las notarías** que usan WEB también usan SAT
- Indica que SAT es una funcionalidad valiosa y ampliamente utilizada
- Las notarías entienden el valor de verificar ambas listas

### 3. Predominio de Plataforma WEB
- **21 de 27 notarías (77.8%)** usan WEB para Lista Negra
- WEB es la plataforma principal de acceso al sistema
- ESCRITORIO se concentra en pocas notarías pero con alto volumen

### 4. Concentración de Uso
- **Top 5 notarías** representan una porción significativa del total
- 79oaxaca lidera con 6,386 búsquedas totales (21.4% del total)
- Oportunidad para casos de estudio y mejores prácticas

### 5. Notarías con Bajo Uso
- Varias notarías tienen actividad mínima (<10 búsquedas)
- Posible oportunidad para capacitación o soporte adicional
- Considerar estrategias de activación

---

## 📁 Archivos Generados

El script genera dos archivos CSV:

### 1. `reporte_activas_lista_negra_YYYY-MM-DD_HHMMSS.csv`
Contiene todas las notarías que realizan búsquedas en Lista Negra, con:
- Notaría
- Tipo de Búsqueda (Lista Negra)
- Plataforma (SOLO WEB, SOLO ESCRITORIO, MIXTA)
- Total Búsquedas
- Búsquedas Web
- Búsquedas Escritorio
- Primera Búsqueda
- Última Búsqueda

### 2. `reporte_activas_lista_sat_YYYY-MM-DD_HHMMSS.csv`
Contiene todas las notarías que realizan búsquedas en Lista SAT, con:
- Notaría
- Tipo de Búsqueda (Lista SAT)
- Plataforma (WEB)
- Total Búsquedas
- Primera Búsqueda
- Última Búsqueda

---

## 🚀 Uso del Script

### Modo Consola (sin exportación)
```bash
php generar_reporte_notarias_activas.php
```

### Exportar a CSV
```bash
php generar_reporte_notarias_activas.php --export=csv
```

### Exportar a JSON
```bash
php generar_reporte_notarias_activas.php --export=json
```

---

## 📈 Métricas Resumen

| Métrica | Valor |
|---------|-------|
| **Total Notarías Activas** | 27 |
| **Total Búsquedas** | 29,856 |
| **Búsquedas Lista Negra** | 21,120 (70.7%) |
| **Búsquedas Lista SAT** | 8,736 (29.3%) |
| **Notarías con WEB** | 22 (81.5%) |
| **Notarías con ESCRITORIO** | 6 (22.2%) |
| **Notarías con Ambas Plataformas** | 1 (3.7%) |
| **Notarías con Ambos Tipos de Búsqueda** | 22 (81.5%) |

---

## 🎯 Recomendaciones

### Corto Plazo
1. ✅ **Documentar** notarías limitadas a Lista Negra para seguimiento
2. 📧 **Contactar** notarías con bajo uso para ofrecer capacitación
3. 📊 **Monitorear** adopción de SAT como KPI de valor del sistema

### Mediano Plazo
1. 💻 **Evaluar** agregar funcionalidad SAT a aplicación ESCRITORIO
2. 🔄 **Migrar** notarías de ESCRITORIO a WEB si requieren SAT
3. 📚 **Crear guías** de mejores prácticas basadas en notarías top

### Largo Plazo
1. 🚀 **Unificar** plataformas para paridad funcional completa
2. 📈 **Analizar** patrones de uso para optimización de features
3. 🎓 **Programa** de capacitación para activación de notarías inactivas

---

**Última actualización:** 22 de abril de 2026  
**Versión del script:** 1.0
