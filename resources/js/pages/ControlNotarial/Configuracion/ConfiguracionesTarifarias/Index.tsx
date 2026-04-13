import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useApi } from '@/services/api';

import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';

interface ZonaMunicipio {
    id: number;
    descripcion: string;
    activo: boolean;
}

interface ConfiguracionTarifaria {
    id: number;
    descripcion: string;
    cuota_Fija_Pesos: number;
    cuota_Fija_UMA: number;
    salarios_Minimos: number;
    impuesto_Extra: number;
    porcentaje: number;
    rango?: string;
}

interface ConfiguracionEditada extends ConfiguracionTarifaria {
    tipoLleno?: 'cuota_pesos' | 'cuota_uma' | 'salarios' | 'impuesto' | 'porcentaje' | null;
}

export default function ConfiguracionesTarifariasIndex() {
    const api = useApi();
    const [zonasMunicipios, setZonasMunicipios] = useState<ZonaMunicipio[]>([]);
    const [selectedZona, setSelectedZona] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [configuracionesTarifarias, setConfiguracionesTarifarias] = useState<ConfiguracionEditada[]>([]);
    const [configuracionesHonorarios, setConfiguracionesHonorarios] = useState<ConfiguracionEditada[]>([]);
    const [loadingTarifas, setLoadingTarifas] = useState(false);
    const [loadingHonorarios, setLoadingHonorarios] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [savingConfigId, setSavingConfigId] = useState<number | null>(null);
    const [savingTab, setSavingTab] = useState<'tarifas' | 'honorarios' | null>(null);
    const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Control Notarial',
            href: '/admin/control-notarial',
        },
        {
            title: 'Configuración',
            href: '/admin/control-notarial/configuracion',
        },
        {
            title: 'Configuraciones Tarifarias',
            href: '/admin/control-notarial/configuraciones-tarifarias',
        },
    ];

    useEffect(() => {
        fetchZonasMunicipios();
    }, []);

    useEffect(() => {
        if (selectedZona) {
            fetchConfiguracionesTarifarias(selectedZona);
            fetchConfiguracionesHonorarios(selectedZona);
        }
    }, [selectedZona]);

    const fetchZonasMunicipios = async () => {
        setLoading(true);
        try {
            const data = await api.get('/Catalogos/GetZonasMunicipios');
            if (data && data.dataResponse) {
                setZonasMunicipios(data.dataResponse);
            } else {
                console.error('Error:', data?.message || 'No se pudieron cargar las zonas/municipios.');
            }
        } catch (error) {
            console.error('Error fetching zonas municipios:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchConfiguracionesTarifarias = async (zonaMunicipioId: string) => {
        setLoadingTarifas(true);
        try {
            const data = await api.get(`/ConfiguracionTarifaria/GetConfiguracionTarifariaImpuestosDerechos?zonaMunicipioId=${zonaMunicipioId}`);
            if (data && data.dataResponse) {
                const configuraciones = data.dataResponse.map((config: ConfiguracionTarifaria) => ({
                    ...config,
                    tipoLleno: null as ConfiguracionEditada['tipoLleno'],
                }));
                setConfiguracionesTarifarias(configuraciones);
            } else {
                setConfiguracionesTarifarias([]);
                console.error('Error:', data?.message || 'No se pudieron cargar las configuraciones tarifarias.');
            }
        } catch (error) {
            console.error('Error fetching configuraciones tarifarias:', error);
            setConfiguracionesTarifarias([]);
        } finally {
            setLoadingTarifas(false);
        }
    };

    const fetchConfiguracionesHonorarios = async (zonaMunicipioId: string) => {
        setLoadingHonorarios(true);
        try {
            const data = await api.get(`/ConfiguracionTarifaria/GetConfiguracionTarifariaHonorarios?zonaMunicipioId=${zonaMunicipioId}`);
            if (data && data.dataResponse) {
                const configuraciones = data.dataResponse.map((config: ConfiguracionTarifaria) => ({
                    ...config,
                    tipoLleno: null as ConfiguracionEditada['tipoLleno'],
                }));
                setConfiguracionesHonorarios(configuraciones);
            } else {
                setConfiguracionesHonorarios([]);
                console.error('Error:', data?.message || 'No se pudieron cargar los honorarios.');
            }
        } catch (error) {
            console.error('Error fetching configuraciones honorarios:', error);
            setConfiguracionesHonorarios([]);
        } finally {
            setLoadingHonorarios(false);
        }
    };

    const saveConfigurationToApi = async (config: ConfiguracionEditada, tab: 'tarifas' | 'honorarios' = 'tarifas') => {
        setSavingConfigId(config.id);
        try {
            const payload = {
                cuota_Fija_Pesos: config.cuota_Fija_Pesos,
                cuota_Fija_UMA: config.cuota_Fija_UMA,
                salarios_Minimos: config.salarios_Minimos,
                impuesto_Extra: config.impuesto_Extra,
                porcentaje: config.porcentaje,
            };

            const endpoint = tab === 'honorarios'
                ? `/ConfiguracionTarifaria/UpdateConfiguracionTarifariaHonorarios?configuracionId=${config.id}`
                : `/ConfiguracionTarifaria/UpdateConfiguracionTarifariaImpuestosDerechos?configuracionId=${config.id}`;

            await api.put(endpoint, payload);
            console.log(`Configuración ${config.id} guardada correctamente`);
        } catch (error) {
            console.error(`Error guardando configuración ${config.id}:`, error);
        } finally {
            setSavingConfigId(null);
        }
    };

    const handleInputChange = (id: number, field: string, value: string, tab: 'tarifas' | 'honorarios' = 'tarifas') => {
        const numValue = value === '' ? 0 : parseFloat(value) || 0;

        let updatedConfig: ConfiguracionEditada | null = null;
        const setterFunction = tab === 'honorarios' ? setConfiguracionesHonorarios : setConfiguracionesTarifarias;

        setterFunction(prev =>
            prev.map(config => {
                if (config.id === id) {
                    let tipoLleno: ConfiguracionEditada['tipoLleno'] = null;

                    // Si el usuario escribe un valor > 0, establecer ese tipo y limpiar otros
                    if (numValue > 0) {
                        if (field === 'cuota_Fija_Pesos') {
                            tipoLleno = 'cuota_pesos';
                        } else if (field === 'cuota_Fija_UMA') {
                            tipoLleno = 'cuota_uma';
                        } else if (field === 'salarios_Minimos') {
                            tipoLleno = 'salarios';
                        } else if (field === 'impuesto_Extra') {
                            tipoLleno = 'impuesto';
                        } else if (field === 'porcentaje') {
                            tipoLleno = 'porcentaje';
                        }

                        // Limpiar todos los campos excepto el que se está llenando
                        updatedConfig = {
                            ...config,
                            [field]: numValue,
                            tipoLleno: tipoLleno,
                            cuota_Fija_Pesos: field === 'cuota_Fija_Pesos' ? numValue : 0,
                            cuota_Fija_UMA: field === 'cuota_Fija_UMA' ? numValue : 0,
                            salarios_Minimos: field === 'salarios_Minimos' ? numValue : 0,
                            impuesto_Extra: field === 'impuesto_Extra' ? numValue : 0,
                            porcentaje: field === 'porcentaje' ? numValue : 0,
                        };
                        return updatedConfig;
                    } else {
                        // Si el usuario borra el valor (numValue = 0), habilitar todos los campos
                        updatedConfig = {
                            ...config,
                            [field]: numValue,
                            tipoLleno: null, // Permitir que se editen otros campos
                            cuota_Fija_Pesos: field === 'cuota_Fija_Pesos' ? 0 : config.cuota_Fija_Pesos,
                            cuota_Fija_UMA: field === 'cuota_Fija_UMA' ? 0 : config.cuota_Fija_UMA,
                            salarios_Minimos: field === 'salarios_Minimos' ? 0 : config.salarios_Minimos,
                            impuesto_Extra: field === 'impuesto_Extra' ? 0 : config.impuesto_Extra,
                            porcentaje: field === 'porcentaje' ? 0 : config.porcentaje,
                        };
                        return updatedConfig;
                    }
                }
                return config;
            })
        );

        // Debounce: Limpiar timeout anterior y crear uno nuevo
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Ejecutar la API después de 500ms de que el usuario deje de escribir
        saveTimeoutRef.current = setTimeout(() => {
            if (updatedConfig) {
                saveConfigurationToApi(updatedConfig, tab);
            }
        }, 500);
    };

    const handleSaveChanges = async () => {
        if (!selectedZona) return;

        setIsSaving(true);
        try {
            const payload = {
                zonaMunicipioId: parseInt(selectedZona),
                configuraciones: configuracionesTarifarias.map(config => ({
                    id: config.id,
                    descripcion: config.descripcion,
                    cuota_Fija_Pesos: config.cuota_Fija_Pesos,
                    cuota_Fija_UMA: config.cuota_Fija_UMA,
                    salarios_Minimos: config.salarios_Minimos,
                    impuesto_Extra: config.impuesto_Extra,
                    porcentaje: config.porcentaje,
                })),
            };

            await api.post('/ConfiguracionTarifaria/UpdateConfiguracionTarifaria', payload);
            console.log('Cambios guardados correctamente');
        } catch (error) {
            console.error('Error guardando cambios:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Configuraciones Tarifarias - Control Notarial" />

            <div className="min-h-screen space-y-6 p-6">

                {/* Zona Municipios Selector */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Seleccionar Zona/Municipio
                    </label>
                    <div className="flex gap-2 items-center">
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="size-5 animate-spin text-gray-500" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">Cargando zonas/municipios...</span>
                            </div>
                        ) : (
                            <select
                                value={selectedZona}
                                onChange={(e) => setSelectedZona(e.target.value)}
                                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                            >
                                <option value="">-- Seleccionar una opción --</option>
                                {zonasMunicipios.map((zona) => (
                                    <option key={zona.id} value={zona.id.toString()}>
                                        {zona.descripcion}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                {selectedZona && (
                    <div className="rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
                        <Tabs defaultValue="tramites" className="w-full">
                            <TabsList className="w-full rounded-t-lg bg-gray-100 dark:bg-gray-700">
                                <TabsTrigger value="tramites" className="flex-1">
                                    Impuestos y Derechos
                                </TabsTrigger>
                                <TabsTrigger value="honorarios" className="flex-1">
                                    Honorarios
                                </TabsTrigger>
                                <TabsTrigger value="cotejos" className="flex-1">
                                    Cotejos
                                </TabsTrigger>
                            </TabsList>

                            {/* Trámites Tab */}
                            <TabsContent value="tramites" className="space-y-4">

                                {/* Tabla */}
                                <div className="px-6 pb-6">
                                    {loadingTarifas ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                            <p className="text-muted-foreground">Cargando configuraciones tarifarias...</p>
                                        </div>
                                    ) : configuracionesTarifarias.length === 0 ? (
                                        <div className="border rounded-lg p-6 text-center text-muted-foreground">
                                            No hay configuraciones tarifarias para esta zona/municipio
                                        </div>
                                    ) : (
                                        <div className="border rounded-lg overflow-hidden">
                                            <div className="overflow-x-auto max-h-[750px] overflow-y-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="sticky top-0 z-10 bg-slate-400 dark:bg-slate-800 border-b uppercase">
                                                        <tr>
                                                            <th className="px-4 py-2 text-left font-semibold w-16">ID</th>
                                                            <th className="px-4 py-2 text-left font-semibold w-40">Impuesto y Derecho</th>
                                                            <th className="px-4 py-2 text-center font-semibold w-36">Cuota Fija Pesos</th>
                                                            <th className="px-4 py-2 text-center font-semibold w-36">Cuota Fija UMA</th>
                                                            <th className="px-4 py-2 text-center font-semibold w-36">Salarios Mínimos</th>
                                                            <th className="px-4 py-2 text-center font-semibold w-32">Impuesto Extra</th>
                                                            <th className="px-4 py-2 text-center font-semibold w-24">Porcentaje %</th>
                                                            <th className="px-4 py-2 text-center font-semibold w-28">Rango</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {configuracionesTarifarias.map((config) => (
                                                            <tr key={config.id} className="border-b hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                                                                <td className="px-4 py-3 font-mono text-sm text-blue-500 dark:text-blue-400">{config.id}</td>
                                                                <td className="px-4 py-3">{config.descripcion}</td>
                                                                <td className="px-4 py-2 text-center relative">
                                                                    <div className="relative">
                                                                        <Input
                                                                            type="number"
                                                                            min="0"
                                                                            step="1"
                                                                            value={config.cuota_Fija_Pesos}
                                                                            onChange={(e) => handleInputChange(config.id, 'cuota_Fija_Pesos', e.target.value)}
                                                                            className="w-full h-8 text-xs text-center"
                                                                        />
                                                                        {savingConfigId === config.id && (
                                                                            <Loader2 className="absolute right-1 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-2 text-center relative">
                                                                    <div className="relative">
                                                                        <Input
                                                                            type="number"
                                                                            min="0"
                                                                            step="1"
                                                                            value={config.cuota_Fija_UMA}
                                                                            onChange={(e) => handleInputChange(config.id, 'cuota_Fija_UMA', e.target.value)}
                                                                            className="w-full h-8 text-xs text-center"
                                                                        />
                                                                        {savingConfigId === config.id && (
                                                                            <Loader2 className="absolute right-1 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-2 text-center relative">
                                                                    <div className="relative">
                                                                        <Input
                                                                            type="number"
                                                                            min="0"
                                                                            step="1"
                                                                            value={config.salarios_Minimos}
                                                                            onChange={(e) => handleInputChange(config.id, 'salarios_Minimos', e.target.value)}
                                                                            className="w-full h-8 text-xs text-center"
                                                                        />
                                                                        {savingConfigId === config.id && (
                                                                            <Loader2 className="absolute right-1 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-2 text-center relative">
                                                                    <div className="relative">
                                                                        <Input
                                                                            type="number"
                                                                            min="0"
                                                                            step="1"
                                                                            value={config.impuesto_Extra}
                                                                            onChange={(e) => handleInputChange(config.id, 'impuesto_Extra', e.target.value)}
                                                                            className="w-full h-8 text-xs text-center"
                                                                        />
                                                                        {savingConfigId === config.id && (
                                                                            <Loader2 className="absolute right-1 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-2 text-center relative">
                                                                    <div className="relative">
                                                                        <Input
                                                                            type="number"
                                                                            min="0"
                                                                            max="100"
                                                                            step="1"
                                                                            value={config.porcentaje}
                                                                            onChange={(e) => handleInputChange(config.id, 'porcentaje', e.target.value)}
                                                                            className="w-full h-8 text-xs text-center"
                                                                        />
                                                                        {savingConfigId === config.id && (
                                                                            <Loader2 className="absolute right-1 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-2 text-center">
                                                                    <select
                                                                        disabled
                                                                        className="w-full h-8 text-xs text-center bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded cursor-not-allowed opacity-70"
                                                                        defaultValue={config.rango || ''}
                                                                    >
                                                                        <option value="">--</option>
                                                                        <option value="Básico">Básico</option>
                                                                        <option value="Intermedio">Intermedio</option>
                                                                        <option value="Avanzado">Avanzado</option>
                                                                    </select>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            {/* Honorarios Tab */}
                            <TabsContent value="honorarios" className="space-y-4">

                                {/* Tabla */}
                                <div className="px-6 pb-6">
                                    {loadingHonorarios ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                            <p className="text-muted-foreground">Cargando configuraciones de honorarios...</p>
                                        </div>
                                    ) : configuracionesHonorarios.length === 0 ? (
                                        <div className="border rounded-lg p-6 text-center text-muted-foreground">
                                            No hay configuraciones de honorarios para esta zona/municipio
                                        </div>
                                    ) : (
                                        <div className="border rounded-lg overflow-hidden">
                                            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="sticky top-0 z-10 bg-slate-400 dark:bg-slate-800 border-b uppercase">
                                                        <tr>
                                                            <th className="px-4 py-2 text-left font-semibold w-16">ID</th>
                                                            <th className="px-4 py-2 text-left font-semibold w-40">Honorario</th>
                                                            <th className="px-4 py-2 text-center font-semibold w-36">Cuota Fija Pesos</th>
                                                            <th className="px-4 py-2 text-center font-semibold w-36">Cuota Fija UMA</th>
                                                            <th className="px-4 py-2 text-center font-semibold w-36">Salarios Mínimos</th>
                                                            <th className="px-4 py-2 text-center font-semibold w-32">Impuesto Extra</th>
                                                            <th className="px-4 py-2 text-center font-semibold w-24">Porcentaje %</th>
                                                            <th className="px-4 py-2 text-center font-semibold w-28">Rango</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {configuracionesHonorarios.map((config) => (
                                                            <tr key={config.id} className="border-b hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                                                                <td className="px-4 py-3 font-mono text-sm text-blue-500 dark:text-blue-400">{config.id}</td>
                                                                <td className="px-4 py-3">{config.descripcion}</td>
                                                                <td className="px-4 py-2 text-center relative">
                                                                    <div className="relative">
                                                                        <Input
                                                                            type="number"
                                                                            min="0"
                                                                            step="1"
                                                                            value={config.cuota_Fija_Pesos}
                                                                            onChange={(e) => handleInputChange(config.id, 'cuota_Fija_Pesos', e.target.value, 'honorarios')}
                                                                            className="w-full h-8 text-xs text-center"
                                                                        />
                                                                        {savingConfigId === config.id && (
                                                                            <Loader2 className="absolute right-1 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-2 text-center relative">
                                                                    <div className="relative">
                                                                        <Input
                                                                            type="number"
                                                                            min="0"
                                                                            step="1"
                                                                            value={config.cuota_Fija_UMA}
                                                                            onChange={(e) => handleInputChange(config.id, 'cuota_Fija_UMA', e.target.value, 'honorarios')}
                                                                            className="w-full h-8 text-xs text-center"
                                                                        />
                                                                        {savingConfigId === config.id && (
                                                                            <Loader2 className="absolute right-1 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-2 text-center relative">
                                                                    <div className="relative">
                                                                        <Input
                                                                            type="number"
                                                                            min="0"
                                                                            step="1"
                                                                            value={config.salarios_Minimos}
                                                                            onChange={(e) => handleInputChange(config.id, 'salarios_Minimos', e.target.value, 'honorarios')}
                                                                            className="w-full h-8 text-xs text-center"
                                                                        />
                                                                        {savingConfigId === config.id && (
                                                                            <Loader2 className="absolute right-1 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-2 text-center relative">
                                                                    <div className="relative">
                                                                        <Input
                                                                            type="number"
                                                                            min="0"
                                                                            step="1"
                                                                            value={config.impuesto_Extra}
                                                                            onChange={(e) => handleInputChange(config.id, 'impuesto_Extra', e.target.value, 'honorarios')}
                                                                            className="w-full h-8 text-xs text-center"
                                                                        />
                                                                        {savingConfigId === config.id && (
                                                                            <Loader2 className="absolute right-1 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-2 text-center relative">
                                                                    <div className="relative">
                                                                        <Input
                                                                            type="number"
                                                                            min="0"
                                                                            max="100"
                                                                            step="1"
                                                                            value={config.porcentaje}
                                                                            onChange={(e) => handleInputChange(config.id, 'porcentaje', e.target.value, 'honorarios')}
                                                                            className="w-full h-8 text-xs text-center"
                                                                        />
                                                                        {savingConfigId === config.id && (
                                                                            <Loader2 className="absolute right-1 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-2 text-center">
                                                                    <select
                                                                        disabled
                                                                        className="w-full h-8 text-xs text-center bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded cursor-not-allowed opacity-70"
                                                                        defaultValue={config.rango || ''}
                                                                    >
                                                                        <option value="">--</option>
                                                                        <option value="Básico">Básico</option>
                                                                        <option value="Intermedio">Intermedio</option>
                                                                        <option value="Avanzado">Avanzado</option>
                                                                    </select>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            {/* Cotejos Tab */}
                            <TabsContent value="cotejos" className="p-6">
                                <p className="text-gray-600 dark:text-gray-400">
                                    Contenido de Cotejos próximamente...
                                </p>
                            </TabsContent>
                        </Tabs>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
