<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('notarias', function (Blueprint $table) {
            $table->unsignedInteger('cn_notaria_id')->nullable()->after('tenant_db_name')
                ->comment('ID interno de tbl_cfg_notaria en el sistema Control Notarial (C#)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notarias', function (Blueprint $table) {
            $table->dropColumn('cn_notaria_id');
        });
    }
};
