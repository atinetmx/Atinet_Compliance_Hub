import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SubscriptionStatusBadgeProps {
    status: 'trial' | 'activa' | 'vencida' | 'suspendida' | 'cancelada';
    className?: string;
}

const statusConfig = {
    trial: {
        label: 'Prueba',
        variant: 'default' as const,
        className:
            'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    },
    activa: {
        label: 'Activa',
        variant: 'default' as const,
        className:
            'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
    },
    vencida: {
        label: 'Vencida',
        variant: 'default' as const,
        className:
            'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
    },
    suspendida: {
        label: 'Suspendida',
        variant: 'default' as const,
        className:
            'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
    },
    cancelada: {
        label: 'Cancelada',
        variant: 'default' as const,
        className:
            'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
    },
};

export function SubscriptionStatusBadge({
    status,
    className,
}: SubscriptionStatusBadgeProps) {
    const config = statusConfig[status];

    return (
        <Badge
            variant={config.variant}
            className={cn(config.className, className)}
        >
            {config.label}
        </Badge>
    );
}
