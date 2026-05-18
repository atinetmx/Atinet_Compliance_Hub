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
        Schema::create('cat_estado_civil', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 50)->unique()->comment('Estado civil');
            $table->boolean('requiere_conyuge')->default(false)->comment('Si requiere datos del cónyuge');
            $table->boolean('requiere_regimen')->default(false)->comment('Si requiere régimen conyugal');
            $table->boolean('activo')->default(true);
            $table->integer('orden')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cat_estado_civil');
    }
};
