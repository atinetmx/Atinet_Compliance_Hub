import { TriangleAlertIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string | React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
    onConfirm: () => void | Promise<void>;
    icon?: React.ReactNode;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    title,
    description,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'default',
    onConfirm,
    icon,
}: ConfirmDialogProps) {
    const handleConfirm = async () => {
        await onConfirm();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <div className="flex items-start gap-4">
                        {icon !== undefined ? (
                            icon && <div className="mt-0.5">{icon}</div>
                        ) : variant === 'destructive' ? (
                            <div className="mt-0.5 text-destructive">
                                <TriangleAlertIcon className="size-5" />
                            </div>
                        ) : null}
                        <div className="flex-1">
                            <DialogTitle className="text-left">
                                {title}
                            </DialogTitle>
                            {description && (
                                <DialogDescription className="text-left mt-2">
                                    {description}
                                </DialogDescription>
                            )}
                        </div>
                    </div>
                </DialogHeader>
                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose}>
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant === 'destructive' ? 'destructive' : 'default'}
                        onClick={handleConfirm}
                    >
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
