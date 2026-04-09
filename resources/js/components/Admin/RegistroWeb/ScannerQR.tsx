import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { X, Camera, FolderOpen, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ScannerQRProps {
    isOpen: boolean;
    onClose: () => void;
    onQRDetected: (qrText: string) => Promise<void>;
}

type ScannerStatus = 'idle' | 'initializing' | 'scanning' | 'processing' | 'error';

export function ScannerQR({ isOpen, onClose, onQRDetected }: ScannerQRProps) {
    const [showCamera, setShowCamera] = useState(false);
    const [status, setStatus] = useState<ScannerStatus>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const lastScannedQRRef = useRef<string | null>(null); // Evitar escaneos duplicados
    const isProcessingRef = useRef(false); // Ref para bloqueo más confiable

    // Limpiar scanner al cerrar
    useEffect(() => {
        if (!isOpen) {
            cleanupScanner();
            setShowCamera(false);
            setStatus('idle');
            setErrorMessage(null);
            lastScannedQRRef.current = null; // Reset último QR escaneado
            isProcessingRef.current = false; // Reset flag de procesamiento
        }
    }, [isOpen]);

    // Limpiar scanner al desmontar
    useEffect(() => {
        return () => {
            cleanupScanner();
        };
    }, []);

    /**
     * Limpiar el scanner de manera segura
     */
    const cleanupScanner = async () => {
        if (scannerRef.current) {
            try {
                const state = scannerRef.current.getState();
                if (state === Html5QrcodeScannerState.SCANNING) {
                    await scannerRef.current.stop();
                }
            } catch (error) {
                console.error('Error al detener scanner:', error);
            } finally {
                scannerRef.current = null;
            }
        }
    };

    /**
     * Iniciar scanner con cámara
     */
    const startCameraScanner = async () => {
        setShowCamera(true);
        setStatus('initializing');
        setErrorMessage(null);

        try {
            // Verificar si hay cámaras disponibles
            const devices = await Html5Qrcode.getCameras();

            if (!devices || devices.length === 0) {
                throw new Error('No se encontró ninguna cámara en el dispositivo.');
            }

            // Crear instancia del scanner
            const scanner = new Html5Qrcode('qr-reader');
            scannerRef.current = scanner;

            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
            };

            // Intentar primero con cámara trasera, luego con cualquier cámara disponible
            let cameraConfig = { facingMode: 'environment' };

            try {
                await scanner.start(
                    cameraConfig,
                    config,
                    async (decodedText) => {
                        // Evitar escaneos duplicados del mismo QR
                        if (!isProcessingRef.current && lastScannedQRRef.current !== decodedText) {
                            isProcessingRef.current = true;
                            lastScannedQRRef.current = decodedText;
                            setIsProcessing(true);
                            setStatus('processing');
                            await handleQRDetected(decodedText);
                        }
                    },
                    () => {
                        // Error silencioso durante escaneo
                    }
                );
            } catch (backCameraError) {
                // Si falla la cámara trasera, intentar con la primera disponible
                console.log('Cámara trasera no disponible, usando cámara por defecto');
                await scanner.start(
                    devices[0].id,
                    config,
                    async (decodedText) => {
                        // Evitar escaneos duplicados del mismo QR
                        if (!isProcessingRef.current && lastScannedQRRef.current !== decodedText) {
                            isProcessingRef.current = true;
                            lastScannedQRRef.current = decodedText;
                            setIsProcessing(true);
                            setStatus('processing');
                            await handleQRDetected(decodedText);
                        }
                    },
                    () => {
                        // Error silencioso durante escaneo
                    }
                );
            }

            setStatus('scanning');
        } catch (error: any) {
            console.error('Error al iniciar cámara:', error);
            setStatus('error');

            let errorMsg = 'No se pudo acceder a la cámara.';

            if (error.message?.includes('NotAllowedError') || error.name === 'NotAllowedError') {
                errorMsg = 'Permisos de cámara denegados. Por favor, permite el acceso a la cámara en tu navegador.';
            } else if (error.message?.includes('NotFoundError') || error.name === 'NotFoundError') {
                errorMsg = 'No se encontró ninguna cámara. Verifica que tu dispositivo tenga una cámara disponible.';
            } else if (error.message?.includes('NotReadableError') || error.name === 'NotReadableError') {
                errorMsg = 'La cámara está siendo usada por otra aplicación. Cierra otras aplicaciones que la estén usando.';
            } else if (error.message) {
                errorMsg = error.message;
            }

            setErrorMessage(errorMsg);
        }
    };

    /**
     * Cargar imagen con QR desde archivo
     */
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setStatus('processing');
        setErrorMessage(null);

        try {
            const scanner = new Html5Qrcode('qr-reader-file');
            scannerRef.current = scanner;

            const result = await scanner.scanFile(file, true);
            await handleQRDetected(result);
        } catch (error) {
            console.error('Error al leer archivo:', error);
            setStatus('error');
            setErrorMessage('No se pudo leer el código QR de la imagen.');
        } finally {
            // Limpiar input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    /**
     * Manejar QR detectado
     */
    const handleQRDetected = async (qrText: string) => {
        try {
            setIsProcessing(true);
            // Detener scanner inmediatamente para evitar escaneos adicionales
            await cleanupScanner();
            await onQRDetected(qrText);
            onClose();
        } catch (error) {
            console.error('Error procesando QR:', error);
            setStatus('error');
            setErrorMessage('Error al procesar el código QR.');
            isProcessingRef.current = false; // Permitir reintento
            lastScannedQRRef.current = null; // Resetear último QR
        } finally {
            setIsProcessing(false);
        }
    };

    /**
     * Cerrar modal
     */
    const handleClose = async () => {
        await cleanupScanner();
        onClose();
    };

    /**
     * Renderizar estado del scanner
     */
    const renderStatus = () => {
        switch (status) {
            case 'initializing':
                return (
                    <Alert className="mb-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <AlertDescription>Iniciando scanner...</AlertDescription>
                    </Alert>
                );
            case 'scanning':
                return (
                    <Alert className="mb-4 border-green-500 text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>Scanner activo - Enfoca el código QR</AlertDescription>
                    </Alert>
                );
            case 'processing':
                return (
                    <Alert className="mb-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <AlertDescription>Procesando QR...</AlertDescription>
                    </Alert>
                );
            case 'error':
                return (
                    <Alert className="mb-4 border-red-500 text-red-700">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                );
            default:
                return null;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-125">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5 text-green-600" />
                        Escanear Código QR
                    </DialogTitle>
                    <DialogDescription>
                        Escanea el código QR del SAT desde tu cámara o sube una imagen
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">{/* Panel de elección */}
                    {!showCamera && (
                        <div className="space-y-4">
                            <p className="text-center text-sm text-gray-600">
                                ¿Cómo deseas capturar el código QR?
                            </p>

                            <div className="space-y-3">
                                <Button
                                    onClick={startCameraScanner}
                                    className="w-full h-auto py-4 text-base"
                                    variant="default"
                                >
                                    <Camera className="mr-2 h-5 w-5" />
                                    Escanear con cámara
                                </Button>

                                <Button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full h-auto py-4 text-base"
                                    variant="secondary"
                                >
                                    <FolderOpen className="mr-2 h-5 w-5" />
                                    Cargar imagen con QR
                                </Button>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                            </div>

                            {/* Información de códigos compatibles */}
                            <div className="mt-6 text-xs text-gray-600 space-y-2">
                                <p className="font-semibold">Códigos QR compatibles:</p>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                    <li>QR de CURP (reverso/constancia RENAPO)</li>
                                    <li>QR de Acta de Nacimiento (Registro Civil / gob.mx)</li>
                                    <li>QR de factura SAT (constancia fiscal)</li>
                                    <li>QR de certificado fiscal</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Panel de cámara */}
                    {showCamera && (
                        <div className="space-y-4">
                            {renderStatus()}

                            {/* Contenedor del scanner */}
                            <div
                                id="qr-reader"
                                className="border rounded-lg overflow-hidden"
                            />

                            {/* Scanner oculto para archivos */}
                            <div id="qr-reader-file" className="hidden" />

                            {/* Botones de acción */}
                            <div className="flex gap-2">
                                {status === 'error' && (
                                    <Button
                                        onClick={() => {
                                            cleanupScanner();
                                            setShowCamera(false);
                                            setStatus('idle');
                                            setErrorMessage(null);
                                        }}
                                        variant="secondary"
                                        className="flex-1"
                                    >
                                        Volver
                                    </Button>
                                )}
                                <Button
                                    onClick={handleClose}
                                    variant="destructive"
                                    className={status === 'error' ? 'flex-1' : 'w-full'}
                                    disabled={isProcessing}
                                >
                                    <X className="mr-2 h-4 w-4" />
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
