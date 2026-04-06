<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory para crear instancias de Notaria en tests
 */
class NotariaFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nombre' => $this->faker->company().' Notaría',
            'numero_notaria' => $this->faker->unique()->regexify('[0-9]{3}'),
            'activa' => true,
            'total_usuarios' => 0,
        ];
    }

    /**
     * Indica que la notaría está inactiva
     */
    public function inactiva(): static
    {
        return $this->state(fn (array $attributes) => [
            'activa' => false,
        ]);
    }
}
