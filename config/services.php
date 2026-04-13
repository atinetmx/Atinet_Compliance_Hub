<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Google Gemini AI Service (OCR/QR Processing)
    |--------------------------------------------------------------------------
    |
    | Configuration for Google Gemini Vision API used for:
    | - OCR processing of INE, CURP, and Acta de Nacimiento documents
    | - SAT QR code data extraction (constancia fiscal scraping)
    |
    | Temperature set to 0.1 for consistency in data extraction.
    |
    */

    'gemini' => [
        'api_key' => env('GEMINI_API_KEY'),
        'model' => env('GEMINI_MODEL', 'gemini-2.5-pro'),
        'endpoint' => env('GEMINI_ENDPOINT', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent'),
        'timeout' => (int) env('GEMINI_TIMEOUT', 60),
        'temperature' => (float) env('GEMINI_TEMPERATURE', 0.1),
    ],

    /*
    |--------------------------------------------------------------------------
    | OpenAI Service (Document Analysis & OCR)
    |--------------------------------------------------------------------------
    |
    | Configuration for OpenAI GPT-4o with Vision API used for:
    | - Intelligent document scanning and analysis
    | - Data extraction from legal documents (escrituras, contratos, poderes)
    | - Document summarization and classification
    |
    | Temperature set to 0.1 for consistent structured data extraction.
    |
    */

    'openai' => [
        'api_key' => env('OPENAI_API_KEY'),
        'model' => env('OPENAI_MODEL', 'gpt-4o'),
        'endpoint' => env('OPENAI_ENDPOINT', 'https://api.openai.com/v1/chat/completions'),
        'timeout' => (int) env('OPENAI_TIMEOUT', 120),
        'temperature' => (float) env('OPENAI_TEMPERATURE', 0.1),
        'max_tokens' => (int) env('OPENAI_MAX_TOKENS', 4096),
    ],

];
