// One-off script: publishes 7 blog posts requested by the user (2026-09-12),
// each researched via WebSearch with sources cited inline at the end of the
// post. Cover images are free-license Pexels photos, downloaded locally and
// re-uploaded to this project's own Firebase Storage bucket (not hot-linked)
// so they don't depend on an external host staying up. Run with:
//   node --env-file=.env.local scripts/publish_blog_batch_sept2026.js

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

if (!admin.apps.length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        : {};
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || serviceAccount.project_id,
        storageBucket: "prop-ia.firebasestorage.app",
    });
}

const db = admin.firestore();
db.settings({ databaseId: "propia" });
const bucket = admin.storage().bucket();

const IMAGES_DIR = "C:\\Users\\VWAROHL\\AppData\\Local\\Temp\\zetaprop-blog-images";

const AUTHOR = { name: "Facundo Zeta" };

const POSTS = [
    {
        slug: "como-profesionalizar-tu-inmobiliaria",
        title: "Cómo profesionalizar tu inmobiliaria en 2026",
        category: "Gestión Inmobiliaria",
        image: "profesionalizar.jpg",
        excerpt: "La diferencia entre una inmobiliaria que sobrevive y una que crece está en los procesos, la presencia digital y la formación continua. Te contamos por dónde empezar.",
        tags: ["Profesionalización", "Gestión Inmobiliaria", "Zeta Prop"],
        content: `Profesionalizar una inmobiliaria no es un lujo para agencias grandes — es lo que separa a un corredor que sobrevive de uno que prospera, sin importar el tamaño del equipo. Estos son los ejes que marcan la diferencia hoy.

## Marco legal en regla

Para ejercer como corredor inmobiliario en Argentina hace falta la matrícula correspondiente, que se tramita en el Colegio Profesional de cada provincia (en CABA, el CUCICBA). Operar matriculado no es sólo un requisito legal: es lo que te habilita a firmar tasaciones con validez profesional y lo que un cliente exigente va a chequear antes de confiarte una operación.

## Presencia digital, no opcional

Más del 90% de las búsquedas inmobiliarias empiezan hoy en internet. Una inmobiliaria sin presencia digital — sitio propio, redes con inventario actualizado, testimonios reales — es prácticamente invisible para la mayoría del mercado potencial. No hace falta un gran presupuesto: hace falta constancia y fotos bien sacadas (nunca subas fotos de propiedades tomadas apuradas con el celular, sin encuadre ni luz).

## Formación que combine lo tradicional con lo digital

La profesionalización ya no es sólo saber tasar y negociar. Combina conocimientos comerciales y legales de siempre con habilidades nuevas: marketing digital, generación de contenido, uso de redes sociales y, cada vez más, herramientas con inteligencia artificial para agilizar tasaciones y descripciones de propiedades.

## Procesos y herramientas, no intuición

Usar un CRM para gestionar contactos, seguimientos y el estado de cada propiedad es lo que evita que un lead se pierda por no llamarlo a tiempo, o que una propiedad quede "dormida" sin seguimiento. La intuición y la memoria no escalan; un proceso sí.

## Especialización por zona o segmento

Una inmobiliaria que vende campos en el interior no necesariamente es la mejor opción para alquilar un departamento en Recoleta. Definir un nicho — una zona, un tipo de operación, un segmento de precio — te permite conocerlo a fondo y volverte la referencia ahí, en vez de competir genéricamente con todo el mercado.

Profesionalizarse es un proceso, no un evento único. Pero cada uno de estos ejes que se ordena es una ventaja competitiva concreta frente a inmobiliarias que siguen operando como hace veinte años.

*Fuentes: [Cuatro Medios — Cómo empezar como agente inmobiliario en Argentina](https://www.cuatromedios.com.ar/articulo/mas-noticias/como-empezar-cero-como-agente-inmobiliario-argentina/20250814114551024767.html), [Roomix — Cómo elegir inmobiliaria 2026](https://roomix.ai/blog/elegir-inmobiliaria-consejos), [MisInmuebles — Cómo empezar una inmobiliaria desde cero en Argentina](https://misinmuebles.com.ar/como-empezar-inmobiliaria-desde-cero-argentina/), [Monclair — Consejos para agentes inmobiliarios que trabajan a comisión](https://www.monclair.com.ar/blog/consejos-agentes-comision).*`,
    },
    {
        slug: "como-captar-mas-clientes-inmobiliaria",
        title: "Cómo captar más clientes para tu inmobiliaria",
        category: "Marketing Inmobiliario",
        image: "captar-clientes.jpg",
        excerpt: "Ni un solo canal alcanza por sí solo. Repasamos las estrategias que hoy generan leads reales para una inmobiliaria: de las redes sociales al SEO.",
        tags: ["Marketing Inmobiliario", "Captación de Clientes", "Zeta Prop"],
        content: `Captar clientes hoy no depende de un solo canal milagroso, sino de armar un ecosistema digital donde cada pieza refuerza a las demás. Estas son las estrategias que más resultado dan según el marketing inmobiliario actual.

## Presencia digital integral

SEO local, redes sociales, email marketing y un CRM propio no compiten entre sí — se potencian. Un lead que te encuentra por Instagram y después recibe un mail de seguimiento tiene muchas más chances de convertir que uno que sólo vio un posteo suelto.

## Redes sociales, con contenido de video

Instagram, Facebook y TikTok se volvieron los canales principales para captar compradores e inversores, combinando publicaciones orgánicas con campañas segmentadas de pago. El formato que más está funcionando es el video: los agentes que lo incorporan a su estrategia aumentan sus ingresos un 49% más rápido que quienes no lo usan.

## Email marketing

Sigue siendo uno de los pilares del marketing digital inmobiliario — no por moda, sino porque un lead que dejó su mail ya mostró interés real, y un seguimiento bien espaciado (sin saturar) lo mantiene caliente hasta que esté listo para decidir.

## Marketing de contenidos

Publicar artículos, guías del mercado y tips de compra/alquiler te posiciona como referente antes de que el cliente te contacte. Es, además, la base del SEO: contenido útil y actualizado es lo que Google prioriza para posicionar tu sitio en búsquedas locales.

## Reseñas y prueba social

Las buenas valoraciones en Google y en los portales inmobiliarios son uno de los empujones más fuertes para que un nuevo cliente elija contactarte a vos y no a la competencia. Armar el hábito de pedirle una reseña a cada cliente satisfecho, aunque parezca menor, compone con el tiempo.

## SEO: la estrategia que no se paga por click

A diferencia de la pauta paga, el SEO da resultados que se sostienen en el tiempo sin costo por click. Requiere paciencia, pero un sitio bien armado sigue trayendo consultas meses después de publicado un contenido.

Ninguna de estas estrategias reemplaza a las demás — funcionan mejor como parte de un plan integral, no como tácticas sueltas.

*Fuentes: [Clientify — Marketing inmobiliario: guía completa](https://clientify.com/blog/marketing/marketing-inmobiliario-guia), [Benchmark Email — 7 ideas para conseguir clientes potenciales](https://www.benchmarkemail.com/es/blog/conseguir-clientes-inmobiliaria/), [Vendomia — Estrategias efectivas para captar clientes](https://vendomia.com/blog/captacion-inmobiliaria-para-conseguir-clientes/), [Clau — 6 estrategias para captar clientes para una inmobiliaria](https://www.clau.com/elliving/captar-clientes-inmobiliaria).*`,
    },
    {
        slug: "como-tasar-una-propiedad",
        title: "Cómo tasar una propiedad: los métodos que usan los profesionales",
        category: "Tasaciones",
        image: "tasar-propiedad.jpg",
        excerpt: "Tasar bien no es \"tirar un número\" — es aplicar un método. Repasamos los tres métodos de valuación más usados en Argentina y qué factores mueven el precio.",
        tags: ["Tasaciones", "Valuación de Propiedades", "Zeta Prop"],
        content: `Una tasación mal hecha cuesta caro: si el precio queda por encima del mercado, la propiedad se estanca; si queda por debajo, el propietario pierde dinero. Estos son los métodos que efectivamente usan los profesionales matriculados en Argentina.

## Método comparativo de mercado

Es el más usado para viviendas. Consiste en juntar entre 5 y 10 propiedades similares del mismo barrio y tipología que se hayan vendido recientemente, descartar el valor más alto y el más bajo, y promediar el precio por m² del resto. El análisis toma en cuenta ubicación, tamaño, ambientes, estado y amenities de cada comparable.

## Método de capitalización de ingresos

Se usa principalmente para evaluar inversión: locales comerciales, oficinas o unidades pensadas para alquiler. Calcula el valor dividiendo el ingreso operativo neto (NOI) anual de la propiedad por una tasa de capitalización de mercado — permite comparar el rendimiento de distintas inversiones más allá del precio de venta.

## Método del costo de reproducción

Estima el valor de un inmueble a partir de lo que costaría hoy construir una propiedad similar desde cero, descontando la depreciación por antigüedad y estado. Es más habitual en propiedades atípicas, donde no hay suficientes comparables directos para el método comparativo.

## Qué factores mueven el precio, más allá del método

- **Ubicación y entorno**: accesibilidad, servicios cercanos y calidad de las construcciones vecinas explican gran parte del valor.
- **Superficie y ambientes**: metros cuadrados cubiertos, cantidad de ambientes y baños.
- **Estado y antigüedad**: una unidad a reciclar no tasa igual que una a estrenar, aunque compartan m².
- **Amenities**: pileta, SUM, cochera o seguridad suman valor, sobre todo en edificios de pozo o semi-nuevos.

## Quién puede tasar

En Argentina, las tasaciones con validez profesional deben hacerlas corredores inmobiliarios o martilleros públicos matriculados. Una estimación online puede orientar, pero no reemplaza la mirada de alguien que conoce el barrio y compara operaciones reales, no sólo publicaciones.

*Fuentes: [Zonaprop — Cómo calcular el valor de una propiedad](https://www.zonaprop.com.ar/blog/calcular-valor-propiedad/), [Zonaprop — Aprendé cómo tasar una propiedad](https://www.zonaprop.com.ar/blog/como-tasar-una-propiedad/), [Mercado Libre — Tasaciones: cómo se calcula el valor de un inmueble](https://www.mercadolibre.com.ar/blog/re-guia-tasaciones-como-se-calcula-el-valor-de-un-inmueble), [RE/MAX Urbana — Cómo se realiza la tasación de un inmueble](https://www.remax-urbana.com.ar/2019/04/03/como-se-realiza-la-tasacion-de-un-inmueble/).*`,
    },
    {
        slug: "noticias-mercado-inmobiliario-septiembre-2026",
        title: "Mercado inmobiliario en Argentina: las noticias de septiembre 2026",
        category: "Mercado Inmobiliario",
        image: "mercado-noticias.jpg",
        excerpt: "Precios de venta que se estabilizan, escrituras en alza y alquileres que crecen por debajo de la inflación. Un repaso de los últimos datos del mercado porteño.",
        tags: ["Mercado Inmobiliario", "Noticias", "CABA", "Zeta Prop"],
        content: `El mercado inmobiliario porteño viene mostrando señales de acomodamiento después de un largo período de inestabilidad. Repasamos los datos más recientes.

## Precios de venta: recuperación lenta pero sostenida

El precio medio de publicación de los departamentos en CABA subió 0,1% en agosto y se ubica en torno a los US$2.476/m². En lo que va del año acumula un incremento del 1,1%, aunque todavía se mantiene 11,5% por debajo del máximo histórico de la serie. Los departamentos más chicos son los que muestran el mayor incremento de precio en el año — una señal de demanda concentrada en unidades de menor ticket.

## Escrituras: julio fue el mejor mes del año

Según el Colegio de Escribanos de la Ciudad de Buenos Aires, julio de 2026 fue el mejor mes del año en cantidad de ventas, con 6.051 escrituras — el mejor julio en varios años. Sin embargo, en el acumulado de los primeros siete meses del año se registraron 35.528 escrituras de compraventa, un 1,8% menos que en el mismo período de 2025, y el crédito hipotecario profundizó su retroceso en el mismo lapso.

## Alquileres: suben, pero menos que la inflación

En agosto, los alquileres en CABA subieron 1,5%, por debajo de la inflación estimada para el mes. En lo que va de 2026 acumulan un alza del 19,2% — también por debajo del 21,5% de suba de precios general, lo que implica una caída real del 2,3% en el poder adquisitivo necesario para alquilar. En los últimos doce meses, en cambio, el precio promedio subió 29,9% interanual.

En valores concretos: un monoambiente promedia $771.871 mensuales, un dos ambientes $886.527 y un tres ambientes $1.196.413.

## Dónde conviene invertir para alquilar

En términos de rentabilidad, Lugano lidera con un 9,8% de retorno anual, seguido por Nueva Pompeya y Parque Patricios, ambos con 7,3%. En el otro extremo, Puerto Madero tiene la rentabilidad más baja del mercado (3,2%), seguido por Palermo (4,5%) y Núñez (4,6%) — barrios donde el precio de compra es tan alto que el alquiler rinde proporcionalmente menos.

## Qué significa esto para una inmobiliaria

El mercado no muestra un crecimiento explosivo, pero sí una normalización: menos especulación, precios más realistas y una demanda que empieza a moverse de nuevo. Para una inmobiliaria, es el momento de tener el inventario bien tasado (ver nuestra guía de tasación) y de comunicarles a los propietarios que fijar un precio de mercado real — ni por debajo ni muy por encima — es lo que hoy acorta los tiempos de venta.

*Fuentes: [Cámara Inmobiliaria Argentina — Escrituras en CABA: compraventas y crédito hipotecario](https://cia.org.ar/escrituras-en-caba-las-compraventas-cayeron-9-en-julio-y-el-credito-hipotecario-profundizo-su-retroceso/), [Colegio de Escribanos de la Ciudad de Buenos Aires — Estadísticas de escrituras](https://www.colegio-escribanos.org.ar/category/estadisticas-de-escrituras/), [Infobae — Los alquileres en CABA subieron menos que la inflación](https://www.infobae.com/economia/2026/09/07/los-alquileres-en-caba-subieron-menos-que-la-inflacion-en-el-ano-cuanto-cuesta-un-dos-ambientes-segun-el-barrio/), [Zonaprop — Index CABA Alquiler](https://www.zonaprop.com.ar/blog/zpindex/caba-alquiler/), [UdeSA — El mercado inmobiliario comenzó 2026 con movimientos de precios](https://udesa.edu.ar/noticias/el-mercado-inmobiliario-comenzo-2026-con-movimientos-de-precios). Los valores son referenciales a la fecha de esta nota y pueden variar.*`,
    },
    {
        slug: "guia-cliente-dificil-inmobiliaria",
        title: "¿Tenés un cliente complicado? Guía para manejarlo sin perderlo",
        category: "Atención al Cliente",
        image: "cliente-dificil.jpg",
        excerpt: "El cliente quejoso, el silencioso, el que nunca está conforme. Una guía práctica para sostener la relación comercial sin perder profesionalismo en el intento.",
        tags: ["Atención al Cliente", "Ventas", "Zeta Prop"],
        content: `Todo agente inmobiliario se cruza, tarde o temprano, con un cliente difícil. No es una excepción a evitar — es parte del oficio, y cómo lo manejás define buena parte de tu reputación.

## Primero, identificar qué tipo de "difícil" es

No todos los clientes complicados lo son de la misma manera. El **cliente quejoso** no va a estar conforme con el precio, las condiciones de pago ni los tiempos administrativos, aunque generalmente termina aceptando el trato — su queja no siempre significa que no vaya a cerrar. El **cliente silencioso**, en cambio, es tímido o introvertido, y el desafío ahí es distinto: conocer sus necesidades reales cuesta más, y necesita sentirse cómodo antes de confiar en vos.

## Preparate con conocimiento, no con improvisación

La mejor defensa frente a un cliente exigente es el conocimiento integral: del inmueble, del mercado, y también de cuestiones legislativas y fiscales. Un agente que responde con seguridad genera confianza incluso en la negociación más tensa.

## No lo tomes personal

Si tu cliente sube el tono de voz, la peor respuesta es igualar ese tono. Tratar con respeto y amabilidad, incluso cuando el otro no lo hace, es lo que generalmente hace que la otra persona modere su propia actitud.

## Anticipá las objeciones

Antes de una reunión importante, pensá de antemano cuáles son las quejas más probables de ese cliente puntual y tené una respuesta preparada para cada una. Llegar con la objeción ya resuelta cambia por completo el tono de la conversación.

## Sostené la comunicación activa

Llegar a horario, escuchar sin interrumpir y comunicarte con regularidad — aunque no haya novedades — son detalles que un cliente exigente nota, y que reducen la ansiedad que suele estar detrás de una actitud difícil.

## Usá la fórmula CVBR

Características, Ventajas, Beneficios y Reflexión es una estructura simple para presentar una propiedad: en vez de listar características frías, mostralas como ventajas concretas y dejale al cliente un espacio para reflexionar antes de objetar.

Los clientes difíciles exigen más tiempo y más paciencia, pero también son los que más experiencia te dejan. Con el tiempo, se vuelven la prueba de que sabés sostener una negociación cuando no es fácil.

*Fuentes: [Blog de Wasi — Cliente difícil: aprendé a negociar con todos](https://blog.wasi.co/cliente-dificil-en-inmobiliarias/), [Blog de Wasi — Manejo de clientes difíciles en la inmobiliaria](https://blog.wasi.co/manejo-de-clientes/), [e-ichi — 5 tipos de clientes inmobiliarios difíciles](https://www.blog.e-ichi.com.mx/5-clientes-inmobiliarios-dificiles-como-tratar-con-ellos), [Pixel Inmobiliario — Cómo manejar clientes exigentes y difíciles](https://www.pixelinmobiliario.com/blog/como-manejar-a-clientes-exigentes-y-dificiles.html).*`,
    },
    {
        slug: "por-que-pedir-exclusividad-vender-propiedad",
        title: "Por qué pedir exclusividad a la hora de vender una propiedad",
        category: "Gestión Comercial",
        image: "exclusividad.jpg",
        excerpt: "Muchos propietarios creen que publicar con varias inmobiliarias a la vez acelera la venta. La evidencia muestra lo contrario. Te contamos por qué conviene la exclusividad.",
        tags: ["Exclusividad", "Gestión Comercial", "Zeta Prop"],
        content: `Es una de las conversaciones más comunes — y más incómodas — con un propietario: explicarle por qué conviene firmar en exclusiva en vez de "probar suerte" con varias inmobiliarias en simultáneo. Estos son los argumentos que respaldan esa recomendación.

## Cuando todos venden, nadie se compromete del todo

Cuando una propiedad se ofrece a través de muchas inmobiliarias al mismo tiempo, cada agente invierte menos tiempo y esfuerzo en ella — es una lógica simple: ninguna inmobiliaria está dispuesta a invertir tiempo y dinero real en una propiedad que otra agencia puede terminar vendiendo primero. El resultado es que la propiedad no se promociona de la manera más efectiva en ningún lado.

## La exclusividad habilita inversión real en promoción

Con la seguridad de que su trabajo no va a ser "robado" por otra agencia, la inmobiliaria puede invertir en fotos profesionales, pauta paga, video y estrategias de promoción personalizadas para esa propiedad puntual. Las propiedades con exclusividad, en los hechos, reciben mayor inversión en publicidad que las que no la tienen.

## Estrategia a medida, no un aviso genérico

La exclusividad permite armar una estrategia de venta adaptada a las características específicas de esa propiedad — no la misma publicación estándar replicada en diez portales sin ningún criterio distinto.

## Asesoramiento de punta a punta

El propietario que firma en exclusiva recibe acompañamiento completo: ayuda para fijar un precio justo según el mercado real (no una ilusión de precio), guía para preparar el inmueble antes de mostrarlo, y gestión profesional de las negociaciones hasta el cierre.

## Menos tiempo en el mercado

Una de las consecuencias más medibles de la exclusividad es la reducción del tiempo de venta: al concentrar el esfuerzo comercial en un solo canal bien trabajado, en vez de diluirlo entre varias agencias que compiten por la misma propiedad, la venta suele cerrarse más rápido.

## También es justo para la inmobiliaria

La exclusividad garantiza que el tiempo y los recursos que la agencia invierte en promocionar una propiedad tengan una compensación real si la venta se concreta — algo que no ocurre cuando varias agencias compiten por la misma unidad y sólo una cobra al final.

Explicarle esto a un propietario no es "venderle" un beneficio para la inmobiliaria — es mostrarle, con argumentos concretos, por qué la exclusividad suele traducirse en una venta más rápida y mejor gestionada para él también.

*Fuentes: [Nicolás de Módena — Exclusividad inmobiliaria: la forma más efectiva de vender](https://www.nicolasdemodena.com/blog/exclusividad-inmobiliaria-por-que-es-la-forma-mas-efectiva-para-vender-tu-propiedad/), [RE/MAX Data Work — ¿Conviene firmar un contrato de exclusividad inmobiliaria?](https://remaxdatawork.com.ar/contrato-de-exclusividad-inmobiliaria/), [MeCuadra — Los beneficios de la exclusividad al vender tu propiedad](https://mecuadra.com/blog/los-beneficios-de-la-exclusividad-al-vender-tu-propiedad), [Inmogesco — Contrato de exclusividad inmobiliaria](https://inmogesco.com/blog/contrato-exclusividad-inmobiliaria/).*`,
    },
    {
        slug: "pilares-servicio-cliente-inmobiliaria",
        title: "Los pilares que toda inmobiliaria debe brindarle a sus clientes",
        category: "Atención al Cliente",
        image: "pilares-atencion.jpg",
        excerpt: "La atención al cliente no es un detalle secundario del negocio inmobiliario: es lo que define si un cliente vuelve o te recomienda. Estos son sus pilares.",
        tags: ["Atención al Cliente", "Gestión Inmobiliaria", "Zeta Prop"],
        content: `En una operación donde el cliente está poniendo en juego, muchas veces, sus ahorros de toda la vida, la atención que recibe pesa tanto como el resultado de la operación en sí. Estos son los pilares que sostienen un buen servicio inmobiliario.

## Escucha activa y empatía

Escuchar activamente significa prestar atención real a lo que el cliente necesita y quiere — no sólo esperar el turno para hablar. La empatía es lo que permite entender que ese cliente necesita sentirse acompañado, no sólo gestionado, para tener una buena experiencia en todo el proceso.

## Capacidad de respuesta

Las esperas largas — un mensaje sin responder por días, una consulta que queda en el aire — generan una sensación de abandono que cuesta mucho revertir después. Atender con rapidez y dinamismo es uno de los factores que más valoran los clientes, incluso por encima del precio final en algunos casos.

## Resolución de problemas con conocimiento real

Los clientes esperan que su agente resuelva sus dudas y problemas con eficacia, lo cual requiere un conocimiento profundo del mercado, del inmueble y del proceso — no respuestas genéricas. Un agente que no sabe responder una pregunta técnica pierde autoridad, aunque después lo intente compensar con simpatía.

## Mejora continua

Los procesos de atención más sólidos se apoyan en valores claros, superación constante de expectativas, escucha empática y revisión permanente de lo que se puede hacer mejor. La atención al cliente no es un checklist que se completa una vez — es una práctica que se ajusta con cada operación.

## Por qué esto es, en el fondo, el negocio

En el sector inmobiliario, la atención al cliente es un pilar que define directamente el éxito y la reputación de cualquier profesional. Las personas depositan en su agente una confianza que va mucho más allá de una transacción comercial común — y esa confianza, bien sostenida, es lo que trae la próxima recomendación, el próximo cliente, la próxima operación.

*Fuentes: [Inmogesco — La atención al cliente de una inmobiliaria](https://inmogesco.com/blog/atencion-al-cliente-agencias-inmobiliarias/), [Zenvia — Atención al cliente: pilares fundamentales](https://zenvia.com/es/blog/atencion-al-cliente/), [Zenvia — Calidad del servicio: los 5 pilares fundamentales](https://zenvia.com/es/blog/calidad-del-servicio/), [Planok — 5 tips para mejorar el servicio al cliente inmobiliario](https://www.planok.com/blog/5-tips-mejorar-el-servicio-al-cliente-inmobiliario).*`,
    },
];

async function uploadImage(slug, imageFileName) {
    const localPath = path.join(IMAGES_DIR, imageFileName);
    const destination = `blog/${slug}/cover.jpg`;
    await bucket.upload(localPath, {
        destination,
        metadata: { contentType: "image/jpeg" },
        public: true,
    });
    return `https://storage.googleapis.com/${bucket.name}/${destination}`;
}

async function main() {
    for (const post of POSTS) {
        const now = admin.firestore.Timestamp.now();
        console.log(`Subiendo imagen para "${post.title}"...`);
        const imageUrl = await uploadImage(post.slug, post.image);

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
