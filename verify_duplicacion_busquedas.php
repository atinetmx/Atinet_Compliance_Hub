<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "VERIFICACIÓN DE DUPLICACIÓN DE BÚSQUEDAS\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

// Buscar notarías con registros en aplicativos Y en listas negras
echo "🔍 Buscando notarías con búsquedas en AMBAS fuentes...\n\n";

// Primero, obtener lista de notarías con búsquedas en aplicativos
$notariasAplicativos = DB::connection('aplicativos')
    ->table('busquedas')
    ->select('NOTARIA')
    ->groupBy('NOTARIA')
    ->havingRaw('COUNT(*) > 100') // Más de 100 búsquedas
    ->pluck('NOTARIA')
    ->take(5); // Solo las primeras 5

if ($notariasAplicativos->isEmpty()) {
    echo "❌ No se encontraron notarías con búsquedas en aplicativos.busquedas\n";
    echo "Probando con usuarios registrados...\n\n";

    // Buscar notarías con usuarios
    $notariasConUsuarios = DB::connection('aplicativos')
        ->table('usuario')
        ->where('notaria', '!=', 'atinet')
        ->whereNotNull('notaria')
        ->where('notaria', '!=', '')
        ->select('notaria')
        ->groupBy('notaria')
        ->havingRaw('COUNT(*) > 5')
        ->pluck('notaria')
        ->take(5);

    if ($notariasConUsuarios->isEmpty()) {
        echo "❌ No se encontraron notarías candidatas\n";
        exit(1);
    }

    $notariasCandidatas = $notariasConUsuarios;
} else {
    $notariasCandidatas = $notariasAplicativos;
}

echo "Notarías candidatas: " . $notariasCandidatas->implode(', ') . "\n\n";

// Análisis detallado de cada notaría
foreach ($notariasCandidatas as $notaria) {
    echo str_repeat('═', 80) . "\n";
    echo "📋 ANÁLISIS: {$notaria}\n";
    echo str_repeat('═', 80) . "\n\n";

    // 1. Contar en aplicativos.busquedas
    try {
        $countAplicativos = DB::connection('aplicativos')
            ->table('busquedas')
            ->where('NOTARIA', $notaria)
            ->count();
    } catch (\Exception $e) {
        $countAplicativos = 0;
    }

    // 2. Contar en aplicativos.busquedas_escritorio
    try {
        $countEscritorio = DB::connection('aplicativos')
            ->table('busquedas_escritorio')
            ->where('NOTARIA', $notaria)
            ->count();
    } catch (\Exception $e) {
        $countEscritorio = 0;
    }

    // 3. Contar en listasofac.consultas
    try {
        $countOfac = DB::connection('ofac')
            ->table('consultas')
            ->where('proyecto', $notaria)
            ->count();
    } catch (\Exception $e) {
        $countOfac = 0;
    }

    // 4. Contar en listassat.consultas
    try {
        $countSat = DB::connection('sat')
            ->table('consultas')
            ->where('proyecto', $notaria)
            ->count();
    } catch (\Exception $e) {
        $countSat = 0;
    }

    $totalAplicativos = $countAplicativos + $countEscritorio;
    $totalListas = $countOfac + $countSat;
    $totalUnionAll = $totalAplicativos + $totalListas;

    echo "📊 Conteo por tabla:\n";
    echo "  aplicativos.busquedas:       " . number_format($countAplicativos) . "\n";
    echo "  aplicativos.busquedas_escritorio: " . number_format($countEscritorio) . "\n";
    echo "  ─────────────────────────────────────\n";
    echo "  SUBTOTAL aplicativos:        " . number_format($totalAplicativos) . "\n\n";

    echo "  listasofac.consultas:        " . number_format($countOfac) . "\n";
    echo "  listassat.consultas:         " . number_format($countSat) . "\n";
    echo "  ─────────────────────────────────────\n";
    echo "  SUBTOTAL listas negras:      " . number_format($totalListas) . "\n\n";

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "  TOTAL UNION ALL:             " . number_format($totalUnionAll) . "\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

    // Análisis de duplicación
    if ($totalAplicativos > 0 && $totalListas > 0) {
        echo "⚠️  ANÁLISIS DE DUPLICACIÓN:\n\n";

        // Si aplicativos tiene búsquedas, comparar fechas
        if ($countAplicativos > 0) {
            $rangoAplicativos = DB::connection('aplicativos')
                ->table('busquedas')
                ->where('NOTARIA', $notaria)
                ->selectRaw('MIN(fecha) as primera, MAX(fecha) as ultima')
                ->first();

            echo "  Aplicativos.busquedas:\n";
            echo "    Primera: {$rangoAplicativos->primera}\n";
            echo "    Última:  {$rangoAplicativos->ultima}\n\n";
        }

        if ($countOfac > 0) {
            $rangoOfac = DB::connection('ofac')
                ->table('consultas')
                ->where('proyecto', $notaria)
                ->selectRaw('MIN(fecha) as primera, MAX(fecha) as ultima')
                ->first();

            echo "  Listasofac.consultas:\n";
            echo "    Primera: {$rangoOfac->primera}\n";
            echo "    Última:  {$rangoOfac->ultima}\n\n";
        }

        if ($countSat > 0) {
            $rangoSat = DB::connection('sat')
                ->table('consultas')
                ->where('proyecto', $notaria)
                ->selectRaw('MIN(fecha) as primera, MAX(fecha) as ultima')
                ->first();

            echo "  Listassat.consultas:\n";
            echo "    Primera: {$rangoSat->primera}\n";
            echo "    Última:  {$rangoSat->ultima}\n\n";
        }

        // Estimación de duplicación
        if ($totalAplicativos > 0 && $totalListas > $totalAplicativos * 0.8) {
            $porcentajeDuplicacion = round(($totalAplicativos / $totalListas) * 100, 1);
            echo "🚨 POSIBLE DUPLICACIÓN DETECTADA\n\n";
            echo "El conteo en aplicativos ({$totalAplicativos}) es similar al de listas ({$totalListas})\n";
            echo "Esto sugiere que cada búsqueda en la app se registra DOBLE:\n";
            echo "  1. En aplicativos (acción del usuario)\n";
            echo "  2. En listasofac/sat (query técnico)\n\n";
            echo "📌 Duplicación estimada: ~{$porcentajeDuplicacion}%\n\n";
        } else {
            echo "✅ Probablemente NO hay duplicación significativa\n\n";
            echo "Los conteos son muy diferentes:\n";
            echo "  • Si listas >> aplicativos: Búsquedas antiguas (VB6)\n";
            echo "  • Si aplicativos >> listas: App web sin listas negras\n\n";
        }
    } else if ($totalAplicativos == 0 && $totalListas > 0) {
        echo "✅ NO HAY DUPLICACIÓN\n";
        echo "Solo usa sistema legacy (Desktop VB6)\n\n";
    } else if ($totalAplicativos > 0 && $totalListas == 0) {
        echo "✅ NO HAY DUPLICACIÓN\n";
        echo "Solo usa app web/moderna (sin listas negras)\n\n";
    }

    echo "\n";
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "📌 CONCLUSIÓN GENERAL\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

echo "Para determinar el conteo correcto de búsquedas:\n\n";
echo "1️⃣  Si la notaría tiene búsquedas en aplicativos:\n";
echo "   → Usar SOLO aplicativos (es la fuente de verdad)\n";
echo "   → Las tablas de listas son audit trail técnico\n\n";

echo "2️⃣  Si la notaría NO tiene búsquedas en aplicativos:\n";
echo "   → Usar listas (ofac + sat)\n";
echo "   → Son búsquedas del sistema legacy (VB6)\n\n";

echo "3️⃣  NUNCA hacer UNION ALL de todas las tablas:\n";
echo "   → Causará duplicación en notarías modernas\n\n";

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
