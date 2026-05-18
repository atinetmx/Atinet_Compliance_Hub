# -*- coding: utf-8 -*-
"""
Script para listar todas las bases de datos disponibles
y encontrar sistemaatinet o cualquier otra relacionada con CRM
"""
import pymysql

# Configuración BD (tomada de bd_to_excel.py que funciona)
CONFIG_BD = {
    'host': 'srvatinet',
    'user': 'root',
    'password': '123456',
    'charset': 'utf8'
}

print("="*80)
print("LISTANDO BASES DE DATOS EN SERVIDOR MYSQL")
print("="*80 + "\n")

try:
    # Conectar al servidor (sin especificar database)
    conexion = pymysql.connect(**CONFIG_BD)
    print(f"✅ Conectado exitosamente a: {CONFIG_BD['host']}\n")
    
    cursor = conexion.cursor()
    
    # Obtener versión de MySQL
    cursor.execute("SELECT VERSION()")
    version = cursor.fetchone()[0]
    print(f"📌 Versión MySQL: {version}\n")
    
    # Listar todas las bases de datos
    cursor.execute("SHOW DATABASES")
    databases = cursor.fetchall()
    
    print(f"📂 Bases de datos disponibles ({len(databases)}):")
    print("-" * 80)
    
    crm_keywords = ['sistema', 'atinet', 'crm', 'clientes', 'gestion']
    found_sistemaatinet = False
    
    for (db_name,) in databases:
        # Resaltar bases de datos relacionadas con CRM/sistema
        is_relevant = any(keyword in db_name.lower() for keyword in crm_keywords)
        marker = " ⭐ (RELEVANTE)" if is_relevant else ""
        
        if db_name == 'sistemaatinet':
            marker = " ✨ (SISTEMA VB CRM)"
            found_sistemaatinet = True
        
        print(f"   - {db_name}{marker}")
    
    print("-" * 80)
    
    if found_sistemaatinet:
        print("\n✅ Base de datos 'sistemaatinet' ENCONTRADA!")
        print("\n🔍 Explorando tablas en sistemaatinet...")
        print("-" * 80)
        
        cursor.execute("USE sistemaatinet")
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        
        print(f"\n📋 Tablas en sistemaatinet ({len(tables)}):")
        
        # Tablas CRM esperadas
        crm_tables = [
            'clientes', 'alarmas', 'seguimientosventa', 
            'seguimientosatencion', 'seguimientossoporte', 
            'chat', 'chatgrupo', 'usuarios'
        ]
        
        for (table_name,) in tables:
            is_crm = table_name in crm_tables
            marker = " ⭐ (CRM)" if is_crm else ""
            
            # Obtener conteo de registros
            try:
                cursor.execute(f"SELECT COUNT(*) FROM `{table_name}`")
                count = cursor.fetchone()[0]
                print(f"   - {table_name}{marker} ({count:,} registros)")
            except:
                print(f"   - {table_name}{marker}")
        
        print("\n✨ CONFIGURACIÓN CORRECTA PARA PHP:")
        print("-" * 80)
        print("$host = 'srvatinet';")
        print("$database = 'sistemaatinet';")
        print("$username = 'root';")
        print("$password = '123456';")
        print("-" * 80)
    
    cursor.close()
    conexion.close()
    
except pymysql.err.OperationalError as e:
    print(f"❌ ERROR de conexión: {e}")
    print("\n📝 Posibles soluciones:")
    print("   1. Verificar que el servidor MySQL esté corriendo")
    print("   2. Verificar que 'srvatinet' sea accesible desde esta PC")
    print("   3. Verificar credenciales (usuario: root, password: 123456)")
    print("   4. Verificar que no haya firewall bloqueando")
except Exception as e:
    print(f"❌ ERROR: {e}")
