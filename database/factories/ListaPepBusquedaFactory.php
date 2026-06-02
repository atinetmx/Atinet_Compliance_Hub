<?php

namespace Database\Factories;

use App\Models\Notaria;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ListaPepBusqueda>
 */
class ListaPepBusquedaFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'notaria_id' => Notaria::factory(),
            'apellido_denominacion' => fake()->lastName(),
            'nombres' => fake()->firstName(),
            'identificacion' => fake()->numerify('##########'),
            'opciones' => ['listas' => ['REFIPRE', 'OCDE', 'GAFI']],
            'total_resultados' => 0,
            'codigo_certificado' => fake()->uuid(),
            'fecha_consulta' => now(),
            'ip_address' => fake()->ipv4(),
            'estado_busqueda' => 'PROCESADA',
        ];
    }
}
