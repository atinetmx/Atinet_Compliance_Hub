import axios from 'axios';
import { Loader2, MapPin, CheckCircle2, XCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Colonia {
    nombre: string;
    tipo: string;
    zona: string;
}

interface CPData {
    estado: string;
    codigo_estado: number;
    municipio: string;
    codigo_municipio: number;
    ciudad: string | null;
    codigo_postal: number;
    colonias: Colonia[];
    total_colonias: number;
}

interface CodigoPostalInputProps {
    value: string;
    onChange: (value: string) => void;
    coloniaValue?: string;
    onColoniaChange?: (value: string) => void;
    onAutoComplete?: (data: {
        estado: string;
        municipio: string;
        colonia?: string;
    }) => void;
    error?: string;
    label?: string;
    required?: boolean;
    showColoniaSelector?: boolean;
}

/**
 * Input de código postal con auto-completado
 * Busca automáticamente en la BD de SEPOMEX y llena estado/municipio/colonia
 */
export default function CodigoPostalInput({
    value,
    onChange,
    coloniaValue,
    onColoniaChange,
    onAutoComplete,
    error,
    label = 'Código Postal',
    required = false,
    showColoniaSelector = true,
}: CodigoPostalInputProps) {
    const [cpData, setCpData] = useState<CPData | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [searchStatus, setSearchStatus] = useState<
        'idle' | 'success' | 'error'
    >('idle');

    // Ref para rastrear el último CP buscado y evitar búsquedas duplicadas
    const lastSearchedCP = useRef<string>('');

    const buscarCodigoPostal = useCallback(async (cp: string) => {
        try {
            setLoading(true);
            setSearchError(null);
            setSearchStatus('idle');

            const response = await axios.get('/admin/catalogos/buscar-cp', {
                params: { cp },
            });

            if (response.data.success) {
                const data: CPData = response.data.data;
                setCpData(data);
                setSearchStatus('success');

                // Auto-completar estado y municipio
                if (onAutoComplete) {
                    onAutoComplete({
                        estado: data.estado,
                        municipio: data.municipio,
                        colonia:
                            data.colonias.length === 1
                                ? data.colonias[0].nombre
                                : undefined,
                    });
                }

                // Si solo hay una colonia, auto-seleccionarla
                if (
                    data.colonias.length === 1 &&
                    onColoniaChange &&
                    !coloniaValue
                ) {
                    onColoniaChange(data.colonias[0].nombre);
                }
            }
        } catch (err: unknown) {
            console.error('Error buscando CP:', err);
            setCpData(null);
            setSearchStatus('error');

            const error = err as { response?: { status?: number } };

            if (error.response?.status === 404) {
                setSearchError('Código postal no encontrado');
            } else {
                setSearchError('Error al buscar código postal');
            }
        } finally {
            setLoading(false);
        }
    }, [onAutoComplete, onColoniaChange, coloniaValue]);

    useEffect(() => {
        // Buscar CP cuando tenga 5 dígitos y no sea el mismo que ya buscamos
        if (value.length === 5 && value !== lastSearchedCP.current) {
            lastSearchedCP.current = value;
            buscarCodigoPostal(value);
        } else if (value.length !== 5) {
            // Limpiar datos si el CP no es válido
            lastSearchedCP.current = '';
            setCpData(null);
            setSearchError(null);
            setSearchStatus('idle');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value.replace(/\D/g, '').slice(0, 5);
        onChange(newValue);
    };

    return (
        <div className="space-y-3">
            {/* Input de CP */}
            <div className="space-y-2">
                {label && (
                    <Label htmlFor="codigo_postal">
                        {label}
                        {required && <span className="text-red-500">*</span>}
                    </Label>
                )}
                <div className="relative">
                    <Input
                        id="codigo_postal"
                        value={value}
                        onChange={handleInputChange}
                        placeholder="44100"
                        maxLength={5}
                        className={error ? 'border-red-500 pr-10' : 'pr-10'}
                    />
                    {/* Indicador de estado */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {loading && (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                        {!loading && searchStatus === 'success' && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                        {!loading && searchStatus === 'error' && (
                            <XCircle className="h-4 w-4 text-red-500" />
                        )}
                    </div>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                {searchError && (
                    <p className="text-sm text-amber-600">{searchError}</p>
                )}
            </div>

            {/* Información auto-completada */}
            {cpData && searchStatus === 'success' && (
                <div className="rounded-md border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
                    <div className="mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <p className="text-sm font-medium text-green-900 dark:text-green-100">
                            Ubicación encontrada
                        </p>
                    </div>
                    <div className="space-y-1 text-sm text-green-800 dark:text-green-200">
                        <p>
                            <span className="font-medium">Estado:</span>{' '}
                            {cpData.estado}
                        </p>
                        <p>
                            <span className="font-medium">Municipio:</span>{' '}
                            {cpData.municipio}
                        </p>
                        {cpData.ciudad && (
                            <p>
                                <span className="font-medium">Ciudad:</span>{' '}
                                {cpData.ciudad}
                            </p>
                        )}
                        <p>
                            <span className="font-medium">Colonias:</span>{' '}
                            {cpData.total_colonias}
                        </p>
                    </div>
                </div>
            )}

            {/* Selector de colonia */}
            {showColoniaSelector &&
                cpData &&
                cpData.colonias.length > 0 &&
                onColoniaChange && (
                    <div className="space-y-2">
                        <Label htmlFor="colonia">
                            Colonia / Asentamiento
                        </Label>
                        <Select
                            value={coloniaValue}
                            onValueChange={onColoniaChange}
                        >
                            <SelectTrigger id="colonia">
                                <SelectValue placeholder="Seleccionar colonia" />
                            </SelectTrigger>
                            <SelectContent className="max-h-75">
                                {cpData.colonias.map((colonia, index) => (
                                    <SelectItem
                                        key={index}
                                        value={colonia.nombre}
                                    >
                                        <div className="flex flex-col">
                                            <span>{colonia.nombre}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {colonia.tipo} • {colonia.zona}
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            {cpData.colonias.length} colonias disponibles
                        </p>
                    </div>
                )}
        </div>
    );
}
