<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Cambiar columnas cp y cp_fiscal de integer a varchar(5)
 *
 * Los códigos postales mexicanos pueden comenzar con cero (ej: 01000, 06600).
 * Almacenarlos como integer destroza esos valores. Se usa varchar(5) con padding.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('registro_web', function (Blueprint $table) {
            $table->string('cp', 5)->default('')->change();
            $table->string('cp_fiscal', 5)->default('')->change();
        });
    }

    public function down(): void
    {
        Schema::table('registro_web', function (Blueprint $table) {
            $table->integer('cp')->default(0)->change();
            $table->integer('cp_fiscal')->default(0)->change();
        });
    }
};
