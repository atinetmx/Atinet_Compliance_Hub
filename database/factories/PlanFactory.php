<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Plan>
 */
class PlanFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nombre' => $this->faker->words(2, true).' Plan',
            'slug' => $this->faker->unique()->slug(),
            'descripcion' => $this->faker->sentence(),
            'precio_mensual' => $this->faker->randomFloat(2, 299, 2999),
            'precio_anual' => fn (array $attributes) => $attributes['precio_mensual'] * 10,
            'limite_usuarios' => $this->faker->numberBetween(5, 50),
            'limite_busquedas_mes' => $this->faker->numberBetween(100, 5000),
            'herramientas_activas' => ['busquedas', 'reportes_basicos'],
            'caracteristicas' => [
                'Característica 1',
                'Característica 2',
                'Característica 3',
            ],
            'is_active' => true,
            'orden' => $this->faker->numberBetween(1, 10),
        ];
    }
}
