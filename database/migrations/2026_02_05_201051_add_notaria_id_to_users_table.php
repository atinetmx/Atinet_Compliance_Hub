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
            $table->foreignId('notaria_id')->nullable()->constrained()->nullOnDelete();
            $table->string('tipo_cuenta')->default('usuario_notaria'); // super_admin, admin_notaria, usuario_notaria, invitado
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['notaria_id']);
            $table->dropColumn('notaria_id');
            $table->dropColumn('tipo_cuenta');
        });
    }
};
