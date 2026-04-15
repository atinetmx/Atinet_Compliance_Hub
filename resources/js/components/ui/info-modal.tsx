import { InfoIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface InfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    content: React.ReactNode;
    icon?: React.ReactNode;
    width?: string;
    confirmText?: string;
}

export function InfoModal({
    isOpen,
    onClose,
    title,
    content,
    icon,
    width = '600px',
    confirmText = 'Entendido',
}: InfoModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent style={{ maxWidth: width }}>
                <DialogHeader>
                    <div className="flex items-start gap-4">
                        {icon !== undefined ? (
                            icon && <div className="mt-0.5">{icon}</div>
                        ) : (
                            <div className="mt-0.5 text-blue-600">
                                <InfoIcon className="size-5" />
                            </div>
                        )}
                        <div className="flex-1">
                            <DialogTitle className="text-left">
                                {title}
                            </DialogTitle>
                        </div>
                    </div>
                </DialogHeader>
                <div className="py-4 text-sm text-muted-foreground">
                    {content}
                </div>
                <DialogFooter>
                    <Button onClick={onClose}>{confirmText}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
