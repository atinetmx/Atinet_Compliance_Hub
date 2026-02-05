<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory para crear instancias de Ticket en tests
 *
 * NOTA: Los modelos Notaria y User se crean en FASE 1
 * Por ahora usamos IDs directos, se actualizará en FASE 1
 */
class TicketFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'notaria_id' => 1, // Se reemplazará en FASE 1 con Notaria::factory()
            'usuario_id' => 1, // Se reemplazará en FASE 1 con User::factory()
            'asunto' => $this->faker->sentence(),
            'descripcion' => $this->faker->paragraph(),
            'prioridad' => $this->faker->randomElement(['baja', 'media', 'alta', 'urgente']),
            'estado' => 'abierto',
        ];
    }

    /**
     * Estado: en progreso
     */
    public function inProgress(): static
    {
        return $this->state(fn (array $attributes) => [
            'estado' => 'en_progreso',
        ]);
    }

    /**
     * Estado: resuelto
     */
    public function resolved(): static
    {
        return $this->state(fn (array $attributes) => [
            'estado' => 'resuelto',
        ]);
    }

    /**
     * Prioridad: alta
     */
    public function highPriority(): static
    {
        return $this->state(fn (array $attributes) => [
            'prioridad' => 'alta',
        ]);
    }

    /**
     * Asociado a notaría específica
     * NOTA: Se actualizará en FASE 1 con type hint Notaria
     */
    public function forNotaria($notaria): static
    {
        return $this->state(fn (array $attributes) => [
            'notaria_id' => $notaria->id,
        ]);
    }

    /**
     * Creado por usuario específico
     * NOTA: Se actualizará en FASE 1 con type hint User
     */
    public function byUser($user): static
    {
        return $this->state(fn (array $attributes) => [
            'usuario_id' => $user->id,
            'notaria_id' => $user->notaria_id ?? 1,
        ]);
    }
}
