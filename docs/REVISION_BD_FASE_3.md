# 🔍 Revisión de Base de Datos - Fase 3 (Pendiente)

**Fecha Creación:** 20 de Marzo, 2026  
**Status:** 📝 Pendiente de Análisis  
**Contexto:** Partes 1 y 2 completadas, Partes 3 y 4 requieren revisión BD

---

## 📋 Partes Completadas (Sin Revisión)

### ✅ Parte 1: Historial de Búsquedas
- Tabla existente: `busquedas`
- Modelo existente: `Busqueda`
- Auto-save funcionando correctamente
- No requiere cambios en BD

### ✅ Parte 2: Excel Export
- Sin cambios en BD
- Solo lógica de exportación (maatwebsite/excel)
- Usa datos de búsquedas existentes

---

## ⏸️ Revisar Antes de Continuar

### 🔸 Parte 3: Cache de Búsquedas

#### Puntos a Analizar:

1. **Estrategia de Cache**
   - [ ] ¿Redis disponible en producción?
   - [ ] ¿O usar file cache (storage/framework/cache)?
   - [ ] ¿Cuál es el driver de cache configurado en `.env`?

2. **Estructura de Datos OFAC/SAT**
   - [ ] Revisar tablas actuales en BD (atinet65_ofac_*, atinet65_sat_*)
   - [ ] ¿Qué tan grandes son las tablas? (número de registros)
   - [ ] ¿Hay índices en las columnas de búsqueda?
   - [ ] ¿Los queries actuales son lentos? ¿Cuánto tardan?

3. **Sincronización Diaria**
   - [ ] Confirmar horarios: 9:30 AM y 6:15 PM México
   - [ ] Al sincronizar, ¿se debe invalidar caché automáticamente?
   - [ ] ¿O el TTL de 24h es suficiente?

4. **Políticas de Cache**
   - [ ] TTL propuesto: 24 horas ¿es adecuado?
   - [ ] ¿Cachear solo búsquedas con resultados o también sin resultados?
   - [ ] ¿Qué tan frecuentes son las búsquedas repetidas?

5. **Cache Keys**
   - [ ] Formato propuesto: `search_{tipo}_{hash(término)}`
   - [ ] ¿Incluir notaria_id en la key? `search_{notaria}_{tipo}_{hash}`
   - [ ] ¿Los resultados varían por tenant/notaría?

---

### 🔸 Parte 4: Dashboard de Estadísticas

#### Puntos a Analizar:

1. **Tabla `busquedas` Actual**
   - [ ] ¿Qué campos tiene actualmente?
   - [ ] ¿Tiene índices en `created_at`, `tipo_busqueda`, `notaria_id`?
   - [ ] ¿Cuántos registros históricos hay?
   - [ ] ¿Se está limpiando periódicamente o crece indefinidamente?

2. **Nueva Tabla `SearchStatistics` (Propuesta)**
   ```sql
   CREATE TABLE search_statistics (
       id BIGINT PRIMARY KEY,
       date DATE NOT NULL,
       notaria_id BIGINT NULL,
       total_searches INT DEFAULT 0,
       ofac_count INT DEFAULT 0,
       sat_count INT DEFAULT 0,
       unique_users INT DEFAULT 0,
       avg_results DECIMAL(5,2),
       created_at TIMESTAMP,
       updated_at TIMESTAMP,
       INDEX idx_date (date),
       INDEX idx_notaria_date (notaria_id, date)
   );
   ```
   - [ ] ¿Es preferible esta tabla agregada o consultar directamente `busquedas`?
   - [ ] ¿Crear vista materializada en vez de tabla nueva?
   - [ ] ¿Cuál tiene mejor performance para gráficos?

3. **Queries de Agregación**
   - [ ] Probar query: "Búsquedas por día últimos 30 días"
   - [ ] Probar query: "Top 10 términos más buscados"
   - [ ] Probar query: "OFAC vs SAT proporciones"
   - [ ] Medir tiempo de respuesta actual

4. **Datos Históricos**
   - [ ] ¿Hay suficientes datos históricos para gráficos?
   - [ ] ¿Se necesita crear seeder con datos mock?
   - [ ] ¿Cuántos meses de historia existen en `busquedas`?

5. **Performance Concerns**
   - [ ] Con 1000+ búsquedas/día, ¿los gráficos serán lentos?
   - [ ] ¿Necesitamos paginación en estadísticas?
   - [ ] ¿Cache también para estadísticas? (TTL: 1 hora)

---

## 📝 Preguntas para el Equipo

### Base de Datos:
1. ¿Cuál es el volumen actual de registros en `busquedas`?
2. ¿Hay problemas de performance en búsquedas actuales?
3. ¿Redis está disponible o solo file cache?
4. ¿Se planea escalar a múltiples servidores (considerar cache distribuido)?

### Negocio:
1. ¿Qué tan importante es la velocidad de respuesta? (justify cache complexity)
2. ¿Los dashboards son para reporting o tiempo real?
3. ¿Necesitan exportar estadísticas (Excel/PDF)?
4. ¿Los gráficos deben ser por notaría individual o global?

### Infraestructura:
1. ¿Ambiente de producción tiene restricciones de memoria para cache?
2. ¿Se puede instalar Redis si no existe?
3. ¿Cuánto espacio en disco para cache de archivos?

---

## 🎯 Próximos Pasos

1. **Revisar BD Actual**
   - Conectarse a BD de producción (o staging)
   - Ejecutar queries de análisis (ver sección siguiente)
   - Documentar hallazgos

2. **Decisiones Técnicas**
   - Elegir estrategia de cache (con datos reales)
   - Definir estructura de `SearchStatistics` o usar vista
   - Validar performance de queries de agregación

3. **Implementación**
   - Una vez aprobada la revisión, continuar con Parte 3
   - Después Parte 4 (si datos históricos son suficientes)

---

## 🔧 Queries de Análisis Recomendados

```sql
-- 1. Volumen de búsquedas
SELECT COUNT(*) as total_busquedas FROM busquedas;
SELECT COUNT(*) as este_mes FROM busquedas WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY);

-- 2. Distribución por tipo
SELECT tipo_busqueda, COUNT(*) as total 
FROM busquedas 
GROUP BY tipo_busqueda 
ORDER BY total DESC;

-- 3. Performance de búsquedas actuales
EXPLAIN SELECT * FROM busquedas WHERE created_at >= '2026-02-01' AND notaria_id = 1;

-- 4. Top términos buscados
SELECT termino_busqueda, COUNT(*) as veces 
FROM busquedas 
GROUP BY termino_busqueda 
ORDER BY veces DESC 
LIMIT 10;

-- 5. Búsquedas por día (últimos 30)
SELECT DATE(created_at) as fecha, COUNT(*) as total 
FROM busquedas 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
GROUP BY DATE(created_at) 
ORDER BY fecha DESC;

-- 6. Verificar índices
SHOW INDEXES FROM busquedas;

-- 7. Tamaño de tabla
SELECT 
    table_name AS 'Tabla',
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Tamaño (MB)'
FROM information_schema.TABLES
WHERE table_schema = DATABASE() AND table_name = 'busquedas';
```

---

## 📌 Notas Adicionales

- **Caché:** Si las búsquedas actuales son rápidas (<500ms), el caché puede no ser prioritario
- **Estadísticas:** Si hay <100 búsquedas históricas, usar mock data para desarrollo
- **Escalabilidad:** Considerar crecimiento futuro (10 notarías → 100 notarías)

---

**Documento creado para:** Revisión técnica antes de implementar Partes 3 y 4  
**Próxima reunión:** TBD  
**Responsable:** Equipo de desarrollo + DBA
