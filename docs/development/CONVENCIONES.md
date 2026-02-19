# 📋 CONVENCIONES DE CÓDIGO - ATINET_COMPLIANCE_HUB

**Versión:** 1.0  
**Última actualización:** 5 de Febrero, 2026

---

## 🏛️ CONVENCIONES GENERALES

### Idioma
- **Backend:** Español en comentarios y commits, pero código en inglés
- **Base de datos:** Nombres en español (notarias, usuarios, tickets)
- **Frontend:** Español en comentarios y strings UI, código en inglés

### Formato de Código
- **PHP:** Laravel Pint (`vendor/bin/pint --dirty`)
- **JavaScript/TypeScript:** ESLint + Prettier (`npm run lint`, `npm run format`)
- **Commits:** Formato convencional `type(scope): mensaje`

---

## 🐘 CONVENCIONES PHP / LARAVEL

### Estructura de Carpetas

```
app/
├── Actions/                 # Acciones reutilizables (Fortify, etc)
├── Concerns/                # Traits para inyectar funcionalidad
├── Console/
│   └── Commands/            # Comandos Artisan
├── Events/                  # Eventos disparables
├── Exceptions/              # Excepciones personalizadas
├── Http/
│   ├── Controllers/         # Controllers web
│   │   ├── Api/             # Controllers API REST
│   │   ├── Admin/           # Panel Atinet
│   │   ├── Notaria/         # Panel Notaría
│   │   └── Auth/            # Autenticación
│   ├── Middleware/          # Middleware
│   ├── Policies/            # Authorization Policies
│   ├── Requests/            # Form Requests
│   └── Resources/           # API Resources
├── Jobs/                    # Queued Jobs
├── Listeners/               # Event Listeners
├── Mail/                    # Mailable classes
├── Models/
│   ├── Scopes/              # Query Scopes
│   └── (modelos aquí)
├── Notifications/           # Notificaciones
├── Providers/               # Service Providers
└── Services/                # Servicios de negocio
```

### Nombres de Archivos

#### Controllers
```php
// Nombres plurales, patrón Laravel estándar
NotariasController.php          // CRUD de notarías
UsersController.php             // CRUD de usuarios
TicketsController.php           // CRUD de tickets
```

#### Models
```php
// Nombres singulares, PascalCase
Notaria.php
User.php
Ticket.php
TicketMessage.php
```

#### Migrations
```php
// Timestamp + descripción + _table
2026_02_05_100000_create_notarias_table.php
2026_02_05_100001_create_planes_table.php
2026_02_05_100002_add_tenant_id_to_users_table.php
```

#### Traits (en app/Concerns)
```php
// Verbo + Sustantivo
BelongsToNotaria.php          // Añade relación a notaría
HasTimestamps.php              // Si es custom
EnforceTenantAccess.php         // Aplica tenant scope
```

#### Form Requests
```php
// Verbo + Sustantivo + Request
StoreNotariaRequest.php
UpdateNotariaRequest.php
```

#### Policies
```php
// Nombre del modelo + Policy
NotariaPolicy.php
TicketPolicy.php
```

#### Events & Listeners
```php
// Eventos: descripción de qué pasó
TicketCreated.php
TicketStatusChanged.php
UserInvited.php

// Listeners: qué hacer cuando pasa
SendTicketNotification.php
LogTicketActivity.php
UpdateTicketMetrics.php
```

#### Jobs
```php
// Verbo + descripción de qué hace
GenerateMonthlyInvoices.php
SyncNotariaData.php
SendEmailNotifications.php
```

#### Commands
```php
// Verbo descriptivo
MigrateLegacyData.php
GenerateReports.php
CheckSubscriptionExpiry.php
```

### Estilos de Código

#### Type Declarations (OBLIGATORIO)
```php
// ✅ CORRECTO
public function store(StoreNotariaRequest $request): NotariaResource
{
    $notaria = Notaria::create($request->validated());
    return new NotariaResource($notaria);
}

// ❌ INCORRECTO
public function store($request)
{
    return $notaria;
}
```

#### Constructores con Promotion (PHP 8+)
```php
// ✅ CORRECTO - Constructor Promotion
public function __construct(
    public NotariaRepository $notarias,
    public TicketService $tickets
) {}

// ❌ INCORRECTO
public function __construct(
    private NotariaRepository $notarias,
    private TicketService $tickets
) {
    $this->notarias = $notarias;
    $this->tickets = $tickets;
}
```

#### Curly Braces (SIEMPRE)
```php
// ✅ CORRECTO
if ($user->isSuperAdmin()) {
    return true;
}

// ❌ INCORRECTO
if ($user->isSuperAdmin()) return true;
```

#### Methods en Models
```php
// ✅ CORRECTO - Relaciones en PascalCase
public function notaria()
{
    return $this->belongsTo(Notaria::class);
}

// Scopes en camelCase
public function scopeActive($query)
{
    return $query->where('is_active', true);
}

// Accessors
protected function isVerified(): Attribute
{
    return Attribute::make(
        get: fn() => $this->email_verified_at !== null,
    );
}
```

#### PHPDoc Blocks
```php
// ✅ CORRECTO - Útiles type hints
/**
 * Obtiene todas las búsquedas de una notaría
 *
 * @param  Notaria  $notaria
 * @return Collection<Busqueda>
 */
public function getBusquedas(Notaria $notaria): Collection
{
    return $notaria->busquedas()->get();
}

// ❌ NO ESCRIBAS OBVIO
public function save() // No necesita PHPDoc si es obvio
```

---

## ⚛️ CONVENCIONES REACT / TYPESCRIPT

### Estructura de Carpetas

```
resources/js/
├── components/
│   ├── ui/                      # Componentes reutilizables (shadcn)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── layout/                  # Componentes de layout
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   └── breadcrumbs.tsx
│   ├── charts/                  # Gráficas
│   │   ├── stats-card.tsx
│   │   └── trend-chart.tsx
│   ├── tickets/                 # Componentes de tickets
│   ├── admin/                   # Componentes admin
│   └── notifications/           # Componentes de notificaciones
├── hooks/                       # Custom Hooks
│   ├── useNotifications.ts
│   ├── useTenantAccess.ts
│   ├── useTicketRealtime.ts
│   └── ...
├── layouts/                     # Layouts principales
│   ├── app-layout.tsx           # Layout de usuario
│   ├── admin-layout.tsx         # Layout de admin
│   └── auth-layout.tsx          # Layout de auth
├── lib/                         # Utilidades y helpers
│   ├── api.ts                   # Cliente HTTP
│   ├── utils.ts                 # Helpers
│   ├── constants.ts             # Constantes
│   └── validators.ts            # Validadores
├── pages/                       # Páginas (rutas)
│   ├── Dashboard.tsx
│   ├── Auth/
│   ├── Admin/
│   ├── Notaria/
│   └── ...
├── types/                       # Tipos TypeScript
│   ├── models.ts                # Tipos de modelos
│   ├── api.ts                   # Tipos de API
│   └── enums.ts                 # Enums compartidos
└── app.tsx                      # Entry point
```

### Nombres de Archivos

#### Componentes
```typescript
// ✅ PascalCase para componentes
NotariaCard.tsx
TicketDetail.tsx
UserForm.tsx
StatsCard.tsx

// ❌ NO camelCase
notariaCard.tsx
```

#### Hooks
```typescript
// ✅ camelCase, prefijo "use"
useNotifications.ts
useTenantAccess.ts
useFetchNotarias.ts

// ❌ NO PascalCase
UseNotifications.ts
```

#### Utilities
```typescript
// ✅ camelCase
validators.ts
formatters.ts
api.ts
constants.ts

// ❌ NO PascalCase
Validators.ts
```

### Estilos de Código

#### Componentes Funcionales
```typescript
// ✅ CORRECTO - Con tipos explícitos
import { FC } from 'react';

interface NotariaCardProps {
  notaria: Notaria;
  onSelect?: (notaria: Notaria) => void;
}

const NotariaCard: FC<NotariaCardProps> = ({ notaria, onSelect }) => {
  return (
    <div onClick={() => onSelect?.(notaria)}>
      <h3>{notaria.nombre}</h3>
    </div>
  );
};

export default NotariaCard;

// ❌ INCORRECTO - Sin tipos
const NotariaCard = ({ notaria }) => {
  return <div>{notaria.nombre}</div>;
};
```

#### Props y Types
```typescript
// ✅ CORRECTO - Interfaz clara
interface FormProps {
  onSubmit: (data: FormData) => Promise<void>;
  isLoading?: boolean;
  defaultValues?: Partial<FormData>;
}

// ❌ INCORRECTO - Props anónimos
const Form = (props: any) => {};
```

#### Hooks Custom
```typescript
// ✅ CORRECTO
const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((msg: string) => {
    setNotifications(prev => [...prev, { id: Date.now(), msg }]);
  }, []);

  return { notifications, addNotification };
};

// ❌ INCORRECTO - Sin tipos de retorno
const useNotifications = () => {
  // ...
};
```

#### Imports
```typescript
// ✅ CORRECTO - Organizados
import React, { FC, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, Button } from '@/components/ui';
import { useNotifications } from '@/hooks';
import type { Notaria } from '@/types';

// ❌ INCORRECTO - Desordenados
import Button from './Button';
import { useNotifications } from '../../hooks/notifications';
import React from 'react';
```

#### Condicionales
```typescript
// ✅ CORRECTO - Con early return
const UsersList: FC = () => {
  if (isLoading) return <LoadingSkeleton />;
  if (!users.length) return <EmptyState />;

  return <ul>{users.map(u => <UserCard key={u.id} user={u} />)}</ul>;
};

// ❌ INCORRECTO - Nested ternarios
return isLoading ? <Skeleton /> : users.length ? <List /> : <Empty />;
```

---

## 🗄️ CONVENCIONES DE BASE DE DATOS

### Nombres de Tablas
```sql
-- ✅ PLURAL, snake_case, en español
notarias
usuarios
tickets
ticket_messages
busquedas
facturas
planes_suscripcion

-- ❌ NO singular, camelCase o sin relación
notaria, Notaria
user, User
```

### Nombres de Columnas
```sql
-- ✅ snake_case
id
notaria_id          -- FK
usuario_id          -- FK
nombre
email
created_at
updated_at
is_active
deleted_at

-- ❌ NO camelCase
notariaId
usuarioId
isActive
```

### Foreign Keys
```sql
-- ✅ PATRÓN: nombre_tabla_singular_id
ALTER TABLE tickets ADD COLUMN usuario_id UNSIGNED BIGINT FOREIGN KEY REFERENCES usuarios(id);
ALTER TABLE tickets ADD COLUMN notaria_id UNSIGNED BIGINT FOREIGN KEY REFERENCES notarias(id);

-- ❌ INCORRECTO
ALTER TABLE tickets ADD COLUMN user_id (inconsistente)
ALTER TABLE tickets ADD COLUMN user (sin sufijo _id)
```

### Índices
```sql
-- ✅ PATRÓN: idx_tabla_campo(s)
CREATE INDEX idx_tickets_notaria_id ON tickets(notaria_id);
CREATE INDEX idx_busquedas_usuario_notaria ON busquedas(usuario_id, notaria_id);
CREATE INDEX idx_usuarios_email ON usuarios(email);

-- ❌ INCORRECTO
CREATE INDEX idx_t_n (poco claro)
CREATE INDEX notaria_tickets (orden invertido)
```

### Campos Comunes
```sql
-- Siempre incluir (soft delete):
id BIGINT PRIMARY KEY AUTO_INCREMENT
created_at TIMESTAMP
updated_at TIMESTAMP
deleted_at TIMESTAMP NULLABLE

-- Multi-tenant OBLIGATORIO:
notaria_id BIGINT NOT NULL FOREIGN KEY

-- Auditoría (cuando sea necesario):
created_by BIGINT FOREIGN KEY
updated_by BIGINT FOREIGN KEY
```

---

## 🧪 CONVENCIONES DE TESTING

### Estructura
```
tests/
├── Feature/                     # Tests de integración
│   ├── Auth/
│   ├── Tickets/
│   ├── Notarias/
│   └── ...
├── Unit/                        # Tests unitarios
│   ├── Models/
│   ├── Services/
│   └── ...
├── Pest.php                     # Setup Pest
└── TestCase.php                 # Base TestCase
```

### Nomenclatura de Tests (Pest 3)
```php
// ✅ CORRECTO - Descripción clara
test('usuario puede crear ticket', function () {
    // Arrange
    $user = User::factory()->create();

    // Act
    $response = $this->actingAs($user)
        ->post('/tickets', [
            'asunto' => 'Mi problema',
            'descripcion' => 'Detalles...'
        ]);

    // Assert
    $response->assertRedirect('/tickets');
    expect(Ticket::count())->toBe(1);
});

test('usuario no puede ver tickets de otra notaría', function () {
    // Arrange
    $user1 = User::factory()->for($notaria1)->create();
    $user2 = User::factory()->for($notaria2)->create();
    $ticket2 = Ticket::factory()->for($notaria2)->create();

    // Act & Assert
    actingAs($user1);
    expect(Ticket::count())->toBe(0); // No ve tickets de otra notaría
});

// ❌ INCORRECTO
test('test_user_can_do_something', function () {}
it('works', function () {})
```

### Factories
```php
// ✅ Nombres del modelo
UserFactory.php
NotariaFactory.php
TicketFactory.php

// Con custom states
User::factory()
    ->superAdmin()
    ->count(5)
    ->create();

Ticket::factory()
    ->open()
    ->high()
    ->for($notaria)
    ->create();
```

---

## 📝 CONVENCIONES DE COMMITS

### Formato Convencional
```bash
# ✅ CORRECTO
git commit -m "feat(auth): agregar autenticación 2FA"
git commit -m "fix(tickets): resolver crash al crear ticket sin descripción"
git commit -m "docs(api): actualizar documentación de endpoints"
git commit -m "refactor(models): simplificar relación Notaria-Usuario"
git commit -m "test(multi-tenancy): agregar tests de aislamiento de datos"

# Tipos permitidos:
# - feat:     Nueva funcionalidad
# - fix:      Corrección de bug
# - docs:     Cambios en documentación
# - style:    Cambios de formato (Pint, Prettier)
# - refactor: Refactorización sin cambiar funcionalidad
# - test:     Agregar/actualizar tests
# - chore:    Cambios en build, dependencies, etc
# - perf:     Mejora de performance

# ❌ INCORRECTO
git commit -m "cambios varios"
git commit -m "update"
git commit -m "fix bug"
```

---

## ✅ CHECKLIST ANTES DE HACER COMMIT

- [ ] Código formateado (`npm run lint`, `vendor/bin/pint`)
- [ ] Tipos TypeScript correctos (`npm run types`)
- [ ] Tests pasando (`php artisan test`)
- [ ] Convenciones de nombres seguidas
- [ ] Sin código comentado o debug
- [ ] Commit message en formato convencional

---

## 🔗 REFERENCIAS RÁPIDAS

| Elemento | Patrón | Ejemplo |
|----------|--------|---------|
| Controller | `PluralController` | `NotariasController` |
| Model | `Singular` | `Notaria` |
| Trait | `VerbNoun` | `BelongsToNotaria` |
| Migration | `timestamp_description` | `2026_02_05_create_notarias` |
| Test | `test('descripción')` | `test('crea ticket')` |
| Component | `PascalCase` | `NotariaCard.tsx` |
| Hook | `useNoun` | `useNotifications.ts` |
| Util | `camelCase` | `formatDate.ts` |
| DB Table | `plural_snake` | `notarias`, `ticket_messages` |

---

**Última revisión:** 5 de Febrero, 2026
