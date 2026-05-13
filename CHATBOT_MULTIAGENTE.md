# Sistema de Chatbot Multi-Agente — ZetaProp

> **Estado**: Diseño / Planificación | **Fecha**: Mayo 2026
> **Base existente**: `/api/chat` con Gemini + tool calling básico (agente único)

---

## Visión general

Reemplazar el chat actual (agente único, acceso limitado a datos) por un sistema de **múltiples agentes especializados**, cada uno experto en un módulo de la plataforma, con acceso completo a los datos del usuario autenticado.

El resultado: un asistente lateral visible en todo el dashboard que el usuario puede consultar como si hablara con un colega que conoce su cartera de propiedades, sus alquileres, sus leads y su negocio.

---

## Problema con el sistema actual

El chat actual (`/api/chat/route.ts`) tiene:
- Un único agente generalista con system prompt amplio
- Solo 5 tools básicas (planes, blog, propiedades limitadas)
- Sin acceso real a alquileres, leads, ventas, finanzas ni clientes
- Sin streaming (respuesta entera al final)
- Sin UI visible — se abre como modal separado

---

## Arquitectura propuesta: Orchestrator + Specialists

```
Usuario escribe mensaje
        ↓
┌─────────────────────┐
│   Agente Orquestador │  ← lee el intent, elige el specialist
│   (Router Agent)     │
└─────────────────────┘
        ↓ handoff
┌──────────────────────────────────────────────────────┐
│                   Agentes Especialistas               │
│                                                      │
│  🏠 Propiedades  │  📄 Alquileres  │  👥 Leads       │
│  👤 Clientes     │  💰 Finanzas    │  📊 Ventas      │
│  🌐 Mi Sitio     │  🤖 General     │                 │
└──────────────────────────────────────────────────────┘
        ↓
Respuesta en streaming al panel lateral
```

### Flujo de una consulta

1. El usuario escribe: *"¿Cuántos alquileres activos tengo este mes?"*
2. El **Orquestador** identifica intent: `módulo=alquileres`, `acción=consulta`
3. Hace **handoff** al **Agente de Alquileres**
4. El Agente de Alquileres llama la tool `get_active_rentals(userId)`
5. Firestore devuelve los contratos (filtrados por `userId`)
6. El agente formatea y devuelve la respuesta en streaming
7. El panel lateral muestra `Respondiendo: Agente de Alquileres`

---

## Panel lateral (UI)

### Diseño

- **Posición**: costado derecho fijo del dashboard (`position: fixed, right: 0`)
- **Ancho**: 380px en desktop, fullscreen en mobile
- **Visible siempre**: no se oculta al navegar entre secciones
- **Minimizable**: colapsa a botón flotante (similar a Intercom)
- **Indicador de agente activo**: muestra qué especialista está respondiendo
- **Streaming**: texto aparece palabra por palabra (no espera la respuesta completa)

### Estados del panel

```
Estado EXPANDIDO              Estado MINIMIZADO
┌──────────────┐              ┌──┐
│ 🤖 ZetaBot  │              │ 🤖│  ← botón flotante
│─────────────│              └──┘
│ Agente:     │
│ Alquileres  │
│─────────────│
│ Historial   │
│ de mensajes │
│─────────────│
│ [  Escribí  ]│
└──────────────┘
```

### Componente React

```
src/ui/components/chat/
├── ChatPanel.tsx           ← panel lateral completo
├── ChatMessage.tsx         ← burbuja de mensaje individual
├── AgentIndicator.tsx      ← chip que muestra qué agente responde
├── ChatInput.tsx           ← input con submit
└── useChat.ts              ← hook de estado y llamadas a API
```

El panel se monta en `src/app/(main)/dashboard/layout.tsx` para que persista en todas las rutas.

---

## Agentes especializados

### 1. Agente Orquestador (Router)

**Responsabilidad**: Analizar el intent del usuario y hacer handoff al agente correcto.

**No tiene tools propias** — solo clasifica y delega.

**Lógica de routing:**

| Palabras clave en el mensaje | Agente destino |
|------------------------------|---------------|
| propiedad, inmueble, publicar, fotos, precio | Propiedades |
| alquiler, inquilino, contrato, pago, vencimiento, mora | Alquileres |
| lead, consulta, cliente interesado, pipeline, kanban | Leads |
| propietario, dueño, inquilino (como persona) | Clientes |
| plata, cobré, ingresos, finanzas, rentabilidad | Finanzas |
| venta, compraventa, comprador, operación | Ventas |
| sitio, portal, publicación web, mi página | Mi Sitio |

---

### 2. Agente de Propiedades 🏠

**System prompt**: Experto en gestión de cartera inmobiliaria. Conoce todos los campos de una propiedad en ZetaProp (tipo, operación, precio, superficie, ubicación, estado, fotos, agente asignado).

**Tools disponibles:**

```typescript
// Consulta
get_properties(userId, filters?: { status, operation, type, limit })
get_property_detail(userId, propertyId)
get_property_stats(userId) // total activas, reservadas, vendidas

// Escritura
create_property(userId, data)           // carga nueva propiedad
update_property(userId, propertyId, data)
toggle_portal_publish(userId, propertyId, publish: boolean)
```

**Ejemplos de consultas:**
- *"¿Cuántas propiedades en alquiler tengo activas?"*
- *"Cargame una propiedad: 2 ambientes en Palermo, $350.000 alquiler"*
- *"¿Cuál es la propiedad que más tiempo lleva publicada sin consultas?"*
- *"Publicá la propiedad ID-123 en el portal"*

---

### 3. Agente de Alquileres 📄

**System prompt**: Experto en gestión locativa argentina. Conoce contratos, períodos de pago, ajustes IPC/ICL, punitorios, liquidaciones y normativa vigente.

**Tools disponibles:**

```typescript
// Consulta
get_active_rentals(userId, filters?: { status, due_soon })
get_rental_detail(userId, rentalId)
get_overdue_payments(userId)             // pagos vencidos
get_upcoming_adjustments(userId)         // ajustes próximos (IPC/ICL)
get_rental_stats(userId)                 // resumen del portfolio

// Escritura
register_payment(userId, rentalId, amount, date)
create_rental(userId, data)
generate_contract(userId, rentalId)      // genera DOCX
open_incident(userId, rentalId, description)
```

**Ejemplos:**
- *"¿Qué alquileres vencen esta semana?"*
- *"¿Cuánto me deben los inquilinos en mora?"*
- *"Registrá el pago de $180.000 del contrato de García"*
- *"¿Cuándo corresponde el próximo ajuste ICL del contrato de Av. Corrientes 1234?"*

---

### 4. Agente de Leads 👥

**System prompt**: Experto en CRM inmobiliario y seguimiento comercial. Conoce el pipeline de ventas, los estados de los leads y las mejores prácticas de seguimiento en el mercado argentino.

**Tools disponibles:**

```typescript
// Consulta
get_leads(userId, filters?: { status, assigned_to, source, limit })
get_lead_detail(userId, leadId)
get_pipeline_stats(userId)              // cuántos en cada etapa
get_leads_without_followup(userId)      // leads sin actividad en X días
get_hot_leads(userId)                   // leads en etapa "Visita" o "Reservado"

// Escritura
create_lead(userId, data)
update_lead_status(userId, leadId, status)
assign_lead(userId, leadId, agentId)
add_lead_note(userId, leadId, note)
```

**Ejemplos:**
- *"¿Cuántos leads nuevos entré esta semana?"*
- *"Mostrá los leads sin seguimiento hace más de 3 días"*
- *"Creá un lead: Martín López, busca 3 ambientes en Belgrano, presupuesto USD 200k"*
- *"Mové el lead de López a estado Visita Programada"*

---

### 5. Agente de Clientes 👤

**System prompt**: Experto en gestión de cartera de clientes inmobiliarios (propietarios e inquilinos). Conoce la diferencia entre ambos roles y cómo están relacionados con propiedades y contratos.

**Tools disponibles:**

```typescript
// Consulta
get_clients(userId, filters?: { type: 'propietario' | 'inquilino', limit })
get_client_detail(userId, clientId)
get_client_properties(userId, clientId)  // propiedades relacionadas
get_client_rentals(userId, clientId)     // contratos relacionados

// Escritura
create_client(userId, data, type)
update_client(userId, clientId, data)
```

**Ejemplos:**
- *"¿Cuántos propietarios tengo cargados?"*
- *"Buscame los datos de contacto de Juan Rodríguez"*
- *"¿Qué propiedades administro para el propietario García?"*
- *"Cargá un propietario: Marta Sosa, DNI 28.500.000, tel 11-4567-8901"*

---

### 6. Agente Financiero 💰

**System prompt**: Experto en finanzas inmobiliarias argentinas. Maneja conceptos de rentabilidad, liquidaciones, comisiones y reportes de gestión.

**Tools disponibles:**

```typescript
// Consulta
get_financial_summary(userId, period: 'month' | 'quarter' | 'year')
get_income_by_property(userId)
get_pending_liquidations(userId)
get_commission_report(userId, agentId?)
get_expenses_summary(userId)
```

**Ejemplos:**
- *"¿Cuánto cobré en alquileres este mes?"*
- *"¿Cuál es la propiedad más rentable de mi cartera?"*
- *"¿Qué liquidaciones tengo pendientes para pasarle a los propietarios?"*
- *"Dame un resumen financiero del trimestre"*

---

### 7. Agente de Ventas 📊

**System prompt**: Experto en operaciones de compraventa inmobiliaria argentina.

**Tools disponibles:**

```typescript
get_sales(userId, filters?: { status, limit })
get_sale_detail(userId, saleId)
get_sales_stats(userId, period)
create_sale(userId, data)
update_sale_status(userId, saleId, status)
```

---

### 8. Agente de Sitio 🌐

**System prompt**: Asistente para la configuración del portal web de la inmobiliaria.

**Tools disponibles:**

```typescript
get_site_config(userId)
get_site_stats(userId)                   // visitas, propiedades publicadas
update_site_config(userId, data)
get_published_properties(userId)
```

**Ejemplos:**
- *"¿Cuántas propiedades tengo publicadas en mi portal?"*
- *"Cambiá el color primario de mi sitio a azul"*
- *"¿Cuál es mi slug de portal?"*

---

## Seguridad e isolación de datos

**Regla fundamental**: Ningún agente puede acceder a datos de otro usuario.

```typescript
// Todas las tools reciben userId desde el JWT verificado, no del mensaje del usuario
async function get_properties(userId: string, filters: FilterParams) {
  // userId viene del token Firebase verificado en el servidor
  // NUNCA del mensaje del usuario
  const q = query(
    collection(db, "properties"),
    where("userId", "==", userId),  // isolación garantizada
    ...buildFilters(filters)
  );
}
```

**Flujo de autenticación del chatbot:**
1. Request llega a `/api/chat/multiagent`
2. `verifyAuth(request)` valida el JWT de Firebase
3. `userId` se extrae del token verificado
4. Se inyecta en todas las tools del agente activo
5. Las queries Firestore filtran siempre por `userId`

---

## Librería recomendada: Vercel AI SDK

### ¿Por qué Vercel AI SDK?

| Criterio | Vercel AI SDK | LangChain.js | Mastra |
|----------|--------------|-------------|--------|
| Integración Next.js | ★★★★★ | ★★★☆☆ | ★★★★☆ |
| Streaming nativo | ★★★★★ | ★★★☆☆ | ★★★★☆ |
| Multi-agente | ★★★★☆ | ★★★★★ | ★★★★★ |
| Compatibilidad Gemini | ★★★★★ | ★★★★☆ | ★★★☆☆ |
| Madurez / comunidad | ★★★★★ | ★★★★★ | ★★★☆☆ |
| Tamaño del bundle | ★★★★★ | ★★☆☆☆ | ★★★★☆ |
| TypeScript first | ★★★★★ | ★★★☆☆ | ★★★★★ |

**Vercel AI SDK** es la opción más natural para este proyecto porque:
- Es el estándar de facto para IA en Next.js
- Tiene streaming nativo con `streamText` (respuesta palabra por palabra)
- Soporte oficial para Gemini via `@ai-sdk/google`
- Pattern de **handoff entre agentes** integrado
- `generateObject` para respuestas estructuradas (routing)
- Hook `useChat` listo para usar en el frontend

### Instalación

```bash
npm install ai @ai-sdk/google
```

**Reemplaza** `@google/generative-ai` (actualmente usado) con la abstracción de Vercel AI SDK.

### Alternativas a considerar

**Mastra** (`@mastra/core`) si en el futuro se necesita:
- Workflows de agentes más complejos (grafos, estados)
- Memoria persistente entre sesiones
- RAG integrado (buscar en documentos propios)
- Scheduling de agentes automáticos

**LangGraph.js** si se necesita:
- Loops condicionales complejos entre agentes
- Estado compartido entre agentes
- Ciclos de reflexión / autocorrección

---

## Implementación técnica

### Estructura de archivos

```
src/
├── app/
│   └── api/
│       └── chat/
│           ├── route.ts                  ← chat actual (mantener por ahora)
│           └── multiagent/
│               └── route.ts             ← nuevo endpoint multi-agente
│
├── infrastructure/
│   └── ai/
│       ├── agents/
│       │   ├── orchestrator.ts          ← router, elige el agente
│       │   ├── propiedadesAgent.ts
│       │   ├── alquileresAgent.ts
│       │   ├── leadsAgent.ts
│       │   ├── clientesAgent.ts
│       │   ├── financieroAgent.ts
│       │   ├── ventasAgent.ts
│       │   └── sitioAgent.ts
│       ├── tools/
│       │   ├── propiedadesTools.ts      ← tools Firestore para propiedades
│       │   ├── alquileresTools.ts
│       │   ├── leadsTools.ts
│       │   ├── clientesTools.ts
│       │   ├── financieroTools.ts
│       │   ├── ventasTools.ts
│       │   └── sitioTools.ts
│       └── agentRegistry.ts            ← mapa de agentes disponibles
│
└── ui/
    └── components/
        └── chat/
            ├── ChatPanel.tsx
            ├── ChatMessage.tsx
            ├── AgentBadge.tsx
            ├── ChatInput.tsx
            └── useMultiChat.ts
```

### Esquema del nuevo endpoint

```typescript
// src/app/api/chat/multiagent/route.ts
import { streamText, generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

export async function POST(request: Request) {
  // 1. Verificar auth
  const authResult = await verifyAuth(request);
  const { userId } = authResult;

  const { messages } = await request.json();
  const lastMessage = messages[messages.length - 1].content;

  // 2. Orquestador elige el agente
  const { object: routing } = await generateObject({
    model: google("gemini-2.0-flash"),
    schema: z.object({
      agent: z.enum([
        "propiedades", "alquileres", "leads", 
        "clientes", "finanzas", "ventas", "sitio", "general"
      ]),
      reason: z.string(),
    }),
    prompt: `Usuario pregunta: "${lastMessage}"
    ¿Qué agente especialista debe responder? Elegí solo uno.`,
  });

  // 3. Cargar agente especialista con sus tools
  const agent = getAgent(routing.agent, userId);

  // 4. Streaming de la respuesta
  const result = streamText({
    model: google("gemini-2.0-flash"),
    system: agent.systemPrompt,
    messages,
    tools: agent.tools,
    maxSteps: 5,  // permite múltiples tool calls encadenadas
  });

  // 5. Incluir metadata del agente en el stream (para mostrar en UI)
  return result.toDataStreamResponse({
    headers: {
      "X-Agent": routing.agent,
    },
  });
}
```

### Hook del frontend

```typescript
// src/ui/components/chat/useMultiChat.ts
import { useChat } from "ai/react";

export function useMultiChat() {
  const { messages, input, handleSubmit, isLoading, data } = useChat({
    api: "/api/chat/multiagent",
    streamProtocol: "data",
  });

  // Extraer qué agente está respondiendo desde los headers o metadata
  const activeAgent = data?.agent ?? "general";

  return { messages, input, handleSubmit, isLoading, activeAgent };
}
```

---

## Capacidades de escritura (no solo lectura)

Una ventaja clave del sistema multi-agente es que puede **ejecutar acciones**, no solo consultar.

| Acción | Agente | Ejemplo |
|--------|--------|---------|
| Cargar propiedad | Propiedades | *"Cargame un ph en Villa Urquiza, 3 amb, $500k"* |
| Registrar pago | Alquileres | *"Registrá el pago de marzo de García"* |
| Crear lead | Leads | *"Nuevo lead: Ana Torres, busca dpto en Caballito"* |
| Cambiar estado lead | Leads | *"El lead de Torres pasó a Visita Programada"* |
| Abrir incidencia | Alquileres | *"Abrí una incidencia en Av. Libertador 500: gotera en baño"* |
| Cargar cliente | Clientes | *"Nuevo propietario: Carlos Ruiz, DNI 30.100.200"* |

**Confirmación antes de escribir**: Para acciones de creación/modificación, el agente siempre pide confirmación antes de ejecutar:

```
Usuario: "Cargame una propiedad: 2 amb en Palermo, alquiler $350.000"
Agente: "Entendido. Voy a cargar:
  - Tipo: Departamento 2 ambientes
  - Operación: Alquiler
  - Precio: $350.000/mes
  - Zona: Palermo
  ¿Confirmás o querés agregar más datos (dirección, m², fotos)?"
```

---

## Memoria y contexto

### Memoria de sesión (corto plazo)
- Las últimas 20 interacciones se mantienen en el historial del chat
- El contexto viaja en cada request (`messages[]`)
- Al recargar la página se puede recuperar desde Firestore (`chat_sessions`)

### Contexto del usuario (inyectado en system prompt)
Cada agente recibe contexto del usuario al inicio:

```
Estás asistiendo a [Nombre Inmobiliaria], plan Professional.
Tienen 45 propiedades activas, 23 alquileres en curso, 12 leads en pipeline.
Hoy es [fecha]. Moneda: ARS.
```

### Memoria a largo plazo (fase 2)
Con **Mastra** o una colección `agent_memory` en Firestore:
- Recordar preferencias del usuario
- *"La última vez preguntaste por el lead García, ¿querés ver la actualización?"*
- Resúmenes automáticos al inicio del día

---

## Fases de implementación

### Fase 1 — Panel lateral + Agente único mejorado (1-2 semanas)

**Objetivo**: Tener el panel visible en el dashboard con streaming real.

- [ ] Migrar `/api/chat` a Vercel AI SDK (`streamText` + `@ai-sdk/google`)
- [ ] Crear `ChatPanel.tsx` fijo en el layout del dashboard
- [ ] Implementar streaming en el frontend con `useChat` de Vercel AI SDK
- [ ] Expandir tools del agente actual (alquileres, leads, clientes)
- [ ] Agregar `AgentBadge` simple (no multi-agente aún)

**Stack**: `ai` + `@ai-sdk/google`, reemplaza `@google/generative-ai` directo

---

### Fase 2 — Orquestador + primeros especialistas (2-3 semanas)

**Objetivo**: Routing automático a agentes de Propiedades, Alquileres y Leads.

- [ ] Crear endpoint `/api/chat/multiagent`
- [ ] Implementar Orquestador con `generateObject` (routing)
- [ ] Agente de Propiedades (read + write básico)
- [ ] Agente de Alquileres (read + registrar pagos)
- [ ] Agente de Leads (read + cambiar estados)
- [ ] Mostrar qué agente está respondiendo en el `AgentBadge`
- [ ] Confirmación antes de acciones de escritura

---

### Fase 3 — Todos los agentes (2-3 semanas)

- [ ] Agente de Clientes
- [ ] Agente Financiero
- [ ] Agente de Ventas
- [ ] Agente de Sitio
- [ ] Handoff entre agentes (un agente puede pasar el contexto a otro)
- [ ] Confirmación mejorada con formularios inline en el chat

---

### Fase 4 — Memoria y proactividad (futuro)

- [ ] Memoria de largo plazo por usuario (Firestore `agent_memory`)
- [ ] Resumen diario automático al abrir el dashboard
- [ ] Notificaciones proactivas (*"Tenés 3 alquileres que vencen esta semana"*)
- [ ] Evaluar migración a **Mastra** para workflows complejos

---

## Consideraciones de costo (Gemini)

| Modelo | Input (por 1M tokens) | Output | Recomendado para |
|--------|-----------------------|--------|-----------------|
| `gemini-2.0-flash` | $0.075 | $0.30 | Orquestador + especialistas (default) |
| `gemini-2.5-pro` | $1.25 | $10.00 | Consultas complejas, análisis financiero |
| `gemini-1.5-flash-8b` | $0.0375 | $0.15 | Respuestas simples, lectura de datos |

**Estimación mensual** (100 usuarios activos, 20 consultas/día):
- ~2M tokens de input + ~500k output → ~$0.30/día → **~$9/mes**

Para reducir costos:
- Orquestador usa `gemini-2.0-flash` (barato, solo clasifica)
- Agentes especializados usan `gemini-2.0-flash` por defecto
- Solo escalar a `gemini-2.5-pro` para análisis complejos

---

## Referencia de recursos

| Recurso | URL |
|---------|-----|
| Vercel AI SDK Docs | https://sdk.vercel.ai/docs |
| Multi-agent con AI SDK | https://sdk.vercel.ai/docs/ai-sdk-core/agents |
| `@ai-sdk/google` provider | https://sdk.vercel.ai/providers/ai-sdk-providers/google |
| `useChat` hook (frontend) | https://sdk.vercel.ai/docs/ai-sdk-ui/chatbot |
| Mastra docs | https://mastra.ai/docs |
| LangGraph.js | https://langchain-ai.github.io/langgraphjs/ |

---

## Resumen de decisiones

| Decisión | Elección | Razón |
|----------|----------|-------|
| Librería | **Vercel AI SDK** | Mejor integración Next.js, streaming nativo, soporte Gemini oficial |
| Patrón multi-agente | **Orchestrator + Specialists** | Simple, predecible, fácil de debuggear |
| Modelo principal | **Gemini 2.0 Flash** | Balance costo/calidad óptimo para el volumen esperado |
| Seguridad | **userId desde JWT** | Nunca del mensaje del usuario, siempre del token verificado |
| UI | **Panel lateral fijo** | Más accesible que un modal, no interrumpe el flujo de trabajo |
| Escritura | **Con confirmación** | Evita acciones accidentales, genera confianza en el sistema |
| Fase 1 | **Panel + agente mejorado** | Entrega valor rápido antes de la complejidad multi-agente |
