<?php

// Verificar estado del API y respuesta exacta del error
$ch = curl_init('http://192.168.1.1:5000/api/Login/Authentication');
$payload = json_encode([
    'usuario' => 'ADMIN',
    'contrasena' => 'ADMIN',
    'notaria' => 11,
]);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_TIMEOUT => 10,
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo 'CURL Error: '.($error ?: 'ninguno')."\n";
echo "Response body:\n$response\n";
