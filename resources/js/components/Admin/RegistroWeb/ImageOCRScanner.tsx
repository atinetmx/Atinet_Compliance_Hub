import { useState, useRef } from 'react';
import { X, Camera, Upload, CheckCircle, XCircle, Loader2, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface ImageOCRScannerProps {
    isOpen: boolean;
    onClose: () => void;
    onDataExtracted: (data: Record<string, any>) => void;
    endpoint: string; // URL del endpoint OCR (ej: '/admin/ocr/ine')
    title: string; // Título del modal (ej: 'Escanear INE')
    documentType: 'INE' | 'CURP' | 'ACTA'; // Tipo de documento
    requiresSide?: boolean; // Si requiere especificar lado (INE frente/reverso)
}

type ScannerStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

export function ImageOCRScanner({
    isOpen,
    onClose,
    onDataExtracted,
    endpoint,
    title,
    documentType,
    requiresSide = false,
}: ImageOCRScannerProps) {
    const [status, setStatus] = useState<ScannerStatus>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedSide, setSelectedSide] = useState<'front' | 'back'>('front');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    /**
     * Resetear estado al cerrar
     */
    const handleClose = () => {
        setStatus('idle');
        setErrorMessage(null);
        setPreviewUrl(null);
        setSelectedSide('front');
        onClose();
    };

    /**
     * Procesar imagen capturada o subida
     */
    const processImage = async (file: File) => {
        setStatus('uploading');
        setErrorMessage(null);

        // Mostrar preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);

        try {
            // Preparar FormData
            const formData = new FormData();
            formData.append('image', file);

            // Agregar side si es INE
            if (requiresSide) {
                formData.append('side', selectedSide);
            }

            // Obtener CSRF token
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

            setStatus('processing');

            // Enviar al backend
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': token || '',
                },
                body: formData,
            });

            const result = await response.json();

            if (result.success && result.data) {
                setStatus('success');
                toast.success(`✅ ${documentType} procesado correctamente`);

                // Pasar datos al componente padre
                onDataExtracted(result.data);

                // Cerrar modal después de 1 segundo
                setTimeout(() => {
                    handleClose();
                }, 1000);
            } else {
                throw new Error(result.message || 'Error al procesar la imagen');
            }
        } catch (error: any) {
            console.error(`Error procesando ${documentType}:`, error);
            setStatus('error');

            let errorMsg = `No se pudo procesar la imagen del ${documentType}.`;

            if (error.message?.includes('Failed to fetch')) {
                errorMsg = 'Error de conexión. Verifica tu conexión a internet.';
            } else if (error.message) {
                errorMsg = error.message;
            }

            setErrorMessage(errorMsg);
            toast.error(`❌ ${errorMsg}`);
        }
    };

    /**
     * Manejar selección de archivo desde galería
     */
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
            setErrorMessage('Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).');
            return;
        }

        // Validar tamaño (máx 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setErrorMessage('La imagen es demasiado grande. Máximo 10MB.');
            return;
        }

        processImage(file);
    };

    /**
     * Abrir selector de archivo
     */
    const openFileSelector = () => {
        fileInputRef.current?.click();
    };

    /**
     * Abrir cámara nativa del dispositivo
     */
    const openCamera = () => {
        cameraInputRef.current?.click();
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
                            <button
                                onClick={handleClose}
                                className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                            >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Cerrar</span>
                            </button>
                        </div>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Selector de lado (solo para INE) */}
                        {requiresSide && status === 'idle' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Lado de la credencial:</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedSide('front')}
                                        className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                                            selectedSide === 'front'
                                                ? 'border-sky-600 bg-sky-50 text-sky-700'
                                                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        Frente
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedSide('back')}
                                        className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                                            selectedSide === 'back'
                                                ? 'border-sky-600 bg-sky-50 text-sky-700'
                                                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        Reverso
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Preview de imagen */}
                        {previewUrl && (
                            <div className="relative overflow-hidden rounded-lg border border-gray-300">
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="h-64 w-full object-contain bg-gray-50"
                                />
                            </div>
                        )}

                        {/* Estados */}
                        {status === 'idle' && !previewUrl && (
                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={openCamera}
                                    className="flex items-center justify-center gap-2"
                                    size="lg"
                                    variant="default"
                                >
                                    <Camera className="h-5 w-5" />
                                    Tomar Foto
                                </Button>
                                <Button
                                    onClick={openFileSelector}
                                    className="flex items-center justify-center gap-2"
                                    size="lg"
                                    variant="outline"
                                >
                                    <Upload className="h-5 w-5" />
                                    Subir desde Galería
                                </Button>
                            </div>
                        )}

                        {status === 'processing' && (
                            <Alert>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <AlertDescription>
                                    Procesando imagen con inteligencia artificial...
                                </AlertDescription>
                            </Alert>
                        )}

                        {status === 'success' && (
                            <Alert className="border-green-500 bg-green-50 text-green-800">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertDescription>
                                    ¡Datos extraídos correctamente! Cargando al formulario...
                                </AlertDescription>
                            </Alert>
                        )}

                        {status === 'error' && errorMessage && (
                            <Alert variant="destructive">
                                <XCircle className="h-4 w-4" />
                                <AlertDescription>{errorMessage}</AlertDescription>
                            </Alert>
                        )}

                        {/* Botones de acción cuando hay error */}
                        {status === 'error' && (
                            <div className="flex gap-2">
                                <Button onClick={openCamera} className="flex-1" variant="outline">
                                    <Camera className="mr-2 h-4 w-4" />
                                    Reintentar
                                </Button>
                                <Button onClick={handleClose} className="flex-1" variant="ghost">
                                    Cancelar
                                </Button>
                            </div>
                        )}

                        {/* Información adicional */}
                        {status === 'idle' && (
                            <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
                                <div className="flex items-start gap-2">
                                    <FileImage className="h-4 w-4 shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="font-medium">Consejos para mejor resultado:</p>
                                        <ul className="list-disc list-inside space-y-0.5">
                                            <li>Asegúrate de que el documento esté bien iluminado</li>
                                            <li>Evita reflejos y sombras</li>
                                            <li>Captura el documento completo y enfocado</li>
                                            <li>Formatos aceptados: JPG, PNG, WebP (máx 10MB)</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Inputs ocultos para captura de imágenes */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
            />
            <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
            />
        </>
    );
}
