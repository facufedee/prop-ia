# Publicación automática en redes (Make.com)

Cuando se publica una nota del blog, la app le avisa a un escenario de Make.com (webhook) con todo lo necesario para postearla en Instagram y LinkedIn.

## Cuándo se envía

- **Agente de marketing** (`POST /api/cron/publish-blog-post`): al crear la nota publicada. La respuesta incluye `social: { status }`.
- **Dashboard** (`/dashboard/blog`): al guardar una nota que pasa de borrador a publicada (o una nueva publicada). Aparece un aviso con el resultado.
- **Generador RRSS** (`/social/blog/{id}`): botón **Enviar a redes ahora** (solo con sesión de admin). Reenvía aunque ya se haya enviado.

Las notas con fecha de publicación futura no se envían (el link todavía daría 404).

## 1. Secretos en Firebase App Hosting

| Variable | Valor |
| --- | --- |
| `MAKE_SOCIAL_WEBHOOK_URL` | La URL del webhook de Make (paso 2). Sin esta variable no se envía nada. |
| `MAKE_SOCIAL_WEBHOOK_SECRET` | Un texto largo al azar (tiene que existir: `apphosting.yaml` lo pide). Se manda en el campo `secret` de los datos y en el header `x-zetaprop-secret`. |

Las dos están declaradas en `apphosting.yaml` como secretos. Cargalos con la CLI de Firebase (te pide el valor y te ofrece darle acceso al backend: respondé que sí):

```bash
firebase apphosting:secrets:set MAKE_SOCIAL_WEBHOOK_URL
firebase apphosting:secrets:set MAKE_SOCIAL_WEBHOOK_SECRET
```

Los secretos tienen que existir antes del próximo deploy: si `apphosting.yaml` referencia un secreto que no existe, el build falla. Después de cargarlos, hacé un nuevo rollout.

## 2. Escenario en Make, paso a paso

Los nombres de los módulos pueden variar un poco según la versión de Make; buscá el equivalente.

1. **Webhooks → Custom webhook**. Creá uno nuevo y copiá la URL a `MAKE_SOCIAL_WEBHOOK_URL`.
   - En "Advanced settings" activá **Get request headers** si vas a validar el secreto.
   - Para definir la estructura, usá "Redetermine data structure" y mandá el ejemplo de abajo (por ejemplo con el botón del generador una vez deployado, o con Postman/curl).
2. **Filtro (opcional)** entre el webhook y el router: campo `secret` del webhook **igual a** tu `MAKE_SOCIAL_WEBHOOK_SECRET` (Text operators: Equal to).
3. **Router** con dos rutas:
   - **Instagram for Business → Create a Photo Post**
     - Photo URL: `images.instagram`
     - Caption: `captions.instagram`
   - **LinkedIn**
     - **HTTP → Get a file** con URL `images.linkedin` (descarga la imagen).
     - **LinkedIn → Create a Company (Organization) Image Post** (o **Create a User Image Post** si publicás desde tu perfil): imagen = el archivo del paso anterior, texto = `captions.linkedin`, link = `post.url` si el módulo lo pide.

### Payload de ejemplo

```json
{
  "event": "blog.published",
  "post": {
    "id": "fyEEArgK2yLyVScJdVq2",
    "slug": "como-ajustar-alquileres-2026",
    "title": "Cómo ajustar alquileres en 2026",
    "excerpt": "El índice ICL cambió otra vez. Te contamos cómo impacta en tus contratos.",
    "category": "Mercado Inmobiliario",
    "tags": ["Alquileres", "ICL"],
    "url": "https://zetaprop.com.ar/blog/como-ajustar-alquileres-2026",
    "coverUrl": "https://storage.googleapis.com/prop-ia.firebasestorage.app/blog/como-ajustar-alquileres-2026/cover.jpg"
  },
  "images": {
    "instagram": "https://zetaprop.com.ar/api/social/blog/fyEEArgK2yLyVScJdVq2/image?format=instagram&type=jpeg",
    "instagramSquare": "https://zetaprop.com.ar/api/social/blog/fyEEArgK2yLyVScJdVq2/image?format=square&type=jpeg",
    "linkedin": "https://zetaprop.com.ar/api/social/blog/fyEEArgK2yLyVScJdVq2/image?format=linkedin&type=jpeg"
  },
  "captions": {
    "instagram": "Cómo ajustar alquileres en 2026\n\nEl índice ICL cambió otra vez. Te contamos cómo impacta en tus contratos.\n\nLeé la nota completa: link en la bio.\n\n#ZetaProp #MercadoInmobiliario #Alquileres #ICL",
    "linkedin": "Cómo ajustar alquileres en 2026\n\nEl índice ICL cambió otra vez. Te contamos cómo impacta en tus contratos.\n\nLeé la nota completa: https://zetaprop.com.ar/blog/como-ajustar-alquileres-2026\n\n#ZetaProp #MercadoInmobiliario #Alquileres"
  },
  "publishedAt": "2026-10-01T12:00:00.000Z"
}
```

Imágenes: Instagram 1080×1350 (4:5), cuadrada 1080×1080, LinkedIn 1200×627. Todas en JPEG (Instagram no acepta PNG).

## 3. Requisitos y límites

- **Instagram**: la cuenta tiene que ser Profesional (Empresa o Creador) y estar vinculada a una Página de Facebook. Make se conecta a través de esa página.
- **Las imágenes tienen que ser públicas**: Instagram y Make las descargan desde `zetaprop.com.ar`. En local (`localhost`) no funciona; probalo después del deploy.
- Si Make responde con error o tarda más de 8 segundos, la nota igual se publica; el error queda guardado en `socialAnnounceError` de la nota.

## 4. Cómo probar

1. Con las variables cargadas y deployado, entrá a `/social/blog/{id}` con tu usuario admin.
2. Tocá **Enviar a redes ahora** y confirmá.
3. Revisá en Make el historial de ejecuciones del escenario.

## 5. Cómo se evitan duplicados

Cuando Make responde OK, la nota queda marcada con `socialAnnouncedAt`. Los envíos automáticos (agente y dashboard) se saltean las notas ya marcadas. Solo el botón del generador reenvía a propósito, y antes te pide confirmación (muestra "Ya enviado el ..." si ya salió).
