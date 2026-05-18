# 📊 Reporte de Búsquedas - Base de Datos Gator

## 📝 Descripción

Este script genera un reporte completo de las búsquedas realizadas por las notarías desde la base de datos remota **atinet65_aplicativos** en los servidores de Hostgator.

## 🚀 Uso

### Ver reporte en consola
```bash
php generar_reporte_busquedas_gator.php
```

### Exportar a CSV (genera 3 archivos)
```bash
php generar_reporte_busquedas_gator.php --export=csv
```
**Archivos generados:**
- `reporte_busquedas_notarias_YYYY-MM-DD_HHMMSS.csv` - Búsquedas por notaría
- `reporte_busquedas_tipos_YYYY-MM-DD_HHMMSS.csv` - Tipos de búsqueda
- `reporte_busquedas_detalle_YYYY-MM-DD_HHMMSS.csv` - Detalle notaría × tipo

### Exportar a JSON (archivo único)
```bash
php generar_reporte_busquedas_gator.php --export=json
```
**Archivo generado:**
- `reporte_busquedas_YYYY-MM-DD_HHMMSS.json` - Datos completos en JSON

## 📊 Información incluida en el reporte

### 1. Resumen General
- Total de búsquedas registradas
- Cantidad de notarías activas
- Cantidad de tipos de búsqueda diferentes

### 2. Búsquedas por Notaría
- Nombre de cada notaría
- Total de búsquedas realizadas
- Fecha de primera búsqueda
- Fecha de última búsqueda

### 3. Tipos de Búsqueda
- Cada tipo de búsqueda existente
- Total de búsquedas por tipo
- Porcentaje de uso
- Cantidad de notarías que usan cada tipo

### 4. Análisis Detallado
- Cruce de notaría × tipo de búsqueda
- Cantidad de búsquedas por cada combinación

### 5. Actividad Reciente (últimos 30 días)
- Total de búsquedas en últimos 30 días
- Notarías activas recientemente
- Top 10 notarías más activas

### 6. Origen de Consultas
- De dónde provienen las búsquedas (WEB, API, etc.)

## 📈 Resultados Actuales (al 06/04/2026)

### Estadísticas Generales
- **Total búsquedas:** 20,894
- **Notarías activas:** 23
- **Tipos de búsqueda:** 2 (Lista Negra, Lista SAT)

### Top 5 Notarías Más Activas
1. **79oaxaca** - 6,386 búsquedas (30.6%)
2. **37Oaxaca** - 2,729 búsquedas (13.1%)
3. **180Puruandiro** - 2,513 búsquedas (12.0%)
4. **101Guadalajara** - 1,807 búsquedas (8.6%)
5. **101Oaxaca** - 1,754 búsquedas (8.4%)

### Distribución por Tipo
- **Lista Negra (OFAC):** 12,158 búsquedas (58.19%)
- **Lista SAT:** 8,736 búsquedas (41.81%)

### Actividad Reciente (últimos 30 días)
- **Búsquedas:** 317
- **Notarías activas:** 12

## 🔧 Requisitos

- PHP 7.4+
- Laravel instalado
- Conexión a base de datos `aplicativos` configurada en `config/database.php`
- Acceso de red al servidor remoto 162.144.6.1:3306

## 📁 Estructura de Datos

### Tabla: `busquedas`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | int | ID único de la búsqueda |
| NOTARIA | varchar | Nombre identificador de la notaría |
| TIPO_BUSQUEDA | varchar | Tipo: "Lista Negra" o "Lista SAT" |
| NOMBRE | varchar | Término de búsqueda |
| FECHA | datetime | Fecha y hora de la búsqueda |
| ORIGEN_CONSULTA | varchar | Origen: "WEB", "API", etc. |

## 💡 Casos de Uso

### 1. Análisis de Uso del Sistema
Identificar qué notarías están usando activamente el sistema y con qué frecuencia.

### 2. Detección de Patrones
Analizar qué tipos de búsquedas son más comunes y por qué notarías.

### 3. Planificación de Migración
Identificar a las notarías más activas para priorizar su migración al nuevo sistema.

### 4. Soporte Técnico
Verificar la actividad de una notaría específica cuando reportan problemas.

### 5. Métricas de Negocio
Generar estadísticas de uso para presentaciones o reportes gerenciales.

## 🔍 Ejemplos de Análisis

### Verificar actividad de una notaría específica
```sql
SELECT * FROM busquedas WHERE NOTARIA = '79oaxaca' ORDER BY FECHA DESC LIMIT 10;
```

### Ver búsquedas recientes
```sql
SELECT * FROM busquedas WHERE FECHA >= DATE_SUB(NOW(), INTERVAL 7 DAY);
```

### Contar búsquedas por mes
```sql
SELECT 
    DATE_FORMAT(FECHA, '%Y-%m') as mes,
    COUNT(*) as total
FROM busquedas 
GROUP BY mes 
ORDER BY mes DESC;
```

## 📞 Soporte

Para cualquier duda o problema con el reporte, contactar al equipo de desarrollo.

---

**Última actualización:** 06 de abril de 2026
