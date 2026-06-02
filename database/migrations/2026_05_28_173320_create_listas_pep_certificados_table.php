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
        if (Schema::hasTable('listas_pep_certificados')) {
            return;
        }

        Schema::create('listas_pep_certificados', function (Blueprint $table) {
            $table->id();

            // Relación con la búsqueda
            $table->unsignedBigInteger('busqueda_id')->comment('ID de la búsqueda PEP relacionada');
            if (Schema::hasTable('listas_pep_busquedas')) {
                $table->foreign('busqueda_id')
                    ->references('id')->on('listas_pep_busquedas')
                    ->onDelete('cascade');
            }

            // Relación opcional con el resultado seleccionado (solo para certificado CON coincidencia)
            $table->unsignedBigInteger('resultado_id')->nullable()
                ->comment('ID del resultado seleccionado. NULL = certificado sin coincidencias');
            if (Schema::hasTable('listas_pep_resultados')) {
                $table->foreign('resultado_id')
                    ->references('id')->on('listas_pep_resultados')
                    ->onDelete('set null');
            }

            // Tipo de certificado
            $table->enum('tipo', ['SIN_COINCIDENCIAS', 'CON_COINCIDENCIA'])
                ->comment('SIN_COINCIDENCIAS: ningún resultado coincide | CON_COINCIDENCIA: un resultado fue seleccionado');

            // Archivo PDF generado
            $table->string('archivo_pdf', 500)->nullable()
                ->comment('Ruta relativa al PDF generado en storage. Ej: listas-pep/certificados/cert_uuid.pdf');
            $table->char('hash_pdf', 64)->nullable()
                ->comment('SHA256 del archivo PDF para verificar integridad');

            // UUID interno del certificado (para QR y verificación)
            $table->uuid('uuid_certificado')->unique()
                ->comment('UUID único del certificado Atinet para verificación');

            // Observaciones del notario al emitir el certificado
            $table->text('observaciones')->nullable()
                ->comment('Observaciones o justificación del notario al emitir el certificado');

            // Usuario que emitió el certificado
            $table->unsignedBigInteger('emitido_por')->nullable()
                ->comment('ID del usuario que generó el certificado');
            if (Schema::hasTable('users') && Schema::hasColumn('users', 'id')) {
                $table->foreign('emitido_por')
                    ->references('id')->on('users')
                    ->onDelete('set null');
            }

            $table->timestamps();

            // Índices
            $table->index('busqueda_id', 'idx_pep_certs_busqueda');
            $table->index('tipo', 'idx_pep_certs_tipo');
            $table->index('uuid_certificado', 'idx_pep_certs_uuid');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('listas_pep_certificados');
    }
};
