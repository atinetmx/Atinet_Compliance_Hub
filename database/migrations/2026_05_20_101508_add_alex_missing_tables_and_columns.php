<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // =====================================================================
        // 1. COLUMNAS FALTANTES EN TABLAS EXISTENTES
        // =====================================================================

        Schema::table('clientes', function (Blueprint $table) {
            if (! Schema::hasColumn('clientes', 'nacionalidad_nombre')) {
                $table->string('nacionalidad_nombre', 100)->nullable();
            }
            if (! Schema::hasColumn('clientes', 'pais_nacimiento_nombre')) {
                $table->string('pais_nacimiento_nombre', 100)->nullable();
            }
        });

        Schema::table('tbl_rel_expediente_clientes', function (Blueprint $table) {
            if (! Schema::hasColumn('tbl_rel_expediente_clientes', 'Busqueda_Listas')) {
                $table->tinyInteger('Busqueda_Listas')->default(0);
            }
        });

        // Forma_Pago_Id — int signed, FK se agrega dinámicamente al final
        if (! Schema::hasColumn('tbl_ope_recibos_provisionales', 'Forma_Pago_Id')) {
            DB::statement('ALTER TABLE `tbl_ope_recibos_provisionales` ADD COLUMN `Forma_Pago_Id` int DEFAULT NULL');
        }

        // =====================================================================
        // 2. TABLAS NUEVAS — SQL exacto del backup para respetar tipos y FKs
        // =====================================================================

        if (! Schema::hasTable('tbl_cat_forma_pago')) {
            DB::statement("CREATE TABLE `tbl_cat_forma_pago` (
              `Id` int NOT NULL AUTO_INCREMENT,
              `Nombre` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
              `Descripcion` varchar(250) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
              `Activo` tinyint(1) DEFAULT '1',
              `Fecha_Creacion` datetime DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (`Id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        }

        if (! Schema::hasTable('tbl_cat_formatos')) {
            DB::statement("CREATE TABLE `tbl_cat_formatos` (
              `Id` int NOT NULL AUTO_INCREMENT,
              `Nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
              `Tipo_Formato` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
              `Programa` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
              `Archivo_Extension` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
              `Ruta_S3` text COLLATE utf8mb4_unicode_ci,
              `Activo` tinyint(1) DEFAULT '1',
              `Fecha_Creacion` datetime DEFAULT CURRENT_TIMESTAMP,
              `Fecha_Modificacion` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              PRIMARY KEY (`Id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        }

        if (! Schema::hasTable('tbl_cat_html_templates')) {
            DB::statement('CREATE TABLE `tbl_cat_html_templates` (
              `Id` int NOT NULL AUTO_INCREMENT,
              `Nombre` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
              `Descripcion` text COLLATE utf8mb4_unicode_ci,
              `Contenido_HTML` longtext COLLATE utf8mb4_unicode_ci,
              `Fecha_Creacion` datetime DEFAULT CURRENT_TIMESTAMP,
              `Fecha_Actualizacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              PRIMARY KEY (`Id`),
              UNIQUE KEY `Nombre` (`Nombre`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
        }

        if (! Schema::hasTable('tbl_cat_marcadores')) {
            DB::statement("CREATE TABLE `tbl_cat_marcadores` (
              `Id` int NOT NULL AUTO_INCREMENT,
              `Tipo` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
              `Marcador` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
              `Descripcion` text COLLATE utf8mb4_unicode_ci,
              `Ejemplo` text COLLATE utf8mb4_unicode_ci,
              `Activo` tinyint(1) DEFAULT '1',
              `Fecha_Creacion` datetime DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (`Id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        }

        if (! Schema::hasTable('tbl_rel_formatos_marcadores')) {
            DB::statement('CREATE TABLE `tbl_rel_formatos_marcadores` (
              `Id` int NOT NULL AUTO_INCREMENT,
              `Formato_Id` int DEFAULT NULL,
              `Marcador_Id` int DEFAULT NULL,
              `Tipo_Compareciente` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
              `Indice` int DEFAULT NULL,
              `Marcador_Generado` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
              `Fila` int DEFAULT NULL,
              `Columna` int DEFAULT NULL,
              PRIMARY KEY (`Id`),
              KEY `Formato_Id` (`Formato_Id`),
              KEY `Marcador_Id` (`Marcador_Id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
        }

        if (! Schema::hasTable('tbl_rel_formatos_tipos_comparecientes')) {
            DB::statement('CREATE TABLE `tbl_rel_formatos_tipos_comparecientes` (
              `Id` int NOT NULL AUTO_INCREMENT,
              `Formato_Id` int DEFAULT NULL,
              `Orden` int DEFAULT NULL,
              `Tipo` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
              PRIMARY KEY (`Id`),
              KEY `Formato_Id` (`Formato_Id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
        }

        if (! Schema::hasTable('tbl_ope_declaranot_enajenacion')) {
            DB::statement("CREATE TABLE `tbl_ope_declaranot_enajenacion` (
              `Id` bigint NOT NULL AUTO_INCREMENT,
              `Expediente_Id` int DEFAULT NULL,
              `Obtuvo_Ingresos_Exentos` tinyint(1) DEFAULT '0',
              `Monto_Operacion` decimal(18,2) DEFAULT NULL,
              `Impuesto_Retenido` decimal(18,2) DEFAULT NULL,
              `En_Copropiedad_O_Sociedad_Conyugal` tinyint(1) DEFAULT '0',
              `Usuario_Creacion_Id` int DEFAULT NULL,
              `Fecha_Creacion` datetime DEFAULT CURRENT_TIMESTAMP,
              `Activo` tinyint(1) DEFAULT '1',
              PRIMARY KEY (`Id`),
              KEY `Expediente_Id` (`Expediente_Id`),
              KEY `Usuario_Creacion_Id` (`Usuario_Creacion_Id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        }

        if (! Schema::hasTable('tbl_ope_orden_caja')) {
            DB::statement("CREATE TABLE `tbl_ope_orden_caja` (
              `Id` bigint NOT NULL AUTO_INCREMENT,
              `Folio` int DEFAULT NULL,
              `Expediente_Id` int DEFAULT NULL,
              `Operacion_Principal_Id` int DEFAULT NULL,
              `Cliente_Id` int DEFAULT NULL,
              `Forma_Pago_Id` int DEFAULT NULL,
              `Total_Orden` decimal(18,2) DEFAULT '0.00',
              `Estatus_Id` int DEFAULT NULL,
              `Activo` tinyint(1) DEFAULT '1',
              `Usuario_Creacion_Id` int DEFAULT NULL,
              `Fecha_Creacion` datetime DEFAULT CURRENT_TIMESTAMP,
              `Usuario_Modificacion_Id` int DEFAULT NULL,
              `Fecha_Modificacion` datetime DEFAULT NULL,
              PRIMARY KEY (`Id`),
              KEY `Expediente_Id` (`Expediente_Id`),
              KEY `Cliente_Id` (`Cliente_Id`),
              KEY `Forma_Pago_Id` (`Forma_Pago_Id`),
              KEY `Estatus_Id` (`Estatus_Id`),
              KEY `Usuario_Creacion_Id` (`Usuario_Creacion_Id`),
              KEY `Usuario_Modificacion_Id` (`Usuario_Modificacion_Id`),
              KEY `idx_operacion_principal` (`Operacion_Principal_Id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        }

        if (! Schema::hasTable('tbl_rel_ordenes_caja_detalle')) {
            DB::statement('CREATE TABLE `tbl_rel_ordenes_caja_detalle` (
              `Id` bigint NOT NULL AUTO_INCREMENT,
              `Orden_Caja_Id` bigint NOT NULL,
              `Tipo_Orden` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
              `Tramite_Id` int DEFAULT NULL,
              `Concepto` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
              `Importe` decimal(18,2) NOT NULL,
              `Usuario_Creacion_Id` int NOT NULL,
              `Fecha_Creacion` datetime DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (`Id`),
              KEY `Orden_Caja_Id` (`Orden_Caja_Id`),
              KEY `Tramite_Id` (`Tramite_Id`),
              KEY `Usuario_Creacion_Id` (`Usuario_Creacion_Id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
        }

        if (! Schema::hasTable('tbl_system_info')) {
            DB::statement('CREATE TABLE `tbl_system_info` (
              `Id` int NOT NULL AUTO_INCREMENT,
              `Version` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
              `Environment` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
              `BuildNumber` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
              `CommitHash` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
              `Fecha_Creacion` datetime DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (`Id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
        }

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_rel_ordenes_caja_detalle');
        Schema::dropIfExists('tbl_ope_orden_caja');
        Schema::dropIfExists('tbl_ope_declaranot_enajenacion');
        Schema::dropIfExists('tbl_rel_formatos_marcadores');
        Schema::dropIfExists('tbl_rel_formatos_tipos_comparecientes');
        Schema::dropIfExists('tbl_cat_formatos');
        Schema::dropIfExists('tbl_cat_html_templates');
        Schema::dropIfExists('tbl_cat_marcadores');
        Schema::dropIfExists('tbl_system_info');

        Schema::table('tbl_ope_recibos_provisionales', function (Blueprint $table) {
            $table->dropForeign('tbl_ope_recibos_provisionales_ibfk_7');
            $table->dropColumn('Forma_Pago_Id');
        });

        Schema::dropIfExists('tbl_cat_forma_pago');

        Schema::table('tbl_rel_expediente_clientes', function (Blueprint $table) {
            $table->dropColumn('Busqueda_Listas');
        });

        Schema::table('clientes', function (Blueprint $table) {
            $table->dropColumn(['nacionalidad_nombre', 'pais_nacimiento_nombre']);
        });
    }
};
