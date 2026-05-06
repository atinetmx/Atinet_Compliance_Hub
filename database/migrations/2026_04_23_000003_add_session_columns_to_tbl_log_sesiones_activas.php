<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Verifica si una columna existe en la BD activa de la migración,
     * usando information_schema en lugar de Schema::hasColumn() para
     * respetar la conexión actual (funciona tanto en master como en tenants).
     */
    private function columnExists(string $table, string $column): bool
    {
        $dbName = DB::connection($this->getConnection())->getDatabaseName();
        $result = DB::connection($this->getConnection())->select(
            "SELECT COLUMN_NAME FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?",
            [$dbName, $table, $column]
        );

        return !empty($result);
    }

    public function up(): void
    {
        // Agregar columnas solo si no existen (idempotente para master y tenants existentes)
        $columns = [
            'Equipo'                        => "varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL",
            'Refresh_Token'                 => "text COLLATE utf8mb4_unicode_ci DEFAULT NULL",
            'Refresh_Token_Epiration_Time'  => "datetime DEFAULT NULL",
            'Refresh_Token_Expiration_Time' => "datetime DEFAULT NULL",
            'Ip_Address'                    => "varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL",
            'User_Agent'                    => "text COLLATE utf8mb4_unicode_ci DEFAULT NULL",
            'Es_Activa'                     => "tinyint(1) NOT NULL DEFAULT '1'",
            'Fecha_Expiracion'              => "datetime DEFAULT NULL",
            'Refresh_Token_Hash'            => "text COLLATE utf8mb4_unicode_ci DEFAULT NULL",
        ];

        foreach ($columns as $column => $definition) {
            if (!$this->columnExists('tbl_log_sesiones_activas', $column)) {
                DB::connection($this->getConnection())->statement(
                    "ALTER TABLE `tbl_log_sesiones_activas` ADD COLUMN `{$column}` {$definition}"
                );
            }
        }
    }

    public function down(): void
    {
        $columns = [
            'Refresh_Token_Hash',
            'Fecha_Expiracion',
            'Es_Activa',
            'User_Agent',
            'Ip_Address',
            'Refresh_Token_Expiration_Time',
            'Refresh_Token_Epiration_Time',
            'Refresh_Token',
            'Equipo',
        ];

        foreach ($columns as $column) {
            if ($this->columnExists('tbl_log_sesiones_activas', $column)) {
                DB::connection($this->getConnection())->statement(
                    "ALTER TABLE `tbl_log_sesiones_activas` DROP COLUMN `{$column}`"
                );
            }
        }
    }
};
