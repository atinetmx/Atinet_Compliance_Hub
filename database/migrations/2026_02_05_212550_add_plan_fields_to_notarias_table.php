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
        Schema::table('notarias', function (Blueprint $table) {
            $table->foreignId('plan_id')->nullable()->after('codigo')->constrained()->nullOnDelete();

            // Overrides del plan (si son null, usa los del plan)
            $table->integer('limite_usuarios_custom')->nullable()->after('plan_id');
            $table->integer('limite_busquedas_mes_custom')->nullable()->after('limite_usuarios_custom');
            $table->json('herramientas_activas_custom')->nullable()->after('limite_busquedas_mes_custom');

            // Contadores
            $table->integer('total_usuarios')->default(0)->after('herramientas_activas_custom');
            $table->integer('busquedas_mes_actual')->default(0)->after('total_usuarios');

            // Información de la notaría
            $table->date('fecha_registro')->default(now())->after('activa');
            $table->string('contacto_principal')->nullable()->after('fecha_registro');
            $table->string('email_contacto')->nullable()->after('contacto_principal');
            $table->string('telefono')->nullable()->after('email_contacto');
            $table->text('direccion')->nullable()->after('telefono');
            $table->text('notas_internas')->nullable()->after('direccion');

            // Índices
            $table->index('plan_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notarias', function (Blueprint $table) {
            $table->dropForeign(['plan_id']);
            $table->dropIndex(['plan_id']);
            $table->dropColumn([
                'plan_id',
                'limite_usuarios_custom',
                'limite_busquedas_mes_custom',
                'herramientas_activas_custom',
                'total_usuarios',
                'busquedas_mes_actual',
                'fecha_registro',
                'contacto_principal',
                'email_contacto',
                'telefono',
                'direccion',
                'notas_internas'
            ]);
        });
    }
};
