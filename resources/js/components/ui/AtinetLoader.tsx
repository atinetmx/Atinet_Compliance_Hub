/**
 * AtinetLoader - Loader 3D con animación Three.js
 * Portado desde PHP legacy: atinet-loader.js
 *
 * Visualización 3D del logo Atinet con:
 * - Modelo GLB animado (rotación + floating)
 * - Anillos orbitales
 * - Iluminación ambiental + direccional + acento rojo (marca Atinet)
 * - Integración con SweetAlert2
 */

import Swal from 'sweetalert2';

// Types para Three.js (importado dinámicamente)
type ThreeModule = any; // Dynamic import - type checked at runtime
type GLTFLoaderModule = {
    GLTFLoader: any;
};

interface LoaderOptions {
    title?: string;
    text?: string;
    showRings?: boolean;
    singleRing?: boolean;
    allowEscapeKey?: boolean;
    allowOutsideClick?: boolean;
    showConfirmButton?: boolean;
}

interface LoaderInstance {
    update: (text: string) => void;
    updateTitle: (title: string) => void;
    close: () => void;
}

// Estado interno del loader
let THREE: ThreeModule | null = null;
let GLTFLoader: any = null;
let currentAnimationId: number | null = null;
let currentRenderer: any = null;

/**
 * Carga los módulos Three.js dinámicamente (solo una vez)
 */
async function loadThreeJS(): Promise<void> {
    if (THREE && GLTFLoader) return;

    try {
        // @ts-ignore - Dynamic ESM import from CDN
        THREE = await import('https://esm.sh/three@0.169.0');
        console.log('✅ Three.js loaded');

        // @ts-ignore - Dynamic ESM import from CDN
        const gltfModule = await import('https://esm.sh/three@0.169.0/examples/jsm/loaders/GLTFLoader');
        GLTFLoader = gltfModule.GLTFLoader;
        console.log('✅ GLTFLoader loaded');
    } catch (error) {
        console.error('❌ Error loading Three.js modules:', error);
        throw new Error('No se pudo cargar el motor 3D');
    }
}

/**
 * Genera HTML del loader con canvas y anillos opcionales
 * HTML exacto del sistema PHP legacy
 */
function getLoaderHTML(options: { showRings?: boolean; singleRing?: boolean; text?: string } = {}): string {
    const { showRings = true, singleRing = false, text = '' } = options;

    let ringClass = '';
    if (!showRings) {
        ringClass = 'no-rings';
    } else if (singleRing) {
        ringClass = 'single-ring';
    }

    return `
        <div class="atinet-3d-loader ${ringClass}">
            <div class="atinet-orbital-ring"></div>
            <div class="atinet-orbital-ring-2"></div>
            <canvas id="atinet-3d-canvas" width="200" height="200" class="atinet-logo-3d-canvas"></canvas>
        </div>
        ${text ? `<div class="atinet-loader-text">${text}</div>` : ''}
    `;
}

/**
 * Inicializa la escena Three.js en el canvas
 * Lógica exacta del sistema PHP legacy - animación comienza antes de cargar modelo
 */
async function initThreeJS(canvas: HTMLCanvasElement): Promise<void> {
    if (!THREE || !GLTFLoader) {
        throw new Error('Three.js no está cargado');
    }

    // Renderer con configuración exacta del original
    const SIZE = 200;
    const renderer = new (THREE as any).WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true
    });
    renderer.setSize(SIZE, SIZE);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    currentRenderer = renderer;

    // Scene
    const scene = new (THREE as any).Scene();

    // Camera - configuración exacta del original
    const camera = new (THREE as any).PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.z = 4;

    // Iluminación - exacta del original
    scene.add(new (THREE as any).AmbientLight(0xffffff, 1.5));

    const dirLight = new (THREE as any).DirectionalLight(0xffffff, 2);
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);

    // Luz de acento roja (color Atinet #dc3545)
    const redLight = new (THREE as any).PointLight(0xdc3545, 3, 10);
    redLight.position.set(-2, 2, 2);
    scene.add(redLight);

    let pivot: any = null;
    let clock = 0;

    // Ruta del modelo GLB
    const glbPath = `/assets/img/atinet3d.glb`;
    console.log('🔵 Intentando cargar modelo 3D desde:', glbPath);

    const loader = new GLTFLoader();

    // Cargar modelo GLB (asíncrono)
    loader.load(
        glbPath,
        (gltf: any) => {
            console.log('✅ Modelo 3D cargado exitosamente');
            const model = gltf.scene;

            // Calcular bounding box y centrar el modelo
            const box = new (THREE as any).Box3().setFromObject(model);
            const center = box.getCenter(new (THREE as any).Vector3());
            const size = box.getSize(new (THREE as any).Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);

            console.log('📦 Dimensiones del modelo:', { size, maxDim, center });

            // Centrar el modelo en su propio origen
            model.position.set(-center.x, -center.y, -center.z);

            // Pivot group para rotación y escala
            pivot = new (THREE as any).Group();
            pivot.scale.setScalar(2 / maxDim);
            pivot.rotation.x = 0.25; // Inclinación inicial
            pivot.add(model);
            scene.add(pivot);

            console.log('✅ Modelo 3D agregado a la escena');
        },
        (progress: any) => {
            const percentComplete = (progress.loaded / progress.total) * 100;
            console.log(`⏳ Cargando modelo: ${percentComplete.toFixed(1)}%`);
        },
        (error: any) => {
            console.error('❌ Error al cargar atinet3d.glb:', error);
            // Continuar sin modelo (solo anillos de carga)
        }
    );

    // IMPORTANTE: Animation loop comienza ANTES de cargar el modelo
    // Esto asegura que los anillos giren aunque el modelo falle
    const animate = () => {
        currentAnimationId = requestAnimationFrame(animate);

        // Solo animar el pivot si existe (cuando el modelo se haya cargado)
        if (pivot) {
            pivot.rotation.y += 0.018; // Rotación constante
            clock += 0.02;
            pivot.position.y = Math.sin(clock) * 0.08; // Efecto floating
        }

        renderer.render(scene, camera);
    };

    animate(); // Iniciar loop inmediatamente
}

/**
 * Limpia recursos de Three.js
 */
function disposeThreeJS(): void {
    if (currentAnimationId !== null) {
        cancelAnimationFrame(currentAnimationId);
        currentAnimationId = null;
    }

    if (currentRenderer) {
        currentRenderer.dispose();
        currentRenderer = null;
    }
}

/**
 * Muestra el loader 3D con opciones personalizadas
 */
async function show(options: LoaderOptions = {}): Promise<LoaderInstance> {
    const {
        title = 'Procesando...',
        text = 'Por favor espera',
        showRings = true,
        singleRing = false,
        allowEscapeKey = false,
        allowOutsideClick = false,
        showConfirmButton = false,
    } = options;

    // Cargar Three.js si no está cargado
    await loadThreeJS();

    // Mostrar SweetAlert2 con el loader - configuración exacta del original
    const swalInstance = Swal.fire({
        title,
        html: getLoaderHTML({ showRings, singleRing, text }),
        allowEscapeKey,
        allowOutsideClick,
        showConfirmButton,
        customClass: {
            popup: 'atinet-custom-loader', // Clase CSS del original
        },
        didOpen: () => {
            const canvas = document.getElementById('atinet-3d-canvas') as HTMLCanvasElement;
            if (canvas) {
                initThreeJS(canvas).catch((error) => {
                    console.error('Error initializing Three.js:', error);
                });
            }
        },
        willClose: () => {
            disposeThreeJS();
        },
    });

    // Retornar instancia con métodos de control
    return {
        update: (newText: string) => {
            Swal.update({
                html: getLoaderHTML({ showRings, singleRing, text: newText })
            });
        },
        updateTitle: (newTitle: string) => {
            Swal.update({ title: newTitle });
        },
        close: () => {
            Swal.close();
        },
    };
}

/**
 * Métodos de conveniencia con títulos predefinidos
 */

export const AtinetLoader = {
    /**
     * Muestra loader genérico con opciones personalizadas
     */
    show,

    /**
     * Loader para consulta SAT
     */
    showSAT: async (): Promise<LoaderInstance> => {
        return show({
            title: 'Consultando SAT...',
            text: 'Obteniendo datos fiscales del Servicio de Administración Tributaria',
            showRings: true,
        });
    },

    /**
     * Loader para escaneo OCR
     */
    showOCR: async (): Promise<LoaderInstance> => {
        return show({
            title: 'Escaneando documento...',
            text: 'Extrayendo información del documento',
            showRings: true,
        });
    },

    /**
     * Loader para completar datos con catálogos
     */
    showCompletando: async (): Promise<LoaderInstance> => {
        return show({
            title: 'Completando datos...',
            text: 'Consultando catálogos y servicios externos',
            showRings: true,
        });
    },

    /**
     * Loader para guardado
     */
    showGuardando: async (): Promise<LoaderInstance> => {
        return show({
            title: 'Guardando información...',
            text: 'Almacenando datos en la base de datos',
            showRings: false,
        });
    },

    /**
     * Cierra cualquier loader activo
     */
    close: (): void => {
        Swal.close();
    },
};

export default AtinetLoader;
