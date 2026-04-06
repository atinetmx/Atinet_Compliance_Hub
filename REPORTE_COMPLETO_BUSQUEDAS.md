# 📊 Reporte Completo de Búsquedas - Base de Datos Gator (WEB + ESCRITORIO)

## 📝 Descripción

Este script genera un reporte completo de **TODAS** las búsquedas realizadas por las notarías desde la base de datos remota **atinet65_aplicativos** en los servidores de Hostgator, incluyendo:

- ✅ **Búsquedas WEB** (tabla `busquedas`)
- ✅ **Búsquedas ESCRITORIO** (tabla `busquedas_escritorio`)

## 🚀 Uso

### Ver reporte en consola
```bash
php generar_reporte_completo_busquedas.php
```

### Exportar a CSV (genera 3 archivos)
```bash
php generar_reporte_completo_busquedas.php --export=csv
```
**Archivos generados:**
- `reporte_completo_notarias_YYYY-MM-DD_HHMMSS.csv` - Búsquedas por notaría (WEB + ESCRITORIO)
- `reporte_completo_tipos_YYYY-MM-DD_HHMMSS.csv` - Tipos de búsqueda por origen
- `reporte_completo_detalle_YYYY-MM-DD_HHMMSS.csv` - Detalle notaría × tipo × origen

### Exportar a JSON (archivo único)
```bash
php generar_reporte_completo_busquedas.php --export=json
```
**Archivo generado:**
- `reporte_completo_busquedas_YYYY-MM-DD_HHMMSS.json` - Datos completos en JSON

## 📊 Información incluida en el reporte

### 1. Resumen General
- Total de búsquedas registradas (WEB + ESCRITORIO)
- Distribución porcentual entre WEB y ESCRITORIO
- Cantidad de notarías activas por plataforma

### 2. Búsquedas por Notaría
- Nombre de cada notaría
- Total de búsquedas realizadas
- Búsquedas WEB vs ESCRITORIO
- Fecha de primera y última búsqueda

### 3. Tipos de Búsqueda por Origen
- Cada tipo de búsqueda existente
- Total de búsquedas por tipo y origen (WEB/ESCRITORIO)
- Porcentaje de uso

### 4. Análisis Detallado (Top 10)
- Cruce de notaría × tipo de búsqueda × origen
- TOP 10 notarías más activas

### 5. Actividad Reciente (últimos 30 días)
- Total de búsquedas en últimos 30 días
- Separadas por WEB y ESCRITORIO
- Top 10 notarías más activas recientemente

### 6. Comparación WEB vs ESCRITORIO
- Preferencia de uso por notaría
- Gráficos de barras visuales en consola
- Identificación de patrones de uso

## 📈 Resultados Actuales (al 06/04/2026)

### Estadísticas Generales
- **Total búsquedas:** 29,856
  - **WEB:** 20,894 (69.98%)
  - **ESCRITORIO:** 8,962 (30.02%)
- **Notarías activas:** 27
  - Usan WEB: 23
  - Usan ESCRITORIO: 6
  - Usan ambas: Solo 1 (30Aguascalientes)

### Top 10 Notarías Más Activas

| # | Notaría | Total | WEB | ESCRITORIO | % WEB | % Escritorio |
|---|---------|-------|-----|------------|-------|--------------|
| 1 | 79oaxaca | 6,386 | 6,386 | 0 | 100% | 0% |
| 2 | 99maravatio | 3,272 | 1 | 3,271 | 0.03% | 99.97% |
| 3 | 37Oaxaca | 2,729 | 2,729 | 0 | 100% | 0% |
| 4 | 180Puruandiro | 2,513 | 2,513 | 0 | 100% | 0% |
| 5 | 101Guadalajara | 1,807 | 1,807 | 0 | 100% | 0% |
| 6 | 101Oaxaca | 1,754 | 1,754 | 0 | 100% | 0% |
| 7 | 1nacajuca | 1,703 | 1,703 | 0 | 100% | 0% |
| 8 | 30Aguascalientes | 1,492 | 5 | 1,487 | 0.3% | 99.7% |
| 9 | 36Villahermosa | 1,296 | 0 | 1,296 | 0% | 100% |
| 10 | 126Tuxtla | 1,253 | 0 | 1,253 | 0% | 100% |

### Distribución por Tipo y Origen
- **Lista Negra (OFAC):** 21,120 búsquedas total
  - WEB: 12,158 (40.72%)
  - ESCRITORIO: 8,962 (30.02%)
- **Lista SAT:** 8,736 búsquedas total
  - WEB: 8,736 (29.26%)
  - ESCRITORIO: 0 (0%)

> **Observación importante:** Las búsquedas de escritorio **solo** realizan búsquedas en Lista Negra (OFAC), NO en Lista SAT.

### Actividad Reciente (últimos 30 días)
- **Total:** 405 búsquedas
  - WEB: 317 (78.27%)
  - ESCRITORIO: 88 (21.73%)
- **Notarías activas:** 12

## 🔍 Hallazgos Clave

### 1. Segregación de Plataformas
La mayoría de las notarías utilizan **exclusivamente** una plataforma:
- **Solo WEB:** 21 notarías
- **Solo ESCRITORIO:** 5 notarías
- **Mixto:** 1 notaría (30Aguascalientes)

### 2. Funcionalidad Limitada en Escritorio
La aplicación de escritorio **NO tiene** funcionalidad para búsquedas SAT:
- Todas las búsquedas SAT (8,736) provienen de la aplicación WEB
- La aplicación de escritorio solo busca en Lista Negra (OFAC)

### 3. Dominancia de WEB
- 70% de las búsquedas son desde WEB
- 23 de 27 notarías prefieren la aplicación WEB
- Mayor actividad reciente en WEB (78% últimos 30 días)

### 4. Usuarios de Escritorio Destacados
Notarías que usan exclusivamente escritorio:
- **99maravatio:** 3,271 búsquedas
- **36Villahermosa:** 1,296 búsquedas
- **126Tuxtla:** 1,253 búsquedas
- **37Puebla:** 1,075 búsquedas
- **2zihuatanejo:** 580 búsquedas

## 🔧 Requisitos

- PHP 7.4+
- Laravel instalado
- Conexión a base de datos `aplicativos` configurada en `config/database.php`
- Acceso de red al servidor remoto 162.144.6.1:3306

## 📁 Estructura de Datos

### Tablas Utilizadas

#### Tabla: `busquedas` (WEB)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | int | ID único de la búsqueda |
| NOTARIA | varchar | Nombre identificador de la notaría |
| TIPO_BUSQUEDA | varchar | Tipo: "Lista Negra" o "Lista SAT" |
| NOMBRE | varchar | Término de búsqueda |
| FECHA | datetime | Fecha y hora de la búsqueda |
| ORIGEN_CONSULTA | varchar | Siempre "WEB" |

#### Tabla: `busquedas_escritorio` (ESCRITORIO)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | int | ID único de la búsqueda |
| NOTARIA | varchar | Nombre identificador de la notaría |
| TIPO_BUSQUEDA | varchar | Solo "Lista Negra" |
| NOMBRE | varchar | Término de búsqueda |
| FECHA | datetime | Fecha y hora de la búsqueda |
| ORIGEN_CONSULTA | varchar | Valor del origen |

## 💡 Casos de Uso

### 1. Análisis de Migración
Identificar qué notarías usan aplicación de escritorio para planificar la migración al nuevo sistema web.

### 2. Detección de Limitaciones
Identificar usuarios de escritorio que podrían beneficiarse de las búsquedas SAT disponibles en WEB.

### 3. Estrategia de Actualización
Priorizar la migración de notarías que usan exclusivamente escritorio para unificar plataformas.

### 4. Análisis de Comportamiento
Entender por qué algunas notarías prefieren escritorio sobre web (posibles problemas de UX en web).

### 5. Soporte Técnico
Identificar rápidamente qué plataforma usa una notaría para brindar soporte específico.

## 📊 Scripts Disponibles

### Script Principal (Recomendado)
- **`generar_reporte_completo_busquedas.php`** - Reporte completo WEB + ESCRITORIO

### Scripts Legacy (Solo WEB)
- **`generar_reporte_busquedas_gator.php`** - Solo búsquedas WEB (tabla `busquedas`)

### Scripts de Análisis
- **`check_origen_consulta.php`** - Verificar valores de ORIGEN_CONSULTA
- **`buscar_tablas_busquedas.php`** - Explorar tablas relacionadas con búsquedas

## 🎯 Recomendaciones

### Para el Equipo de Desarrollo
1. **Unificar plataformas:** Migrar usuarios de escritorio a la plataforma web moderna
2. **Agregar funcionalidad SAT:** Si se mantiene escritorio, agregar búsquedas SAT
3. **Investigar preferencias:** Entender por qué 6 notarías prefieren escritorio

### Para Producto
1. **Promocionar funcionalidad WEB:** Notarías de escritorio no conocen búsquedas SAT
2. **Capacitación:** Ofrecer training para notarías que usan solo escritorio
3. **Análisis de UX:** Investigar barreras de adopción de plataforma WEB

### Para Migración
Prioridad de migración de notarías de ESCRITORIO:
1. **Alta:** 99maravatio (3,271 búsquedas)
2. **Alta:** 36Villahermosa (1,296 búsquedas)
3. **Media:** 126Tuxtla (1,253 búsquedas)
4. **Media:** 37Puebla (1,075 búsquedas)
5. **Baja:** 2zihuatanejo (580 búsquedas)

## 📞 Soporte

Para cualquier duda o problema con el reporte, contactar al equipo de desarrollo.

---

**Última actualización:** 06 de abril de 2026  
**Versión:** 2.0  
**Autor:** Equipo de Desarrollo Atinet
