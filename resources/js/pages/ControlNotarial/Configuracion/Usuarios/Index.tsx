import { Head } from '@inertiajs/react';
import { X, Plus, AlertCircle, Search, Loader2, Users, Lock, Shield, FileText, Clock, CheckCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';import { useApi } from '@/services/api';
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
const api = useApi();

    // Cargar usuarios al montar (filtro vacío = todos)
    useEffect(() => {
        fetchUsuarios('');
    }, []);

    // Cargar roles al montar
    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const data = await api.get('/Catalogos/GetRoles');
                if (data && data.dataResponse) {
                    setRoles(data.dataResponse || []);
                } else {
                    throw new Error(data?.message || 'Error al obtener los roles');
                }
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
            let endpoint = '/User/GetUsuarios';
            if (filtroValue) {
                endpoint += `?filtro=${encodeURIComponent(filtroValue)}`;
            }
            const data = await api.get(endpoint);

            // Si data existe, mostrar datos
            if (data && data.dataResponse) {
                setResultados(data.dataResponse || []);
            } else {
                // Si la API devolvió un mensaje, mostrar ese mensaje
                setSearchError(data?.message || 'No se pudieron cargar los usuarios.');
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
                const payload = {
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
                };
                const resData = await api.put(`/User/UpdateUsuario?usuarioId=${formData.id}`, payload);

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
                const payload = {
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
                };
                const resData = await api.post('/User/CreateUsuario', payload);

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
            const data = await api.get(`/User/GetUsuarioById?usuarioId=${usuario.id}`);
            if (!data || !data.dataResponse) {
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
                                    className="bg-white pr-10"
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
                            <Button type="submit" disabled={isSearching} className="bg-blue-600 hover:bg-blue-700">
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

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {isSearching ? (
                                <div className="col-span-full text-center py-8 text-muted-foreground">
                                    <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                                    Cargando usuarios...
                                </div>
                            ) : resultados.length === 0 ? (
                                <div className="col-span-full text-center py-8 text-muted-foreground">
                                    No se encontraron usuarios.
                                </div>
                            ) : (
                                resultados.map((usuario) => (
                                    <div
                                        key={usuario.id}
                                        onClick={() => handleSelectUsuario(usuario)}
                                        className="border-2 border-gray-200 rounded-lg p-5 bg-white shadow-sm hover:shadow-lg hover:border-blue-400 transition-all cursor-pointer space-y-4"
                                    >
                                        {/* Avatar + Info Básica */}
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-600 text-white font-bold text-lg">
                                                {usuario.iniciales}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-bold text-gray-900 truncate">
                                                    {[usuario.nombre, usuario.apellido_Paterno, usuario.apellido_Materno].filter(Boolean).join(' ')}
                                                </h3>
                                                <p className="text-xs text-gray-500 truncate">ID: {usuario.id}</p>
                                            </div>
                                        </div>

                                        {/* Divider */}
                                        <div className="border-t border-gray-200"></div>

                                        {/* Detalles */}
                                        <div className="space-y-2">
                                            <div>
                                                <p className="text-xs text-gray-500">Usuario</p>
                                                <p className="text-sm font-mono font-semibold text-gray-900">{usuario.usuario}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Rol</p>
                                                <p className="text-sm font-semibold text-gray-900">{usuario.rol}</p>
                                            </div>
                                        </div>

                                        {/* estado Badge */}
                                        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                usuario.activo
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {usuario.activo ? '✓ Activo' : '✕ Inactivo'}
                                            </span>
                                            <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors">
                                                Editar →
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        {!isSearching && resultados.length > 0 && (
                            <p className="text-sm text-muted-foreground mb-4">
                                {resultados.length} usuario(s) encontrado(s) — <span className="text-blue-600 font-semibold">haz clic en un usuario para editarlo</span>
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
                            <div className="space-y-6">
                                {saveError && (
                                    <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
                                        {saveError}
                                    </div>
                                )}

                                {/* ──── SECCIÓN 1: DATOS PERSONALES ──── */}
                                <div className="border-2 border-blue-200 rounded-lg p-5 bg-gradient-to-br from-blue-50 to-white shadow-sm hover:shadow-md transition-shadow space-y-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="bg-blue-600 text-white p-3 rounded-lg">
                                            <Users className="h-5 w-5" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">Datos Personales</h3>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <RequiredLabel htmlFor="nombre">Nombre</RequiredLabel>
                                            <Input
                                                id="nombre"
                                                name="nombre"
                                                value={formData.nombre}
                                                onChange={handleInputChange}
                                                placeholder="Nombre"
                                                className="bg-white"
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
                                                className="bg-white"
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
                                                className="bg-white"
                                            />
                                        </div>
                                    </div>
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
                                                className="bg-white"
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
                                                className="bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* ──── SECCIÓN 2: DATOS DE ACCESO ──── */}
                                <div className="border-2 border-purple-200 rounded-lg p-5 bg-gradient-to-br from-purple-50 to-white shadow-sm hover:shadow-md transition-shadow space-y-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="bg-purple-600 text-white p-3 rounded-lg">
                                            <Lock className="h-5 w-5" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">Datos de Acceso</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <RequiredLabel htmlFor="usuario">Usuario</RequiredLabel>
                                            <Input
                                                id="usuario"
                                                name="usuario"
                                                value={formData.usuario}
                                                onChange={handleInputChange}
                                                placeholder="usuario"
                                                className="bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="correo" className="text-sm font-medium">Correo</label>
                                            <Input
                                                id="correo"
                                                name="correo"
                                                type="email"
                                                value={formData.correo}
                                                onChange={handleInputChange}
                                                placeholder="correo@example.com"
                                                className="bg-white"
                                            />
                                        </div>
                                    </div>

                                    {isEditing ? (
                                        <div className="space-y-3 col-span-2">
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
                                                        className="bg-white"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-2 col-span-2">
                                            <RequiredLabel htmlFor="contraseña">Contraseña</RequiredLabel>
                                            <Input
                                                id="contraseña"
                                                name="contraseña"
                                                type="password"
                                                value={formData.contraseña}
                                                onChange={handleInputChange}
                                                placeholder="••••••••"
                                                className="bg-white"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* ──── SECCIÓN 3: ROL E IDENTIFICACIÓN ──── */}
                                <div className="border-2 border-indigo-200 rounded-lg p-5 bg-gradient-to-br from-indigo-50 to-white shadow-sm hover:shadow-md transition-shadow space-y-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="bg-indigo-600 text-white p-3 rounded-lg">
                                            <Shield className="h-5 w-5" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">Rol e Identificación</h3>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
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
                                        <div className="space-y-2">
                                            <RequiredLabel htmlFor="iniciales">Iniciales</RequiredLabel>
                                            <Input
                                                id="iniciales"
                                                name="iniciales"
                                                value={formData.iniciales}
                                                onChange={handleInputChange}
                                                placeholder="Ej. JDM"
                                                maxLength={10}
                                                className="bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="numero_notaria" className="text-sm font-medium">Número Notaría</label>
                                            <Input
                                                id="numero_notaria"
                                                name="numero_notaria"
                                                value={formData.numero_notaria}
                                                onChange={handleInputChange}
                                                placeholder="Número"
                                                className="bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* ──── SECCIÓN 4: INFORMACIÓN ADMINISTRATIVA ──── */}
                                <div className="border-2 border-amber-200 rounded-lg p-5 bg-gradient-to-br from-amber-50 to-white shadow-sm hover:shadow-md transition-shadow space-y-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="bg-amber-600 text-white p-3 rounded-lg">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">Información Administrativa</h3>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <label htmlFor="adscripcion" className="text-sm font-medium">Adscripción</label>
                                            <Input
                                                id="adscripcion"
                                                name="adscripcion"
                                                value={formData.adscripcion}
                                                onChange={handleInputChange}
                                                placeholder="Adscripción"
                                                className="bg-white"
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
                                                className="bg-white"
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
                                                className="bg-white"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="observaciones" className="text-sm font-medium">Observaciones</label>
                                        <textarea
                                            id="observaciones"
                                            name="observaciones"
                                            value={formData.observaciones}
                                            onChange={handleInputChange}
                                            placeholder="Observaciones adicionales"
                                            rows={3}
                                            className="w-full px-3 py-2 border rounded-md bg-white border-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                </div>

                                {/* ──── SECCIÓN 5: ESTADO ──── */}
                                <div className={`border-2 rounded-lg p-5 bg-gradient-to-br shadow-sm space-y-4 ${
                                    formData.activo
                                        ? 'border-green-200 from-green-50 to-white'
                                        : 'border-red-200 from-red-50 to-white'
                                }`}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`text-white p-3 rounded-lg ${
                                            formData.activo ? 'bg-green-600' : 'bg-red-600'
                                        }`}>
                                            <CheckCircle className="h-5 w-5" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">Estado del Usuario</h3>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <input
                                            id="activo"
                                            name="activo"
                                            type="checkbox"
                                            checked={formData.activo}
                                            onChange={handleInputChange}
                                            className={`h-5 w-5 border-2 rounded cursor-pointer ${
                                                formData.activo ? 'border-green-300' : 'border-red-300'
                                            }`}
                                        />
                                        <label htmlFor="activo" className="text-sm font-semibold cursor-pointer text-gray-700">
                                            Usuario Activo
                                        </label>
                                    </div>
                                </div>

                                {/* ──── BOTONES DE ACCIÓN ──── */}
                                <div className="flex gap-3 justify-end pt-4 border-t mb-4">
                                    {isEditing && (
                                        <Button variant="outline" onClick={handleCancelEdit} className="border-gray-300 hover:bg-gray-100">
                                            <X className="h-4 w-4 mr-2" />
                                            Cancelar
                                        </Button>
                                    )}
                                    <Button
                                        onClick={handleAddUsuario}
                                        disabled={isSaving}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
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



