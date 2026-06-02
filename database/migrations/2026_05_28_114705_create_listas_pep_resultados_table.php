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
        // SEGURIDAD: Solo crear si NO existe (evita errores en producción)
        if (Schema::hasTable('listas_pep_resultados')) {
            return;
        }

        Schema::create('listas_pep_resultados', function (Blueprint $table) {
            $table->id();

            // Relación con búsqueda
            $table->unsignedBigInteger('busqueda_id')
                ->comment('ID de la búsqueda a la que pertenece este resultado');

            // Identificación del individuo en API
            $table->bigInteger('codigo_individuo')
                ->comment('ID único del individuo en la base de datos de PrevencionDeLavado.com');

            // Datos personales
            $table->string('denominacion', 500)
                ->comment('Nombre completo o denominación');

            $table->string('identificacion')->nullable()
                ->comment('CURP');

            $table->string('id_tributaria')->nullable()
                ->comment('RFC');

            $table->string('otra_identificacion')->nullable()
                ->comment('Otra identificación proporcionada');

            $table->char('fecha_nacimiento', 8)->nullable()
                ->comment('Fecha de nacimiento en formato YYYYMMDD');

            // Clasificación PEP
            $table->string('tipo', 50)
                ->comment('Tipo de PEP: PEP, EX PEP, AFIN PEP, AFIN EX PEP, OTROS');

            $table->string('sub_tipo', 50)
                ->comment('Subtipo específico del PEP');

            $table->string('estado', 50)
                ->comment('Estado del PEP: ACTIVO o INACTIVO');

            // Información laboral
            $table->text('cargo')
                ->comment('Cargo o puesto desempeñado');

            $table->string('finalizacion_cargo')->nullable()
                ->comment('Fecha o descripción de finalización del cargo');

            $table->text('lugar_trabajo')
                ->comment('Entidad, dependencia o lugar de trabajo');

            $table->text('direccion')
                ->comment('Dirección completa del individuo');

            // Información de la lista
            $table->string('lista')
                ->comment('Nombre de la lista en la que aparece');

            $table->string('pais_lista', 100)
                ->comment('País de la lista');

            $table->string('supuesto')->nullable()
                ->comment('Supuesto legal bajo el cual está listado');

            $table->string('situacion')->nullable()
                ->comment('Situación específica del caso');

            // Exactitud de coincidencia
            $table->string('exactitud_denominacion', 50)
                ->comment('Nivel de exactitud en denominación (ej: ALTO (5 sobre 5))');

            $table->string('exactitud_identificacion', 50)
                ->comment('Exactitud en identificación (ej: COINCIDE, N/D)');

            // URL de verificación (CRÍTICO)
            $table->text('enlace')->nullable()
                ->comment('URL de verificación en PrevencionDeLavado.com');

            // Control de orden y relevancia
            $table->integer('orden_relevancia')
                ->comment('Posición del resultado en la lista ordenada por relevancia (1 = más relevante)');

            // Campos adicionales de control
            $table->char('hash_registro', 64)->nullable()
                ->comment('Hash SHA256 para detectar cambios en re-consultas');

            $table->boolean('es_coincidencia_exacta')->default(false)
                ->comment('Flag para indicar coincidencias del 100%');

            // Campos de acción tomada
            $table->enum('accion_tomada', ['APROBADO', 'RECHAZADO', 'REQUIERE_ANALISIS', 'EN_REVISION'])->nullable()
                ->comment('Acción tomada sobre este resultado específico');

            $table->text('justificacion')->nullable()
                ->comment('Justificación de la acción tomada');

            $table->timestamps();

            // Índices para optimizar consultas
            $table->index('busqueda_id');
            $table->index('codigo_individuo');
            $table->index('tipo');
            $table->index('estado');
            $table->index('pais_lista');
            $table->index('orden_relevancia');
            $table->index('identificacion');
            $table->index('id_tributaria');
            $table->index('es_coincidencia_exacta');
            $table->index('accion_tomada');
            $table->index('hash_registro');
            $table->index(['busqueda_id', 'orden_relevancia']);
        });

        // SEGURIDAD: Agregar FK solo si la tabla padre existe
        // Esto previene errores si la migración anterior falló
        if (Schema::hasTable('listas_pep_busquedas') && Schema::hasColumn('listas_pep_busquedas', 'id')) {
            Schema::table('listas_pep_resultados', function (Blueprint $table) {
                $table->foreign('busqueda_id')
                    ->references('id')
                    ->on('listas_pep_busquedas')
                    ->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('listas_pep_resultados');
    }
};
