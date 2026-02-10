<?php

namespace App;

enum BillingModel: string
{
    case INCLUDED = 'included';      // Incluido sin límite
    case LIMITED = 'limited';        // Incluido con límite
    case PER_USE = 'per_use';       // Se cobra por uso
    case UNLIMITED = 'unlimited';    // Ilimitado (plan premium)
}
