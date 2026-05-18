#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Análisis forense del campo 'expediente' en seguimientos
Objetivo: Descifrar si es Cliente ID, número de expediente notarial, u otra cosa
"""

import pymysql
from tabulate import tabulate
import re

# Conexión al VB legacy
config = {
    'host': 'srvatinet',
    'port': 3306,
    'user': 'root',
    'password': '123456',
    'database': 'sistemaatinet',
    'charset': 'utf8'
}

def conectar():
    return pymysql.connect(**config)

def analizar_patrones_expediente(conn):
    """Analiza patrones en el campo expediente"""
    print("="*80)
    print("ANÁLISIS DE PATRONES EN CAMPO 'expediente'")
    print("="*80)

    # Análisis en seguimientosatencion
    print("\n[1] SEGUIMIENTOS ATENCIÓN")
    print("-" * 80)

    with conn.cursor(pymysql.cursors.DictCursor) as cursor:
        # Muestra de valores
        cursor.execute("""
            SELECT expediente, usuario, concepto, fechallamada
            FROM seguimientosatencion
            WHERE expediente IS NOT NULL AND expediente != ''
            ORDER BY id
            LIMIT 20
        """)

        muestra = cursor.fetchall()

        if muestra:
            print("\nMuestra de registros:")
            print(tabulate(
                [[r['expediente'], r['usuario'], r['concepto'][:50] + '...', r['fechallamada']]
                 for r in muestra],
                headers=['Expediente', 'Usuario', 'Concepto (truncado)', 'Fecha'],
                tablefmt='grid'
            ))

        # Patrones: ¿Son números? ¿Tienen formato?
        cursor.execute("""
            SELECT
                expediente,
                LENGTH(expediente) as longitud,
                COUNT(*) as cantidad
            FROM seguimientosatencion
            WHERE expediente IS NOT NULL AND expediente != ''
            GROUP BY expediente, LENGTH(expediente)
            ORDER BY cantidad DESC
            LIMIT 10
        """)

        patrones = cursor.fetchall()
        print("\n\nPatrones más frecuentes (Top 10):")
        print(tabulate(
            [[p['expediente'], p['longitud'], p['cantidad']] for p in patrones],
            headers=['Valor', 'Longitud', 'Frecuencia'],
            tablefmt='grid'
        ))

        # ¿Son numéricos?
        cursor.execute("""
            SELECT
                CASE
                    WHEN expediente REGEXP '^[0-9]+$' THEN 'Solo números'
                    WHEN expediente REGEXP '^[A-Z0-9-]+$' THEN 'Alfanumérico con guiones'
                    WHEN expediente REGEXP '^[A-Za-z]' THEN 'Empieza con letra'
                    ELSE 'Otro formato'
                END as tipo_formato,
                COUNT(*) as cantidad
            FROM seguimientosatencion
            WHERE expediente IS NOT NULL AND expediente != ''
            GROUP BY tipo_formato
            ORDER BY cantidad DESC
        """)

        formatos = cursor.fetchall()
        print("\n\nDistribución por formato:")
        print(tabulate(
            [[f['tipo_formato'], f['cantidad']] for f in formatos],
            headers=['Formato', 'Cantidad'],
            tablefmt='grid'
        ))

def cruzar_con_clientes(conn):
    """Intenta cruzar expediente con clientes.Cliente"""
    print("\n" + "="*80)
    print("CRUCE CON TABLA CLIENTES")
    print("="*80)

    with conn.cursor(pymysql.cursors.DictCursor) as cursor:
        # ¿Cuántos expedientes coinciden con clientes.Cliente?
        cursor.execute("""
            SELECT
                COUNT(DISTINCT sa.expediente) as total_expedientes,
                COUNT(DISTINCT CASE
                    WHEN c.Cliente IS NOT NULL THEN sa.expediente
                END) as coinciden_con_clientes,
                COUNT(DISTINCT CASE
                    WHEN c.Cliente IS NULL THEN sa.expediente
                END) as no_coinciden
            FROM seguimientosatencion sa
            LEFT JOIN clientes c ON sa.expediente = c.Cliente
            WHERE sa.expediente IS NOT NULL AND sa.expediente != ''
        """)

        resultado = cursor.fetchone()

        print(f"\nTotal expedientes únicos:     {resultado['total_expedientes']}")
        print(f"Coinciden con clientes.Cliente: {resultado['coinciden_con_clientes']}")
        print(f"NO coinciden:                   {resultado['no_coinciden']}")

        if resultado['coinciden_con_clientes'] > 0:
            porcentaje = (resultado['coinciden_con_clientes'] / resultado['total_expedientes']) * 100
            print(f"\nPorcentaje de coincidencia:    {porcentaje:.1f}%")

            if porcentaje > 70:
                print("\n✓ CONCLUSIÓN: expediente probablemente es clientes.Cliente (FK)")
            elif porcentaje > 30:
                print("\n? CONCLUSIÓN: expediente es MIXTO (a veces Cliente, a veces otra cosa)")
            else:
                print("\n✗ CONCLUSIÓN: expediente NO es clientes.Cliente")

        # Ejemplos de coincidencias
        cursor.execute("""
            SELECT
                sa.expediente,
                c.Nombre as cliente_nombre,
                sa.usuario,
                sa.concepto,
                sa.fechallamada
            FROM seguimientosatencion sa
            JOIN clientes c ON sa.expediente = c.Cliente
            WHERE sa.expediente IS NOT NULL
            ORDER BY sa.fechallamada DESC
            LIMIT 10
        """)

        coincidencias = cursor.fetchall()

        if coincidencias:
            print("\n\nEjemplos de COINCIDENCIAS (expediente = clientes.Cliente):")
            print(tabulate(
                [[c['expediente'], c['cliente_nombre'][:30], c['usuario'], c['concepto'][:40] + '...']
                 for c in coincidencias],
                headers=['Expediente', 'Cliente', 'Usuario', 'Concepto'],
                tablefmt='grid'
            ))

def cruzar_con_expedientes_notariales(conn):
    """Intenta cruzar con tabla expedientes (si existe)"""
    print("\n" + "="*80)
    print("CRUCE CON TABLA EXPEDIENTES NOTARIALES")
    print("="*80)

    with conn.cursor() as cursor:
        # Verificar si existe tabla expedientes
        cursor.execute("SHOW TABLES LIKE 'expedientes'")
        if not cursor.fetchone():
            print("\n[INFO] No existe tabla 'expedientes' en sistemaatinet")
            return

        # Describir tabla expedientes
        cursor.execute("DESCRIBE expedientes")
        estructura = cursor.fetchall()

        print("\nEstructura de tabla 'expedientes':")
        print(tabulate(
            estructura,
            headers=['Campo', 'Tipo', 'Null', 'Key', 'Default', 'Extra'],
            tablefmt='grid'
        ))

        # Intentar cruce
        cursor.execute("""
            SELECT
                COUNT(DISTINCT sa.expediente) as total_seguimientos,
                COUNT(DISTINCT CASE
                    WHEN e.Expediente IS NOT NULL THEN sa.expediente
                END) as coinciden_con_expedientes
            FROM seguimientosatencion sa
            LEFT JOIN expedientes e ON sa.expediente = e.Expediente
            WHERE sa.expediente IS NOT NULL AND sa.expediente != ''
        """)

        resultado = cursor.fetchone()
        print(f"\n\nCruce con expedientes notariales:")
        print(f"Total expedientes en seguimientos: {resultado[0]}")
        print(f"Coinciden con tabla expedientes:    {resultado[1]}")

def analizar_alarmas(conn):
    """Analiza campo Expediente en tabla alarmas"""
    print("\n" + "="*80)
    print("ANÁLISIS DE CAMPO 'Expediente' EN ALARMAS")
    print("="*80)

    with conn.cursor(pymysql.cursors.DictCursor) as cursor:
        # Muestra
        cursor.execute("""
            SELECT Expediente, Usuario, Concepto, DiaRegistro
            FROM alarmas
            WHERE Expediente IS NOT NULL AND Expediente != ''
            ORDER BY Indice DESC
            LIMIT 10
        """)

        muestra = cursor.fetchall()

        if muestra:
            print("\nMuestra de alarmas con Expediente:")
            print(tabulate(
                [[a['Expediente'], a['Usuario'], a['Concepto'][:40] + '...', a['DiaRegistro']]
                 for a in muestra],
                headers=['Expediente', 'Usuario', 'Concepto', 'Fecha'],
                tablefmt='grid'
            ))

        # Cruce con clientes
        cursor.execute("""
            SELECT
                COUNT(*) as total_alarmas,
                COUNT(CASE WHEN c.Cliente IS NOT NULL THEN 1 END) as con_cliente
            FROM alarmas a
            LEFT JOIN clientes c ON a.Expediente = c.Cliente
            WHERE a.Expediente IS NOT NULL AND a.Expediente != ''
        """)

        resultado = cursor.fetchone()

        if resultado['total_alarmas'] > 0:
            porcentaje = (resultado['con_cliente'] / resultado['total_alarmas']) * 100
            print(f"\n\nAlarmas con Expediente: {resultado['total_alarmas']}")
            print(f"Coinciden con Cliente:  {resultado['con_cliente']} ({porcentaje:.1f}%)")

def generar_recomendacion():
    """Genera recomendación de diseño basada en análisis"""
    print("\n" + "="*80)
    print("RECOMENDACIÓN DE DISEÑO")
    print("="*80)

    recomendacion = """
Basado en el análisis de patrones:

OPCIÓN A: Si coincidencia > 70%
--------------------------------
  - expediente = clientes.Cliente (FK)
  - Migración Laravel:
    * seguimientos_atencion.cliente_id (FK -> clientes.id)
    * alarmas.cliente_id (FK -> clientes.id)

OPCIÓN B: Si coincidencia 30-70% (MIXTO)
-----------------------------------------
  - Crear campo polimórfico:
    * seguimientos_atencion.relacionable_tipo (Cliente, Expediente, etc.)
    * seguimientos_atencion.relacionable_id
  - O separar:
    * seguimientos_atencion.cliente_id (nullable)
    * seguimientos_atencion.expediente_numero (nullable)

OPCIÓN C: Si coincidencia < 30%
--------------------------------
  - expediente es algo diferente (número interno, folio, etc.)
  - Mantener como VARCHAR pero renombrar:
    * seguimientos_atencion.folio_interno o numero_referencia
  - Investigar más a fondo qué es

VALIDACIÓN ADICIONAL:
---------------------
Si existe tabla 'expedientes' notariales, verificar:
  - ¿Hay una relación expedientes -> clientes?
  - ¿Los seguimientos son sobre expedientes o sobre clientes?
  - Posibilidad: expediente.cliente_id + seguimientos.expediente_id
"""

    print(recomendacion)

def main():
    conn = conectar()
    print("\n[OK] Conectado a sistemaatinet (VB legacy)\n")

    try:
        analizar_patrones_expediente(conn)
        cruzar_con_clientes(conn)
        cruzar_con_expedientes_notariales(conn)
        analizar_alarmas(conn)
        generar_recomendacion()

        print("\n" + "="*80)
        print("[OK] Análisis forense completado")
        print("="*80)

    finally:
        conn.close()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n[CANCELADO] Análisis interrumpido")
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
