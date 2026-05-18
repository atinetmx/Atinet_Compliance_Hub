// Configuración
const CONFIG = {
    API_BASE_URL: 'http://localhost:8000', // Local development
    LOGOUT_URL: 'http://localhost:8000/logout',
};

// Estado global
let estadoGlobal = {
    autenticado: false,
    marcadores: [],
    formatoActual: null,
    textoSeleccionado: '',
};

// Inicialización
Office.onReady((info) => {
    if (info.host === Office.HostType.Word) {
        console.log('Office Add-in inicializado correctamente');
        inicializarAdd();
    }
});

async function inicializarAdd() {
    // Verificar autenticación
    const autenticado = await verificarAutenticacion();
    
    if (!autenticado) {
        mostrarSeccion('auth-section');
        document.getElementById('btn-login').addEventListener('click', abrirLogin);
    } else {
        estadoGlobal.autenticado = true;
        mostrarSeccion('content');
        cargarMarcadores();
        configurarListenersPalabra();
    }
}

async function verificarAutenticacion() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/user`, {
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
            }
        });
        return response.ok;
    } catch (error) {
        console.error('Error verificando autenticación:', error);
        return false;
    }
}

function abrirLogin() {
    window.open(`${CONFIG.API_BASE_URL}/admin/control-notarial/configuracion/formatos-ilimitados`, '_blank');
}

async function cargarMarcadores() {
    mostrarLoader(true);
    mostrarError(null);
    
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/Marcadores/GetMarcadores`, {
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
            }
        });
        
        if (!response.ok) throw new Error('Error cargando marcadores');
        
        const marcadores = await response.json();
        estadoGlobal.marcadores = Array.isArray(marcadores) ? marcadores : [];
        
        renderizarMarcadores(estadoGlobal.marcadores);
    } catch (error) {
        console.error('Error:', error);
        mostrarError('No se pudieron cargar los marcadores. Verifica tu conexión.');
    } finally {
        mostrarLoader(false);
    }
}

function renderizarMarcadores(marcadores) {
    const lista = document.getElementById('marcadores-list');
    
    if (!marcadores || marcadores.length === 0) {
        lista.innerHTML = '<p class="empty-state">No hay marcadores disponibles</p>';
        return;
    }
    
    lista.innerHTML = marcadores.map(m => `
        <div class="marcador-item" data-marcador="${m.marcador}" title="Clic para reemplazar texto seleccionado">
            <div class="marcador-code">${m.marcador}</div>
            <div class="marcador-description">${m.descripcion || ''}</div>
        </div>
    `).join('');
    
    // Event listeners para cada marcador
    document.querySelectorAll('.marcador-item').forEach(item => {
        item.addEventListener('click', () => reemplazarTexto(item.dataset.marcador));
    });
}

function filtrarMarcadores(termino) {
    const filtrados = estadoGlobal.marcadores.filter(m => 
        m.descripcion.toLowerCase().includes(termino.toLowerCase()) ||
        m.marcador.toLowerCase().includes(termino.toLowerCase())
    );
    renderizarMarcadores(filtrados);
}

async function reemplazarTexto(marcador) {
    try {
        // Obtener la selección actual
        const contexto = Word.createRequestContext();
        const body = contexto.document.body;
        const seleccion = contexto.document.getSelection();
        
        seleccion.load('text');
        
        await contexto.sync();
        
        if (!seleccion.text) {
            mostrarError('Por favor, selecciona un texto en el documento primero.');
            return;
        }
        
        // Reemplazar el texto
        seleccion.insertText(marcador, Word.InsertLocation.replace);
        
        await contexto.sync();
        
        // Feedback visual
        mostrarError(null);
        limpiarSelectionInfo();
        
        // Notificación de éxito (opcional)
        console.log(`Marcador insertado: ${marcador}`);
        
    } catch (error) {
        console.error('Error al reemplazar texto:', error);
        mostrarError('Error al reemplazar el texto. Intenta nuevamente.');
    }
}

function configurarListenersPalabra() {
    // Listener para cambios de selección en Word
    Word.run(async (context) => {
        try {
            const seleccion = context.document.getSelection();
            seleccion.load('text');
            
            await context.sync();
            
            // Actualizar estado de selección
            estadoGlobal.textoSeleccionado = seleccion.text;
            actualizarSelectionInfo();
            
        } catch (error) {
            console.error('Error configurando listeners:', error);
        }
    });
    
    // Event listener para búsqueda
    document.getElementById('search-input').addEventListener('input', (e) => {
        filtrarMarcadores(e.target.value);
    });
    
    // Event listener para actualizar
    document.getElementById('btn-refresh').addEventListener('click', () => {
        cargarMarcadores();
    });
    
    // Event listener para limpiar
    document.getElementById('btn-clear').addEventListener('click', () => {
        document.getElementById('search-input').value = '';
        renderizarMarcadores(estadoGlobal.marcadores);
    });
}

function actualizarSelectionInfo() {
    const infoDiv = document.getElementById('selection-info');
    const selectedSpan = document.getElementById('selected-text');
    
    if (estadoGlobal.textoSeleccionado) {
        selectedSpan.textContent = estadoGlobal.textoSeleccionado;
        infoDiv.style.display = 'block';
    } else {
        infoDiv.style.display = 'none';
    }
}

function limpiarSelectionInfo() {
    estadoGlobal.textoSeleccionado = '';
    document.getElementById('selection-info').style.display = 'none';
}

// Funciones auxiliares UI
function mostrarSeccion(seccionId) {
    document.querySelectorAll('[id$="-section"], [id$="-content"]').forEach(el => {
        el.style.display = 'none';
    });
    
    const seccion = document.getElementById(seccionId);
    if (seccion) seccion.style.display = 'block';
}

function mostrarLoader(mostrar) {
    document.getElementById('loading').style.display = mostrar ? 'block' : 'none';
    document.getElementById('content').style.display = mostrar ? 'none' : 'block';
}

function mostrarError(mensaje) {
    const errorDiv = document.getElementById('error');
    if (mensaje) {
        errorDiv.textContent = mensaje;
        errorDiv.style.display = 'block';
    } else {
        errorDiv.style.display = 'none';
    }
}
