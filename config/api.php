<?php

return [
    /*
    |--------------------------------------------------------------------------
    | API Base URL Configuration
    |--------------------------------------------------------------------------
    |
    | This URL defines the base endpoint for all API calls from the frontend.
    | Use environment variables to manage different URLs for dev and production.
    |
    | Default (development): https://localhost:44327/api
    | Production: http://api.atinet.com.mx:5000/api
    |
    */

    'base_url' => env('API_BASE_URL', 'https://localhost:44327/api'),
];
