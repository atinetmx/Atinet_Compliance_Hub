// resources/js/types/estados.ts

/**
 * Catálogo de Estados de México
 * 
 * Fuente: SEPOMEX (Servicio Postal Mexicano) vía BD atinet65_catalogos
 * Contiene 202,966 códigos postales oficiales de México
 * 
 * Se mantienen los nombres OFICIALES de SEPOMEX para compatibilidad
 * con la BD de catálogos (cat_cp) del sistema legacy
 */

// Estados oficiales de SEPOMEX (nombres completos)
export const ESTADOS_MEXICO_OFICIALES = [
    'Aguascalientes',
    'Baja California',
    'Baja California Sur',
    'Campeche',
    'Chiapas',
    'Chihuahua',
    'Ciudad de México',
    'Coahuila de Zaragoza',
    'Colima',
    'Durango',
    'Guanajuato',
    'Guerrero',
    'Hidalgo',
    'Jalisco',
    'México',
    'Michoacán de Ocampo',
    'Morelos',
    'Nayarit',
    'Nuevo León',
    'Oaxaca',
    'Puebla',
    'Querétaro',
    'Quintana Roo',
    'San Luis Potosí',
    'Sinaloa',
    'Sonora',
    'Tabasco',
    'Tamaulipas',
    'Tlaxcala',
    'Veracruz de Ignacio de la Llave',
    'Yucatán',
    'Zacatecas',
] as const;

// Nombres simplificados para UI (compatibilidad con código existente)
export const ESTADOS_MEXICO = [
    'Aguascalientes',
    'Baja California',
    'Baja California Sur',
    'Campeche',
    'Chiapas',
    'Chihuahua',
    'Ciudad de México',
    'Coahuila',
    'Colima',
    'Durango',
    'Guanajuato',
    'Guerrero',
    'Hidalgo',
    'Jalisco',
    'Estado de México',
    'Michoacán',
    'Morelos',
    'Nayarit',
    'Nuevo León',
    'Oaxaca',
    'Puebla',
    'Querétaro',
    'Quintana Roo',
    'San Luis Potosí',
    'Sinaloa',
    'Sonora',
    'Tabasco',
    'Tamaulipas',
    'Tlaxcala',
    'Veracruz',
    'Yucatán',
    'Zacatecas',
] as const;

// Códigos numéricos oficiales de SEPOMEX (para validaciones)
export const ESTADOS_CODIGOS: Record<string, number> = {
    'Aguascalientes': 1,
    'Baja California': 2,
    'Baja California Sur': 3,
    'Campeche': 4,
    'Coahuila de Zaragoza': 5,
    'Coahuila': 5, // Alias simplificado
    'Colima': 6,
    'Chiapas': 7,
    'Chihuahua': 8,
    'Ciudad de México': 9,
    'Durango': 10,
    'Guanajuato': 11,
    'Guerrero': 12,
    'Hidalgo': 13,
    'Jalisco': 14,
    'México': 15,
    'Estado de México': 15, // Alias simplificado
    'Michoacán de Ocampo': 16,
    'Michoacán': 16, // Alias simplificado
    'Morelos': 17,
    'Nayarit': 18,
    'Nuevo León': 19,
    'Oaxaca': 20,
    'Puebla': 21,
    'Querétaro': 22,
    'Quintana Roo': 23,
    'San Luis Potosí': 24,
    'Sinaloa': 25,
    'Sonora': 26,
    'Tabasco': 27,
    'Tamaulipas': 28,
    'Tlaxcala': 29,
    'Veracruz de Ignacio de la Llave': 30,
    'Veracruz': 30, // Alias simplificado
    'Yucatán': 31,
    'Zacatecas': 32,
};

// Mapeo de nombres simplificados a nombres oficiales
export const ESTADOS_MAPEO_OFICIAL: Record<string, string> = {
    'Coahuila': 'Coahuila de Zaragoza',
    'Estado de México': 'México',
    'Michoacán': 'Michoacán de Ocampo',
    'Veracruz': 'Veracruz de Ignacio de la Llave',
};

// Mapeo inverso: nombres oficiales a simplificados
export const ESTADOS_MAPEO_SIMPLIFICADO: Record<string, string> = {
    'Coahuila de Zaragoza': 'Coahuila',
    'México': 'Estado de México',
    'Michoacán de Ocampo': 'Michoacán',
    'Veracruz de Ignacio de la Llave': 'Veracruz',
};

/**
 * Convierte un nombre de estado simplificado al nombre oficial de SEPOMEX
 */
export function estadoAOficial(estado: string): string {
    return ESTADOS_MAPEO_OFICIAL[estado] || estado;
}

/**
 * Convierte un nombre de estado oficial de SEPOMEX al nombre simplificado
 */
export function estadoASimplificado(estado: string): string {
    return ESTADOS_MAPEO_SIMPLIFICADO[estado] || estado;
}

/**
 * Obtiene el código numérico de un estado (acepta nombres simplificados u oficiales)
 */
export function getEstadoCodigo(estado: string): number | undefined {
    return ESTADOS_CODIGOS[estado];
}

export type EstadoMexico = (typeof ESTADOS_MEXICO)[number];
export type EstadoMexicoOficial = (typeof ESTADOS_MEXICO_OFICIALES)[number];
