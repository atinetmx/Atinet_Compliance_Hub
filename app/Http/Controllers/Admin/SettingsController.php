<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SettingsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $systemInfo = [
            'laravel_version' => app()->version(),
            'php_version' => PHP_VERSION,
            'app_name' => config('app.name'),
            'app_env' => config('app.env'),
            'database_connection' => config('database.default'),
            'cache_driver' => config('cache.default'),
            'queue_driver' => config('queue.default'),
        ];

        $stats = [
            'total_storage' => $this->formatBytes(disk_total_space(storage_path())),
            'free_storage' => $this->formatBytes(disk_free_space(storage_path())),
            'database_size' => $this->getDatabaseSize(),
            'log_files' => $this->getLogFilesList(),
        ];

        return Inertia::render('Admin/Settings/Index', [
            'systemInfo' => $systemInfo,
            'stats' => $stats,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }

    /**
     * Mostrar logs del sistema
     */
    public function logs(Request $request)
    {
        $logFile = $request->input('file', 'laravel.log');
        $logPath = storage_path("logs/{$logFile}");

        $logs = [];
        if (file_exists($logPath)) {
            $content = file_get_contents($logPath);
            $lines = explode("\n", $content);

            // Tomar las últimas 100 líneas
            $logs = array_slice(array_reverse($lines), 0, 100);
        }

        $availableLogs = $this->getLogFilesList();

        return Inertia::render('Admin/Settings/Logs', [
            'logs' => $logs,
            'currentFile' => $logFile,
            'availableLogs' => $availableLogs,
        ]);
    }

    /**
     * Limpiar cache del sistema
     */
    public function clearCache(Request $request)
    {
        $type = $request->input('type', 'all');

        try {
            switch ($type) {
                case 'config':
                    Artisan::call('config:clear');
                    $message = 'Cache de configuración limpiado exitosamente.';
                    break;

                case 'route':
                    Artisan::call('route:clear');
                    $message = 'Cache de rutas limpiado exitosamente.';
                    break;

                case 'view':
                    Artisan::call('view:clear');
                    $message = 'Cache de vistas limpiado exitosamente.';
                    break;

                case 'all':
                default:
                    Artisan::call('cache:clear');
                    Artisan::call('config:clear');
                    Artisan::call('route:clear');
                    Artisan::call('view:clear');
                    $message = 'Todos los caches limpiados exitosamente.';
                    break;
            }

            return back()->with('success', $message);
        } catch (\Exception $e) {
            return back()->with('error', 'Error al limpiar cache: '.$e->getMessage());
        }
    }

    /**
     * Optimizar la aplicación
     */
    public function optimize()
    {
        try {
            Artisan::call('optimize');
            Artisan::call('config:cache');
            Artisan::call('route:cache');
            Artisan::call('view:cache');

            return back()->with('success', 'Aplicación optimizada exitosamente.');
        } catch (\Exception $e) {
            return back()->with('error', 'Error al optimizar: '.$e->getMessage());
        }
    }

    /**
     * Obtener el tamaño de la base de datos
     */
    private function getDatabaseSize()
    {
        try {
            $database = config('database.connections.mysql.database');
            $result = DB::selectOne('
                SELECT
                    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
                FROM information_schema.tables
                WHERE table_schema = ?
            ', [$database]);

            return $result ? $result->size_mb.' MB' : 'No disponible';
        } catch (\Exception $e) {
            return 'No disponible';
        }
    }

    /**
     * Obtener lista de archivos de log
     */
    private function getLogFilesList()
    {
        $logPath = storage_path('logs');
        $files = [];

        if (is_dir($logPath)) {
            $logFiles = glob($logPath.'/*.log');
            foreach ($logFiles as $file) {
                $fileName = basename($file);
                $files[] = [
                    'name' => $fileName,
                    'size' => $this->formatBytes(filesize($file)),
                    'modified' => date('Y-m-d H:i:s', filemtime($file)),
                ];
            }
        }

        return $files;
    }

    /**
     * Formatear bytes en formato legible
     */
    private function formatBytes($size, $precision = 2)
    {
        if ($size === 0) {
            return '0 B';
        }

        $base = log($size, 1024);
        $suffixes = ['B', 'KB', 'MB', 'GB', 'TB'];

        return round(pow(1024, $base - floor($base)), $precision).' '.$suffixes[floor($base)];
    }
}
