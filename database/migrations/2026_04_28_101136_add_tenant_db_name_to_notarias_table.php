<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notarias', function (Blueprint $table) {
            $table->string('tenant_db_name')->nullable()->after('legacy_identifier')
                ->comment('Nombre de la BD tenant. Si es null, se calcula automáticamente.');
        });

        // Poblar el campo para las notarias existentes
        DB::table('notarias')->get()->each(function ($notaria) {
            if (empty($notaria->estado) || empty($notaria->numero_notaria)) {
                return;
            }

            // Replicar lógica de EstadoMexico::getCodeFromName()
            $estadoCodigos = [
                'colima' => 'colima', 'jalisco' => 'jal', 'estado de mexico' => 'edomex',
                'edomex' => 'edomex', 'morelos' => 'mor', 'oaxaca' => 'oax',
                'cdmx' => 'cdmx', 'guerrero' => 'gro', 'michoacan' => 'mich',
                'puebla' => 'pue', 'veracruz' => 'ver', 'baja california' => 'bc',
            ];
            $estadoNorm = strtolower(trim($notaria->estado));
            $codigo = $estadoCodigos[$estadoNorm] ?? $estadoNorm;
            $dbName = "atinet_{$codigo}_notaria_{$notaria->numero_notaria}";

            DB::table('notarias')->where('id', $notaria->id)
                ->update(['tenant_db_name' => $dbName]);
        });
    }

    public function down(): void
    {
        Schema::table('notarias', function (Blueprint $table) {
            $table->dropColumn('tenant_db_name');
        });
    }
};
