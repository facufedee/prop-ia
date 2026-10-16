// Fixed bank of 100 Instagram carousel topics for real-estate agencies and
// agents (B2B). Source of truth for copy: docs/marketing/carrusel-temas.md
// (a test keeps both in sync). Topics are published interleaving categories
// (1, 21, 41, 61, 81, 2, 22, ...) so the same axis never runs two weeks in a row.

export const CAROUSEL_CATEGORIES = [
    "Captación y tasación",
    "Alquileres y administración",
    "Ventas y negociación",
    "Marketing y redes para inmobiliarias",
    "Productividad, tecnología y equipo",
] as const;

export type CarouselCategory = (typeof CAROUSEL_CATEGORIES)[number];

export interface CarouselTopic {
    number: number;
    category: CarouselCategory;
    title: string;
}

const TOPICS_PER_CATEGORY = 20;

// [number, title]; the category follows from the number (20 per category, in order).
const TOPIC_ROWS: ReadonlyArray<readonly [number, string]> = [
    // Captación y tasación
    [1, "5 preguntas que tenés que hacerle a un propietario antes de tomar su propiedad"],
    [2, "3 señales de que una propiedad está sobrevalorada"],
    [3, "Cómo explicarle a un propietario por qué su precio está alto (sin perderlo)"],
    [4, "5 errores al tasar que te hacen perder la exclusiva"],
    [5, "Qué datos mirar para armar una tasación que convenza"],
    [6, "Exclusiva o compartida: 5 argumentos para pedir exclusividad"],
    [7, "5 documentos que conviene pedir el primer día de la captación"],
    [8, "Cómo preparar una visita de tasación en 15 minutos"],
    [9, "3 objeciones típicas del propietario y cómo responderlas"],
    [10, "5 fuentes para conseguir propiedades sin depender de los portales"],
    [11, "Qué hacer cuando el propietario quiere publicar con varias inmobiliarias"],
    [12, "5 cosas que tiene que tener tu informe de tasación"],
    [13, "Cómo usar los cierres de tu zona para defender un precio"],
    [14, "3 momentos ideales para volver a contactar a un propietario que no firmó"],
    [15, "5 preguntas para detectar si el propietario realmente quiere vender"],
    [16, "Cómo captar en un barrio donde todavía no te conocen"],
    [17, "5 errores en la ficha de la propiedad que espantan consultas"],
    [18, "Qué fotos sí y qué fotos no en un aviso inmobiliario"],
    [19, "Cómo pedir una baja de precio con datos y no con opiniones"],
    [20, "5 señales de que una propiedad se va a vender rápido"],
    // Alquileres y administración
    [21, "5 cosas que revisar antes de firmar un contrato de alquiler"],
    [22, "Cómo explicarle a un inquilino el ajuste de su alquiler sin conflicto"],
    [23, "5 errores comunes al administrar alquileres"],
    [24, "Qué garantías aceptar y cuáles mirar con lupa"],
    [25, "5 datos que tenés que tener a mano de cada contrato"],
    [26, "Cómo organizar los vencimientos para que ninguno se te escape"],
    [27, "3 formas de reducir la morosidad en tu cartera"],
    [28, "Qué incluir en el inventario de entrada para evitar discusiones"],
    [29, "5 preguntas para evaluar a un inquilino antes de presentarlo"],
    [30, "Cómo comunicar una renovación de contrato"],
    [31, "5 gastos que suelen generar conflicto entre dueño e inquilino"],
    [32, "Cómo armar una liquidación mensual clara para el propietario"],
    [33, "3 errores al calcular ajustes por índice"],
    [34, "Qué hacer cuando un inquilino deja de pagar: primeros 5 pasos"],
    [35, "5 ventajas de darle al inquilino un portal propio"],
    [36, "Cómo cobrar honorarios de administración sin que se discutan"],
    [37, "Alquiler temporario vs. tradicional: 5 diferencias de gestión"],
    [38, "5 reclamos frecuentes de inquilinos y cómo ordenarlos"],
    [39, "Cómo hacer la entrega de llaves sin sorpresas"],
    [40, "5 indicadores para saber si tu cartera de alquileres es rentable"],
    // Ventas y negociación
    [41, "5 preguntas para calificar a un comprador en la primera llamada"],
    [42, "Cómo preparar una visita que termine en oferta"],
    [43, "3 errores que cometés al presentar una oferta al propietario"],
    [44, "5 frases que conviene evitar en una negociación"],
    [45, "Qué hacer cuando el comprador dice \"lo voy a pensar\""],
    [46, "5 pasos entre la reserva y la escritura que no podés descuidar"],
    [47, "Cómo manejar una contraoferta sin romper la operación"],
    [48, "3 señales de que un comprador está listo para ofertar"],
    [49, "5 cosas que tiene que saber el comprador antes de reservar"],
    [50, "Cómo darle seguimiento a un lead sin ser pesado"],
    [51, "Qué responder cuando te piden bajar tu comisión"],
    [52, "5 motivos por los que se caen las operaciones (y cómo evitarlos)"],
    [53, "Cómo mostrar una propiedad que tiene un defecto evidente"],
    [54, "5 preguntas después de una visita que te dan información clave"],
    [55, "Cómo cerrar una operación con dos partes que no se llevan bien"],
    [56, "3 errores en la reserva que después cuestan caro"],
    [57, "5 datos del barrio que todo comprador quiere saber"],
    [58, "Cómo responder un WhatsApp de consulta para conseguir la visita"],
    [59, "Qué hacer con los compradores que solo miran y nunca ofertan"],
    [60, "5 hábitos de los agentes que más cierran"],
    // Marketing y redes para inmobiliarias
    [61, "5 ideas de contenido para tu inmobiliaria cuando no tenés propiedades nuevas"],
    [62, "Cómo escribir la descripción de un aviso que genere consultas"],
    [63, "3 errores en Instagram que le restan seriedad a tu inmobiliaria"],
    [64, "5 tipos de video que funcionan para mostrar propiedades"],
    [65, "Por qué tu inmobiliaria necesita un sitio web propio"],
    [66, "5 cosas que tiene que tener tu perfil de Google"],
    [67, "Cómo pedir reseñas a tus clientes (y cuándo)"],
    [68, "5 ideas para mostrar tu barrio y posicionarte como experto"],
    [69, "Cómo armar un calendario de publicaciones sin volverte loco"],
    [70, "3 formas de usar las historias para generar consultas"],
    [71, "5 datos que conviene compartir para generar confianza"],
    [72, "Cómo presentar a tu equipo en redes"],
    [73, "5 errores en las fotos de las propiedades que se ven en todos lados"],
    [74, "Cómo aprovechar una propiedad vendida para conseguir nuevas"],
    [75, "5 ideas para un newsletter que tus clientes quieran leer"],
    [76, "Cómo responder un comentario negativo en redes"],
    [77, "3 maneras de diferenciarte de las otras inmobiliarias de tu zona"],
    [78, "5 preguntas frecuentes que podés convertir en contenido"],
    [79, "Cartelería: 5 claves para que tu cartel genere llamadas"],
    [80, "Cómo medir si tu marketing está funcionando"],
    // Productividad, tecnología y equipo
    [81, "5 tareas que podés automatizar en tu inmobiliaria hoy"],
    [82, "Cómo organizar tu semana como agente inmobiliario"],
    [83, "3 señales de que tu inmobiliaria necesita un sistema de gestión"],
    [84, "5 datos de cada lead que no podés perder"],
    [85, "Cómo dividir tareas en un equipo inmobiliario"],
    [86, "5 errores al manejar la inmobiliaria con planillas de Excel"],
    [87, "Cómo usar un CRM para no perder ninguna consulta"],
    [88, "5 reportes que tendrías que mirar todos los meses"],
    [89, "Cómo incorporar a un agente nuevo a tu equipo"],
    [90, "3 formas de ganar tiempo en la carga de propiedades"],
    [91, "5 hábitos para no dejar consultas sin responder"],
    [92, "Cómo trabajar con varias sucursales sin perder el control"],
    [93, "5 preguntas para elegir un software inmobiliario"],
    [94, "Cómo usar la inteligencia artificial en tu día a día como agente"],
    [95, "3 métricas para saber si tu equipo está rindiendo"],
    [96, "5 cosas que tu cliente espera de vos y no te dice"],
    [97, "Cómo armar un proceso de trabajo que funcione sin vos"],
    [98, "5 errores de comunicación interna en una inmobiliaria"],
    [99, "Cómo llevar el control de tus comisiones y gastos"],
    [100, "5 metas para tu inmobiliaria en los próximos 12 meses"],
];

export const CAROUSEL_TOPICS: readonly CarouselTopic[] = TOPIC_ROWS.map(([number, title]) => ({
    number,
    category: CAROUSEL_CATEGORIES[Math.floor((number - 1) / TOPICS_PER_CATEGORY)],
    title,
}));

const BY_NUMBER = new Map(CAROUSEL_TOPICS.map((topic) => [topic.number, topic]));

/** Topic numbers in publish order: 1, 21, 41, 61, 81, 2, 22, ... */
export const PUBLISH_ORDER: readonly number[] = Array.from({ length: TOPICS_PER_CATEGORY }, (_, index) =>
    CAROUSEL_CATEGORIES.map((_category, c) => c * TOPICS_PER_CATEGORY + index + 1)
).flat();

export function getTopic(number: number): CarouselTopic | null {
    return BY_NUMBER.get(number) ?? null;
}

/** First topic in publish order that has no draft yet, or null when the bank is exhausted. */
export function nextTopic(draftedNumbers: Iterable<number>): CarouselTopic | null {
    const drafted = new Set(draftedNumbers);
    const number = PUBLISH_ORDER.find((n) => !drafted.has(n));
    return number === undefined ? null : getTopic(number);
}
