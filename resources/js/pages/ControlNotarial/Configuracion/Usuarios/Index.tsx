import { Head } from '@inertiajs/react';
import { X, Plus, AlertCircle, Search, Loader2, Users } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { useToast } from '@/contexts/ToastContext';

import type { BreadcrumbItem } from '@/types';

interface UsuarioData {
    id?: string | number;
    iniciales: string;
    rol: string;
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string;
    correo: string;
    usuario: string;
    contraseña: string;
    curp: string;
    rfc: string;
    numero_notaria: string;
    adscripcion: string;
    tipo: string;
    procedencia: string;
    observaciones: string;
    activo: boolean;
}

interface UsuarioBusqueda {
    id: number;
    nombre: string;
    apellido_Paterno: string;
    apellido_Materno: string;
    usuario: string;
    rol: string;
    iniciales: string;
    observaciones: string | null;
    activo: boolean;
}

interface Rol {
    id: string | number;
    nombre: string;
}

const defaultUsuarioData: UsuarioData = {
    iniciales: '',
    rol: '',
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    correo: '',
    usuario: '',
    contraseña: '',
    curp: '',
    rfc: '',
    numero_notaria: '',
    adscripcion: '',
    tipo: '',
    procedencia: '',
    observaciones: '',
    activo: true,
};

export default function ControlNotarialUsuarios() {
    // --- Estado pestaña Búsqueda ---
    const [filtro, setFiltro] = useState('');
    const [resultados, setResultados] = useState<UsuarioBusqueda[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    // --- Control de pestaña activa ---
    const [activeTab, setActiveTab] = useState('busqueda');

    // --- Estado pestaña Formulario ---
    const [roles, setRoles] = useState<Rol[]>([]);
    const [formData, setFormData] = useState<UsuarioData>(defaultUsuarioData);
    const [isLoadingRoles, setIsLoadingRoles] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [cambiarContraseña, setCambiarContraseña] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const { addToast } = useToast();

    // Cargar usuarios al montar (filtro vacío = todos)
    useEffect(() => {
        fetchUsuarios('');
    }, []);

    // Cargar roles al montar
    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const response = await fetch('https://localhost:44327/api/Catalogos/GetRoles', {
                    headers: { 'Content-Type': 'application/json' },
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data?.message || 'Error al obtener los roles');
                }
                setRoles(data.dataResponse || []);
            } catch (error) {
                console.error('Error cargando roles:', error);
                const message = error instanceof Error ? error.message : 'Error al cargar los roles';
                addToast(message, 'error');
            } finally {
                setIsLoadingRoles(false);
            }
        };
        fetchRoles();
    }, []);

    const fetchUsuarios = async (filtroValue: string) => {
        setIsSearching(true);
        setSearchError(null);
        try {
            const url = new URL('https://localhost:44327/api/User/GetUsuarios');
            url.searchParams.append('filtro', filtroValue);
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();

            // Si response.ok (200-299), mostrar datos
            if (response.ok) {
                setResultados(data.dataResponse || []);
            } else {
                // Si es 400 u otro error, pero la API devolvió un mensaje, mostrar ese mensaje
                // (ej: "No hay usuarios que coincidan con: 324")
                setSearchError(data.message || 'No se pudieron cargar los usuarios.');
                setResultados([]);
            }
        } catch (error) {
            console.error('Error buscando usuarios:', error);
            setSearchError('No se pudieron cargar los usuarios. Verifica la conexión con el servidor.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchUsuarios(filtro);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddUsuario = async () => {
        if (!formData.nombre || !formData.apellido_paterno || !formData.apellido_materno ||
            !formData.usuario || !formData.iniciales ) {
            addToast('Completa los campos obligatorios: Nombre, Apellidos, Usuario e Iniciales', 'error');
            return;
        }

        if (isEditing && formData.id) {
            try {
                setIsSaving(true);
                setSaveError(null);
                const response = await fetch(
                    `https://localhost:44327/api/User/UpdateUsuario?usuarioId=${formData.id}`,
                    {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            nombre: formData.nombre,
                            apellido_Paterno: formData.apellido_paterno,
                            apellido_Materno: formData.apellido_materno,
                            correo: formData.correo,
                            usuario: formData.usuario,
                            contrasena: formData.contraseña,
                            curp: formData.curp,
                            rfc: formData.rfc,
                            rol_Id: formData.rol ? Number(formData.rol) : 0,
                            iniciales: formData.iniciales,
                            numero_Notaria: formData.numero_notaria,
                            adscripcion: formData.adscripcion,
                            tipo: formData.tipo,
                            procedencia: formData.procedencia,
                            observaciones: formData.observaciones,
                            activo: formData.activo,
                        }),
                    }
                );

                const resData = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(resData?.message || resData?.dataResponse?.message || 'Error al actualizar el usuario');
                }

                addToast(resData?.message || resData?.dataResponse?.message || 'Usuario actualizado correctamente', 'success');
                setFormData(defaultUsuarioData);
                setIsEditing(false);
                setActiveTab('busqueda');
                fetchUsuarios(filtro);
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Error al actualizar';
                setSaveError(message);
                addToast(message, 'error');
            } finally {
                setIsSaving(false);
            }
        } else {
            try {
                setIsSaving(true);
                setSaveError(null);
                const response = await fetch(
                    'https://localhost:44327/api/User/CreateUsuario',
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            nombre: formData.nombre,
                            apellido_Paterno: formData.apellido_paterno,
                            apellido_Materno: formData.apellido_materno,
                            correo: formData.correo,
                            usuario: formData.usuario,
                            contrasena: formData.contraseña,
                            curp: formData.curp,
                            rfc: formData.rfc,
                            rol_Id: formData.rol ? Number(formData.rol) : 0,
                            iniciales: formData.iniciales,
                            numero_Notaria: formData.numero_notaria,
                            adscripcion: formData.adscripcion,
                            tipo: formData.tipo,
                            procedencia: formData.procedencia,
                            observaciones: formData.observaciones,
                            activo: formData.activo,
                        }),
                    }
                );

                const resData = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(resData?.message || resData?.dataResponse?.message || 'Error al crear el usuario');
                }

                addToast(resData?.message || resData?.dataResponse?.message || 'Usuario creado correctamente', 'success');
                setFormData(defaultUsuarioData);
                setIsEditing(false);
                setActiveTab('busqueda');
                fetchUsuarios(filtro);
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Error al crear';
                setSaveError(message);
                addToast(message, 'error');
            } finally {
                setIsSaving(false);
            }
        }
    };

    const [isLoadingUsuario, setIsLoadingUsuario] = useState(false);

    const handleSelectUsuario = async (usuario: UsuarioBusqueda) => {
        setIsLoadingUsuario(true);
        setIsEditing(true);
        setCambiarContraseña(false);
        setSaveError(null);
        setActiveTab('formulario');
        try {
            const response = await fetch(
                `https://localhost:44327/api/User/GetUsuarioById?usuarioId=${usuario.id}`,
                { headers: { 'Content-Type': 'application/json' } }
            );
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.message || 'Error al obtener el usuario');
            }
            const u = data.dataResponse;
            setFormData({
                id: u.id,
                iniciales: u.iniciales ?? '',
                rol: u.rol_Id != null ? String(u.rol_Id) : '',
                nombre: u.nombre ?? '',
                apellido_paterno: u.apellido_Paterno ?? '',
                apellido_materno: u.apellido_Materno ?? '',
                correo: u.correo ?? '',
                usuario: u.usuario ?? '',
                contraseña: '',
                curp: u.curp ?? '',
                rfc: u.rfc ?? '',
                numero_notaria: u.numero_Notaria ?? '',
                adscripcion: u.adscripcion ?? '',
                tipo: u.tipo ?? '',
                procedencia: u.procedencia ?? '',
                observaciones: u.observaciones ?? '',
                activo: u.activo,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error al cargar el usuario';
            addToast(message, 'error');
            setIsEditing(false);
            setActiveTab('busqueda');
        } finally {
            setIsLoadingUsuario(false);
        }
    };

    const handleCancelEdit = () => {
        setFormData(defaultUsuarioData);
        setIsEditing(false);
        setCambiarContraseña(false);
        setSaveError(null);
        setActiveTab('busqueda');
    };

    const handleSave = async () => {
        // handleAddUsuario ya maneja el guardado
        await handleAddUsuario();
    };

    // Componente de Label para campos requeridos
    const RequiredLabel = ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
        <label htmlFor={htmlFor} className="text-sm font-medium flex items-center gap-1">
            {children}
            <span className="text-red-500">*</span>
        </label>
    );

    return (
        <>
            <Head title="Usuarios - Control Notarial" />

            <div className="space-y-6 px-6 pt-6">

                                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2 bg-transparent">
                        <TabsTrigger value="busqueda" className="gap-2 data-[state=active]:shadow-neutral-800">
                            <Search className="size-4" />
                            <span className="hidden sm:inline">Búsqueda</span>
                        </TabsTrigger>
                        <TabsTrigger value="formulario" className="gap-2 data-[state=active]:shadow-neutral-800">
                            <Plus className="size-4" />
                            <span className="hidden sm:inline">
                                {isEditing ? 'Editar Usuario' : 'Crear Usuario'}
                            </span>
                        </TabsTrigger>
                    </TabsList>

                    {/* ── PESTAÑA 1: BÚSQUEDA ── */}
                    <TabsContent value="busqueda" className="space-y-4">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <div className="relative flex-1 max-w-sm">
                                <Input
                                    value={filtro}
                                    onChange={(e) => setFiltro(e.target.value)}
                                    placeholder="Buscar por nombre, usuario, rol..."
                                    className="pr-10"
                                />
                                {filtro && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFiltro('');
                                            setSearchError(null);
                                            setResultados([]);
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        title="Limpiar búsqueda"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                            <Button type="submit" disabled={isSearching} className="bg-amber-600 hover:bg-amber-700">
                                {isSearching ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Search className="h-4 w-4" />
                                )}
                                <span className="ml-2">Buscar</span>
                            </Button>
                        </form>

                        {searchError && (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-md border bg-red-50 border-red-200 text-red-800">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <span>{searchError}</span>
                            </div>
                        )}

                        <div className="border rounded-lg overflow-hidden">
                            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-200 dark:bg-slate-700 border-b">
                                        <tr>
                                            <th className="px-4 py-2 text-left font-semibold w-16">ID</th>
                                            <th className="px-4 py-2 text-left font-semibold">Nombre</th>
                                            <th className="px-4 py-2 text-left font-semibold">Usuario</th>
                                            <th className="px-4 py-2 text-left font-semibold">Rol</th>
                                            <th className="px-4 py-2 text-center font-semibold w-20">Activo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isSearching ? (
                                            <tr>
                                                <td colSpan={5} className="text-center py-8 text-muted-foreground px-4">
                                                    <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                                                    Cargando usuarios...
                                                </td>
                                            </tr>
                                        ) : resultados.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="text-center py-8 text-muted-foreground px-4">
                                                    No se encontraron usuarios.
                                                </td>
                                            </tr>
                                        ) : (
                                            resultados.map((usuario) => (
                                                <tr
                                                    key={usuario.id}
                                                    className="border-b hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                                                    onClick={() => handleSelectUsuario(usuario)}
                                                >
                                                    <td className="px-4 py-2 font-mono text-sm">{usuario.id}</td>
                                                    <td className="px-4 py-2">{[usuario.nombre, usuario.apellido_Paterno, usuario.apellido_Materno].filter(Boolean).join(' ')}</td>
                                                    <td className="px-4 py-2 font-mono text-sm">{usuario.usuario}</td>
                                                    <td className="px-4 py-2">{usuario.rol}</td>
                                                    <td className="px-4 py-2 text-center">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            usuario.activo
                                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                        }`}>
                                                            {usuario.activo ? 'Sí' : 'No'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        {!isSearching && resultados.length > 0 && (
                            <p className="text-sm text-muted-foreground">
                                {resultados.length} usuario(s) encontrado(s) — <span className="text-amber-600">haz clic en un usuario para editarlo</span>
                            </p>
                        )}
                    </TabsContent>

                    {/* ── PESTAÑA 2: FORMULARIO ── */}
                    <TabsContent value="formulario">
                        {isLoadingRoles || isLoadingUsuario ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                <p className="text-muted-foreground">
                                    {isLoadingUsuario ? 'Cargando datos del usuario...' : 'Cargando datos...'}
                                </p>
                            </div>
                        ) : (
                            <div className="border rounded-lg p-6 space-y-6 bg-background/50 backdrop-blur-sm">
                                {saveError && (
                                    <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
                                        {saveError}
                                    </div>
                                )}

                                {/* Fila 1: Iniciales, Rol */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <RequiredLabel htmlFor="iniciales">Iniciales</RequiredLabel>
                                        <Input
                                            id="iniciales"
                                            name="iniciales"
                                            value={formData.iniciales}
                                            onChange={handleInputChange}
                                            placeholder="Ej. JDM"
                                            maxLength={10}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <RequiredLabel htmlFor="rol">Rol</RequiredLabel>
                                        <Select
                                            value={formData.rol}
                                            onValueChange={(value) => handleSelectChange('rol', value)}
                                        >
                                            <SelectTrigger id="rol">
                                                <SelectValue placeholder="Selecciona un rol" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {roles.map((role) => (
                                                    <SelectItem key={role.id} value={String(role.id)}>
                                                        {role.nombre}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Fila 2: Nombre, Apellido Paterno, Apellido Materno */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <RequiredLabel htmlFor="nombre">Nombre</RequiredLabel>
                                        <Input
                                            id="nombre"
                                            name="nombre"
                                            value={formData.nombre}
                                            onChange={handleInputChange}
                                            placeholder="Nombre"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <RequiredLabel htmlFor="apellido_paterno">Apellido Paterno</RequiredLabel>
                                        <Input
                                            id="apellido_paterno"
                                            name="apellido_paterno"
                                            value={formData.apellido_paterno}
                                            onChange={handleInputChange}
                                            placeholder="Apellido Paterno"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <RequiredLabel htmlFor="apellido_materno">Apellido Materno</RequiredLabel>
                                        <Input
                                            id="apellido_materno"
                                            name="apellido_materno"
                                            value={formData.apellido_materno}
                                            onChange={handleInputChange}
                                            placeholder="Apellido Materno"
                                        />
                                    </div>
                                </div>

                                {/* Fila 3: Correo, Usuario */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="correo" className="text-sm font-medium">Correo</label>
                                        <Input
                                            id="correo"
                                            name="correo"
                                            type="email"
                                            value={formData.correo}
                                            onChange={handleInputChange}
                                            placeholder="correo@example.com"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <RequiredLabel htmlFor="usuario">Usuario</RequiredLabel>
                                        <Input
                                            id="usuario"
                                            name="usuario"
                                            value={formData.usuario}
                                            onChange={handleInputChange}
                                            placeholder="usuario"
                                        />
                                    </div>
                                </div>

                                {/* Fila Contraseña */}
                                {isEditing ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="cambiarContraseña"
                                                checked={cambiarContraseña}
                                                onChange={(e) => setCambiarContraseña(e.target.checked)}
                                                className="rounded border-gray-300 cursor-pointer"
                                            />
                                            <label htmlFor="cambiarContraseña" className="text-sm font-medium cursor-pointer">
                                                Cambiar contraseña
                                            </label>
                                        </div>
                                        {cambiarContraseña && (
                                            <div className="space-y-2">
                                                <RequiredLabel htmlFor="contraseña">Nueva Contraseña</RequiredLabel>
                                                <Input
                                                    id="contraseña"
                                                    name="contraseña"
                                                    type="password"
                                                    value={formData.contraseña}
                                                    onChange={handleInputChange}
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <RequiredLabel htmlFor="contraseña">Contraseña</RequiredLabel>
                                        <Input
                                            id="contraseña"
                                            name="contraseña"
                                            type="password"
                                            value={formData.contraseña}
                                            onChange={handleInputChange}
                                            placeholder="••••••••"
                                        />
                                    </div>
                                )}

                                {/* Fila 4: CURP, RFC */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="curp" className="text-sm font-medium">CURP</label>
                                        <Input
                                            id="curp"
                                            name="curp"
                                            value={formData.curp}
                                            onChange={handleInputChange}
                                            placeholder="CURP"
                                            maxLength={18}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="rfc" className="text-sm font-medium">RFC</label>
                                        <Input
                                            id="rfc"
                                            name="rfc"
                                            value={formData.rfc}
                                            onChange={handleInputChange}
                                            placeholder="RFC"
                                            maxLength={13}
                                        />
                                    </div>
                                </div>

                                {/* Fila 5: Adscripción, Tipo, Procedencia */}
                                <div className="grid grid-cols-3 gap-3">

                                    <div className="space-y-2">
                                        <label htmlFor="adscripcion" className="text-sm font-medium">Adscripción</label>
                                        <Input
                                            id="adscripcion"
                                            name="adscripcion"
                                            value={formData.adscripcion}
                                            onChange={handleInputChange}
                                            placeholder="Adscripción"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="tipo" className="text-sm font-medium">Tipo</label>
                                        <Input
                                            id="tipo"
                                            name="tipo"
                                            value={formData.tipo}
                                            onChange={handleInputChange}
                                            placeholder="Tipo"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="procedencia" className="text-sm font-medium">Procedencia</label>
                                        <Input
                                            id="procedencia"
                                            name="procedencia"
                                            value={formData.procedencia}
                                            onChange={handleInputChange}
                                            placeholder="Procedencia"
                                        />
                                    </div>
                                </div>

                                {/* Fila 6: Observaciones */}
                                <div className="space-y-2">
                                    <label htmlFor="observaciones" className="text-sm font-medium">Observaciones</label>
                                    <textarea
                                        id="observaciones"
                                        name="observaciones"
                                        value={formData.observaciones}
                                        onChange={handleInputChange}
                                        placeholder="Observaciones adicionales"
                                        rows={4}
                                        className="w-full px-3 py-2 border rounded-md bg-background border-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>

                                {/* Fila 7: Activo */}
                                <div className="flex items-center space-x-2">
                                    <input
                                        id="activo"
                                        name="activo"
                                        type="checkbox"
                                        checked={formData.activo}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 border border-primary rounded"
                                    />
                                    <label htmlFor="activo" className="text-sm font-medium cursor-pointer">Activo</label>
                                </div>

                                {/* Botones */}
                                <div className="flex gap-2 justify-end pt-4 border-t">
                                    {isEditing && (
                                        <Button variant="outline" onClick={handleCancelEdit}>
                                            <X className="h-4 w-4 mr-2" />
                                            Cancelar
                                        </Button>
                                    )}
                                    <Button
                                        onClick={handleAddUsuario}
                                        disabled={isSaving}
                                        className="bg-amber-600 hover:bg-amber-700"
                                    >
                                        {isSaving ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <Plus className="h-4 w-4 mr-2" />
                                        )}
                                        {isEditing ? 'Actualizar' : 'Guardar'} Usuario
                                    </Button>
                                </div>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}

ControlNotarialUsuarios.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Control Notarial', href: '/admin/control-notarial' },
        { title: 'Configuración', href: '/admin/control-notarial/configuracion' },
        { title: 'Usuarios', href: '/admin/control-notarial/usuarios' },
    ]}>
        {page}
    </AppLayout>
);


