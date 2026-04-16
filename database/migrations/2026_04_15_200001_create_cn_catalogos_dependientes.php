<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Catálogos dependientes del módulo Control Notarial.
     * Tablas: tbl_cat_impuestos_derechos, tbl_cat_operaciones, tbl_cat_usuarios
     * Depende de: 2026_04_15_200000_create_cn_catalogos_base
     */
    public function up(): void
    {
        Schema::create('tbl_cat_impuestos_derechos', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->text('Descripcion')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Tipo', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->integer('Dependencia_Id')->nullable();
            $table->boolean('Activo')->default(1);
            $table->dateTime('Fecha_Creacion')->useCurrent();

            $table->foreign('Dependencia_Id')
                ->references('Id')->on('tbl_cat_dependencias_publicas');
        });

        Schema::create('tbl_cat_operaciones', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->text('Descripcion')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->integer('Actividad_Vulnerable_Id')->nullable();
            $table->boolean('Activo')->default(1);
            $table->dateTime('Fecha_Creacion')->useCurrent();

            $table->foreign('Actividad_Vulnerable_Id')
                ->references('Id')->on('tbl_cat_actividades_vulnerables');
        });

        Schema::create('tbl_cat_usuarios', function (Blueprint $table) {
            $table->integer('Id')->autoIncrement();
            $table->string('Nombre', 100)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Apellido_Paterno', 100)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Apellido_Materno', 100)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Correo', 100)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Usuario', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Contrasena', 255)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('CURP', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('RFC', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->integer('Rol_Id')->nullable();
            $table->string('Iniciales', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Numero_Notaria', 10)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Adscripcion', 100)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Tipo', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->string('Procedencia', 50)->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->text('Observaciones')->nullable()->charset('utf8mb4')->collation('utf8mb4_unicode_ci');
            $table->boolean('Sesion_Iniciada')->default(0);
            $table->boolean('Activo')->default(1);
            $table->dateTime('Fecha_Creacion')->useCurrent();

            $table->foreign('Rol_Id')
                ->references('Id')->on('tbl_cat_roles');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_cat_usuarios');
        Schema::dropIfExists('tbl_cat_operaciones');
        Schema::dropIfExists('tbl_cat_impuestos_derechos');
    }
};
