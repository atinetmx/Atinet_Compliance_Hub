# Cotizaci�n de Infraestructura AWS � Atinet Compliance Hub MVP
> Estimaci�n de costos **realista** para sistema SaaS multi-tenant con IA.
> Precios en USD (cotizaci�n abril 2026). Tipo de cambio referencia: **$17.50 MXN/USD**.
>
> ?? Esta cotizaci�n considera la arquitectura real del sistema: multi-tenant (BD por notar�a),
> colas de trabajo, cache, APIs de IA y APIs C# de integraci�n con el sistema legacy Atinet.

---

## 1. Infraestructura Base en AWS (Producci�n)

### 1.1 C�mputo y Base de Datos

| Servicio AWS | Por qu� este tama�o | USD/mes | MXN/mes |
|---|---|---:|---:|
| **EC2** `t3.medium` | Laravel + React + OCR + queues workers. `t3.small` (2GB) se satura con 3+ notar�as activas simult�neas | $35.00 | $612 |
| **RDS MySQL** `db.t3.small` | Multi-tenant: m�ltiples conexiones por notar�a + queries de reportes pesados. `t3.micro` (1GB RAM) es cuello de botella comprobado | $38.00 | $665 |
| **ElastiCache Redis** `cache.t3.micro` | Cache de sesiones, throttling de APIs, jobs queue (Laravel Horizon). Cr�tico para rendimiento multi-tenant | $20.00 | $350 |

### 1.2 Red, Almacenamiento y Entrega

| Servicio AWS | Descripci�n | USD/mes | MXN/mes |
|---|---|---:|---:|
| **ALB** | Application Load Balancer (HTTPS, certificado SSL) | $18.00 | $315 |
| **S3** | Almacenamiento documentos notariales: PDFs, escrituras, actas (~100 GB con 10 notar�as) | $8.00 | $140 |
| **CloudFront** | CDN para assets React, documentos y descargas. Reduce latencia y costo de egress | $12.00 | $210 |
| **Route 53** | DNS administrado (1 zona hosted) | $1.00 | $17 |
| **ACM** | Certificado SSL/TLS (gratuito con ALB) | $0.00 | $0 |

### 1.3 Mensajer�a, Monitoreo y Seguridad

| Servicio AWS | Descripci�n | USD/mes | MXN/mes |
|---|---|---:|---:|
| **SQS** | Cola de mensajes para jobs pesados: OCR, reportes, webhooks, notificaciones | $5.00 | $87 |
| **SES** | Correos transaccionales: alertas, accesos, reportes (~3,000/mes) | $1.00 | $17 |
| **CloudWatch** | Logs de aplicaci�n, alarmas de errores, m�tricas. Con sistema multi-tenant + colas, los logs son voluminosos | $12.00 | $210 |
| **RDS Backups** | Snapshots diarios (retenci�n 7 d�as) + semanales manuales | $8.00 | $140 |
| **WAF b�sico** | Web Application Firewall: protecci�n contra abuso de APIs y scraping | $10.00 | $175 |

### ? Total Infraestructura Producci�n

| | USD/mes | MXN/mes |
|---|---:|---:|
| **TOTAL INFRAESTRUCTURA** | **$168.00** | **$2,940** |

> ?? La estimaci�n anterior de $62 USD era para un CRUD simple. Este sistema es multi-tenant
> con colas, cache, OCR y auditor�a � el piso real de infraestructura es ~$168 USD/mes.
>
> **Verificaci�n:** https://calculator.aws/pricing/2/homescreen

---

## 2. Costo de APIs Externas

### 2.1 APIs C# � Sistema Legacy Atinet (integraci�n interna)

El sistema consume las APIs del sistema legacy en C# para:
- Lectura de expedientes y control notarial
- Sincronizaci�n de usuarios entre sistemas
- Consulta de cat�logos del sistema antiguo

Estas APIs corren en la infraestructura existente de Atinet. **Costo adicional en AWS: $0**
(ya cubierto por el hosting actual).

> Si en el futuro se migra a AWS: agregar ~$20�40 USD/mes por EC2 Windows + IIS.

---

### 2.2 Google Gemini Vision (OCR � REGISTRO_WEB + ESCANER_INTELIGENTE)

Modelo: `gemini-2.5-flash-preview` (fallback: `gemini-2.0-flash`)

| Operaci�n | Costo/operaci�n | 50 ops | 200 ops | 1,000 ops |
|---|---:|---:|---:|---:|
| OCR INE frontal/reverso | $0.0012 | $0.06 | $0.24 | $1.20 |
| OCR Acta de Nacimiento | $0.0018 | $0.09 | $0.36 | $1.80 |
| OCR Constancia Fiscal SAT / QR | $0.0009 | $0.05 | $0.18 | $0.90 |
| Extracci�n formulario (80 campos) | $0.0030 | $0.15 | $0.60 | $3.00 |

> Fuente: https://ai.google.dev/pricing

---

### 2.3 OpenAI GPT-4o (an�lisis sem�ntico � ESCANER_INTELIGENTE)

Costo por token: input $2.50/M, output $10.00/M.

| Tipo de documento | Costo/operaci�n | 20 ops | 100 ops | 500 ops |
|---|---:|---:|---:|---:|
| Escritura p�blica (5 p�gs) | $0.018 | $0.36 | $1.80 | $9.00 |
| Testamento (10�15 p�gs) | $0.050 | $1.00 | $5.00 | $25.00 |
| Contrato / poder notarial | $0.027 | $0.54 | $2.70 | $13.50 |
| Extracci�n estructurada PDF/Word | $0.014 | $0.28 | $1.40 | $7.00 |

> Fuente: https://openai.com/api/pricing
>
> ?? En uso intensivo (testamentos largos) el costo puede escalar a $20�100 USD/mes.
> El sistema usa Gemini primero; GPT-4o solo se activa para an�lisis sem�ntico complejo.

---

### 2.4 APIs gubernamentales (SAT, CURP, RFC, CP)

| API | Costo |
|---|---|
| SAT scraping (cURL interno) | $0 |
| CURP lookup (RENAPO) | $0 |
| RFC lookup (SAT) | $0 |
| C�digo Postal (Correos MX) | $0 |

---

### 2.5 Costo de IA por plan (estimado mensual por notar�a)

| Plan | Volumen | Gemini | OpenAI | **Total IA/mes** |
|---|---|---:|---:|---:|
| **B�sico** | 70 operaciones | $0.10 | $0.36 | **~$0.46 USD ($8 MXN)** |
| **Profesional** | 300 operaciones | $0.72 | $2.70 | **~$3.42 USD ($60 MXN)** |
| **Empresa** | 700+ operaciones | $2.10 | $14.00 | **~$16 USD ($280 MXN)** |

---

## 3. Escenarios de Negocio (Costo Total Realista)

### Escenario A � MVP (3�5 notar�as, primeros meses)

| Concepto | USD | MXN |
|---|---:|---:|
| Infraestructura AWS | $168 | $2,940 |
| APIs IA (3B + 1P + 1E) | $22 | $385 |
| **TOTAL COSTOS** | **$190** | **$3,325** |
| Ingresos (3 B�sico + 1 Profesional + 1 Empresa) | � | **$16,493** |
| **Margen bruto** | � | **$13,168 (79.8%)** |

### Escenario B � Crecimiento (10 notar�as)

| Concepto | USD | MXN |
|---|---:|---:|
| Infraestructura AWS (misma base, escala hasta ~15) | $168 | $2,940 |
| APIs IA (4B + 4P + 2E) | $58 | $1,015 |
| **TOTAL COSTOS** | **$226** | **$3,955** |
| Ingresos (4 B�sico + 4 Profesional + 2 Empresa) | � | **$29,990** |
| **Margen bruto** | � | **$26,035 (86.8%)** |

### Escenario C � Escala (25 notar�as)

| Concepto | USD | MXN |
|---|---:|---:|
| EC2 `t3.large` + RDS `db.t3.medium` + Redis escalado | $230 | $4,025 |
| APIs IA | $180 | $3,150 |
| Extras (staging, dominio) | $20 | $350 |
| **TOTAL COSTOS** | **$430** | **$7,525** |
| Ingresos (10B + 10P + 5E) | � | **$74,980** |
| **Margen bruto** | � | **$67,455 (89.9%)** |

### Escenario D � Alta escala (60 notar�as, arquitectura ECS)

| Concepto | USD | MXN |
|---|---:|---:|
| ECS Fargate (auto-scaling) | $180 | $3,150 |
| Aurora MySQL Serverless v2 | $150 | $2,625 |
| ElastiCache Redis cluster | $60 | $1,050 |
| S3 + CloudFront (volumen alto) | $40 | $700 |
| ALB + WAF + SES + CloudWatch | $60 | $1,050 |
| APIs IA (volumen alto) | $450 | $7,875 |
| **TOTAL COSTOS** | **$940** | **$16,450** |
| Ingresos (20B + 25P + 15E) | � | **$179,960** |
| **Margen bruto** | � | **$163,510 (90.9%)** |

> ?? **Punto de equilibrio:** Con tan solo **3 notar�as activas** en cualquier plan
> se cubre el 100% del costo de infraestructura AWS mensual.

---

## 4. Propuesta de Precios de los Planes

| Plan | Precio/mes | Precio/a�o | Ahorro | Usuarios | B�squedas |
|---|---:|---:|---:|---|---|
| **Bésico** | $2,999 MXN | $29,990 MXN | $5,998 (2 meses gratis) | 2 | 50/mes |
| **Profesional** | $5,999 MXN | $59,990 MXN | $11,998 (2 meses gratis) | 5 | Ilimitadas |
| **Empresa** | $9,999 MXN | $99,990 MXN | $19,998 (2 meses gratis) | Ilimitados | Ilimitadas |

### Margen real por plan

| Plan | Ingreso | Costo infra asignado | Costo IA | **Margen** |
|---|---:|---:|---:|---:|
| Bésico | $2,999 MXN | ~$330 MXN | ~$8 MXN | **$2,661 (~88.7%)** |
| Profesional | $5,999 MXN | ~$330 MXN | ~$60 MXN | **$5,609 (~93.5%)** |
| Empresa | $9,999 MXN | ~$330 MXN | ~$280 MXN | **$9,389 (~93.9%)** |

---

## 5. Riesgos Operativos

| Riesgo | Impacto | Mitigaci�n |
|---|---|---|
| Costo OpenAI sube con testamentos largos | Medio | Gemini primero; GPT-4o solo para an�lisis complejo |
| BD saturada con 15+ notar�as en `t3.small` | Alto | Upgrade documentado: `db.t3.medium` a ~$60 USD |
| Egress S3 en descargas masivas | Medio | CloudFront reduce hasta 80% costo de transferencia |
| APIs C# ca�das en servidor legacy | Alto | Health check + fallback en frontend con mensaje claro |

---

## 6. Competencia en el Mercado Notarial Mexicano

| Plataforma | Precio/mes | IA | Compliance | Control Notarial |
|---|---:|---|---|---|
| NotarSoft | $2,000�$4,000 MXN | ? | ? | ? |
| SistemaNota | $1,500�$3,500 MXN | ? | ? | ? |
| Solucionot | $3,000+ MXN | ? | B�sico | ? |
| **Atinet Compliance Hub** | **$2,999�$5,999 MXN** | **? Gemini + GPT-4o** | **? SAT + OFAC** | **?** |

> Atinet es el **�nico sistema en M�xico** que integra en un solo plan:
> control notarial + listas negras SAT/OFAC + registro web con OCR por IA
> + esc�ner inteligente + agenda web + APIs de integraci�n con sistema legacy.

---

## 7. Calculadoras de Referencia

- **AWS Pricing Calculator:** https://calculator.aws/pricing/2/homescreen
- **Google AI Gemini Pricing:** https://ai.google.dev/pricing
- **OpenAI API Pricing:** https://openai.com/api/pricing
- **AWS RDS MySQL:** https://aws.amazon.com/rds/mysql/pricing/
- **AWS EC2 On-Demand:** https://aws.amazon.com/ec2/pricing/on-demand/
- **AWS ElastiCache:** https://aws.amazon.com/elasticache/pricing/

---

*Documento generado: Abril 2026 � Para uso interno Atinet*
*Revisado considerando arquitectura multi-tenant real, colas, cache y APIs C# de integraci�n*
