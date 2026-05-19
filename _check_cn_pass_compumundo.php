<?php

$hash = str_replace('$2b$', '$2y$', '$2b$12$z0Iu7Pc08/56hTtvnpHZve6vSmiZDI9eYhiChLvQlat7PCt5VfXQi');
$candidates = [
    'admin123', 'Admin123', 'admin', 'Admin',
    'compumundo', 'COMPUMUNDO', 'Compumundo',
    'notaria101', 'Notaria101', 'notaria',
    'admin123!', 'Atinet2026', 'atinet123',
    '12345678', 'password', 'homero', 'Homero123',
    'compumundo@123', 'Compumundo@123',
];
foreach ($candidates as $p) {
    echo $p.': '.(password_verify($p, $hash) ? 'MATCH ✓' : 'no').PHP_EOL;
}
