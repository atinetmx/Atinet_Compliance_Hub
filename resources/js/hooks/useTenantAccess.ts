import { usePage } from '@inertiajs/react';
import { useMemo } from 'react';

export interface TenantContext {
  notariaId: number | null;
  notariaNombre: string;
  isSuperAdmin: boolean;
  isAdmin: boolean;
}

interface PageProps {
  [key: string]: unknown;
  auth?: {
    user?: {
      notaria_id?: number;
      notaria?: {
        nombre?: string;
      };
      tipo_cuenta?: string;
    };
  };
}

/**
 * Hook para acceder a información del tenant actual
 * Obtiene datos del contexto de Inertia
 */
export const useTenantAccess = (): TenantContext => {
  const { props } = usePage<PageProps>();

  const tenantInfo = useMemo(() => {
    return {
      notariaId: props.auth?.user?.notaria_id || null,
      notariaNombre: props.auth?.user?.notaria?.nombre || '',
      isSuperAdmin: props.auth?.user?.tipo_cuenta === 'super_admin',
      isAdmin:
        props.auth?.user?.tipo_cuenta === 'admin_notaria' ||
        props.auth?.user?.tipo_cuenta === 'super_admin',
    };
  }, [props.auth?.user]);

  return tenantInfo;
};
