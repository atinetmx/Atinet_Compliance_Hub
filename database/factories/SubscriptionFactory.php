<?php

namespace Database\Factories;

use App\Models\Notaria;
use App\Models\Plan;
use App\Models\Subscription;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Subscription>
 */
class SubscriptionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'notaria_id' => Notaria::factory(),
            'plan_id' => Plan::factory(),
            'status' => Subscription::STATUS_ACTIVA,
            'fecha_inicio' => now(),
            'fecha_vencimiento' => now()->addMonth(),
            'precio_pagado' => fake()->randomFloat(2, 100, 5000),
            'moneda' => 'MXN',
            'ciclo_facturacion' => fake()->randomElement(['mensual', 'anual']),
            'auto_renovacion' => true,
        ];
    }
}
