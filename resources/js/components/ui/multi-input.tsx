import { X } from 'lucide-react';
import { useState, KeyboardEvent, ClipboardEvent } from 'react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface MultiInputProps {
    values: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
    maxItems?: number;
    className?: string;
    disabled?: boolean;
}

export function MultiInput({
    values,
    onChange,
    placeholder = 'Ingresa un valor y presiona Enter o coma',
    maxItems = 50,
    className,
    disabled = false,
}: MultiInputProps) {
    const [inputValue, setInputValue] = useState('');

    const addValue = (value: string) => {
        const trimmed = value.trim();
        if (!trimmed) return;

        // Evitar duplicados
        if (values.includes(trimmed)) {
            setInputValue('');
            return;
        }

        // Verificar límite
        if (values.length >= maxItems) {
            setInputValue('');
            return;
        }

        onChange([...values, trimmed]);
        setInputValue('');
    };

    const removeValue = (index: number) => {
        onChange(values.filter((_, i) => i !== index));
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        // Enter o coma para agregar
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addValue(inputValue);
        }

        // Backspace en campo vacío para eliminar el último
        if (e.key === 'Backspace' && !inputValue && values.length > 0) {
            onChange(values.slice(0, -1));
        }
    };

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        const pastedText = e.clipboardData.getData('text');

        // Detectar si contiene comas o saltos de línea
        if (pastedText.includes(',') || pastedText.includes('\n')) {
            e.preventDefault();

            // Dividir por comas o saltos de línea
            const items = pastedText
                .split(/[,\n]+/)
                .map(item => item.trim())
                .filter(item => item.length > 0);

            // Agregar items que no existan y respetando el límite
            const newValues = [...values];
            for (const item of items) {
                if (newValues.length >= maxItems) break;
                if (!newValues.includes(item)) {
                    newValues.push(item);
                }
            }

            onChange(newValues);
            setInputValue('');
        }
    };

    return (
        <div className={cn('space-y-2', className)}>
            <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-background min-h-10.5">
                {values.map((value, index) => (
                    <Badge
                        key={index}
                        variant="secondary"
                        className="px-2 py-1 text-sm font-normal"
                    >
                        {value}
                        {!disabled && (
                            <button
                                type="button"
                                onClick={() => removeValue(index)}
                                className="ml-1 hover:text-destructive"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </Badge>
                ))}
                {!disabled && values.length < maxItems && (
                    <Input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        placeholder={values.length === 0 ? placeholder : ''}
                        className="flex-1 min-w-50 border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                        disabled={disabled}
                    />
                )}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                    💡 Presiona <kbd className="px-1.5 py-0.5 bg-secondary border border-border rounded text-secondary-foreground font-mono text-[11px]">Enter</kbd> o{' '}
                    <kbd className="px-1.5 py-0.5 bg-secondary border border-border rounded text-secondary-foreground font-mono text-[11px]">,</kbd> para agregar. Pega múltiples nombres separados por comas.
                </span>
                <span className={cn(values.length >= maxItems && 'text-destructive font-medium')}>
                    {values.length} / {maxItems}
                </span>
            </div>
        </div>
    );
}
