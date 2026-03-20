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
        Schema::create('search_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('notaria_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('search_term'); // Término de búsqueda
            $table->string('search_type'); // Tipo: 'Persona Física', 'Persona Moral', 'RFC', 'Búsqueda Combinada'
            $table->integer('results_count')->default(0); // Cantidad de resultados
            $table->json('search_params')->nullable(); // Parámetros adicionales (ej: RFC en combinada)
            $table->timestamps();

            // Índices para búsquedas rápidas
            $table->index(['user_id', 'created_at']);
            $table->index(['notaria_id', 'created_at']);
            $table->index('search_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('search_histories');
    }
};
