<?php

use App\Models\User;

/*
|--------------------------------------------------------------------------
| Ejemplo de Tests Pest para Autenticación
|--------------------------------------------------------------------------
|
| Este archivo muestra la estructura y mejores prácticas
| para escribir tests con Pest 3 en ATINET_COMPLIANCE_HUB
|
*/

describe('autenticación de usuarios', function () {
    test('usuario puede ver página de login', function () {
        $response = $this->get('/login');

        $response->assertStatus(200);
    });

    test('usuario puede autenticarse con credenciales válidas', function () {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
        ]);

        $response = $this->post('/login', [
            'email' => 'test@example.com',
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect('/dashboard');
    });

    test('usuario no puede autenticarse con contraseña incorrecta', function () {
        User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('correctpassword'),
        ]);

        $this->post('/login', [
            'email' => 'test@example.com',
            'password' => 'incorrectpassword',
        ]);

        $this->assertGuest();
    });

    test('usuario puede cerrar sesión', function () {
        $this->actingAs(User::factory()->create())
            ->post('/logout')
            ->assertRedirect('/');

        $this->assertGuest();
    });

    test('usuario no puede registrarse sin email', function () {
        $response = $this->post('/register', [
            'name' => 'Test User',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertSessionHasErrors('email');
    });
});
