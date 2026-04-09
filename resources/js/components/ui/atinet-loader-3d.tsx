import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';

interface AtinetLoader3DProps {
    showRings?: boolean;
    singleRing?: boolean;
    text?: string;
    size?: number;
}

export function AtinetLoader3D({
    showRings = true,
    singleRing = false,
    text,
    size = 200,
}: AtinetLoader3DProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationIdRef = useRef<number | undefined>(undefined);
    const rendererRef = useRef<THREE.WebGLRenderer | undefined>(undefined);

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        let pivot: THREE.Group | null = null;
        let clock = 0;

        // Inicializar renderer
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setSize(size, size);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        rendererRef.current = renderer;

        // Scene y camera
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
        camera.position.z = 4;

        // Iluminación
        scene.add(new THREE.AmbientLight(0xffffff, 1.5));
        const dirLight = new THREE.DirectionalLight(0xffffff, 2);
        dirLight.position.set(5, 10, 7.5);
        scene.add(dirLight);

        // Luz de acento roja (color Atinet)
        const redLight = new THREE.PointLight(0xdc3545, 3, 10);
        redLight.position.set(-2, 2, 2);
        scene.add(redLight);

        // Cargar modelo GLB
        const loader = new GLTFLoader();
        const glbPath = '/build/assets/img/atinet3d.glb'; // Ajustar path según tu estructura

        loader.load(
            glbPath,
            (gltf) => {
                const model = gltf.scene;

                // Centrar modelo
                const box = new THREE.Box3().setFromObject(model);
                const center = box.getCenter(new THREE.Vector3());
                const modelSize = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(modelSize.x, modelSize.y, modelSize.z);

                model.position.set(-center.x, -center.y, -center.z);

                // Crear pivot
                pivot = new THREE.Group();
                pivot.scale.setScalar(2 / maxDim);
                pivot.rotation.x = 0.25;
                pivot.add(model);
                scene.add(pivot);
            },
            undefined,
            (error) => console.warn('⚠️ No se pudo cargar atinet3d.glb:', error)
        );

        // Animación
        const animate = () => {
            animationIdRef.current = requestAnimationFrame(animate);

            if (pivot) {
                pivot.rotation.y += 0.018;
                clock += 0.02;
                pivot.position.y = Math.sin(clock) * 0.08;
            }

            renderer.render(scene, camera);
        };

        animate();

        // Cleanup
        return () => {
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }
            if (rendererRef.current) {
                rendererRef.current.dispose();
            }
        };
    }, [size]);

    const containerClass = `relative flex justify-center items-center ${
        !showRings ? 'no-rings' : singleRing ? 'single-ring' : ''
    }`;

    return (
        <div className="flex flex-col items-center">
            <div className={containerClass} style={{ width: size, height: size }}>
                {/* Glow effect */}
                <div
                    className="absolute animate-pulse-glow"
                    style={{
                        width: size * 0.7,
                        height: size * 0.7,
                        background: 'radial-gradient(circle, rgba(220, 53, 69, 0.2) 0%, transparent 70%)',
                        borderRadius: '50%',
                        filter: 'blur(20px)',
                        zIndex: 0,
                    }}
                />

                {/* Orbital rings */}
                {showRings && (
                    <>
                        <div
                            className="absolute border-2 rounded-full animate-spin-slow border-red-500/20 border-t-red-500/80"
                            style={{
                                width: size * 0.925,
                                height: size * 0.925,
                                animationDuration: '3s',
                                zIndex: 3,
                            }}
                        />
                        {!singleRing && (
                            <div
                                className="absolute border-2 rounded-full animate-spin-reverse border-red-500/15 border-b-red-500/60"
                                style={{
                                    width: size,
                                    height: size,
                                    animationDuration: '4s',
                                    zIndex: 4,
                                }}
                            />
                        )}
                    </>
                )}

                {/* Canvas Three.js */}
                <canvas
                    ref={canvasRef}
                    width={size}
                    height={size}
                    className="absolute top-0 left-0 bg-transparent"
                    style={{ zIndex: 2 }}
                />
            </div>

            {text && (
                <div className="mt-4 text-center text-sm text-gray-600 animate-fade-in-text">
                    {text}
                </div>
            )}
        </div>
    );
}
