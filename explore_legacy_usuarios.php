<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=======================================================================\n";
echo "    EXPLORACION TABLA USUARIO EN BD LEGACY (atinet65_aplicativos)\n";
echo "=======================================================================\n\n";

try {
    // 1. Estructura de la tabla
    echo "1. ESTRUCTURA DE LA TABLA 'usuario'\n";
    echo "-----------------------------------------------------------------------\n";
    $columns = DB::connection('aplicativos')
        ->select("SHOW COLUMNS FROM usuario");

    foreach ($columns as $col) {
        echo sprintf("  %-30s %-20s %-10s %-10s\n",
            $col->Field,
            $col->Type,
            $col->Null,
            $col->Key
        );
    }

    echo "\n";

    // 2. Total de registros
    echo "2. TOTAL DE REGISTROS\n";
    echo "-----------------------------------------------------------------------\n";
    $total = DB::connection('aplicativos')->table('usuario')->count();
    echo "  Total usuarios/notarías: {$total}\n\n";

    // 3. Primeros 10 registros para ver estructura
    echo "3. PRIMEROS 10 REGISTROS (para entender estructura)\n";
    echo "-----------------------------------------------------------------------\n";
    $usuarios = DB::connection('aplicativos')
        ->table('usuario')
        ->orderBy('id')
        ->limit(10)
        ->get();

    foreach ($usuarios as $u) {
        echo "\n  ID: {$u->id}\n";
        foreach ($u as $key => $value) {
            if ($key !== 'id' && $value !== null && $value !== '') {
                echo "    {$key}: {$value}\n";
            }
        }
    }

    echo "\n";

    // 4. Buscar campos que identifiquen notarías
    echo "4. CAMPOS CLAVE PARA IDENTIFICAR NOTARIAS\n";
    echo "-----------------------------------------------------------------------\n";
    echo "  Buscando campos que contengan 'notaria', 'numero', 'proyecto', etc.\n\n";

    $sample = DB::connection('aplicativos')
        ->table('usuario')
        ->whereNotNull('proyecto')
        ->orWhereNotNull('numeroNotaria')
        ->limit(5)
        ->get();

    if ($sample->count() > 0) {
        foreach ($sample as $s) {
            echo "  ---\n";
            if (isset($s->id)) echo "  ID: {$s->id}\n";
            if (isset($s->proyecto)) echo "  proyecto: {$s->proyecto}\n";
            if (isset($s->numeroNotaria)) echo "  numeroNotaria: {$s->numeroNotaria}\n";
            if (isset($s->nombre)) echo "  nombre: {$s->nombre}\n";
            if (isset($s->usuario)) echo "  usuario: {$s->usuario}\n";
            if (isset($s->tipo)) echo "  tipo: {$s->tipo}\n";
            if (isset($s->perfil)) echo "  perfil: {$s->perfil}\n";
        }
    }

    echo "\n";

    // 5. Valores únicos en campos clave
    echo "5. ANALISIS DE CAMPOS CLAVE\n";
    echo "-----------------------------------------------------------------------\n";

    // Ver qué valores tiene el campo 'tipo' o 'perfil'
    $columnsCheck = ['tipo', 'perfil', 'tipoUsuario', 'rol'];
    foreach ($columnsCheck as $colName) {
        $exists = collect($columns)->contains(fn($col) => $col->Field === $colName);
        if ($exists) {
            echo "\n  Campo '{$colName}' - Valores únicos:\n";
            $values = DB::connection('aplicativos')
                ->table('usuario')
                ->select($colName, DB::raw('COUNT(*) as total'))
                ->groupBy($colName)
                ->get();

            foreach ($values as $v) {
                $val = $v->$colName ?? 'NULL';
                echo "    - {$val}: {$v->total} registros\n";
            }
        }
    }

    echo "\n";

    // 6. Buscar notarías específicas que ya conocemos
    echo "6. VERIFICAR NOTARIAS CONOCIDAS\n";
    echo "-----------------------------------------------------------------------\n";

    $notariasTest = ['142etla', '2tlatlauquitepec', '142', '2'];
    foreach ($notariasTest as $notaria) {
        echo "\n  Buscando: {$notaria}\n";
        $found = DB::connection('aplicativos')
            ->table('usuario')
            ->where('proyecto', $notaria)
            ->orWhere('proyecto', 'LIKE', "%{$notaria}%")
            ->orWhere('numeroNotaria', $notaria)
            ->limit(3)
            ->get();

        if ($found->count() > 0) {
            foreach ($found as $f) {
                echo "    ✓ ID: {$f->id}";
                if (isset($f->proyecto)) echo " | proyecto: {$f->proyecto}";
                if (isset($f->numeroNotaria)) echo " | numeroNotaria: {$f->numeroNotaria}";
                if (isset($f->nombre)) echo " | nombre: {$f->nombre}";
                echo "\n";
            }
        } else {
            echo "    ✗ No se encontró\n";
        }
    }

} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n=======================================================================\n";
echo "Exploración completada\n";
echo "=======================================================================\n";
