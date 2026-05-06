<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("CREATE TABLE IF NOT EXISTS `tbl_rel_expediente_pld` (
            `Id` int NOT NULL AUTO_INCREMENT,
            `Expediente_Id` int DEFAULT NULL,
            `PLD_Id` int DEFAULT NULL,
            `Usuario_Id` int DEFAULT NULL,
            `Realizado` tinyint(1) DEFAULT '0',
            `Estatus_Id` int DEFAULT NULL,
            `Observaciones` text COLLATE utf8mb4_unicode_ci,
            `Fecha_Realizado` datetime DEFAULT NULL,
            `Fecha_Creacion` datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`Id`),
            KEY `Expediente_Id` (`Expediente_Id`),
            KEY `PLD_Id` (`PLD_Id`),
            KEY `Usuario_Id` (`Usuario_Id`),
            KEY `Estatus_Id` (`Estatus_Id`),
            CONSTRAINT `tbl_rel_expediente_pld_ibfk_1` FOREIGN KEY (`Expediente_Id`) REFERENCES `tbl_ope_expedientes` (`Id`),
            CONSTRAINT `tbl_rel_expediente_pld_ibfk_2` FOREIGN KEY (`PLD_Id`) REFERENCES `tbl_cat_prevencion_lavado_dinero` (`Id`),
            CONSTRAINT `tbl_rel_expediente_pld_ibfk_3` FOREIGN KEY (`Usuario_Id`) REFERENCES `tbl_cat_usuarios` (`Id`),
            CONSTRAINT `tbl_rel_expediente_pld_ibfk_4` FOREIGN KEY (`Estatus_Id`) REFERENCES `tbl_cat_estatus` (`Id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    }

    public function down(): void
    {
        DB::statement('DROP TABLE IF EXISTS `tbl_rel_expediente_pld`');
    }
};
