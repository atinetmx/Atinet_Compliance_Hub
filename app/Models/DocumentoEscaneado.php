<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class DocumentoEscaneado extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'documentos_escaneados';

    protected $fillable = [
        'user_id',
        'notaria_id',
        'nombre_original',
        'ruta_original',
        'tipo_mime_original',
        'tamano_bytes',
        'tipo_documento',
        'ruta_pdf',
        'ruta_word',
        'ruta_texto',
        'estado',
        'error_mensaje',
        'analizado_ia',
        'datos_extraidos',
        'resumen_ia',
        'metadatos_ia',
        'veces_descargado',
        'ultima_descarga',
    ];

    protected function casts(): array
    {
        return [
            'analizado_ia' => 'boolean',
            'datos_extraidos' => 'array',
            'metadatos_ia' => 'array',
            'veces_descargado' => 'integer',
            'ultima_descarga' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    /**
     * Usuario que subió el documento
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Notaría asociada al documento
     */
    public function notaria(): BelongsTo
    {
        return $this->belongsTo(Notaria::class);
    }

    /**
     * Incrementar contador de descargas
     */
    public function incrementarDescargas(): void
    {
        $this->increment('veces_descargado');
        $this->update(['ultima_descarga' => now()]);
    }

    /**
     * Obtener tamaño formateado
     */
    public function getTamanoFormateadoAttribute(): string
    {
        $bytes = $this->tamano_bytes;

        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 2).' GB';
        } elseif ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2).' MB';
        } elseif ($bytes >= 1024) {
            return number_format($bytes / 1024, 2).' KB';
        }

        return $bytes.' bytes';
    }

    /**
     * Scopes
     */
    public function scopePendientes($query)
    {
        return $query->where('estado', 'pendiente');
    }

    public function scopeProcesando($query)
    {
        return $query->where('estado', 'procesando');
    }

    public function scopeCompletados($query)
    {
        return $query->where('estado', 'completado');
    }

    public function scopeConError($query)
    {
        return $query->where('estado', 'error');
    }

    public function scopeAnalizados($query)
    {
        return $query->where('analizado_ia', true);
    }

    public function scopePorTipo($query, string $tipo)
    {
        return $query->where('tipo_documento', $tipo);
    }
}

