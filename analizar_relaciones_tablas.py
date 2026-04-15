# -*- coding: utf-8 -*-
"""
Script para analizar relaciones entre tablas en sistemaatinet
Busca Foreign Keys explícitas y relaciones lógicas
"""
import sys
import pymysql
from tabulate import tabulate
from collections import defaultdict

# Forzar encoding UTF-8 en Windows
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
        print(f"[ERROR] Error al conectar: {e}")
        return None

def obtener_todas_tablas(conexion):
    """Obtiene lista de todas las tablas"""
    with conexion.cursor() as cursor:
        cursor.execute("SHOW TABLES")
        return [row[f"Tables_in_{CONFIG['database']}"] for row in cursor.fetchall()]

def obtener_foreign_keys(conexion):
    """Obtiene todas las Foreign Keys explícitas"""
    with conexion.cursor() as cursor:
        query = """
            SELECT 
                TABLE_NAME,
                COLUMN_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME,
                CONSTRAINT_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = %s
            AND REFERENCED_TABLE_NAME IS NOT NULL
            ORDER BY TABLE_NAME, COLUMN_NAME
        """
        cursor.execute(query, (CONFIG['database'],))
        return cursor.fetchall()

def obtener_estructura_tabla(conexion, tabla):
    """Obtiene estructura de una tabla"""
    with conexion.cursor() as cursor:
        cursor.execute(f"DESCRIBE `{tabla}`")
        return cursor.fetchall()

def analizar_relaciones_logicas(conexion, todas_tablas):
    """
    Analiza relaciones lógicas basándose en:
    1. Nombres de campos que coinciden con nombres de tablas
    2. Campos que terminan en 'id' o 'Id'
    3. Campos que podrían ser FK por su nombre
    """
    relaciones_posibles = []
    
    # Tablas de catálogos conocidas
    tablas_catalogos = {
        'ciudad': ['Ciudad', 'CiudadNac'],
        'colonia': ['Colonia'],
        'estado': ['Estado', 'EstadoNac'],
        'municipio': ['Municipio', 'MunicipioNac'],
        'correo': ['Email'],
        'usuario': ['Usuario', 'Admin'],
        'expedientes': ['Expediente'],
        'operaciones': ['Operacion', 'NOperacion'],
        'personalidades': ['TipoCliente'],
    }
    
    print("\n" + "="*80)
    print("ANALIZANDO RELACIONES LOGICAS POR NOMBRES DE CAMPOS")
    print("="*80 + "\n")
    
    for tabla in todas_tablas:
        estructura = obtener_estructura_tabla(conexion, tabla)
        
        for campo_info in estructura:
            campo = campo_info['Field']
            tipo = campo_info['Type']
            
            # Buscar si el nombre del campo coincide con una tabla de catálogo
            for tabla_catalogo, posibles_nombres in tablas_catalogos.items():
                if tabla_catalogo in todas_tablas and campo in posibles_nombres:
                    relaciones_posibles.append({
                        'tabla_origen': tabla,
                        'campo_origen': campo,
                        'tabla_destino': tabla_catalogo,
                        'tipo_relacion': 'Por nombre coincidente',
                        'tipo_campo': tipo
                    })
    
    return relaciones_posibles

def analizar_valores_compartidos(conexion, tabla_origen, campo_origen, tabla_destino):
    """
    Verifica si los valores de un campo en tabla_origen
    existen como registros en tabla_destino
    """
    try:
        with conexion.cursor() as cursor:
            # Obtener campo PK de tabla destino
            cursor.execute(f"SHOW KEYS FROM `{tabla_destino}` WHERE Key_name = 'PRIMARY'")
            pk_info = cursor.fetchone()
            if not pk_info:
                return None
            
            campo_pk = pk_info['Column_name']
            
            # Contar valores que coinciden
            query = f"""
                SELECT COUNT(DISTINCT o.`{campo_origen}`) as total_origen,
                       COUNT(DISTINCT d.`{campo_pk}`) as total_destino,
                       COUNT(DISTINCT CASE WHEN d.`{campo_pk}` IS NOT NULL THEN o.`{campo_origen}` END) as coincidencias
                FROM `{tabla_origen}` o
                LEFT JOIN `{tabla_destino}` d ON CAST(o.`{campo_origen}` AS CHAR) = CAST(d.`{campo_pk}` AS CHAR)
                WHERE o.`{campo_origen}` IS NOT NULL AND o.`{campo_origen}` != ''
            """
            cursor.execute(query)
            resultado = cursor.fetchone()
            
            if resultado['total_origen'] > 0:
                porcentaje = (resultado['coincidencias'] / resultado['total_origen']) * 100
                return {
                    'total_origen': resultado['total_origen'],
                    'coincidencias': resultado['coincidencias'],
                    'porcentaje': porcentaje
                }
            return None
    except Exception as e:
        return None

def analizar_tabla_especifica(conexion, tabla):
    """Analiza en detalle una tabla específica"""
    print(f"\n{'='*80}")
    print(f"ANALISIS DETALLADO: {tabla}")
    print(f"{'='*80}\n")
    
    estructura = obtener_estructura_tabla(conexion, tabla)
    
    # Mostrar estructura
    headers = ['Campo', 'Tipo', 'Null', 'Key', 'Default']
    rows = [[c['Field'], c['Type'], c['Null'], c['Key'], c['Default']] for c in estructura]
    print(tabulate(rows, headers=headers, tablefmt='grid'))
    
    # Contar registros
    with conexion.cursor() as cursor:
        cursor.execute(f"SELECT COUNT(*) as total FROM `{tabla}`")
        total = cursor.fetchone()['total']
        print(f"\n[REGISTROS]: {total:,}")
        
        # Mostrar muestra si es tabla de catálogo pequeña
        if total <= 100:
            cursor.execute(f"SELECT * FROM `{tabla}` LIMIT 10")
            datos = cursor.fetchall()
            if datos:
                print(f"\n[MUESTRA DE DATOS]:")
                columnas = list(datos[0].keys())
                rows_data = [[str(d.get(col, ''))[:40] for col in columnas] for d in datos]
                print(tabulate(rows_data, headers=columnas, tablefmt='grid'))

def main():
    print("\n" + "="*80)
    print("ANALISIS DE RELACIONES ENTRE TABLAS - sistemaatinet")
    print("="*80 + "\n")
    
    conexion = conectar()
    if not conexion:
        return
    
    try:
        # 1. Obtener todas las tablas
        todas_tablas = obtener_todas_tablas(conexion)
        print(f"[INFO] Total de tablas: {len(todas_tablas)}\n")
        
        # 2. Verificar Foreign Keys explícitas
        print("="*80)
        print("1. FOREIGN KEYS EXPLICITAS (INFORMATION_SCHEMA)")
        print("="*80 + "\n")
        
        fks = obtener_foreign_keys(conexion)
        if fks:
            headers = ['Tabla', 'Campo', 'Referencia a Tabla', 'Campo Ref', 'Constraint']
            rows = [[fk['TABLE_NAME'], fk['COLUMN_NAME'], 
                    fk['REFERENCED_TABLE_NAME'], fk['REFERENCED_COLUMN_NAME'],
                    fk['CONSTRAINT_NAME']] for fk in fks]
            print(tabulate(rows, headers=headers, tablefmt='grid'))
            print(f"\n[TOTAL]: {len(fks)} foreign keys encontradas")
        else:
            print("[INFO] No se encontraron Foreign Keys explícitas en la base de datos")
            print("       (Esto es común en sistemas VB6 legacy que no usan FK en MySQL)")
        
        # 3. Analizar relaciones lógicas
        relaciones_logicas = analizar_relaciones_logicas(conexion, todas_tablas)
        
        if relaciones_logicas:
            print("\n" + "="*80)
            print("2. RELACIONES LOGICAS DETECTADAS (por nombre de campos)")
            print("="*80 + "\n")
            
            headers = ['Tabla Origen', 'Campo', 'Posible Tabla Destino', 'Tipo']
            rows = [[r['tabla_origen'], r['campo_origen'], 
                    r['tabla_destino'], r['tipo_relacion']] for r in relaciones_logicas]
            print(tabulate(rows, headers=headers, tablefmt='grid'))
            print(f"\n[TOTAL]: {len(relaciones_logicas)} relaciones logicas detectadas")
            
            # 4. Verificar algunas relaciones con datos reales
            print("\n" + "="*80)
            print("3. VERIFICACION DE RELACIONES CON DATOS REALES")
            print("="*80 + "\n")
            print("[INFO] Verificando si los valores coinciden entre tablas...")
            print()
            
            relaciones_verificadas = []
            for relacion in relaciones_logicas[:10]:  # Solo verificar las primeras 10
                resultado = analizar_valores_compartidos(
                    conexion,
                    relacion['tabla_origen'],
                    relacion['campo_origen'],
                    relacion['tabla_destino']
                )
                
                if resultado and resultado['total_origen'] > 0:
                    relaciones_verificadas.append({
                        'Tabla Origen': relacion['tabla_origen'],
                        'Campo': relacion['campo_origen'],
                        'Tabla Destino': relacion['tabla_destino'],
                        'Valores Origen': resultado['total_origen'],
                        'Coincidencias': resultado['coincidencias'],
                        'Porcentaje': f"{resultado['porcentaje']:.1f}%"
                    })
            
            if relaciones_verificadas:
                print(tabulate(relaciones_verificadas, headers='keys', tablefmt='grid'))
        
        # 5. Analizar tablas de catálogos importantes
        tablas_catalogos_importantes = [
            'ciudad', 'colonia', 'estado', 'municipio', 
            'correo', 'usuario', 'personalidades'
        ]
        
        print("\n" + "="*80)
        print("4. ANALISIS DE TABLAS DE CATALOGOS")
        print("="*80)
        
        for tabla in tablas_catalogos_importantes:
            if tabla in todas_tablas:
                analizar_tabla_especifica(conexion, tabla)
        
        # 6. Exportar resumen a archivo
        print("\n" + "="*80)
        print("EXPORTANDO RESUMEN DE RELACIONES")
        print("="*80 + "\n")
        
        with open('VB_RELACIONES_TABLAS.txt', 'w', encoding='utf-8') as f:
            f.write("="*80 + "\n")
            f.write("ANALISIS DE RELACIONES - sistemaatinet\n")
            f.write("="*80 + "\n\n")
            
            f.write("FOREIGN KEYS EXPLICITAS:\n")
            f.write("-"*80 + "\n")
            if fks:
                for fk in fks:
                    f.write(f"{fk['TABLE_NAME']}.{fk['COLUMN_NAME']} -> ")
                    f.write(f"{fk['REFERENCED_TABLE_NAME']}.{fk['REFERENCED_COLUMN_NAME']}\n")
            else:
                f.write("No se encontraron FK explícitas\n")
            
            f.write("\n\nRELACIONES LOGICAS DETECTADAS:\n")
            f.write("-"*80 + "\n")
            for r in relaciones_logicas:
                f.write(f"{r['tabla_origen']}.{r['campo_origen']} -> ")
                f.write(f"{r['tabla_destino']} ({r['tipo_relacion']})\n")
        
        print("[OK] Resumen exportado a: VB_RELACIONES_TABLAS.txt")
        
    finally:
        conexion.close()
        print("\n[CERRADO] Conexion cerrada\n")

if __name__ == "__main__":
    main()
