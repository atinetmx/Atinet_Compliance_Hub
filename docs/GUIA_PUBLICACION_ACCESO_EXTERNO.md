# Guía de Publicación — Acceso Externo al Sistema Atinet Compliance Hub

**Fecha**: 9 de marzo de 2026 — **Actualizada**: 1 de junio de 2026  
**Estado**: ✅ En producción  
**Objetivo**: Que las notarías y clientes de Atinet accedan al sistema desde internet mediante `https://atinet.com.mx/compliance_hub`

---

## Sistema actual en producción

> **NOTA**: El dominio `compliance.atinet.com.mx` **no pudo configurarse** porque `atinet.com.mx` no pudo agregarse a Cloudflare. Se implementó una solución alternativa con **quick tunnels de Cloudflare sin dominio**, operativa desde marzo de 2026.

### Arquitectura real

```
Notaría (navegador)
        ↓  https://atinet.com.mx/compliance_hub
   Hostgator (PHP index.php)
        ↓  lee compliance_tunnel.tunnel_url de MySQL (< 60 min)
        ↓  redirige 302 a la URL dinámica del tunnel
   Cloudflare Quick Tunnel  (*.trycloudflare.com — cambia cada ~1 hora)
        ↓  túnel cifrado
   C:\cloudflared\cloudflared.exe (proceso en el servidor)
        ↓  http://localhost:8080
   IIS → Laravel → Base de datos
```

### Rutas y archivos clave

| Componente | Ruta |
|------------|------|
| Ejecutable cloudflared (quick tunnel) | `C:\cloudflared\cloudflared.exe` |
| Script de arranque del tunnel | `C:\cloudflared\start-tunnel.ps1` |
| Script monitor/heartbeat | `C:\cloudflared\monitor-tunnel-url.ps1` |
| Script publicación inicial | `C:\cloudflared\publish-tunnel-url.ps1` |
| Log del proceso cloudflared | `C:\cloudflared\tunnel-temp.log` |
| Log del monitor | `C:\cloudflared\monitor-url.log` |
| Script verificación URL en Hostgator | `C:\cloudflared\check_url.php` |
| Redirección en Hostgator | `public_html/compliance_hub/index.php` |
| Tabla MySQL Hostgator | `atinet65_aplicativos.compliance_tunnel` (id=1) |

### Windows Service separado

Existe también un Windows Service llamado `Cloudflared` que usa `--token` (named tunnel). Este servicio es **independiente** del quick tunnel en propósito, pero **compite por el mismo proceso** en el arranque del servidor.

> **⚠️ Comportamiento importante (descubierto el 01/06/2026):** El Windows Service `cloudflared` tiene `StartType: Automatic`, por lo que arranca durante el boot **antes** de que el Task Scheduler ejecute `start-tunnel.ps1`. Cuando `start-tunnel.ps1` mataba el proceso cloudflared, el Service lo relanzaba de inmediato, impidiendo que el quick tunnel obtuviera y registrara su URL. **Solución aplicada:** `start-tunnel.ps1` ahora detiene el Windows Service con `Stop-Service` antes de iniciar el quick tunnel.

| Servicio | Tipo | URL | Propósito |
|---------|------|-----|-----------|
| Windows Service `Cloudflared` | Named tunnel con `--token` | no relevante externamente | Reservado/legado — **se detiene al arrancar el quick tunnel** |
| `CloudflaredTunnel-Atinet` (Task Scheduler) | Quick tunnel con `--url` | `*.trycloudflare.com` | Acceso externo real |

### Task Scheduler — tareas configuradas

| Nombre tarea | Trigger | Script | Función |
|-------------|---------|--------|---------|
| `CloudflaredTunnel-Atinet` | Al inicio del sistema + **30 s de delay** | `C:\cloudflared\start-tunnel.ps1` | Inicia el quick tunnel, mata instancias previas, publica URL inicial |
| `MonitorTunnelUrl-Atinet` | Cada 5 minutos | `C:\cloudflared\monitor-tunnel-url.ps1` | Lee URL del log, actualiza Hostgator si cambió, envía heartbeat |
| `LaravelScheduler-Atinet` | Cada minuto | `php artisan schedule:run` | Tareas programadas de Laravel |

> ⚠️ El delay de **30 segundos** en `CloudflaredTunnel-Atinet` sigue siendo necesario para dar tiempo al sistema operativo de estabilizarse tras el boot. Sin embargo, el delay por sí solo **no es suficiente** para evitar la condición de carrera con el Windows Service. La solución definitiva está en `start-tunnel.ps1`, que desde el 01/06/2026 detiene explícitamente el Windows Service antes de iniciar el quick tunnel.

### Flujo de actualización de URL

1. **Boot del servidor** → Task Scheduler ejecuta `start-tunnel.ps1` (con 30 s de delay)
2. `start-tunnel.ps1` **detiene el Windows Service `cloudflared`** (evita condición de carrera), mata cualquier proceso cloudflared residual, limpia `tunnel-temp.log` e inicia el quick tunnel
3. Después de 10 s, llama a `publish-tunnel-url.ps1`
4. `publish-tunnel-url.ps1` espera hasta 30 s a que aparezca la URL en `tunnel-temp.log` y la escribe en `atinet65_aplicativos.compliance_tunnel`
5. **Cada 5 min** → `monitor-tunnel-url.ps1` lee la URL actual del log y:
   - Si cambió: actualiza `tunnel_url` + `updated_at` en Hostgator
   - Si no cambió: actualiza solo `updated_at` (heartbeat) para evitar que `index.php` la marque como vencida (> 60 min)
6. **Notaría visita** `atinet.com.mx/compliance_hub` → `index.php` lee la URL de MySQL → redirige si `updated_at` < 60 min → usuario llega al sistema

### Verificar estado actual

```powershell
# Ver URL activa en Hostgator
php C:\cloudflared\check_url.php

# Ver si el proceso cloudflared corre
Get-Process cloudflared -ErrorAction SilentlyContinue | Select-Object Id, StartTime, CPU

# Ver últimas entradas del monitor
Get-Content C:\cloudflared\monitor-url.log -Tail 20

# Ver URL en el log del tunnel
Select-String -Path C:\cloudflared\tunnel-temp.log -Pattern "trycloudflare"
```

### Solución de problemas

| Síntoma | Causa probable | Solución |
|---------|---------------|----------|
| "No se encontró URL en el log del tunnel" en monitor.log | cloudflared no inició correctamente | Ejecutar `C:\cloudflared\start-tunnel.ps1` como Administrador |
| La URL en Hostgator tiene más de 60 minutos | `monitor-tunnel-url.ps1` no corre (Task Scheduler) | Verificar tarea `MonitorTunnelUrl-Atinet` en Task Scheduler |
| El tunnel arranca pero URL nunca aparece en log tras corte de luz / reboot | Windows Service `cloudflared` (Automatic) compite con el quick tunnel; `start-tunnel.ps1` mataba el proceso pero el Service lo relanzaba inmediatamente | **✅ Corregido el 01/06/2026**: `start-tunnel.ps1` ahora detiene el Windows Service antes de iniciar el quick tunnel |
| `index.php` en Hostgator muestra error | URL vencida o tabla vacía | Correr `publish-tunnel-url.ps1` manualmente |

> **⚠️ Nota sobre el Windows Service `cloudflared`:** El servicio de Windows `cloudflared` (tipo: named tunnel con `--token`) está configurado como `Automatic`. Al hacer reboot, este servicio arranca ANTES que el Task Scheduler y ocupa el proceso. `start-tunnel.ps1` ahora lo detiene explícitamente con `Stop-Service` antes de iniciar el quick tunnel. El servicio se vuelve a poder iniciar manualmente si se necesita, pero no interfiere con el acceso externo.

---

### 🚨 Recuperación manual tras corte de luz o reboot

**Síntoma:** El sistema muestra la página "Sistema no disponible" al intentar acceder desde exterior.

**Causa:** El tunnel no publicó su URL correctamente durante el arranque del servidor.

**Diagnóstico rápido (ejecutar en PowerShell como Administrador):**

```powershell
# 1. Ver si cloudflared está corriendo
Get-Process cloudflared -ErrorAction SilentlyContinue | Select-Object Id, StartTime

# 2. Ver si el log tiene URL
Select-String -Path C:\cloudflared\tunnel-temp.log -Pattern "trycloudflare"

# 3. Ver el log del monitor (buscar SKIPs consecutivos = URL nunca publicada)
Get-Content C:\cloudflared\monitor-url.log -Tail 10
```

**Si el log NO tiene URL (caso más común tras reboot):**

```powershell
# Paso 1: Detener todo
Stop-Service -Name "cloudflared" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "cloudflared" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# Paso 2: Limpiar log anterior
Remove-Item C:\cloudflared\tunnel-temp.log -Force -ErrorAction SilentlyContinue

# Paso 3: Iniciar el quick tunnel
Start-Process -FilePath "C:\cloudflared\cloudflared.exe" `
    -ArgumentList "tunnel --url http://localhost:8080 --logfile C:\cloudflared\tunnel-temp.log" `
    -WindowStyle Hidden
Start-Sleep -Seconds 15

# Paso 4: Verificar que la URL apareció en el log
Select-String -Path C:\cloudflared\tunnel-temp.log -Pattern "trycloudflare"

# Paso 5: Publicar la URL en Hostgator
& "C:\cloudflared\publish-tunnel-url.ps1"
```

**Si la URL sí aparece en el log pero el sistema sigue sin funcionar:**

```powershell
# Republicar manualmente a Hostgator
& "C:\cloudflared\publish-tunnel-url.ps1"
```

**Verificar que todo quedó bien:**

```powershell
# Ver URL almacenada en Hostgator
php C:\cloudflared\check_url.php

# Confirmar que solo hay UN proceso cloudflared corriendo
Get-Process cloudflared | Select-Object Id, StartTime
```

> **Tiempo estimado de recuperación:** 2-3 minutos desde que se ejecutan los comandos.

---

## Plan original (no implementado)

El plan original era usar `compliance.atinet.com.mx` con Cloudflare named tunnel, pero no fue posible porque `atinet.com.mx` no pudo agregarse a Cloudflare (el dominio no pudo ser transferido o los nameservers no podían cambiarse). Se documentan los pasos originales abajo como referencia para cuando sea posible migrar.

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
