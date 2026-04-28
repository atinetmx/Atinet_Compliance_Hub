<?php

require_once __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$SCHEMA = 'atinet_compliance_hub';

echo "=== ESTRUCTURA RELACIONAL DE TABLAS tbl_* EN MASTER ===\n\n";

// 1. Todas las tablas tbl_*
$tablas = DB::select("
    SELECT TABLE_NAME, TABLE_ROWS
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = '{$SCHEMA}' AND TABLE_NAME LIKE 'tbl_%'
    ORDER BY TABLE_NAME
");

echo 'TABLAS ENCONTRADAS: '.count($tablas)."\n";
echo str_repeat('=', 80)."\n\n";

$tablasSinNn = [];
$tablasConNn = [];

foreach ($tablas as $tabla) {
    $t = $tabla->TABLE_NAME;
    $filas = $tabla->TABLE_ROWS;

    echo "┌─ {$t}  ({$filas} filas)\n";

    // Columnas
    $cols = DB::select("SHOW COLUMNS FROM `{$t}`");
    foreach ($cols as $col) {
        $pk = $col->Key === 'PRI' ? ' [PK]' : '';
        $nn = $col->Field === 'Numero_Notaria' ? ' ◄ TENANT KEY' : '';
        echo "│  {$col->Field}  {$col->Type}  null={$col->Null}{$pk}{$nn}\n";
    }

    // FK salientes (esta → otra)
    $fksSal = DB::select("
        SELECT kcu.COLUMN_NAME, kcu.REFERENCED_TABLE_NAME, kcu.REFERENCED_COLUMN_NAME, rc.DELETE_RULE
        FROM information_schema.KEY_COLUMN_USAGE kcu
        JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
            ON rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME AND rc.CONSTRAINT_SCHEMA = kcu.TABLE_SCHEMA
        WHERE kcu.TABLE_SCHEMA = '{$SCHEMA}' AND kcu.TABLE_NAME = '{$t}'
          AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
        ORDER BY kcu.COLUMN_NAME
    ");
    if (! empty($fksSal)) {
        echo "│  ── FK SALIENTES:\n";
        foreach ($fksSal as $fk) {
            echo "│      {$fk->COLUMN_NAME} → {$fk->REFERENCED_TABLE_NAME}.{$fk->REFERENCED_COLUMN_NAME}  [ON DELETE {$fk->DELETE_RULE}]\n";
        }
    }

    // FK entrantes (otra → esta)
    $fksEnt = DB::select("
        SELECT kcu.TABLE_NAME, kcu.COLUMN_NAME, kcu.REFERENCED_COLUMN_NAME
        FROM information_schema.KEY_COLUMN_USAGE kcu
        WHERE kcu.TABLE_SCHEMA = '{$SCHEMA}' AND kcu.REFERENCED_TABLE_NAME = '{$t}'
          AND kcu.REFERENCED_COLUMN_NAME IS NOT NULL
        ORDER BY kcu.TABLE_NAME
    ");
    if (! empty($fksEnt)) {
        echo "│  ── REFERENCIADA POR:\n";
        foreach ($fksEnt as $fk) {
            echo "│      {$fk->TABLE_NAME}.{$fk->COLUMN_NAME} → .{$fk->REFERENCED_COLUMN_NAME}\n";
        }
    }

    // Tiene Numero_Notaria?
    $tieneNn = collect($cols)->contains('Field', 'Numero_Notaria');
    if ($tieneNn) {
        $tablasConNn[] = $t;
    } else {
        $tablasSinNn[] = $t;
    }

    echo '└'.str_repeat('─', 78)."\n\n";
}

// 2. Resumen
echo "\n".str_repeat('=', 80)."\n";
echo "RESUMEN TENANT MULTITENANCY\n";
echo str_repeat('=', 80)."\n\n";

echo 'CON Numero_Notaria ('.count($tablasConNn)."):\n";
foreach ($tablasConNn as $t) {
    echo "  ✅ {$t}\n";
}

echo "\nSIN Numero_Notaria (".count($tablasSinNn)."):\n";
foreach ($tablasSinNn as $t) {
    $filas = collect($tablas)->firstWhere('TABLE_NAME', $t)->TABLE_ROWS ?? 0;
    // ¿Está referenciada por alguna tabla que sí tiene Numero_Notaria?
    $conNnRef = DB::select("
        SELECT COUNT(*) as cnt
        FROM information_schema.KEY_COLUMN_USAGE kcu
        WHERE kcu.TABLE_SCHEMA = '{$SCHEMA}'
          AND kcu.REFERENCED_TABLE_NAME = '{$t}'
          AND kcu.TABLE_NAME IN ('".implode("','", $tablasConNn)."')
    ");
    $esRaiz = ($conNnRef[0]->cnt ?? 0) > 0 ? ' ← catálogo compartido' : ' ← NECESITA Numero_Notaria';
    echo "  ❌ {$t}  ({$filas} filas){$esRaiz}\n";
}

// 3. Cadena de relaciones comenzando desde tbl_ope_expedientes
echo "\n=== CADENA FK desde tbl_ope_expedientes ===\n\n";

function relacionadas(string $tabla, string $schema, array &$vis = []): array
{
    if (in_array($tabla, $vis)) {
        return [];
    }
    $vis[] = $tabla;
    $rows = DB::select("
        SELECT DISTINCT kcu.TABLE_NAME as t FROM information_schema.KEY_COLUMN_USAGE kcu
        WHERE kcu.TABLE_SCHEMA='{$schema}' AND kcu.REFERENCED_TABLE_NAME='{$tabla}'
        UNION
        SELECT DISTINCT kcu.REFERENCED_TABLE_NAME as t FROM information_schema.KEY_COLUMN_USAGE kcu
        WHERE kcu.TABLE_SCHEMA='{$schema}' AND kcu.TABLE_NAME='{$tabla}' AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
    ");
    $result = [$tabla];
    foreach ($rows as $r) {
        if ($r->t && str_starts_with($r->t, 'tbl_')) {
            $result = array_merge($result, relacionadas($r->t, $schema, $vis));
        }
    }

    return array_unique($result);
}

$vis = [];
$cadena = relacionadas('tbl_ope_expedientes', $SCHEMA, $vis);
sort($cadena);
foreach ($cadena as $t) {
    $tieneNn = in_array($t, $tablasConNn);
    $filas = collect($tablas)->firstWhere('TABLE_NAME', $t)->TABLE_ROWS ?? '?';
    echo ($tieneNn ? '  ✅' : '  ❌')." {$t}  ({$filas} filas)\n";
}
