<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Modelo READ-ONLY para leer registros del sistema legacy
 *
 * Tabla: atinet65_aplicativos.registro (READ ONLY)
 * Este modelo SOLO puede leer datos del sistema PHP legacy.
 * NO permite crear, actualizar o eliminar registros.
 * Para crear nuevos registros, usar RegistroPersona.
 *
 * @property int $idregistro
 * @property string $nombre
 * @property string $apellidopat
 * @property string $apellidomat
 * @property string $curp
 * @property string $rfc
 * @property string $correo
 * @property string $Persona FISICA|MORAL
 * @property \Carbon\Carbon $dia Fecha nacimiento/constitución
 * @property \Carbon\Carbon $dia_registro
 */
class LegacyRegistro extends Model
{
    /**
     * Conexión a base de datos legacy (READ ONLY)
     */
    protected $connection = 'aplicativos';

    /**
     * Nombre de la tabla legacy
     */
    protected $table = 'registro';

    /**
     * Clave primaria
     */
    protected $primaryKey = 'idregistro';

    /**
     * La tabla NO tiene timestamps
     */
    public $timestamps = false;

    /**
     * Prevenir asignación masiva (READ ONLY)
     */
    protected $guarded = ['*'];

    /**
     * Conversión de tipos
     */
    protected $casts = [
        'dia' => 'date',
        'dia_registro' => 'date',
        'vigiencia_de_ine' => 'date',
        'envio_de_correo' => 'boolean',
        'cp' => 'integer',
        'cp_fiscal' => 'integer',
        'num_doc_identificacion' => 'integer',
    ];

    /**
     * Accessor: Nombre completo
     */
    public function getNombreCompletoAttribute(): string
    {
        return trim("{$this->nombre} {$this->apellidopat} {$this->apellidomat}");
    }

    /**
     * Accessor: Domicilio completo particular
     */
    public function getDomicilioParticularAttribute(): string
    {
        $parts = array_filter([
            $this->calle,
            "No. Ext. {$this->no_exterior}",
            $this->no_interior ? "No. Int. {$this->no_interior}" : null,
            $this->colonia,
            "CP {$this->cp}",
            $this->municipio,
            $this->estado,
            $this->pais,
        ]);

        return implode(', ', $parts);
    }

    /**
     * Accessor: Domicilio completo fiscal
     */
    public function getDomicilioFiscalAttribute(): string
    {
        $parts = array_filter([
            $this->calle_fiscal,
            "No. Ext. {$this->no_exterior_fiscal}",
            $this->no_interior_fiscal ? "No. Int. {$this->no_interior_fiscal}" : null,
            $this->colonia_fiscal,
            "CP {$this->cp_fiscal}",
            $this->municipio_fiscal,
            $this->estado_fiscal,
            $this->pais_fiscal,
        ]);

        return implode(', ', $parts);
    }

    /**
     * Scope: Filtrar por tipo de persona física
     */
    public function scopeFisica($query)
    {
        return $query->where('Persona', 'fisica');
    }

    /**
     * Scope: Filtrar por tipo de persona moral
     */
    public function scopeMoral($query)
    {
        return $query->where('Persona', 'moral');
    }

    /**
     * Scope: Filtrar por CURP
     */
    public function scopeByCurp($query, string $curp)
    {
        return $query->where('curp', $curp);
    }

    /**
     * Scope: Filtrar por RFC
     */
    public function scopeByRfc($query, string $rfc)
    {
        return $query->where('rfc', $rfc);
    }

    /**
     * Scope: Filtrar por notaría
     */
    public function scopeByNotaria($query, string $notaria)
    {
        return $query->where('notaria', $notaria);
    }

    /**
     * Scope: Registros recientes (últimos 30 días)
     */
    public function scopeRecientes($query)
    {
        return $query->where('dia_registro', '>=', now()->subDays(30));
    }

    /**
     * Prevenir creación de registros (READ ONLY)
     */
    public function save(array $options = []): bool
    {
        throw new \RuntimeException('Este modelo es READ-ONLY. Usa RegistroPersona para crear nuevos registros.');
    }

    /**
     * Prevenir actualización de registros (READ ONLY)
     */
    public function update(array $attributes = [], array $options = []): bool
    {
        throw new \RuntimeException('Este modelo es READ-ONLY. Usa RegistroPersona para actualizar registros.');
    }

    /**
     * Prevenir eliminación de registros (READ ONLY)
     */
    public function delete(): bool
    {
        throw new \RuntimeException('Este modelo es READ-ONLY. Usa RegistroPersona para eliminar registros.');
    }

    /**
     * Migrar este registro legacy al sistema nuevo
     *
     * Copia los datos desde el sistema legacy hacia la tabla registro_web
     */
    public function migrateToNew(): RegistroPersona
    {
        return RegistroPersona::create([
            // Metadata
            'dia_registro' => $this->dia_registro,
            'notaria' => $this->notaria,
            'envio_de_correo' => $this->envio_de_correo,
            'persona' => strtolower($this->Persona), // normalizar a minúsculas

            // Datos personales
            'nombre' => $this->nombre,
            'apellidopat' => $this->apellidopat,
            'apellidomat' => $this->apellidomat,
            'alias' => $this->alias,
            'curp' => $this->curp,
            'rfc' => $this->rfc,
            'dia' => $this->dia,
            'genero' => $this->genero,
            'paisnac' => $this->paisnac,
            'nacionalidad' => $this->nacionalidad,
            'estado_nac' => $this->estado_nac,
            'ciudad_nac' => $this->ciudad_nac,
            'municipio_nac' => $this->municipio_nac,
            'ocupacion' => $this->ocupacion,
            'edo_civil' => $this->edo_civil,
            'conyuge' => $this->conyuge,

            // Datos del cónyuge
            'nombre_conyuge' => $this->nombre_conyuge,
            'apellido_paterno_conyuge' => $this->Apellido_paterno_conyuge,
            'apellido_materno_conyuge' => $this->Apellido_materno_conyuge,
            'doc_identificacion' => $this->doc_Identificacion,
            'num_doc_identificacion' => $this->num_doc_identificacion,
            'autoridad_emisora' => $this->Autoridad_emisora,

            // Domicilio particular
            'calle' => $this->calle,
            'no_exterior' => $this->no_exterior,
            'no_interior' => $this->no_interior,
            'manzana' => $this->manzana,
            'lote' => $this->lote,
            'cp' => $this->cp,
            'colonia' => $this->colonia,
            'municipio' => $this->municipio,
            'estado' => $this->estado,
            'ciudad' => $this->ciudad,
            'pais' => $this->pais,

            // Domicilio fiscal
            'calle_fiscal' => $this->calle_fiscal,
            'no_exterior_fiscal' => $this->no_exterior_fiscal,
            'no_interior_fiscal' => $this->no_interior_fiscal,
            'manzana_fiscal' => $this->manzana_fiscal,
            'lote_fiscal' => $this->lote_fiscal,
            'cp_fiscal' => $this->cp_fiscal,
            'colonia_fiscal' => $this->colonia_fiscal,
            'municipio_fiscal' => $this->municipio_fiscal,
            'estado_fiscal' => $this->estado_fiscal,
            'ciudad_fiscal' => $this->ciudad_fiscal,
            'pais_fiscal' => $this->pais_fiscal,

            // Contacto
            'telefono' => $this->telefono,
            'telefonos' => $this->telefonos,
            'telefono_oficina' => $this->telefono_oficina,
            'telefono_movil' => $this->telefono_movil,
            'correo' => $this->correo,
            'gmail2' => $this->Gmail2,

            // Identificación
            'documento' => $this->documento,
            'no_identificacion' => $this->no_identificacion,
            'vigiencia_de_ine' => $this->vigiencia_de_ine,
            'autoridad_emisora_usuario' => $this->autoridad_emisora_usuario,

            // Información adicional
            'regimen_fiscal' => $this->regimen_fiscal,
            'servicios_medicos' => $this->servicios_medicos,
            'id_y_cartainmigracion' => $this->id_y_cartaInmigracion,
            'observaciones_adicionales' => $this->observaciones_adicionales,

            // Datos del testador (usar campos nuevos snake_case)
            'sabe_escribir' => $this->sabe_escribir ?: $this->escribir,
            'sabe_leer' => $this->sabe_leer ?: $this->leer,
            'padre_nombre' => $this->padre_nombre ?: $this->nombre_padre,
            'padre_vive' => $this->padre_vive,
            'madre_nombre' => $this->madre_nombre ?: $this->nombre_madre,
            'madre_vive' => $this->madre_vive,
            'hijos' => $this->hijos,
            'herederos' => $this->herederos,
            'herederos_sustitutos' => $this->herederos_sustitutos ?: $this->herederosSustitutos,
            'albacea' => $this->albacea,
            'albacea_sustituto' => $this->albacea_sustituto ?: $this->albaceaSustituto,
            'tutor_tutriz' => $this->tutor_tutriz ?: $this->TutorTutriz,
            'tutor_sustituto' => $this->tutor_sustituto ?: $this->tutorSustituto,
            'observaciones' => $this->observaciones,
        ]);
    }
}
