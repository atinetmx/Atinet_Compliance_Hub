<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

// ============================================================
// 1. Descifrar cn_password real de users.id=1 y users.id=11
// ============================================================
echo "=== cn_password descifrado ===\n";
$laravelUsers = DB::select("SELECT id, email, cn_usuario_id, cn_password FROM users WHERE id IN (1, 11)");
$cnPasswords = [];
foreach ($laravelUsers as $u) {
    try {
        $plain = decrypt($u->cn_password);
        $cnPasswords[$u->cn_usuario_id] = $plain;
        echo "  users.id={$u->id} ({$u->email}) → cn_password desencriptado = '{$plain}'\n";
    } catch (\Exception $e) {
        echo "  users.id={$u->id} ({$u->email}) → ERROR decrypt: {$e->getMessage()}\n";
    }
}

// ============================================================
// 2. Fix Numero_Notaria NULL para ambos usuarios CN
// ============================================================
echo "\n=== Fix Numero_Notaria NULL ===\n";
DB::statement("UPDATE tbl_cat_usuarios SET Numero_Notaria = '2' WHERE Id IN (1, 9)");
echo "  ADMIN (1) y ADMIN1 (9) → Numero_Notaria = '2'\n";

// ============================================================
// 3. Verificar estado post-fix
// ============================================================
foreach ([1, 9] as $cnId) {
    $r = DB::selectOne("SELECT Id, Usuario, Correo, Numero_Notaria, Tipo, Sesion_Iniciada FROM tbl_cat_usuarios WHERE Id = {$cnId}");
    echo "\n  CN id={$cnId}: " . json_encode((array)$r) . "\n";
}

// ============================================================
// 4. Probar login con contraseñas REALES descifradas
// ============================================================
echo "\n=== Test login con contraseñas reales ===\n";

$testCases = [
    ['cnId' => 1,  'usuario' => 'ADMIN',  'label' => 'ADMIN (cn_id=1)'],
    ['cnId' => 9,  'usuario' => 'ADMIN1', 'label' => 'ADMIN1 (cn_id=9)'],
];

foreach ($testCases as $tc) {
    $plainPwd = $cnPasswords[$tc['cnId']] ?? 'DESCONOCIDA';

    DB::table('tbl_cat_usuarios')->where('Id', $tc['cnId'])->update(['Sesion_Iniciada' => 0]);
    DB::table('tbl_log_sesiones_activas')->truncate();

    $payload = json_encode([
        'usuario'        => $tc['usuario'],
        'contrasena'     => $plainPwd,
        'nombre_Notaria' => 'NOTARIA',
        'equipo'         => 'Laravel-Server',
    ]);

    $ch = curl_init('http://192.168.1.1:5000/api/Login/Authentication');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json', 'Accept: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);
    $body   = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $decoded = json_decode($body, true);
    $result  = isset($decoded['token']) ? 'TOKEN OK: '.substr($decoded['token'], 0, 60).'...' : "Response: {$body}";
    echo "\n  {$tc['label']} (pwd='{$plainPwd}') → HTTP {$status}\n    {$result}\n";
}
echo "\nDone.\n";
// ============================================================

// ============================================================
// Diagnostico + fix ADMIN (CN id=1) y ADMIN1 (CN id=9)
// ============================================================

// Resetear sesiones de ambos
DB::table('tbl_cat_usuarios')->whereIn('Id', [1, 9])->update(['Sesion_Iniciada' => 0]);
DB::table('tbl_log_sesiones_activas')->truncate();
echo "Sesiones reseteadas\n";

// Estado actual ambos
foreach ([1, 9] as $cnId) {
    $r = DB::selectOne("SELECT * FROM tbl_cat_usuarios WHERE Id = {$cnId}");
    echo "\n=== CN id={$cnId} ===\n";
    foreach ((array)$r as $k => $v) {
        $null = is_null($v) ? ' *** NULL ***' : '';
        $display = in_array($k, ['Contrasena']) ? substr((string)$v, 0, 20).'...' : $v;
        echo "  {$k} = " . json_encode($display) . $null . "\n";
    }
}

// Fix ADMIN1 (id=9): Numero_Notaria vacío y llenar NULLs
DB::table('tbl_cat_usuarios')->where('Id', 9)->update([
    'Numero_Notaria' => DB::raw("CASE WHEN NULLIF(Numero_Notaria,'') IS NULL THEN '2' ELSE Numero_Notaria END"),
    'Tipo'           => DB::raw("IFNULL(NULLIF(Tipo,''), 'ADMINISTRADOR')"),
    'Adscripcion'    => DB::raw("IFNULL(Adscripcion, '.')"),
    'Procedencia'    => DB::raw("IFNULL(Procedencia, '.')"),
    'Observaciones'  => DB::raw("IFNULL(Observaciones, '.')"),
    'CURP'           => DB::raw("IFNULL(NULLIF(CURP,''), 'N/A')"),
    'RFC'            => DB::raw("IFNULL(NULLIF(RFC,''), 'N/A')"),
    'Iniciales'      => DB::raw("IFNULL(NULLIF(Iniciales,''), 'ADMN')"),
    'Nombre'         => DB::raw("IFNULL(NULLIF(Nombre,''), 'ADMINISTRADOR ADMIN')"),
    'Apellido_Paterno' => DB::raw("IFNULL(Apellido_Paterno, 'NAS')"),
    'Apellido_Materno' => DB::raw("IFNULL(Apellido_Materno, 'NAS')"),
]);
echo "\nFix ADMIN1 (id=9) aplicado\n";

// Verificar modulos para id=9
$mods9 = DB::select("SELECT * FROM tbl_rel_usuarios_modulos WHERE Usuario_Id = 9");
echo "tbl_rel_usuarios_modulos para id=9: " . count($mods9) . " filas\n";
if (count($mods9) === 0) {
    DB::table('tbl_rel_usuarios_modulos')->insert(['Usuario_Id' => 9, 'Modulo_Id' => 1]);
    echo "-> Módulo 1 asignado a ADMIN1\n";
}

// Probar login ADMIN con equipo (exactamente como el servicio PHP)
$testCases = [
    ['usuario' => 'ADMIN',  'contrasena' => 'admin', 'label' => 'ADMIN/admin'],
    ['usuario' => 'ADMIN1', 'contrasena' => 'admin', 'label' => 'ADMIN1/admin'],
];

foreach ($testCases as $tc) {
    DB::table('tbl_cat_usuarios')
        ->where('Usuario', $tc['usuario'])
        ->update(['Sesion_Iniciada' => 0]);
    DB::table('tbl_log_sesiones_activas')->truncate();

    $payload = json_encode([
        'usuario'         => $tc['usuario'],
        'contrasena'      => $tc['contrasena'],
        'nombre_Notaria'  => 'NOTARIA',
        'equipo'          => 'Laravel-Server',
    ]);

    $ch = curl_init('http://192.168.1.1:5000/api/Login/Authentication');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json', 'Accept: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);
    $body   = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    echo "\n--- {$tc['label']} --- HTTP {$status}\n";
    $decoded = json_decode($body, true);
    if (isset($decoded['token'])) {
        echo "  TOKEN OK: " . substr($decoded['token'], 0, 60) . "...\n";
    } else {
        echo "  Response: {$body}\n";
    }
}
echo "\nDone.\n";

// Check tbl_cat_roles for Rol_Id = 1
echo "\n=== tbl_cat_roles (Id=1) ===\n";
try {
    $role = DB::selectOne("SELECT * FROM tbl_cat_roles WHERE Id = 1");
    if ($role) {
        foreach ((array)$role as $k => $v) {
            $null = is_null($v) ? ' *** NULL ***' : '';
            echo "  {$k} = " . json_encode($v) . $null . "\n";
        }
    } else {
        echo "  NO ROW FOUND for Id=1!\n";
    }
} catch (\Exception $e) {
    echo "  ERROR: " . $e->getMessage() . "\n";
}

// Check tbl_rel_usuarios_modulos for Usuario_Id=1
echo "\n=== tbl_rel_usuarios_modulos (Usuario_Id=1) ===\n";
try {
    $mods = DB::select("SELECT * FROM tbl_rel_usuarios_modulos WHERE Usuario_Id = 1");
    if (count($mods) === 0) {
        echo "  NO ROWS  user has no modules assigned\n";
    }
    foreach ($mods as $m) {
        foreach ((array)$m as $k => $v) {
            $null = is_null($v) ? ' *** NULL ***' : '';
            echo "  {$k} = " . json_encode($v) . $null . "\n";
        }
        echo "  ---\n";
    }
} catch (\Exception $e) {
    echo "  ERROR: " . $e->getMessage() . "\n";
}

// DESCRIBE tbl_cat_roles
echo "\n=== DESCRIBE tbl_cat_roles ===\n";
try {
    $cols = DB::select("DESCRIBE tbl_cat_roles");
    foreach ($cols as $c) {
        echo "  {$c->Field} | {$c->Type} | Null:{$c->Null} | Default:" . json_encode($c->Default) . "\n";
    }
} catch (\Exception $e) {
    echo "  " . $e->getMessage() . "\n";
}

// DESCRIBE tbl_rel_usuarios_modulos
echo "\n=== DESCRIBE tbl_rel_usuarios_modulos ===\n";
try {
    $cols = DB::select("DESCRIBE tbl_rel_usuarios_modulos");
    foreach ($cols as $c) {
        echo "  {$c->Field} | {$c->Type} | Null:{$c->Null} | Default:" . json_encode($c->Default) . "\n";
    }
} catch (\Exception $e) {
    echo "  " . $e->getMessage() . "\n";
}

// List all tbl_ tables
echo "\n=== RELATED TABLES (tbl_) ===\n";
$tables = DB::select("SHOW TABLES LIKE 'tbl_%'");
foreach ($tables as $t) {
    $name = array_values((array)$t)[0];
    echo "  {$name}\n";
}

// Test login
echo "\n=== TEST LOGIN ADMIN/admin ===\n";
$ch = curl_init('http://192.168.1.1:5000/api/Login/Authentication');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['usuario' => 'ADMIN', 'contrasena' => 'admin']));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Accept: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
$body = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo "HTTP: {$status}\n";
echo "Response: {$body}\n";
