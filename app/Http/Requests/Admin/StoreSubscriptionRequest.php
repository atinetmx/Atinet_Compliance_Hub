<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreSubscriptionRequest extends FormRequest
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
            'notaria_id' => ['required', 'exists:notarias,id'],
            'plan_id' => ['required', 'exists:plans,id'],
            'fecha_inicio' => ['required', 'date'],
            'fecha_vencimiento' => ['required', 'date', 'after:fecha_inicio'],
            'status' => ['required', 'in:trial,activa,vencida,suspendida,cancelada'],
            'metodo_pago' => ['nullable', 'string', 'max:50'],
            'precio_pagado' => ['required', 'numeric', 'min:0'],
            'moneda' => ['required', 'string', 'size:3'], // MXN, USD, etc
            'ciclo_facturacion' => ['required', 'in:mensual,anual'],
            'auto_renovacion' => ['boolean'],
            'notas' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'notaria_id.required' => 'Debes seleccionar una notaría.',
            'notaria_id.exists' => 'La notaría seleccionada no existe.',
            'plan_id.required' => 'Debes seleccionar un plan.',
            'plan_id.exists' => 'El plan seleccionado no existe.',
            'fecha_vencimiento.after' => 'La fecha de vencimiento debe ser posterior a la fecha de inicio.',
            'status.in' => 'El estado debe ser: trial, activa, vencida, suspendida o cancelada.',
            'precio_pagado.min' => 'El precio debe ser mayor o igual a 0.',
            'ciclo_facturacion.in' => 'El ciclo debe ser mensual o anual.',
        ];
    }
}
