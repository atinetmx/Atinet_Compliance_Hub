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
        if (Schema::hasTable('pep_cuotas_notaria')) {
            return;
        }

        Schema::create('pep_cuotas_notaria', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('notaria_id')
                ->comment('Notaría a la que se asigna esta cuota');

            $table->unsignedBigInteger('paquete_id')
                ->comment('Paquete PLD del que proviene esta cuota');

            // Cuota asignada y consumo
            $table->unsignedInteger('busquedas_asignadas')
                ->comment('Número de búsquedas que Atinet asignó a esta notaría desde este paquete');

            $table->unsignedInteger('busquedas_consumidas')->default(0)
                ->comment('Búsquedas ya utilizadas por esta notaría');

            // Control
            $table->boolean('activo')->default(true)
                ->comment('true = cuota activa. Falso al vencer o al reemplazar por otra');

            $table->timestamp('fecha_asignacion')->useCurrent()
                ->comment('Cuándo se asignó esta cuota');

            $table->timestamp('fecha_vencimiento')->nullable()
                ->comment('Vencimiento opcional de la cuota (hereda del paquete si se omite)');

            $table->text('notas')->nullable()
                ->comment('Notas internas de Atinet sobre esta asignación');

            $table->timestamps();

            // FK: solo si las tablas padre existen
            if (Schema::hasTable('notarias')) {
                $table->foreign('notaria_id')
                    ->references('id')->on('notarias')
                    ->onDelete('cascade');
            }

            if (Schema::hasTable('pep_paquetes_pld')) {
                $table->foreign('paquete_id')
                    ->references('id')->on('pep_paquetes_pld')
                    ->onDelete('cascade');
            }

            $table->index('notaria_id');
            $table->index('paquete_id');
            $table->index('activo');
            $table->index(['notaria_id', 'activo']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pep_cuotas_notaria');
    }
};
