<?php

return [
    /*
    |--------------------------------------------------------------------------
    | API Base URL Configuration
    |--------------------------------------------------------------------------
    |
    | This URL defines the base endpoint for all API calls from the frontend.
    | Currently points to Control Notarial C# API (Alex - migrated from VB6).
    |
    | Development: https://localhost:44327/api
    | Production: https://srvatinet.atinet.com.mx:7443/api
    |
    | NOTE: This is temporary. Once Gateway is implemented, frontend will call
    | Laravel endpoints and Laravel will proxy to C# API server-to-server.
    |
    */

    'base_url' => env('CONTROL_NOTARIAL_API_URL', env('API_BASE_URL', 'https://srvatinet.atinet.com.mx:7443/api')),
];
