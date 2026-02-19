<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\OfacNombres;
use App\Models\Sat69B;

/**
 * Command para probar las conexiones a las bases de datos OFAC y SAT
 *
 * Este comando verifica que las conexiones estén configuradas correctamente
 * y que podamos acceder a las tablas necesarias para las búsquedas de listas negras.
 */
class TestDatabaseConnections extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:test-connections {--detailed : Mostrar información detallada de las conexiones}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Probar conexiones a las bases de datos OFAC y SAT para listas negras';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->comment('🔍 Probando conexiones a bases de datos de Listas Negras...');
        $this->newLine();

        $allConnected = true;

        // Test conexión principal
        $allConnected = $this->testConnection('mysql', 'Base de datos principal (Atinet Compliance Hub)') && $allConnected;

        // Test conexión OFAC
        $allConnected = $this->testConnection('ofac', 'Base de datos OFAC (Office of Foreign Assets Control)') && $allConnected;

        // Test conexión SAT
        $allConnected = $this->testConnection('sat', 'Base de datos SAT (Servicio de Administración Tributaria)') && $allConnected;

        $this->newLine();

        if ($allConnected) {
            $this->info('✅ Todas las conexiones funcionan correctamente');

            // Test de modelos si está habilitado el modo detailed
            if ($this->option('detailed')) {
                $this->testModels();
            }

            return Command::SUCCESS;
        } else {
            $this->error('❌ Algunas conexiones fallaron. Revisa la configuración del .env');
            return Command::FAILURE;
        }
    }

    /**
     * Probar una conexión específica de base de datos
     */
    private function testConnection(string $connection, string $description): bool
    {
        try {
            $this->comment("Probando: {$description}");

            // Obtener información de la conexión
            $config = config("database.connections.{$connection}");
            $dbName = $config['database'] ?? 'N/A';

            $this->line("  📝 Base de datos: {$dbName}");
            $this->line("  🖥️  Host: {$config['host']}:{$config['port']}");

            // Intentar conectar
            DB::connection($connection)->getPdo();
            $this->line("  ✅ Conexión exitosa");

            // Obtener información adicional si es modo detailed
            if ($this->option('detailed')) {
                $version = DB::connection($connection)->selectOne('SELECT VERSION() as version');
                $this->line("  🔢 Versión MySQL: {$version->version}");

                // Contar tablas
                $tables = DB::connection($connection)
                    ->select("SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ?", [$dbName]);
                $this->line("  📊 Tablas encontradas: {$tables[0]->count}");
            }

            $this->newLine();
            return true;

        } catch (\Exception $e) {
            $this->line("  ❌ Error de conexión: " . $e->getMessage());
            $this->newLine();
            return false;
        }
    }

    /**
     * Probar que los modelos funcionen correctamente
     */
    private function testModels(): void
    {
        $this->comment('🧪 Probando modelos de Listas Negras...');
        $this->newLine();

        // Test modelo OFAC
        try {
            $this->comment('Probando modelo OfacNombres:');

            // Contar registros OFAC
            $ofacCount = OfacNombres::count();
            $this->line("  📊 Registros en tabla OFAC: {$ofacCount}");

            // Test de búsqueda básica si hay registros
            if ($ofacCount > 0) {
                $sample = OfacNombres::first();
                $sampleName = $sample->name ?? 'Sin campo name';
                $this->line("  📝 Muestra: {$sampleName}");
                $this->line("  🔍 Test de búsqueda disponible");
            }

            $this->line("  ✅ Modelo OFAC funcional");
            $this->newLine();

        } catch (\Exception $e) {
            $this->line("  ❌ Error en modelo OFAC: " . $e->getMessage());
            $this->newLine();
        }

        // Test modelo SAT
        try {
            $this->comment('Probando modelo Sat69B:');

            // Contar registros SAT
            $satCount = Sat69B::count();
            $this->line("  📊 Registros en tabla SAT: {$satCount}");

            // Test de búsqueda básica si hay registros
            if ($satCount > 0) {
                $sample = Sat69B::first();
                $sampleRfc = $sample->rfc ?? 'Sin campo RFC';
                $this->line("  📝 Muestra RFC: {$sampleRfc}");
                $this->line("  🔍 Test de validación RFC disponible");
            }

            $this->line("  ✅ Modelo SAT funcional");
            $this->newLine();

        } catch (\Exception $e) {
            $this->line("  ❌ Error en modelo SAT: " . $e->getMessage());
            $this->newLine();
        }

        $this->info('🎯 Tests de modelos completados');
    }
}
