<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Verificar suscripciones vencidas diariamente a las 2:00 AM
Schedule::command('subscriptions:check-expired')
    ->daily()
    ->at('02:00')
    ->timezone('America/Mexico_City')
    ->description('Verifica suscripciones vencidas y desactiva notarías según el tipo');
