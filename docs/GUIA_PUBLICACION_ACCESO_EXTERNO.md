# Guía de Publicación — Acceso Externo al Sistema Atinet Compliance Hub

**Fecha**: 9 de marzo de 2026  
**Estado**: Pendiente de implementar  
**Objetivo**: Que las notarías y clientes de Atinet accedan al sistema desde internet mediante `https://compliance.atinet.com.mx`

---

## Contexto actual

| Elemento | Valor |
|----------|-------|
| Servidor | Windows Server con IIS |
| IP local | `192.168.1.1:8080` |
| Framework | Laravel 12 + Inertia.js + React |
| Dominio disponible | `atinet.com.mx` (registrado en Hostgator) |
| Acceso actual | Solo red local |

---

## Opción elegida: Cloudflare Tunnel (Opción C)

### ¿Por qué esta opción?
- No requiere IP pública fija
- No requiere abrir puertos en el router
- HTTPS automático y gratuito
- Cloudflare actúa como intermediario seguro entre internet y tu servidor
- Gratis con el plan Free de Cloudflare

### Arquitectura final

```
Notaría (navegador)
        ↓  https://compliance.atinet.com.mx
   Cloudflare (internet — maneja DNS y SSL)
        ↓  túnel cifrado permanente
   cloudflared.exe (servicio Windows en el servidor)
        ↓  http://localhost:8080
   IIS → Laravel → Base de datos
```

---

## Pasos para implementar

### ✅ Paso 1 — Cuenta Cloudflare creada
- Cuenta creada con `atinet.com.mx`
- DNS importados automáticamente desde Hostgator
- **COMPLETADO**

---

### ⏳ Paso 2 — Cambiar Nameservers en Hostgator

Cloudflare te proporciona 2 nameservers al agregar el dominio. Debes reemplazar los actuales en Hostgator.

#### Dónde hacerlo:
1. Ir al **portal de cliente de Hostgator** → [hostgator.com](https://hostgator.com) (NO el cPanel)
2. Iniciar sesión con la cuenta principal
3. Ir a **Domains → Manage Domains**
4. Seleccionar `atinet.com.mx`
5. Buscar sección **Nameservers** → cambiar a los 2 nameservers de Cloudflare

> ⚠️ Si el dominio fue registrado en NIC México (nic.mx), el cambio se hace en [nic.mx](https://nic.mx) con las credenciales del registrante.

#### Tiempo de propagación:
- Entre 10 minutos y 24 horas
- Puedes verificar en: https://dnschecker.org → busca `atinet.com.mx` → tipo NS

---

### ⏳ Paso 3 — Instalar cloudflared en el servidor Windows

`cloudflared` es un ejecutable pequeño que crea el túnel seguro desde tu servidor hacia Cloudflare.

#### Descarga:
```
https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
```
Descargar: **cloudflared-windows-amd64.msi**

#### Instalación:
```powershell
# Ejecutar el instalador MSI descargado
# O via winget:
winget install --id Cloudflare.cloudflared
```

#### Autenticación:
```powershell
cloudflared tunnel login
```
Abre el navegador → selecciona `atinet.com.mx` → autoriza.

---

### ⏳ Paso 4 — Crear el túnel

```powershell
# Crear el túnel (guarda el UUID que genera)
cloudflared tunnel create atinet-compliance

# Crear el archivo de configuración
# Ruta: C:\Users\Administrador\.cloudflared\config.yml
```

#### Contenido del archivo `config.yml`:
```yaml
tunnel: <UUID-del-tunnel>
credentials-file: C:\Users\Administrador\.cloudflared\<UUID>.json

ingress:
  - hostname: compliance.atinet.com.mx
    service: http://localhost:8080
  - service: http_status:404
```

#### Crear el registro DNS en Cloudflare:
```powershell
cloudflared tunnel route dns atinet-compliance compliance.atinet.com.mx
```
Esto crea automáticamente un registro CNAME en Cloudflare apuntando al túnel.

#### Instalar como servicio de Windows (para que inicie automáticamente):
```powershell
cloudflared service install
```

#### Iniciar el servicio:
```powershell
Start-Service cloudflared
# O:
cloudflared tunnel run atinet-compliance
```

---

### ⏳ Paso 5 — Actualizar APP_URL en Laravel

Una vez que el túnel esté activo, cambiar en `.env`:

```env
APP_URL=https://compliance.atinet.com.mx
```

Después limpiar caché:
```powershell
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Y reconstruir los assets de frontend (para que los URLs de JS/CSS apunten al dominio correcto):
```powershell
npm run build
```

---

### ⏳ Paso 6 — Verificar CORS y sesiones

En `config/session.php` verificar que el dominio de sesión sea correcto:
```php
'domain' => env('SESSION_DOMAIN', '.atinet.com.mx'),
```

En `.env` agregar:
```env
SESSION_DOMAIN=.atinet.com.mx
SANCTUM_STATEFUL_DOMAINS=compliance.atinet.com.mx
```

---

### ⏳ Paso 7 — Prueba final

1. Desde un dispositivo **fuera de la red local** (celular con datos móviles)
2. Abrir `https://compliance.atinet.com.mx`
3. Verificar que carga el login con HTTPS (candado verde)
4. Probar login con una cuenta de notaría
5. Verificar que las búsquedas y funciones principales operan correctamente

---

## Checklist de verificación

```
[ ] Nameservers de atinet.com.mx cambiados a Cloudflare
[ ] Propagación DNS verificada (dnschecker.org)
[ ] cloudflared instalado en servidor Windows
[ ] Túnel "atinet-compliance" creado
[ ] config.yml configurado correctamente
[ ] Registro CNAME compliance.atinet.com.mx creado en Cloudflare
[ ] Servicio cloudflared corriendo como servicio de Windows
[ ] APP_URL actualizado en .env
[ ] Assets reconstruidos con npm run build
[ ] SESSION_DOMAIN configurado
[ ] Prueba desde exterior (celular con datos) exitosa
```

---

## Alternativa: Tailscale

### ¿Qué es Tailscale?

Tailscale es una **VPN moderna y simple** que conecta dispositivos entre sí como si estuvieran en la misma red local, sin importar dónde estén físicamente.

```
Notaría (laptop en su oficina)
        ↓  VPN cifrada (Tailscale)
   Tu servidor Windows
        ↓
   IIS → Laravel
```

### ¿Cómo funciona?

Instala un cliente pequeño en cada dispositivo. Tailscale les asigna una IP privada fija (ej. `100.64.x.x`) que siempre los conecta directamente, sin pasar por servidores intermedios.

### Diferencia clave vs Cloudflare Tunnel

| Característica | Cloudflare Tunnel | Tailscale |
|---------------|-------------------|-----------|
| Acceso | Navegador público (URL) | Solo dispositivos con cliente instalado |
| SSL | Automático | No necesario (VPN cifrada) |
| Instalación en cliente | Nada (solo navegador) | Requiere instalar app |
| Ideal para | Clientes que acceden desde cualquier dispositivo | Equipo interno de Atinet |
| Costo | Gratis | Gratis hasta 3 usuarios / $5 USD/mes por usuario |
| Control de acceso | Por URL/firewall | Por lista de dispositivos aprobados |

### ¿Cuándo usar Tailscale en lugar de Cloudflare Tunnel?

- Para que el **equipo interno de Atinet** acceda al servidor de forma segura desde casa o de viaje
- Para administración remota del servidor sin exponer puertos
- Como capa adicional de seguridad para el acceso a cPanel/MySQL

### ¿Se pueden usar juntos?

**Sí.** La arquitectura recomendada para máxima seguridad sería:

```
Clientes (notarías)  →  Cloudflare Tunnel  →  Servidor (acceso público controlado)
Equipo Atinet        →  Tailscale VPN      →  Servidor (acceso administrativo)
```

### Instalación básica de Tailscale (referencia)

```powershell
# En el servidor Windows
winget install tailscale

# En cada laptop del equipo Atinet
# Descargar desde: https://tailscale.com/download
```

1. Crear cuenta en [tailscale.com](https://tailscale.com) (gratis)
2. Instalar en el servidor y en cada dispositivo del equipo
3. Todos quedan en la misma red privada automáticamente

---

## Recomendación final

| Solución | Para quién | Prioridad |
|----------|-----------|-----------|
| **Cloudflare Tunnel** + `compliance.atinet.com.mx` | Notarías clientes | 🔴 Implementar primero |
| **Tailscale** | Equipo interno Atinet | 🟡 Implementar después |

---

*Documento generado: 9 de marzo de 2026*
