<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Catálogos base del módulo Control Notarial (sin dependencias entre sí).
     * Tablas: tbl_cat_actividades_vulnerables, tbl_cat_clientes, tbl_cat_comparecientes,
     *         tbl_cat_cuentas_notaria, tbl_cat_dependencias_publicas, tbl_cat_documentos,
     *         tbl_cat_estados, tbl_cat_estatus, tbl_cat_estatus_expediente, tbl_cat_etapas,
     *         tbl_cat_instituciones_financieras, tbl_cat_modulos, tbl_cat_monedas,
     *         tbl_cat_municipios, tbl_cat_paises, tbl_cat_prevencion_lavado_dinero,
     *         tbl_cat_regimen_fiscal, tbl_cat_roles, tbl_cat_tipo_identificacion,
     *         tbl_cat_tipo_inmuebles, tbl_cat_zonas_municipios
     */
    public function up(): void
    {
        Schema::create('tbl_cat_actividades_vulnerables', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->text('Descripcion')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->decimal('Monto', 18, 2)->nullable();
            $table->boolean('Siempre')->default(0);
            $table->boolean('Activo')->default(1);
            $table->dateTime('Fecha_Creacion')->useCurrent();
        });

        Schema::create('tbl_cat_clientes', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->string('Tipo_Cliente', 20)->nullable();
            $table->string('Alias', 100)->nullable();
            $table->string('Nombre', 100)->nullable();
            $table->string('Apellido_Paterno', 100)->nullable();
            $table->string('Apellido_Materno', 100)->nullable();
            $table->string('RFC', 20)->nullable();
            $table->string('CURP', 20)->nullable();
            $table->dateTime('Fecha_Nacimiento')->nullable();
            $table->string('Pais_Nacimiento', 100)->nullable();
            $table->string('Estado_Nacimiento', 100)->nullable();
            $table->string('Municipio_Nacimiento', 100)->nullable();
            $table->string('Ciudad_Nacimiento', 100)->nullable();
            $table->string('Nacionalidad', 100)->nullable();
            $table->string('Email1', 200)->nullable();
            $table->string('Email2', 200)->nullable();
            $table->string('Telefono_Particular', 20)->nullable();
            $table->string('Telefono_Oficina', 20)->nullable();
            $table->string('Telefono_Movil', 20)->nullable();
            $table->string('Sexo', 20)->nullable();
            $table->string('Estado_Civil', 30)->nullable();
            $table->string('Ocupacion', 100)->nullable();
            $table->boolean('Activo')->default(1);
            $table->dateTime('Fecha_Creacion')->useCurrent();
        });

        Schema::create('tbl_cat_comparecientes', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->text('Descripcion')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->boolean('Activo')->default(1);
            $table->dateTime('Fecha_Creacion')->useCurrent();
        });

        Schema::create('tbl_cat_cuentas_notaria', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->string('Nombre_Cuenta', 100)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Numero_Cuenta', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->decimal('Saldo_Inicial', 18, 2)->default(0.00);
            $table->decimal('Saldo_Final', 18, 2)->default(0.00);
            $table->boolean('Activo')->default(1);
            $table->dateTime('Fecha_Creacion')->useCurrent();
        });

        Schema::create('tbl_cat_dependencias_publicas', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->text('Descripcion')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->boolean('Activo')->default(1);
            $table->dateTime('Fecha_Creacion')->useCurrent();
        });

        Schema::create('tbl_cat_documentos', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->text('Descripcion')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->boolean('Activo')->default(1);
            $table->dateTime('Fecha_Creacion')->useCurrent();
        });

        Schema::create('tbl_cat_estados', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->string('Nombre', 100)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->boolean('Activo')->default(1);
            $table->dateTime('Fecha_Creacion')->useCurrent();
        });

        Schema::create('tbl_cat_estatus', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->string('Clave', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Descripcion', 100)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Modulo', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->boolean('Activo')->default(1);
            $table->dateTime('Fecha_Creacion')->useCurrent();
        });

        Schema::create('tbl_cat_estatus_expediente', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->string('Clave', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Descripcion', 100)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->boolean('Activo')->default(1);
            $table->dateTime('Fecha_Creacion')->useCurrent();
        });

        Schema::create('tbl_cat_etapas', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->text('Descripcion')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->boolean('Activo')->default(1);
            $table->dateTime('Fecha_Creacion')->useCurrent();
        });

        Schema::create('tbl_cat_instituciones_financieras', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->string('Nombre', 100)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Descripcion', 250)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->boolean('Activo')->default(1);
            $table->dateTime('Fecha_Creacion')->useCurrent();
        });

        Schema::create('tbl_cat_modulos', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->string('Codigo', 20)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Nombre', 500)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Descripcion', 500)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->boolean('Activo')->default(1);
            $table->dateTime('Fecha_Creacion')->useCurrent();
        });

        Schema::create('tbl_cat_monedas', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->string('Clave', 10)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Nombre', 100)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->boolean('Activo')->default(1);
            $table->dateTime('Fecha_Creacion')->useCurrent();
        });

        Schema::create('tbl_cat_municipios', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->string('Nombre', 200)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->boolean('Activo')->default(1);
            $table->dateTime('Fecha_Creacion')->useCurrent();
        });

        Schema::create('tbl_cat_paises', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->string('Nombre', 100)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->boolean('Activo')->default(1);
            $table->dateTime('Fecha_Creacion')->useCurrent();
        });

        Schema::create('tbl_cat_prevencion_lavado_dinero', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->text('Descripcion')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->boolean('Activo')->default(1);
            $table->dateTime('Fecha_Creacion')->useCurrent();
        });

        Schema::create('tbl_cat_regimen_fiscal', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->string('Clave', 10)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Nombre', 250)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->boolean('Activo')->default(1);
            $table->dateTime('Fecha_Creacion')->useCurrent();
        });

        Schema::create('tbl_cat_roles', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->string('Nombre', 100)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Descripcion', 100)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->boolean('Activo')->default(1);
            $table->dateTime('Fecha_Creacion')->useCurrent();
        });

        Schema::create('tbl_cat_tipo_identificacion', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->string('Nombre', 200)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->boolean('Activo')->default(1);
            $table->dateTime('Fecha_Creacion')->useCurrent();
        });

        Schema::create('tbl_cat_tipo_inmuebles', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->string('Descripcion', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Categoria', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->boolean('Activo')->default(1);
            $table->dateTime('Fecha_Creacion')->useCurrent();
        });

        Schema::create('tbl_cat_zonas_municipios', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->text('Descripcion')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->boolean('Activo')->default(1);
            $table->dateTime('Fecha_Creacion')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_cat_zonas_municipios');
        Schema::dropIfExists('tbl_cat_tipo_inmuebles');
        Schema::dropIfExists('tbl_cat_tipo_identificacion');
        Schema::dropIfExists('tbl_cat_roles');
        Schema::dropIfExists('tbl_cat_regimen_fiscal');
        Schema::dropIfExists('tbl_cat_prevencion_lavado_dinero');
        Schema::dropIfExists('tbl_cat_paises');
        Schema::dropIfExists('tbl_cat_municipios');
        Schema::dropIfExists('tbl_cat_monedas');
        Schema::dropIfExists('tbl_cat_modulos');
        Schema::dropIfExists('tbl_cat_instituciones_financieras');
        Schema::dropIfExists('tbl_cat_etapas');
        Schema::dropIfExists('tbl_cat_estatus_expediente');
        Schema::dropIfExists('tbl_cat_estatus');
        Schema::dropIfExists('tbl_cat_estados');
        Schema::dropIfExists('tbl_cat_documentos');
        Schema::dropIfExists('tbl_cat_dependencias_publicas');
        Schema::dropIfExists('tbl_cat_cuentas_notaria');
        Schema::dropIfExists('tbl_cat_comparecientes');
        Schema::dropIfExists('tbl_cat_clientes');
        Schema::dropIfExists('tbl_cat_actividades_vulnerables');
    }
};
