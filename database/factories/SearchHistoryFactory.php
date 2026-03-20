<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\SearchHistory>
 */
class SearchHistoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $types = ['Persona Física', 'Persona Moral', 'RFC', 'Búsqueda Combinada'];
        $type = fake()->randomElement($types);

        $searchTerm = match ($type) {
            'Persona Física' => fake()->name(),
            'Persona Moral' => fake()->company(),
            'RFC' => strtoupper(fake()->bothify('????######???')),
            'Búsqueda Combinada' => fake()->name(),
        };

        $searchParams = $type === 'Búsqueda Combinada'
            ? ['rfc' => strtoupper(fake()->bothify('????######???')), 'tipo_persona' => fake()->randomElement(['fisica', 'moral'])]
            : null;

        return [
            'user_id' => \App\Models\User::factory(),
            'notaria_id' => fake()->boolean(70) ? \App\Models\Notaria::factory() : null,
            'search_term' => $searchTerm,
            'search_type' => $type,
            'results_count' => fake()->numberBetween(0, 5),
            'search_params' => $searchParams,
            'created_at' => fake()->dateTimeBetween('-30 days', 'now'),
        ];
    }
}
