<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CatalogosNegocioSeeder extends Seeder
{
    /**
     * Poblar catálogos de negocio para CRM de notarías
     */
    public function run(): void
    {
        $this->command->info('💼 Poblando catálogos de negocio...');

        $this->seedTiposCliente();
        $this->seedEstadoCivil();
        $this->seedRegimenConyugal();

        $this->command->info('✅ Catálogos de negocio poblados');
    }

    /**
     * Tipos de cliente / Personalidad legal
     */
    private function seedTiposCliente(): void
    {
        $tipos = [
            // Personas Físicas
            [
                'nombre' => 'Persona Física',
                'tipo' => 'fisica',
                'descripcion' => 'Persona física mayor de edad',
                'requiere_representante' => false,
                'requiere_razon_social' => false,
                'orden' => 1,
            ],
            [
                'nombre' => 'Menor de Edad',
                'tipo' => 'fisica',
                'descripcion' => 'Persona física menor de edad (requiere representante)',
                'requiere_representante' => true,
                'requiere_razon_social' => false,
                'orden' => 2,
            ],
            [
                'nombre' => 'Persona con Capacidad Restringida',
                'tipo' => 'fisica',
                'descripcion' => 'Persona física con capacidad jurídica restringida',
                'requiere_representante' => true,
                'requiere_razon_social' => false,
                'orden' => 3,
            ],

            // Personas Morales - Sociedades Mercantiles
            [
                'nombre' => 'Sociedad Anónima (S.A.)',
                'tipo' => 'moral',
                'descripcion' => 'Sociedad mercantil de capital',
                'requiere_representante' => true,
                'requiere_razon_social' => true,
                'orden' => 10,
            ],
            [
                'nombre' => 'Sociedad Anónima de Capital Variable (S.A. de C.V.)',
                'tipo' => 'moral',
                'descripcion' => 'Sociedad mercantil de capital variable',
                'requiere_representante' => true,
                'requiere_razon_social' => true,
                'orden' => 11,
            ],
            [
                'nombre' => 'Sociedad de Responsabilidad Limitada (S. de R.L.)',
                'tipo' => 'moral',
                'descripcion' => 'Sociedad mercantil de personas',
                'requiere_representante' => true,
                'requiere_razon_social' => true,
                'orden' => 12,
            ],
            [
                'nombre' => 'Sociedad de Responsabilidad Limitada de C.V. (S. de R.L. de C.V.)',
                'tipo' => 'moral',
                'descripcion' => 'Sociedad mercantil de personas con capital variable',
                'requiere_representante' => true,
                'requiere_razon_social' => true,
                'orden' => 13,
            ],
            [
                'nombre' => 'Sociedad en Comandita Simple (S. en C.)',
                'tipo' => 'moral',
                'descripcion' => 'Sociedad mercantil mixta',
                'requiere_representante' => true,
                'requiere_razon_social' => true,
                'orden' => 14,
            ],
            [
                'nombre' => 'Sociedad en Comandita por Acciones (S. en C. por A.)',
                'tipo' => 'moral',
                'descripcion' => 'Sociedad mercantil por acciones',
                'requiere_representante' => true,
                'requiere_razon_social' => true,
                'orden' => 15,
            ],
            [
                'nombre' => 'Sociedad Cooperativa (S.C.)',
                'tipo' => 'moral',
                'descripcion' => 'Sociedad cooperativa',
                'requiere_representante' => true,
                'requiere_razon_social' => true,
                'orden' => 16,
            ],

            // Personas Morales - Sociedades Civiles
            [
                'nombre' => 'Sociedad Civil (S.C.)',
                'tipo' => 'moral',
                'descripcion' => 'Sociedad civil de servicios profesionales',
                'requiere_representante' => true,
                'requiere_razon_social' => true,
                'orden' => 20,
            ],
            [
                'nombre' => 'Asociación Civil (A.C.)',
                'tipo' => 'moral',
                'descripcion' => 'Asociación civil sin fines de lucro',
                'requiere_representante' => true,
                'requiere_razon_social' => true,
                'orden' => 21,
            ],

            // Otras Entidades
            [
                'nombre' => 'Fideicomiso',
                'tipo' => 'moral',
                'descripcion' => 'Fideicomiso (patrimonio autónomo)',
                'requiere_representante' => true,
                'requiere_razon_social' => true,
                'orden' => 30,
            ],
            [
                'nombre' => 'Dependencia Gubernamental',
                'tipo' => 'moral',
                'descripcion' => 'Dependencia del gobierno federal, estatal o municipal',
                'requiere_representante' => true,
                'requiere_razon_social' => true,
                'orden' => 40,
            ],
            [
                'nombre' => 'Organismo Descentralizado',
                'tipo' => 'moral',
                'descripcion' => 'Organismo público descentralizado',
                'requiere_representante' => true,
                'requiere_razon_social' => true,
                'orden' => 41,
            ],
        ];

        foreach ($tipos as &$tipo) {
            $tipo['activo'] = true;
            $tipo['created_at'] = now();
            $tipo['updated_at'] = now();
        }

        DB::table('cat_tipos_cliente')->insert($tipos);

        $this->command->info("   ✓ " . count($tipos) . " tipos de cliente insertados");
    }

    /**
     * Estados civiles
     */
    private function seedEstadoCivil(): void
    {
        $estados = [
            [
                'nombre' => 'Soltero/a',
                'requiere_conyuge' => false,
                'requiere_regimen' => false,
                'orden' => 1,
            ],
            [
                'nombre' => 'Casado/a',
                'requiere_conyuge' => true,
                'requiere_regimen' => true,
                'orden' => 2,
            ],
            [
                'nombre' => 'Divorciado/a',
                'requiere_conyuge' => false,
                'requiere_regimen' => false,
                'orden' => 3,
            ],
            [
                'nombre' => 'Viudo/a',
                'requiere_conyuge' => false,
                'requiere_regimen' => false,
                'orden' => 4,
            ],
            [
                'nombre' => 'Unión Libre',
                'requiere_conyuge' => true,
                'requiere_regimen' => false,
                'orden' => 5,
            ],
            [
                'nombre' => 'Separado/a',
                'requiere_conyuge' => false,
                'requiere_regimen' => false,
                'orden' => 6,
            ],
        ];

        foreach ($estados as &$estado) {
            $estado['activo'] = true;
            $estado['created_at'] = now();
            $estado['updated_at'] = now();
        }

        DB::table('cat_estado_civil')->insert($estados);

        $this->command->info("   ✓ " . count($estados) . " estados civiles insertados");
    }

    /**
     * Regímenes conyugales
     */
    private function seedRegimenConyugal(): void
    {
        $regimenes = [
            [
                'nombre' => 'Sociedad Conyugal',
                'descripcion' => 'Los bienes se comparten entre los cónyuges',
                'orden' => 1,
            ],
            [
                'nombre' => 'Separación de Bienes',
                'descripcion' => 'Cada cónyuge conserva la propiedad de sus bienes',
                'orden' => 2,
            ],
            [
                'nombre' => 'Sociedad Legal',
                'descripcion' => 'Régimen legal supletorio (varía por estado)',
                'orden' => 3,
            ],
            [
                'nombre' => 'Mixto',
                'descripcion' => 'Combinación de separación y sociedad conyugal',
                'orden' => 4,
            ],
        ];

        foreach ($regimenes as &$regimen) {
            $regimen['activo'] = true;
            $regimen['created_at'] = now();
            $regimen['updated_at'] = now();
        }

        DB::table('cat_regimen_conyugal')->insert($regimenes);

        $this->command->info("   ✓ " . count($regimenes) . " regímenes conyugales insertados");
    }
}
