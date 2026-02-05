<?php

use App\Models\Busqueda;
use App\Models\Notaria;
use App\Models\User;

/*
|--------------------------------------------------------------------------
| Tests de Multi-Tenancy y Aislamiento de Datos
|--------------------------------------------------------------------------
|
| Valida que el sistema de multi-tenant funciona correctamente
| y que los datos están aislados entre notarías
|
*/

describe('aislamiento multi-tenant', function () {
    test('usuario ve solo búsquedas de su notaría', function () {
        // Arrange
        $notaria1 = Notaria::factory()->create();
        $notaria2 = Notaria::factory()->create();

        $user1 = User::factory()->for($notaria1)->create();
        $user2 = User::factory()->for($notaria2)->create();

        // Crear búsquedas sin global scope para setup
        $busqueda1 = Busqueda::withoutGlobalScopes()->create([
            'notaria_id' => $notaria1->id,
            'user_id' => $user1->id,
            'tipo_busqueda' => 'OFAC',
            'termino_busqueda' => 'Test 1',
            'resultados' => [],
        ]);
        
        $busqueda2 = Busqueda::withoutGlobalScopes()->create([
            'notaria_id' => $notaria2->id,
            'user_id' => $user2->id,
            'tipo_busqueda' => 'SAT',
            'termino_busqueda' => 'Test 2',
            'resultados' => [],
        ]);

        // Act & Assert
        $this->actingAs($user1);
        expect(Busqueda::count())->toBe(1); // Solo ve 1
        expect(Busqueda::first()->id)->toBe($busqueda1->id);
    });

    test('super_admin ve búsquedas de todas las notarías', function () {
        // Arrange
        $notaria1 = Notaria::factory()->create();
        $notaria2 = Notaria::factory()->create();

        $user1 = User::factory()->for($notaria1)->create();
        $user2 = User::factory()->for($notaria2)->create();
        $superAdmin = User::factory()->superAdmin()->create();

        // Crear búsquedas sin global scope para setup
        Busqueda::withoutGlobalScopes()->create([
            'notaria_id' => $notaria1->id,
            'user_id' => $user1->id,
            'tipo_busqueda' => 'OFAC',
            'termino_busqueda' => 'Test 1',
            'resultados' => [],
        ]);
        
        Busqueda::withoutGlobalScopes()->create([
            'notaria_id' => $notaria2->id,
            'user_id' => $user2->id,
            'tipo_busqueda' => 'SAT',
            'termino_busqueda' => 'Test 2',
            'resultados' => [],
        ]);

        // Act & Assert
        $this->actingAs($superAdmin);
        expect(Busqueda::count())->toBe(2); // Ve todas
    });

    test('usuario no puede acceder directamente a datos de otra notaría', function () {
        // Arrange
        $notaria1 = Notaria::factory()->create();
        $notaria2 = Notaria::factory()->create();

        $user1 = User::factory()->for($notaria1)->create();
        $user2 = User::factory()->for($notaria2)->create();
        
        $busqueda2 = Busqueda::withoutGlobalScopes()->create([
            'notaria_id' => $notaria2->id,
            'user_id' => $user2->id,
            'tipo_busqueda' => 'OFAC',
            'termino_busqueda' => 'Test',
            'resultados' => [],
        ]);

        // Act & Assert
        $this->actingAs($user1);
        expect(function () use ($busqueda2) {
            Busqueda::findOrFail($busqueda2->id);
        })->toThrow(\Illuminate\Database\Eloquent\ModelNotFoundException::class);
    });
});
