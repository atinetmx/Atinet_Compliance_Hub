# Cotización de Infraestructura AWS — Atinet Compliance Hub MVP
> Estimación de costos para justificar precios de suscripción al sistema.
> Precios en USD (cotización abril 2026). Tipo de cambio referencia: **$17 MXN/USD**.

---

## 1. Infraestructura Base en AWS

Esta es la infraestructura mínima necesaria para operar el sistema con **1 a 10 notarías** de forma estable y segura.

| Servicio AWS | Descripción | USD/mes | MXN/mes |
|---|---|---:|---:|
| **EC2** `t3.small` | Servidor Laravel principal (2 vCPU, 2 GB RAM) | $17.00 | $289 |
| **RDS MySQL** `db.t3.micro` | Base de datos gestionada (backup automático 7 días) | $15.00 | $255 |
| **S3 + CloudFront** | Almacenamiento documentos ~50 GB + CDN | $6.00 | $102 |
| **ALB** | Application Load Balancer (HTTPS, dominio) | $18.00 | $306 |
| **Route 53** | DNS administrado (1 zona hosted) | $1.00 | $17 |
| **ACM** | Certificado SSL/TLS (gratuito con ALB) | $0.00 | $0 |
| **SES** | Correos transaccionales (~1,000/mes) | $0.10 | $2 |
| **RDS Snapshots** | Respaldos adicionales de BD | $3.00 | $51 |
| **CloudWatch Logs** | Monitoreo y alertas | $2.00 | $34 |
| **TOTAL INFRAESTRUCTURA** | | **$62.10** | **$1,056** |

> **Verificación:** Puedes confirmar estos precios en la calculadora oficial de AWS:
> https://calculator.aws/pricing/2/homescreen

---

## 2. Costo de APIs de Inteligencia Artificial

El sistema usa dos motores de IA para el **Registro Web** y el **Escáner Inteligente**:

### 2.1 Google Gemini Vision (OCR de documentos)

| Operación | Costo por operación | 50 usos | 100 usos | 500 usos |
|---|---:|---:|---:|---:|
| OCR INE frontal/reverso | ~$0.0015 | $0.08 | $0.15 | $0.75 |
| OCR Acta de Nacimiento | ~$0.0015 | $0.08 | $0.15 | $0.75 |
| OCR Constancia Fiscal SAT | ~$0.001 | $0.05 | $0.10 | $0.50 |

> Fuente: https://ai.google.dev/pricing — modelo `gemini-2.0-flash`

### 2.2 OpenAI GPT-4o (análisis semántico de documentos)

| Operación | Costo por operación | 20 usos | 100 usos | 500 usos |
|---|---:|---:|---:|---:|
| Análisis escritura pública (5 págs) | ~$0.04 | $0.80 | $4.00 | $20.00 |
| Análisis testamento (10-15 págs) | ~$0.15 | $3.00 | $15.00 | $75.00 |
| Extracción campos PDF/Word estándar | ~$0.02 | $0.40 | $2.00 | $10.00 |

> Fuente: https://openai.com/api/pricing — modelo `gpt-4o`

### 2.3 Resumen APIs IA por escenario mensual

| Escenario | Uso estimado | Costo Gemini | Costo OpenAI | **Total IA/mes** |
|---|---|---:|---:|---:|
| Notaría pequeña (Plan Básico) | 20 scans OCR + 5 análisis doc | $0.03 | $0.20 | **~$0.23 USD ($4 MXN)** |
| Notaría mediana (Plan Profesional) | 100 scans OCR + 30 análisis doc | $0.15 | $1.20 | **~$1.35 USD ($23 MXN)** |
| Notaría grande (Plan Empresa) | 500 scans OCR + 150 análisis doc | $0.75 | $6.00 | **~$6.75 USD ($115 MXN)** |

---

## 3. Costo Total por Escenario de Negocio

### Escenario A — 5 notarías (1 mes de operación)

| Concepto | USD | MXN |
|---|---:|---:|
| Infraestructura AWS | $62 | $1,054 |
| APIs IA (mix de planes) | $8 | $136 |
| **Total costos** | **$70** | **$1,190** |
| Ingresos (2 Básico + 2 Profesional + 1 Empresa) | — | **$14,494** |
| **Margen bruto** | — | **$13,304 (91.8%)** |

### Escenario B — 10 notarías (punto de escala)

| Concepto | USD | MXN |
|---|---:|---:|
| Infraestructura AWS (escalar a `t3.medium` + `db.t3.small`) | $95 | $1,615 |
| APIs IA | $20 | $340 |
| **Total costos** | **$115** | **$1,955** |
| Ingresos (4B + 4P + 2E) | — | **$29,990** |
| **Margen bruto** | — | **$28,035 (93.5%)** |

### Escenario C — 25 notarías (crecimiento)

| Concepto | USD | MXN |
|---|---:|---:|
| Infraestructura AWS (ECS/Auto-scaling) | $180 | $3,060 |
| APIs IA | $55 | $935 |
| Dominio, SSL, extras | $10 | $170 |
| **Total costos** | **$245** | **$4,165** |
| Ingresos (10B + 10P + 5E) | — | **$74,980** |
| **Margen bruto** | — | **$70,815 (94.4%)** |

---

## 4. Propuesta de Precios de los Planes

### Tabla comparativa

| Plan | Precio/mes | Precio/año | Ahorro anual | Usuarios | Búsquedas |
|---|---:|---:|---:|---|---|
| **Básico** | $1,499 MXN | $14,990 MXN | $2,998 MXN (2 meses gratis) | 2 | 50/mes |
| **Profesional** | $2,999 MXN | $29,990 MXN | $5,998 MXN (2 meses gratis) | 5 | Ilimitadas |
| **Empresa** | $5,999 MXN | $59,990 MXN | $11,998 MXN (2 meses gratis) | Ilimitados | Ilimitadas |

### Justificación de precios

**Plan Básico — $1,499/mes:**
- Incluye: Control Notarial, Agenda Web, Registro Web (50 personas), 50 búsquedas SAT+OFAC, 20 docs Escáner Inteligente
- El costo de infraestructura asignado por notaría a este plan es de ~$106 MXN/mes
- Con solo **1 notaría en Básico** se paga el dominio y los extras; a partir de la segunda es ganancia

**Plan Profesional — $2,999/mes:**
- Incluye todo lo anterior sin límite, más 200 personas en Registro Web, 100 docs escáner
- Costo de infraestructura + IA estimado: ~$200 MXN/mes por notaría
- Margen: ~93%

**Plan Empresa — $5,999/mes:**
- Sin límites en ninguna herramienta + soporte 24/7
- Ideal para notarías con alto volumen de escrituras y testamentos
- Costo estimado de IA en uso intensivo: ~$115 MXN/mes → Margen: ~98%

---

## 5. Referencia: Competencia en el mercado notarial mexicano

| Plataforma | Precio/mes aprox. | Enfoque |
|---|---:|---|
| NotarSoft | $2,000–$4,000 MXN | Solo gestión interna |
| SistemaNota | $1,500–$3,500 MXN | Sin IA |
| Solucionot | $3,000+ MXN | Suite básica |
| **Atinet Compliance Hub** | **$1,499–$5,999 MXN** | **IA + Compliance + Control Notarial** |

> Atinet es el **único sistema en México** que integra: control notarial + listas negras SAT/OFAC + registro web con OCR por IA + escáner inteligente de documentos, en un solo plan.

---

## 6. Calculadoras de referencia para verificar costos

- **AWS Pricing Calculator:** https://calculator.aws/pricing/2/homescreen
- **Google AI Gemini Pricing:** https://ai.google.dev/pricing
- **OpenAI API Pricing:** https://openai.com/api/pricing
- **AWS RDS Pricing (MySQL):** https://aws.amazon.com/rds/mysql/pricing/
- **AWS EC2 Pricing:** https://aws.amazon.com/ec2/pricing/on-demand/

---

*Documento generado: Abril 2026 — Para uso interno Atinet*
