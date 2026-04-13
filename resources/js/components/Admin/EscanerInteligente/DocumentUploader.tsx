import { useForm } from '@inertiajs/react';
import { Upload, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Props {
    open: boolean;
    onClose: () => void;
}

export default function DocumentUploader({ open, onClose }: Props) {
    const [dragActive, setDragActive] = useState(false);

    const { data, setData, post, processing, reset } = useForm({
        documento: null as File | null,
        tipo_documento: '',
        procesar_a: [] as string[],
        analizar_ia: false,
    });

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (validateFile(file)) {
                setData('documento', file);
            }
        }
    }, []);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (validateFile(file)) {
                setData('documento', file);
            }
        }
    }, []);

    const validateFile = (file: File): boolean => {
        const allowedTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        const maxSize = 20 * 1024 * 1024; // 20MB

        if (!allowedTypes.includes(file.type)) {
            toast.error('Tipo de archivo no permitido. Solo JPG, PNG, PDF, DOC, DOCX');
            return false;
        }

        if (file.size > maxSize) {
            toast.error('El archivo es demasiado grande. Máximo 20MB');
            return false;
        }

        return true;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!data.documento) {
            toast.error('Por favor selecciona un documento');
            return;
        }

        post('/admin/escaner-inteligente', {
            onSuccess: () => {
                toast.success('Documento subido correctamente');
                reset();
                onClose();
            },
            onError: (errors) => {
                console.error(errors);
                toast.error('Error al subir el documento');
            },
        });
    };

    const toggleFormatoProcesar = (formato: string) => {
        const currentFormatos = data.procesar_a || [];
        if (currentFormatos.includes(formato)) {
            setData('procesar_a', currentFormatos.filter((f) => f !== formato));
        } else {
            setData('procesar_a', [...currentFormatos, formato]);
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-150">
                <DialogHeader>
                    <DialogTitle>Subir Documento</DialogTitle>
                    <DialogDescription>
                        Sube documentos para digitalizarlos, convertirlos y analizarlos con IA
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Drag & Drop Area */}
                    <div
                        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                            dragActive
                                ? 'border-primary bg-primary/5'
                                : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            id="file-upload"
                            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                            onChange={handleChange}
                            className="hidden"
                        />

                        {!data.documento ? (
                            <div className="space-y-4">
                                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-600">
                                        Arrastra un archivo aquí o{' '}
                                        <label
                                            htmlFor="file-upload"
                                            className="text-primary cursor-pointer hover:underline"
                                        >
                                            selecciona uno
                                        </label>
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        JPG, PNG, PDF, DOC, DOCX hasta 20MB
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-md">
                                <div className="flex-1 text-left">
                                    <p className="font-medium text-sm">{data.documento.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {formatBytes(data.documento.size)}
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setData('documento', null)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Tipo de Documento */}
                    <div className="space-y-2">
                        <Label htmlFor="tipo_documento">Tipo de Documento (Opcional)</Label>
                        <Select
                            value={data.tipo_documento}
                            onValueChange={(value) => setData('tipo_documento', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona el tipo de documento" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">No especificar</SelectItem>
                                <SelectItem value="escritura">Escritura Pública</SelectItem>
                                <SelectItem value="contrato">Contrato</SelectItem>
                                <SelectItem value="poder">Poder Notarial</SelectItem>
                                <SelectItem value="testamento">Testamento</SelectItem>
                                <SelectItem value="acta_constitutiva">Acta Constitutiva</SelectItem>
                                <SelectItem value="otro">Otro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Formatos de Procesamiento */}
                    <div className="space-y-3">
                        <Label>Convertir a:</Label>
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="format-pdf"
                                    checked={data.procesar_a.includes('pdf')}
                                    onCheckedChange={() => toggleFormatoProcesar('pdf')}
                                />
                                <label
                                    htmlFor="format-pdf"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    PDF
                                </label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="format-word"
                                    checked={data.procesar_a.includes('word')}
                                    onCheckedChange={() => toggleFormatoProcesar('word')}
                                />
                                <label
                                    htmlFor="format-word"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Word (.docx)
                                </label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="format-texto"
                                    checked={data.procesar_a.includes('texto')}
                                    onCheckedChange={() => toggleFormatoProcesar('texto')}
                                />
                                <label
                                    htmlFor="format-texto"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Texto plano (.txt)
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Análisis con IA */}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="analizar_ia"
                            checked={data.analizar_ia}
                            onCheckedChange={(checked) => setData('analizar_ia', !!checked)}
                        />
                        <label
                            htmlFor="analizar_ia"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Analizar con OpenAI (extrae datos y genera resumen)
                        </label>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={processing || !data.documento}>
                            {processing ? 'Subiendo...' : 'Subir Documento'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
