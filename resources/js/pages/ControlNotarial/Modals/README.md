# MessageModal - Componente Reutilizable

Modal informativo versátil para mostrar mensajes, confirmaciones y alertas en toda la aplicación.

## Características

✅ **Tipos de mensaje**: info, warning, error, success  
✅ **Iconos automáticos**: Se asignan según el tipo  
✅ **Botones configurables**: Si/No/Cancelar/Aceptar/Custom  
✅ **Mensajes opcionales**: Título, mensaje principal y secundario  
✅ **Hook personalizado**: Para gestión simplificada del estado  
✅ **Responsive y accesible**: Overlay oscuro, cierre con X  

---

## Uso Básico

### 1. Con Hook `useMessageModal`

```tsx
import { MessageModal, useMessageModal } from '@/pages/ControlNotarial/Modals';

export default function MiComponente() {
    const modal = useMessageModal();

    const handleEliminar = async () => {
        // Confirmación simple
        const confirmed = await modal.confirm(
            '¿Está seguro?',
            'Esta acción no se puede deshacer.'
        );

        if (confirmed) {
            // Realizar eliminación
        }
    };

    return (
        <>
            <button onClick={handleEliminar}>Eliminar</button>
            <MessageModal
                isOpen={modal.isOpen}
                type={modal.type}
                title={modal.title}
                message={modal.message}
                icon={modal.icon}
                buttons={modal.buttons}
                onClose={modal.close}
                size={modal.size}
            />
        </>
    );
}
```

### 2. Uso Directo del Componente

```tsx
import { MessageModal, MessageModalButton } from '@/pages/ControlNotarial/Modals';
import { useState } from 'react';

export default function MiComponente() {
    const [isOpen, setIsOpen] = useState(false);

    const buttons: MessageModalButton[] = [
        {
            type: 'no',
            label: 'Cancelar',
            onClick: () => setIsOpen(false),
            variant: 'secondary',
        },
        {
            type: 'si',
            label: 'Confirmar',
            onClick: async () => {
                // Realizar acción
                setIsOpen(false);
            },
            variant: 'default',
        },
    ];

    return (
        <>
            <button onClick={() => setIsOpen(true)}>Abrir Modal</button>
            <MessageModal
                isOpen={isOpen}
                type="warning"
                title="Confirmar Acción"
                message="¿Desea continuar?"
                buttons={buttons}
                onClose={() => setIsOpen(false)}
            />
        </>
    );
}
```

---

## Ejemplos Prácticos

### Alert Informativo

```tsx
await modal.alert(
    'Operación Exitosa',
    'El presupuesto se guardó correctamente.',
    'success'
);
```

### Confirmación de Eliminación

```tsx
const confirmed = await modal.confirm(
    '¿Eliminar Presupuesto?',
    'No podrá recuperar esta información después.',
    'error'
);

if (confirmed) {
    await api.delete(`/presupuestos/${id}`);
}
```

### Modal Personalizado

```tsx
modal.show({
    type: 'info',
    title: 'Seleccionar Opción',
    message: '¿Qué desea hacer?',
    buttons: [
        {
            type: 'custom',
            label: 'Opción 1',
            onClick: () => {
                handleOption1();
                modal.close();
            },
        },
        {
            type: 'custom',
            label: 'Opción 2',
            onClick: () => {
                handleOption2();
                modal.close();
            },
            variant: 'secondary',
        },
        {
            type: 'cancelar',
            label: 'Cancelar',
            onClick: modal.close,
            variant: 'ghost',
        },
    ],
    size: 'md',
});
```

---

## Props de MessageModal

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `isOpen` | `boolean` | ✅ | Control de visibilidad del modal |
| `type` | `'info' \| 'warning' \| 'error' \| 'success'` | ❌ | Tipo de mensaje (default: 'info') |
| `title` | `string` | ✅ | Título del mensaje |
| `message` | `string` | ❌ | Mensaje secundario/descripción |
| `icon` | `React.ReactNode` | ❌ | Icono personalizado (si no se proporciona, usa el del tipo) |
| `buttons` | `MessageModalButton[]` | ❌ | Botones personalizados |
| `onClose` | `() => void` | ❌ | Callback al cerrar el modal |
| `size` | `'sm' \| 'md' \| 'lg'` | ❌ | Tamaño del modal (default: 'md') |

---

## Hook `useMessageModal`

### Métodos

#### `show(options)`
Abre el modal con opciones personalizadas.

```tsx
modal.show({
    type: 'info',
    title: 'Mi Título',
    message: 'Mi mensaje',
    buttons: [...],
});
```

#### `close()`
Cierra el modal.

```tsx
modal.close();
```

#### `confirm(title, message?, type?): Promise<boolean>`
Abre un modal de confirmación que retorna true/false.

```tsx
const result = await modal.confirm('¿Continuar?', 'Descripción', 'warning');
```

#### `alert(title, message?, type?): Promise<void>`
Abre un modal de alerta con botón Aceptar.

```tsx
await modal.alert('Éxito', 'Operación completada', 'success');
```

### Propiedades

- `isOpen`: boolean - Estado del modal
- `type`: MessageType - Tipo de mensaje actual
- `title`: string - Título actual
- `message`: string - Mensaje actual
- `buttons`: MessageModalButton[] - Botones actuales
- `size`: 'sm' | 'md' | 'lg' - Tamaño actual

---

## Tipos

### MessageType
```tsx
type MessageType = 'info' | 'warning' | 'error' | 'success';
```

### MessageModalButton
```tsx
interface MessageModalButton {
    type: 'si' | 'no' | 'cancelar' | 'aceptar' | 'custom';
    label?: string;
    onClick: () => void | Promise<void>;
    variant?: 'default' | 'destructive' | 'secondary' | 'outline' | 'ghost';
    className?: string;
}
```

---

## Estilos

El componente usa Tailwind CSS y se adapta automáticamente según:
- **Modo oscuro**: Compatible con `dark:` classes
- **Colores por tipo**:
  - Info: Azul
  - Warning: Ámbar
  - Error: Rojo
  - Success: Verde

---

## Integración con Index.tsx

Ejemplo de integración en `AltaExpedientes/Index.tsx`:

```tsx
import { MessageModal, useMessageModal } from '@/pages/ControlNotarial/Modals';

export default function AltaExpedientes() {
    const messageModal = useMessageModal();

    const handleEliminarPresupuesto = async () => {
        const confirmed = await messageModal.confirm(
            '¿Eliminar Presupuesto?',
            'Esta acción no se puede deshacer.',
            'error'
        );

        if (confirmed) {
            try {
                // Eliminar presupuesto...
                await messageModal.alert('Éxito', 'Presupuesto eliminado', 'success');
            } catch (error) {
                await messageModal.alert('Error', error.message, 'error');
            }
        }
    };

    return (
        <>
            {/* Tu contenido */}
            <MessageModal
                isOpen={messageModal.isOpen}
                type={messageModal.type}
                title={messageModal.title}
                message={messageModal.message}
                buttons={messageModal.buttons}
                icon={messageModal.icon}
                onClose={messageModal.close}
                size={messageModal.size}
            />
        </>
    );
}
```
