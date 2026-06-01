# 📋 Plan de Implementación - Módulo Listas PEP

**Fecha:** Mayo 27, 2026  
**Actualizado:** Mayo 28, 2026  
**Proyecto:** Atinet Compliance Hub  
**Objetivo:** Implementar completamente el módulo de Listas PEP con integración a prevenciondelavado.com

## 📈 Estado General del Proyecto

| Fase | Descripción | Estado | Progreso |
|------|-------------|--------|----------|
| **FASE 1** | Mejorar Vista React | ✅ Completada | 100% |
| **FASE 2** | Migraciones BD (busquedas + resultados + certificados) | ✅ Completada | 100% |
| **FASE 3** | Servicio API Externa (PrevencionDeLavado.com) | 🔒 Bloqueada | 0% |
| **FASE 4** | Controller y Rutas | 🔄 Parcial | 60% |
| **FASE 5** | Integración React ↔ Laravel | 🔄 Parcial | 50% |
| **FASE 6** | Historial y Certificados PDF | 🔄 Parcial | 75% |
| **FASE 7** | Testing | ⏳ Pendiente | 0% |
| **FASE 8** | Deploy y Producción | ⏳ Pendiente | 0% |

**Progreso Total:** ~48% (2 fases completas + 3 parciales)

> **⚠️ BLOQUEO ACTIVO — FASE 3:** La integración real con PrevencionDeLavado.com está en pausa.
> Solo quedan **23 de 600 búsquedas** disponibles en el plan contratado. No se usarán hasta renovar
> el plan o recibir instrucciones. Las Fases 4 y 5 dependen de FASE 3 para la ruta `buscar`.
>
> **✅ DESBLOQUEADO sin API:** Certificados PDF (rutas activas), descarga de listados estáticos,
> historial de búsquedas (esqueleto con datos vacíos), persistencia en BD de certificados.

### 📚 Documentación Generada
- ✅ [PLAN_IMPLEMENTACION_LISTAS_PEP.md](./PLAN_IMPLEMENTACION_LISTAS_PEP.md) - Plan maestro completo
- ✅ [ANALISIS_CAMPOS_BD_LISTAS_PEP.md](./ANALISIS_CAMPOS_BD_LISTAS_PEP.md) - Análisis de campos de BD
- ✅ [DOCUMENTACION_FASE_1_LISTAS_PEP.md](./DOCUMENTACION_FASE_1_LISTAS_PEP.md) - Documentación FASE 1
- ✅ [DOCUMENTACION_FASE_2_LISTAS_PEP.md](./DOCUMENTACION_FASE_2_LISTAS_PEP.md) - Documentación FASE 2 + incidentes

---

## 🗂️ Inventario de Archivos — Estado al 28/Mayo/2026

### 🗄️ Migraciones (todas ejecutadas)
| Migración | Batch | Estado |
|-----------|-------|--------|
| `2026_05_xx_create_listas_pep_busquedas_table` | 2 | ✅ Ejecutada |
| `2026_05_xx_create_listas_pep_resultados_table` | 2 | ✅ Ejecutada |
| `2026_05_28_173320_create_listas_pep_certificados_table` | 4 | ✅ Ejecutada |

### 🖥️ Backend
| Archivo | Estado | Notas |
|---------|--------|-------|
| `app/Http/Controllers/Admin/ListasPEPController.php` | 🔄 Parcial | `certificadoSinCoincidencias()` + `certificadoConCoincidencia()` ✅. Faltan: `buscar()`, `historial()`, `descargarListado()` |
| `app/Services/PrevencionDeLavadoService.php` | ❌ No creado | Requiere credenciales / quota disponible |

### 🛣️ Rutas (`routes/web.php`)
| Ruta | Método | Estado |
|------|--------|--------|
| `POST /admin/listas-pep/certificado/sin-coincidencias` | Controller | ✅ Activa |
| `POST /admin/listas-pep/certificado/con-coincidencia` | Controller | ✅ Activa |
| `POST /admin/listas-pep/buscar` | Controller | 🔒 Comentada (espera API) |
| `GET /admin/listas-pep/historial/data` | Controller | 🔒 Comentada |
| `GET /admin/listas-pep/listados/{tipo}` | Controller | 🔒 Comentada |

### 🎨 Frontend React
| Archivo | Estado | Notas |
|---------|--------|-------|
| `resources/js/pages/Admin/ListasPEP/Search.tsx` | 🔄 Parcial | `generarCertificadoSinCoincidencias()` + `generarCertificadoConCoincidencias()` ✅. `handleBuscar()` conectado a endpoint aún comentado |

### 📄 Plantillas PDF (Blade)
| Archivo | Estado |
|---------|--------|
| `resources/views/pdf/listas-pep/certificado-sin-coincidencias.blade.php` | ✅ Completa |
| `resources/views/pdf/listas-pep/certificado-con-coincidencia.blade.php` | ✅ Completa |

---

## 📊 Análisis Comparativo: Vista Vue (Legacy) vs Vista React (Actual)

### ✅ Vista Vue (Legacy) - Características

**Formulario:**
- ✓ Campos: Apellido, Nombre, Identificación
- ✓ Checkboxes visibles:
  - `pepsOtrosPaises` (PEPs en otros países)
  - `satXDenominacion` (SAT por denominación)
  - `documentosSimilares` (Documentos similares)
  - `forzarApellidos` (Forzar apellidos)
  - `generarCertificados` (Generar certificados)
- ✓ Botón limpiar formulario
- ✓ Validación básica

**Visualización de Resultados:**
- ✓ Cards individuales por cada resultado
- ✓ Muestra **TODOS** los campos de la API:
  - `denominacion` - Nombre completo
  - `identificacion` - CURP u otra ID
  - `idTributaria` - RFC
  - `fechaNacimiento` - Formato DD/MM/YYYY
  - `tipo` - PEP / EX PEP
  - `estado` - ACTIVO / INACTIVO
  - `cargo` - Puesto desempeñado
  - `finalizacionCargo` - Cuándo terminó
  - `lugarTrabajo` - Entidad/Dependencia
  - `direccion` - Dirección completa
  - `lista` - Nombre de la lista
  - `paisLista` - País de origen
  - `exactitudDenominacion` - ALTO/MEDIO/BAJO (5 sobre 5)
  - `exactitudIdentificacion` - COINCIDE / N/D
  - `enlace` - URL externa para más info
  - `codigoIndividuo` - ID único
- ✓ Código de certificado de búsqueda (UUID)
- ✓ Fecha y hora de consulta
- ✓ Badges de colores por tipo
- ✓ Formateo visual de exactitud
- ✓ Enlace externo a prevenciondelavado.com

**Conexión:**
- Endpoint: `http://127.0.0.1:8000/api/busquedaPrevencion`
- Método: POST
- Sin autenticación Laravel (público)
- Sin guardar en BD

---

### 🆕 Vista React (Actual) - Características

**Formulario:**
- ✓ Campos: Apellido/Denominación, Nombres, Identificación
- ✓ Validación mejorada
- ✓ Mensajes de alerta
- ❌ **FALTA:** Checkboxes de opciones de búsqueda (no se muestran)

**Visualización de Resultados:**
- ✓ Tabla compacta con paginación
- ✓ Filtros por tipo de PEP y fuente
- ✓ Selección múltiple con checkboxes
- ✓ Barras visuales de exactitud (5 barras)
- ✓ Badges por tipo y fuente
- ✓ Contador de resultados
- ❌ **FALTA:** Vista detallada de cada resultado
- ❌ **FALTA:** Mostrar todos los campos (cargo, lugar de trabajo, dirección, etc.)
- ❌ **FALTA:** Enlace externo por resultado
- ❌ **FALTA:** Información de certificado de búsqueda

**Funcionalidades Adicionales (React):**
- ✓ Contador de paquete contratado (600 búsquedas)
- ✓ Barra de progreso de consumo
- ✓ Alertas por pocas búsquedas disponibles
- ✓ Generación de certificados:
  - Con coincidencias (PDF)
  - Sin coincidencias (PDF)
- ✓ Descarga de listados complementarios:
  - REFIPRE (Regímenes Fiscales Preferentes)
  - OCDE (Paraísos Fiscales)
  - GAFI (Territorios informados)
- ✓ Botón de historial
- ✓ Breadcrumbs de navegación

**Conexión:**
- Endpoint: `/admin/listas-pep/buscar`
- Método: POST con CSRF token
- Con autenticación Laravel
- TODO: Guardar en BD

---

## 🔧 Mejoras Necesarias en la Vista React

### 1. **CRÍTICO: Agregar Checkboxes de Opciones de Búsqueda**

El formulario React NO muestra las opciones que la API requiere. Debemos agregar:

```tsx
// En el formulario, después del campo de identificación:
<div className="space-y-2">
  <Label className="text-sm font-medium">Opciones de búsqueda</Label>
  <div className="grid grid-cols-2 gap-3">
    <div className="flex items-center space-x-2">
      <Checkbox
        id="pepsOtrosPaises"
        checked={opciones.pepsOtrosPaises}
        onCheckedChange={(checked) => 
          setOpciones({...opciones, pepsOtrosPaises: checked})
        }
      />
      <label htmlFor="pepsOtrosPaises" className="text-sm">
        PEPs en otros países
      </label>
    </div>
    
    <div className="flex items-center space-x-2">
      <Checkbox
        id="satXDenominacion"
        checked={opciones.satXDenominacion}
        onCheckedChange={(checked) => 
          setOpciones({...opciones, satXDenominacion: checked})
        }
      />
      <label htmlFor="satXDenominacion" className="text-sm">
        SAT por denominación
      </label>
    </div>
    
    <div className="flex items-center space-x-2">
      <Checkbox
        id="documentosSimilares"
        checked={opciones.documentosSimilares}
        onCheckedChange={(checked) => 
          setOpciones({...opciones, documentosSimilares: checked})
        }
      />
      <label htmlFor="documentosSimilares" className="text-sm">
        Documentos similares
      </label>
    </div>
    
    <div className="flex items-center space-x-2">
      <Checkbox
        id="generarCertificados"
        checked={opciones.generarCertificados}
        onCheckedChange={(checked) => 
          setOpciones({...opciones, generarCertificados: checked})
        }
      />
      <label htmlFor="generarCertificados" className="text-sm">
        Generar certificados
      </label>
    </div>
  </div>
</div>
```

**Estado adicional:**
```tsx
const [opciones, setOpciones] = useState({
  pepsOtrosPaises: true,
  satXDenominacion: true,
  documentosSimilares: true,
  forzarApellidos: false,
  generarCertificados: true
});
```

---

### 2. **CRÍTICO: Ajustar Tipos de Datos (TypeScript)**

La API externa devuelve campos diferentes a los que React espera:

**Tipos actuales en React:**
```typescript
interface PEPResultado {
    id: string;
    apellido_denominacion: string;
    nombres: string;
    identificacion?: string;
    exactitud: number; // 0–100
    tipo: TipoPEP;
    fuente: OrigenFuente;
}
```

**Tipos que LA API REALMENTE devuelve:**
```typescript
interface PEPResultadoAPI {
    codigoIndividuo: number;
    denominacion: string;          // Nombre completo
    identificacion: string | null;  // CURP
    idTributaria: string | null;    // RFC
    otraIdentificacion: string | null;
    fechaNacimiento: string | null; // YYYYMMDD
    tipo: string;                   // "PEP" | "EX PEP" | etc.
    subTipo: string;
    estado: string;                 // "ACTIVO" | "INACTIVO"
    cargo: string;
    finalizacionCargo: string | null;
    lugarTrabajo: string;
    direccion: string;
    lista: string;
    paisLista: string;
    supuesto: string | null;
    situacion: string | null;
    exactitudDenominacion: string;  // "ALTO (5 sobre 5)"
    exactitudIdentificacion: string; // "COINCIDE" | "N/D"
    enlace: string | null;
}

interface BusquedaResponseAPI {
    codigoCertificadoBusqueda: string; // UUID
    fechaConsulta: string;             // ISO DateTime
    resultados: PEPResultadoAPI[];
}
```

**Mapeo necesario:**
```typescript
function mapearResultadoAPI(resultado: PEPResultadoAPI): PEPResultado {
    // Separar denominacion en apellido y nombres
    const partes = resultado.denominacion.split(' ');
    const apellido = partes.slice(0, 2).join(' '); // Primeros 2 = apellidos
    const nombres = partes.slice(2).join(' ');      // Resto = nombres
    
    // Convertir exactitud "ALTO (5 sobre 5)" -> 100, "MEDIO (4 sobre 5)" -> 80, etc.
    let exactitud = 0;
    if (resultado.exactitudDenominacion?.includes('5 sobre 5')) exactitud = 100;
    else if (resultado.exactitudDenominacion?.includes('4 sobre 5')) exactitud = 80;
    else if (resultado.exactitudDenominacion?.includes('3 sobre 5')) exactitud = 60;
    
    return {
        id: resultado.codigoIndividuo.toString(),
        apellido_denominacion: apellido,
        nombres: nombres,
        identificacion: resultado.identificacion || resultado.idTributaria,
        exactitud: exactitud,
        tipo: resultado.tipo as TipoPEP,
        fuente: 'MEX', // Determinar según paisLista
        // Campos adicionales para vista detallada
        cargo: resultado.cargo,
        lugarTrabajo: resultado.lugarTrabajo,
        direccion: resultado.direccion,
        fechaNacimiento: resultado.fechaNacimiento,
        estado: resultado.estado,
        enlace: resultado.enlace,
        // ... resto de campos
    };
}
```

---

### 3. **CRÍTICO: Agregar Vista Detallada de Resultados**

Crear un componente `DetalleResultado` o modal expandible:

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button variant="ghost" size="sm">
      Ver detalles
    </Button>
  </DialogTrigger>
  <DialogContent className="max-w-3xl">
    <DialogHeader>
      <DialogTitle>{resultado.denominacion}</DialogTitle>
    </DialogHeader>
    
    <div className="space-y-4">
      {/* Información Personal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Información Personal</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Identificación:</span>
            <p className="font-medium">{resultado.identificacion || 'N/D'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">RFC:</span>
            <p className="font-medium">{resultado.idTributaria || 'N/D'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Fecha de Nacimiento:</span>
            <p className="font-medium">{formatoFecha(resultado.fechaNacimiento)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Estado:</span>
            <Badge className={getEstadoBadgeClass(resultado.estado)}>
              {resultado.estado}
            </Badge>
          </div>
        </CardContent>
      </Card>
      
      {/* Cargo y Función */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Cargo y Función Pública</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Cargo:</span>
            <p className="font-medium">{resultado.cargo}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Lugar de Trabajo:</span>
            <p className="text-sm text-muted-foreground">{resultado.lugarTrabajo}</p>
          </div>
          {resultado.finalizacionCargo && (
            <div>
              <span className="text-muted-foreground">Finalización:</span>
              <p className="text-sm">{resultado.finalizacionCargo}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Ubicación */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Ubicación</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{resultado.direccion}</p>
        </CardContent>
      </Card>
      
      {/* Lista y Exactitud */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Clasificación y Exactitud</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Lista:</span>
            <p>{resultado.lista}</p>
          </div>
          <div>
            <span className="text-muted-foreground">País:</span>
            <p>{resultado.paisLista}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Exactitud Denominación:</span>
            <span className={getExactitudClass(resultado.exactitudDenominacion)}>
              {resultado.exactitudDenominacion}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Exactitud Identificación:</span>
            <span className={getIdentificacionClass(resultado.exactitudIdentificacion)}>
              {resultado.exactitudIdentificacion}
            </span>
          </div>
        </CardContent>
      </Card>
      
      {/* Enlace externo */}
      {resultado.enlace && (
        <Button asChild className="w-full">
          <a href={resultado.enlace} target="_blank" rel="noopener noreferrer">
            Ver información completa en PrevencionDeLavado.com
          </a>
        </Button>
      )}
    </div>
  </DialogContent>
</Dialog>
```

---

### 4. **Mostrar Información de Certificado**

Agregar tarjeta arriba de los resultados:

```tsx
{ultimaBusqueda && (
  <Card className="mb-4">
    <CardContent className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm text-muted-foreground">
          Código de Certificado de Búsqueda
        </p>
        <code className="text-sm font-mono">
          {resultadosBusqueda?.codigoCertificadoBusqueda}
        </code>
      </div>
      <div className="text-right">
        <p className="text-sm text-muted-foreground">Fecha de Consulta</p>
        <p className="text-sm font-medium">
          {new Date(resultadosBusqueda?.fechaConsulta).toLocaleString('es-MX')}
        </p>
      </div>
    </CardContent>
  </Card>
)}
```

---

## 📝 Plan de Implementación Completo

### **FASE 1: Mejorar Vista React** ⚙️

**Prioridad:** ALTA  
**Tiempo estimado:** 2-3 horas

#### Tareas:
1. ✅ Agregar checkboxes de opciones al formulario
2. ✅ Actualizar tipos TypeScript para coincidir con API real
3. ✅ Crear función de mapeo de resultados API → React
4. ✅ Agregar componente de vista detallada (modal o expandible)
5. ✅ Mostrar código de certificado y fecha de consulta
6. ✅ Agregar formateo de fecha (YYYYMMDD → DD/MM/YYYY)
7. ✅ Probar vista con datos de ejemplo

---

### **FASE 2: Backend - Migración y Modelo** 💾

**Prioridad:** ALTA  
**Tiempo estimado:** 1 hora  
**Estado:** ✅ **COMPLETADA** (28/Mayo/2026)  
**Documentación:** Ver [DOCUMENTACION_FASE_2_LISTAS_PEP.md](./DOCUMENTACION_FASE_2_LISTAS_PEP.md)

#### Tareas:
1. ✅ Crear migración `create_listas_pep_busquedas_table` (Batch 2)
2. ✅ Crear migración `create_listas_pep_resultados_table` (Batch 2)
3. ✅ Crear migración `create_listas_pep_certificados_table` (Batch 4, 28/Mayo/2026)
   - `busqueda_id` FK → listas_pep_busquedas CASCADE
   - `resultado_id` FK nullable → listas_pep_resultados SET NULL
   - `tipo` ENUM: `SIN_COINCIDENCIAS` / `CON_COINCIDENCIA`
   - `archivo_pdf`, `hash_pdf`, `uuid_certificado` (unique), `observaciones`
   - `emitido_por` FK nullable → users SET NULL
4. ✅ Implementar medidas de seguridad en migraciones (verificación hasTable, FKs condicionales)

#### Incidentes Resueltos:
⚠️ **Error FK con expediente_id:** Solucionado removiendo FK constraint (incompatibilidad signed/unsigned)  
🔴 **Incidente db:wipe:** Se eliminó toda la BD por error. Implementadas medidas de seguridad para prevenir en producción.

**📘 Documentación completa:** [DOCUMENTACION_FASE_2_LISTAS_PEP.md](./DOCUMENTACION_FASE_2_LISTAS_PEP.md)
- Estructura detallada de 2 tablas (15 + 29 campos)
- Ejemplos de registros JSON
- Queries SQL útiles
- Checklist de seguridad para producción
- Lecciones aprendidas del incidente

---

### **FASE 3: Backend - Servicio de API Externa** 🌐

**Prioridad:** ALTA  
**Estado:** 🔒 **BLOQUEADA** — Solo 23/600 búsquedas disponibles. No implementar hasta renovar plan.  
**Tiempo estimado:** 2 horas

#### Tareas:
1. ❌ Crear `app/Services/PrevencionDeLavadoService.php`
   - Método `login()` con caché de token (55 minutos)
   - Método `buscarEnListas(array $parametros)`
   - Manejo de errores y reintentos
   - Logging de requests

2. ✅ Credenciales en `.env`
   ```
   PREVENCION_LAVADO_USER=acostacl
   PREVENCION_LAVADO_PASS=26F1D723
   PREVENCION_LAVADO_URL=https://mbalistas.prevenciondelavado.com
   ```

**Código:**
```php
// app/Services/PrevencionDeLavadoService.php
namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PrevencionDeLavadoService
{
    private string $baseUrl;
    private string $usuario;
    private string $clave;
    
    public function __construct()
    {
        $this->baseUrl = config('services.prevencion_lavado.url');
        $this->usuario = config('services.prevencion_lavado.user');
        $this->clave = config('services.prevencion_lavado.password');
    }
    
    /**
     * Obtener token JWT (cacheado 55 minutos)
     */
    private function getToken(): ?string
    {
        return Cache::remember('pld_token', 3300, function () {
            try {
                $response = Http::withOptions([
                    'verify' => app()->environment('production'),
                ])->post($this->baseUrl . '/Login', [
                    'usuario' => $this->usuario,
                    'clave' => $this->clave,
                ]);
                
                if ($response->successful()) {
                    return $response->json('token');
                }
                
                Log::error('PrevencionDeLavado Login failed', [
                    'status' => $response->status(),
                    'response' => $response->json(),
                ]);
                
                return null;
            } catch (\Exception $e) {
                Log::error('PrevencionDeLavado Login exception', [
                    'message' => $e->getMessage(),
                ]);
                return null;
            }
        });
    }
    
    /**
     * Buscar en listas PEP
     */
    public function buscarEnListas(array $parametros): array
    {
        $token = $this->getToken();
        
        if (!$token) {
            return [
                'success' => false,
                'message' => 'No se pudo autenticar con el servicio externo',
            ];
        }
        
        try {
            // Convertir booleanos a "S"/"N"
            $data = [
                'apellido' => $parametros['apellido_denominacion'] ?? '',
                'nombre' => $parametros['nombres'] ?? '',
                'identificacion' => $parametros['identificacion'] ?? '',
                'pepsOtrosPaises' => ($parametros['pepsOtrosPaises'] ?? false) ? 'S' : 'N',
                'satXDenominacion' => ($parametros['satXDenominacion'] ?? false) ? 'S' : 'N',
                'documentosSimilares' => ($parametros['documentosSimilares'] ?? false) ? 'S' : 'N',
                'forzarApellidos' => ($parametros['forzarApellidos'] ?? false) ? 'S' : 'N',
                'generarCertificados' => ($parametros['generarCertificados'] ?? true) ? 'S' : 'N',
            ];
            
            $response = Http::withOptions([
                'verify' => app()->environment('production'),
            ])
                ->withHeaders([
                    'Authorization' => "Bearer {$token}",
                    'Content-Type' => 'application/json',
                ])
                ->timeout(30)
                ->post($this->baseUrl . '/listas', $data);
            
            if ($response->successful()) {
                $result = $response->json();
                
                return [
                    'success' => true,
                    'data' => [
                        'codigo_certificado' => $result['codigoCertificadoBusqueda'] ?? null,
                        'fecha_consulta' => $result['fechaConsulta'] ?? now()->toISOString(),
                        'total_aciertos' => count($result['resultados'] ?? []),
                        'resultados' => $result['resultados'] ?? [],
                    ],
                ];
            }
            
            Log::warning('PrevencionDeLavado Busqueda failed', [
                'status' => $response->status(),
                'response' => $response->json(),
            ]);
            
            return [
                'success' => false,
                'message' => 'Error al consultar el servicio externo',
            ];
            
        } catch (\Exception $e) {
            Log::error('PrevencionDeLavado Busqueda exception', [
                'message' => $e->getMessage(),
            ]);
            
            return [
                'success' => false,
                'message' => 'Error de conexión con el servicio externo',
            ];
        }
    }
}
```

---

### **FASE 4: Backend - Controlador** 🎮

**Prioridad:** ALTA  
**Estado:** 🔄 **PARCIAL** (60%) — Certificados completos, `buscar()` e `historial()` pendientes.  
**Tiempo estimado:** 2 horas (restante)

#### Tareas:
1. ✅ Crear `app/Http/Controllers/Admin/ListasPEPController.php`
2. ✅ Método `certificadoSinCoincidencias()` — genera y descarga PDF "Sin Coincidencias"
3. ✅ Método `certificadoConCoincidencia()` — genera y descarga PDF "Con Coincidencia"
4. ❌ Método `buscar()` — requiere `PrevencionDeLavadoService` (FASE 3)
5. ❌ Método `historial()` — lista paginada de `listas_pep_busquedas`
6. ❌ Método `descargarListado($tipo)` — descarga REFIPRE / OCDE / GAFI (archivos estáticos)
7. ❌ Persistir certificados en tabla `listas_pep_certificados` tras generarlos

**Código:**
```php
// app/Http/Controllers/Admin/ListasPEPController.php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ListaPEPBusqueda;
use App\Services\PrevencionDeLavadoService;
use Illuminate\Http\Request;

class ListasPEPController extends Controller
{
    public function __construct(
        private PrevencionDeLavadoService $pldService
    ) {}
    
    /**
     * Realizar búsqueda en listas PEP
     */
    public function buscar(Request $request)
    {
        $validated = $request->validate([
            'apellido_denominacion' => 'required|string|max:255',
            'nombres' => 'nullable|string|max:255',
            'identificacion' => 'nullable|string|max:50',
            'pepsOtrosPaises' => 'boolean',
            'satXDenominacion' => 'boolean',
            'documentosSimilares' => 'boolean',
            'forzarApellidos' => 'boolean',
            'generarCertificados' => 'boolean',
        ]);
        
        // Realizar búsqueda en API externa
        $resultado = $this->pldService->buscarEnListas($validated);
        
        if (!$resultado['success']) {
            return response()->json($resultado, 500);
        }
        
        // Guardar en base de datos
        $busqueda = ListaPEPBusqueda::create([
            'user_id' => auth()->id(),
            'notaria_id' => auth()->user()->notaria_id,
            'apellido_denominacion' => $validated['apellido_denominacion'],
            'nombres' => $validated['nombres'] ?? null,
            'identificacion' => $validated['identificacion'] ?? null,
            'opciones' => [
                'pepsOtrosPaises' => $validated['pepsOtrosPaises'] ?? false,
                'satXDenominacion' => $validated['satXDenominacion'] ?? false,
                'documentosSimilares' => $validated['documentosSimilares'] ?? false,
                'forzarApellidos' => $validated['forzarApellidos'] ?? false,
                'generarCertificados' => $validated['generarCertificados'] ?? true,
            ],
            'total_aciertos' => $resultado['data']['total_aciertos'],
            'codigo_certificado' => $resultado['data']['codigo_certificado'],
            'raw_response' => $resultado['data'],
        ]);
        
        return response()->json([
            'success' => true,
            'data' => $resultado['data'],
            'busqueda_id' => $busqueda->id,
        ]);
    }
    
    /**
     * Historial de búsquedas
     */
    public function historial(Request $request)
    {
        $query = ListaPEPBusqueda::with(['user', 'notaria'])
            ->where('user_id', auth()->id());
        
        // Filtros
        if ($request->filled('termino')) {
            $termino = $request->termino;
            $query->where(function($q) use ($termino) {
                $q->where('apellido_denominacion', 'like', "%{$termino}%")
                  ->orWhere('nombres', 'like', "%{$termino}%")
                  ->orWhere('identificacion', 'like', "%{$termino}%");
            });
        }
        
        if ($request->filled('dias')) {
            $dias = (int) $request->dias;
            $query->where('created_at', '>=', now()->subDays($dias));
        }
        
        $historial = $query->latest()
            ->paginate(20)
            ->withQueryString();
        
        return response()->json($historial);
    }
    
    // TODO: Implementar generación de PDFs
    // public function certificadoConCoincidencias(Request $request) {}
    // public function certificadoSinCoincidencias(Request $request) {}
    // public function descargarListado(string $tipo) {}
}
```

---

### **FASE 5: Rutas y Middleware** 🛣️

**Prioridad:** ALTA  
**Estado:** 🔄 **PARCIAL** (50%) — Rutas de certificados activas, resto comentado.  
**Tiempo estimado:** 30 minutos (restante)

#### Tareas:
1. ✅ Rutas de certificados activas:
   - `POST /admin/listas-pep/certificado/sin-coincidencias`
   - `POST /admin/listas-pep/certificado/con-coincidencia`
2. ❌ Descomentar `buscar` (requiere FASE 3)
3. ❌ Descomentar `historial/data`
4. ❌ Descomentar `listados/{tipo}`

**Código:**
```php
// routes/web.php (líneas 377-382, descomentar)
Route::prefix('listas-pep')->name('listas-pep.')->middleware(['auth', 'verified'])->group(function () {
    Route::post('buscar', [\App\Http\Controllers\Admin\ListasPEPController::class, 'buscar'])->name('buscar');
    Route::get('historial/data', [\App\Http\Controllers\Admin\ListasPEPController::class, 'historial'])->name('historial.data');
    Route::post('certificado/con-coincidencias', [\App\Http\Controllers\Admin\ListasPEPController::class, 'certificadoConCoincidencias'])->name('certificado.con-coincidencias');
    Route::post('certificado/sin-coincidencias', [\App\Http\Controllers\Admin\ListasPEPController::class, 'certificadoSinCoincidencias'])->name('certificado.sin-coincidencias');
    Route::get('listados/{tipo}', [\App\Http\Controllers\Admin\ListasPEPController::class, 'descargarListado'])->name('listados');
});
```

---

### **FASE 6: Testing y Ajustes** 🧪

**Prioridad:** MEDIA  
**Tiempo estimado:** 2 horas

#### Tareas:
1. ✅ Probar búsqueda con credenciales reales
2. ✅ Verificar mapeo de datos API → React
3. ✅ Probar generación de certificados
4. ✅ Probar historial con filtros
5. ✅ Ajustar estilos visuales
6. ✅ Probar en diferentes notarías
7. ✅ Verificar contador de paquete

---

### **FASE 7: Generación de PDFs** 📄

**Prioridad:** BAJA (Opcional)  
**Tiempo estimado:** 3-4 horas

#### Tareas:
1. ⏳ Instalar `barryvdh/laravel-dompdf` o similar
2. ⏳ Crear plantillas Blade para certificados
3. ⏳ Implementar `certificadoConCoincidencias()`
4. ⏳ Implementar `certificadoSinCoincidencias()`
5. ⏳ Agregar logo de ATINET y marca de agua
6. ⏳ Incluir código QR de verificación

---

### **FASE 8: Listados Complementarios** 📥

**Prioridad:** BAJA (Opcional)  
**Tiempo estimado:** 1 hora

#### Tareas:
1. ⏳ Subir PDFs de REFIPRE, OCDE, GAFI a `storage/app/public/listados/`
2. ⏳ Implementar `descargarListado(string $tipo)`
3. ⏳ Agregar control de acceso

---

## 📊 Resumen de Prioridades

| Fase | Descripción | Prioridad | Estado |
|------|-------------|-----------|--------|
| 1 | Mejorar Vista React | 🔴 ALTA | ⏳ Pendiente |
| 2 | Migración y Modelo | 🔴 ALTA | ⏳ Pendiente |
| 3 | Servicio API Externa | 🔴 ALTA | ⏳ Pendiente |
| 4 | Controlador | 🔴 ALTA | ⏳ Pendiente |
| 5 | Rutas y Middleware | 🔴 ALTA | ⏳ Pendiente |
| 6 | Testing y Ajustes | 🟡 MEDIA | ⏳ Pendiente |
| 7 | Generación de PDFs | 🟢 BAJA | ⏳ Pendiente |
| 8 | Listados Complementarios | 🟢 BAJA | ⏳ Pendiente |

---

## 🚀 Orden de Ejecución Recomendado

1. **Primero:** FASE 1 (Mejorar React) → Tener la UI completa
2. **Segundo:** FASE 2 + 3 + 4 (Backend completo) → En un solo flujo
3. **Tercero:** FASE 5 (Rutas) → Conectar todo
4. **Cuarto:** FASE 6 (Testing) → Verificar funcionamiento
5. **Opcional:** FASE 7 y 8 → Si el cliente lo requiere

---

## ✅ Checklist de Implementación

### Vista React (FASE 1)
- [ ] Agregar checkboxes de opciones
- [ ] Actualizar tipos TypeScript
- [ ] Crear función de mapeo API
- [ ] Crear componente de detalle
- [ ] Mostrar código de certificado
- [ ] Formatear fechas correctamente
- [ ] Probar con datos de ejemplo

### Backend (FASES 2-5)
- [ ] Migración ejecutada
- [ ] Modelo creado con relaciones
- [ ] Servicio de API externa funcional
- [ ] Caché de token implementado
- [ ] Controlador con todos los métodos
- [ ] Rutas descomentadas y protegidas
- [ ] Validación de requests
- [ ] Logging de errores

### Testing (FASE 6)
- [ ] Búsqueda exitosa con API real
- [ ] Datos se guardan en BD correctamente
- [ ] Historial funcional con filtros
- [ ] Vista React muestra datos correctos
- [ ] Contador de paquete actualizado
- [ ] Manejo de errores funciona

---

## 📌 Notas Importantes

1. **Credenciales de API:**  
   - Usuario: `acostacl`
   - Clave: `26F1D723`
   - **IMPORTANTE:** Mover a `.env` antes de producción

2. **Caché de Token:**  
   - Duración: 55 minutos (token dura 1 hora, se renueva 5 min antes)
   - Clave: `pld_token`

3. **Paquete Contratado:**  
   - Total: 600 búsquedas
   - TODO: Implementar contador real en base de datos

4. **Campos Críticos:**  
   - `apellido` es REQUERIDO por la API
   - `nombre` es REQUERIDO por la API
   - `identificacion` es opcional pero RECOMENDADO

5. **Tipos de PEP:**  
   - PEP: Persona activa
   - EX PEP: Persona inactiva
   - AFIN PEP: Familiar de PEP activo
   - AFIN EX PEP: Familiar de ex-PEP

---

## 🎯 Resultado Final Esperado

Al completar todas las fases ALTA:

✅ Usuario puede buscar personas en listas PEP  
✅ Resultados se muestran con todos los detalles  
✅ Búsquedas se guardan en BD con historial  
✅ Contador de paquete funciona correctamente  
✅ Vista detallada de cada resultado  
✅ Filtros por tipo y fuente  
✅ Sistema completamente funcional  

---

**Última actualización:** Mayo 27, 2026  
**Autor:** Sistema de Análisis Técnico
