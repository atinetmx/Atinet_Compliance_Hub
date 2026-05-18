#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Analiza la estructura de atinet65_catalogos en localhost
Configuración tomada de config/database.php y .env
"""

import pymysql
from tabulate import tabulate
import sys

# Configuración LOCAL (127.0.0.1) como en .env del proyecto Laravel
config = {
    'host': '127.0.0.1',
    'port': 3306,
    'user': 'root',
    'password': '123456789',  # Del .env: DB_PASSWORD
    'database': 'atinet65_catalogos',
    'charset': 'utf8mb4'
}

def conectar():
    try:
        return pymysql.connect(**config)
    except Exception as e:
        print(f"[ERROR] No se pudo conectar a atinet65_catalogos: {e}")
        print(f"\nVerifica que:")
        print(f"  1. MySQL esté corriendo en localhost:3306")
        print(f"  2. Exista la base de datos 'atinet65_catalogos'")
        print(f"  3. Usuario 'root' tenga password '123456789'")
        sys.exit(1)

def listar_tablas(conn):
    """Lista todas las tablas del catálogo"""
    with conn.cursor() as cursor:
        cursor.execute("SHOW TABLES")
        tablas = [row[0] for row in cursor.fetchall()]
    return tablas

def analizar_tabla(conn, tabla):
    """Analiza estructura y datos de una tabla"""
    info = {
        'tabla': tabla,
        'registros': 0,
        'campos': []
    }

    with conn.cursor() as cursor:
        # Contar registros
        cursor.execute(f"SELECT COUNT(*) FROM `{tabla}`")
        info['registros'] = cursor.fetchone()[0]

        # Estructura
        cursor.execute(f"DESCRIBE `{tabla}`")
        info['campos'] = cursor.fetchall()

    return info

def mostrar_muestra_cat_cp(conn):
    """Muestra ejemplos de cat_cp para entender su estructura"""
    print("\n" + "="*80)
    print("MUESTRA DE DATOS: cat_cp (Códigos Postales SEPOMEX)")
    print("="*80)

    with conn.cursor(pymysql.cursors.DictCursor) as cursor:
        cursor.execute("""
            SELECT
                d_codigo as CP,
                d_estado as Estado,
                c_estado as CodEstado,
                D_mnpio as Municipio,
                c_mnpio as CodMunicipio,
                d_ciudad as Ciudad,
                d_asenta as Colonia,
                d_tipo_asenta as TipoAsentamiento
            FROM cat_cp
            WHERE c_estado = '26'  -- Sonora
            LIMIT 5
        """)

        resultados = cursor.fetchall()

        if resultados:
            print("\nEjemplo: Códigos Postales de Sonora:\n")
            headers = resultados[0].keys()
            rows = [list(r.values()) for r in resultados]
            print(tabulate(rows, headers=headers, tablefmt='grid'))

def analizar_estados_municipios(conn):
    """Analiza la distribución de estados y municipios"""
    print("\n" + "="*80)
    print("ANALISIS: Estados y Municipios")
    print("="*80)

    with conn.cursor() as cursor:
        # Total de estados
        cursor.execute("SELECT COUNT(DISTINCT c_estado) FROM cat_cp")
        total_estados = cursor.fetchone()[0]

        # Total de municipios
        cursor.execute("SELECT COUNT(DISTINCT CONCAT(c_estado, '-', c_mnpio)) FROM cat_cp")
        total_municipios = cursor.fetchone()[0]

        # Total de colonias
        cursor.execute("SELECT COUNT(*) FROM cat_cp")
        total_asentamientos = cursor.fetchone()[0]

        print(f"\nTotal Estados:        {total_estados}")
        print(f"Total Municipios:     {total_municipios}")
        print(f"Total Asentamientos:  {total_asentamientos}")

        # Ejemplo de Sonora
        cursor.execute("""
            SELECT
                c_estado,
                d_estado,
                COUNT(DISTINCT c_mnpio) as municipios,
                COUNT(*) as asentamientos
            FROM cat_cp
            WHERE c_estado = '26'  -- Sonora
            GROUP BY c_estado, d_estado
        """)

        sonora = cursor.fetchone()
        if sonora:
            print(f"\nEjemplo Sonora:")
            print(f"  Código:        {sonora[0]}")
            print(f"  Nombre:        {sonora[1]}")
            print(f"  Municipios:    {sonora[2]}")
            print(f"  Asentamientos: {sonora[3]}")

def busqueda_por_cp_ejemplo(conn):
    """Demuestra cómo buscar datos por código postal"""
    print("\n" + "="*80)
    print("EJEMPLO: Búsqueda por Código Postal")
    print("="*80)

    cp_ejemplo = '83000'  # Hermosillo Centro

    with conn.cursor(pymysql.cursors.DictCursor) as cursor:
        cursor.execute("""
            SELECT
                d_codigo as CP,
                d_estado as Estado,
                D_mnpio as Municipio,
                d_ciudad as Ciudad,
                d_asenta as Colonia,
                d_tipo_asenta as Tipo
            FROM cat_cp
            WHERE d_codigo = %s
            LIMIT 10
        """, (cp_ejemplo,))

        resultados = cursor.fetchall()

        if resultados:
            print(f"\nColonias encontradas para CP {cp_ejemplo}:\n")
            headers = resultados[0].keys()
            rows = [list(r.values()) for r in resultados]
            print(tabulate(rows, headers=headers, tablefmt='grid'))

def generar_estrategia_normalizacion():
    """Genera estrategia de normalización basada en cat_cp"""
    print("\n" + "="*80)
    print("ESTRATEGIA DE NORMALIZACION PARA CLIENTES VB")
    print("="*80)

    estrategia = """
OPCION 1: Usar cat_cp directamente (NO RECOMENDADO)
-------------------------------------------------------
Pros:
  - Datos completos de SEPOMEX (oficiales)
  - Incluye todos los municipios y colonias de México

Contras:
  - Tabla gigante (145,000+ registros)
  - Datos redundantes (mismo estado/municipio repetido)
  - No optimizada para relaciones FK
  - Difícil de mantener

OPCION 2: Normalizar cat_cp en tablas separadas (RECOMENDADO)
---------------------------------------------------------------
Crear 4 tablas normalizadas:

1. estados (32 registros)
   - id (PK)
   - nombre (d_estado)
   - codigo_sepomex (c_estado)

2. municipios (~2,460 registros)
   - id (PK)
   - estado_id (FK -> estados.id)
   - nombre (D_mnpio)
   - codigo_sepomex (c_mnpio)

3. ciudades (~500-800 registros únicos)
   - id (PK)
   - municipio_id (FK -> municipios.id)
   - nombre (d_ciudad)

4. colonias (~145,000 registros)
   - id (PK)
   - ciudad_id (FK -> ciudades.id)
   - nombre (d_asenta)
   - tipo (d_tipo_asenta)
   - codigo_postal (d_codigo)

Ventajas:
  ✓ Normalización correcta (3FN)
  ✓ FK optimizados para filtrado en cascada
  ✓ Fácil de consultar (estado -> municipios -> ciudades -> colonias)
  ✓ Mantiene integridad referencial

SCRIPT DE MIGRACION:
--------------------
1. Crear tablas normalizadas en Laravel
2. Importar DISTINCT estados de cat_cp
3. Importar DISTINCT municipios agrupados por estado
4. Importar DISTINCT ciudades agrupadas por municipio
5. Importar colonias con sus CP
6. Crear índices en FK y búsquedas frecuentes (CP, nombre)

ENRIQUECIMIENTO DE DATOS VB:
-----------------------------
Para los clientes del VB que tienen CP pero no Estado/Municipio/Colonia:

  SELECT e.id, m.id, ci.id, co.id
  FROM colonias co
  JOIN ciudades ci ON co.ciudad_id = ci.id
  JOIN municipios m ON ci.municipio_id = m.id
  JOIN estados e ON m.estado_id = e.id
  WHERE co.codigo_postal = '83000'
  LIMIT 1;

Esto permite llenar automáticamente los 4 campos geográficos.
"""

    print(estrategia)

def main():
    print("="*80)
    print("ANALISIS DE CATALOGOS LOCALES")
    print("Base de datos: atinet65_catalogos")
    print("Conexión: 127.0.0.1:3306 (localhost)")
    print("="*80)

    conn = conectar()
    print("[OK] Conectado a atinet65_catalogos\n")

    # Listar todas las tablas
    tablas = listar_tablas(conn)
    print(f"Tablas encontradas: {len(tablas)}\n")

    # Analizar cada tabla
    tabla_info = []
    for tabla in tablas:
        info = analizar_tabla(conn, tabla)
        tabla_info.append([
            info['tabla'],
            len(info['campos']),
            f"{info['registros']:,}"
        ])

    print(tabulate(tabla_info,
                   headers=['Tabla', 'Campos', 'Registros'],
                   tablefmt='grid'))

    # Si existe cat_cp, hacer análisis detallado
    if 'cat_cp' in tablas:
        mostrar_muestra_cat_cp(conn)
        analizar_estados_municipios(conn)
        busqueda_por_cp_ejemplo(conn)

    # Generar estrategia
    generar_estrategia_normalizacion()

    conn.close()
    print("\n[OK] Análisis completado")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n[CANCELADO] Análisis interrumpido por el usuario")
        sys.exit(0)
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
