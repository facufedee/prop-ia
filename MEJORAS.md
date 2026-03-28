# Plan de Mejoras — ZetaProp
> Visión desde la experiencia en el mercado inmobiliario argentino y comparativa con Tokko Broker, ZonaProp, ArgenProp y otros CRMs líderes.

---

## Diagnóstico general

ZetaProp tiene una base técnica sólida y cubre bien la operatoria básica. El diferencial que le falta para competir de verdad con Tokko Broker no es tecnología — es **velocidad en el flujo de trabajo del agente**. Tokko gana porque el agente hace en 2 clics lo que en otros sistemas lleva 10. El objetivo de este plan es que ZetaProp sea más rápido, más automático, y más confiable que cualquier alternativa.

---

## PRIORIDAD 1 — Lo que frena el negocio hoy

### 1.1 Publicación real en portales (no solo XML)

**El problema:** El módulo de Publicaciones existe pero no funciona. Solo genera un feed XML que el portal tiene que ir a buscar cada hora. Tokko Broker publica instantáneamente en ZonaProp, ArgenProp y Properati con un toggle.

**La solución:**
- Integrar la **API de Navent** (que maneja ZonaProp y ArgenProp) para publicar/despublicar en tiempo real
- Integrar **Mercado Libre Inmuebles** (enorme volumen en Argentina)
- Panel de estado por propiedad: en qué portales está publicada, cuántas visitas generó, cuándo fue la última actualización
- Sincronización de fotos, precio y descripción automática al editar la propiedad

**Impacto:** Es el feature más pedido por agentes. Sin esto, siguen usando el portal directamente y el CRM queda como "otro sistema más".

---

### 1.2 Matching automático lead → propiedad

**El problema:** Cuando entra un lead con "busco 2 ambientes en Palermo hasta USD 150k", el agente tiene que buscar manualmente en el listado. En Tokko esto es automático.

**La solución:**
- Al crear un lead, registrar sus criterios de búsqueda (zona, tipo, operación, presupuesto min/max, ambientes)
- Al publicar una propiedad nueva, notificar automáticamente a todos los leads que hacen match
- En el detalle del lead, mostrar las propiedades que coinciden con sus criterios
- En el detalle de la propiedad, mostrar los leads que podrían estar interesados

**Impacto:** Convierte el CRM en una herramienta activa, no solo de registro. El agente cierra más operaciones porque no se le escapa ninguna oportunidad.

---

### 1.3 Portal del Propietario

**El problema:** Existe el portal del inquilino, pero no el del propietario. Los propietarios llaman todo el tiempo para saber si cobró, cuánto les transfirió, si hay algún problema con la propiedad.

**La solución (siguiendo el modelo del portal inquilino — código + DNI):**
- Ver el estado de su propiedad (ocupada, libre, en oferta)
- Ver las liquidaciones: cuánto se cobró, cuánto le corresponde, cuándo fue la transferencia
- Ver los últimos pagos del inquilino
- Descargar comprobantes de liquidación
- Ver si hay incidencias abiertas en su propiedad
- Botón para contactar a la inmobiliaria

**Impacto:** Reduce llamadas al 80%. Los propietarios felices renuevan contratos y traen más propiedades.

---

### 1.4 Firma digital de contratos

**El problema:** Hoy se genera el DOCX del contrato pero hay que imprimirlo, firmarlo en persona, escanearlo. En 2026 esto es inaceptable.

**La solución:**
- Integrar **DocuSign** o **Signaturit** (tiene SDK para Node.js)
- Flujo: generar contrato → enviar link por email/WhatsApp → firmantes lo firman desde el celular → contrato queda guardado en Firestore como PDF firmado
- Registro de quién firmó, cuándo y desde qué IP

**Impacto:** Cierra operaciones más rápido. En alquileres de inmuebles donde una de las partes está en otra ciudad, es la diferencia entre hacer o no hacer el negocio.

---

### 1.5 WhatsApp real (recibir mensajes, no solo enviar)

**El problema:** La integración actual solo envía. Un agente no puede ver las respuestas de los clientes dentro de ZetaProp.

**La solución:**
- Implementar el **webhook de Meta Cloud API** en `/api/whatsapp/webhook`
- Asociar número de WhatsApp → lead automáticamente por número de teléfono
- Mostrar el hilo de conversación en el detalle del lead
- Cuando llega un mensaje de un número desconocido → crear lead automáticamente con origen "whatsapp"
- Respuestas rápidas predefinidas ("Hola! Te llamo en un momento", "¿Cuándo podés visitar?")

**Impacto:** WhatsApp es el canal #1 en Argentina. Hoy el agente vive en la app del celular y el CRM queda desactualizado. Con esto, todo queda registrado.

---

## PRIORIDAD 2 — Lo que separa un CRM básico de uno profesional

### 2.1 Seguimiento automático de leads (sequences)

**El problema:** El 80% de los leads se pierden porque nadie les hace seguimiento después del primer contacto. Esto no es desidia del agente — es que tiene 50 leads y no puede seguir a todos.

**La solución:**
- Crear secuencias automáticas por tipo de lead:
  - Lead nuevo sin respuesta → WhatsApp a las 2hs → Email a las 24hs → Alerta al agente a las 48hs
  - Lead en negociación sin actividad → recordatorio al agente cada 3 días
  - Lead perdido → reactivación automática a los 30 días ("¿Seguís buscando?")
- El agente configura qué secuencia aplica a cada tipo
- Se puede pausar/cancelar por lead individual

**Impacto:** Convierte el CRM en un sistema que trabaja solo. Es el feature que más diferencia a Tokko Broker de los demás.

---

### 2.2 Alertas de propiedades para compradores/interesados

**El problema:** Un cliente dice "si sale algo de 3 ambientes en Villa Urquiza avisame". Hoy eso depende de que el agente se acuerde.

**La solución:**
- En el perfil del lead, registrar una "búsqueda guardada" (zona, tipo, operación, rango de precio)
- Cuando se publica una propiedad nueva que hace match → email automático al interesado con link a la propiedad
- El agente ve cuántos interesados recibieron la alerta de cada propiedad

**Impacto:** Genera engagement sin esfuerzo. Los clientes sienten que la inmobiliaria trabaja para ellos.

---

### 2.3 Calendario mejorado

**El problema:** El calendario solo tiene vista semanal, no se puede arrastrar para reprogramar, y no tiene recordatorios automáticos.

**La solución:**
- Vista mensual completa
- Drag & drop para reprogramar visitas
- Recordatorio automático 24hs antes por WhatsApp o email al cliente
- Integración con Google Calendar / Outlook (OAuth)
- Al confirmar una visita, cambiar automáticamente el estado del lead a "Visita Programada"
- Ver disponibilidad de agentes para no superponer visitas

---

### 2.4 Reportes y análisis de mercado

**El problema:** El módulo de finanzas es bueno para ver lo que ya pasó, pero no ayuda a tomar decisiones. Un broker necesita saber qué propiedades no se venden, qué agente cierra más, cuánto tarda una propiedad en alquilarse.

**Nuevos reportes:**
- **Tiempo en mercado**: Promedio de días que tarda una propiedad en alquilarse/venderse por zona
- **Tasa de conversión por agente**: Leads asignados vs operaciones cerradas
- **Propiedades sin actividad**: Publicadas hace más de 30 días sin consultas
- **Origen de leads más efectivo**: Qué canal convierte más (Instagram vs ZonaProp vs referidos)
- **Precios**: Comparativa precio publicado vs precio final de cierre
- **Funnel del pipeline**: Cuántos leads entran, cuántos llegan a visita, cuántos cierran

---

### 2.5 Portal del inquilino — completarlo

**Lo que falta y tiene alto impacto:**
- **Cupón de pago real**: Generar PDF con QR de pago o CVU/alias para transferencia
- **Reclamo de incidencias**: El inquilino abre un ticket con foto (gotera, calefacción rota), la inmobiliaria lo ve en el CRM y actualiza el estado
- **Historial real de pagos**: Conectado a los datos reales de Firestore, no hardcodeado
- **Descarga de comprobantes**: PDF del recibo de pago de cada mes
- **Alertas de vencimiento**: Email/WhatsApp automático 5 días antes del vencimiento

---

## PRIORIDAD 3 — Diferenciadores a largo plazo

### 3.1 App móvil para agentes

**El contexto:** El agente inmobiliario pasa el 60% del día fuera de la oficina. Tokko tiene app móvil hace años. Sin app, el agente usa WhatsApp para todo y el CRM queda desactualizado.

**Stack recomendado:** React Native reutilizando todos los servicios existentes.

**Features mínimos para el MVP de la app:**
- Ver y actualizar leads (drag & drop del kanban)
- Registrar una interacción en 2 toques
- Ver propiedades con fotos
- Acceso al calendario de visitas
- Recibir notificaciones push de nuevos leads

---

### 3.2 Tasación comparativa (CMA)

**El problema:** La tasación con ML da un número, pero el propietario quiere saber *por qué* su propiedad vale eso.

**La solución:**
- Generar un informe PDF de tasación que incluya:
  - El precio estimado con rango (mínimo-máximo)
  - Propiedades comparables del barrio (vendidas recientemente)
  - Precio por m² de la zona
  - Tiempo estimado de venta según el precio elegido
  - Recomendación de precio de publicación

**Impacto:** Es el documento que el agente lleva a la reunión con el propietario para captarlo. Tokko tiene esto y es uno de sus features estrella.

---

### 3.3 Gestión de gastos por propiedad

**El problema:** Una propiedad tiene gastos: reparaciones, pintura antes de una nueva locación, mantenimiento de la pileta. Hoy no hay donde registrarlo.

**La solución:**
- En el detalle de la propiedad, sección "Gastos"
- Registro de gastos con fecha, descripción, monto, comprobante (foto)
- Reporte de rentabilidad por propiedad: ingresos por alquiler - gastos = rentabilidad real
- Posibilidad de descontarlos de la liquidación al propietario

---

### 3.4 Integración contable

**El contexto:** Las inmobiliarias más grandes usan Tango, Bejerman o Contasol. Hoy exportan todo a mano.

**La solución (MVP):**
- Exportación de liquidaciones en formato CSV/Excel compatible con estas herramientas
- Exportación de comprobantes en formato AFIP
- Generación de recibos de honorarios con CAE (integración con AFIP)

---

### 3.5 Tours virtuales y multimedia enriquecida

**El problema:** ZetaProp soporta el campo de tour 360° pero no hay integración real. En 2026 los tours virtuales son estándar en el mercado premium.

**La solución:**
- Integración con **Matterport** o **Kuula** para tours 360° directamente desde el listado
- Soporte para videos de YouTube/Vimeo embebidos en la ficha
- Orden de fotos con drag & drop en la carga
- Marca de agua automática en fotos con el logo de la inmobiliaria

---

## Tabla de priorización

| # | Mejora | Impacto | Esfuerzo | Prioridad |
|---|--------|---------|----------|-----------|
| 1.1 | Publicación real en portales | ★★★★★ | Alto | 🔴 Crítico |
| 1.2 | Matching lead → propiedad | ★★★★★ | Medio | 🔴 Crítico |
| 1.3 | Portal del propietario | ★★★★☆ | Medio | 🔴 Crítico |
| 1.4 | Firma digital de contratos | ★★★★☆ | Medio | 🔴 Crítico |
| 1.5 | WhatsApp bidireccional | ★★★★★ | Alto | 🔴 Crítico |
| 2.1 | Sequences automáticas | ★★★★★ | Alto | 🟠 Alto |
| 2.2 | Alertas de propiedades | ★★★★☆ | Bajo | 🟠 Alto |
| 2.3 | Calendario mejorado | ★★★☆☆ | Medio | 🟠 Alto |
| 2.4 | Reportes avanzados | ★★★★☆ | Medio | 🟠 Alto |
| 2.5 | Portal inquilino completo | ★★★★☆ | Medio | 🟠 Alto |
| 3.1 | App móvil | ★★★★★ | Muy alto | 🟡 Medio |
| 3.2 | CMA / Tasación comparativa | ★★★★☆ | Alto | 🟡 Medio |
| 3.3 | Gastos por propiedad | ★★★☆☆ | Bajo | 🟡 Medio |
| 3.4 | Integración contable | ★★★☆☆ | Alto | 🟡 Medio |
| 3.5 | Tours virtuales | ★★★☆☆ | Medio | 🟡 Medio |

---

## Hoja de ruta sugerida

```
Q1 (ahora)
├── Portal del Propietario (reutiliza 90% del código del portal inquilino)
├── Matching lead → propiedad (lógica de consulta + notificación)
└── Alertas de propiedades para interesados

Q2
├── Publicación real en portales (API Navent + MercadoLibre)
├── Portal del inquilino completo (cupones, incidencias, comprobantes)
└── Calendario con vista mensual + recordatorios automáticos

Q3
├── WhatsApp bidireccional (webhook + historial en lead)
├── Sequences automáticas de seguimiento
└── Firma digital (DocuSign/Signaturit)

Q4
├── Reportes avanzados y análisis de mercado
├── CMA / Tasación con informe PDF
└── App móvil MVP (React Native)
```

---

## Lo que ZetaProp ya hace mejor que la competencia

Para no perder de vista lo que está bien:

- **Ajustes ICL/IPC automáticos**: Tokko Broker los tiene pero son más complejos de configurar
- **Portal inquilino sin contraseña**: Diferencial real — ningún competidor tiene esto tan bien resuelto
- **Tasación con IA**: Tokko no tiene esto integrado nativamente
- **Precio**: ZetaProp puede ser significativamente más barato que Tokko para inmobiliarias medianas

---

> Este documento fue generado analizando el código actual de ZetaProp y comparando con las funcionalidades de Tokko Broker, ZonaProp, ArgenProp, Properati y Mercado Libre Inmuebles.
