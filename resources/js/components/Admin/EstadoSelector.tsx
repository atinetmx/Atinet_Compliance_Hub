import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Estado {
    nombre: string;
    codigo: number;
}

interface EstadoSelectorProps {
    value: string;
    onChange: (value: string) => void;
    error?: string;
    label?: string;
    placeholder?: string;
    required?: boolean;
}

/**
 * Selector de estados de México
 * Carga datos desde la BD de catálogos SEPOMEX
 */
export default function EstadoSelector({
    value,
    onChange,
    error,
    label = 'Estado',
    placeholder = 'Seleccionar estado',
    required = false,
}: EstadoSelectorProps) {
    const [estados, setEstados] = useState<Estado[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        loadEstados();
    }, []);

    const loadEstados = async () => {
        try {
            setLoading(true);
            setLoadError(null);

            const response = await axios.get('/admin/catalogos/estados');

            if (response.data.success) {
                setEstados(response.data.data);
            } else {
                setLoadError('Error al cargar estados');
            }
        } catch (err) {
            console.error('Error cargando estados:', err);
            setLoadError('Error al conectar con el servidor');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-2">
                {label && (
                    <Label>
                        {label}
                        {required && <span className="text-red-500">*</span>}
                    </Label>
                )}
                <div className="flex items-center gap-2 rounded-md border border-input bg-muted/50 px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                        Cargando estados...
                    </span>
                </div>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="space-y-2">
                {label && (
                    <Label>
                        {label}
                        {required && <span className="text-red-500">*</span>}
                    </Label>
                )}
                <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2">
                    <p className="text-sm text-red-600">{loadError}</p>
                    <button
                        type="button"
                        onClick={loadEstados}
                        className="mt-1 text-sm text-red-700 underline hover:text-red-800"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {label && (
                <Label htmlFor="estado">
                    {label}
                    {required && <span className="text-red-500">*</span>}
                </Label>
            )}
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger
                    id="estado"
                    className={error ? 'border-red-500' : ''}
                >
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {estados.map((estado) => (
                        <SelectItem key={estado.codigo} value={estado.nombre}>
                            {estado.nombre}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <p className="text-xs text-muted-foreground">
                {estados.length} estados disponibles (SEPOMEX)
            </p>
        </div>
    );
}
