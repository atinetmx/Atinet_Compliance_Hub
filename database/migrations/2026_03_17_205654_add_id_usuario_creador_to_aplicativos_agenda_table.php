<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Agrega la columna id_usuario_creador a la tabla agenda de aplicativos
     * para sincronizar con la estructura actualizada en Hostgator.
     */
    public function up(): void
    {
        Schema::connection('aplicativos')->table('agenda', function (Blueprint $table) {
            if (! Schema::connection('aplicativos')->hasColumn('agenda', 'id_usuario_creador')) {
                $table->unsignedInteger('id_usuario_creador')->nullable()->after('notaria')->index();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('aplicativos')->table('agenda', function (Blueprint $table) {
            if (Schema::connection('aplicativos')->hasColumn('agenda', 'id_usuario_creador')) {
                $table->dropColumn('id_usuario_creador');
            }
        });
    }
};
