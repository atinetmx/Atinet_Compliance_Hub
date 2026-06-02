<?php

namespace App\Services;

use App\Models\PepCuotaNotaria;
use App\Models\PepPaquetePld;
use App\Models\User;

/**
 * Centraliza la lógica de verificación y deducción de tokens PEP.
 *
 * Lógica de dos niveles:
 *  - Super-admin → usa la reserva del paquete Atinet (PepPaquetePld).
 *                  Sin límite de cuota propia; nunca consume tokens del modelo.
 *  - Notaría     → usa su cuota asignada (PepCuotaNotaria).
 */
class PepQuotaService
{
    /**
     * Verifica si el usuario tiene búsquedas PEP disponibles.
     * Lanza RuntimeException si no hay cuota suficiente.
     */
    public function verificarDisponibilidad(User $user): void
    {
        if ($user->isSuperAdmin()) {
            return;
        }

        $cuota = PepCuotaNotaria::deNotaria($user->notaria_id);

        if (! $cuota || $cuota->disponibles() <= 0) {
            throw new \RuntimeException('Sin cuota de búsquedas PEP disponible para esta notaría.');
        }
    }

    /**
     * Consume una búsqueda PEP del contador de la notaría.
     * Para super-admin no hace nada (sin límite propio).
     */
    public function consumir(User $user): void
    {
        if ($user->isSuperAdmin()) {
            return;
        }

        $cuota = PepCuotaNotaria::deNotaria($user->notaria_id);

        if (! $cuota) {
            throw new \RuntimeException('No hay cuota PEP asignada para esta notaría.');
        }

        $cuota->consumir();
    }

    /**
     * Retorna la información de paquete/cuota formateada para la UI.
     *
     * - Super-admin: datos del paquete PLD activo (reserva Atinet).
     * - Notaría: datos de su cuota asignada.
     *
     * @return array{total_contratado: int, consumidas: int, disponibles: int}|null
     */
    public function getPaqueteInfo(User $user): ?array
    {
        if ($user->isSuperAdmin()) {
            $paquete = PepPaquetePld::paqueteActivo();

            if (! $paquete) {
                return null;
            }

            return [
                'total_contratado' => $paquete->total_busquedas,
                'consumidas' => $paquete->busquedas_asignadas,
                'disponibles' => $paquete->reservaAtinet(),
            ];
        }

        $cuota = PepCuotaNotaria::deNotaria($user->notaria_id);

        if (! $cuota) {
            return null;
        }

        return [
            'total_contratado' => $cuota->busquedas_asignadas,
            'consumidas' => $cuota->busquedas_consumidas,
            'disponibles' => $cuota->disponibles(),
        ];
    }
}
