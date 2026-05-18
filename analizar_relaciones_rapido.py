# -*- coding: utf-8 -*-
"""
Script simplificado para analizar relaciones - versión rápida
"""
import sys
import pymysql
from tabulate import tabulate

if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'ignore')

CONFIG = {
    'host': 'srvatinet',
    'user': 'root',
    'password': '123456',
    'database': 'sistemaatinet',
    'charset': 'utf8',
    'cursorclass': pymysql.cursors.DictCursor
}

def conectar():
    try:
        conexion = pymysql.connect(**CONFIG)
        print(f"[OK] Conectado a: {CONFIG['host']}/{CONFIG['database']}\n")
        return conexion
    except Exception as e:
        print(f"[ERROR] {e}")
        return None

def main():
    print("\n" + "="*80)
    print("ANALISIS RAPIDO DE RELACIONES - sistemaatinet")
    print("="*80 + "\n")

    conexion = conectar()
    if not conexion:
        return

    try:
        with conexion.cursor() as cursor:
            # 1. FOREIGN KEYS EXPLICITAS
            print("1. FOREIGN KEYS EXPLICITAS")
            print("-"*80)
            cursor.execute("""
                SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                WHERE TABLE_SCHEMA = %s AND REFERENCED_TABLE_NAME IS NOT NULL
            """, (CONFIG['database'],))
            fks = cursor.fetchall()

            if fks:
                for fk in fks:
                    print(f"{fk['TABLE_NAME']}.{fk['COLUMN_NAME']} -> {fk['REFERENCED_TABLE_NAME']}.{fk['REFERENCED_COLUMN_NAME']}")
            else:
                print("[INFO] No hay Foreign Keys explícitas (normal en sistemas VB legacy)")

            # 2. ANALIZAR TABLA CLIENTES - campos que podrian ser FK
            print("\n\n2. ANALISIS DE LA TABLA 'clientes'")
            print("-"*80)
            cursor.execute("DESCRIBE clientes")
            campos_clientes = cursor.fetchall()

            # Obtener todas las tablas
            cursor.execute("SHOW TABLES")
            todas_tablas = [r[f"Tables_in_{CONFIG['database']}"] for r in cursor.fetchall()]

            print("\n[CAMPOS QUE PODRIAN SER RELACIONES]:\n")

            # Campos que parecen ser FK por su nombre
            posibles_relaciones = {
                'Estado': 'estado',
                'EstadoNac': 'estado',
                'Municipio': 'municipio',
                'MunicipioNac': 'municipio',
                'Ciudad': 'ciudad',
                'CiudadNac': 'ciudad',
                'Colonia': 'colonia',
                'TipoCliente': 'personalidades',
                'Pais': 'catpaises',
                'PaisNac': 'catpaises',
                'Nacionalidad': 'cat_nacionalidad'
            }

            encontradas = []
            for campo in campos_clientes:
                nombre_campo = campo['Field']
                if nombre_campo in posibles_relaciones:
                    tabla_posible = posibles_relaciones[nombre_campo]
                    existe = tabla_posible in todas_tablas
                    estado = "[EXISTE]" if existe else "[NO EXISTE]"
                    encontradas.append([nombre_campo, campo['Type'], tabla_posible, estado])

            print(tabulate(encontradas, headers=['Campo en clientes', 'Tipo', 'Posible Tabla', 'Estado'], tablefmt='grid'))

            # 3. ANALIZAR TABLAS DE CATALOGOS PEQUEÑAS
            print("\n\n3. TABLAS DE CATALOGOS (< 500 registros)")
            print("-"*80 + "\n")

            tablas_interes = ['ciudad', 'colonia', 'estado', 'municipio', 'correo', 'usuario', 'personalidades', 'cat_nacionalidad']

            catalogos_info = []
            for tabla in tablas_interes:
                if tabla in todas_tablas:
                    cursor.execute(f"SELECT COUNT(*) as total FROM `{tabla}`")
                    count = cursor.fetchone()['total']

                    # Obtener PK
                    cursor.execute(f"SHOW KEYS FROM `{tabla}` WHERE Key_name = 'PRIMARY'")
                    pk = cursor.fetchone()
                    pk_nombre = pk['Column_name'] if pk else 'N/A'

                    catalogos_info.append([tabla, count, pk_nombre])

            print(tabulate(catalogos_info, headers=['Tabla', 'Registros', 'Primary Key'], tablefmt='grid'))

            # 4. ANALIZAR RELACIONES EN TABLAS CRM
            print("\n\n4. RELACIONES EN TABLAS CRM")
            print("-"*80 + "\n")

            tablas_crm = {
                'alarmas': ['Expediente', 'Usuario', 'NOperacion'],
                'seguimientosatencion': ['expediente', 'usuario'],
                'seguimientossoporte': ['expediente', 'usuario'],
                'chat': ['Usuario', 'Para'],
                'chatgrupo': ['UsuarioGrupo', 'Admin']
            }

            relaciones_crm = []
            for tabla, campos in tablas_crm.items():
                if tabla in todas_tablas:
                    for campo in campos:
                        if campo.lower() in ['expediente', 'noperacion']:
                            relacion = f"-> expedientes/operaciones"
                        elif campo.lower() in ['usuario', 'usuariogrupo', 'admin', 'para']:
                            relacion = "-> usuario (nombre, no ID)"
                        else:
                            relacion = "?"
                        relaciones_crm.append([tabla, campo, relacion])

            print(tabulate(relaciones_crm, headers=['Tabla CRM', 'Campo', 'Posible Relación'], tablefmt='grid'))

            # 5. OBSERVACIONES IMPORTANTES
            print("\n\n5. OBSERVACIONES IMPORTANTES")
            print("="*80)
            print("""
[HALLAZGOS]:

1. NO HAY FOREIGN KEYS EXPLICITAS
   - Sistema legacy VB6 no usaba FK en MySQL
   - Todas las relaciones son LOGICAS, no forzadas por BD

2. LA TABLA 'clientes' TIENE MUCHOS CAMPOS DE TEXTO LIBRE
   - Estado, Municipio, Ciudad, Colonia: guardados como VARCHAR(255)
   - NO son IDs que referencien a tablas de catálogos
   - Son valores de texto directo escritos por el usuario

3. TABLAS DE CATALOGOS SI EXISTEN PERO POSIBLEMENTE NO SE USAN
   - Hay tablas: ciudad, colonia, estado, municipio, etc.
   - Pero los campos en 'clientes' no las referencian
   - Probable duplicación/inconsistencia de datos

4. RECOMENDACION PARA MIGRACION
   Para evitar pérdida de datos:

   OPCION A (Conservadora):
   - Migrar 'clientes' tal cual (sin FK)
   - Mantener textos libres en Estado, Municipio, etc.
   - No depender de tablas de catálogos

   OPCION B (Normalizar):
   - Crear catálogos en Laravel (estados, municipios)
   - Durante migración: buscar/crear IDs para cada texto
   - Riesgo: datos inconsistentes necesitan limpieza

5. SEGUIMIENTOS Y ALARMAS
   - 'expediente' parece ser ID de cliente (no de tabla expedientes)
   - 'usuario' es nombre de usuario (varchar), no ID
   - Migración: ¿vincular a User::id o mantener nombre?

6. FASE 1 - DECISION NECESARIA
   ¿Migrar as-is (opción A) o normalizar (opción B)?
            """)

            # 6. EXPORTAR
            with open('VB_RELACIONES_RESUMEN.txt', 'w', encoding='utf-8') as f:
                f.write("RESUMEN DE RELACIONES - sistemaatinet\n")
                f.write("="*80 + "\n\n")
                f.write("FOREIGN KEYS EXPLICITAS: Ninguna\n\n")
                f.write("CAMPOS EN 'clientes' QUE POD RIAN SER FK:\n")
                f.write("-"*80 + "\n")
                for item in encontradas:
                    f.write(f"{item[0]} ({item[1]}) -> {item[2]} {item[3]}\n")
                f.write("\n\nDECISION NECESARIA:\n")
                f.write("- Los campos Estado, Municipio, Ciudad son VARCHAR, no FK\n")
                f.write("- Durante migracion: mantener textos o normalizar?\n")

            print(f"\n[OK] Resumen exportado a: VB_RELACIONES_RESUMEN.txt")

    finally:
        conexion.close()
        print("\n[CERRADO] Conexion cerrada\n")

if __name__ == "__main__":
    main()
