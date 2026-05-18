<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cn_modulos', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique()->comment('Identificador único (ej: EXPEDIENTES_BASICO)');
            $table->string('nombre')->comment('Nombre visible del módulo');
            $table->text('descripcion')->nullable()->comment('Descripción del módulo');
            $table->string('grupo')->nullable()->comment('Agrupación (ej: Expedientes, Configuración, Reportes)');
            $table->integer('orden')->default(0)->comment('Orden de visualización');
            $table->boolean('is_active')->default(true)->comment('Módulo disponible para asignar');
            $table->timestamps();

            $table->index('grupo');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cn_modulos');
    }
};
