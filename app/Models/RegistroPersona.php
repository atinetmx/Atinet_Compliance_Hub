<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Modelo para registros de personas en el sistema nuevo
 *
 * Tabla: registro_web (Atinet_Compliance_Hub)
 * Este modelo escribe en la base de datos NUEVA.
 * Para leer datos del sistema legacy, usar LegacyRegistro.
 *
 * @property int $id
 * @property string $nombre
 * @property string $apellidopat
 * @property string $apellidomat
 * @property string $curp
 * @property string $rfc
 * @property string $correo
 * @property string $persona FISICA|MORAL
 * @property \Carbon\Carbon $dia Fecha nacimiento/constitución
 * @property \Carbon\Carbon $dia_registro
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 * @property \Carbon\Carbon|null $deleted_at
 */
class RegistroPersona extends Model
{
    use SoftDeletes;

    /**
     * Conexión a base de datos nueva (default: mysql)
     */
    protected $connection = 'mysql';

    /**
     * Nombre de la tabla en la BD nueva
     */
    protected $table = 'registro_web';

    /**
     * Clave primaria (estándar Laravel)
     */
    protected $primaryKey = 'id';

    /**
     * La tabla usa timestamps de Laravel
     */
    public $timestamps = true;

    /**
     * Campos asignables masivamente
     *
     * NOTA: Se excluyen campos legacy duplicados para evitar confusiones:
     * - nombre_padre (usar padre_nombre)
     * - nombre_madre (usar madre_nombre)
     * - herederosSustitutos (usar herederos_sustitutos)
     * - albaceaSustituto (usar albacea_sustituto)
     * - TutorTutriz (usar tutor_tutriz)
     * - tutorSustituto (usar tutor_sustituto)
     * - escribir (usar sabe_escribir)
     * - leer (usar sabe_leer)
     */
    protected $fillable = [
        // Metadata (4 campos)
        'dia_registro',
        'notaria',
        'envio_de_correo',
        'persona',

        // Datos personales (17 campos)
        'nombre',
        'apellidopat',
        'apellidomat',
        'alias',
        'curp',
        'rfc',
        'dia',
        'genero',
        'paisnac',
        'nacionalidad',
        'estado_nac',
        'ciudad_nac',
        'municipio_nac',
        'ocupacion',
        'edo_civil',
        'conyuge',

        // Datos del cónyuge (6 campos)
        'nombre_conyuge',
        'apellido_paterno_conyuge',
        'apellido_materno_conyuge',
        'doc_identificacion',
        'num_doc_identificacion',
        'autoridad_emisora',

        // Domicilio particular (11 campos)
        'calle',
        'no_exterior',
        'no_interior',
        'manzana',
        'lote',
        'cp',
        'colonia',
        'municipio',
        'estado',
        'ciudad',
        'pais',

        // Domicilio fiscal (11 campos)
        'calle_fiscal',
        'no_exterior_fiscal',
        'no_interior_fiscal',
        'manzana_fiscal',
        'lote_fiscal',
        'cp_fiscal',
        'colonia_fiscal',
        'municipio_fiscal',
        'estado_fiscal',
        'ciudad_fiscal',
        'pais_fiscal',

        // Contacto (6 campos)
        'telefono',
        'telefonos',
        'telefono_oficina',
        'telefono_movil',
        'correo',
        'gmail2',

        // Identificación (4 campos)
        'documento',
        'no_identificacion',
        'vigiencia_de_ine',
        'autoridad_emisora_usuario',

        // Información adicional (4 campos)
        'regimen_fiscal',
        'servicios_medicos',
        'id_y_cartainmigracion',
        'observaciones_adicionales',

        // Datos del testador - SOLO campos NUEVOS (snake_case)
        'sabe_escribir',      // Se sincroniza automáticamente con 'escribir'
        'sabe_leer',          // Se sincroniza automáticamente con 'leer'
        'padre_nombre',       // Se sincroniza automáticamente con 'nombre_padre'
        'padre_vive',
        'madre_nombre',       // Se sincroniza automáticamente con 'nombre_madre'
        'madre_vive',
        'hijos',
        'herederos',
        'herederos_sustitutos', // Se sincroniza automáticamente con 'herederosSustitutos'
        'albacea',
        'albacea_sustituto',  // Se sincroniza automáticamente con 'albaceaSustituto'
        'tutor_tutriz',       // Se sincroniza automáticamente con 'TutorTutriz'
        'tutor_sustituto',    // Se sincroniza automáticamente con 'tutorSustituto'
        'observaciones',
    ];

    /**
     * Casting de tipos
     */
    protected $casts = [
        'idregistro' => 'integer',
        'dia' => 'date',
        'dia_registro' => 'date',
        'vigiencia_de_ine' => 'date',
        'envio_de_correo' => 'boolean',
        'cp' => 'integer',
        'cp_fiscal' => 'integer',
        'num_doc_identificacion' => 'integer',
    ];

    /**
     * Valores por defecto
     */
    protected $attributes = [
        'Persona' => 'FISICA',
        'paisnac' => 'MEXICO',
        'nacionalidad' => 'MEXICANA',
        'pais' => 'MEXICO',
        'pais_fiscal' => 'MEXICO',
        'envio_de_correo' => 0,
        'sabe_escribir' => '',
        'sabe_leer' => '',
        'escribir' => '',
        'leer' => '',
    ];

    /**
     * Boot del modelo: sincronizar campos duplicados legacy
     *
     * Este método sincroniza automáticamente los campos nuevos (snake_case)
     * con sus contrapartes legacy (camelCase) para mantener compatibilidad
     * con el sistema PHP.
     */
    protected static function boot()
    {
        parent::boot();

        // BEFORE SAVE: sincronizar campos legacy automáticamente
        static::saving(function ($model) {
            // 1. Sincronizar sabe_escribir -> escribir
            if ($model->isDirty('sabe_escribir')) {
                $model->setAttribute('escribir', $model->sabe_escribir ?? '');
            }

            // 2. Sincronizar sabe_leer -> leer
            if ($model->isDirty('sabe_leer')) {
                $model->setAttribute('leer', $model->sabe_leer ?? '');
            }

            // 3. Sincronizar padre_nombre -> nombre_padre (legacy)
            if ($model->isDirty('padre_nombre')) {
                $model->setAttribute('nombre_padre', $model->padre_nombre ?? '');
            }

            // 4. Sincronizar madre_nombre -> nombre_madre (legacy)
            if ($model->isDirty('madre_nombre')) {
                $model->setAttribute('nombre_madre', $model->madre_nombre ?? '');
            }

            // 5. Sincronizar herederos_sustitutos -> herederosSustitutos (truncar a 200 chars)
            if ($model->isDirty('herederos_sustitutos')) {
                $value = $model->herederos_sustitutos ?? '';
                $model->setAttribute('herederosSustitutos', substr($value, 0, 200));
            }

            // 6. Sincronizar albacea_sustituto -> albaceaSustituto (truncar a 45 chars)
            if ($model->isDirty('albacea_sustituto')) {
                $value = $model->albacea_sustituto ?? '';
                $model->setAttribute('albaceaSustituto', substr($value, 0, 45));
            }

            // 7. Sincronizar tutor_tutriz -> TutorTutriz (truncar a 45 chars)
            if ($model->isDirty('tutor_tutriz')) {
                $value = $model->tutor_tutriz ?? '';
                $model->setAttribute('TutorTutriz', substr($value, 0, 45));
            }

            // 8. Sincronizar tutor_sustituto -> tutorSustituto (truncar a 45 chars)
            if ($model->isDirty('tutor_sustituto')) {
                $value = $model->tutor_sustituto ?? '';
                $model->setAttribute('tutorSustituto', substr($value, 0, 45));
            }
        });
    }

    /**
     * Accessor: Nombre completo de la persona
     */
    public function getNombreCompletoAttribute(): string
    {
        if ($this->Persona === 'MORAL') {
            return $this->nombre; // Razón social
        }

        return trim("{$this->nombre} {$this->apellidopat} {$this->apellidomat}");
    }

    /**
     * Accessor: Domicilio particular formateado
     */
    public function getDomicilioParticularAttribute(): string
    {
        $partes = array_filter([
            $this->calle,
            $this->no_exterior ? "Ext. {$this->no_exterior}" : null,
            $this->no_interior ? "Int. {$this->no_interior}" : null,
            $this->colonia,
            $this->ciudad,
            $this->estado,
            $this->cp ? "C.P. {$this->cp}" : null,
            $this->pais,
        ]);

        return implode(', ', $partes);
    }

    /**
     * Accessor: Domicilio fiscal formateado
     */
    public function getDomicilioFiscalAttribute(): string
    {
        $partes = array_filter([
            $this->calle_fiscal,
            $this->no_exterior_fiscal ? "Ext. {$this->no_exterior_fiscal}" : null,
            $this->no_interior_fiscal ? "Int. {$this->no_interior_fiscal}" : null,
            $this->colonia_fiscal,
            $this->ciudad_fiscal,
            $this->estado_fiscal,
            $this->cp_fiscal ? "C.P. {$this->cp_fiscal}" : null,
            $this->pais_fiscal,
        ]);

        return implode(', ', $partes);
    }

    /**
     * Accessor: ¿Tiene cónyuge registrado?
     */
    public function getTieneConyugeAttribute(): bool
    {
        return ! empty($this->nombre_conyuge);
    }

    /**
     * Accessor: ¿Es persona física?
     */
    public function getEsFisicaAttribute(): bool
    {
        return strtoupper($this->Persona) === 'FISICA';
    }

    /**
     * Accessor: ¿Es persona moral?
     */
    public function getEsMoralAttribute(): bool
    {
        return strtoupper($this->Persona) === 'MORAL';
    }

    /**
     * Scope: Solo personas físicas
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeFisica($query)
    {
        return $query->where('Persona', 'FISICA');
    }

    /**
     * Scope: Solo personas morales
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeMoral($query)
    {
        return $query->where('Persona', 'MORAL');
    }

    /**
     * Scope: Buscar por CURP
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByCurp($query, string $curp)
    {
        return $query->where('curp', strtoupper(trim($curp)));
    }

    /**
     * Scope: Buscar por RFC
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByRfc($query, string $rfc)
    {
        return $query->where('rfc', strtoupper(trim($rfc)));
    }

    /**
     * Scope: Buscar por nombre (búsqueda parcial)
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByNombre($query, string $nombre)
    {
        $nombre = strtoupper(trim($nombre));

        return $query->where(function ($q) use ($nombre) {
            $q->where('nombre', 'LIKE', "%{$nombre}%")
                ->orWhere('apellidopat', 'LIKE', "%{$nombre}%")
                ->orWhere('apellidomat', 'LIKE', "%{$nombre}%");
        });
    }

    /**
     * Scope: Registros de una notaría específica
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByNotaria($query, string $notaria)
    {
        return $query->where('notaria', strtoupper(trim($notaria)));
    }

    /**
     * Scope: Registros recientes (últimos N días)
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeRecientes($query, int $dias = 30)
    {
        return $query->where('dia_registro', '>=', now()->subDays($dias)->toDateString());
    }
}
