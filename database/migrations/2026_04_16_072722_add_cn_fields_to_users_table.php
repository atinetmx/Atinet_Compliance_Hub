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
        Schema::table('users', function (Blueprint $table) {
            // ID del registro correspondiente en tbl_cat_usuarios (para sincronización CN)
            $table->unsignedInteger('cn_usuario_id')->nullable()->after('notaria_id');
            // Rol específico dentro del sistema CN (relevante para tipo_cuenta=usuario_notaria)
            // 1=ADMINISTRADOR 2=NOTARIOS 3=RESPONSABLES 4=SECRETARIAS 5=AUTORIZADOS 6=GESTORES 7=PASANTES
            $table->unsignedTinyInteger('cn_rol_id')->nullable()->after('cn_usuario_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['cn_usuario_id', 'cn_rol_id']);
        });
    }
};
