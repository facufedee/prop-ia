// One-off script: publishes 2 real-estate investment blog posts requested by
// the user (2026-10-10), researched via WebSearch with sources cited inline at
// the end of each post. Cover images are free-license Pexels photos, downloaded
// at run time and re-uploaded to this project's own Firebase Storage bucket
// (not hot-linked). Skips any post whose slug already exists. Run with:
//   node --env-file=.env.local scripts/publish_blog_inversion_oct2026.js
// Credentials: FIREBASE_SERVICE_ACCOUNT_KEY if set, otherwise Application
// Default Credentials (run `gcloud auth application-default login` first),
// mirroring src/infrastructure/firebase/admin.ts.

const admin = require("firebase-admin");

if (!admin.apps.length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        : null;
    admin.initializeApp({
        ...(serviceAccount ? { credential: admin.credential.cert(serviceAccount) } : {}),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || serviceAccount?.project_id || "prop-ia",
        storageBucket: "prop-ia.firebasestorage.app",
    });
}

const db = admin.firestore();
db.settings({ databaseId: "propia" });
const bucket = admin.storage().bucket();

const AUTHOR = { name: "Facundo Zeta" };

const POSTS = [
    {
        slug: "como-calcular-rentabilidad-real-departamento-alquiler",
        title: "Cómo calcular la rentabilidad real de un departamento para alquilar",
        category: "Inversión Inmobiliaria",
        imageUrl: "https://images.pexels.com/photos/23466753/pexels-photo-23466753.jpeg?auto=compress&cs=tinysrgb&w=1600",
        excerpt: "La rentabilidad que publican los portales es bruta. Te mostramos cómo pasar de ese número a lo que realmente te queda, y en qué barrios porteños rinde más comprar para alquilar.",
        tags: ["Inversión Inmobiliaria", "Rentabilidad", "Alquileres", "CABA", "Zeta Prop"],
        content: `"Comprar para alquilar" sigue siendo una de las inversiones preferidas en Argentina. Pero el número que suele circular — la rentabilidad bruta — no es lo que el inversor termina cobrando. Antes de comprar, conviene hacer la cuenta completa.

## Dónde está hoy la rentabilidad en CABA

Según el último índice de Zonaprop (junio 2026), la rentabilidad bruta promedio de un departamento en la Ciudad de Buenos Aires es del **5,83% anual**, lo que equivale a **17,2 años de alquiler** para recuperar la inversión — un 10,3% menos que un año antes. El precio medio se ubica en torno a los US$2.460/m², mientras que el alquiler de un dos ambientes promedia $834.178 mensuales, con una suba del 34% en los últimos doce meses.

Dicho de otro modo: los alquileres vienen subiendo más rápido que los precios de venta, y eso mejora la ecuación para quien compra para alquilar.

## La diferencia entre barrios es enorme

La rentabilidad no es pareja en toda la ciudad. La zona sur lidera con un 9,9%, seguida por el oeste (6,7%) y el corredor norte (4,9%). Por barrio:

- **Más rentables**: Lugano (10,7%), Parque Avellaneda (8,1%), Nueva Pompeya (8,0%), La Boca y Parque Patricios (7,6%).
- **Intermedios**: Villa Pueyrredón (6,2%), Parque Chacabuco (6,1%), Parque Chas (6,0%), Villa del Parque y Monserrat (5,9%).
- **Menos rentables**: Puerto Madero (3,8%), Núñez y Palermo (4,7%), Belgrano (4,8%) y Colegiales (5,0%).

La lógica es simple: en los barrios premium el precio de compra es tan alto que el alquiler rinde, en proporción, menos. Eso no los vuelve malas inversiones — suelen tener menor vacancia y mejor resguardo de valor — pero sí cambia el objetivo: renta o preservación de capital.

## De la rentabilidad bruta a la neta

La rentabilidad bruta se calcula así:

**Rentabilidad bruta = (alquiler mensual × 12) ÷ precio de compra**

Para llegar a la neta hay que restar todo lo que el propietario paga y que el inquilino no cubre:

- **Vacancia**: los meses en que la unidad queda vacía entre un contrato y otro. Un mes por año ya resta más de 8% del ingreso anual.
- **Expensas extraordinarias**: obras del edificio, fondo de reserva y arreglos de partes comunes corren por cuenta del propietario.
- **Impuestos y tasas**: ABL e impuestos que no se trasladen al inquilino, más el impacto en Ganancias y Bienes Personales según tu situación.
- **Mantenimiento**: reparaciones, pintura entre contratos y desgaste normal de artefactos.
- **Administración y comisiones**: si delegás la gestión del alquiler en una inmobiliaria.

## Un ejemplo para hacer la cuenta

Supongamos un departamento comprado en US$100.000 con una rentabilidad bruta igual al promedio porteño (5,83%), es decir, unos US$5.830 al año. Si restamos un mes de vacancia (≈ US$486) y estimamos un 10% del alquiler en gastos a cargo del propietario (≈ US$583), quedan unos US$4.761: **una rentabilidad neta cercana al 4,8%**. Es un ejemplo ilustrativo — los números reales dependen de cada unidad y edificio — pero muestra que la brecha entre bruta y neta rara vez es menor a un punto.

## Dos variables que también pesan

- **El tipo de cambio**: la propiedad se compra en dólares y el alquiler se cobra en pesos. La rentabilidad medida en dólares sube o baja según cómo evolucione el tipo de cambio frente a los ajustes del contrato.
- **La revalorización**: el cálculo de años de recupero sólo considera la renta. Si la propiedad se valoriza, el retorno total es mayor; si el precio cae, es menor.

## Conclusión

Antes de comprar para alquilar, hacé la cuenta completa: elegí el barrio según tu objetivo (renta o resguardo), estimá la vacancia y los gastos reales, y compará la rentabilidad neta con otras alternativas de inversión. Un buen asesoramiento en la tasación y en la elección de la unidad es lo que más mueve ese número.

*Fuentes: [La Nación — Los barrios olvidados en los que comprar para alquilar es un buen negocio (junio 2026, datos de Zonaprop)](https://www.lanacion.com.ar/propiedades/los-barrios-olvidados-en-los-que-comprar-para-alquilar-es-un-buen-negocio-nid16062026/), [Canal 26 — Aumentan los alquileres en CABA y mejora la rentabilidad](https://www.canal26.com/economia/2026/05/07/aumentan-los-alquileres-en-caba-y-mejora-la-rentabilidad-donde-conviene-invertir/), [Forbes Argentina — Cuántos años de alquiler se necesitan para recuperar una inversión inmobiliaria](https://www.forbesargentina.com/money/cuantos-anos-alquiler-necesitan-recuperar-una-inversion-inmobiliaria-n33953), [Zonaprop — Index CABA](https://www.zonaprop.com.ar/blog/zpindex/). Los valores son referenciales a la fecha de los informes citados y pueden variar.*`,
    },
    {
        slug: "comprar-departamento-en-pozo-ventajas-riesgos",
        title: "Comprar en pozo en 2026: ventajas, riesgos y qué revisar antes de firmar",
        category: "Inversión Inmobiliaria",
        imageUrl: "https://images.pexels.com/photos/18078304/pexels-photo-18078304.jpeg?auto=compress&cs=tinysrgb&w=1600",
        excerpt: "Comprar en pozo puede salir más barato y pagarse en cuotas, pero el descuento existe porque hay riesgo. Te contamos cómo funciona y qué chequear antes de firmar.",
        tags: ["Inversión Inmobiliaria", "Pozo", "Fideicomiso", "Desarrollos", "Zeta Prop"],
        content: `Comprar un departamento en pozo es una de las formas más clásicas de invertir en ladrillos en Argentina: entrás con un anticipo, pagás en cuotas mientras se construye y recibís una unidad nueva. Pero ese descuento frente a lo terminado no es un regalo — es el precio del riesgo que asumís. Entenderlo es la clave para que el negocio salga bien.

## Cómo funciona

Comprar en pozo significa adquirir una unidad de un edificio que todavía no existe o está en una etapa temprana de obra. El esquema de pago más habitual combina:

- **Un anticipo** al firmar, que según el desarrollo suele ir del 20% al 30% del precio.
- **Cuotas durante la obra**, generalmente actualizadas por el índice CAC (Costo de la Construcción).
- **Un saldo** al momento de la entrega o la escritura, según el contrato.

Los plazos de entrega típicos van de 18 a 36 meses.

## Las ventajas

- **Precio de entrada menor**: comprar en pozo suele salir entre un 15% y un 25% menos que una unidad terminada equivalente en la misma zona, y el descuento es mayor cuanto más temprana es la etapa de obra.
- **Financiación escalonada**: permite invertir sin tener el capital completo desde el día uno, algo valioso en un mercado con poco crédito para construcción.
- **Unidad nueva**: amenities actuales, mejor eficiencia y, en algunos proyectos, la posibilidad de elegir terminaciones.

## Los riesgos

- **Demoras e incumplimientos**: la principal incertidumbre es si la obra se termina en el plazo prometido — o si se termina.
- **Ajuste por CAC**: si el costo de construcción sube más rápido de lo previsto, el precio final puede superar con holgura el de lista y achicar el descuento efectivo.
- **Sin crédito hipotecario durante la obra**: los bancos generalmente no financian unidades en pozo porque todavía no existe el inmueble a hipotecar. La financiación suele depender del propio desarrollador o de tus ahorros.
- **El descuento no está garantizado**: en algunos barrios porteños, el valor del pozo llegó a igualar o superar al de las unidades a estrenar. Siempre compará contra lo terminado en la misma zona.

## Qué revisar antes de firmar

1. **Qué documento firmás**: no es lo mismo un boleto de compraventa, una adhesión a un fideicomiso o una cesión de derechos. Cada uno define tus derechos, cómo reclamar y cómo salir.
2. **La estructura del proyecto**: un fideicomiso al costo, con patrimonio separado y cuenta propia, protege mejor los fondos de los compradores ante una eventual insolvencia del desarrollador.
3. **El historial del desarrollador**: obras entregadas, en qué plazos y con qué calidad. Visitá alguna si podés.
4. **Las cláusulas de ajuste**: desde cuándo corre el CAC, con qué frecuencia se aplica y qué pasa si el índice deja de publicarse o cambia su metodología.
5. **Plazos y penalidades**: fecha estimada de entrega, causales concretas de prórroga y qué pasa si el desarrollador se atrasa. Un contrato que sólo penaliza al comprador es una señal de alerta.
6. **Permisos y dominio**: pedí el número de expediente del permiso de obra y un informe de dominio del terreno (hipotecas, embargos, inhibiciones).
7. **Salida anticipada**: si podés ceder tu boleto antes de la entrega, cuánto cuesta y si el desarrollador puede bloquearlo.
8. **Costos adicionales**: escribanía, sellos, honorarios y gastos de conexión de servicios, todo por escrito.

Y una regla simple: si te presionan para firmar en el día, sin tiempo para leer el contrato, o las respuestas son vagas, frená.

## Conclusión

El pozo puede ser una gran puerta de entrada para invertir, sobre todo si buscás pagar en cuotas y comprar por debajo del valor de lo terminado. Pero el descuento sólo se materializa si el proyecto llega a buen puerto. Revisar el contrato con un abogado y elegir bien al desarrollador vale tanto como el precio por m².

*Fuentes: [Derecho en Zapatillas — 20 cosas a mirar antes de firmar una compraventa de inmueble de pozo (2026)](https://www.derechoenzapatillas.com/2026/20-cosas-a-mirar-antes-de-firmar-una-compraventa-de-inmueble-de-pozo/), [Roomix — Propiedades en pozo en Argentina 2026](https://roomix.ai/blog/propiedades-en-pozo-argentina-2026), [Roomix — Departamentos en pozo: guía completa](https://www.roomix.ai/blog/departamentos-en-pozo-guia-compra), [iProfesional — Los departamentos en pozo son casi 30% más caros que uno usado](https://www.iprofesional.com/realestate/414346-los-departamentos-en-pozo-son-casi-30-mas-caros-que-uno-usado). Esta nota es informativa y no reemplaza el asesoramiento legal profesional.*`,
    },
];

async function uploadImage(slug, imageUrl) {
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error(`Image fetch failed (${res.status}) for ${imageUrl}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    const destination = `blog/${slug}/cover.jpg`;
    await bucket.file(destination).save(buffer, {
        metadata: { contentType: "image/jpeg" },
        public: true,
    });
    return `https://storage.googleapis.com/${bucket.name}/${destination}`;
}

async function main() {
    for (const post of POSTS) {
        const existing = await db.collection("blog_posts").where("slug", "==", post.slug).limit(1).get();
        if (!existing.empty) {
            console.log(`- "${post.slug}" ya existe, se omite.`);
            continue;
        }

        const now = admin.firestore.Timestamp.now();
        console.log(`Subiendo imagen para "${post.title}"...`);
        const imageUrl = await uploadImage(post.slug, post.imageUrl);

        const docRef = await db.collection("blog_posts").add({
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            content: post.content,
            imageUrl,
            category: post.category,
            author: AUTHOR,
            tags: post.tags,
            published: true,
            publishedAt: now,
            createdAt: now,
            updatedAt: now,
        });

        console.log(`✓ "${post.title}" publicado con id: ${docRef.id}`);
        console.log(`  URL: https://zetaprop.com.ar/blog/${post.slug}`);
    }
    process.exit(0);
}

main().catch((err) => {
    console.error("Error publicando los posts:", err);
    process.exit(1);
});
