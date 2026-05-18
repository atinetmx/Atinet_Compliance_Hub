<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CatalogosGeografiaSeeder extends Seeder
{
    /**
     * Importa catálogos geográficos desde atinet65_catalogos (SEPOMEX)
     * Optimizado para 202,966 registros sin saturar memoria
     */
    public function run(): void
    {
        $this->command->info('🌎 Importando catálogos geográficos desde SEPOMEX...');

        // Deshabilitar FK checks para velocidad
        Schema::disableForeignKeyConstraints();

        DB::transaction(function () {
            $this->importarEstados();
            $this->importarMunicipios();
            $this->importarCiudades();
            $this->importarColonias();
        });

        Schema::enableForeignKeyConstraints();

        $this->command->info('✅ Catálogos geográficos importados exitosamente');
    }

    /**
     * Importar estados únicos (32 registros)
     */
    private function importarEstados(): void
    {
        $this->command->info('📍 Importando estados...');

        $estados = DB::connection('catalogos')
            ->table('cat_cp')
            ->select('d_estado', 'c_estado')
            ->distinct()
            ->orderBy('c_estado')
            ->get()
            ->map(function ($estado) {
                return [
                    'nombre' => trim($estado->d_estado),
                    'codigo_sepomex' => str_pad($estado->c_estado, 2, '0', STR_PAD_LEFT),
                    'activo' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            })
            ->toArray();

        DB::table('estados')->insert($estados);

        $count = count($estados);
        $this->command->info("   ✓ {$count} estados importados");
    }
    
    /**
     * Importar municipios únicos (~2,475 registros)
     */
    private function importarMunicipios(): void
    {
        $this->command->info('🏛️  Importando municipios...');

        // Crear mapeo estado_codigo → estado_id
        $estadosMap = DB::table('estados')
            ->pluck('id', 'codigo_sepomex')
            ->toArray();

        $municipios = DB::connection('catalogos')
            ->table('cat_cp')
            ->select('c_estado', 'D_mnpio', 'c_mnpio')
            ->distinct()
            ->orderBy('c_estado')
            ->orderBy('c_mnpio')
            ->get()
            ->map(function ($municipio) use ($estadosMap) {
                $codigoEstado = str_pad($municipio->c_estado, 2, '0', STR_PAD_LEFT);

                return [
                    'estado_id' => $estadosMap[$codigoEstado] ?? null,
                    'nombre' => trim($municipio->D_mnpio),
                    'codigo_sepomex' => str_pad($municipio->c_mnpio, 3, '0', STR_PAD_LEFT),
                    'activo' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            })
            ->filter(fn($m) => $m['estado_id'] !== null) // Eliminar sin estado
            ->toArray();

        // Insert en chunks para no saturar memoria
        foreach (array_chunk($municipios, 500) as $chunk) {
            DB::table('municipios')->insert($chunk);
        }

        $this->command->info("   ✓ " . count($municipios) . " municipios importados");
    }

    /**
     * Importar ciudades únicas (~800 registros)
     */
    private function importarCiudades(): void
    {
        $this->command->info('🏙️  Importando ciudades...');

        // Mapeo: codigo_estado + codigo_municipio → municipio_id
        $municipiosMap = DB::table('municipios')
            ->join('estados', 'municipios.estado_id', '=', 'estados.id')
            ->select(
                'municipios.id',
                DB::raw("CONCAT(estados.codigo_sepomex, '-', municipios.codigo_sepomex) as map_key")
            )
            ->pluck('id', 'map_key')
            ->toArray();

        $ciudades = DB::connection('catalogos')
            ->table('cat_cp')
            ->select('c_estado', 'c_mnpio', 'd_ciudad')
            ->whereNotNull('d_ciudad')
            ->where('d_ciudad', '!=', '')
            ->distinct()
            ->orderBy('c_estado')
            ->orderBy('c_mnpio')
            ->get()
            ->map(function ($ciudad) use ($municipiosMap) {
                $key = str_pad($ciudad->c_estado, 2, '0', STR_PAD_LEFT) . '-' .
                       str_pad($ciudad->c_mnpio, 3, '0', STR_PAD_LEFT);

                return [
                    'municipio_id' => $municipiosMap[$key] ?? null,
                    'nombre' => trim($ciudad->d_ciudad),
                    'activo' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            })
            ->filter(fn($c) => $c['municipio_id'] !== null)
            ->unique('nombre') // Evitar duplicados por nombre
            ->values()
            ->toArray();

        foreach (array_chunk($ciudades, 500) as $chunk) {
            DB::table('ciudades')->insert($chunk);
        }

        $this->command->info("   ✓ " . count($ciudades) . " ciudades importadas");
    }

    /**
     * Importar colonias (202,966 registros) - OPTIMIZADO CON CHUNKING
     */
    private function importarColonias(): void
    {
        $this->command->info('🏘️  Importando colonias (esto tomará ~2-3 minutos)...');

        // Mapeo completo: estado+municipio+ciudad → ciudad_id
        $ciudadesMap = DB::table('ciudades')
            ->join('municipios', 'ciudades.municipio_id', '=', 'municipios.id')
            ->join('estados', 'municipios.estado_id', '=', 'estados.id')
            ->select(
                'ciudades.id',
                DB::raw("CONCAT(estados.codigo_sepomex, '-', municipios.codigo_sepomex, '-', LOWER(TRIM(ciudades.nombre))) as map_key")
            )
            ->pluck('id', 'map_key')
            ->toArray();

        $total = 0;
        $batch = [];
        $batchSize = 1000;

        // Procesar en chunks desde catalogos
        DB::connection('catalogos')
            ->table('cat_cp')
            ->select('c_estado', 'c_mnpio', 'd_ciudad', 'd_asenta', 'd_tipo_asenta', 'd_codigo')
            ->whereNotNull('d_asenta')
            ->where('d_asenta', '!=', '')
            ->orderBy('d_codigo')
            ->chunk(5000, function ($chunk) use (&$total, &$batch, $batchSize, $ciudadesMap) {
                foreach ($chunk as $colonia) {
                    $key = str_pad($colonia->c_estado, 2, '0', STR_PAD_LEFT) . '-' .
                           str_pad($colonia->c_mnpio, 3, '0', STR_PAD_LEFT) . '-' .
                           strtolower(trim($colonia->d_ciudad ?? ''));

                    $ciudadId = $ciudadesMap[$key] ?? null;

                    // Si no hay ciudad, buscar primera ciudad del municipio
                    if (!$ciudadId && $colonia->d_ciudad) {
                        $ciudadId = DB::table('ciudades')
                            ->join('municipios', 'ciudades.municipio_id', '=', 'municipios.id')
                            ->join('estados', 'municipios.estado_id', '=', 'estados.id')
                            ->where('estados.codigo_sepomex', str_pad($colonia->c_estado, 2, '0', STR_PAD_LEFT))
                            ->where('municipios.codigo_sepomex', str_pad($colonia->c_mnpio, 3, '0', STR_PAD_LEFT))
                            ->value('ciudades.id');
                    }

                    if ($ciudadId) {
                        $batch[] = [
                            'ciudad_id' => $ciudadId,
                            'nombre' => trim($colonia->d_asenta),
                            'tipo_asentamiento' => trim($colonia->d_tipo_asenta ?? ''),
                            'codigo_postal' => trim($colonia->d_codigo),
                            'activo' => true,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];

                        $total++;

                        // Insert cuando llegamos al tamaño del batch
                        if (count($batch) >= $batchSize) {
                            DB::table('colonias')->insert($batch);
                            $batch = [];

                            if ($total % 10000 === 0) {
                                $this->command->info("   ... {$total} colonias procesadas");
                            }
                        }
                    }
                }
            });

        // Insertar último batch
        if (!empty($batch)) {
            DB::table('colonias')->insert($batch);
        }

        $this->command->info("   ✓ {$total} colonias importadas");
    }
}
