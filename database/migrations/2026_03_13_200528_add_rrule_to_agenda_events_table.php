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
        Schema::table('agenda_events', function (Blueprint $table) {
            // Regla de recurrencia RFC 5545 (JSON), ej: {"freq":"weekly","byweekday":["mo"]}
            $table->json('rrule')->nullable()->after('tipo');
            // Duración del evento para eventos recurrentes, ej: "01:30" (HH:MM)
            $table->string('duration', 10)->nullable()->after('rrule');
            // Para eventos de todo el día
            $table->boolean('all_day')->default(false)->after('duration');
        });
    }

    public function down(): void
    {
        Schema::table('agenda_events', function (Blueprint $table) {
            $table->dropColumn(['rrule', 'duration', 'all_day']);
        });
    }
};
