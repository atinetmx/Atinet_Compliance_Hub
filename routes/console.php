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

// Sincronizar listas negras (OFAC y SAT) incrementalmente cada 12 horas
Schedule::command('blacklists:sync')
    ->twiceDaily(2, 14) // Ejecuta a las 2:00 AM y 2:00 PM
    ->withoutOverlapping(10) // Máximo 10 minutos por ejecución
    ->timezone('America/Mexico_City')
    ->onSuccess(function () {
        \Log::info('✅ Sincronización de listas negras completada exitosamente');
    })
    ->onFailure(function () {
        \Log::error('❌ Error en sincronización de listas negras - Revisar logs');
    })
    ->description('Sincroniza incrementalmente OFAC y SAT desde Hostgator');
