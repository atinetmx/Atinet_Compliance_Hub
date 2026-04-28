<?php

require_once __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== ¿A qué notaría pertenece la data de CN en master? ===\n\n";

echo "[tbl_cat_usuarios] — con Numero_Notaria\n";
$usuarios = DB::select('SELECT Id, Nombre, Correo, Rol_Id, Numero_Notaria, Activo FROM tbl_cat_usuarios ORDER BY Numero_Notaria, Id');
foreach ($usuarios as $u) {
    echo "  Id={$u->Id}  Notaria='{$u->Numero_Notaria}'  {$u->Correo}  Rol={$u->Rol_Id}  Activo={$u->Activo}\n";
}

echo "\n[tbl_ope_expedientes] — dueño inferido por Notario_Id\n";
$exps = DB::select('
    SELECT e.Id, e.Numero_Escritura, e.Fecha_Creacion,
           un.Numero_Notaria as Notaria_Notario, un.Nombre as Notario
    FROM tbl_ope_expedientes e
    LEFT JOIN tbl_cat_usuarios un ON un.Id = e.Notario_Id
    ORDER BY e.Id
');
foreach ($exps as $e) {
    echo "  Id={$e->Id}  Escritura={$e->Numero_Escritura}  Notaria='{$e->Notaria_Notario}'  Notario='{$e->Notario}'  Fecha={$e->Fecha_Creacion}\n";
}

echo "\nDistribución usuarios por Numero_Notaria:\n";
$resumen = DB::select('SELECT Numero_Notaria, COUNT(*) as cnt FROM tbl_cat_usuarios GROUP BY Numero_Notaria ORDER BY cnt DESC');
foreach ($resumen as $r) {
    echo "  Notaria='{$r->Numero_Notaria}' → {$r->cnt} usuarios\n";
}

use Illuminate\Support\Facades\DB;

$tablas = ['tbl_cat_usuarios', 'tbl_cat_expedientes', 'tbl_cat_clientes', 'tbl_log_sesiones_activas'];

foreach ($tablas as $tabla) {
    try {
        $rows = DB::connection('mysql')->select(
            "SELECT Numero_Notaria, COUNT(*) as total FROM {$tabla} GROUP BY Numero_Notaria ORDER BY Numero_Notaria"
        );
        echo "\n[{$tabla}]\n";
        if (empty($rows)) {
            echo "  (vacía)\n";
        }
        foreach ($rows as $r) {
            echo "  Notaria {$r->Numero_Notaria}: {$r->total} registros\n";
        }
    } catch (\Throwable $e) {
        echo "\n[{$tabla}] ERROR: {$e->getMessage()}\n";
    }
}
