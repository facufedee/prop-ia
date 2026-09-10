// One-off script: publishes the "Créditos hipotecarios en Argentina — septiembre 2026"
// blog post directly via the Admin SDK (bypasses Firestore client rules, same pattern
// as scripts/list_users.ts). Run with:
//   node --env-file=.env.local scripts/publish_blog_creditos_hipotecarios.js

const admin = require("firebase-admin");

if (!admin.apps.length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        : {};
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || serviceAccount.project_id,
    });
}

const db = admin.firestore();
db.settings({ databaseId: "propia" });

const title = "Créditos hipotecarios en Argentina: bajaron las tasas y así funciona el nuevo fondeo de ANSES (2026)";
const slug = "creditos-hipotecarios-argentina-2026-bajaron-tasas-fondeo-anses";

const excerpt = "Varios bancos bajaron sus tasas UVA a mínimos de los últimos años y el Gobierno lanzó un programa de fondeo con fondos de ANSES por $2 billones. Te contamos qué cambió, cuánto hay que ganar y qué significa para tu inmobiliaria.";

const content = `Después de meses de tasas por las nubes, el crédito hipotecario en Argentina volvió a moverse. En septiembre de 2026 varios bancos bajaron fuerte sus tasas UVA y el Gobierno lanzó un programa de fondeo con fondos de ANSES pensado específicamente para financiar primera vivienda. Te contamos qué cambió, qué bancos ofrecen las mejores condiciones y qué implica todo esto si trabajás en una inmobiliaria.

## Qué cambió: las tasas bajaron fuerte

Hasta hace pocos meses, conseguir un crédito hipotecario UVA en Argentina significaba pagar tasas de entre 12% y casi 19% en algunos bancos. Hoy el panorama es otro. Según relevamientos de distintos medios económicos de esta semana, las tasas más competitivas para clientes preferenciales (cuenta sueldo, primera vivienda) rondan así:

- **Banco Nación** — 6,7% + UVA, hasta 30 años, primera vivienda
- **ICBC** — 6,9% + UVA con sueldo acreditado (9,9% para cartera general), hasta 20 años
- **Banco Hipotecario** — 7,5% + UVA para primera vivienda, hasta 15 años
- **Banco Macro** — 7,5% + UVA con Plan Sueldo, hasta 20 años
- **BBVA** — 7,5% + UVA para clientes preferenciales, hasta 30 años
- **Banco Ciudad** — 7,5% + UVA para primera vivienda en CABA, hasta 25 años
- **Credicoop** — 7,5% + UVA con sueldo en la entidad
- **Santander y Galicia** — alrededor de 9,5% + UVA
- Otras entidades, en cartera general sin bonificaciones, siguen ofreciendo tasas más altas, cercanas al 12,5%

Importante: estas tasas cambian seguido y varían según si tenés cuenta sueldo, si es primera vivienda, el plazo elegido y la política comercial de cada banco en el momento en que consultás. Los números de arriba son una foto de este mes, no una garantía — antes de avanzar con un cliente, conviene confirmar la tasa vigente directamente en la sucursal o con el oficial de cuenta.

## El nuevo fondeo con fondos de ANSES (FGS)

La baja de tasas no es casualidad: el Gobierno puso en marcha un mecanismo para que el Fondo de Garantía de Sustentabilidad (FGS) de ANSES fondee líneas hipotecarias a través de los bancos.

Así funciona, en criollo:

- ANSES coloca depósitos ajustados por UVA en los bancos: a 1 año (rinden UVA + 2,5%) y a 5 años (UVA + 4,5%).
- Ese dinero, los bancos lo tienen que convertir en créditos hipotecarios para primera vivienda: comprar, construir, ampliar o refaccionar.
- La primera licitación fue por $200.000 millones, y el programa completo contempla diez licitaciones hasta llegar a $2 billones.
- Como condición para recibir este fondeo, los bancos participantes no pueden cobrarle al tomador más de UVA + 7,5%, con un plazo mínimo de 15 años.

**Un mito que conviene aclarar con tus clientes:** no existe una inscripción general en "Mi ANSES" ni un formulario centralizado para pedir estos créditos. ANSES no evalúa ingresos ni aprueba solicitudes — solo fondea a los bancos. Quien quiera acceder tiene que ir directamente al banco, que es el que define requisitos, ingresos mínimos, documentación y trámite.

## Cuánto impacta la tasa en la cuota

La diferencia entre una tasa y otra no es un detalle menor. Para un crédito de 100.000 UVAs a 20 años, bajar la tasa de 8,5% a 7,5% reduce la cuota inicial en aproximadamente un 7%. En un crédito a 15 años (el plazo típico de Banco Hipotecario), pasar de 9,5% a 7,5% representa más de 100 UVAs menos por mes desde el arranque.

Un punto clave para explicarle a cualquier comprador: la tasa define el costo financiero del préstamo, pero la cuota en pesos se sigue actualizando todos los meses según la UVA. Que la tasa sea fija no significa que la cuota en pesos quede congelada.

## Requisitos generales para acceder

Más allá de las condiciones puntuales de cada banco, hay un piso común que se repite en casi todas las líneas:

- Edad: entre 18 y 65 años al momento de solicitar el crédito.
- Antigüedad laboral: al menos 1 año en relación de dependencia, o 2 a 3 años de actividad demostrable para autónomos y monotributistas.
- La cuota no puede superar el 25-30% del ingreso neto del solicitante o del grupo familiar.
- Ahorro previo: los bancos financian entre el 70% y el 80% del valor de la propiedad, así que hay que tener ahorrado el resto.
- Buen historial crediticio, sin situación irregular en el BCRA.

## Cuánto hay que ganar, banco por banco

Los ingresos mínimos que pide cada entidad también varían bastante. Como referencia (siempre sujeta a cambios y al monto/plazo solicitado):

- **Banco Del Sol** — desde $1.000.000
- **ICBC** — desde $1.100.000
- **BBVA** — equivalente a 4 salarios mínimos, vitales y móviles (aprox. $1.290.000)
- **Santander** — entre $1.540.000 y $1.700.000, según sea vivienda permanente o no
- **Banco Credicoop** — desde $3.000.000
- **Supervielle** — más de $5.000.000

Para una propiedad de USD 100.000, en general se estima un ingreso familiar necesario a partir de los $3.200.000, dependiendo de la tasa y el plazo que se consiga.

## Qué significa esto para las inmobiliarias

Cada vez que el crédito hipotecario se mueve, se mueve también la demanda. Bancos con mejores tasas y un programa de fondeo de $2 billones en danza son una señal que vale la pena transmitirle a tus clientes: hay más gente evaluando comprar, y las consultas por financiación van a crecer.

Para una inmobiliaria, esto se traduce en más operaciones potenciales, pero también en más trabajo administrativo: coordinar tasaciones, hacer seguimiento de consultas, ordenar la documentación de cada propietario y comprador.

👉 Con Zeta Prop podés:

- administrar tu cartera de propiedades y su estado (activa, reservada, vendida)
- gestionar leads y consultas sin perder ningún contacto
- generar tasaciones con inteligencia artificial
- publicar tus propiedades en tu propio sitio web y compartirlas con un link

🔗 Conocé la plataforma: https://zetaprop.com.ar

## En resumen

El crédito hipotecario en Argentina sigue exigiendo ingresos altos y ahorro previo, pero las condiciones mejoraron notablemente respecto a comienzos de año. Con tasas más bajas y un programa oficial de fondeo en marcha, vale la pena que tanto compradores como inmobiliarias vuelvan a poner el financiamiento sobre la mesa — siempre confirmando las condiciones vigentes directamente con cada banco, porque en este mercado las tasas cambian rápido.

*Fuentes: relevamientos de Ámbito Financiero, Mirador Provincial, El Cronista y La Nación sobre créditos hipotecarios UVA, septiembre 2026. Los valores de tasas e ingresos mínimos son referenciales y pueden variar; consultá siempre las condiciones actualizadas con cada entidad.*`;

async function main() {
    const now = admin.firestore.Timestamp.now();
    const docRef = await db.collection("blog_posts").add({
        title,
        slug,
        excerpt,
        content,
        imageUrl: "",
        category: "Mercado Inmobiliario",
        author: { name: "Facundo Zeta" },
        tags: ["Créditos Hipotecarios", "UVA", "ANSES", "Mercado Inmobiliario", "Zeta Prop"],
        published: true,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
    });
    console.log(`✓ Post publicado con id: ${docRef.id}`);
    console.log(`✓ URL: https://zetaprop.com.ar/blog/${slug}`);
    process.exit(0);
}

main().catch((err) => {
    console.error("Error publicando el post:", err);
    process.exit(1);
});
