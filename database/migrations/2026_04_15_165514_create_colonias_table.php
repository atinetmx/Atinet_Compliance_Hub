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
        Schema::create('colonias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ciudad_id')->constrained('ciudades')->cascadeOnDelete()->comment('Ciudad a la que pertenece');
            $table->string('nombre', 150)->comment('Nombre de la colonia/asentamiento');
            $table->string('tipo_asentamiento', 50)->nullable()->comment('Tipo: Colonia, Fraccionamiento, etc.');
            $table->string('codigo_postal', 5)->comment('Código Postal (CP)');
            $table->boolean('activo')->default(true);
            $table->timestamps();

            // Índices
            $table->index('codigo_postal');
            $table->index(['ciudad_id', 'codigo_postal']);
            $table->index('nombre');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('colonias');
    }
};
