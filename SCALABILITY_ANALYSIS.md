# Análisis de Escalabilidad: 100.000 Usuarios Concurrentes

## 🚨 Diagnóstico Actual
Si hoy entraran 100.000 usuarios concurrentes, **el sistema tendría problemas críticos** debido a la arquitectura actual:

### 1. Rate Limiting (Punto de Fallo Crítico)
*   **Problema:** El rate limiter actual se guarda en la memoria RAM de cada instancia (`Map<string, number>`).
*   **Consecuencia:** Como Vercel/Next.js es *serverless*, se crearán miles de instancias separadas. Un atacante podría hacer 10 requests a la instancia A, 10 a la B, 10 a la C, burlando el límite global.
*   **Solución:** Necesitas un **Rate Limiter Distribuido** (usando **Redis** o **Upstash**).

### 2. Base de Datos (Costos y Cuellos de Botella)
*   **Problema:** Firestore cobra por lectura/escritura. 100k usuarios cargando el dashboard = 100k lecturas * N documentos.
*   **Consecuencia:** Factura de Google Cloud impagable y posibles cuotas excedidas ("Quota Exceeded").
*   **Solución:** Implementar **Caching** agresivo.
    *   Cachear propiedades y configuraciones públicas en **Redis**.
    *   Usar `Cache-Control` headers para que la CDN de Vercel sirva contenido estático.

### 3. Búsquedas
*   **Problema:** Firestore no sirve para búsquedas complejas de texto o filtrado avanzado eficiente.
*   **Solución:** Sincronizar propiedades con un motor de búsqueda como **Algolia** o **Meilisearch**.

### 4. Tareas en Segundo Plano
*   **Problema:** Si 100k usuarios suben una propiedad al mismo tiempo, y cada subida dispara un email + un log + una notificación, el thread principal se bloqueará esperando respuestas de APIs externas.
*   **Solución:** Usar **Colas de Mensajes (Queues)** (ej. **QStash**, **RabbitMQ**). La subida es rápida, y los emails se procesan asincrónicamente mediante "Workers".

---

## 🛠️ Plan de Acción para Escalar

### Fase 1: Infraestructura Crítica
1.  **Redis**: Integrar `@upstash/redis` o similar.
    *   *Uso:* Rate Limiting centralizado y Cache de sesión.
2.  **CDN**: Configurar headers `stale-while-revalidate` en Next.js para reducir hits a la DB.

### Fase 2: Optimización de Costos
1.  **Read-Replicas**: Si usas SQL en el futuro. Con Firestore, enfócate en cache.
2.  **Algolia**: Mover la búsqueda de propiedades fuera de la DB principal.

### Fase 3: Resiliencia
1.  **Circuit Breaker**: Si MercadoPago o la API de Emails caen, que no tiren abajo todo el sitio.
2.  **Auto-scaling**: Vercel lo maneja automáticamente para el frontend/API, pero vigila tus cuotas de Firebase.

### Caching Policy ("Smart Caching")
We have implemented a **Read-Through** caching strategy for high-traffic public data.

*   **What we Cache:**
    *   Public Property Lists (`getAllProperties`): Cached for 5 minutes.
    *   Public Agency Details: Can be cached similarly.
    *   Configurations/Static Data.
*   **What we DO NOT Cache:**
    *   User Session Data (Real-time).
    *   Private Dashboard Data (Real-time).
    *   Transaction Status (Real-time).

**Implementation:**
We use `InMemoryCacheService` wrapped in `globalCache` singleton.
```typescript
const cached = await globalCache.get("key");
if (cached) return cached;
// fetch...
await globalCache.set("key", data, 300); // 5 mins
```

## Conclusión
La arquitectura "Serverless" escalar **horizontalmente** muy bien (Vercel crea más instancias automáticamente), pero tus **servicios dependientes** (Base de datos, APIs externas) serán el cuello de botella si no los proteges con Cache y Colas.
