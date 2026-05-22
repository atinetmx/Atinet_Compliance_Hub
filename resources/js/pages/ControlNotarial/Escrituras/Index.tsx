import { Head } from '@inertiajs/react';
import { FileText } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Props {
    message: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Control Notarial', href: '/admin/control-notarial' },
    { title: 'Escrituras', href: '/admin/control-notarial/escrituras' },
];

export default function EscriturasIndex({ message }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Escrituras - Control Notarial" />

            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
                <FileText className="h-16 w-16 text-muted-foreground opacity-40" />
                <h2 className="text-2xl font-semibold text-foreground">Módulo de Escrituras</h2>
                <p className="text-muted-foreground max-w-md">{message}</p>
            </div>
        </AppLayout>
    );
}
