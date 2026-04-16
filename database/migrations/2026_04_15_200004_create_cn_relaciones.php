<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tablas de relaciones del módulo Control Notarial (18 tablas tbl_rel_*).
     * Depende de: todas las migraciones anteriores de Control Notarial.
     */
    public function up(): void
    {
        Schema::create('tbl_rel_cliente_conyuge', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->integer('Cliente_Id');
            $table->string('Nombre', 100)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Apellido_Paterno', 100)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Apellido_Materno', 100)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Tipo_Identificacion', 100)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Numero_Identificacion', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Autoridad_Emisora', 100)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Regimen_Conyugal', 100)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->boolean('Activo')->default(1);
            $table->dateTime('Fecha_Creacion')->useCurrent();

            $table->foreign('Cliente_Id')->references('Id')->on('tbl_cat_clientes');
        });

        Schema::create('tbl_rel_cliente_identificaciones', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->integer('Cliente_Id');
            $table->string('Tipo_Identificacion', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Numero', 100)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Emisor', 150)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->dateTime('Vigencia')->nullable();
            $table->string('OCR', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('IDMex', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->dateTime('Fecha_Creacion')->useCurrent();

            $table->foreign('Cliente_Id')->references('Id')->on('tbl_cat_clientes');
        });

        Schema::create('tbl_rel_clientes_domicilios', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->integer('Cliente_Id');
            $table->string('Tipo_Domicilio', 20)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Calle', 200)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Numero_Exterior', 20)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Numero_Interior', 20)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Manzana', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Lote', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Colonia', 200)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Ciudad', 200)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Municipio', 200)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Estado', 200)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Pais', 200)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Codigo_Postal', 10)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->dateTime('Fecha_Creacion')->useCurrent();

            $table->foreign('Cliente_Id')->references('Id')->on('tbl_cat_clientes');
        });

        Schema::create('tbl_rel_expediente_clientes', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->integer('Expediente_Id')->nullable();
            $table->integer('Cliente_Id')->nullable();
            $table->integer('Compareciente_Id')->nullable();
            $table->boolean('Firma')->default(0);
            $table->dateTime('Fecha_Firma')->nullable();
            $table->dateTime('Fecha_Creacion')->useCurrent();

            $table->foreign('Expediente_Id')->references('Id')->on('tbl_ope_expedientes');
            $table->foreign('Cliente_Id')->references('Id')->on('tbl_cat_clientes');
            $table->foreign('Compareciente_Id')->references('Id')->on('tbl_cat_comparecientes');
        });

        Schema::create('tbl_rel_expediente_dependencias', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->integer('Expediente_Id')->nullable();
            $table->integer('Dependencia_Id')->nullable();
            $table->string('Folio_Real', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Volumen', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Seccion', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Libro', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Folio', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Fojas', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Partida', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Estatus', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->dateTime('Fecha_Ingreso')->nullable();
            $table->dateTime('Fecha_Rechazo')->nullable();
            $table->dateTime('Fecha_Subsanado')->nullable();
            $table->dateTime('Fecha_Reingreso')->nullable();
            $table->dateTime('Fecha_Registro')->nullable();
            $table->dateTime('Fecha_Recoger_Dependencia')->nullable();
            $table->dateTime('Fecha_Conclusion')->nullable();
            $table->text('Observaciones')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->boolean('Activo')->nullable();
            $table->dateTime('Fecha_Creacion')->useCurrent();

            $table->foreign('Expediente_Id')->references('Id')->on('tbl_ope_expedientes');
            $table->foreign('Dependencia_Id')->references('Id')->on('tbl_cat_dependencias_publicas');
        });

        Schema::create('tbl_rel_expediente_documentos', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->integer('Expediente_Id')->nullable();
            $table->integer('Cliente_Id')->nullable();
            $table->integer('Documento_Id')->nullable();
            $table->dateTime('Fecha_Entrega')->nullable();
            $table->integer('Usuario_Recibe_Id')->nullable();
            $table->dateTime('Fecha_Recepcion')->nullable();
            $table->integer('Usuario_Recepcion_Id')->nullable();
            $table->text('Observaciones')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->boolean('Copia')->default(0);
            $table->boolean('Original')->default(0);
            $table->dateTime('Fecha_Creacion')->useCurrent();

            $table->foreign('Expediente_Id')->references('Id')->on('tbl_ope_expedientes');
            $table->foreign('Cliente_Id')->references('Id')->on('tbl_cat_clientes');
            $table->foreign('Documento_Id')->references('Id')->on('tbl_cat_documentos');
            $table->foreign('Usuario_Recibe_Id')->references('Id')->on('tbl_cat_usuarios');
            $table->foreign('Usuario_Recepcion_Id')->references('Id')->on('tbl_cat_usuarios');
        });

        Schema::create('tbl_rel_expediente_etapas', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->integer('Expediente_Id')->nullable();
            $table->integer('Etapa_Id')->nullable();
            $table->dateTime('Fecha_Inicio')->nullable();
            $table->integer('Usuario_Inicio_Id')->nullable();
            $table->dateTime('Fecha_Fin')->nullable();
            $table->integer('Usuario_Fin_Id')->nullable();
            $table->text('Observaciones')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->dateTime('Fecha_Creacion')->useCurrent();

            $table->foreign('Expediente_Id')->references('Id')->on('tbl_ope_expedientes');
            $table->foreign('Etapa_Id')->references('Id')->on('tbl_cat_etapas');
            $table->foreign('Usuario_Inicio_Id')->references('Id')->on('tbl_cat_usuarios');
            $table->foreign('Usuario_Fin_Id')->references('Id')->on('tbl_cat_usuarios');
        });

        Schema::create('tbl_rel_expediente_inmuebles', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->integer('Expediente_Id')->nullable();
            $table->integer('Numero_Inmueble')->nullable();
            $table->integer('Tipo_Factura_Id')->nullable();
            $table->integer('Tipo_Inmueble_Id')->nullable();
            $table->integer('Tipo_Inmueble_DeclaraNot_Id')->nullable();
            $table->text('Medidas_Colindancias')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->text('Antecedentes')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->text('Descripcion')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Calle', 200)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Numero_Exterior', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Numero_Interior', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Manzana', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Lote', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Colonia', 200)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Ciudad', 200)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Municipio', 200)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Codigo_Postal', 10)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Estado', 200)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Pais', 200)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->decimal('Valor_Avaluo', 18, 2)->nullable();
            $table->decimal('Valor_Operacion', 18, 2)->nullable();
            $table->decimal('Valor_Catastral', 18, 2)->nullable();
            $table->string('Clave_Catastral', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->integer('Superficie_Terreno')->nullable();
            $table->integer('Superficie_Construccion')->nullable();
            $table->integer('Cuenta_Agua')->nullable();
            $table->integer('Cuenta_Predial')->nullable();
            $table->dateTime('Fecha_Registro')->nullable();
            $table->string('Folio_Real', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Inscripcion', 100)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->integer('Folio_Inicial')->nullable();
            $table->integer('Folio_Final')->nullable();
            $table->integer('Folio_Electronico')->nullable();
            $table->integer('Partida')->nullable();
            $table->integer('Volumen')->nullable();
            $table->integer('Seccion')->nullable();
            $table->dateTime('Fecha_Creacion')->useCurrent();

            $table->foreign('Expediente_Id')->references('Id')->on('tbl_ope_expedientes');
            $table->foreign('Tipo_Factura_Id')->references('Id')->on('tbl_cat_tipo_inmuebles');
            $table->foreign('Tipo_Inmueble_Id')->references('Id')->on('tbl_cat_tipo_inmuebles');
            $table->foreign('Tipo_Inmueble_DeclaraNot_Id')->references('Id')->on('tbl_cat_tipo_inmuebles');
        });

        Schema::create('tbl_rel_expediente_inmuebles_pagos_declaranot', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->integer('Expediente_Id')->nullable();
            $table->integer('Monto')->nullable();
            $table->string('Forma_Pago', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Modalidad_Pago', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Instrumento_Monetario', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Institucion_Financiera', 200)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->integer('Numero_Cuenta')->nullable();
            $table->string('Especifica', 200)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->integer('Moneda_Id')->nullable();
            $table->dateTime('Fecha_Pago')->nullable();
            $table->dateTime('Fecha_Creacion')->useCurrent();

            $table->foreign('Expediente_Id', 'fk_reimppd_exp')->references('Id')->on('tbl_ope_expedientes');
            $table->foreign('Moneda_Id', 'fk_reimppd_mon')->references('Id')->on('tbl_cat_monedas');
        });

        Schema::create('tbl_rel_expediente_operaciones', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->integer('Expediente_Id');
            $table->integer('Operacion_Id');
            $table->dateTime('Fecha_Creacion')->useCurrent();

            $table->foreign('Expediente_Id')->references('Id')->on('tbl_ope_expedientes');
            $table->foreign('Operacion_Id')->references('Id')->on('tbl_cat_operaciones');
        });

        Schema::create('tbl_rel_operaciones_documentos', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->integer('Operacion_Id');
            $table->integer('Documento_Id');
            $table->dateTime('Fecha_Creacion')->useCurrent();

            $table->foreign('Operacion_Id')->references('Id')->on('tbl_cat_operaciones');
            $table->foreign('Documento_Id')->references('Id')->on('tbl_cat_documentos');
        });

        Schema::create('tbl_rel_operaciones_etapas', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->integer('Operacion_Id');
            $table->integer('Etapa_Id');
            $table->dateTime('Fecha_Creacion')->useCurrent();

            $table->foreign('Operacion_Id')->references('Id')->on('tbl_cat_operaciones');
            $table->foreign('Etapa_Id')->references('Id')->on('tbl_cat_etapas');
        });

        Schema::create('tbl_rel_operaciones_impuestos_derechos', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->integer('Operacion_Id');
            $table->integer('Impuestos_Derechos_Id');
            $table->dateTime('Fecha_Creacion')->useCurrent();

            $table->foreign('Operacion_Id', 'fk_roimpder_opid')->references('Id')->on('tbl_cat_operaciones');
            $table->foreign('Impuestos_Derechos_Id', 'fk_roimpder_impid')->references('Id')->on('tbl_cat_impuestos_derechos');
        });

        Schema::create('tbl_rel_presupuesto_gastos_notariales', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->integer('Presupuesto_Id');
            $table->text('Concepto')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->decimal('Importe', 18, 2)->default(0.00);
            $table->dateTime('Fecha_Creacion')->useCurrent();

            $table->foreign('Presupuesto_Id')->references('Id')->on('tbl_ope_presupuesto');
        });

        Schema::create('tbl_rel_presupuesto_impuestos_derechos', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->integer('Presupuesto_Id');
            $table->integer('Impuestos_Derechos_Id');
            $table->decimal('Importe', 18, 2)->nullable();
            $table->integer('Cantidad')->nullable();
            $table->text('Observaciones')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->dateTime('Fecha_Creacion')->useCurrent();

            $table->foreign('Presupuesto_Id', 'fk_rpimpder_pid')->references('Id')->on('tbl_ope_presupuesto');
            $table->foreign('Impuestos_Derechos_Id', 'fk_rpimpder_impid')->references('Id')->on('tbl_cat_impuestos_derechos');
        });

        Schema::create('tbl_rel_presupuesto_previo_gastos_notariales', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->integer('Presupuesto_Previo_Id');
            $table->text('Concepto')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->decimal('Importe', 18, 2)->default(0.00);
            $table->dateTime('Fecha_Creacion')->useCurrent();

            $table->foreign('Presupuesto_Previo_Id', 'fk_rppgn_ppid')->references('Id')->on('tbl_ope_presupuesto_previo');
        });

        Schema::create('tbl_rel_presupuesto_previo_impuestos_derechos', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->integer('Presupuesto_Previo_Id');
            $table->integer('Impuestos_Derechos_Id');
            $table->decimal('Importe', 18, 2)->nullable();
            $table->integer('Cantidad')->nullable();
            $table->text('Observaciones')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->dateTime('Fecha_Creacion')->useCurrent();

            $table->foreign('Presupuesto_Previo_Id', 'fk_rppid_ppid')->references('Id')->on('tbl_ope_presupuesto_previo');
            $table->foreign('Impuestos_Derechos_Id', 'fk_rppid_impid')->references('Id')->on('tbl_cat_impuestos_derechos');
        });

        Schema::create('tbl_rel_usuarios_modulos', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->integer('Usuario_Id');
            $table->integer('Modulo_Id');
            $table->dateTime('Fecha_Creacion')->useCurrent();

            $table->foreign('Usuario_Id')->references('Id')->on('tbl_cat_usuarios');
            $table->foreign('Modulo_Id')->references('Id')->on('tbl_cat_modulos');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_rel_usuarios_modulos');
        Schema::dropIfExists('tbl_rel_presupuesto_previo_impuestos_derechos');
        Schema::dropIfExists('tbl_rel_presupuesto_previo_gastos_notariales');
        Schema::dropIfExists('tbl_rel_presupuesto_impuestos_derechos');
        Schema::dropIfExists('tbl_rel_presupuesto_gastos_notariales');
        Schema::dropIfExists('tbl_rel_operaciones_impuestos_derechos');
        Schema::dropIfExists('tbl_rel_operaciones_etapas');
        Schema::dropIfExists('tbl_rel_operaciones_documentos');
        Schema::dropIfExists('tbl_rel_expediente_operaciones');
        Schema::dropIfExists('tbl_rel_expediente_inmuebles_pagos_declaranot');
        Schema::dropIfExists('tbl_rel_expediente_inmuebles');
        Schema::dropIfExists('tbl_rel_expediente_etapas');
        Schema::dropIfExists('tbl_rel_expediente_documentos');
        Schema::dropIfExists('tbl_rel_expediente_dependencias');
        Schema::dropIfExists('tbl_rel_expediente_clientes');
        Schema::dropIfExists('tbl_rel_clientes_domicilios');
        Schema::dropIfExists('tbl_rel_cliente_identificaciones');
        Schema::dropIfExists('tbl_rel_cliente_conyuge');
    }
};
