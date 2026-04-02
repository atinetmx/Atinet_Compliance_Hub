<?php

// Script de debug para verificar la conexión de base de datos al eliminar notarías
// Ejecutar: php debug_notaria_delete.php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Notaria;
use App\Models\User;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

echo "=== DEBUG: Conexión al intentar eliminar notarías ===\n\n";

// 1. Verificar conexión por defecto
echo '1. Conexión por defecto: '.Config::get('database.default')."\n";
echo '   Base de datos MySQL: '.Config::get('database.connections.mysql.database')."\n\n";

// 2. Listar todas las notarías
echo "2. Notarías en la base de datos:\n";
$notarias = Notaria::all();
foreach ($notarias as $notaria) {
    echo "   - ID: {$notaria->id}, Nombre: {$notaria->nombre}, Activa: ".($notaria->activa ? 'Sí' : 'No')."\n";
}
echo "\n";

// 3. Verificar la conexión del modelo Notaria
echo "3. Conexión del modelo Notaria:\n";
$notariaTest = Notaria::first();
if ($notariaTest) {
    echo '   - Conexión usada: '.$notariaTest->getConnectionName()."\n";
    echo '   - Tabla: '.$notariaTest->getTable()."\n";
    echo '   - Database actual: '.DB::connection($notariaTest->getConnectionName())->getDatabaseName()."\n";
}
echo "\n";

// 4. Simular lo que pasa si hay un usuario autenticado de tipo notaria
echo "4. Simulación con usuario tipo 'notaria':\n";
$usuarioNotaria = User::where('tipo_cuenta', 'notaria')->first();
if ($usuarioNotaria) {
    echo "   - Usuario encontrado: {$usuarioNotaria->email}\n";
    echo "   - Notaría ID: {$usuarioNotaria->notaria_id}\n";
    echo '   - Conexión actual de DB: '.DB::connection()->getDatabaseName()."\n";
}
echo "\n";

// 5. Verificar si hay algún observer o evento en el modelo
echo "5. Verificando eventos del modelo Notaria:\n";
$events = Notaria::getObservableEvents();
echo '   - Eventos observables: '.implode(', ', $events)."\n";
echo "\n";

echo "=== FIN DEBUG ===\n";
