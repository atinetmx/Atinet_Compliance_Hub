/**
 * Tipos y interfaces principales del sistema
 */

/**
 * Usuario del sistema
 */
export interface User {
  id: number;
  nombre: string;
  email: string;
  tipo_cuenta: 'super_admin' | 'admin_notaria' | 'usuario_notaria' | 'invitado';
  notaria_id: number | null;
  is_active: boolean;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  notaria?: Notaria;
}

/**
 * Notaría (cliente de Atinet)
 */
export interface Notaria {
  id: number;
  nombre: string;
  slug: string;
  plan_id: number;
  total_usuarios: number;
  limite_usuarios: number;
  busquedas_mes_actual: number;
  limite_busquedas_mes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  plan?: Plan;
}

/**
 * Plan de suscripción
 */
export interface Plan {
  id: number;
  nombre: string;
  slug: string;
  precio_mensual: number | null;
  limite_usuarios: number;
  limite_busquedas_mes: number;
  herramientas_activas: string[];
  created_at: string;
  updated_at: string;
}

/**
 * Ticket de soporte
 */
export interface Ticket {
  id: number;
  notaria_id: number;
  usuario_id: number;
  asunto: string;
  descripcion: string;
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  estado: 'abierto' | 'en_progreso' | 'resuelto' | 'cerrado';
  created_at: string;
  updated_at: string;
  usuario?: User;
  notaria?: Notaria;
  mensajes?: TicketMessage[];
}

/**
 * Mensaje en ticket
 */
export interface TicketMessage {
  id: number;
  ticket_id: number;
  usuario_id: number;
  mensaje: string;
  created_at: string;
  updated_at: string;
  usuario?: User;
}

/**
 * Búsqueda en listas negras
 */
export interface Busqueda {
  id: number;
  notaria_id: number;
  usuario_id: number;
  nombre_buscado: string;
  resultado: 'sin_coincidencia' | 'coincidencia';
  tipo: 'ofac' | 'sat' | 'cruzada' | 'avanzada';
  detalles: string | null;
  created_at: string;
  updated_at: string;
  usuario?: User;
  notaria?: Notaria;
}

/**
 * Reporte generado
 */
export interface Reporte {
  id: number;
  notaria_id: number;
  usuario_id: number;
  titulo: string;
  tipo: 'busquedas' | 'usuarios' | 'facturacion' | 'actividad';
  rango_fecha_inicio: string;
  rango_fecha_fin: string;
  archivo_url: string | null;
  created_at: string;
  updated_at: string;
  usuario?: User;
  notaria?: Notaria;
}

/**
 * Notificación
 */
export interface NotificacionSistema {
  id: string;
  usuario_id: number;
  tipo: 'ticket' | 'reporte' | 'factura' | 'alerta' | 'otro';
  titulo: string;
  mensaje: string;
  enlace?: string;
  leida: boolean;
  created_at: string;
}
