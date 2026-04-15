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
        Schema::create('documentos_escaneados', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('notaria_id')->nullable()->constrained('notarias')->cascadeOnDelete();

            // Información del archivo original
            $table->string('nombre_original');
            $table->string('ruta_original'); // storage/documentos/originales/{hash}.ext
            $table->string('tipo_mime_original');
            $table->bigInteger('tamano_bytes');

            // Tipo de documento detectado (escritura, contrato, poder, etc.)
            $table->string('tipo_documento')->nullable();

            // Archivos procesados
            $table->string('ruta_pdf')->nullable(); // storage/documentos/pdf/{hash}.pdf
            $table->string('ruta_word')->nullable(); // storage/documentos/word/{hash}.docx
            $table->string('ruta_texto')->nullable(); // storage/documentos/txt/{hash}.txt

            // Estado de procesamiento
            $table->enum('estado', ['pendiente', 'procesando', 'completado', 'error'])->default('pendiente');
            $table->text('error_mensaje')->nullable();

            // Análisis con OpenAI
            $table->boolean('analizado_ia')->default(false);
            $table->json('datos_extraidos')->nullable(); // Datos estructurados extraídos por IA
            $table->text('resumen_ia')->nullable(); // Resumen generado por IA
            $table->json('metadatos_ia')->nullable(); // Metadatos adicionales (confianza, advertencias, etc.)

            // Uso
            $table->integer('veces_descargado')->default(0);
            $table->timestamp('ultima_descarga')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Índices
            $table->index('user_id');
            $table->index('notaria_id');
            $table->index('tipo_documento');
            $table->index('estado');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documentos_escaneados');
    }
};
