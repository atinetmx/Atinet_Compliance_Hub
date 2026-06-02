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
        if (Schema::hasTable('listas_pep_busquedas')) {
            return;
        }

        Schema::create('listas_pep_busquedas', function (Blueprint $table) {
            $table->id();

            // Relaciones
            $table->unsignedBigInteger('user_id')
                ->comment('Usuario que realizó la búsqueda');

            $table->unsignedBigInteger('notaria_id')
                ->comment('Notaría asociada a la búsqueda');

            // Parámetros de búsqueda
            $table->string('apellido_denominacion')
                ->comment('Apellido o denominación buscada');

            $table->string('nombres')->nullable()
                ->comment('Nombre(s) buscado(s)');

            $table->string('identificacion')->nullable()
                ->comment('CURP/RFC buscado');

            // Opciones de búsqueda (JSON)
            $table->json('opciones')
                ->comment('Opciones de búsqueda: pepsOtrosPaises, satXDenominacion, documentosSimilares, forzarApellidos, generarCertificados');

            // Resultados de la consulta
            $table->integer('total_resultados')->default(0)
                ->comment('Total de resultados devueltos por la API (ej: 94)');

            $table->uuid('codigo_certificado')->unique()
                ->comment('UUID del certificado generado por PrevencionDeLavado.com');

            $table->timestamp('fecha_consulta')
                ->comment('Fecha y hora cuando se realizó la consulta a la API');

            // Campos adicionales de auditoría y control
            $table->string('ip_address', 45)->nullable()
                ->comment('Dirección IP desde donde se realizó la búsqueda');

            $table->enum('estado_busqueda', ['PENDIENTE', 'PROCESADA', 'APROBADA', 'RECHAZADA'])
                ->default('PROCESADA')
                ->comment('Estado del proceso de revisión de la búsqueda');

            // Integración con expedientes notariales (opcional)
            // Nota: Sin FK constraint por incompatibilidad de tipos (signed vs unsigned)
            // La columna Id en tbl_ope_expedientes es integer() signed
            $table->unsignedInteger('expediente_id')->nullable()
                ->comment('Expediente notarial relacionado (si aplica) - tbl_ope_expedientes.Id');

            $table->timestamps();

            // Índices para optimizar consultas
            $table->index('user_id');
            $table->index('notaria_id');
            $table->index('codigo_certificado');
            $table->index('fecha_consulta');
            $table->index('apellido_denominacion');
            $table->index('estado_busqueda');
            $table->index(['notaria_id', 'created_at']);
        });

        // SEGURIDAD: Agregar FKs solo si las tablas padre existen
        // Esto previene errores si la estructura de producción es diferente
        if (Schema::hasTable('users') && Schema::hasColumn('users', 'id')) {
            Schema::table('listas_pep_busquedas', function (Blueprint $table) {
                $table->foreign('user_id')
                    ->references('id')
                    ->on('users')
                    ->onDelete('cascade');
            });
        }

        if (Schema::hasTable('notarias') && Schema::hasColumn('notarias', 'id')) {
            Schema::table('listas_pep_busquedas', function (Blueprint $table) {
                $table->foreign('notaria_id')
                    ->references('id')
                    ->on('notarias')
                    ->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('listas_pep_busquedas');
    }
};
