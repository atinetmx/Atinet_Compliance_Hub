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
        Schema::create('listas_pep_personas', function (Blueprint $table) {
            $table->id();

            // Identificador único del individuo en prevenciondelavado.com
            // Es el pivot de deduplicación: una fila por persona
            $table->bigInteger('codigo_individuo')->unique()
                ->comment('ID único del individuo en prevenciondelavado.com');

            // Datos personales
            $table->string('denominacion', 500)
                ->comment('Nombre completo o denominación');

            $table->string('identificacion')->nullable()
                ->comment('CURP');

            $table->string('id_tributaria')->nullable()
                ->comment('RFC');

            $table->string('otra_identificacion')->nullable()
                ->comment('Otra identificación proporcionada');

            $table->text('relaciones')->nullable()
                ->comment('Relaciones familiares o políticas. Solo para AFIN PEP / AFIN EX PEP');

            $table->char('fecha_nacimiento', 8)->nullable()
                ->comment('Fecha de nacimiento en formato YYYYMMDD');

            // Clasificación PEP
            $table->string('tipo', 50)
                ->comment('Tipo: PEP, EX PEP, AFIN PEP, AFIN EX PEP, OTROS');

            $table->string('sub_tipo', 50)
                ->comment('Subtipo específico del PEP');

            $table->string('estado', 50)
                ->comment('Estado: ACTIVO o INACTIVO');

            // Información laboral
            $table->text('cargo')
                ->comment('Cargo o puesto desempeñado');

            $table->string('finalizacion_cargo')->nullable()
                ->comment('Fecha o descripción de finalización del cargo');

            $table->text('lugar_trabajo')
                ->comment('Entidad, dependencia o lugar de trabajo');

            $table->text('direccion')
                ->comment('Dirección completa del individuo');

            // Información de lista de origen
            $table->string('lista')
                ->comment('Nombre de la lista en la que aparece');

            $table->string('pais_lista', 100)
                ->comment('País de la lista');

            $table->string('supuesto')->nullable()
                ->comment('Supuesto legal bajo el cual está listado');

            $table->string('situacion')->nullable()
                ->comment('Situación específica del caso');

            // URL y control de integridad (para scraping)
            $table->text('enlace')->nullable()
                ->comment('URL del perfil en prevenciondelavado.com — usada por el scraper de verificación');

            $table->char('hash_registro', 64)->nullable()
                ->comment('SHA256 del contenido scrapeado. Detecta cambios entre verificaciones');

            // Trazabilidad — búsquedas que encontraron a esta persona
            $table->unsignedBigInteger('primera_busqueda_id')->nullable()
                ->comment('ID de la primera búsqueda que encontró a esta persona');

            $table->unsignedBigInteger('ultima_busqueda_id')->nullable()
                ->comment('ID de la búsqueda más reciente que encontró a esta persona');

            // Control de frescura
            $table->timestamp('ultima_verificacion_online')->nullable()
                ->comment('Última vez que la API PLD confirmó este registro');

            $table->timestamp('ultima_verificacion_scraper')->nullable()
                ->comment('Última vez que el scraper verificó el enlace');

            $table->timestamps();

            // Índices para búsquedas offline y scraper
            $table->index('denominacion');
            $table->index('identificacion');
            $table->index('tipo');
            $table->index('estado');
            $table->index('pais_lista');
            $table->index('ultima_verificacion_scraper');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('listas_pep_personas');
    }
};
