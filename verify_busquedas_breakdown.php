<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

$notaria = '10Cuernavaca';

echo "\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "VERIFICACIÓN DE BÚSQUEDAS POR FUENTE: {$notaria}\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

// 1. Tabla aplicativos.busquedas (Web)
echo "1️⃣  BÚSQUEDAS WEB (aplicativos.busquedas)\n";
echo str_repeat('─', 60) . "\n";
try {
    $busquedasWeb = DB::connection('aplicativos')
        ->table('busquedas')
        ->where('NOTARIA', $notaria)
        ->selectRaw('
            COUNT(*) as total,
            MIN(fecha) as primera,
            MAX(fecha) as ultima,
            SUM(CASE WHEN fuente = "OFAC" THEN 1 ELSE 0 END) as ofac,
            SUM(CASE WHEN fuente = "SAT" THEN 1 ELSE 0 END) as sat
        ')
        ->first();
    
    echo "Total registros: " . number_format($busquedasWeb->total) . "\n";
    echo "  ├─ OFAC: " . number_format($busquedasWeb->ofac) . "\n";
    echo "  └─ SAT: " . number_format($busquedasWeb->sat) . "\n";
    echo "Primera: {$busquedasWeb->primera}\n";
    echo "Última: {$busquedasWeb->ultima}\n";
    
    // Muestra de registros
    $muestra = DB::connection('aplicativos')
        ->table('busquedas')
        ->where('NOTARIA', $notaria)
        ->orderBy('fecha', 'desc')
        ->limit(3)
        ->get(['fecha', 'fuente', 'RFC', 'NOMBRE']);
    
    echo "\n📋 Muestra (últimas 3):\n";
    foreach ($muestra as $b) {
        echo "  • {$b->fecha} | {$b->fuente} | RFC: {$b->RFC} | Nombre: {$b->NOMBRE}\n";
    }
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n\n";

// 2. Tabla aplicativos.busquedas_escritorio (Desktop/VB6)
echo "2️⃣  BÚSQUEDAS ESCRITORIO (aplicativos.busquedas_escritorio)\n";
echo str_repeat('─', 60) . "\n";
try {
    $busquedasEscritorio = DB::connection('aplicativos')
        ->table('busquedas_escritorio')
        ->where('NOTARIA', $notaria)
        ->selectRaw('
            COUNT(*) as total,
            MIN(fecha) as primera,
            MAX(fecha) as ultima,
            SUM(CASE WHEN fuente = "OFAC" THEN 1 ELSE 0 END) as ofac,
            SUM(CASE WHEN fuente = "SAT" THEN 1 ELSE 0 END) as sat
        ')
        ->first();
    
    echo "Total registros: " . number_format($busquedasEscritorio->total) . "\n";
    echo "  ├─ OFAC: " . number_format($busquedasEscritorio->ofac) . "\n";
    echo "  └─ SAT: " . number_format($busquedasEscritorio->sat) . "\n";
    echo "Primera: {$busquedasEscritorio->primera}\n";
    echo "Última: {$busquedasEscritorio->ultima}\n";
    
    // Muestra de registros
    $muestra = DB::connection('aplicativos')
        ->table('busquedas_escritorio')
        ->where('NOTARIA', $notaria)
        ->orderBy('fecha', 'desc')
        ->limit(3)
        ->get(['fecha', 'fuente', 'RFC', 'NOMBRE']);
    
    echo "\n📋 Muestra (últimas 3):\n";
    foreach ($muestra as $b) {
        echo "  • {$b->fecha} | {$b->fuente} | RFC: {$b->RFC} | Nombre: {$b->NOMBRE}\n";
    }
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n\n";

// 3. Tabla listasofac.consultas (OFAC directo)
echo "3️⃣  CONSULTAS OFAC DIRECTAS (listasofac.consultas)\n";
echo str_repeat('─', 60) . "\n";
try {
    $consultasOfac = DB::connection('ofac')
        ->table('consultas')
        ->where('proyecto', $notaria)
        ->selectRaw('
            COUNT(*) as total,
            MIN(fecha) as primera,
            MAX(fecha) as ultima
        ')
        ->first();
    
    echo "Total registros: " . number_format($consultasOfac->total) . "\n";
    echo "Primera: {$consultasOfac->primera}\n";
    echo "Última: {$consultasOfac->ultima}\n";
    
    // Muestra de registros
    $muestra = DB::connection('ofac')
        ->table('consultas')
        ->where('proyecto', $notaria)
        ->orderBy('fecha', 'desc')
        ->limit(3)
        ->get(['fecha', 'termino', 'resultados']);
    
    echo "\n📋 Muestra (últimas 3):\n";
    foreach ($muestra as $b) {
        echo "  • {$b->fecha} | Término: {$b->termino} | Resultados: {$b->resultados}\n";
    }
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n\n";

// 4. Tabla listassat.consultas (SAT directo)
echo "4️⃣  CONSULTAS SAT DIRECTAS (listassat.consultas)\n";
echo str_repeat('─', 60) . "\n";
try {
    $consultasSat = DB::connection('sat')
        ->table('consultas')
        ->where('proyecto', $notaria)
        ->selectRaw('
            COUNT(*) as total,
            MIN(fecha) as primera,
            MAX(fecha) as ultima
        ')
        ->first();
    
    echo "Total registros: " . number_format($consultasSat->total) . "\n";
    echo "Primera: {$consultasSat->primera}\n";
    echo "Última: {$consultasSat->ultima}\n";
    
    // Muestra de registros
    $muestra = DB::connection('sat')
        ->table('consultas')
        ->where('proyecto', $notaria)
        ->orderBy('fecha', 'desc')
        ->limit(3)
        ->get(['fecha', 'termino', 'resultados']);
    
    echo "\n📋 Muestra (últimas 3):\n";
    foreach ($muestra as $b) {
        echo "  • {$b->fecha} | Término: {$b->termino} | Resultados: {$b->resultados}\n";
    }
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "📊 RESUMEN COMPARATIVO\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

$totalWeb = $busquedasWeb->total ?? 0;
$totalEscritorio = $busquedasEscritorio->total ?? 0;
$totalOfac = $consultasOfac->total ?? 0;
$totalSat = $consultasSat->total ?? 0;

$totalAplicativos = $totalWeb + $totalEscritorio;
$totalListas = $totalOfac + $totalSat;
$totalGeneral = $totalAplicativos + $totalListas;

echo "📦 Tabla aplicativos (Web + Escritorio):\n";
echo "  ├─ busquedas (Web):           " . number_format($totalWeb) . "\n";
echo "  ├─ busquedas_escritorio:      " . number_format($totalEscritorio) . "\n";
echo "  └─ SUBTOTAL aplicativos:      " . number_format($totalAplicativos) . "\n\n";

echo "🔍 Tablas de listas negras:\n";
echo "  ├─ listasofac.consultas:      " . number_format($totalOfac) . "\n";
echo "  ├─ listassat.consultas:       " . number_format($totalSat) . "\n";
echo "  └─ SUBTOTAL listas:           " . number_format($totalListas) . "\n\n";

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "TOTAL UNION ALL (con posible duplicación): " . number_format($totalGeneral) . "\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

echo "💡 ANÁLISIS:\n\n";

if ($totalAplicativos > 0 && $totalListas > 0) {
    echo "⚠️  POSIBLE DUPLICACIÓN DETECTADA\n\n";
    echo "Las tablas de aplicativos (busquedas/busquedas_escritorio) registran\n";
    echo "cada búsqueda que hace el usuario en la app. Si busca OFAC + SAT en\n";
    echo "la misma consulta, se registra UNA fila en aplicativos con fuente='OFAC'\n";
    echo "o 'SAT', PERO además se registra en listasofac.consultas Y listassat.consultas.\n\n";
    
    echo "Esto significa que:\n";
    echo "  • aplicativos.busquedas es la FUENTE DE VERDAD (acciones del usuario)\n";
    echo "  • listasofac/sat.consultas son LOG de queries a las BDs (técnico)\n\n";
    
    echo "📌 RECOMENDACIÓN:\n";
    echo "Usar SOLO aplicativos.busquedas + busquedas_escritorio como conteo\n";
    echo "real de \"búsquedas del usuario\". Las tablas de listas son audit trail.\n\n";
} else if ($totalAplicativos == 0 && $totalListas > 0) {
    echo "✅ NO HAY DUPLICACIÓN\n\n";
    echo "Esta notaría solo tiene registros en listasofac/sat.consultas,\n";
    echo "lo que significa que:\n";
    echo "  • Usa la app vieja (Desktop VB6) que NO registra en aplicativos\n";
    echo "  • O las búsquedas son muy antiguas (antes de implementar aplicativos)\n\n";
    
    echo "📌 RECOMENDACIÓN:\n";
    echo "Usar listasofac.consultas + listassat.consultas como conteo.\n\n";
} else if ($totalAplicativos > 0 && $totalListas == 0) {
    echo "✅ SOLO APLICATIVOS\n\n";
    echo "Esta notaría solo usa aplicativos (Web/Desktop moderno).\n";
    echo "No hay registros en las tablas de listas negras.\n\n";
    
    echo "📌 RECOMENDACIÓN:\n";
    echo "Usar aplicativos.busquedas + busquedas_escritorio como conteo.\n\n";
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
