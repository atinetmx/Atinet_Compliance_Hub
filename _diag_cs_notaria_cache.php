<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

// Listar todas las notarias para saber cuáles "conoce" la API C#
$notarias = DB::table('notarias')->orderBy('id')->get();
echo "Notarias registradas:\n";
foreach ($notarias as $n) {
    echo "  id={$n->id} nombre={$n->nombre} numero_notaria={$n->numero_notaria} tenant_db_name={$n->tenant_db_name}\n";
}

// Intentar login con notarias conocidas usando SUPERUSUARIO (Id=9, pass=1010)
// Nota: SUPERUSUARIO.Numero_Notaria=11 ahora. Para que funcione con otra notaria_id,
// la búsqueda debe ser: Numero_Notaria = notaria_id → no existe en otras DBs.
// ENTONCES: probar si C# siquiera responde a notaria=11 (¿la conoce?)

// Probar también con notaria=1 (existe desde siempre) para confirmar que C# funciona
$existingNotaria = $notarias->firstWhere('id', 1);

echo "\n=== Test: ¿Responde C# a notaria=1? ===\n";
$payload = json_encode(['notaria' => '1', 'usuario' => 'USUARIO_FAKE', 'contrasena' => 'PASS_FAKE', 'equipo' => 'test', 'model' => 'pc']);
$ch = curl_init('http://192.168.1.1:5000/api/Login/Authentication');
curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $payload, CURLOPT_HTTPHEADER => ['Content-Type: application/json'], CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10]);
$r1 = curl_exec($ch);
$c1 = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo "notaria=1: HTTP {$c1} → ".json_decode($r1, true)['message']."\n";

echo "\n=== Test: ¿Responde C# a notaria=11 (nueva)? ===\n";
$payload2 = json_encode(['notaria' => '11', 'usuario' => 'USUARIO_FAKE', 'contrasena' => 'PASS_FAKE', 'equipo' => 'test', 'model' => 'pc']);
$ch2 = curl_init('http://192.168.1.1:5000/api/Login/Authentication');
curl_setopt_array($ch2, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $payload2, CURLOPT_HTTPHEADER => ['Content-Type: application/json'], CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10]);
$r2 = curl_exec($ch2);
$c2 = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
curl_close($ch2);
$b2 = json_decode($r2, true);
echo "notaria=11: HTTP {$c2} → ".($b2['message'] ?? json_encode($b2))."\n";

// La diferencia de mensajes dirá si C# conoce el id=11:
// - "Usuario no encontrado" / "Credenciales inválidas" → SÍ conoce la notaria, pero user/pass falla
// - "Notaria inválido" / "Notaría no encontrada" → NO conoce la notaria (cache de startup)
echo "\n=== Diagnóstico ===\n";
if (isset($b2['message'])) {
    if (str_contains(strtolower($b2['message']), 'notaria') || str_contains(strtolower($b2['message']), 'not found')) {
        echo "⚠ C# NO conoce la notaria id=11 → probablemente cargó el catálogo al arrancar.\n";
        echo "  Solución: reiniciar el servicio C# para que lea la nueva notaria.\n";
    } else {
        echo "✅ C# SÍ conoce la notaria id=11 (mensaje: {$b2['message']})\n";
    }
}
