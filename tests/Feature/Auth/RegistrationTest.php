<?php

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
})->skip('El registro público está deshabilitado en este proyecto. Los usuarios son creados por super-admins.');

test('new users can register', function () {
    $response = $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));
})->skip('El registro público está deshabilitado en este proyecto. Los usuarios son creados por super-admins.');
