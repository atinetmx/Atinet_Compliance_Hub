<?php

namespace Database\Factories;

use App\BillingModel;
use App\ServiceCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory para crear instancias de Service en tests
 */
class ServiceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => strtoupper($this->faker->unique()->lexify('??????_???')),
            'name' => $this->faker->words(3, true),
            'description' => $this->faker->sentence(10),
            'category' => $this->faker->randomElement(ServiceCategory::cases()),
            'billing_model' => $this->faker->randomElement(BillingModel::cases()),
            'unit_price' => $this->faker->randomFloat(2, 0, 100),
            'is_active' => true,
            'metadata' => null,
        ];
    }

    /**
     * Indica que el servicio está inactivo
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    /**
     * Servicio de categoría consulta
     */
    public function consulta(): static
    {
        return $this->state(fn (array $attributes) => [
            'category' => ServiceCategory::CONSULTA,
        ]);
    }

    /**
     * Servicio de categoría API
     */
    public function api(): static
    {
        return $this->state(fn (array $attributes) => [
            'category' => ServiceCategory::API,
        ]);
    }

    /**
     * Servicio de categoría sistema
     */
    public function sistema(): static
    {
        return $this->state(fn (array $attributes) => [
            'category' => ServiceCategory::SISTEMA,
            'billing_model' => BillingModel::INCLUDED,
            'unit_price' => null,
        ]);
    }

    /**
     * Servicio gratuito incluido
     */
    public function included(): static
    {
        return $this->state(fn (array $attributes) => [
            'billing_model' => BillingModel::INCLUDED,
            'unit_price' => null,
        ]);
    }

    /**
     * Servicio con uso ilimitado
     */
    public function unlimited(): static
    {
        return $this->state(fn (array $attributes) => [
            'billing_model' => BillingModel::UNLIMITED,
        ]);
    }

    /**
     * Servicio limitado
     */
    public function limited(): static
    {
        return $this->state(fn (array $attributes) => [
            'billing_model' => BillingModel::LIMITED,
        ]);
    }

    /**
     * Servicio de pago por uso
     */
    public function perUse(): static
    {
        return $this->state(fn (array $attributes) => [
            'billing_model' => BillingModel::PER_USE,
        ]);
    }
}
