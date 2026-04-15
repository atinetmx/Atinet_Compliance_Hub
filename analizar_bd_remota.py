# -*- coding: utf-8 -*-
"""
Script para conectarse a la BD remota de Atinet y analizar estructura
"""
import pymysql
import sys
from tabulate import tabulate

# Configuración de conexión
CONFIG = {
    'host': 'srvatinet',
    'user': 'root',
    'password': '123456',
    'charset': 'utf8',
    'cursorclass': pymysql.cursors.DictCursor
}

def conectar_bd(base_datos=None):
    """Establece conexión con la base de datos"""
    try:
        config = CONFIG.copy()
        if base_datos:
            config['database'] = base_datos

        conexion = pymysql.connect(**config)
        print(f"✓ Conectado exitosamente a {CONFIG['host']}")
        if base_datos:
            print(f"  Base de datos: {base_datos}")
        return conexion
    except Exception as e:
        print(f"✗ Error al conectar: {e}")
        return None

def listar_bases_datos(conexion):
    """Lista todas las bases de datos disponibles"""
    try:
        with conexion.cursor() as cursor:
            cursor.execute("SHOW DATABASES")
            bases = cursor.fetchall()

            print("\n" + "="*80)
            print("BASES DE DATOS DISPONIBLES:")
            print("="*80)
            for bd in bases:
                nombre_bd = bd['Database']
                # Resaltar la BD de atinet o sistema
                if 'atinet' in nombre_bd.lower() or 'sistema' in nombre_bd.lower():
                    print(f"  ★ {nombre_bd}")
                else:
                    print(f"    {nombre_bd}")

            return [bd['Database'] for bd in bases]
    except Exception as e:
        print(f"Error listando bases de datos: {e}")
        return []

def analizar_estructura_tabla(conexion, tabla):
    """Analiza la estructura de una tabla específica"""
    try:
        with conexion.cursor() as cursor:
            # Obtener estructura
            cursor.execute(f"DESCRIBE {tabla}")
            estructura = cursor.fetchall()

            print(f"\n{'='*80}")
            print(f"TABLA: {tabla}")
            print(f"{'='*80}")

            # Mostrar estructura
            headers = ['Campo', 'Tipo', 'Null', 'Key', 'Default', 'Extra']
            rows = []
            for col in estructura:
                rows.append([
                    col['Field'],
                    col['Type'],
                    col['Null'],
                    col['Key'],
                    col['Default'],
                    col['Extra']
                ])

            print(tabulate(rows, headers=headers, tablefmt='grid'))

            # Contar registros
            cursor.execute(f"SELECT COUNT(*) as total FROM {tabla}")
            total = cursor.fetchone()['total']
            print(f"\n📊 Total de registros: {total}")

            return estructura

    except Exception as e:
        print(f"Error analizando tabla {tabla}: {e}")
        return None

def analizar_relaciones(conexion, tabla):
    """Analiza las relaciones (foreign keys) de una tabla"""
    try:
        with conexion.cursor() as cursor:
            # Obtener foreign keys
            query = f"""
                SELECT
                    COLUMN_NAME,
                    REFERENCED_TABLE_NAME,
                    REFERENCED_COLUMN_NAME
                FROM
                    INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                WHERE
                    TABLE_SCHEMA = DATABASE()
                    AND TABLE_NAME = '{tabla}'
                    AND REFERENCED_TABLE_NAME IS NOT NULL
            """
            cursor.execute(query)
            fks = cursor.fetchall()

            if fks:
                print(f"\n🔗 Relaciones (Foreign Keys) de {tabla}:")
                for fk in fks:
                    print(f"   {fk['COLUMN_NAME']} → {fk['REFERENCED_TABLE_NAME']}.{fk['REFERENCED_COLUMN_NAME']}")
            else:
                print(f"\n⚠ No se encontraron FK explícitas (pueden ser relaciones lógicas)")

            return fks
    except Exception as e:
        print(f"Error analizando relaciones: {e}")
        return []

def ver_datos_muestra(conexion, tabla, limite=5):
    """Muestra datos de ejemplo de una tabla"""
    try:
        with conexion.cursor() as cursor:
            cursor.execute(f"SELECT * FROM {tabla} LIMIT {limite}")
            datos = cursor.fetchall()

            if datos:
                print(f"\n📄 Primeros {limite} registros de {tabla}:")
                print("-"*80)

                # Obtener nombres de columnas
                columnas = list(datos[0].keys())

                # Preparar datos para tabulate
                rows = []
                for registro in datos:
                    row = []
                    for col in columnas:
                        val = str(registro[col])[:30]  # Limitar a 30 caracteres
                        row.append(val)
                    rows.append(row)

                print(tabulate(rows, headers=columnas, tablefmt='grid'))
            else:
                print(f"\n⚠ La tabla {tabla} está vacía")

    except Exception as e:
        print(f"Error mostrando datos: {e}")

def analizar_tablas_catalogos(conexion):
    """Analiza todas las tablas de catálogos"""

    tablas_principales = [
        'catactividades',
        'catdocumentos',
        'personalidades',
        'operaciones',
        'catimpuestos',
        'cat_dependencias',
        'catzonas'
    ]

    tablas_relacionales = [
        'actoperacion',
        'docoperacion',
        'opeimpu',
        'opevul'
    ]

    print("\n" + "#"*80)
    print("ANÁLISIS DE CATÁLOGOS PRINCIPALES")
    print("#"*80)

    for tabla in tablas_principales:
        try:
            analizar_estructura_tabla(conexion, tabla)
            analizar_relaciones(conexion, tabla)
            ver_datos_muestra(conexion, tabla, 3)
            print("\n")
        except Exception as e:
            print(f"⚠ Tabla {tabla} no existe o error: {e}\n")

    print("\n" + "#"*80)
    print("ANÁLISIS DE TABLAS RELACIONALES")
    print("#"*80)

    for tabla in tablas_relacionales:
        try:
            analizar_estructura_tabla(conexion, tabla)
            analizar_relaciones(conexion, tabla)
            ver_datos_muestra(conexion, tabla, 5)

            # Análisis especial para entender la lógica
            print(f"\n🔍 Análisis de relación en {tabla}:")
            with conexion.cursor() as cursor:
                # Contar relaciones únicas
                if tabla == 'actoperacion':
                    cursor.execute("""
                        SELECT
                            Operacion,
                            COUNT(*) as num_actividades
                        FROM actoperacion
                        GROUP BY Operacion
                        LIMIT 5
                    """)
                    result = cursor.fetchall()
                    print("   Operaciones con sus actividades asignadas:")
                    for r in result:
                        print(f"     Operación {r['Operacion']}: {r['num_actividades']} actividades")

                elif tabla == 'docoperacion':
                    cursor.execute("""
                        SELECT
                            Operacion,
                            COUNT(*) as num_documentos
                        FROM docoperacion
                        GROUP BY Operacion
                        LIMIT 5
                    """)
                    result = cursor.fetchall()
                    print("   Operaciones con sus documentos requeridos:")
                    for r in result:
                        print(f"     Operación {r['Operacion']}: {r['num_documentos']} documentos")

                elif tabla == 'opeimpu':
                    cursor.execute("""
                        SELECT
                            Operacion,
                            COUNT(*) as num_impuestos
                        FROM opeimpu
                        GROUP BY Operacion
                        LIMIT 5
                    """)
                    result = cursor.fetchall()
                    print("   Operaciones con sus impuestos/trámites:")
                    for r in result:
                        print(f"     Operación {r['Operacion']}: {r['num_impuestos']} trámites")

            print("\n")
        except Exception as e:
            print(f"⚠ Tabla {tabla} no existe o error: {e}\n")

def main():
    print("\n" + "="*80)
    print("ANÁLISIS DE BASE DE DATOS REMOTA - ATINET")
    print("="*80)

    # Conectar sin especificar BD
    conexion = conectar_bd()
    if not conexion:
        print("\n✗ No se pudo conectar al servidor")
        return

    # Listar bases de datos
    bases = listar_bases_datos(conexion)
    conexion.close()

    # Buscar BD de nogales
    bd_nogales = None
    for bd in bases:
        if '99nogales' in bd.lower():
            bd_nogales = bd
            print(f"\n>>> BD de Nogales encontrada automáticamente: {bd_nogales}")
            break

    if not bd_nogales:
        print("\n⚠ No se encontró BD con '99nogales' en el nombre")
        print("Bases disponibles con 'nogales':")
        for bd in bases:
            if 'nogales' in bd.lower():
                print(f"  - {bd}")
        return

    # Conectar a la BD específica
    print(f"\n{'='*80}")
    print(f"Conectando a la base de datos: {bd_nogales}")
    print(f"{'='*80}")

    conexion = conectar_bd(bd_nogales)
    if not conexion:
        print("\n✗ No se pudo conectar a la base de datos")
        return

    # Analizar tablas
    try:
        analizar_tablas_catalogos(conexion)
    finally:
        conexion.close()
        print("\n" + "="*80)
        print("✓ ANÁLISIS COMPLETADO - Conexión cerrada")
        print("="*80)

if __name__ == "__main__":
    main()
