# -*- coding: utf-8 -*-
"""
Script para analizar la base de datos sistemaatinet (Sistema VB CRM)
"""
import sys
import pymysql
from tabulate import tabulate

# Forzar encoding UTF-8 en Windows
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'ignore')

# Configuración de conexión
CONFIG = {
    'host': 'srvatinet',
    'user': 'root',
    'password': '123456',
    'database': 'sistemaatinet',
    'charset': 'utf8',
    'cursorclass': pymysql.cursors.DictCursor
}

# Tablas CRM del sistema VB
TABLAS_CRM = [
    'clientes',
    'alarmas',
    'seguimientosventa',
    'seguimientosatencion',
    'seguimientossoporte',
    'chat',
    'chatgrupo',
    'usuarios',
    'notarias'
]

def conectar():
    """Establece conexión"""
    try:
        conexion = pymysql.connect(**CONFIG)
        print(f"[OK] Conectado a: {CONFIG['host']}/{CONFIG['database']}\n")
        return conexion
    except Exception as e:
        print(f"[ERROR] Error al conectar: {e}")
        return None

def listar_todas_tablas(conexion):
    """Lista todas las tablas disponibles"""
    try:
        with conexion.cursor() as cursor:
            cursor.execute("SHOW TABLES")
            tablas = [row[f"Tables_in_{CONFIG['database']}"] for row in cursor.fetchall()]

            print("="*80)
            print(f"TABLAS EN {CONFIG['database']} ({len(tablas)}):")
            print("="*80)

            for tabla in sorted(tablas):
                # Marcar tablas CRM
                if tabla in TABLAS_CRM:
                    print(f"  * {tabla} (CRM)")
                else:
                    print(f"    {tabla}")

            return tablas
    except Exception as e:
        print(f"Error listando tablas: {e}")
        return []

def analizar_tabla(conexion, tabla):
    """Analiza estructura completa de una tabla"""
    try:
        with conexion.cursor() as cursor:
            print(f"\n{'='*80}")
            print(f"TABLA: {tabla}")
            print(f"{'='*80}")

            # 1. ESTRUCTURA
            cursor.execute(f"DESCRIBE {tabla}")
            estructura = cursor.fetchall()

            print("\n[ESTRUCTURA]:")
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

            # 2. CONTEO
            cursor.execute(f"SELECT COUNT(*) as total FROM `{tabla}`")
            total = cursor.fetchone()['total']
            print(f"\n[REGISTROS]: {total:,}")

            # 3. SHOW CREATE TABLE
            cursor.execute(f"SHOW CREATE TABLE `{tabla}`")
            result = cursor.fetchone()['Create Table']
            # Convertir bytes a string si es necesario
            if isinstance(result, bytes):
                create_sql = result.decode('utf-8')
            else:
                create_sql = result
            print(f"\n[CREATE TABLE]:")
            print("-"*80)
            print(create_sql)
            print("-"*80)

            # 4. DATOS MUESTRA (si hay)
            if total > 0:
                limite = min(3, total)
                cursor.execute(f"SELECT * FROM `{tabla}` LIMIT {limite}")
                datos = cursor.fetchall()

                if datos:
                    print(f"\n[PRIMEROS {limite} REGISTROS]:")

                    # Preparar datos para visualización
                    columnas = list(datos[0].keys())
                    rows_data = []
                    for registro in datos:
                        row = []
                        for col in columnas:
                            val = str(registro[col])[:40] if registro[col] is not None else 'NULL'
                            row.append(val)
                        rows_data.append(row)

                    print(tabulate(rows_data, headers=columnas, tablefmt='grid'))

            # 5. RELACIONES (foreign keys)
            cursor.execute(f"""
                SELECT
                    COLUMN_NAME,
                    REFERENCED_TABLE_NAME,
                    REFERENCED_COLUMN_NAME
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                WHERE TABLE_SCHEMA = '{CONFIG['database']}'
                AND TABLE_NAME = '{tabla}'
                AND REFERENCED_TABLE_NAME IS NOT NULL
            """)
            fks = cursor.fetchall()

            if fks:
                print(f"\n[FOREIGN KEYS]:")
                for fk in fks:
                    print(f"   {fk['COLUMN_NAME']} -> {fk['REFERENCED_TABLE_NAME']}.{fk['REFERENCED_COLUMN_NAME']}")

            print("\n")

    except Exception as e:
        print(f"[ERROR] Error analizando tabla {tabla}: {e}\n")

def exportar_estructura_txt(conexion, tablas):
    """Exporta toda la estructura a archivo de texto"""
    try:
        with open('VB_DB_STRUCTURE.txt', 'w', encoding='utf-8') as f:
            f.write("="*80 + "\n")
            f.write("ESTRUCTURA DE BASE DE DATOS: sistemaatinet\n")
            f.write("Sistema VB CRM - Gestión de Clientes\n")
            f.write("="*80 + "\n\n")

            for tabla in tablas:
                with conexion.cursor() as cursor:
                    f.write(f"\n{'='*80}\n")
                    f.write(f"TABLA: {tabla}\n")
                    f.write(f"{'='*80}\n\n")

                    # SHOW CREATE TABLE
                    cursor.execute(f"SHOW CREATE TABLE `{tabla}`")
                    result = cursor.fetchone()
                    create_sql = result['Create Table']
                    # Convertir bytes a string si es necesario
                    if isinstance(create_sql, bytes):
                        create_sql = create_sql.decode('utf-8')
                    f.write(create_sql + ";\n\n")

                    # Conteo
                    cursor.execute(f"SELECT COUNT(*) as total FROM `{tabla}`")
                    total = cursor.fetchone()['total']
                    f.write(f"-- Registros: {total:,}\n\n")

        print("\n[OK] Estructura exportada a: VB_DB_STRUCTURE.txt")

    except Exception as e:
        print(f"[ERROR] Error exportando: {e}")

def main():
    print("\n" + "="*80)
    print("ANÁLISIS DE SISTEMA VB CRM - sistemaatinet")
    print("="*80 + "\n")

    conexion = conectar()
    if not conexion:
        return

    try:
        # Listar todas las tablas
        todas_tablas = listar_todas_tablas(conexion)

        # Analizar solo tablas CRM primero
        print("\n" + "#"*80)
        print("ANÁLISIS DETALLADO DE TABLAS CRM")
        print("#"*80)

        tablas_encontradas = [t for t in TABLAS_CRM if t in todas_tablas]

        for tabla in tablas_encontradas:
            analizar_tabla(conexion, tabla)

        # Preguntar si quiere exportar
        print("\n" + "="*80)
        print(f"[OK] Analisis completado de {len(tablas_encontradas)} tablas CRM")
        print("="*80)

        # Exportar estructura a archivo
        exportar_estructura_txt(conexion, tablas_encontradas)

    finally:
        conexion.close()
        print("\n[CERRADO] Conexion cerrada\n")

if __name__ == "__main__":
    main()
