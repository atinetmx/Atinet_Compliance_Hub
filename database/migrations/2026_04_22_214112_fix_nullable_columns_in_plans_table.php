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
        Schema::table('plans', function (Blueprint $table) {
            // Allow null to mean "unlimited" (original default -1 was misleading)
            $table->integer('limite_usuarios')->nullable()->default(null)->change();
            $table->integer('limite_busquedas_mes')->nullable()->default(null)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->integer('limite_usuarios')->nullable(false)->default(-1)->change();
            $table->integer('limite_busquedas_mes')->nullable(false)->default(-1)->change();
        });
    }
};
