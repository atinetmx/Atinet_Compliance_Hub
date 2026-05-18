<?php

use App\Models\Notaria;
use App\Models\User;

beforeEach(function () {
    $this->superAdmin = User::factory()->create([
        'tipo_cuenta' => 'super_admin',
        'email' => 'superadmin@test.com',
        'password' => bcrypt('password'),
    ]);
});

test('super admin puede eliminar usuarios regulares', function () {
    $userToDelete = User::factory()->create([
        'tipo_cuenta' => 'usuario_notaria',
        'email' => 'usuario@test.com',
    ]);

    $this->actingAs($this->superAdmin)
        ->delete("/admin/users/{$userToDelete->id}")
        ->assertRedirect('/admin/users')
        ->assertSessionHas('success');

    $this->assertDatabaseMissing('users', [
        'id' => $userToDelete->id,
    ]);
});

test('no se puede eliminar super admin', function () {
    $anotherSuperAdmin = User::factory()->create([
        'tipo_cuenta' => 'super_admin',
        'email' => 'another@test.com',
    ]);

    $this->actingAs($this->superAdmin)
        ->delete("/admin/users/{$anotherSuperAdmin->id}")
        ->assertSessionHasErrors('error');

    $this->assertDatabaseHas('users', [
        'id' => $anotherSuperAdmin->id,
    ]);
});

test('puede eliminar admin de notaria', function () {
    $notaria = Notaria::factory()->create();

    $adminNotaria = User::factory()->create([
        'tipo_cuenta' => 'admin_notaria',
        'notaria_id' => $notaria->id,
        'email' => 'admin@notaria.com',
    ]);

    // Verificar que el contador se incremente
    $notaria->refresh();
    expect($notaria->total_usuarios)->toBe(1);

    $this->actingAs($this->superAdmin)
        ->delete("/admin/users/{$adminNotaria->id}")
        ->assertRedirect('/admin/users')
        ->assertSessionHas('success');

    $this->assertDatabaseMissing('users', [
        'id' => $adminNotaria->id,
    ]);

    // Verificar que el contador se decremente
    $notaria->refresh();
    expect($notaria->total_usuarios)->toBe(0);
});

test('actualiza contador al crear usuario', function () {
    $notaria = Notaria::factory()->create();

    expect($notaria->total_usuarios)->toBe(0);

    $this->actingAs($this->superAdmin)
        ->post('/admin/users', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'tipo_cuenta' => 'usuario_notaria',
            'notaria_id' => $notaria->id,
        ])
        ->assertRedirect('/admin/users');

    $notaria->refresh();
    expect($notaria->total_usuarios)->toBe(1);
});

test('actualiza contador al cambiar usuario de notaria', function () {
    $notaria1 = Notaria::factory()->create();
    $notaria2 = Notaria::factory()->create();

    $user = User::factory()->create([
        'tipo_cuenta' => 'usuario_notaria',
        'notaria_id' => $notaria1->id,
    ]);

    $notaria1->refresh();
    expect($notaria1->total_usuarios)->toBe(1);
    expect($notaria2->total_usuarios)->toBe(0);

    // Cambiar usuario a otra notaría
    $this->actingAs($this->superAdmin)
        ->put("/admin/users/{$user->id}", [
            'name' => $user->name,
            'email' => $user->email,
            'tipo_cuenta' => $user->tipo_cuenta,
            'notaria_id' => $notaria2->id,
        ])
        ->assertRedirect('/admin/users');

    $notaria1->refresh();
    $notaria2->refresh();
    expect($notaria1->total_usuarios)->toBe(0);
    expect($notaria2->total_usuarios)->toBe(1);
});
