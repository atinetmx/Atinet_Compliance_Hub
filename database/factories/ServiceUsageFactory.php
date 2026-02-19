<?php

namespace Database\Factories;

use App\Models\Notaria;
use App\Models\Service;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ServiceUsage>
 */
class ServiceUsageFactory extends Factory
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
            'service_id' => Service::factory(),
            'user_id' => User::factory(),
            'consumed_at' => now(),
            'quantity' => 1,
            'cost' => fake()->randomFloat(2, 0, 100),
            'billable' => true,
            'billed_at' => null,
            'metadata' => null,
        ];
    }
}
