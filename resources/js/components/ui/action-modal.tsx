import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface ActionModalAction {
    label: string;
    onClick: () => void | Promise<void>;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
    icon?: React.ReactNode;
}

interface ActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string | React.ReactNode;
    actions: ActionModalAction[];
}

export function ActionModal({
    isOpen,
    onClose,
    title,
    description,
    actions,
}: ActionModalProps) {
    const handleAction = async (
        action: ActionModalAction,
    ) => {
        await action.onClick();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && (
                        <DialogDescription>{description}</DialogDescription>
                    )}
                </DialogHeader>
                <div className="grid gap-3 py-4">
                    {actions.map((action, index) => (
                        <Button
                            key={index}
                            variant={action.variant || 'default'}
                            onClick={() => handleAction(action)}
                            className="w-full justify-start"
                        >
                            {action.icon && (
                                <span className="mr-2">{action.icon}</span>
                            )}
                            {action.label}
                        </Button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
