<?php

namespace App\Http\Requests\Admin;

use App\BillingModel;
use App\ServiceCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateServiceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->hasRole('super_admin') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $categories = collect(ServiceCategory::cases())->pluck('value')->toArray();
        $billingModels = collect(BillingModel::cases())->pluck('value')->toArray();

        return [
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('services', 'code')->ignore($this->service),
                'regex:/^[A-Z_]+$/',
            ],
            'name' => 'required|string|max:100',
            'description' => 'required|string|max:500',
            'category' => [
                'required',
                'string',
                Rule::in($categories),
            ],
            'billing_model' => [
                'required',
                'string',
                Rule::in($billingModels),
            ],
            'unit_price' => [
                'nullable',
                'numeric',
                'min:0',
                'max:999999.99',
                'required_if:billing_model,per_use',
            ],
            'is_active' => 'boolean',
            'metadata' => 'nullable|array',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'code.required' => 'El código del servicio es obligatorio.',
            'code.unique' => 'Ya existe un servicio con este código.',
            'code.regex' => 'El código debe contener solo letras mayúsculas y guiones bajos (Ej: BLACKLIST_SAT).',
            'name.required' => 'El nombre del servicio es obligatorio.',
            'description.required' => 'La descripción es obligatoria.',
            'category.required' => 'La categoría es obligatoria.',
            'category.in' => 'La categoría seleccionada no es válida.',
            'billing_model.required' => 'El modelo de facturación es obligatorio.',
            'billing_model.in' => 'El modelo de facturación seleccionado no es válido.',
            'unit_price.required_if' => 'El precio unitario es obligatorio para servicios de pago por uso.',
            'unit_price.numeric' => 'El precio debe ser un número válido.',
            'unit_price.min' => 'El precio no puede ser negativo.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Convertir código a mayúsculas y reemplazar espacios por guiones bajos
        if ($this->has('code')) {
            $this->merge([
                'code' => strtoupper(str_replace(' ', '_', $this->code)),
            ]);
        }
    }
}
