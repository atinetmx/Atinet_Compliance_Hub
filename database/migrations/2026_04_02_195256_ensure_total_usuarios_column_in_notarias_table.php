<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Verificar si la columna existe, si no, crearla
        if (! Schema::hasColumn('notarias', 'total_usuarios')) {
            Schema::table('notarias', function (Blueprint $table) {
                $table->integer('total_usuarios')->default(0)->after('activa');
            });
        }

        // Recalcular el total_usuarios para todas las notarías basándose en el conteo real
        $notarias = DB::table('notarias')->get();
        foreach ($notarias as $notaria) {
            $count = DB::table('users')
                ->where('notaria_id', $notaria->id)
                ->count();

            DB::table('notarias')
                ->where('id', $notaria->id)
                ->update(['total_usuarios' => $count]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No eliminar la columna en el rollback, solo dejarla como estaba
        // Si la columna fue creada por esta migración, la eliminamos
        if (Schema::hasColumn('notarias', 'total_usuarios')) {
            // Dejar la columna, no es seguro eliminarla porque puede ser usada
        }
    }
};
