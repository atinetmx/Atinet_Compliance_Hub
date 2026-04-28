<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notaria_cn_modulos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('notaria_id')->constrained('notarias')->cascadeOnDelete();
            $table->foreignId('cn_modulo_id')->constrained('cn_modulos')->cascadeOnDelete();
            $table->boolean('is_enabled')->default(true)->comment('Módulo habilitado para esta notaría');
            $table->json('configuracion')->nullable()->comment('Configuración específica por notaría (JSON)');
            $table->timestamps();

            $table->unique(['notaria_id', 'cn_modulo_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notaria_cn_modulos');
    }
};
