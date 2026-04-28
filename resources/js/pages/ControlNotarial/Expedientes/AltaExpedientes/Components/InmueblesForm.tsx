import React from 'react';
import { Plus, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TipoInmueble {
    id: number;
    descripcion: string;
    categoria?: string;
    activo?: boolean;
}

interface TipoFactura {
    id: number;
    descripcion: string;
}

interface Inmueble {
    id?: number;
    numero_Inmueble: number;
    descripcion: string;
    clave_Catastral: string;
}

interface FormInmuebleData {
    tipoFactura: string;
    tipoVulnerable: string;
    tipoDeclaranot: string;
    medidas: string;
    antecedentes: string;
    descripcion: string;
    claveCatastral: string;
    valorAvaluo: string;
    valorCatastral: string;
    valorOperacion: string;
    superficieTerreno: string;
    superficieConstruida: string;
    ctaAgua: string;
    ctaPredial: string;
    calle: string;
    numeroExt: string;
    numeroInt: string;
    manzana: string;
    lote: string;
    pais: string;
    estado: string;
    municipio: string;
    colonia: string;
    cp: string;
    inscripcion: string;
    folioReal: string;
    folioInicial: string;
    folioFinal: string;
    folioElectronico: string;
    partida: string;
    volumen: string;
    seccion: string;
    fechaRegistro: string;
    fechaEscritura: string;
    montoTotal: string;
    formaPago: string;
    fechaPago: string;
    referenciaPago: string;
    observacionesPago: string;
}

interface CheckboxesAntecedentes {
    fechaRegistro: boolean;
    fechaEscritura: boolean;
}

interface InmueblesFormProps {
    inmueblesExpediente: Inmueble[];
    cargandoInmueblesExpediente: boolean;
    mostrarFormInmueble: boolean;
    setMostrarFormInmueble: (value: boolean) => void;
    cargandoGuardarInmueble: boolean;
    formInmueble: FormInmuebleData;
    setFormInmueble: (value: FormInmuebleData) => void;
    inmuebleEnEdicion: number | null;
    setInmuebleEnEdicion: (value: number | null) => void;
    inmuebleIdEnEdicion: number | null;
    setInmuebleIdEnEdicion: (value: number | null) => void;
    checkboxesAntecedentes: CheckboxesAntecedentes;
    setCheckboxesAntecedentes: (value: CheckboxesAntecedentes) => void;
    tiposFactura: TipoFactura[];
    tiposInmuebleFiltrados: TipoInmueble[];
    tiposDeclaranot: TipoInmueble[];
    handleGuardarInmueble: () => void;
    handleEditarInmueble: (inmuebleId: number) => void;
}

export default function InmueblesForm({
    inmueblesExpediente,
    cargandoInmueblesExpediente,
    mostrarFormInmueble,
    setMostrarFormInmueble,
    cargandoGuardarInmueble,
    formInmueble,
    setFormInmueble,
    inmuebleEnEdicion,
    setInmuebleEnEdicion,
    inmuebleIdEnEdicion,
    setInmuebleIdEnEdicion,
    checkboxesAntecedentes,
    setCheckboxesAntecedentes,
    tiposFactura,
    tiposInmuebleFiltrados,
    tiposDeclaranot,
    handleGuardarInmueble,
    handleEditarInmueble,
}: InmueblesFormProps) {
    return (
        <div className="space-y-6">
            <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-md mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-0">Información General del Inmueble</h3>
                <Button
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={() => {
                        setMostrarFormInmueble(true);
                        setInmuebleEnEdicion(null);
                        setInmuebleIdEnEdicion(null);
                        // Limpiar formulario para nuevo inmueble
                        setFormInmueble({
                            tipoFactura: '',
                            tipoVulnerable: '',
                            tipoDeclaranot: '',
                            medidas: '',
                            antecedentes: '',
                            descripcion: '',
                            claveCatastral: '',
                            valorAvaluo: '',
                            valorCatastral: '',
                            valorOperacion: '',
                            superficieTerreno: '',
                            superficieConstruida: '',
                            ctaAgua: '',
                            ctaPredial: '',
                            calle: '',
                            numeroExt: '',
                            numeroInt: '',
                            manzana: '',
                            lote: '',
                            pais: '',
                            estado: '',
                            municipio: '',
                            colonia: '',
                            cp: '',
                            inscripcion: '',
                            folioReal: '',
                            folioInicial: '',
                            folioFinal: '',
                            folioElectronico: '',
                            partida: '',
                            volumen: '',
                            seccion: '',
                            fechaRegistro: '',
                            fechaEscritura: '',
                            montoTotal: '',
                            formaPago: '',
                            fechaPago: '',
                            referenciaPago: '',
                            observacionesPago: '',
                        });
                    }}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Inmueble
                </Button>
            </div>

            {cargandoInmueblesExpediente && (
                <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="text-sm text-muted-foreground">Cargando inmuebles...</span>
                    </div>
                </div>
            )}

            {!cargandoInmueblesExpediente && inmueblesExpediente.length === 0 && (
                <div className="border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground text-center py-8">No hay inmuebles disponibles</p>
                </div>
            )}

            {!cargandoInmueblesExpediente && inmueblesExpediente.length > 0 && (
                <div className="border rounded-lg overflow-hidden" style={{ maxHeight: '150px', display: 'flex', flexDirection: 'column' }}>
                    <div className="overflow-x-auto overflow-y-auto flex-1">
                        <table className="w-full text-sm">
                             <thead className="sticky top-0 z-10 bg-slate-400 dark:bg-slate-800 border-b uppercase">
                                <tr>
                                    <th className="px-3 py-2 text-left">#</th>
                                    <th className="px-3 py-2 text-left">Descripción</th>
                                    <th className="px-3 py-2 text-left">Clave Catastral</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inmueblesExpediente.map((inmueble, idx) => (
                                    <tr
                                        key={idx}
                                        onClick={() => handleEditarInmueble(inmueble.id || 0)}
                                        className="border-b hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer transition-colors"
                                    >
                                        <td className="px-3 py-2">
                                            <span className="font-semibold">{inmueble.numero_Inmueble}</span>
                                        </td>
                                        <td className="px-3 py-2 text-sm">
                                            {inmueble.descripcion}
                                        </td>
                                        <td className="px-3 py-2 text-sm">
                                            {inmueble.clave_Catastral}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Formulario para agregar/editar inmueble con pestañas */}
            {mostrarFormInmueble && (
                <div className={`border rounded-lg p-6 mt-6 ${inmuebleEnEdicion ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-300' : 'bg-purple-50 dark:bg-purple-950/20'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h4 className={`font-semibold text-lg ${inmuebleEnEdicion ? 'text-blue-900 dark:text-blue-100' : 'text-purple-900 dark:text-purple-100'}`}>
                            {inmuebleEnEdicion ? `Inmueble #${inmuebleEnEdicion}` : 'Nuevo Inmueble'}
                        </h4>
                    </div>

                    <Tabs defaultValue="datos-inmueble" className="w-full">
                        <TabsList className="grid w-full grid-cols-5 gap-1 bg-slate-100 dark:bg-slate-800 mb-4 p-1">
                            <TabsTrigger value="datos-inmueble" className="text-xs sm:text-sm">Datos del Inmueble</TabsTrigger>
                            <TabsTrigger value="especificaciones" className="text-xs sm:text-sm">Especificaciones</TabsTrigger>
                            <TabsTrigger value="domicilio" className="text-xs sm:text-sm">Domicilio</TabsTrigger>
                            <TabsTrigger value="antecedentes" className="text-xs sm:text-sm">Antecedentes</TabsTrigger>
                            <TabsTrigger value="pagos-inmueble" className="text-xs sm:text-sm">Pagos Inmueble</TabsTrigger>
                        </TabsList>

                        {/* SubTab: Datos del Inmueble */}
                        <TabsContent value="datos-inmueble" className="space-y-4">
                            {/* Row 1: 3 Dropdowns */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Tipo Factura</label>
                                    <select
                                        value={formInmueble.tipoFactura}
                                        onChange={(e) => setFormInmueble({...formInmueble, tipoFactura: e.target.value})}
                                        className="w-full px-3 py-2 border rounded-md bg-background text-foreground border-input focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                    >
                                        <option value="">Selecciona tipo de factura</option>
                                        {tiposFactura.map((tipo) => (
                                            <option key={tipo.id} value={tipo.id}>{tipo.descripcion}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Tipo Inmueble</label>
                                    <select
                                        value={formInmueble.tipoVulnerable}
                                        onChange={(e) => setFormInmueble({...formInmueble, tipoVulnerable: e.target.value})}
                                        className="w-full px-3 py-2 border rounded-md bg-background text-foreground border-input focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                    >
                                        <option value="">Selecciona tipo de inmueble</option>
                                        {tiposInmuebleFiltrados.map((tipo) => (
                                            <option key={tipo.id} value={tipo.id}>{tipo.descripcion}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Tipo Declaranot</label>
                                    <select
                                        value={formInmueble.tipoDeclaranot}
                                        onChange={(e) => setFormInmueble({...formInmueble, tipoDeclaranot: e.target.value})}
                                        className="w-full px-3 py-2 border rounded-md bg-background text-foreground border-input focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                    >
                                        <option value="">Selecciona tipo declaranot</option>
                                        {tiposDeclaranot.map((tipo) => (
                                            <option key={tipo.id} value={tipo.id}>{tipo.descripcion}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Row 2: Medidas y Colindancias */}
                            <div className="space-y-2 mb-6">
                                <label className="text-sm font-medium">Medidas y Colindancias</label>
                                <textarea
                                    placeholder="Ingresa las medidas y colindancias del inmueble..."
                                    rows={3}
                                    value={formInmueble.medidas}
                                    onChange={(e) => setFormInmueble({...formInmueble, medidas: e.target.value})}
                                    className="w-full px-3 py-2 border rounded-md bg-background border-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                />
                            </div>

                            {/* Row 3: Antecedentes */}
                            <div className="space-y-2 mb-6">
                                <label className="text-sm font-medium">Antecedentes</label>
                                <textarea
                                    placeholder="Ingresa los antecedentes del inmueble..."
                                    rows={3}
                                    value={formInmueble.antecedentes}
                                    onChange={(e) => setFormInmueble({...formInmueble, antecedentes: e.target.value})}
                                    className="w-full px-3 py-2 border rounded-md bg-background border-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                />
                            </div>

                            {/* Row 4: Descripción */}
                            <div className="space-y-2 mb-6">
                                <label className="text-sm font-medium">Descripción del Inmueble</label>
                                <textarea
                                    placeholder="Ingresa la descripción completa del inmueble..."
                                    rows={3}
                                    value={formInmueble.descripcion}
                                    onChange={(e) => setFormInmueble({...formInmueble, descripcion: e.target.value})}
                                    className="w-full px-3 py-2 border rounded-md bg-background border-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                />
                            </div>
                        </TabsContent>

                        {/* SubTab: Especificaciones */}
                        <TabsContent value="especificaciones" className="space-y-4">
                            {/* Row 1: Clave Catastral */}
                            <div className="space-y-2 mb-6">
                                <label className="text-sm font-medium">Clave Catastral</label>
                                <Input
                                    type="text"
                                    placeholder="Ingresa la clave catastral..."
                                    value={formInmueble.claveCatastral}
                                    onChange={(e) => setFormInmueble({...formInmueble, claveCatastral: e.target.value})}
                                    className="w-full text-sm bg-white"
                                />
                            </div>

                            {/* Row 2: Valores */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Valor Avalúo</label>
                                    <Input
                                        type="number"
                                        placeholder="Valor avalúo..."
                                        value={formInmueble.valorAvaluo}
                                        onChange={(e) => setFormInmueble({...formInmueble, valorAvaluo: e.target.value})}
                                        className="w-full text-sm bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Valor Catastral</label>
                                    <Input
                                        type="number"
                                        placeholder="Valor catastral..."
                                        value={formInmueble.valorCatastral}
                                        onChange={(e) => setFormInmueble({...formInmueble, valorCatastral: e.target.value})}
                                        className="w-full text-sm bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Valor Operación</label>
                                    <Input
                                        type="number"
                                        placeholder="Valor operación..."
                                        value={formInmueble.valorOperacion}
                                        onChange={(e) => setFormInmueble({...formInmueble, valorOperacion: e.target.value})}
                                        className="w-full text-sm bg-white"
                                    />
                                </div>
                            </div>

                            {/* Row 3: Superficies */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Superficie del Terreno</label>
                                    <Input
                                        type="number"
                                        placeholder="Superficie del terreno..."
                                        value={formInmueble.superficieTerreno}
                                        onChange={(e) => setFormInmueble({...formInmueble, superficieTerreno: e.target.value})}
                                        className="w-full text-sm bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Superficie Construida</label>
                                    <Input
                                        type="number"
                                        placeholder="Superficie construida..."
                                        value={formInmueble.superficieConstruida}
                                        onChange={(e) => setFormInmueble({...formInmueble, superficieConstruida: e.target.value})}
                                        className="w-full text-sm bg-white"
                                    />
                                </div>
                            </div>

                            {/* Row 4: Cuentas */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Cta Agua</label>
                                    <Input
                                        type="number"
                                        placeholder="Número de cuenta agua..."
                                        value={formInmueble.ctaAgua}
                                        onChange={(e) => setFormInmueble({...formInmueble, ctaAgua: e.target.value})}
                                        className="w-full text-sm bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Cta Predial</label>
                                    <Input
                                        type="number"
                                        placeholder="Número de cuenta predial..."
                                        value={formInmueble.ctaPredial}
                                        onChange={(e) => setFormInmueble({...formInmueble, ctaPredial: e.target.value})}
                                        className="w-full text-sm bg-white"
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* SubTab: Domicilio */}
                        <TabsContent value="domicilio" className="space-y-4">
                            {/* Row 1: Calle y CP */}
                            <div className="grid grid-cols-4 gap-4 mb-6">
                                <div className="space-y-2 col-span-3">
                                    <label className="text-sm font-medium">Calle</label>
                                    <Input
                                        type="text"
                                        placeholder="Ingresa la calle..."
                                        value={formInmueble.calle}
                                        onChange={(e) => setFormInmueble({...formInmueble, calle: e.target.value})}
                                        className="w-full text-sm bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">CP</label>
                                    <Input
                                        type="text"
                                        placeholder="Código postal..."
                                        value={formInmueble.cp}
                                        onChange={(e) => setFormInmueble({...formInmueble, cp: e.target.value})}
                                        className="w-full text-sm bg-white"
                                    />
                                </div>
                            </div>

                            {/* Row 2: Números y referencias */}
                            <div className="grid grid-cols-4 gap-4 mb-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Número Ext</label>
                                    <Input
                                        type="text"
                                        placeholder="Número exterior..."
                                        value={formInmueble.numeroExt}
                                        onChange={(e) => setFormInmueble({...formInmueble, numeroExt: e.target.value})}
                                        className="w-full text-sm bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Número Int</label>
                                    <Input
                                        type="text"
                                        placeholder="Número interior..."
                                        value={formInmueble.numeroInt}
                                        onChange={(e) => setFormInmueble({...formInmueble, numeroInt: e.target.value})}
                                        className="w-full text-sm bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Manzana</label>
                                    <Input
                                        type="text"
                                        placeholder="Manzana..."
                                        value={formInmueble.manzana}
                                        onChange={(e) => setFormInmueble({...formInmueble, manzana: e.target.value})}
                                        className="w-full text-sm bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Lote</label>
                                    <Input
                                        type="text"
                                        placeholder="Lote..."
                                        value={formInmueble.lote}
                                        onChange={(e) => setFormInmueble({...formInmueble, lote: e.target.value})}
                                        className="w-full text-sm bg-white"
                                    />
                                </div>
                            </div>

                            {/* Row 3: Ubicación */}
                            <div className="grid grid-cols-4 gap-4 mb-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">País</label>
                                    <Input
                                        type="text"
                                        placeholder="País..."
                                        value={formInmueble.pais}
                                        onChange={(e) => setFormInmueble({...formInmueble, pais: e.target.value})}
                                        className="w-full text-sm bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Estado</label>
                                    <Input
                                        type="text"
                                        placeholder="Estado..."
                                        value={formInmueble.estado}
                                        onChange={(e) => setFormInmueble({...formInmueble, estado: e.target.value})}
                                        className="w-full text-sm bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Municipio</label>
                                    <Input
                                        type="text"
                                        placeholder="Municipio..."
                                        value={formInmueble.municipio}
                                        onChange={(e) => setFormInmueble({...formInmueble, municipio: e.target.value})}
                                        className="w-full text-sm bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Colonia</label>
                                    <Input
                                        type="text"
                                        placeholder="Colonia..."
                                        value={formInmueble.colonia}
                                        onChange={(e) => setFormInmueble({...formInmueble, colonia: e.target.value})}
                                        className="w-full text-sm bg-white"
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* SubTab: Antecedentes */}
                        <TabsContent value="antecedentes" className="space-y-4">
                            {/* Row 1: Fecha Registro y Fecha Escritura con Checkboxes */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="fecha-registro-check"
                                            className="w-4 h-4 cursor-pointer"
                                            checked={checkboxesAntecedentes.fechaRegistro}
                                            onChange={(e) => setCheckboxesAntecedentes({...checkboxesAntecedentes, fechaRegistro: e.target.checked})}
                                        />
                                        <label htmlFor="fecha-registro-check" className="text-sm font-medium cursor-pointer">Fecha Registro</label>
                                    </div>
                                    <input
                                        type="date"
                                        disabled={!checkboxesAntecedentes.fechaRegistro}
                                        value={formInmueble.fechaRegistro}
                                        onChange={(e) => setFormInmueble({...formInmueble, fechaRegistro: e.target.value})}
                                        className="w-full px-3 py-2 border rounded-md text-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="fecha-escritura-check"
                                            className="w-4 h-4 cursor-pointer"
                                            checked={checkboxesAntecedentes.fechaEscritura}
                                            onChange={(e) => setCheckboxesAntecedentes({...checkboxesAntecedentes, fechaEscritura: e.target.checked})}
                                        />
                                        <label htmlFor="fecha-escritura-check" className="text-sm font-medium cursor-pointer">Fecha Escritura</label>
                                    </div>
                                    <input
                                        type="date"
                                        disabled={!checkboxesAntecedentes.fechaEscritura}
                                        value={formInmueble.fechaEscritura}
                                        onChange={(e) => setFormInmueble({...formInmueble, fechaEscritura: e.target.value})}
                                        className="w-full px-3 py-2 border rounded-md text-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            {/* Row 2: Inscripción */}
                            <div className="space-y-2 mb-6">
                                <label className="text-sm font-medium">Inscripción</label>
                                <Input
                                    type="text"
                                    placeholder="Número de inscripción..."
                                    value={formInmueble.inscripcion}
                                    onChange={(e) => setFormInmueble({...formInmueble, inscripcion: e.target.value})}
                                    className="w-full text-sm bg-white"
                                />
                            </div>

                            {/* Row 3: Folios */}
                            <div className="grid grid-cols-4 gap-4 mb-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Folio Real</label>
                                    <Input
                                        type="text"
                                        placeholder="Folio real..."
                                        value={formInmueble.folioReal}
                                        onChange={(e) => setFormInmueble({...formInmueble, folioReal: e.target.value})}
                                        className="w-full text-sm bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Folio Inicial</label>
                                    <Input
                                        type="number"
                                        placeholder="Folio inicial..."
                                        value={formInmueble.folioInicial}
                                        onChange={(e) => setFormInmueble({...formInmueble, folioInicial: e.target.value})}
                                        className="w-full text-m bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Folio Final</label>
                                    <Input
                                        type="number"
                                        placeholder="Folio final..."
                                        value={formInmueble.folioFinal}
                                        onChange={(e) => setFormInmueble({...formInmueble, folioFinal: e.target.value})}
                                        className="w-full text-sm bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Folio Electrónico</label>
                                    <Input
                                        type="number"
                                        placeholder="Folio electrónico..."
                                        value={formInmueble.folioElectronico}
                                        onChange={(e) => setFormInmueble({...formInmueble, folioElectronico: e.target.value})}
                                        className="w-full text-sm bg-white"
                                    />
                                </div>
                            </div>

                            {/* Row 4: Partida, Volumen, Sección */}
                            <div className="grid grid-cols-4 gap-4 mb-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Partida</label>
                                    <Input
                                        type="number"
                                        placeholder="Partida..."
                                        value={formInmueble.partida}
                                        onChange={(e) => setFormInmueble({...formInmueble, partida: e.target.value})}
                                        className="w-full text-sm bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Volumen</label>
                                    <Input
                                        type="number"
                                        placeholder="Volumen..."
                                        value={formInmueble.volumen}
                                        onChange={(e) => setFormInmueble({...formInmueble, volumen: e.target.value})}
                                        className="w-full text-sm bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Sección</label>
                                    <Input
                                        type="number"
                                        placeholder="Sección..."
                                        value={formInmueble.seccion}
                                        onChange={(e) => setFormInmueble({...formInmueble, seccion: e.target.value})}
                                        className="w-full text-sm bg-white"
                                    />
                                </div>
                                <div />
                            </div>
                        </TabsContent>

                        {/* SubTab: Pagos Inmueble Declaranot */}
                        <TabsContent value="pagos-inmueble" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Monto Total</label>
                                    <Input
                                        type="number"
                                        placeholder="Monto total destacado..."
                                        value={formInmueble.montoTotal}
                                        onChange={(e) => setFormInmueble({...formInmueble, montoTotal: e.target.value})}
                                        className="w-full text-sm bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Forma de Pago</label>
                                    <select
                                        value={formInmueble.formaPago}
                                        onChange={(e) => setFormInmueble({...formInmueble, formaPago: e.target.value})}
                                        className="w-full px-3 py-2 border rounded-md bg-white text-foreground border-input focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                    >
                                        <option value="">Selecciona forma de pago</option>
                                        <option value="efectivo">Efectivo</option>
                                        <option value="cheque">Cheque</option>
                                        <option value="transferencia">Transferencia</option>
                                        <option value="tarjeta">Tarjeta</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Fecha de Pago</label>
                                    <Input
                                        type="date"
                                        value={formInmueble.fechaPago}
                                        onChange={(e) => setFormInmueble({...formInmueble, fechaPago: e.target.value})}
                                        className="w-full text-sm bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Referencia Pago</label>
                                    <Input
                                        type="text"
                                        placeholder="Número de referencia o comprobante..."
                                        value={formInmueble.referenciaPago}
                                        onChange={(e) => setFormInmueble({...formInmueble, referenciaPago: e.target.value})}
                                        className="w-full text-sm bg-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 mb-6">
                                <label className="text-sm font-medium">Observaciones de Pago</label>
                                <textarea
                                    placeholder="Ingresa observaciones sobre el pago..."
                                    rows={3}
                                    value={formInmueble.observacionesPago}
                                    onChange={(e) => setFormInmueble({...formInmueble, observacionesPago: e.target.value})}
                                    className="w-full px-3 py-2 border rounded-md bg-white border-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                />
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Unified Save Button with Cancelar - outside all tabs */}
                    <div className="flex gap-2 justify-end mt-6">
                        <Button
                            variant="outline"
                            className="text-sm"
                            onClick={() => {
                                setMostrarFormInmueble(false);
                                setInmuebleEnEdicion(null);
                                setInmuebleIdEnEdicion(null);
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700 text-sm"
                            onClick={handleGuardarInmueble}
                            disabled={cargandoGuardarInmueble}
                        >
                            {cargandoGuardarInmueble && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {cargandoGuardarInmueble
                                ? (inmuebleIdEnEdicion ? 'Actualizando...' : 'Guardando...')
                                : (inmuebleIdEnEdicion ? 'Actualizar Inmueble' : 'Guardar Inmueble')
                            }
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
