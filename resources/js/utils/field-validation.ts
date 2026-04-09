/**
 * Field Validation Utilities - Atinet Compliance Hub
 * Portado desde: form-manager.js del sistema PHP legacy
 *
 * Verifica campos faltantes y sugiere documentos para completar
 */

export interface MissingFieldGroup {
    name: string;
    icon: string;
    fields: string[];
    missing: string[];
    documents: DocumentType[];
}

export type DocumentType = 'INE' | 'CURP' | 'Acta' | 'QR';

export interface FormData {
    // Datos personales
    nombre?: string;
    apellidopat?: string;
    apellidomat?: string;
    curp?: string;
    rfc?: string;
    dia?: string;
    genero?: string;

    // Domicilio
    calle?: string;
    no_exterior?: string;
    no_interior?: string;
    colonia?: string;
    cp?: string;
    municipio?: string;
    estado?: string;
    ciudad?: string;
    pais?: string;

    // Domicilio fiscal
    calle_fiscal?: string;
    no_exterior_fiscal?: string;
    no_interior_fiscal?: string;
    colonia_fiscal?: string;
    cp_fiscal?: string;
    municipio_fiscal?: string;
    estado_fiscal?: string;
    ciudad_fiscal?: string;
    pais_fiscal?: string;

    // Credencial INE
    no_identificacion?: string;
    vigiencia_de_ine?: string;

    // Lugar de nacimiento
    estado_nac?: string;
    municipio_nac?: string;
    paisnac?: string;

    // Datos familiares
    padre_nombre?: string;
    madre_nombre?: string;

    // Otros
    [key: string]: any;
}

/**
 * Definición de grupos de campos con sus requisitos
 */
const FIELD_GROUPS: Omit<MissingFieldGroup, 'missing'>[] = [
    {
        name: 'Datos personales',
        icon: '👤',
        fields: ['nombre', 'apellidopat', 'apellidomat', 'curp', 'dia', 'genero'],
        documents: ['INE', 'CURP', 'QR'],
    },
    {
        name: 'Domicilio',
        icon: '🏠',
        fields: ['calle', 'colonia', 'cp', 'municipio', 'estado'],
        documents: ['INE'],
    },
    {
        name: 'Credencial INE',
        icon: '🪪',
        fields: ['no_identificacion', 'vigiencia_de_ine'],
        documents: ['INE'],
    },
    {
        name: 'Lugar de nacimiento',
        icon: '📍',
        fields: ['estado_nac', 'municipio_nac'],
        documents: ['CURP', 'Acta'],
    },
    {
        name: 'Datos familiares',
        icon: '👨\u200d👩\u200d👧',
        fields: ['padre_nombre', 'madre_nombre'],
        documents: ['Acta'],
    },
];

/**
 * Normalizar valor del campo
 */
function normalizeValue(value: any): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number') return value === 0 ? '' : String(value);
    return String(value);
}

/**
 * Verificar si un campo está vacío
 */
function isFieldEmpty(value: any): boolean {
    const normalized = normalizeValue(value);
    return normalized === '' || normalized === '0';
}

/**
 * Verificar campos faltantes en el formulario
 *
 * @param formData - Datos del formulario
 * @returns Array de grupos con campos faltantes
 */
export function verificarCamposFaltantes(formData: FormData): MissingFieldGroup[] {
    const incompletos: MissingFieldGroup[] = [];

    for (const grupo of FIELD_GROUPS) {
        // Filtrar campos que están vacíos
        const missing = grupo.fields.filter(field => {
            const value = formData[field];
            return isFieldEmpty(value);
        });

        // Solo agregar el grupo si tiene campos faltantes
        if (missing.length > 0) {
            incompletos.push({
                ...grupo,
                missing,
            });
        }
    }

    return incompletos;
}

/**
 * Obtener etiquetas legibles para campos
 */
const FIELD_LABELS: Record<string, string> = {
    // Datos personales
    nombre: 'Nombre',
    apellidopat: 'Apellido Paterno',
    apellidomat: 'Apellido Materno',
    curp: 'CURP',
    rfc: 'RFC',
    dia: 'Fecha de Nacimiento',
    genero: 'Género',

    // Domicilio
    calle: 'Calle',
    no_exterior: 'No. Exterior',
    no_interior: 'No. Interior',
    colonia: 'Colonia',
    cp: 'Código Postal',
    municipio: 'Municipio',
    estado: 'Estado',
    ciudad: 'Ciudad',
    pais: 'País',

    // Domicilio fiscal
    calle_fiscal: 'Calle Fiscal',
    no_exterior_fiscal: 'No. Exterior Fiscal',
    no_interior_fiscal: 'No. Interior Fiscal',
    colonia_fiscal: 'Colonia Fiscal',
    cp_fiscal: 'CP Fiscal',
    municipio_fiscal: 'Municipio Fiscal',
    estado_fiscal: 'Estado Fiscal',
    ciudad_fiscal: 'Ciudad Fiscal',
    pais_fiscal: 'País Fiscal',

    // Credencial INE
    no_identificacion: 'No. de Identificación',
    vigiencia_de_ine: 'Vigencia INE',

    // Lugar de nacimiento
    estado_nac: 'Estado de Nacimiento',
    municipio_nac: 'Municipio de Nacimiento',
    paisnac: 'País de Nacimiento',

    // Datos familiares
    padre_nombre: 'Nombre del Padre',
    madre_nombre: 'Nombre de la Madre',
};

/**
 * Obtener etiqueta legible para un campo
 */
export function getFieldLabel(field: string): string {
    return FIELD_LABELS[field] || field;
}

/**
 * Obtener lista de documentos sugeridos según campos faltantes
 * Sin duplicados y ordenados por prioridad
 */
export function getSuggestedDocuments(missingGroups: MissingFieldGroup[]): DocumentType[] {
    const docsSet = new Set<DocumentType>();
    const priority: DocumentType[] = ['QR', 'INE', 'CURP', 'Acta'];

    // Recolectar todos los documentos sugeridos
    missingGroups.forEach(group => {
        group.documents.forEach(doc => docsSet.add(doc));
    });

    // Ordenar por prioridad
    return priority.filter(doc => docsSet.has(doc));
}

/**
 * Verificar si todos los campos clave están completos
 */
export function areKeyFieldsComplete(formData: FormData): boolean {
    const keyFields = ['nombre', 'apellidopat', 'curp', 'rfc', 'dia'];

    return keyFields.every(field => {
        const value = formData[field];
        return !isFieldEmpty(value);
    });
}

/**
 * Contar total de campos faltantes
 */
export function countMissingFields(missingGroups: MissingFieldGroup[]): number {
    return missingGroups.reduce((total, group) => total + group.missing.length, 0);
}

/**
 * Generar HTML de resumen de campos faltantes (para modales)
 */
export function generateMissingSummaryHTML(missingGroups: MissingFieldGroup[]): string {
    if (missingGroups.length === 0) {
        return '<p style="color:#16a34a;font-weight:600">✅ Todos los campos clave están completos.</p>';
    }

    const groupsHTML = missingGroups.map(group => {
        const missingLabels = group.missing.map(field => getFieldLabel(field));

        return `
            <div style="text-align:left;margin:8px 0;padding:8px;background:#f9fafb;border-radius:6px">
                <span style="font-size:16px">${group.icon}</span>
                <strong style="margin-left:6px">${group.name}:</strong>
                <div style="color:#6b7280;font-size:13px;margin-left:28px;margin-top:4px">
                    ${missingLabels.join(', ')}
                </div>
            </div>
        `;
    }).join('');

    return `
        <div style="margin:12px 0">
            <p style="font-size:14px;color:#374151;margin-bottom:8px;font-weight:600">
                ⚠️ Campos pendientes:
            </p>
            ${groupsHTML}
        </div>
    `;
}
