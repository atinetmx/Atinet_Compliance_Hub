<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== INVESTIGACIÓN: ¿Por qué faltan 71monterrey y 84Arteaga? ===\n\n";

// Buscar exactamente cómo aparecen en cada tabla
$notarias = ['71monterrey', '84Arteaga', '71Monterrey', '84arteaga'];

foreach ($notarias as $search) {
    echo "🔍 Buscando: '{$search}'\n";
    echo str_repeat('-', 80)."\n";

    // Usuario
    $usuario = DB::connection('aplicativos')
        ->table('usuario')
        ->where('notaria', $search)
        ->count();
    echo "  usuario.notaria = '{$search}': {$usuario} registros\n";

    // Busquedas Web
    $web = DB::connection('aplicativos')
        ->table('busquedas')
        ->where('NOTARIA', $search)
        ->count();
    echo "  busquedas.NOTARIA = '{$search}': {$web} búsquedas\n";

    // Busquedas Desktop
    $desktop = DB::connection('aplicativos')
        ->table('busquedas_escritorio')
        ->where('NOTARIA', $search)
        ->count();
    echo "  busquedas_escritorio.NOTARIA = '{$search}': {$desktop} búsquedas\n";

    // OFAC
    $ofac = DB::connection('aplicativos')
        ->selectOne('SELECT COUNT(*) as total FROM atinet65_listasofac.consultas WHERE proyecto = ?', [$search]);
    echo "  listasofac.consultas.proyecto = '{$search}': {$ofac->total} búsquedas\n";

    // SAT
    $sat = DB::connection('aplicativos')
        ->selectOne('SELECT COUNT(*) as total FROM atinet65_listassat.consultas WHERE proyecto = ?', [$search]);
    echo "  listassat.consultas.proyecto = '{$search}': {$sat->total} búsquedas\n";

    echo "\n";
}

echo "\n=== BÚSQUEDA CON LIKE ===\n\n";

// Buscar con LIKE para ver variaciones
$patterns = ['71%', '84%'];

foreach ($patterns as $pattern) {
    echo "🔍 Patrón: '{$pattern}'\n";

    // OFAC
    $ofacResults = DB::connection('aplicativos')
        ->select('
            SELECT DISTINCT proyecto, COUNT(*) as total
            FROM atinet65_listasofac.consultas
            WHERE proyecto LIKE ?
            GROUP BY proyecto
            ORDER BY total DESC
        ', [$pattern]);

    if (count($ofacResults) > 0) {
        echo "  OFAC:\n";
        foreach ($ofacResults as $row) {
            echo "    • '{$row->proyecto}': ".number_format($row->total)." búsquedas\n";
        }
    }

    // SAT
    $satResults = DB::connection('aplicativos')
        ->select('
            SELECT DISTINCT proyecto, COUNT(*) as total
            FROM atinet65_listassat.consultas
            WHERE proyecto LIKE ?
            GROUP BY proyecto
            ORDER BY total DESC
        ', [$pattern]);

    if (count($satResults) > 0) {
        echo "  SAT:\n";
        foreach ($satResults as $row) {
            echo "    • '{$row->proyecto}': ".number_format($row->total)." búsquedas\n";
        }
    }

    echo "\n";
}

echo "\n=== POSIBLES CAUSAS ===\n\n";

echo "1. ❓ Case sensitivity:\n";
echo "   - ¿'71monterrey' vs '71Monterrey'?\n";
echo "   - ¿'84Arteaga' vs '84arteaga'?\n\n";

echo "2. ❓ Espacios extra:\n";
echo "   - ¿' 71monterrey' o '71monterrey '?\n\n";

echo "3. ❓ Caracteres especiales:\n";
echo "   - ¿Acentos, ñ, otros?\n\n";

// Verificar en catálogo cómo aparece 71Monterrey
echo "\n=== VERIFICAR EN CATÁLOGO ===\n\n";

use Illuminate\Support\Facades\Storage;

$filename = 'catalogo_notarias_legacy.json';
$json = Storage::disk('local')->get($filename);
$catalog = json_decode($json, true);

$found71 = collect($catalog['notarias'])->filter(function ($notaria) {
    return stripos($notaria['notaria_id'], '71') === 0;
});

echo "Notarías que empiezan con '71' en catálogo:\n";
foreach ($found71 as $notaria) {
    echo "  • '{$notaria['notaria_id']}': ".number_format($notaria['total_busquedas'])." búsquedas\n";
}

$found84 = collect($catalog['notarias'])->filter(function ($notaria) {
    return stripos($notaria['notaria_id'], '84') === 0;
});

echo "\nNotarías que empiezan con '84' en catálogo:\n";
foreach ($found84 as $notaria) {
    echo "  • '{$notaria['notaria_id']}': ".number_format($notaria['total_busquedas'])." búsquedas\n";
}

echo "\n";
