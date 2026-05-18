<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tablas de configuración del módulo Control Notarial.
     * Tablas: tbl_cfg_configuracion_notarial, tbl_cfg_notaria,
     *         tbl_cfg_tarifaria_honorarios, tbl_cfg_tarifaria_tramites_derechos
     * Depende de: 2026_04_15_200000 y 2026_04_15_200001
     */
    public function up(): void
    {
        Schema::create('tbl_cfg_configuracion_notarial', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->string('Expediente', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->integer('Consecutivo_Expediente')->nullable();
            $table->string('Ratificacion', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->integer('Consecutivo_Ratificacion')->nullable();
            $table->string('Certificado', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->integer('Cotejo')->nullable();
            $table->integer('Acta_Fuera_Protocolo')->nullable();
            $table->integer('Anio')->nullable();
            $table->integer('Recibo_Honorarios')->nullable();
            $table->integer('Recibo_Provisional')->nullable();
            $table->integer('Meses_Antilavado')->nullable();
            $table->integer('UMAS_Antilavado')->nullable();
            $table->decimal('IVA', 18, 2)->nullable();
            $table->decimal('Retencion_IVA', 18, 2)->nullable();
            $table->decimal('ISR', 18, 2)->nullable();
            $table->decimal('Salario', 18, 2)->nullable();
            $table->decimal('UMA', 18, 2)->nullable();
            $table->integer('Tomo_Inicial_Instrumentos')->nullable();
            $table->integer('Volumen_Tomo_Instrumentos')->nullable();
            $table->integer('Folio_Volumen_Instrumentos')->nullable();
            $table->integer('Volumen_Inicial_Instrumentos')->nullable();
            $table->integer('Folio_Inicial_Tomo_Instrumentos')->nullable();
            $table->integer('Tomo_Inicial_Certificaciones')->nullable();
            $table->integer('Volumen_Tomo_Certificaciones')->nullable();
            $table->integer('Folios_Volumen_Certificaciones')->nullable();
            $table->integer('Folio_Inicial_Tomo_Certificaciones')->nullable();
            $table->dateTime('Fecha_Creacion')->useCurrent();
        });

        Schema::create('tbl_cfg_notaria', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->string('Nombre_Notario', 100)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Numero_Notaria', 10)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Telefono', 10)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('RFC', 20)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->text('Domicilio')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Municipio', 100)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Estado', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Codigo_Postal', 10)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->longText('Logotipo')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->dateTime('Fecha_Creacion')->useCurrent();
        });

        Schema::create('tbl_cfg_tarifaria_honorarios', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->integer('Zona_Municipio_Id')->nullable();
            $table->integer('Operacion_Id')->nullable();
            $table->decimal('Cuota_Fija_Pesos', 18, 2)->default(0.00);
            $table->decimal('Cuota_Fija_UMA', 18, 2)->default(0.00);
            $table->integer('Salarios_Minimos')->default(0);
            $table->decimal('Impuesto_Extra', 18, 2)->default(0.00);
            $table->decimal('Porcentaje', 18, 2)->default(0.00);
            $table->integer('Rango_Id')->nullable();
            $table->dateTime('Fecha_Creacion')->useCurrent();

            $table->foreign('Zona_Municipio_Id')
                ->references('Id')->on('tbl_cat_zonas_municipios');
            $table->foreign('Operacion_Id')
                ->references('Id')->on('tbl_cat_operaciones');
        });

        Schema::create('tbl_cfg_tarifaria_tramites_derechos', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->integer('Zona_Municipio_Id')->nullable();
            $table->integer('Impuesto_Derecho_Id')->nullable();
            $table->decimal('Cuota_Fija_Pesos', 18, 2)->default(0.00);
            $table->decimal('Cuota_Fija_UMA', 18, 2)->default(0.00);
            $table->integer('Salarios_Minimos')->default(0);
            $table->decimal('Impuesto_Extra', 18, 2)->default(0.00);
            $table->decimal('Porcentaje', 18, 2)->default(0.00);
            $table->integer('Rango_Id')->nullable();
            $table->dateTime('Fecha_Creacion')->useCurrent();

            $table->foreign('Zona_Municipio_Id')
                ->references('Id')->on('tbl_cat_zonas_municipios');
            $table->foreign('Impuesto_Derecho_Id')
                ->references('Id')->on('tbl_cat_impuestos_derechos');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_cfg_tarifaria_tramites_derechos');
        Schema::dropIfExists('tbl_cfg_tarifaria_honorarios');
        Schema::dropIfExists('tbl_cfg_notaria');
        Schema::dropIfExists('tbl_cfg_configuracion_notarial');
    }
};
