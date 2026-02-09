<?php

namespace App;

enum ServiceCategory: string
{
    case CONSULTA = 'consulta';          // Búsquedas en listas (SAT, OFAC, PEP)
    case API = 'api';                    // APIs externas (captura docs, etc)
    case SISTEMA = 'sistema';            // Sistema notarial base, QR, etc
    case ANALISIS = 'analisis';          // Reportes, estadísticas, dashboards
    case ALMACENAMIENTO = 'storage';     // Storage adicional
    case INTEGRACION = 'integration';    // Conectores, webhooks
}
