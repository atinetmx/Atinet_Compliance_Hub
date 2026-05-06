<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("CREATE TABLE IF NOT EXISTS `tbl_ope_folios` (
            `Id` bigint NOT NULL AUTO_INCREMENT,
            `Tomo` int DEFAULT NULL,
            `Volumen` int DEFAULT NULL,
            `Folio` int DEFAULT NULL,
            `Expediente_Id` int DEFAULT NULL,
            `Estatus_Id` int DEFAULT NULL,
            `Vigencia_Hasta` datetime DEFAULT NULL,
            `Usuario_Creacion_Id` int DEFAULT NULL,
            `Fecha_Creacion` datetime DEFAULT CURRENT_TIMESTAMP,
            `Usuario_Modificacion_Id` int DEFAULT NULL,
            `Fecha_Modificacion` datetime DEFAULT NULL,
            PRIMARY KEY (`Id`),
            KEY `Expediente_Id` (`Expediente_Id`),
            KEY `Estatus_Id` (`Estatus_Id`),
            KEY `Usuario_Creacion_Id` (`Usuario_Creacion_Id`),
            KEY `Usuario_Modificacion_Id` (`Usuario_Modificacion_Id`),
            CONSTRAINT `tbl_ope_folios_ibfk_1` FOREIGN KEY (`Expediente_Id`) REFERENCES `tbl_ope_expedientes` (`Id`),
            CONSTRAINT `tbl_ope_folios_ibfk_2` FOREIGN KEY (`Estatus_Id`) REFERENCES `tbl_cat_estatus` (`Id`),
            CONSTRAINT `tbl_ope_folios_ibfk_3` FOREIGN KEY (`Usuario_Creacion_Id`) REFERENCES `tbl_cat_usuarios` (`Id`),
            CONSTRAINT `tbl_ope_folios_ibfk_4` FOREIGN KEY (`Usuario_Modificacion_Id`) REFERENCES `tbl_cat_usuarios` (`Id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    }

    public function down(): void
    {
        DB::statement('DROP TABLE IF EXISTS `tbl_ope_folios`');
    }
};
