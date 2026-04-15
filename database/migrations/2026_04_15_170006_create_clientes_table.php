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
        Schema::create('clientes', function (Blueprint $table) {
            $table->id();

            // === IDENTIFICACIÓN BÁSICA ===
            $table->string('nombre', 200)->comment('Nombre(s) o Razón Social');
            $table->string('apellido_paterno', 100)->nullable()->comment('Apellido paterno (personas físicas)');
            $table->string('apellido_materno', 100)->nullable()->comment('Apellido materno (personas físicas)');
            $table->string('nombre_completo', 400)->virtualAs(
                "CONCAT_WS(' ', nombre, apellido_paterno, apellido_materno)"
            )->comment('Nombre completo generado');

            // === TIPO DE CLIENTE ===
            $table->foreignId('tipo_cliente_id')->nullable()->constrained('cat_tipos_cliente')->nullOnDelete()
                ->comment('Tipo de personalidad legal');

            // === INFORMACIÓN FISCAL/LEGAL ===
            $table->string('rfc', 13)->nullable()->unique()->comment('RFC con homoclave');
            $table->string('curp', 18)->nullable()->unique()->comment('CURP (personas físicas)');
            $table->string('identificacion_oficial_numero', 50)->nullable()->comment('INE/IFE número');
            $table->string('pasaporte_numero', 20)->nullable()->comment('Pasaporte (extranjeros)');
            $table->string('forma_migratoria_numero', 30)->nullable()->comment('FM número');
            $table->string('forma_migratoria_tipo', 50)->nullable()->comment('FM tipo');

            // === CONTACTO ===
            $table->string('email', 150)->nullable()->comment('Correo electrónico principal');
            $table->string('telefono_principal', 20)->nullable()->comment('Teléfono principal');
            $table->string('telefono_secundario', 20)->nullable()->comment('Teléfono alternativo');
            $table->string('pagina_web', 255)->nullable()->comment('Sitio web (empresas)');

            // === UBICACIÓN (normalizada) ===
            $table->string('codigo_postal', 5)->nullable()->index()->comment('Código Postal');
            $table->foreignId('estado_id')->nullable()->constrained('estados')->nullOnDelete();
            $table->foreignId('municipio_id')->nullable()->constrained('municipios')->nullOnDelete();
            $table->foreignId('ciudad_id')->nullable()->constrained('ciudades')->nullOnDelete();
            $table->foreignId('colonia_id')->nullable()->constrained('colonias')->nullOnDelete();
            $table->string('calle', 150)->nullable();
            $table->string('numero_exterior', 20)->nullable();
            $table->string('numero_interior', 20)->nullable();
            $table->text('direccion_completa')->nullable()->comment('Dirección formateada (generada)');

            // === INFORMACIÓN PERSONAL ===
            $table->date('fecha_nacimiento')->nullable()->comment('Fecha de nacimiento');
            $table->enum('sexo', ['M', 'F'])->nullable();
            $table->foreignId('estado_civil_id')->nullable()->constrained('cat_estado_civil')->nullOnDelete();
            $table->string('ocupacion', 100)->nullable();

            // === NACIONALIDAD ===
            $table->unsignedBigInteger('nacionalidad_id')->nullable()->comment('FK a atinet65_catalogos.cat_nacionalidad');
            $table->unsignedBigInteger('pais_nacimiento_id')->nullable()->comment('FK a atinet65_catalogos.catpaises');
            $table->foreignId('estado_nacimiento_id')->nullable()->constrained('estados')->nullOnDelete();
            $table->foreignId('municipio_nacimiento_id')->nullable()->constrained('municipios')->nullOnDelete();

            // === INFORMACIÓN FAMILIAR (para escrituras) ===
            $table->string('conyuge_nombre', 200)->nullable()->comment('Nombre del cónyuge');
            $table->foreignId('regimen_conyugal_id')->nullable()->constrained('cat_regimen_conyugal')->nullOnDelete();
            $table->string('nombre_padre', 200)->nullable();
            $table->string('nombre_madre', 200)->nullable();
            $table->boolean('padre_finado')->default(false);
            $table->boolean('madre_finado')->default(false);

            // === INFORMACIÓN CORPORATIVA (personas morales) ===
            $table->string('razon_social', 255)->nullable()->comment('Razón social (personas morales)');
            $table->foreignId('representante_legal_id')->nullable()->constrained('clientes')->nullOnDelete()
                ->comment('ID del cliente que representa a esta empresa');

            // === AUDITORÍA ===
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            // === ÍNDICES ===
            $table->index('nombre');
            $table->index('apellido_paterno');
            $table->index(['tipo_cliente_id', 'deleted_at']);
            $table->index('created_at');
            $table->fullText(['nombre', 'apellido_paterno', 'apellido_materno']); // Búsqueda rápida
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clientes');
    }
};
