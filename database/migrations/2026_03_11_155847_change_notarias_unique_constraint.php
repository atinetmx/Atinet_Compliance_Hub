<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Cambia el constraint unique de numero_notaria para permitir
     * múltiples notarías con el mismo número en diferentes ubicaciones.
     * Ejemplo: Notaría 10 de Cuernavaca, Notaría 10 de Acámbaro, etc.
     */
    public function up(): void
    {
        Schema::table('notarias', function (Blueprint $table) {
            // Eliminar el índice unique de numero_notaria (nombre original: notarias_codigo_unique)
            $table->dropUnique('notarias_codigo_unique');

            // Crear índice compuesto: número + estado + municipio deben ser únicos
            $table->unique(['numero_notaria', 'estado', 'municipio'], 'notarias_numero_estado_municipio_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notarias', function (Blueprint $table) {
            // Eliminar el índice compuesto
            $table->dropUnique('notarias_numero_estado_municipio_unique');

            // Restaurar el índice simple (esto fallará si hay duplicados)
            $table->string('numero_notaria')->unique()->change();
        });
    }
};
