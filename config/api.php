<?php

return [
    /*
    |--------------------------------------------------------------------------
    | API Base URL Configuration
    |--------------------------------------------------------------------------
    |
    | base_url: URL interna del servidor C# de Control Notarial.
    | Usada server-to-server desde Laravel (nunca expuesta al browser).
    |
    | Development: https://localhost:44327/api
    | Production:  https://srvatinet.atinet.com.mx:7443/api
    |
    | proxy_path: Ruta pública en Laravel que actúa como proxy transparente.
    | El frontend llama a /cn-api/{endpoint} y Laravel reenvía internamente.
    | Así el browser nunca intenta resolver srvatinet.atinet.com.mx.
    |
    */

    'base_url' => env('CONTROL_NOTARIAL_API_URL', env('API_BASE_URL', 'https://srvatinet.atinet.com.mx:7443/api')),

    'proxy_path' => '/admin/cn-api',
];
