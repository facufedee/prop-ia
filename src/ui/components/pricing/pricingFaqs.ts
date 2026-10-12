// Single source for the /precios FAQ: rendered by PricingTable and mirrored
// verbatim into the page's FAQPage JSON-LD. Every answer must stay backed by
// existing product behavior (checkout proration, TrialEnforcer, PaymentBrick,
// branches, support tickets) — do not add claims that the app can't honor.
export const PRICING_FAQS: { q: string; a: string }[] = [
    {
        q: "¿Puedo cambiar de plan en cualquier momento?",
        a: "Sí. Podés pasar a otro plan cuando quieras desde la página de precios. Si tenés una suscripción activa, la parte que todavía no usaste de tu plan actual se descuenta como crédito del nuevo pago.",
    },
    {
        q: "¿Qué pasa cuando termina la prueba gratuita de 14 días?",
        a: "Para seguir gestionando tu cartera tenés que elegir un plan. No se te cobra nada automáticamente, porque nunca te pedimos datos de pago durante la prueba. Si necesitás más tiempo, podés pedir una prórroga de 7 días.",
    },
    {
        q: "¿Necesito tarjeta de crédito para registrarme?",
        a: "No. El registro y los 14 días de prueba son gratis y no requieren ningún método de pago. Te registrás con email y contraseña o con tu cuenta de Google.",
    },
    {
        q: "¿Qué métodos de pago aceptan?",
        a: "Tarjetas de crédito y débito a través de Mercado Pago, o transferencia bancaria. Cada pago cubre el período elegido (mensual o anual) y no se renueva con débito automático.",
    },
    {
        q: "¿Funciona para inmobiliarias con varias sucursales?",
        a: "Sí. Los planes Profesional y Enterprise incluyen sucursales: asignás propiedades a cada oficina y filtrás la cartera por sucursal desde una única cuenta.",
    },
    {
        q: "¿Puedo importar mi cartera de propiedades existente?",
        a: "Por ahora la carga se hace desde el panel: propiedades, propietarios, inquilinos y contratos vigentes. Todavía no hay importación masiva desde Excel ni desde otros portales.",
    },
    {
        q: "¿El soporte está incluido en todos los planes?",
        a: "Sí. Desde el panel podés abrir un ticket de soporte y seguir su estado, y también podés escribirnos por WhatsApp o por el chat del sitio.",
    },
];
