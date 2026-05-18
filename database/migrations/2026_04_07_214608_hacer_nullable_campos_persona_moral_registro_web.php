<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Hace nullable los campos que son opcionales para personas morales
     */
    public function up(): void
    {
        Schema::table('registro_web', function (Blueprint $table) {
            // Campos personales que son opcionales para personas morales
            $table->string('apellidopat', 30)->nullable()->change();
            $table->string('apellidomat', 30)->nullable()->change();
            $table->string('alias', 100)->nullable()->change();
            $table->string('curp', 50)->nullable()->change();
            $table->date('dia')->nullable()->comment('Fecha nacimiento/constitución')->change();
            $table->string('genero', 50)->nullable()->change();
            $table->string('paisnac', 100)->nullable()->change();
            $table->string('nacionalidad', 100)->nullable()->change();
            $table->string('estado_nac', 100)->nullable()->change();
            $table->string('ciudad_nac', 100)->nullable()->change();
            $table->string('municipio_nac', 100)->nullable()->change();
            $table->string('ocupacion', 100)->nullable()->change();
            $table->string('edo_civil', 100)->nullable()->change();

            // Campos de domicilio particular (opcionales)
            $table->string('calle', 100)->nullable()->change();
            $table->string('no_exterior', 20)->nullable()->change();
            $table->string('no_interior', 20)->nullable()->change();
            $table->string('manzana', 50)->nullable()->change();
            $table->string('lote', 50)->nullable()->change();
            $table->integer('cp')->nullable()->change();
            $table->string('colonia', 225)->nullable()->change();
            $table->string('municipio', 225)->nullable()->change();
            $table->string('estado', 125)->nullable()->change();
            $table->string('ciudad', 125)->nullable()->change();
            $table->string('pais', 100)->nullable()->change();

            // Campos de domicilio fiscal (opcionales)
            $table->string('calle_fiscal', 100)->nullable()->change();
            $table->string('no_exterior_fiscal', 20)->nullable()->change();
            $table->string('no_interior_fiscal', 20)->nullable()->change();
            $table->string('manzana_fiscal', 50)->nullable()->change();
            $table->string('lote_fiscal', 50)->nullable()->change();
            $table->integer('cp_fiscal')->nullable()->change();
            $table->string('colonia_fiscal', 125)->nullable()->change();
            $table->string('municipio_fiscal', 125)->nullable()->change();
            $table->string('estado_fiscal', 125)->nullable()->change();
            $table->string('ciudad_fiscal', 125)->nullable()->change();
            $table->string('pais_fiscal', 100)->nullable()->change();

            // Contacto (algunos opcionales)
            $table->string('telefono', 30)->nullable()->change();
            $table->string('telefonos', 125)->nullable()->change();
            $table->string('telefono_oficina', 30)->nullable()->change();
            $table->string('telefono_movil', 30)->nullable()->change();
            $table->string('gmail2', 150)->nullable()->change();

            // Identificación (opcionales)
            $table->string('documento', 225)->nullable()->change();
            $table->string('no_identificacion', 125)->nullable()->change();
            $table->date('vigiencia_de_ine')->nullable()->change();
            $table->string('autoridad_emisora_usuario', 225)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('registro_web', function (Blueprint $table) {
            // Revertir cambios: hacer NOT NULL nuevamente
            // NOTA: Esto puede fallar si hay registros con NULL
            $table->string('apellidopat', 30)->change();
            $table->string('apellidomat', 30)->change();
            $table->string('alias', 100)->change();
            $table->string('curp', 50)->change();
            $table->date('dia')->change();
            $table->string('genero', 50)->change();
            $table->string('paisnac', 100)->change();
            $table->string('nacionalidad', 100)->change();
            $table->string('estado_nac', 100)->change();
            $table->string('ciudad_nac', 100)->change();
            $table->string('municipio_nac', 100)->change();
            $table->string('ocupacion', 100)->change();
            $table->string('edo_civil', 100)->change();

            $table->string('calle', 100)->change();
            $table->string('no_exterior', 20)->change();
            $table->string('no_interior', 20)->change();
            $table->string('manzana', 50)->change();
            $table->string('lote', 50)->change();
            $table->integer('cp')->change();
            $table->string('colonia', 225)->change();
            $table->string('municipio', 225)->change();
            $table->string('estado', 125)->change();
            $table->string('ciudad', 125)->change();
            $table->string('pais', 100)->change();

            $table->string('calle_fiscal', 100)->change();
            $table->string('no_exterior_fiscal', 20)->change();
            $table->string('no_interior_fiscal', 20)->change();
            $table->string('manzana_fiscal', 50)->change();
            $table->string('lote_fiscal', 50)->change();
            $table->integer('cp_fiscal')->change();
            $table->string('colonia_fiscal', 125)->change();
            $table->string('municipio_fiscal', 125)->change();
            $table->string('estado_fiscal', 125)->change();
            $table->string('ciudad_fiscal', 125)->change();
            $table->string('pais_fiscal', 100)->change();

            $table->string('telefono', 30)->change();
            $table->string('telefonos', 125)->change();
            $table->string('telefono_oficina', 30)->change();
            $table->string('telefono_movil', 30)->change();
            $table->string('gmail2', 150)->change();

            $table->string('documento', 225)->change();
            $table->string('no_identificacion', 125)->change();
            $table->date('vigiencia_de_ine')->change();
            $table->string('autoridad_emisora_usuario', 225)->change();
        });
    }
};
