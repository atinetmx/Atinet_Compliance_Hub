<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('registro_web', function (Blueprint $table) {
            $table->id();

            // METADATA
            $table->date('dia_registro')->comment('Fecha de registro');
            $table->string('notaria', 30)->index();
            $table->boolean('envio_de_correo')->default(false);
            $table->enum('persona', ['fisica', 'moral'])->default('fisica')->comment('Tipo de persona');

            // DATOS PERSONALES (17 campos)
            $table->string('nombre', 30);
            $table->string('apellidopat', 30);
            $table->string('apellidomat', 30);
            $table->string('alias', 100);
            $table->string('curp', 50)->index();
            $table->string('rfc', 50)->index();
            $table->date('dia')->comment('Fecha nacimiento/constitución');
            $table->string('genero', 50);
            $table->string('paisnac', 100);
            $table->string('nacionalidad', 100);
            $table->string('estado_nac', 100);
            $table->string('ciudad_nac', 100);
            $table->string('municipio_nac', 100);
            $table->string('ocupacion', 100);
            $table->string('edo_civil', 100);
            $table->string('conyuge', 100)->nullable();

            // DATOS DEL CÓNYUGE (6 campos)
            $table->string('nombre_conyuge', 50)->nullable();
            $table->string('apellido_paterno_conyuge', 50)->nullable();
            $table->string('apellido_materno_conyuge', 50)->nullable();
            $table->string('doc_identificacion', 100)->nullable();
            $table->integer('num_doc_identificacion')->nullable();
            $table->string('autoridad_emisora', 100)->nullable();

            // DOMICILIO PARTICULAR (12 campos)
            $table->string('calle', 100);
            $table->string('no_exterior', 100);
            $table->string('no_interior', 100);
            $table->string('manzana', 100);
            $table->string('lote', 100);
            $table->integer('cp');
            $table->string('colonia', 100);
            $table->string('municipio', 100);
            $table->string('estado', 100);
            $table->string('ciudad', 100);
            $table->string('pais', 100);

            // DOMICILIO FISCAL (11 campos)
            $table->string('calle_fiscal', 100);
            $table->string('no_exterior_fiscal', 100);
            $table->string('no_interior_fiscal', 100);
            $table->string('manzana_fiscal', 100);
            $table->string('lote_fiscal', 100);
            $table->integer('cp_fiscal');
            $table->string('colonia_fiscal', 100);
            $table->string('municipio_fiscal', 100);
            $table->string('estado_fiscal', 100);
            $table->string('ciudad_fiscal', 100);
            $table->string('pais_fiscal', 100);

            // CONTACTO (6 campos)
            $table->string('telefono', 50);
            $table->string('telefonos', 100)->comment('Teléfono alternativo');
            $table->string('telefono_oficina', 20);
            $table->string('telefono_movil', 20);
            $table->string('correo', 150)->nullable();
            $table->string('gmail2', 225)->nullable()->comment('Correo secundario');

            // IDENTIFICACIÓN (4 campos)
            $table->string('documento', 100)->comment('Tipo de documento');
            $table->string('no_identificacion', 100);
            $table->date('vigiencia_de_ine')->nullable();
            $table->string('autoridad_emisora_usuario', 225)->nullable();

            // INFORMACIÓN ADICIONAL (4 campos)
            $table->string('regimen_fiscal', 225)->nullable();
            $table->string('servicios_medicos', 225)->nullable();
            $table->string('id_y_cartainmigracion', 225)->nullable();
            $table->text('observaciones_adicionales')->nullable();

            // DATOS DEL TESTADOR (19 campos modernos - sin duplicados)
            $table->string('sabe_escribir', 10)->default('');
            $table->string('sabe_leer', 10)->default('');
            $table->string('padre_nombre', 255)->default('')->comment('Nombre del padre');
            $table->string('padre_vive', 10)->nullable();
            $table->string('madre_nombre', 255)->default('')->comment('Nombre de la madre');
            $table->string('madre_vive', 10)->nullable();
            $table->string('hijos', 200)->nullable();
            $table->string('herederos', 200)->nullable();
            $table->text('herederos_sustitutos')->nullable();
            $table->string('albacea', 45)->nullable();
            $table->string('albacea_sustituto', 255)->default('');
            $table->string('tutor_tutriz', 255)->default('');
            $table->string('tutor_sustituto', 255)->default('');
            $table->string('observaciones', 45)->nullable();

            // Laravel features
            $table->timestamps();
            $table->softDeletes();

            // Índices
            $table->index('dia_registro');
            $table->index(['notaria', 'dia_registro']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('registro_web');
    }
};
