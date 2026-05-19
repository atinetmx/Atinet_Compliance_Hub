<?php

$baseUrl = 'http://192.168.1.1:8080';
$cookieFile = tempnam(sys_get_temp_dir(), 'laravel_');

// GET /login
$ch = curl_init("$baseUrl/login");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_COOKIEJAR => $cookieFile,
    CURLOPT_COOKIEFILE => $cookieFile,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_HEADER => true,
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n\n";

// Mostrar headers
$parts = explode("\r\n\r\n", $response, 2);
$headers = $parts[0];
$body = $parts[1] ?? '';

echo "=== HEADERS ===\n$headers\n\n";
echo "=== BODY (primeros 1000 chars) ===\n".substr($body, 0, 1000)."\n\n";

// Buscar CSRF en meta tag o en Inertia page data
preg_match('/<meta name="csrf-token" content="([^"]+)"/', $body, $m1);
preg_match('/&quot;_token&quot;:&quot;([^&]+)&quot;/', $body, $m2);
preg_match('/"csrf_token"\s*:\s*"([^"]+)"/', $body, $m3);
preg_match('/name="_token" value="([^"]+)"/', $body, $m4);

echo 'CSRF meta tag:    '.($m1[1] ?? 'no encontrado')."\n";
echo 'CSRF _token HTML: '.($m4[1] ?? 'no encontrado')."\n";
echo 'CSRF Inertia v1:  '.($m2[1] ?? 'no encontrado')."\n";
echo 'CSRF Inertia v2:  '.($m3[1] ?? 'no encontrado')."\n";

// Cookies recibidas
echo "\n=== COOKIES ===\n";
echo file_get_contents($cookieFile)."\n";

@unlink($cookieFile);
