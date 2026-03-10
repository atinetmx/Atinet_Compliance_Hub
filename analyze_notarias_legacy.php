<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=======================================================================\n";
echo "    ANALISIS DE NOTARIAS EN TABLA USUARIO (BD LEGACY)\n";
echo "=======================================================================\n\n";

try {
    // 1. Notarías únicas (excluyendo 'atinet' que son empleados internos)
    echo "1. NOTARIAS UNICAS EN EL SISTEMA LEGACY\n";
    echo "-----------------------------------------------------------------------\n";

    $notarias = DB::connection('aplicativos')
        ->table('usuario')
        ->select('notaria', DB::raw('COUNT(*) as total_usuarios'))
        ->where('notaria', '!=', 'atinet')
        ->groupBy('notaria')
        ->orderBy('notaria')
        ->get();

    echo "  Total de notarías diferentes: " . $notarias->count() . "\n\n";

    // Mostrar primeras 20
    echo "  Primeras 20 notarías:\n";
    foreach ($notarias->take(20) as $n) {
        echo sprintf("    %-30s %3d usuarios\n", $n->notaria, $n->total_usuarios);
    }

    if ($notarias->count() > 20) {
        echo "    ... y " . ($notarias->count() - 20) . " notarías más\n";
    }

    echo "\n";

    // 2. Verificar notarías conocidas
    echo "2. VERIFICAR NOTARIAS CONOCIDAS (de las búsquedas)\n";
    echo "-----------------------------------------------------------------------\n";

    // Recordemos que en las consultas el proyecto es "142etla" y "2tlatlauquitepec"
    // Pero en la tabla usuario podría ser diferente

    $testNotarias = [
        '142etla',
        '2tlatlauquitepec',
        '142',
        '2',
        'etla',
        'tlatlauquitepec'
    ];

    foreach ($testNotarias as $test) {
        echo "\n  Buscando '{$test}':\n";
        $found = DB::connection('aplicativos')
            ->table('usuario')
            ->where('notaria', $test)
            ->orWhere('notaria', 'LIKE', "%{$test}%")
            ->get();

        if ($found->count() > 0) {
            foreach ($found as $u) {
                echo "    ✓ ID: {$u->id} | notaria: {$u->notaria} | USER: {$u->USER} | NOMBRE: {$u->NOMBRE}\n";
            }
        } else {
            echo "    ✗ No se encontró\n";
        }
    }

    echo "\n";

    // 3. Buscar notarías que contengan números específicos
    echo "3. NOTARIAS QUE CONTIENEN '142' o '2'\n";
    echo "-----------------------------------------------------------------------\n";

    $notarias142 = DB::connection('aplicativos')
        ->table('usuario')
        ->select('notaria', DB::raw('COUNT(*) as total'))
        ->where('notaria', 'LIKE', '%142%')
        ->groupBy('notaria')
        ->get();

    if ($notarias142->count() > 0) {
        echo "  Notarías con '142':\n";
        foreach ($notarias142 as $n) {
            echo "    - {$n->notaria} ({$n->total} usuarios)\n";
        }
    } else {
        echo "  ✗ No se encontraron notarías con '142'\n";
    }

    echo "\n";

    $notarias2 = DB::connection('aplicativos')
        ->table('usuario')
        ->select('notaria', DB::raw('COUNT(*) as total'))
        ->where('notaria', 'LIKE', '%tlatlauquitepec%')
        ->orWhere('notaria', 'LIKE', '2%')
        ->groupBy('notaria')
        ->get();

    if ($notarias2->count() > 0) {
        echo "  Notarías con 'tlatlauquitepec' o que empiezan con '2':\n";
        foreach ($notarias2 as $n) {
            echo "    - {$n->notaria} ({$n->total} usuarios)\n";
        }
    }

    echo "\n";

    // 4. Análisis de tipos de usuario
    echo "4. ANALISIS DE TIPO_USUARIO\n";
    echo "-----------------------------------------------------------------------\n";

    $tipos = DB::connection('aplicativos')
        ->table('usuario')
        ->select('TIPO_USUARIO', DB::raw('COUNT(*) as total'))
        ->groupBy('TIPO_USUARIO')
        ->get();

    echo "  Valores en TIPO_USUARIO:\n";
    foreach ($tipos as $t) {
        echo "    - '{$t->TIPO_USUARIO}': {$t->total} registros\n";
    }

    echo "\n";

    // 5. Usuarios ADMIN por notaría (para identificar notarías activas)
    echo "5. USUARIOS ADMIN POR NOTARIA (muestra)\n";
    echo "-----------------------------------------------------------------------\n";

    $admins = DB::connection('aplicativos')
        ->table('usuario')
        ->where('USER', 'ADMIN')
        ->where('notaria', '!=', 'atinet')
        ->orderBy('FECHA', 'desc')
        ->limit(15)
        ->get();

    echo "  Últimos 15 ADMIN creados:\n";
    foreach ($admins as $a) {
        echo "    - {$a->notaria} | Fecha: {$a->FECHA} | Password: {$a->PASSWORD}\n";
    }

    echo "\n";

    // 6. IMPORTANTE: Mapeo notaria (tabla usuario) VS proyecto (tabla consultas)
    echo "6. MAPEO: notaria vs proyecto\n";
    echo "-----------------------------------------------------------------------\n";
    echo "  Probando si 'proyecto' en consultas coincide con 'notaria' en usuario...\n\n";

    // Obtener algunos proyectos de las consultas OFAC
    $proyectosOfac = DB::connection('ofac')
        ->table('consultas')
        ->select('proyecto', DB::raw('COUNT(*) as total'))
        ->groupBy('proyecto')
        ->orderBy('total', 'desc')
        ->limit(10)
        ->get();

    echo "  Top 10 proyectos en consultas OFAC:\n";
    foreach ($proyectosOfac as $p) {
        echo "    - Proyecto: '{$p->proyecto}' ({$p->total} consultas)\n";

        // Buscar si existe en tabla usuario
        $existeUsuario = DB::connection('aplicativos')
            ->table('usuario')
            ->where('notaria', $p->proyecto)
            ->exists();

        if ($existeUsuario) {
            echo "      ✓ Existe en tabla usuario\n";
        } else {
            echo "      ✗ NO existe en tabla usuario (campo 'notaria')\n";
        }
    }

} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
}

echo "\n=======================================================================\n";
echo "Análisis completado\n";
echo "=======================================================================\n";
