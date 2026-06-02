<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request para validar registro de personas (física o moral)
 *
 * Basado en el sistema PHP original: /api/registrar/guardar.php
 * Valida 85 campos con reglas específicas según tipo de persona
 */
class StoreRegistroRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Se asume que el usuario ya pasó middleware de autenticación
    }

    /**
     * Preparar datos antes de validación
     * Normaliza CURP y RFC a mayúsculas automáticamente
     */
    protected function prepareForValidation(): void
    {
        // Normalizar CURP y RFC a mayúsculas antes de validar
        if ($this->has('curp') && $this->curp) {
            $this->merge(['curp' => strtoupper(trim($this->curp))]);
        }

        if ($this->has('rfc') && $this->rfc) {
            $this->merge(['rfc' => strtoupper(trim($this->rfc))]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * Validación diferenciada:
     * - PERSONA FÍSICA: Requiere nombre, apellidos, CURP (18 chars)
     * - PERSONA MORAL: Requiere razón social, RFC (12-13 chars), apellidos opcionales
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $persona = $this->input('persona', 'fisica');
        $isUpdate = $this->route('registro') !== null;

        // ID del registro actual (para excluir de unique en updates)
        $registroId = $isUpdate ? $this->route('registro') : null;

        $rules = [
            // ===== CAMPOS DE CONTROL (4 campos) =====
            'persona' => 'required|in:fisica,moral',
            'notaria' => 'required|string|max:30',
            'dia_registro' => 'nullable|date',
            'envio_de_correo' => 'nullable|boolean',

            // ===== CORREO OBLIGATORIO (común para física y moral) =====
            'correo' => [
                'required',
                'email',
                'max:150',
            ],

            // ===== RFC (OBLIGATORIO para física y moral) =====
            'rfc' => [
                'required',
                'string',
                'between:12,13',
                'regex:/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{2,3}$/u',
                // NOTA: No validar unique() aquí porque el controller maneja duplicados con auto-UPDATE
            ],
        ];

        // ===== VALIDACIÓN DIFERENCIADA SEGÚN TIPO DE PERSONA =====
        if ($persona === 'fisica') {
            // PERSONA FÍSICA: apellidos obligatorios, CURP obligatorio
            $rules = array_merge($rules, [
                'nombre' => 'required|string|max:255',
                'apellidopat' => 'required|string|max:30',
                'apellidomat' => 'required|string|max:30',
                'curp' => [
                    'required',
                    'string',
                    'size:18',
                    'regex:/^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/u',
                    // NOTA: No validar unique() aquí porque el controller maneja duplicados con auto-UPDATE
                ],
            ]);
        } else {
            // PERSONA MORAL: solo razón social obligatorio, apellidos opcionales, CURP opcional
            $rules = array_merge($rules, [
                'nombre' => 'required|string|max:255',
                'apellidopat' => 'nullable|string|max:30',
                'apellidomat' => 'nullable|string|max:30',
                'curp' => [
                    'nullable',
                    'string',
                    'size:18',
                    'regex:/^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/u',
                    // NOTA: No validar unique() aquí porque el controller maneja duplicados con auto-UPDATE
                ],
            ]);
        }

        // ===== DATOS PERSONALES COMUNES (11 campos) =====
        $rules = array_merge($rules, [
            'alias' => 'nullable|string|max:100',
            'dia' => 'nullable|date|before_or_equal:today',
            'genero' => 'nullable|in:H,M',
            'paisnac' => 'nullable|string|max:50',
            'nacionalidad' => 'nullable|string|max:50',
            'estado_nac' => 'nullable|string|max:50',
            'ciudad_nac' => 'nullable|string|max:100',
            'municipio_nac' => 'nullable|string|max:100',
            'ocupacion' => 'nullable|string|max:100',
            'edo_civil' => 'nullable|in:Soltero(a),Casado(a),Divorciado(a),Viudo(a),Unión Libre',
        ]);

        // ===== DATOS DEL CÓNYUGE (6 campos - solo si está casado) =====
        $rules = array_merge($rules, [
            'conyuge' => 'nullable|string|max:100',
            'nombre_conyuge' => 'nullable|string|max:50',
            'apellido_paterno_conyuge' => 'nullable|string|max:50',
            'apellido_materno_conyuge' => 'nullable|string|max:50',
            'doc_identificacion' => 'nullable|string|max:100',
            'num_doc_identificacion' => 'nullable|integer',
            'autoridad_emisora' => 'nullable|string|max:100',
        ]);

        // ===== DOMICILIO PARTICULAR (11 campos) =====
        $rules = array_merge($rules, [
            'calle' => 'nullable|string|max:100',
            'no_exterior' => 'nullable|string|max:100',
            'no_interior' => 'nullable|string|max:100',
            'manzana' => 'nullable|string|max:100',
            'lote' => 'nullable|string|max:100',
            'cp' => 'nullable|string|regex:/^\d{5}$/',
            'colonia' => 'nullable|string|max:100',
            'municipio' => 'nullable|string|max:100',
            'estado' => 'nullable|string|max:100',
            'ciudad' => 'nullable|string|max:100',
            'pais' => 'nullable|string|max:50',
        ]);

        // ===== DOMICILIO FISCAL (11 campos) =====
        $rules = array_merge($rules, [
            'calle_fiscal' => 'nullable|string|max:100',
            'no_exterior_fiscal' => 'nullable|string|max:100',
            'no_interior_fiscal' => 'nullable|string|max:100',
            'manzana_fiscal' => 'nullable|string|max:100',
            'lote_fiscal' => 'nullable|string|max:100',
            'cp_fiscal' => 'nullable|string|regex:/^\d{5}$/',
            'colonia_fiscal' => 'nullable|string|max:100',
            'municipio_fiscal' => 'nullable|string|max:100',
            'estado_fiscal' => 'nullable|string|max:100',
            'ciudad_fiscal' => 'nullable|string|max:100',
            'pais_fiscal' => 'nullable|string|max:50',
        ]);

        // ===== DOMICILIO NOTIFICACIONES (11 campos) =====
        $rules = array_merge($rules, [
            'calle_notificaciones' => 'nullable|string|max:100',
            'no_exterior_notificaciones' => 'nullable|string|max:100',
            'no_interior_notificaciones' => 'nullable|string|max:100',
            'manzana_notificaciones' => 'nullable|string|max:100',
            'lote_notificaciones' => 'nullable|string|max:100',
            'cp_notificaciones' => 'nullable|string|regex:/^\d{5}$/',
            'colonia_notificaciones' => 'nullable|string|max:100',
            'municipio_notificaciones' => 'nullable|string|max:100',
            'estado_notificaciones' => 'nullable|string|max:100',
            'ciudad_notificaciones' => 'nullable|string|max:100',
            'pais_notificaciones' => 'nullable|string|max:50',
        ]);

        // ===== DATOS DE CONTACTO (6 campos) =====
        $rules = array_merge($rules, [
            'telefono' => 'nullable|string|max:50',
            'telefonos' => 'nullable|string|max:100',
            'telefono_oficina' => 'nullable|string|max:20',
            'telefono_movil' => 'nullable|string|max:20',
            'gmail2' => 'nullable|email|max:225',
        ]);

        // ===== DATOS DE IDENTIFICACIÓN (5 campos) =====
        $rules = array_merge($rules, [
            'documento' => 'nullable|string|max:100',
            'no_identificacion' => 'nullable|string|max:100',
            'vigiencia_de_ine' => 'nullable|date',
            'autoridad_emisora_usuario' => 'nullable|string|max:225',
        ]);

        // ===== INFORMACIÓN ADICIONAL (4 campos) =====
        $rules = array_merge($rules, [
            'regimen_fiscal' => 'nullable|string|max:225',
            'servicios_medicos' => 'nullable|string|max:225',
            'id_y_cartainmigracion' => 'nullable|string|max:225',
            'observaciones_adicionales' => 'nullable|string|max:500',
        ]);

        // ===== DATOS DEL TESTADOR (15 campos - solo persona física) =====
        $rules = array_merge($rules, [
            'sabe_escribir' => 'nullable|in:SI,NO,si,no',
            'sabe_leer' => 'nullable|in:SI,NO,si,no',
            'padre_nombre' => 'nullable|string|max:255',
            'padre_vive' => 'nullable|in:SI,NO,si,no',
            'madre_nombre' => 'nullable|string|max:255',
            'madre_vive' => 'nullable|in:SI,NO,si,no',
            'hijos' => 'nullable|string|max:200',
            'herederos' => 'nullable|string|max:200',
            'herederos_sustitutos' => 'nullable|string',
            'albacea' => 'nullable|string|max:45',
            'albacea_sustituto' => 'nullable|string|max:255',
            'tutor_tutriz' => 'nullable|string|max:255',
            'tutor_sustituto' => 'nullable|string|max:255',
            'observaciones' => 'nullable|string|max:45',
        ]);

        return $rules;
    }

    /**
     * Get custom messages for validator errors.
     * Mensajes en español personalizados según el sistema PHP
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            // Mensajes notaria
            'notaria.required' => 'La notaría es obligatoria',

            // Mensajes persona
            'persona.required' => 'Debe especificar el tipo de persona (física o moral)',
            'persona.in' => 'El tipo de persona debe ser física o moral',

            // Mensajes CURP
            'curp.required' => 'El CURP es obligatorio para personas físicas',
            'curp.size' => 'El CURP debe tener exactamente 18 caracteres',
            'curp.regex' => 'El formato del CURP es inválido. Debe seguir el patrón: 4 letras + 6 dígitos + H/M + 5 letras + 1 alfanumérico + 1 dígito',
            'curp.unique' => 'Ya existe un registro con este CURP',

            // Mensajes RFC
            'rfc.required' => 'El RFC es obligatorio',
            'rfc.between' => 'El RFC debe tener entre 12 y 13 caracteres',
            'rfc.regex' => 'El formato del RFC es inválido. Debe seguir el patrón: 3-4 letras + 6 dígitos + 2-3 alfanuméricos',
            'rfc.unique' => 'Ya existe un registro con este RFC',

            // Mensajes nombre
            'nombre.required' => 'El nombre es obligatorio',
            'nombre.max' => 'El nombre o razón social no puede exceder 255 caracteres',

            // Mensajes apellidos
            'apellidopat.required' => 'El apellido paterno es obligatorio para personas físicas',
            'apellidomat.required' => 'El apellido materno es obligatorio para personas físicas',

            // Mensajes correo
            'correo.required' => 'El correo electrónico es obligatorio',
            'correo.email' => 'El formato del correo electrónico es inválido',
            'correo.max' => 'El correo no puede exceder 150 caracteres',

            // Mensajes fecha nacimiento
            'dia.date' => 'La fecha de nacimiento debe ser una fecha válida',
            'dia.before_or_equal' => 'La fecha de nacimiento no puede ser futura',

            // Mensajes género
            'genero.in' => 'El género debe ser H (Hombre) o M (Mujer)',

            // Mensajes estado civil
            'edo_civil.in' => 'El estado civil debe ser: Soltero(a), Casado(a), Divorciado(a), Viudo(a) o Unión Libre',

            // Mensajes CP
            'cp.regex' => 'El código postal debe tener exactamente 5 dígitos',
            'cp_fiscal.regex' => 'El código postal fiscal debe tener exactamente 5 dígitos',
            'cp_notificaciones.regex' => 'El código postal de notificaciones debe tener exactamente 5 dígitos',

            // Mensajes teléfonos
            'telefono_movil.max' => 'El teléfono móvil no puede exceder 20 caracteres',
            'telefono_oficina.max' => 'El teléfono de oficina no puede exceder 20 caracteres',

            // Mensajes vigencia INE
            'vigiencia_de_ine.date' => 'La vigencia de la INE debe ser una fecha válida',

            // Mensajes sí/no
            'sabe_escribir.in' => 'El campo "¿Sabe escribir?" debe ser SI o NO',
            'sabe_leer.in' => 'El campo "¿Sabe leer?" debe ser SI o NO',
            'padre_vive.in' => 'El campo "¿Padre vive?" debe ser SI o NO',
            'madre_vive.in' => 'El campo "¿Madre vive?" debe ser SI o NO',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     * Nombres amigables de campos para mensajes de error
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'persona' => 'tipo de persona',
            'curp' => 'CURP',
            'rfc' => 'RFC',
            'nombre' => 'nombre',
            'apellidopat' => 'apellido paterno',
            'apellidomat' => 'apellido materno',
            'correo' => 'correo electrónico',
            'dia' => 'fecha de nacimiento',
            'genero' => 'género',
            'edo_civil' => 'estado civil',
            'cp' => 'código postal',
            'cp_fiscal' => 'código postal fiscal',
            'telefono_movil' => 'teléfono móvil',
            'telefono_oficina' => 'teléfono de oficina',
            'vigiencia_de_ine' => 'vigencia de INE',
        ];
    }
}
