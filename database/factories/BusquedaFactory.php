<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Busqueda>
 */
class BusquedaFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'tipo_busqueda' => $this->faker->randomElement(['OFAC', 'SAT', 'CRUZADA']),
            'termino_busqueda' => $this->faker->name(),
            'resultados' => [],
        ];
    }
}
