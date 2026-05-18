import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { AtinetLoader3D } from './atinet-loader-3d';

interface LoadingModalProps {
    isOpen: boolean;
    title: string;
    text?: string;
    showRings?: boolean;
    singleRing?: boolean;
    allowOutsideClick?: boolean;
}

export function LoadingModal({
    isOpen,
    title,
    text,
    showRings = true,
    singleRing = false,
    allowOutsideClick = false,
}: LoadingModalProps) {
    return (
        <Dialog
            open={isOpen}
            onOpenChange={
                allowOutsideClick ? undefined : () => {}
            }
        >
            <DialogContent
                className="sm:max-w-md"
                onPointerDownOutside={(e) => {
                    if (!allowOutsideClick) {
                        e.preventDefault();
                    }
                }}
                onEscapeKeyDown={(e) => {
                    if (!allowOutsideClick) {
                        e.preventDefault();
                    }
                }}
            >
                <DialogHeader>
                    <DialogTitle className="text-center">{title}</DialogTitle>
                </DialogHeader>
                <div className="flex justify-center py-6">
                    <AtinetLoader3D
                        showRings={showRings}
                        singleRing={singleRing}
                        text={text}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
