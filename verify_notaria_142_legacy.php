<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=======================================================================\n";
echo "    VERIFICACION NOTARIA 2tlatlauquitepec EN BASES DE DATOS LEGACY\n";
echo "=======================================================================\n\n";

// =========================================================================
// 1. BASE DE DATOS: aplicativos
// =========================================================================
echo "1. BASE DE DATOS: aplicativos (atinet65_aplicativos)\n";
echo "-----------------------------------------------------------------------\n";

try {
    // Tabla: busquedas - Campo: NOTARIA
    echo "\n   a) Tabla: busquedas - Campo: NOTARIA\n";
    $busquedasApp = DB::connection('aplicativos')
        ->table('busquedas')
        ->where('NOTARIA', '2tlatlauquitepec')
        ->orWhere('NOTARIA', 'LIKE', '%2tlatlauquitepec%')
        ->get();

    echo '      Total registros: '.$busquedasApp->count()."\n";

    if ($busquedasApp->count() > 0) {
        echo "      Primeros 5 registros:\n";
        foreach ($busquedasApp->take(5) as $reg) {
            echo '      - ID: '.($reg->id ?? 'N/A');
            echo ' | NOTARIA: '.($reg->NOTARIA ?? 'N/A');
            if (isset($reg->RFC)) {
                echo " | RFC: {$reg->RFC}";
            }
            if (isset($reg->NOMBRE)) {
                echo " | NOMBRE: {$reg->NOMBRE}";
            }
            if (isset($reg->fecha)) {
                echo " | Fecha: {$reg->fecha}";
            }
            echo "\n";
        }
    } else {
        echo "      ❌ No se encontraron búsquedas de la notaría 2tlatlauquitepec\n";
    }

    // Tabla: busquedas_escritorio - Campo: NOTARIA
    echo "\n   b) Tabla: busquedas_escritorio - Campo: NOTARIA\n";
    $busquedasEscritorio = DB::connection('aplicativos')
        ->table('busquedas_escritorio')
        ->where('NOTARIA', '2tlatlauquitepec')
        ->orWhere('NOTARIA', 'LIKE', '%2tlatlauquitepec%')
        ->get();

    echo '      Total registros: '.$busquedasEscritorio->count()."\n";

    if ($busquedasEscritorio->count() > 0) {
        echo "      Primeros 5 registros:\n";
        foreach ($busquedasEscritorio->take(5) as $reg) {
            echo '      - ID: '.($reg->id ?? 'N/A');
            echo ' | NOTARIA: '.($reg->NOTARIA ?? 'N/A');
            if (isset($reg->RFC)) {
                echo " | RFC: {$reg->RFC}";
            }
            if (isset($reg->NOMBRE)) {
                echo " | NOMBRE: {$reg->NOMBRE}";
            }
            if (isset($reg->fecha)) {
                echo " | Fecha: {$reg->fecha}";
            }
            echo "\n";
        }
    } else {
        echo "      ❌ No se encontraron búsquedas de escritorio de la notaría 2tlatlauquitepec\n";
    }

    $totalAplicativos = $busquedasApp->count() + $busquedasEscritorio->count();
    echo "\n   TOTAL EN APLICATIVOS: {$totalAplicativos} registros\n";

} catch (Exception $e) {
    echo '   ❌ ERROR: '.$e->getMessage()."\n";
}

echo "\n";

// =========================================================================
// 2. BASE DE DATOS: listassat
// =========================================================================
echo "2. BASE DE DATOS: listassat (atinet65_listassat)\n";
echo "-----------------------------------------------------------------------\n";

try {
    // Tabla: consultas - Campo: proyecto
    echo "\n   Tabla: consultas - Campo: proyecto\n";
    $consultasSat = DB::connection('sat')
        ->table('consultas')
        ->where('proyecto', '2tlatlauquitepec')
        ->orWhere('proyecto', 'LIKE', '%2tlatlauquitepec%')
        ->get();

    echo '   Total registros: '.$consultasSat->count()."\n";

    if ($consultasSat->count() > 0) {
        echo "   Primeros 5 registros:\n";
        foreach ($consultasSat->take(5) as $reg) {
            echo '   - ID: '.($reg->id ?? 'N/A');
            echo ' | proyecto: '.($reg->proyecto ?? 'N/A');
            if (isset($reg->rfc)) {
                echo " | RFC: {$reg->rfc}";
            }
            if (isset($reg->nombre)) {
                echo " | Nombre: {$reg->nombre}";
            }
            if (isset($reg->fecha)) {
                echo " | Fecha: {$reg->fecha}";
            }
            echo "\n";
        }
    } else {
        echo "   ❌ No se encontraron consultas SAT de la notaría 2tlatlauquitepec\n";
    }

    echo "\n   TOTAL EN LISTASSAT: ".$consultasSat->count()." registros\n";

} catch (Exception $e) {
    echo '   ❌ ERROR: '.$e->getMessage()."\n";
}

echo "\n";

// =========================================================================
// 3. BASE DE DATOS: listasofac
// =========================================================================
echo "3. BASE DE DATOS: listasofac (atinet65_listasofac)\n";
echo "-----------------------------------------------------------------------\n";

try {
    // Tabla: consultas - Campo: proyecto
    echo "\n   Tabla: consultas - Campo: proyecto\n";
    $consultasOfac = DB::connection('ofac')
        ->table('consultas')
        ->where('proyecto', '2tlatlauquitepec')
        ->orWhere('proyecto', 'LIKE', '%2tlatlauquitepec%')
        ->get();

    echo '   Total registros: '.$consultasOfac->count()."\n";

    if ($consultasOfac->count() > 0) {
        echo "   Primeros 5 registros:\n";
        foreach ($consultasOfac->take(5) as $reg) {
            echo '   - ID: '.($reg->id ?? 'N/A');
            echo ' | proyecto: '.($reg->proyecto ?? 'N/A');
            if (isset($reg->nombre)) {
                echo " | Nombre: {$reg->nombre}";
            }
            if (isset($reg->fecha)) {
                echo " | Fecha: {$reg->fecha}";
            }
            echo "\n";
        }
    } else {
        echo "   ❌ No se encontraron consultas OFAC de la notaría 2tlatlauquitepec\n";
    }

    echo "\n   TOTAL EN LISTASOFAC: ".$consultasOfac->count()." registros\n";

} catch (Exception $e) {
    echo '   ❌ ERROR: '.$e->getMessage()."\n";
}

echo "\n";

// =========================================================================
// RESUMEN FINAL
// =========================================================================
echo "=======================================================================\n";
echo "                           RESUMEN FINAL\n";
echo "=======================================================================\n";

$totalAplicativosCount = ($totalAplicativos ?? 0);
$totalSatCount = ($consultasSat->count() ?? 0);
$totalOfacCount = ($consultasOfac->count() ?? 0);
$granTotal = $totalAplicativosCount + $totalSatCount + $totalOfacCount;

echo "\n";
echo "  📊 APLICATIVOS (busquedas + busquedas_escritorio): {$totalAplicativosCount}\n";
echo "  📊 LISTASSAT (consultas):                          {$totalSatCount}\n";
echo "  📊 LISTASOFAC (consultas):                         {$totalOfacCount}\n";
echo '  '.str_repeat('-', 60)."\n";
echo "  🎯 TOTAL BÚSQUEDAS NOTARÍA 2tlatlauquitepec:       {$granTotal}\n";
echo "\n";

if ($granTotal > 0) {
    echo "✅ La notaría 2tlatlauquitepec SÍ tiene búsquedas registradas en el sistema legacy\n";
} else {
    echo "❌ La notaría 2tlatlauquitepec NO tiene búsquedas registradas en ninguna BD legacy\n";
}

echo "\n=======================================================================\n";
