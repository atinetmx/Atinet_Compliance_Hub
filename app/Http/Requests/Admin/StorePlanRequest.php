<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

class StorePlanRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->hasRole('super_admin') ?? false;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Auto-generar slug desde el nombre
        if ($this->has('nombre') && ! $this->has('slug')) {
            $this->merge([
                'slug' => Str::slug($this->nombre),
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'nombre' => 'required|string|max:100|unique:plans,nombre',
            'slug' => 'required|string|max:100|unique:plans,slug',
            'descripcion' => 'nullable|string|max:500',
            'precio_mensual' => 'required|numeric|min:0|max:999999.99',
            'precio_anual' => 'required|numeric|min:0|max:9999999.99',
            'limite_usuarios' => 'nullable|integer|min:1',
            'limite_busquedas_mes' => 'nullable|integer|min:1',
            'herramientas_activas' => 'nullable|array',
            'herramientas_activas.*' => 'string',
            'caracteristicas' => 'nullable|array',
            'caracteristicas.*' => 'string',
            'is_active' => 'boolean',
            'orden' => 'nullable|integer|min:0',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'nombre.required' => 'El nombre del plan es obligatorio.',
            'nombre.unique' => 'Ya existe un plan con este nombre.',
            'slug.required' => 'El slug es obligatorio.',
            'slug.unique' => 'Ya existe un plan con este slug.',
            'precio_mensual.required' => 'El precio mensual es obligatorio.',
            'precio_mensual.numeric' => 'El precio mensual debe ser un número válido.',
            'precio_mensual.min' => 'El precio mensual no puede ser negativo.',
            'precio_anual.required' => 'El precio anual es obligatorio.',
            'precio_anual.numeric' => 'El precio anual debe ser un número válido.',
            'precio_anual.min' => 'El precio anual no puede ser negativo.',
            'limite_usuarios.integer' => 'El límite de usuarios debe ser un número entero.',
            'limite_usuarios.min' => 'El límite de usuarios debe ser al menos 1.',
            'limite_busquedas_mes.integer' => 'El límite de búsquedas debe ser un número entero.',
            'limite_busquedas_mes.min' => 'El límite de búsquedas debe ser al menos 1.',
        ];
    }
}
