<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

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
            'nombre' => $this->faker->company() . ' Notaría',
            'codigo' => $this->faker->unique()->regexify('[A-Z]{3}[0-9]{3}'),
            'activa' => true,
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
