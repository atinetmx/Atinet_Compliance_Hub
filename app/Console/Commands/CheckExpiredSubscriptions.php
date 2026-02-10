<?php

namespace App\Console\Commands;

use App\Models\Subscription;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CheckExpiredSubscriptions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'subscriptions:check-expired {--dry-run : Display what would be done without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verifica suscripciones vencidas y desactiva notarías según el tipo de suscripción';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->info('🔍 Modo dry-run: No se realizarán cambios en la base de datos');
        }

        $this->info('🔄 Iniciando verificación de suscripciones vencidas...');
        $this->newLine();

        // Contadores para reporte
        $stats = [
            'trials_vencidos' => 0,
            'trials_desactivados' => 0,
            'pagos_vencidos' => 0,
            'periodo_gracia' => 0,
            'pagos_suspendidos' => 0,
        ];

        DB::transaction(function () use (&$stats, $dryRun) {
            // 1. Procesar suscripciones TRIAL vencidas
            $stats['trials_vencidos'] = $this->processExpiredTrials($dryRun);

            // 2. Procesar suscripciones de PAGO vencidas (período de gracia)
            $stats['pagos_vencidos'] = $this->processExpiredPaidSubscriptions($dryRun);

            // 3. Procesar suscripciones con período de gracia agotado
            $stats['pagos_suspendidos'] = $this->processSuspendedSubscriptions($dryRun);
        });

        // Reporte final
        $this->newLine();
        $this->info('✅ Verificación completada');
        $this->newLine();

        $this->table(
            ['Categoría', 'Cantidad'],
            [
                ['Trials vencidos detectados', $stats['trials_vencidos']],
                ['Suscripciones de pago vencidas', $stats['pagos_vencidos']],
                ['Suscripciones suspendidas (gracia agotada)', $stats['pagos_suspendidos']],
            ]
        );

        // Log del proceso
        Log::info('CheckExpiredSubscriptions ejecutado', $stats);

        return Command::SUCCESS;
    }

    /**
     * Procesar suscripciones TRIAL vencidas
     * Regla: Desactivar inmediatamente sin período de gracia
     */
    protected function processExpiredTrials(bool $dryRun): int
    {
        $this->info('📋 Buscando suscripciones TRIAL vencidas...');

        $expiredTrials = Subscription::with('notaria')
            ->where('status', Subscription::STATUS_TRIAL)
            ->where('fecha_vencimiento', '<', now())
            ->get();

        if ($expiredTrials->isEmpty()) {
            $this->line('   ✓ No hay suscripciones trial vencidas');

            return 0;
        }

        foreach ($expiredTrials as $subscription) {
            $notaria = $subscription->notaria;

            $this->warn("   ⚠️  Trial vencido: {$notaria->nombre} (ID: {$notaria->id})");
            $this->line("      Fecha vencimiento: {$subscription->fecha_vencimiento->format('Y-m-d')}");

            if (! $dryRun) {
                // Cambiar estado de suscripción
                $subscription->update([
                    'status' => Subscription::STATUS_VENCIDA,
                ]);

                // Desactivar notaría inmediatamente
                $notaria->update([
                    'activa' => false,
                ]);

                $this->line('      ✓ Suscripción marcada como vencida');
                $this->line('      ✓ Notaría desactivada');

                Log::warning("Trial vencido - Notaría desactivada: {$notaria->nombre} (ID: {$notaria->id})");
            } else {
                $this->line('      [DRY-RUN] Se marcaría como vencida y se desactivaría');
            }

            $this->newLine();
        }

        return $expiredTrials->count();
    }

    /**
     * Procesar suscripciones de PAGO vencidas
     * Regla: Marcar como vencida pero mantener activa por 7 días (período de gracia)
     */
    protected function processExpiredPaidSubscriptions(bool $dryRun): int
    {
        $this->info('💳 Buscando suscripciones de PAGO vencidas (inicio período de gracia)...');

        $expiredPaid = Subscription::with('notaria')
            ->where('status', Subscription::STATUS_ACTIVA)
            ->where('fecha_vencimiento', '<', now())
            ->get();

        if ($expiredPaid->isEmpty()) {
            $this->line('   ✓ No hay suscripciones de pago recién vencidas');

            return 0;
        }

        foreach ($expiredPaid as $subscription) {
            $notaria = $subscription->notaria;

            $this->warn("   ⚠️  Suscripción vencida: {$notaria->nombre} (ID: {$notaria->id})");
            $this->line("      Fecha vencimiento: {$subscription->fecha_vencimiento->format('Y-m-d')}");
            $this->line('      📅 Iniciando período de gracia de 7 días');

            if (! $dryRun) {
                // Solo cambiar estado a vencida, NO desactivar aún
                $subscription->update([
                    'status' => Subscription::STATUS_VENCIDA,
                ]);

                $this->line('      ✓ Suscripción marcada como vencida');
                $this->line('      ⏳ Notaría permanece activa (gracia)');

                Log::info("Suscripción de pago vencida - Período de gracia iniciado: {$notaria->nombre} (ID: {$notaria->id})");
            } else {
                $this->line('      [DRY-RUN] Se marcaría como vencida (sin desactivar)');
            }

            $this->newLine();
        }

        return $expiredPaid->count();
    }

    /**
     * Procesar suscripciones con período de gracia agotado
     * Regla: Si está vencida hace más de 7 días → suspender y desactivar
     */
    protected function processSuspendedSubscriptions(bool $dryRun): int
    {
        $this->info('🚫 Buscando suscripciones con período de gracia agotado (>7 días)...');

        $gracePeriodExpired = Subscription::with('notaria')
            ->where('status', Subscription::STATUS_VENCIDA)
            ->where('fecha_vencimiento', '<', now()->subDays(7))
            ->get();

        if ($gracePeriodExpired->isEmpty()) {
            $this->line('   ✓ No hay suscripciones con período de gracia agotado');

            return 0;
        }

        foreach ($gracePeriodExpired as $subscription) {
            $notaria = $subscription->notaria;
            $diasVencida = now()->diffInDays($subscription->fecha_vencimiento);

            $this->error("   ❌ Período de gracia agotado: {$notaria->nombre} (ID: {$notaria->id})");
            $this->line("      Vencida hace: {$diasVencida} días");

            if (! $dryRun) {
                // Suspender suscripción
                $subscription->update([
                    'status' => Subscription::STATUS_SUSPENDIDA,
                    'razon_cancelacion' => 'Suspendida por falta de pago después de período de gracia',
                ]);

                // Desactivar notaría
                $notaria->update([
                    'activa' => false,
                ]);

                $this->line('      ✓ Suscripción suspendida');
                $this->line('      ✓ Notaría desactivada');

                Log::warning("Período de gracia agotado - Notaría suspendida: {$notaria->nombre} (ID: {$notaria->id})");
            } else {
                $this->line('      [DRY-RUN] Se suspendería y desactivaría');
            }

            $this->newLine();
        }

        return $gracePeriodExpired->count();
    }
}
