<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSubscriptionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->tipo_cuenta === 'super_admin';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'plan_id' => ['sometimes', 'exists:plans,id'],
            'fecha_inicio' => ['sometimes', 'date'],
            'fecha_vencimiento' => ['sometimes', 'date', 'after:fecha_inicio'],
            'status' => ['sometimes', 'in:trial,activa,vencida,suspendida,cancelada'],
            'metodo_pago' => ['nullable', 'string', 'max:50'],
            'precio_pagado' => ['sometimes', 'numeric', 'min:0'],
            'moneda' => ['sometimes', 'string', 'size:3'],
            'ciclo_facturacion' => ['sometimes', 'in:mensual,anual'],
            'auto_renovacion' => ['boolean'],
            'fecha_cancelacion' => ['nullable', 'date'],
            'razon_cancelacion' => ['nullable', 'string', 'max:500'],
            'notas' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'plan_id.exists' => 'El plan seleccionado no existe.',
            'fecha_vencimiento.after' => 'La fecha de vencimiento debe ser posterior a la fecha de inicio.',
            'status.in' => 'El estado debe ser: trial, activa, vencida, suspendida o cancelada.',
            'precio_pagado.min' => 'El precio debe ser mayor o igual a 0.',
            'ciclo_facturacion.in' => 'El ciclo debe ser mensual o anual.',
        ];
    }
}
