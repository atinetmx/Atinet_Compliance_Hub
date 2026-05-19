<?php

/**
 * Verifica login de Laravel (POST /login via Fortify) para todos los usuarios.
 * Fortify usa sesión + CSRF — simula con cookie jar y token.
 */
$baseUrl = 'http://192.168.1.1:8080';

$users = [
    ['email' => 'admin@atinet.mx',                   'password' => 'password123', 'label' => 'SUPERUSUARIO (uid=1)'],
    ['email' => 'admin@atinet.com.mx',               'password' => 'ADMIN',       'label' => 'ADMIN (uid=11)'],
    ['email' => 'panfilop@11cuatitlan.com',           'password' => 'admin123',    'label' => 'PANFILOP (uid=2)'],
    ['email' => 'elizabeth.ortega@atinet.com.mx',    'password' => 'admin123',    'label' => 'ELIZABETH.ORTEGA (uid=3)'],
    ['email' => 'contacto@not10.mx',                 'password' => 'admin123',    'label' => 'CONTACTO (uid=4)'],
    ['email' => 'notaria113hux@gmail.com',           'password' => 'admin123',    'label' => 'NOTARIA113HUX (uid=5)'],
    ['email' => 'atencion@atinet.com.mx',            'password' => 'admin123',    'label' => 'ATENCION (uid=6)'],
    ['email' => 'jess@atinet.com.mx',                'password' => 'admin123',    'label' => 'JESS (uid=7)'],
    ['email' => 'karla@atinet.com.mx',               'password' => 'admin123',    'label' => 'KARCER (uid=8)'],
    ['email' => 'claus@atinet.com.mx',               'password' => 'admin123',    'label' => 'CLAUS (uid=9)'],
    ['email' => 'ari@atinet.com.mx',                 'password' => 'admin123',    'label' => 'ARI (uid=10)'],
    ['email' => 'usuario@gmail.com',                 'password' => 'admin123',    'label' => 'USUARIO (uid=13)'],
    ['email' => 'PRUEBA@GMAIL.COM',                  'password' => 'admin123',    'label' => 'PRUEBA (uid=14)'],
    ['email' => 'alma@atinet.local',                 'password' => 'admin123',    'label' => 'ALMA (uid=15)'],
    ['email' => 'not1@notaria11.local',              'password' => 'admin123',    'label' => 'NOT1 (uid=16)'],
    ['email' => 'sec1@notaria11.local',              'password' => 'admin123',    'label' => 'SEC1 (uid=17)'],
    ['email' => 'res1@notaria11.local',              'password' => 'admin123',    'label' => 'RES1 (uid=18)'],
    ['email' => 'notaria60@notaria60edomex.com',     'password' => 'admin123',    'label' => 'NOTARIA60 (uid=19)'],
    ['email' => 'lalo@gmail.com',                    'password' => 'admin123',    'label' => 'LALO (uid=22)'],
    ['email' => 'compumundo@hypermegared.com',       'password' => 'admin123',    'label' => 'COMPUMUNDO (uid=23)'],
];

echo "=== VERIFICACION LOGIN LARAVEL (Fortify POST /login) ===\n";
echo str_pad('usuario', 28).str_pad('password', 14)."resultado\n";
echo str_repeat('-', 65)."\n";

$ok = 0;
$fail = 0;

foreach ($users as $u) {
    $cookieFile = tempnam(sys_get_temp_dir(), 'laravel_cookie_');

    // Paso 1: GET /login para obtener CSRF token
    $ch = curl_init("$baseUrl/login");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_COOKIEJAR => $cookieFile,
        CURLOPT_COOKIEFILE => $cookieFile,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_FOLLOWLOCATION => true,
    ]);
    $html = curl_exec($ch);
    curl_close($ch);

    // Extraer CSRF token del meta tag (Inertia no usa input _token)
    preg_match('/<meta name="csrf-token" content="([^"]+)"/', $html, $m);
    $csrf = $m[1] ?? null;

    if (! $csrf) {
        echo str_pad($u['label'], 28).str_pad($u['password'], 14)."SIN CSRF TOKEN ✗\n";
        @unlink($cookieFile);
        $fail++;

        continue;
    }

    // Paso 2: POST /login con credenciales
    $ch2 = curl_init("$baseUrl/login");
    curl_setopt_array($ch2, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query([
            '_token' => $csrf,
            'email' => $u['email'],
            'password' => $u['password'],
        ]),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/x-www-form-urlencoded',
            'X-CSRF-TOKEN: '.$csrf,
            'Accept: text/html,application/xhtml+xml',
        ],
        CURLOPT_COOKIEJAR => $cookieFile,
        CURLOPT_COOKIEFILE => $cookieFile,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_FOLLOWLOCATION => false,
    ]);
    curl_exec($ch2);
    $httpCode = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
    $location = curl_getinfo($ch2, CURLINFO_REDIRECT_URL);
    curl_close($ch2);

    // Fortify redirige a /dashboard (302) si login OK, a /login si falla
    $loginOk = ($httpCode === 302 && ! str_contains($location, '/login'));
    $result = $loginOk
        ? "HTTP $httpCode → $location ✓"
        : "HTTP $httpCode → ".($location ?: 'sin redirect').' ✗';

    echo str_pad($u['label'], 28).str_pad($u['password'], 14).$result."\n";
    $loginOk ? $ok++ : $fail++;

    @unlink($cookieFile);
}

echo "\nLaravel OK: $ok | Fallos: $fail\n";
