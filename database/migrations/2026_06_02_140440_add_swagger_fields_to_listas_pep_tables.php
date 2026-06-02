<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Agrega campos descubiertos en el Swagger de PrevencionDeLavado.com
 * (GET /swagger/v1/swagger.json — auditado Junio 2, 2026).
 *
 * Campos de PersonaDto (endpoint /Listas/ListasApi/Listas) no devueltos
 * por el endpoint /Listas actual, pero almacenados para cuando se
 * obtenga el objeto UA del vendor y se migre al endpoint enriquecido.
 *
 * Aplica a:
 *   - listas_pep_resultados  (log por búsqueda)
 *   - listas_pep_personas    (BD interna deduplicada)
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── listas_pep_resultados ──────────────────────────────────────────
        if (Schema::hasTable('listas_pep_resultados')) {
            Schema::table('listas_pep_resultados', function (Blueprint $table) {
                if (! Schema::hasColumn('listas_pep_resultados', 'fecha_baja')) {
                    $table->string('fecha_baja')->nullable()
                        ->after('finalizacion_cargo')
                        ->comment('Fecha en que el individuo fue dado de baja de la lista (PersonaDto.fechaBaja)');
                }

                if (! Schema::hasColumn('listas_pep_resultados', 'lista_id')) {
                    $table->string('lista_id', 100)->nullable()
                        ->after('lista')
                        ->comment('ID de la lista de origen (PersonaDto.listaId), e.g. "PEP-MEX-GOB"');
                }

                if (! Schema::hasColumn('listas_pep_resultados', 'pais_lista_id3')) {
                    $table->char('pais_lista_id3', 3)->nullable()
                        ->after('pais_lista')
                        ->comment('Código ISO-3166-1 alpha-3 del país de la lista (PersonaDto.paisListaId3), e.g. "MEX"');
                }

                if (! Schema::hasColumn('listas_pep_resultados', 'fuente_desc_larga')) {
                    $table->string('fuente_desc_larga', 500)->nullable()
                        ->after('lista_id')
                        ->comment('Nombre completo de la fuente/lista de origen (PersonaDto.fuenteDescLarga)');
                }
            });

            // Índices separados para compatibilidad
            Schema::table('listas_pep_resultados', function (Blueprint $table) {
                if (Schema::hasColumn('listas_pep_resultados', 'pais_lista_id3')) {
                    $table->index('pais_lista_id3', 'idx_pep_resultados_pais_id3');
                }
                if (Schema::hasColumn('listas_pep_resultados', 'lista_id')) {
                    $table->index('lista_id', 'idx_pep_resultados_lista_id');
                }
            });
        }

        // ── listas_pep_personas ───────────────────────────────────────────
        if (Schema::hasTable('listas_pep_personas')) {
            Schema::table('listas_pep_personas', function (Blueprint $table) {
                if (! Schema::hasColumn('listas_pep_personas', 'fecha_baja')) {
                    $table->string('fecha_baja')->nullable()
                        ->after('finalizacion_cargo')
                        ->comment('Fecha en que el individuo fue dado de baja de la lista (PersonaDto.fechaBaja)');
                }

                if (! Schema::hasColumn('listas_pep_personas', 'lista_id')) {
                    $table->string('lista_id', 100)->nullable()
                        ->after('lista')
                        ->comment('ID de la lista de origen (PersonaDto.listaId), e.g. "PEP-MEX-GOB"');
                }

                if (! Schema::hasColumn('listas_pep_personas', 'pais_lista_id3')) {
                    $table->char('pais_lista_id3', 3)->nullable()
                        ->after('pais_lista')
                        ->comment('Código ISO-3166-1 alpha-3 del país de la lista (PersonaDto.paisListaId3), e.g. "MEX"');
                }

                if (! Schema::hasColumn('listas_pep_personas', 'fuente_desc_larga')) {
                    $table->string('fuente_desc_larga', 500)->nullable()
                        ->after('lista_id')
                        ->comment('Nombre completo de la fuente/lista de origen (PersonaDto.fuenteDescLarga)');
                }
            });

            Schema::table('listas_pep_personas', function (Blueprint $table) {
                if (Schema::hasColumn('listas_pep_personas', 'pais_lista_id3')) {
                    $table->index('pais_lista_id3', 'idx_pep_personas_pais_id3');
                }
                if (Schema::hasColumn('listas_pep_personas', 'lista_id')) {
                    $table->index('lista_id', 'idx_pep_personas_lista_id');
                }
            });
        }
    }

    public function down(): void
    {
        $campos = ['fecha_baja', 'lista_id', 'fuente_desc_larga', 'pais_lista_id3'];

        if (Schema::hasTable('listas_pep_resultados')) {
            Schema::table('listas_pep_resultados', function (Blueprint $table) {
                $table->dropIndexIfExists('idx_pep_resultados_pais_id3');
                $table->dropIndexIfExists('idx_pep_resultados_lista_id');
            });
            Schema::table('listas_pep_resultados', function (Blueprint $table) use ($campos) {
                foreach ($campos as $col) {
                    if (Schema::hasColumn('listas_pep_resultados', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }

        if (Schema::hasTable('listas_pep_personas')) {
            Schema::table('listas_pep_personas', function (Blueprint $table) {
                $table->dropIndexIfExists('idx_pep_personas_pais_id3');
                $table->dropIndexIfExists('idx_pep_personas_lista_id');
            });
            Schema::table('listas_pep_personas', function (Blueprint $table) use ($campos) {
                foreach ($campos as $col) {
                    if (Schema::hasColumn('listas_pep_personas', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }
    }
};
