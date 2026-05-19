<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== cn_notaria_id en cada notaria ===\n";
$notarias = DB::table('notarias')->orderBy('id')->get(['id', 'nombre', 'numero_notaria', 'cn_notaria_id', 'tenant_db_name']);
foreach ($notarias as $n) {
    echo "  id={$n->id} cn_notaria_id=".($n->cn_notaria_id ?? 'NULL')." nombre={$n->nombre} → {$n->tenant_db_name}\n";
}

// Conectarse a un tenant conocido y ver los Numero_Notaria
echo "\n=== Numero_Notaria en tenant atinet_edomex_notaria_11 ===\n";
$pdo11 = new PDO('mysql:host=localhost;port=3307;dbname=atinet_edomex_notaria_11;charset=utf8mb4', 'atinet_app', 'Atinet2026#Secure', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$rows = $pdo11->query('SELECT Id, Usuario, Numero_Notaria FROM tbl_cat_usuarios LIMIT 10')->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) {
    echo "  Id={$r['Id']} {$r['Usuario']} Numero_Notaria={$r['Numero_Notaria']}\n";
}

// Notaria 1 tiene cn_notaria_id=2 y id=1. Si C# busca Numero_Notaria = cn_notaria_id, buscaría '2'
// Si C# busca notaria_id=id, buscaría '1'
echo "\n=== Hipótesis: ¿C# usa cn_notaria_id o notarias.id? ===\n";
$notaria1 = DB::table('notarias')->where('id', 1)->first();
echo "Notaria id=1: cn_notaria_id={$notaria1->cn_notaria_id}\n";
$try1 = $pdo11->prepare('SELECT Id, Usuario FROM tbl_cat_usuarios WHERE Numero_Notaria = ?');
$try1->execute([(string) $notaria1->id]);  // = '1'
$r1 = $try1->fetchAll(PDO::FETCH_ASSOC);
echo "WHERE Numero_Notaria = '".$notaria1->id."' (notarias.id): ".count($r1).' filas'.(count($r1) ? ' → '.json_encode(array_column($r1, 'Usuario')) : '')."\n";

$try2 = $pdo11->prepare('SELECT Id, Usuario FROM tbl_cat_usuarios WHERE Numero_Notaria = ?');
$try2->execute([(string) $notaria1->cn_notaria_id]);  // = '2'
$r2 = $try2->fetchAll(PDO::FETCH_ASSOC);
echo "WHERE Numero_Notaria = '".$notaria1->cn_notaria_id."' (cn_notaria_id): ".count($r2).' filas'.(count($r2) ? ' → '.json_encode(array_column($r2, 'Usuario')) : '')."\n";

$try3 = $pdo11->prepare('SELECT Id, Usuario FROM tbl_cat_usuarios WHERE Numero_Notaria = ?');
$try3->execute([$notaria1->numero_notaria]);  // = '11'
$r3 = $try3->fetchAll(PDO::FETCH_ASSOC);
echo "WHERE Numero_Notaria = '".$notaria1->numero_notaria."' (numero_notaria): ".count($r3).' filas'.(count($r3) ? ' → '.json_encode(array_column($r3, 'Usuario')) : '')."\n";
