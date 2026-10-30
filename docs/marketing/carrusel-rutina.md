# Rutina semanal — borrador del carrusel de Instagram

Un agente programado (rutina en la nube, una vez por semana) toma el próximo tema del banco (`docs/marketing/carrusel-temas.md`), escribe el carrusel y lo deja como **borrador**. No publica nada: el admin lo revisa y lo publica desde `/dashboard/admin/redes`.

El agente solo necesita el secreto `CAROUSEL_DRAFT_SECRET`. No usa credenciales de Firebase ni llama a otras APIs de la app.

## Endpoints

| Método | URL | Qué hace |
| --- | --- | --- |
| `GET` | `https://zetaprop.com.ar/api/cron/carousel-draft` | Devuelve el próximo tema sin borrador (`topic`), cuántos quedan (`remaining`) y los límites de texto (`limits`). `topic: null` = banco terminado. |
| `POST` | `https://zetaprop.com.ar/api/cron/carousel-draft` | Guarda (o reemplaza) el borrador de un tema. Responde `409` si ese tema ya se publicó y `400` con el detalle si el texto no cumple los límites. |

Los dos piden el header `x-cron-secret: <CAROUSEL_DRAFT_SECRET>`.

### Límites (los valida el endpoint)

| Campo | Límite |
| --- | --- |
| `coverTitle` | hasta 100 caracteres (ideal: menos de 70) |
| `listHeading` | hasta 50 caracteres (ideal: menos de 30) |
| `slides` | 1 o 2 slides, cada una con **exactamente 5** ítems |
| ítem `title` | hasta 45 caracteres |
| ítem `detail` | hasta 90 caracteres |
| `caption` | hasta 2200 caracteres y 30 hashtags |

## Prompt de la rutina

Copiá este texto tal cual como instrucción de la rutina. Reemplazá `<CAROUSEL_DRAFT_SECRET>` por el valor real en la configuración del entorno de la rutina, no en el texto del prompt si la herramienta permite variables o secretos.

```text
Sos el redactor de los carruseles de Instagram de ZetaProp, un software de gestión para inmobiliarias de Argentina. Una vez por semana escribís el carrusel del próximo tema y lo dejás como borrador. No publicás nada.

Paso 1 — Pedí el próximo tema:
  GET https://zetaprop.com.ar/api/cron/carousel-draft
  Header: x-cron-secret: <CAROUSEL_DRAFT_SECRET>
La respuesta trae { topic: { number, category, title }, remaining, limits }.
Si topic es null, el banco de temas terminó: no hagas nada más y reportalo.

Paso 2 — Escribí el carrusel para ese tema:
- Público: dueños de inmobiliarias y agentes inmobiliarios de Argentina. Tono de colega a colega, concreto y práctico.
- Español rioplatense con voseo ("tenés", "preguntale", "guardalo"). Nada de "tú" ni de español neutro.
- coverTitle: el título de la portada. Basate en topic.title; podés acortarlo o hacerlo más directo. Máximo 100 caracteres, idealmente menos de 70.
- listHeading: una frase corta que introduce la lista (por ejemplo "Antes de firmar, preguntale:"). Máximo 50 caracteres, idealmente menos de 30.
- slides: la lista. Si el título promete un número (por ejemplo "3 señales" o "5 preguntas"), igual tenés que entregar 5 ítems por slide: 1 slide con 5 ítems es el caso normal; usá 2 slides (10 ítems) solo si el tema realmente lo pide. Si el título dice un número menor que 5, reformulá coverTitle para que coincida con la cantidad de ítems (por ejemplo "5 señales de que..."), sin cambiar el tema.
- Cada ítem tiene title (máximo 45 caracteres, una idea accionable) y detail (máximo 90 caracteres, por qué importa o cómo hacerlo). Sin emojis, sin numeración dentro del texto (la slide ya numera), sin punto final en title.
- No inventes cifras, leyes ni porcentajes. Si mencionás algo normativo, que sea general y verdadero.
- caption: 3 a 6 líneas cortas. Arrancá con un gancho relacionado con el tema, sumá una o dos ideas que no estén en las slides, cerrá con un llamado a guardar el posteo (por ejemplo "Guardalo para tu próxima captación" o "Guardalo y compartilo con tu equipo"). Después, una línea en blanco y entre 5 y 10 hashtags en minúsculas, siempre incluyendo #inmobiliaria #agenteinmobiliario #zetaprop. No pongas links (Instagram no los hace clickeables en el caption).

Paso 3 — Revisá antes de enviar: contá los caracteres de cada campo contra los límites y confirmá que cada slide tiene exactamente 5 ítems.

Paso 4 — Guardá el borrador:
  POST https://zetaprop.com.ar/api/cron/carousel-draft
  Headers: x-cron-secret: <CAROUSEL_DRAFT_SECRET>, Content-Type: application/json
  Body: { "topicNumber": <topic.number>, "coverTitle": "...", "listHeading": "...", "slides": [[{ "title": "...", "detail": "..." }, ...5 ítems]], "caption": "..." }
Si responde 400, leé el campo error, corregí los campos que indica y reintentá una sola vez.
Si responde 409, ese tema ya estaba publicado: no reintentes.

Paso 5 — Reportá en una línea: número y título del tema, cantidad de ítems y el resultado del POST.
```

## Ejemplos con curl

Próximo tema:

```bash
curl -s https://zetaprop.com.ar/api/cron/carousel-draft \
  -H "x-cron-secret: $CAROUSEL_DRAFT_SECRET"
```

Respuesta:

```json
{
  "topic": { "number": 1, "category": "Captación y tasación", "title": "5 preguntas que tenés que hacerle a un propietario antes de tomar su propiedad" },
  "remaining": 100,
  "limits": { "coverTitle": 100, "listHeading": 50, "itemTitle": 45, "itemDetail": 90, "itemsPerSlide": 5, "maxListSlides": 2, "caption": 2200, "hashtags": 30 }
}
```

Guardar el borrador:

```bash
curl -s -X POST https://zetaprop.com.ar/api/cron/carousel-draft \
  -H "x-cron-secret: $CAROUSEL_DRAFT_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "topicNumber": 1,
    "coverTitle": "5 preguntas para hacerle a un propietario antes de tomar su propiedad",
    "listHeading": "Antes de firmar, preguntale:",
    "slides": [[
      { "title": "¿Por qué vende y para cuándo?", "detail": "La urgencia define la estrategia de precio." },
      { "title": "¿Tiene la documentación en regla?", "detail": "Escritura, planos y deudas: mejor saberlo hoy que en la reserva." },
      { "title": "¿Cuánto espera recibir y por qué?", "detail": "Así sabés si hay margen para hablar de precio." },
      { "title": "¿La publicó antes con otra inmobiliaria?", "detail": "Una propiedad quemada en portales necesita otro enfoque." },
      { "title": "¿Quién decide la venta?", "detail": "Si hay varios titulares, todos tienen que estar en la charla." }
    ]],
    "caption": "Una buena captación empieza antes de la tasación.\nEstas 5 preguntas te dicen si la propiedad se va a vender y en qué plazo.\n\nGuardalo para tu próxima captación.\n\n#inmobiliaria #agenteinmobiliario #captacion #tasacion #zetaprop"
  }'
```

Respuesta: `{ "success": true, "id": "1", "status": "draft", "replaced": false, "reviewUrl": "https://zetaprop.com.ar/dashboard/admin/redes" }`.

## Notas

- El orden de los temas alterna categorías (1, 21, 41, 61, 81, 2, 22, ...). El `GET` ya lo resuelve: el agente no elige el tema.
- Un tema con borrador ya no vuelve a salir en el `GET`. Si querés rehacer un borrador, mandá otro `POST` con el mismo `topicNumber` (se reemplaza mientras no esté publicado).
- La rutina se crea después del deploy, con el secreto ya cargado (ver `docs/social-auto-publish.md`, sección 6).
