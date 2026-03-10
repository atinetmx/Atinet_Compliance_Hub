import axios from 'axios';
import { Loader2, MapPin } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Municipio {
    nombre: string;
    codigo: number;
}

interface MunicipioSelectorProps {
    value: string;
    onChange: (value: string) => void;
    estado: string;
    error?: string;
    label?: string;
    placeholder?: string;
    required?: boolean;
}

/**
 * Selector de municipios de México
 * Se filtra automáticamente según el estado seleccionado
 * Carga datos desde la BD de catálogos SEPOMEX
 */
export default function MunicipioSelector({
    value,
    onChange,
    estado,
    error,
    label = 'Municipio',
    placeholder = 'Seleccionar municipio',
    required = false,
}: MunicipioSelectorProps) {
    const [municipios, setMunicipios] = useState<Municipio[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const loadMunicipios = useCallback(async (estadoNombre: string) => {
        try {
            setLoading(true);
            setLoadError(null);

            const response = await axios.get('/admin/catalogos/municipios', {
                params: { estado: estadoNombre },
            });

            if (response.data.success) {
                setMunicipios(response.data.data);

                // Si el valor actual no existe en los nuevos municipios, limpiar
                const existe = response.data.data.some(
                    (m: Municipio) => m.nombre === value
                );
                if (!existe && value) {
                    onChange('');
                }
            } else {
                setLoadError('Error al cargar municipios');
            }
        } catch (err) {
            console.error('Error cargando municipios:', err);
            setLoadError('Error al conectar con el servidor');
        } finally {
            setLoading(false);
        }
    }, [onChange, value]);

    useEffect(() => {
        if (estado) {
            loadMunicipios(estado);
        } else {
            // Limpiar municipios si no hay estado
            setMunicipios([]);
            onChange(''); // Limpiar valor seleccionado
        }
    }, [estado, loadMunicipios, onChange]);

    if (!estado) {
        return (
            <div className="space-y-2">
                {label && (
                    <Label>
                        {label}
                        {required && <span className="text-red-500">*</span>}
                    </Label>
                )}
                <div className="flex items-center gap-2 rounded-md border border-input bg-muted/50 px-3 py-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                        Selecciona primero un estado
                    </span>
                </div>
            </div>
        );
    }

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
                        Cargando municipios de {estado}...
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
                        onClick={() => loadMunicipios(estado)}
                        className="mt-1 text-sm text-red-700 underline hover:text-red-800"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    if (municipios.length === 0) {
        return (
            <div className="space-y-2">
                {label && (
                    <Label>
                        {label}
                        {required && <span className="text-red-500">*</span>}
                    </Label>
                )}
                <div className="flex items-center gap-2 rounded-md border border-input bg-muted/50 px-3 py-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                        No se encontraron municipios para {estado}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {label && (
                <Label htmlFor="municipio">
                    {label}
                    {required && <span className="text-red-500">*</span>}
                </Label>
            )}
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger
                    id="municipio"
                    className={error ? 'border-red-500' : ''}
                >
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent className="max-h-75">
                    {municipios.map((municipio) => (
                        <SelectItem
                            key={municipio.codigo}
                            value={municipio.nombre}
                        >
                            {municipio.nombre}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <p className="text-xs text-muted-foreground">
                {municipios.length} municipios en {estado}
            </p>
        </div>
    );
}
