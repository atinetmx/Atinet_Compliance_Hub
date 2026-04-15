# -*- coding: utf-8 -*-
"""
Script para analizar densidad de datos en tabla clientes
Identifica campos vacíos/poblados y propone estrategia de normalización
"""
import sys
import pymysql
from tabulate import tabulate

if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'ignore')

CONFIG_SISTEMA = {
    'host': 'srvatinet',
    'user': 'root',
    'password': '123456',
    'database': 'sistemaatinet',
    'charset': 'utf8',
    'cursorclass': pymysql.cursors.DictCursor
}

CONFIG_CATALOGOS = {
    'host': 'srvatinet',
    'user': 'root',
    'password': '123456',
    'database': 'atinet65_catalogos',
    'charset': 'utf8',
    'cursorclass': pymysql.cursors.DictCursor
}

def conectar(config):
    try:
        conexion = pymysql.connect(**config)
        return conexion
    except Exception as e:
        print(f"[ERROR] {e}")
        return None

def analizar_densidad_clientes(conexion):
    """Analiza qué campos tienen datos reales vs vacíos"""

    with conexion.cursor() as cursor:
        # Obtener estructura
        cursor.execute("DESCRIBE clientes")
        campos = cursor.fetchall()

        # Contar registros totales
        cursor.execute("SELECT COUNT(*) as total FROM clientes")
        total_registros = cursor.fetchone()['total']

        print(f"\n[INFO] Total de clientes: {total_registros:,}")
        print("\n" + "="*80)
        print("ANALISIS DE DENSIDAD DE DATOS - Tabla clientes")
        print("="*80 + "\n")

        densidad = []

        for campo_info in campos:
            campo = campo_info['Field']
            tipo = campo_info['Type']

            # Contar valores no nulos y no vacíos
            if 'int' in tipo.lower():
                query = f"SELECT COUNT(*) as count FROM clientes WHERE `{campo}` IS NOT NULL AND `{campo}` != 0"
            else:
                query = f"SELECT COUNT(*) as count FROM clientes WHERE `{campo}` IS NOT NULL AND `{campo}` != ''"

            cursor.execute(query)
            count = cursor.fetchone()['count']

            porcentaje = (count / total_registros * 100) if total_registros > 0 else 0

            # Clasificar
            if porcentaje >= 80:
                categoria = "ALTO USO"
            elif porcentaje >= 30:
                categoria = "USO MEDIO"
            elif porcentaje >= 5:
                categoria = "USO BAJO"
            else:
                categoria = "CASI VACIO"

            densidad.append({
                'Campo': campo,
                'Tipo': tipo[:30],
                'Poblados': count,
                'Porcentaje': f"{porcentaje:.1f}%",
                'Categoria': categoria
            })

        # Ordenar por porcentaje descendente
        densidad.sort(key=lambda x: float(x['Porcentaje'].rstrip('%')), reverse=True)

        # Mostrar tabla
        print(tabulate(densidad, headers='keys', tablefmt='grid'))

        # Resumen por categoría
        print("\n" + "="*80)
        print("RESUMEN POR CATEGORIA")
        print("="*80 + "\n")

        categorias = {}
        for d in densidad:
            cat = d['Categoria']
            if cat not in categorias:
                categorias[cat] = []
            categorias[cat].append(d['Campo'])

        for cat, campos in categorias.items():
            print(f"{cat}: {len(campos)} campos")
            print(f"  {', '.join(campos[:10])}")
            if len(campos) > 10:
                print(f"  ... y {len(campos) - 10} más")
            print()

        return densidad

def analizar_catalogos_disponibles(conexion):
    """Analiza qué catálogos hay en atinet65_catalogos"""

    print("\n" + "="*80)
    print("CATALOGOS DISPONIBLES EN atinet65_catalogos")
    print("="*80 + "\n")

    with conexion.cursor() as cursor:
        cursor.execute("SHOW TABLES")
        tablas = cursor.fetchall()

        catalogos_info = []

        for tabla_dict in tablas:
            tabla = tabla_dict[f"Tables_in_{CONFIG_CATALOGOS['database']}"]

            # Contar registros
            cursor.execute(f"SELECT COUNT(*) as total FROM `{tabla}`")
            count = cursor.fetchone()['total']

            # Ver estructura
            cursor.execute(f"DESCRIBE `{tabla}` LIMIT 1")
            campos = cursor.fetchall()
            campos_str = ', '.join([c['Field'] for c in campos[:5]])

            catalogos_info.append([tabla, count, campos_str])

        print(tabulate(catalogos_info, headers=['Catálogo', 'Registros', 'Campos (primeros 5)'], tablefmt='grid'))

        return [c[0] for c in catalogos_info]

def proponer_estrategia_normalizacion(densidad, catalogos):
    """Propone estrategia de normalización basada en análisis"""

    print("\n" + "="*80)
    print("ESTRATEGIA DE NORMALIZACION PROPUESTA")
    print("="*80 + "\n")

    # Identificar campos para normalizar
    campos_normalizar = {
        'Estado': 'estados (de catálogos o crear)',
        'EstadoNac': 'estados',
        'Municipio': 'municipios (atinet65_catalogos)',
        'MunicipioNac': 'municipios',
        'Ciudad': 'ciudades (sistemaatinet o crear)',
        'CiudadNac': 'ciudades',
        'Colonia': 'colonias (atinet65_catalogos)',
        'Pais': 'paises (catpaises existente)',
        'PaisNac': 'paises',
        'Nacionalidad': 'nacionalidades (cat_nacionalidad)',
        'TipoCliente': 'personalidades (ya existe)'
    }

    print("1. CAMPOS A NORMALIZAR (crear FK):")
    print("-"*80)

    for campo_origen, tabla_destino in campos_normalizar.items():
        # Buscar el campo en densidad
        campo_data = next((d for d in densidad if d['Campo'] == campo_origen), None)
        if campo_data:
            print(f"  {campo_origen:20} -> {tabla_destino:30} [{campo_data['Porcentaje']:>6} poblado]")

    print("\n2. CAMPOS QUE PUEDEN ENRIQUECERSE DESDE CATALOGOS:")
    print("-"*80)
    print("""
  Si un cliente tiene CP (código postal):
  - Buscar en atinet65_catalogos usando CP
  - Llenar: Estado, Municipio, Ciudad, Colonia
  - Esto podría llenar datos faltantes automáticamente
    """)

    print("\n3. ESTRUCTURA PROPUESTA PARA MIGRACION:")
    print("-"*80)
    print("""
  PASO 1: Crear tablas normalizadas en Laravel
    - estados (id, nombre, codigo)
    - municipios (id, estado_id, nombre, codigo)
    - ciudades (id, municipio_id, nombre)
    - colonias (id, ciudad_id, nombre, cp)

  PASO 2: Poblar catálogos desde atinet65_catalogos
    - Importar estados/municipios/colonias
    - Sincronizar con datos actuales

  PASO 3: Script de migración inteligente de clientes
    - Para cada cliente en VB:
      a) Si tiene datos de ubicación:
         - Buscar/crear IDs en catálogos
         - Asignar FK correspondientes
      b) Si tiene CP pero no otros datos:
         - Buscar en catálogos por CP
         - Llenar datos faltantes
      c) Si no tiene nada:
         - Migrar con NULLs
         - Marcar para revisión manual

  PASO 4: Validación
    - Reportar % de datos llenados
    - Identificar registros que necesitan revisión
    """)

def exportar_plan(densidad):
    """Exporta plan completo a archivo"""

    with open('PLAN_NORMALIZACION_CLIENTES.txt', 'w', encoding='utf-8') as f:
        f.write("="*80 + "\n")
        f.write("PLAN DE NORMALIZACION - Clientes VB a Laravel\n")
        f.write("="*80 + "\n\n")

        f.write("CAMPOS CON ALTO USO (>80% poblados):\n")
        f.write("-"*80 + "\n")
        alto_uso = [d for d in densidad if float(d['Porcentaje'].rstrip('%')) >= 80]
        for campo in alto_uso:
            f.write(f"  {campo['Campo']:30} {campo['Porcentaje']:>6}\n")

        f.write("\n\nCAMPOS CON USO MEDIO (30-80% poblados):\n")
        f.write("-"*80 + "\n")
        medio_uso = [d for d in densidad if 30 <= float(d['Porcentaje'].rstrip('%')) < 80]
        for campo in medio_uso:
            f.write(f"  {campo['Campo']:30} {campo['Porcentaje']:>6}\n")

        f.write("\n\nCAMPOS CASI VACIOS (<5% poblados):\n")
        f.write("-"*80 + "\n")
        vacios = [d for d in densidad if float(d['Porcentaje'].rstrip('%')) < 5]
        for campo in vacios:
            f.write(f"  {campo['Campo']:30} {campo['Porcentaje']:>6}\n")

        f.write("\n\nRECOMENDACIONES:\n")
        f.write("-"*80 + "\n")
        f.write("1. Migrar solo campos con >5% de datos\n")
        f.write("2. Normalizar: Estado, Municipio, Ciudad, Colonia -> FK\n")
        f.write("3. Usar atinet65_catalogos para llenar datos faltantes\n")
        f.write("4. Crear script de enriquecimiento basado en CP\n")

    print("\n[OK] Plan exportado a: PLAN_NORMALIZACION_CLIENTES.txt")

def main():
    print("\n" + "="*80)
    print("ANALISIS DE DENSIDAD Y PLAN DE NORMALIZACION")
    print("="*80 + "\n")

    # Conectar a sistemaatinet
    print("[1/3] Conectando a sistemaatinet...")
    conn_sistema = conectar(CONFIG_SISTEMA)
    if not conn_sistema:
        return

    # Analizar densidad
    print("[2/3] Analizando densidad de datos en clientes...")
    densidad = analizar_densidad_clientes(conn_sistema)
    conn_sistema.close()

    # Conectar a catalogos
    print("\n[3/3] Conectando a atinet65_catalogos...")
    conn_catalogos = conectar(CONFIG_CATALOGOS)
    if not conn_catalogos:
        print("[WARN] No se pudo conectar a catálogos, continuando sin ese análisis")
        catalogos = []
    else:
        catalogos = analizar_catalogos_disponibles(conn_catalogos)
        conn_catalogos.close()

    # Proponer estrategia
    proponer_estrategia_normalizacion(densidad, catalogos)

    # Exportar plan
    exportar_plan(densidad)

    print("\n[COMPLETADO] Análisis terminado\n")

if __name__ == "__main__":
    main()
