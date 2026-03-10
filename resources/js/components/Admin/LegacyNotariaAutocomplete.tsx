import { Search, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LegacyNotaria {
    notaria_id: string;
    total_busquedas: number;
    primera_busqueda: string;
    ultima_busqueda: string;
    fuentes: string[];
    es_activa: boolean;
}

interface LegacyNotariaAutocompleteProps {
    value: string;
    onChange: (value: string, data?: LegacyNotaria) => void;
    error?: string;
}

export default function LegacyNotariaAutocomplete({
    value,
    onChange,
    error,
}: LegacyNotariaAutocompleteProps) {
    const [query, setQuery] = useState(value || '');
    const [results, setResults] = useState<LegacyNotaria[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedData, setSelectedData] = useState<LegacyNotaria | null>(
        null,
    );
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Search in legacy catalog
    useEffect(() => {
        if (query.length < 1) {
            setResults([]);
            setShowDropdown(false);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setLoading(true);
            try {
                const response = await fetch(
                    `/admin/legacy/notarias/search?query=${encodeURIComponent(query)}`,
                );
                const data = await response.json();

                if (data.results) {
                    setResults(data.results);
                    setShowDropdown(data.results.length > 0);
                }
            } catch (error) {
                console.error('Error searching legacy notarias:', error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const handleSelect = (notaria: LegacyNotaria) => {
        setQuery(notaria.notaria_id);
        setSelectedData(notaria);
        setShowDropdown(false);
        onChange(notaria.notaria_id, notaria);
    };

    const handleInputChange = (newValue: string) => {
        setQuery(newValue);
        if (newValue !== selectedData?.notaria_id) {
            setSelectedData(null);
        }
        onChange(newValue);
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('es-MX').format(num);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div ref={dropdownRef} className="relative space-y-2">
            <Label htmlFor="legacy_identifier">
                Identificador Sistema Legacy (Opcional)
            </Label>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    ref={inputRef}
                    id="legacy_identifier"
                    value={query}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onFocus={() => {
                        if (results.length > 0) setShowDropdown(true);
                    }}
                    placeholder="Buscar: 10Cuernavaca, 142etla, 9Acambaro..."
                    className={`pl-10 ${error ? 'border-red-500' : ''}`}
                />
                {loading && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            {/* Dropdown Results */}
            {showDropdown && results.length > 0 && (
                <div className="absolute z-50 mt-1 max-h-96 w-full overflow-auto rounded-lg border bg-background shadow-lg">
                    <div className="p-2">
                        <p className="mb-2 px-2 text-xs text-muted-foreground">
                            Encontrados: {results.length} notarías
                        </p>
                        {results.map((notaria) => (
                            <button
                                key={notaria.notaria_id}
                                type="button"
                                onClick={() => handleSelect(notaria)}
                                className="w-full rounded-md p-3 text-left transition-colors hover:bg-muted"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">
                                                {notaria.notaria_id}
                                            </span>
                                            {notaria.es_activa ? (
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-red-500" />
                                            )}
                                        </div>
                                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                            <span>
                                                📊{' '}
                                                {formatNumber(
                                                    notaria.total_busquedas,
                                                )}{' '}
                                                búsquedas
                                            </span>
                                            <span>•</span>
                                            <span>
                                                📅 Última:{' '}
                                                {formatDate(
                                                    notaria.ultima_busqueda,
                                                )}
                                            </span>
                                        </div>
                                        <div className="mt-1 flex gap-1">
                                            {notaria.fuentes.map((fuente) => (
                                                <span
                                                    key={fuente}
                                                    className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                                                >
                                                    {fuente}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Selected Info */}
            {selectedData && (
                <div className="rounded-md border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
                    <div className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600 dark:text-green-400" />
                        <div className="flex-1 text-sm">
                            <p className="font-medium text-green-800 dark:text-green-200">
                                Notaría encontrada en sistema legacy
                            </p>
                            <p className="mt-1 text-green-700 dark:text-green-300">
                                <strong>{selectedData.notaria_id}</strong> -{' '}
                                {formatNumber(selectedData.total_busquedas)}{' '}
                                búsquedas registradas
                            </p>
                            <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                                Primera búsqueda:{' '}
                                {formatDate(selectedData.primera_busqueda)} •
                                Última búsqueda:{' '}
                                {formatDate(selectedData.ultima_busqueda)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <p className="text-xs text-muted-foreground">
                Busca una notaría existente en el sistema legacy o deja vacío
                para crear una nueva sin historial.
            </p>
        </div>
    );
}
