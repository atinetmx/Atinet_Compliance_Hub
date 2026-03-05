<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
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

// Sincronizar listas negras (OFAC y SAT) - Mañana
Schedule::command('blacklists:sync')
    ->dailyAt('09:30') // Primera sincronización: 9:30 AM
    ->withoutOverlapping(10) // Máximo 10 minutos por ejecución
    ->timezone('America/Mexico_City')
    ->onSuccess(function () {
        Log::info('✅ Sincronización matutina de listas negras completada (9:30 AM)');
    })
    ->onFailure(function () {
        Log::error('❌ Error en sincronización matutina de listas negras (9:30 AM)');
    })
    ->description('Sincroniza OFAC y SAT desde Hostgator - Ejecución matutina');

// Sincronizar listas negras (OFAC y SAT) - Tarde
Schedule::command('blacklists:sync')
    ->dailyAt('18:15') // Segunda sincronización: 6:15 PM
    ->withoutOverlapping(10) // Máximo 10 minutos por ejecución
    ->timezone('America/Mexico_City')
    ->onSuccess(function () {
        Log::info('✅ Sincronización vespertina de listas negras completada (6:15 PM)');
    })
    ->onFailure(function () {
        Log::error('❌ Error en sincronización vespertina de listas negras (6:15 PM)');
    })
    ->description('Sincroniza OFAC y SAT desde Hostgator - Ejecución vespertina');
