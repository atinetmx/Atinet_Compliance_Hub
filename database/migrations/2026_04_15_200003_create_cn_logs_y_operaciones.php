<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tablas de logs y operaciones del módulo Control Notarial.
     * Tablas: tbl_log_bitacora, tbl_log_general, tbl_log_sesiones_activas,
     *         tbl_ope_actas_fuera_protocolo, tbl_ope_cotejos, tbl_ope_entregas_otros_actos,
     *         tbl_ope_expedientes, tbl_ope_movimientos_bancarios,
     *         tbl_ope_presupuesto_previo, tbl_ope_presupuesto, tbl_ope_recibos_provisionales
     * Depende de: 2026_04_15_200000 y 2026_04_15_200001
     */
    public function up(): void
    {
        // --- LOGS ---

        Schema::create('tbl_log_bitacora', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->integer('Usuario_Id');
            $table->text('Operacion')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->text('Tabla')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->integer('Entity_Id')->nullable();
            $table->json('Valor_Original')->nullable();
            $table->json('Valor_Nuevo')->nullable();
            $table->string('Equipo', 80)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->dateTime('Fecha_Creacion')->useCurrent();

            $table->foreign('Usuario_Id')
                ->references('Id')->on('tbl_cat_usuarios');
        });

        Schema::create('tbl_log_general', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->integer('Usuario_Id');
            $table->text('Operacion')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->text('Descripcion')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->text('Datos')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Estatus', 20)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Equipo', 80)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->dateTime('Fecha_Creacion')->useCurrent();

            $table->foreign('Usuario_Id')
                ->references('Id')->on('tbl_cat_usuarios');
        });

        Schema::create('tbl_log_sesiones_activas', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->integer('Usuario_Id');
            $table->text('Token_Jti')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Nombre_Equipo', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->dateTime('Fecha_Creacion')->useCurrent();

            $table->foreign('Usuario_Id')
                ->references('Id')->on('tbl_cat_usuarios');
        });

        // --- OPERACIONES ---

        Schema::create('tbl_ope_actas_fuera_protocolo', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->integer('Foja')->default(0);
            $table->integer('Libro')->default(0);
            $table->text('Concepto')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->text('Descripcion')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->integer('Cliente_Id')->nullable();
            $table->integer('Notario_Id')->nullable();
            $table->integer('Responsable_Id')->nullable();
            $table->decimal('Monto', 18, 2)->default(0.00);
            $table->boolean('Activo')->default(1);
            $table->dateTime('Fecha_Creacion')->useCurrent();

            $table->foreign('Cliente_Id')->references('Id')->on('tbl_cat_clientes');
            $table->foreign('Notario_Id')->references('Id')->on('tbl_cat_usuarios');
            $table->foreign('Responsable_Id')->references('Id')->on('tbl_cat_usuarios');
        });

        Schema::create('tbl_ope_cotejos', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->integer('Foja')->default(0);
            $table->integer('Libro')->default(0);
            $table->text('Concepto')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->text('Descripcion')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->integer('Cliente_Id')->nullable();
            $table->integer('Notario_Id')->nullable();
            $table->integer('Responsable_Id')->nullable();
            $table->decimal('Monto', 18, 2)->default(0.00);
            $table->boolean('Activo')->default(1);
            $table->dateTime('Fecha_Creacion')->useCurrent();

            $table->foreign('Cliente_Id')->references('Id')->on('tbl_cat_clientes');
            $table->foreign('Notario_Id')->references('Id')->on('tbl_cat_usuarios');
            $table->foreign('Responsable_Id')->references('Id')->on('tbl_cat_usuarios');
        });

        Schema::create('tbl_ope_entregas_otros_actos', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->text('Tipo_Entrega')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->integer('Numero_Entrega')->nullable();
            $table->text('Operacion')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->integer('Cliente_Id')->nullable();
            $table->text('Nombre_Recibe')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->text('Observaciones')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->integer('Kinegrama_Inicial')->nullable();
            $table->integer('Kinegrama_Final')->nullable();
            $table->decimal('Monto', 18, 2)->default(0.00);
            $table->boolean('Activo')->default(1);
            $table->dateTime('Fecha_Creacion')->useCurrent();

            $table->foreign('Cliente_Id')->references('Id')->on('tbl_cat_clientes');
        });

        Schema::create('tbl_ope_expedientes', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->string('Tipo_Expediente', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Expediente', 100)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->text('Observaciones')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->dateTime('Fecha_Apertura')->nullable();
            $table->string('Referencia', 100)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->integer('Municipio_Id')->nullable();
            $table->integer('Notario_Id')->nullable();
            $table->integer('Responsable_Id')->nullable();
            $table->integer('Secretaria_Id')->nullable();
            $table->integer('Autorizado_Id')->nullable();
            $table->decimal('Credito', 18, 2)->default(0.00);
            $table->string('Tipo_Escritura', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->integer('Escritura_Numero')->nullable();
            $table->integer('Folio_Inicial')->nullable();
            $table->integer('Folio_Final')->nullable();
            $table->integer('Volumen')->nullable();
            $table->integer('Tomo')->nullable();
            $table->integer('Fojas')->nullable();
            $table->decimal('Monto', 18, 2)->default(0.00);
            $table->dateTime('Fecha_Escritura')->nullable();
            $table->dateTime('Fecha_Firma')->nullable();
            $table->dateTime('Fecha_Elaboracion')->nullable();
            $table->dateTime('Fecha_Revision')->nullable();
            $table->dateTime('Fecha_Impresion')->nullable();
            $table->dateTime('Fecha_Firma_Todos')->nullable();
            $table->integer('Estatus_Expediente_Id')->nullable();
            $table->text('Motivo')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->boolean('Vulnerable')->default(0);
            $table->boolean('Activo')->default(1);
            $table->dateTime('Fecha_Creacion')->useCurrent();

            $table->foreign('Estatus_Expediente_Id')->references('Id')->on('tbl_cat_estatus_expediente');
            $table->foreign('Municipio_Id')->references('Id')->on('tbl_cat_zonas_municipios');
            $table->foreign('Notario_Id')->references('Id')->on('tbl_cat_usuarios');
            $table->foreign('Secretaria_Id')->references('Id')->on('tbl_cat_usuarios');
            $table->foreign('Autorizado_Id')->references('Id')->on('tbl_cat_usuarios');
        });

        Schema::create('tbl_ope_movimientos_bancarios', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->integer('Cuenta_Id')->nullable();
            $table->string('Tipo_Movimiento', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->integer('Referencia_Id')->default(0);
            $table->text('Beneficiario')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->text('Concepto')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Forma_Pago', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->decimal('Monto', 18, 2)->default(0.00);
            $table->decimal('Saldo_Actual', 18, 2)->default(0.00);
            $table->integer('Usuario_Creacion_Id')->nullable();
            $table->dateTime('Fecha_Creacion')->useCurrent();

            $table->foreign('Cuenta_Id')->references('Id')->on('tbl_cat_cuentas_notaria');
            $table->foreign('Usuario_Creacion_Id')->references('Id')->on('tbl_cat_usuarios');
        });

        Schema::create('tbl_ope_presupuesto_previo', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->integer('Cliente_Id')->nullable();
            $table->integer('Operacion_Id')->nullable();
            $table->integer('Zona_Municipio_Id')->nullable();
            $table->text('Observaciones')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->decimal('Valor_Operacion', 18, 2)->nullable();
            $table->decimal('Valor_Avaluo', 18, 2)->nullable();
            $table->decimal('Valor_Catastral', 18, 2)->nullable();
            $table->string('Parametro', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->decimal('Honorarios', 18, 2)->nullable();
            $table->decimal('Descuento', 18, 2)->default(0.00);
            $table->decimal('Subtotal_Honorarios', 18, 2)->default(0.00);
            $table->decimal('IVA', 18, 2)->default(0.00);
            $table->decimal('Retencion_ISR', 18, 2)->default(0.00);
            $table->decimal('Retencion_IVA', 18, 2)->default(0.00);
            $table->decimal('Total_Honorarios', 18, 2)->default(0.00);
            $table->decimal('Total_Gastos_Notariales', 18, 2)->default(0.00);
            $table->decimal('Total_Impuestos_Derechos', 18, 2)->default(0.00);
            $table->decimal('Total_Presupuesto_Previo', 18, 2)->default(0.00);
            $table->boolean('Activo')->default(1);
            $table->dateTime('Fecha_Creacion')->useCurrent();

            $table->foreign('Cliente_Id')->references('Id')->on('tbl_cat_clientes');
            $table->foreign('Operacion_Id')->references('Id')->on('tbl_cat_operaciones');
            $table->foreign('Zona_Municipio_Id')->references('Id')->on('tbl_cat_zonas_municipios');
        });

        Schema::create('tbl_ope_presupuesto', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->integer('Expediente_Id')->nullable();
            $table->integer('Numero_Presupuesto')->nullable();
            $table->integer('Cliente_Id')->nullable();
            $table->integer('Operacion_Id')->nullable();
            $table->integer('Zona_Municipio_Id')->nullable();
            $table->text('Observaciones')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->decimal('Valor_Operacion', 18, 2)->nullable();
            $table->decimal('Valor_Avaluo', 18, 2)->nullable();
            $table->decimal('Valor_Catastral', 18, 2)->nullable();
            $table->string('Parametro', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->decimal('Honorarios', 18, 2)->nullable();
            $table->decimal('Descuento', 18, 2)->default(0.00);
            $table->decimal('Subtotal_Honorarios', 18, 2)->default(0.00);
            $table->decimal('IVA', 18, 2)->default(0.00);
            $table->decimal('Retencion_ISR', 18, 2)->default(0.00);
            $table->decimal('Retencion_IVA', 18, 2)->default(0.00);
            $table->decimal('Total_Honorarios', 18, 2)->default(0.00);
            $table->decimal('Total_Gastos_Notariales', 18, 2)->default(0.00);
            $table->decimal('Total_Impuestos_Derechos', 18, 2)->default(0.00);
            $table->decimal('Total_Presupuesto', 18, 2)->default(0.00);
            $table->boolean('Validado')->default(0);
            $table->boolean('Activo')->default(1);
            $table->dateTime('Fecha_Creacion')->useCurrent();

            $table->foreign('Expediente_Id')->references('Id')->on('tbl_ope_expedientes');
            $table->foreign('Cliente_Id')->references('Id')->on('tbl_cat_clientes');
            $table->foreign('Operacion_Id')->references('Id')->on('tbl_cat_operaciones');
            $table->foreign('Zona_Municipio_Id')->references('Id')->on('tbl_cat_zonas_municipios');
        });

        Schema::create('tbl_ope_recibos_provisionales', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->integer('Expediente_Id')->nullable();
            $table->integer('Numero_Recibo')->nullable();
            $table->integer('Cliente_Id')->nullable();
            $table->text('Operacion_Concepto')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->decimal('Total_Gastos_Impuestos_Derechos', 18, 2)->default(0.00);
            $table->decimal('Total_Gastos_Notariales', 18, 2)->default(0.00);
            $table->decimal('Total_Honorarios', 18, 2)->default(0.00);
            $table->decimal('Total', 18, 2)->default(0.00);
            $table->text('Texto_Cantidad')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Forma_Pago', 100)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->dateTime('Fecha_Pago')->nullable();
            $table->text('Observacion')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->integer('Estatus_Id')->nullable();
            $table->integer('Notario_Id')->nullable();
            // Estos campos tienen default 0 en el original; se dejan como nullable para
            // respetar la integridad referencial con tbl_cat_usuarios.
            $table->integer('Usuario_Creacion_Id')->nullable();
            $table->integer('Usuario_Pago_Id')->nullable();
            $table->boolean('Activo')->default(1);
            $table->dateTime('Fecha_Creacion')->useCurrent();

            $table->foreign('Expediente_Id')->references('Id')->on('tbl_ope_expedientes');
            $table->foreign('Cliente_Id')->references('Id')->on('tbl_cat_clientes');
            $table->foreign('Estatus_Id')->references('Id')->on('tbl_cat_estatus');
            $table->foreign('Notario_Id')->references('Id')->on('tbl_cat_usuarios');
            $table->foreign('Usuario_Creacion_Id')->references('Id')->on('tbl_cat_usuarios');
            $table->foreign('Usuario_Pago_Id')->references('Id')->on('tbl_cat_usuarios');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_ope_recibos_provisionales');
        Schema::dropIfExists('tbl_ope_presupuesto');
        Schema::dropIfExists('tbl_ope_presupuesto_previo');
        Schema::dropIfExists('tbl_ope_movimientos_bancarios');
        Schema::dropIfExists('tbl_ope_expedientes');
        Schema::dropIfExists('tbl_ope_entregas_otros_actos');
        Schema::dropIfExists('tbl_ope_cotejos');
        Schema::dropIfExists('tbl_ope_actas_fuera_protocolo');
        Schema::dropIfExists('tbl_log_sesiones_activas');
        Schema::dropIfExists('tbl_log_general');
        Schema::dropIfExists('tbl_log_bitacora');
    }
};
