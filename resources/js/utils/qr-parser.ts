/**
 * QR Parser Module - Atinet Compliance Hub
 * Procesa diferentes formatos de códigos QR (CURP, Acta, SAT, etc.)
 *
 * Portado desde: utilerias_appliweb/assets/js/modules/qr-processor.js
 */

export interface ParsedQRData {
    _tipoDocumento?: 'acta_nacimiento' | 'curp' | 'sat' | 'desconocido';

    // Datos personales
    nombre?: string;
    apellidopat?: string;
    apellidomat?: string;
    curp?: string;
    rfc?: string;
    genero?: 'H' | 'M'; // H=Hombre, M=Mujer
    dia?: string; // YYYY-MM-DD
    nacionalidad?: string;

    // Lugar de nacimiento
    estado_nac?: string;
    municipio_nac?: string;
    paisnac?: string;

    // Padres
    padre_nombre?: string;
    madre_nombre?: string;

    // Acta de nacimiento
    num_acta?: string;
    folio_acta?: string;
    foja_acta?: string;
    tomo_acta?: string;
    libro_acta?: string;
    url_verificacion?: string;

    // SAT
    urlSAT?: string;
    serie_sat?: string;

    // Otros
    [key: string]: any;
}

/**
 * Procesar datos del QR según formato
 */
export function procesarDatosQR(textoQR: string): ParsedQRData {
    try {
        // Intentar parsear como JSON
        const datos = JSON.parse(textoQR);
        return datos;
    } catch {
        // Si no es JSON, intentar otros formatos

        // Formato pipe-delimited (acta registro civil KV o INE posicional)
        if (textoQR.includes('|')) {
            // Acta de Nacimiento formato clave:valor (Registro Civil mexicano)
            if (esQRdeActaNacimientoKV(textoQR)) {
                return parsearQRActaNacimientoKV(textoQR);
            }
            return parsearQRPipeDelimited(textoQR);
        }

        // Formato URL-encoded
        if (textoQR.startsWith('http') || textoQR.includes('=')) {
            // Detectar QR de Acta de Nacimiento (prioridad sobre RENAPO genérico)
            if (esQRdeActaNacimiento(textoQR)) {
                return parsearQRActaNacimiento(textoQR);
            }
            // Detectar QR de RENAPO (constancia CURP)
            if (esQRdeRENAPO(textoQR)) {
                return parsearQRRENAPO(textoQR);
            }
            // Detectar QR SAT (constancia fiscal)
            if (esQRdeSAT(textoQR)) {
                    const satData = parsearQRURLEncoded(textoQR);
                    return { ...satData, urlSAT: textoQR, _tipoDocumento: 'sat' };
            }
            return parsearQRURLEncoded(textoQR);
        }

        // Si es solo texto, buscar CURP
        const curpMatch = textoQR.match(/[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d/);
        if (curpMatch) {
            return { curp: curpMatch[0] };
        }

        // No se pudo parsear
        return {};
    }
}

/**
 * Mapeo de códigos de estado a nombres
 */
const ESTADOS_CODIGO: Record<string, string> = {
    '1': 'AGUASCALIENTES',
    '2': 'BAJA CALIFORNIA',
    '3': 'BAJA CALIFORNIA SUR',
    '4': 'CAMPECHE',
    '5': 'COAHUILA',
    '6': 'COLIMA',
    '7': 'CHIAPAS',
    '8': 'CHIHUAHUA',
    '9': 'CIUDAD DE MEXICO',
    '10': 'DURANGO',
    '11': 'GUANAJUATO',
    '12': 'GUERRERO',
    '13': 'HIDALGO',
    '14': 'JALISCO',
    '15': 'ESTADO DE MEXICO',
    '16': 'MICHOACAN',
    '17': 'MORELOS',
    '18': 'NAYARIT',
    '19': 'NUEVO LEON',
    '20': 'OAXACA',
    '21': 'PUEBLA',
    '22': 'QUERETARO',
    '23': 'QUINTANA ROO',
    '24': 'SAN LUIS POTOSI',
    '25': 'SINALOA',
    '26': 'SONORA',
    '27': 'TABASCO',
    '28': 'TAMAULIPAS',
    '29': 'TLAXCALA',
    '30': 'VERACRUZ',
    '31': 'YUCATAN',
    '32': 'ZACATECAS',
};

/**
 * Detectar formato clave:valor del Registro Civil (Acta de Nacimiento)
 */
function esQRdeActaNacimientoKV(texto: string): boolean {
    return (
        texto.includes('Padre1:') ||
        texto.includes('Padre2:') ||
        (texto.includes('Registrado:') && texto.includes('Acta:') && texto.includes('FechaNacimiento:'))
    );
}

/**
 * Parsear QR del Registro Civil en formato clave:valor pipe-delimited
 */
function parsearQRActaNacimientoKV(texto: string): ParsedQRData {
    const datos: ParsedQRData = { _tipoDocumento: 'acta_nacimiento' };

    // Parsear cada campo clave:valor
    const partes = texto.split('|');
    const kv: Record<string, string> = {};

    for (const parte of partes) {
        const colonIdx = parte.indexOf(':');
        if (colonIdx < 0) continue;

        const clave = parte.slice(0, colonIdx).trim();
        // Quitar coma final si existe
        const valor = parte.slice(colonIdx + 1).replace(/,\s*$/, '').trim();

        if (clave && valor) kv[clave] = valor;
    }

    // CURP
    if (kv['CURP']) {
        const c = kv['CURP'].trim();
        if (/^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/.test(c)) {
            datos.curp = c;
        }
    }

    // Nombre registrado: "GABRIELA ALEJANDRA GUZMAN PINAL"
    // Heurística: última palabra = apellidomat, penúltima = apellidopat, resto = nombre
    if (kv['Registrado']) {
        const palabras = kv['Registrado'].trim().toUpperCase().split(/\s+/);
        if (palabras.length >= 3) {
            datos.apellidomat = palabras[palabras.length - 1];
            datos.apellidopat = palabras[palabras.length - 2];
            datos.nombre = palabras.slice(0, palabras.length - 2).join(' ');
        } else if (palabras.length === 2) {
            datos.apellidopat = palabras[0];
            datos.nombre = palabras[1];
        } else {
            datos.nombre = kv['Registrado'].toUpperCase();
        }
    }

    // Padre1 = padre, Padre2 = madre (convención del Registro Civil)
    if (kv['Padre1']) datos.padre_nombre = kv['Padre1'].toUpperCase();
    if (kv['Padre2']) datos.madre_nombre = kv['Padre2'].toUpperCase();

    // Fecha de nacimiento DD/MM/YYYY → YYYY-MM-DD
    if (kv['FechaNacimiento']) {
        datos.dia = normalizarFecha(kv['FechaNacimiento']);
    }

    // Sexo: F → 'M' (Mujer), M → 'H' (Hombre) — notación CURP
    if (kv['Sexo']) {
        const s = kv['Sexo'].toUpperCase();
        datos.genero = s === 'F' || s === 'FEMENINO' ? 'M' : 'H';
    }

    // Entidad numérica → nombre estado
    if (kv['Entidad']) {
        const cod = kv['Entidad'].replace(',', '').trim();
        datos.estado_nac = ESTADOS_CODIGO[cod] || kv['Entidad'];
    }

    // Número de acta
    if (kv['Acta']) datos.num_acta = kv['Acta'].replace(',', '').trim();
    if (kv['Foja']) datos.foja_acta = kv['Foja'].replace(',', '').trim();
    if (kv['Tomo']) datos.tomo_acta = kv['Tomo'].replace(',', '').trim();
    if (kv['Libro']) datos.libro_acta = kv['Libro'].replace(',', '').trim();

    // Cadena de verificación
    if (kv['Cadena']) datos.folio_acta = kv['Cadena'].replace(',', '').trim();

    datos.nacionalidad = 'MEXICANA';
    datos.paisnac = 'México';

    return datos;
}

/**
 * Detectar si el QR proviene de Registro Civil (Acta de Nacimiento)
 */
function esQRdeActaNacimiento(texto: string): boolean {
    const dominios = [
        'cevar.registrocivil.gob.mx',
        'registrocivil.gob.mx',
        'miregistrocivil.gob.mx',
        'gob.mx/ActaNacimiento',
        'gob.mx/acta',
    ];
    return dominios.some((d) => texto.toLowerCase().includes(d.toLowerCase()));
}

/**
 * Parsear QR de Acta de Nacimiento
 */
function parsearQRActaNacimiento(texto: string): ParsedQRData {
    const datos: ParsedQRData = { _tipoDocumento: 'acta_nacimiento' };

    try {
        const url = new URL(texto);
        const params = new URLSearchParams(url.search);

        // Folio del acta
        const folio = params.get('folio') || params.get('id') || params.get('f');
        if (folio) datos.folio_acta = folio.toUpperCase();

        // CURP (si viene en la URL)
        const curp = params.get('curp') || params.get('CURP');
        if (curp) datos.curp = curp.toUpperCase();

        // Otros campos que algunos estados incluyen
        const nombre = params.get('nombre');
        const pat = params.get('paterno') || params.get('apellido_paterno') || params.get('primer_apellido');
        const mat = params.get('materno') || params.get('apellido_materno') || params.get('segundo_apellido');
        const fecha = params.get('fecha_nacimiento') || params.get('fecha');
        const entidad = params.get('entidad') || params.get('estado') || params.get('lugar_nacimiento');
        const padre = params.get('padre') || params.get('nombre_padre');
        const madre = params.get('madre') || params.get('nombre_madre');

        if (nombre) datos.nombre = nombre.toUpperCase();
        if (pat) datos.apellidopat = pat.toUpperCase();
        if (mat) datos.apellidomat = mat.toUpperCase();
        if (fecha) datos.dia = normalizarFecha(fecha);
        if (entidad) datos.estado_nac = entidad.toUpperCase();
        if (padre) datos.padre_nombre = padre.toUpperCase();
        if (madre) datos.madre_nombre = madre.toUpperCase();

        // URL de verificación para consulta futura
        datos.url_verificacion = texto;
    } catch {
        // Si no es URL, buscar CURP en texto
        const curpMatch = texto.match(/[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d/);
        if (curpMatch) datos.curp = curpMatch[0];
    }

    return datos;
}

/**
 * Detectar si el QR proviene de RENAPO (constancia CURP)
 */
function esQRdeRENAPO(texto: string): boolean {
    const dominiosRENAPO = [
        'consultas.curp.gob.mx',
        'curp.gob.mx',
        'renapo.gob.mx',
        'www.gob.mx/curp',
    ];
    return dominiosRENAPO.some((d) => texto.includes(d));
}

/**
 * Parsear QR de constancia CURP del RENAPO
 */
function parsearQRRENAPO(texto: string): ParsedQRData {
    const datos: ParsedQRData = { _tipoDocumento: 'curp' };

    try {
        const url = new URL(texto);
        const params = new URLSearchParams(url.search);

        // El CURP viene como parámetro 'curp' en la URL
        const curp = params.get('curp');
        if (curp) {
            datos.curp = curp.toUpperCase();
        }

        // Algunos QR incluyen más datos en la URL
        const nombre = params.get('nombre') || params.get('name');
        const primerApellido = params.get('primer_apellido') || params.get('paterno');
        const segApellido = params.get('segundo_apellido') || params.get('materno');
        const fechaNac = params.get('fecha_nacimiento');
        const sexo = params.get('sexo');

        if (nombre) datos.nombre = nombre.toUpperCase();
        if (primerApellido) datos.apellidopat = primerApellido.toUpperCase();
        if (segApellido) datos.apellidomat = segApellido.toUpperCase();
        if (fechaNac) datos.dia = fechaNac;
        if (sexo) {
            const sx = sexo.toUpperCase();
            datos.genero = (sx === 'H' || sx === 'HOMBRE' || sx === 'MASCULINO') ? 'H' : 'M';
        }
    } catch {
        // Si no es URL válida, buscar CURP directamente en el texto
        const curpMatch = texto.match(/[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d/);
        if (curpMatch) {
            datos.curp = curpMatch[0];
        }
    }

    return datos;
}

/**
 * Detectar si el QR es del SAT (constancia fiscal)
 */
function esQRdeSAT(texto: string): boolean {
    return texto.includes('siat.sat.gob.mx');
}

/**
 * Parsear QR con formato pipe-delimited
 */
function parsearQRPipeDelimited(texto: string): ParsedQRData {
    const partes = texto.split('|').map((p) => p.trim());
    const datos: ParsedQRData = {};

    // Detectar CURP en alguna posición
    const curpIdx = partes.findIndex((p) => /^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/.test(p));

    if (curpIdx >= 0) {
        datos._tipoDocumento = 'curp';
        datos.curp = partes[curpIdx];

        // Con el CURP como ancla, leer posiciones relativas
        if (curpIdx >= 3) {
            // Caso: AP_PAT|AP_MAT|NOMBRE|CURP|...
            datos.apellidopat = partes[curpIdx - 3] || '';
            datos.apellidomat = partes[curpIdx - 2] || '';
            datos.nombre = partes[curpIdx - 1] || '';
        } else if (curpIdx >= 2) {
            // Caso: NOMBRE|AP_PAT|CURP|...
            datos.nombre = partes[0] || '';
            datos.apellidopat = partes[1] || '';
        } else if (curpIdx >= 1) {
            datos.nombre = partes[0] || '';
        }

        // Campos después del CURP
        const sexo = partes[curpIdx + 1];
        const fecha = partes[curpIdx + 2];
        const estado = partes[curpIdx + 3];
        const mun = partes[curpIdx + 4];
        const nacion = partes[curpIdx + 5];
        const padreNombre = partes[curpIdx + 6];
        const madreNombre = partes[curpIdx + 7];
        const folioActa = partes[curpIdx + 8];

        if (sexo && /^[HM]$/.test(sexo.toUpperCase())) {
            datos.genero = sexo.toUpperCase() as 'H' | 'M';
        }

        if (fecha) {
            datos.dia = normalizarFecha(fecha);
        }

        if (estado && esEstadoValido(estado)) {
            datos.estado_nac = estado.toUpperCase();
        }
        if (mun && datos.estado_nac && !esTokenGenero(mun) && !esNacionalidadValida(mun)) {
            datos.municipio_nac = mun.toUpperCase();
        }
        if (nacion && esNacionalidadValida(nacion)) {
            datos.nacionalidad = nacion.toUpperCase();
        }

        // Heurística: algunos QR CURP colocan apellidos/nombre después del CURP
        // y antes del sexo; en ese caso los extraemos para evitar desplazamientos.
        if (!datos.nombre && !datos.apellidopat && !datos.apellidomat) {
            const tail = partes.slice(curpIdx + 1);
            const sexoIdx = tail.findIndex(esTokenGenero);

            if (sexoIdx >= 2) {
                if (sexoIdx >= 3) {
                    datos.apellidopat = tail[0]?.toUpperCase();
                    datos.apellidomat = tail[1]?.toUpperCase();
                    datos.nombre = tail.slice(2, sexoIdx).join(' ').toUpperCase();
                } else {
                    datos.apellidopat = tail[0]?.toUpperCase();
                    datos.nombre = tail[1]?.toUpperCase();
                }

                const sexoToken = tail[sexoIdx];
                if (sexoToken) {
                    datos.genero = esGeneroHombre(sexoToken) ? 'H' : 'M';
                }

                const fechaToken = tail[sexoIdx + 1];
                const fechaNormalizada = normalizarFecha(fechaToken);
                if (fechaNormalizada) {
                    datos.dia = fechaNormalizada;
                }
            }
        }

        if (padreNombre && padreNombre.length > 2) datos.padre_nombre = padreNombre;
        if (madreNombre && madreNombre.length > 2) datos.madre_nombre = madreNombre;
        if (folioActa && folioActa.length > 2) datos.folio_acta = folioActa;
    } else if (partes.length >= 8) {
        // Sin CURP claro, usar posiciones fijas legacy
        datos.apellidopat = partes[0];
        datos.apellidomat = partes[1];
        datos.nombre = partes[2];
        datos.genero = partes[4] === 'H' ? 'H' : 'M';
        datos.dia = partes[5];
        datos.estado_nac = partes[6];
    }

    return datos;
}

function esGeneroHombre(token: string): boolean {
    const t = token.toUpperCase().trim();

    return t === 'H' || t === 'HOMBRE' || t === 'MASCULINO' || t === 'M_HOMBRE';
}

function esTokenGenero(token: string): boolean {
    const t = token.toUpperCase().trim();

    return (
        t === 'H' ||
        t === 'M' ||
        t === 'HOMBRE' ||
        t === 'MUJER' ||
        t === 'MASCULINO' ||
        t === 'FEMENINO' ||
        t === 'M_HOMBRE' ||
        t === 'F_MUJER'
    );
}

function esNacionalidadValida(token: string): boolean {
    const t = token.toUpperCase().trim();

    return t.includes('MEXIC') || t.includes('EXTRANJ');
}

function esEstadoValido(token: string): boolean {
    const t = token.toUpperCase().trim();
    const estados = new Set(Object.values(ESTADOS_CODIGO));
    const codigosDosLetras = new Set([
        'AS', 'BC', 'BS', 'CC', 'CL', 'CM', 'CS', 'CH', 'DF', 'DG', 'GT', 'GR', 'HG', 'JC', 'MC', 'MN',
        'MS', 'NT', 'NL', 'OC', 'PL', 'QT', 'QR', 'SP', 'SL', 'SR', 'TC', 'TS', 'TL', 'VZ', 'YN', 'ZS',
    ]);

    return estados.has(t) || codigosDosLetras.has(t);
}

/**
 * Parsear QR con formato URL-encoded
 */
function parsearQRURLEncoded(texto: string): ParsedQRData {
    const datos: ParsedQRData = {};

    try {
        const url = new URL(texto);
        const params = new URLSearchParams(url.search);

        // Extraer parámetros
        for (const [key, value] of params.entries()) {
            datos[key] = value;
        }

        // Parseo específico para QR SAT
        if (texto.includes('siat.sat.gob.mx') && datos.D3) {
            datos.urlSAT = texto;

            // D3 contiene: NumeroSerie_RFC
            const partes = datos.D3.split('_');
            if (partes.length >= 2) {
                datos.rfc = partes[1];
                datos.serie_sat = partes[0];

                // Extraer fecha del RFC
                const rfc = partes[1];
                if (rfc.length >= 10) {
                    // Detectar si es física o moral
                    let inicioFecha = 4; // Por defecto física
                    const cuartaCaracter = rfc[3];

                    if (!isNaN(Number(cuartaCaracter))) {
                        inicioFecha = 3; // Moral
                    }

                    const fechaStr = rfc.substring(inicioFecha, inicioFecha + 6);
                    let año = parseInt(fechaStr.substring(0, 2));
                    const mes = fechaStr.substring(2, 4);
                    const dia = fechaStr.substring(4, 6);

                    // Determinar siglo
                    año = año < 30 ? 2000 + año : 1900 + año;

                    datos.dia = `${año}-${mes}-${dia}`;
                }
            }
        }
    } catch {
        // Si no es URL válida, intentar split por &
        const pares = texto.split('&');

        pares.forEach((par) => {
            const [key, value] = par.split('=');
            if (key && value) {
                datos[key] = decodeURIComponent(value);
            }
        });
    }

    return datos;
}

/**
 * Normalizar fecha a YYYY-MM-DD
 */
function normalizarFecha(fecha: string | null | undefined): string | undefined {
    if (!fecha) return undefined;

    // Ya está en formato correcto
    if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return fecha;

    // Formato DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) {
        const [d, m, a] = fecha.split('/');
        return `${a}-${m}-${d}`;
    }

    // Formato YYYYMMDD
    if (/^\d{8}$/.test(fecha)) {
        return `${fecha.slice(0, 4)}-${fecha.slice(4, 6)}-${fecha.slice(6, 8)}`;
    }

    return fecha;
}
