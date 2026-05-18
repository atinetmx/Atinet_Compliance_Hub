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
        Schema::create('agenda_events', function (Blueprint $table) {
            $table->id();
            // notaria_id es nullable para soportar registros legacy sin mapeo aún
            $table->foreignId('notaria_id')->nullable()->constrained('notarias')->nullOnDelete();
            // user_id es nullable: la BD legacy no registra el creador del evento
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            // legacy_notaria preserva el slug original (ej: "71monterrey") para migración gradual
            $table->string('legacy_notaria', 15)->nullable()->index();
            $table->string('titulo', 145);
            $table->dateTime('start_fecha')->nullable();
            $table->dateTime('end_fecha')->nullable();
            $table->string('comentarios', 255)->nullable(); // legacy: varchar(145)
            $table->string('color', 10)->default('#2563eb'); // legacy: varchar(10)
            $table->enum('tipo', ['general', 'cita', 'recordatorio', 'festivo'])->default('general');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('agenda_events');
    }
};
