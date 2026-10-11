import { PrimaryCta } from "./PhotoHero";

// "Before / after" for weekly agency tasks. Every "after" maps to a verified capability
// (see odd/tasks/landing-light-redesign.md feature inventories).
const TASKS = [
    {
        task: "Aumento del alquiler",
        before: "Buscás el índice, armás la cuenta en Excel y rezás para no equivocarte.",
        after: "El sistema toma el ICL o el IPC oficial y te dice el nuevo monto.",
    },
    {
        task: "Quién pagó y quién no",
        before: "Revisás transferencias, chats y una planilla que nadie actualizó.",
        after: "Una agenda con lo vencido, lo de hoy y lo de la semana.",
    },
    {
        task: "Recibos",
        before: "Copiás el recibo del mes pasado en Word y cambiás los datos a mano.",
        after: "Recibo en PDF, numerado y con tu logo, listo para mandar.",
    },
    {
        task: "Liquidación al propietario",
        before: "Sumás, restás tus honorarios y le explicás la cuenta por WhatsApp.",
        after: "La liquidación sale con tus honorarios descontados, en PDF.",
    },
    {
        task: "Tu página web",
        before: "Le pedís al diseñador que suba la propiedad nueva y esperás.",
        after: "Cargás la propiedad una vez y aparece sola en tu web.",
    },
    {
        task: "Consultas",
        before: "Llegan por mail, por el formulario y por WhatsApp, y alguna se pierde.",
        after: "Las de tu web entran a tu panel, con aviso y email al agente.",
    },
];

export default function Intro() {
    return (
        <section className="l-section" aria-labelledby="intro-title">
            <div className="l-container">
                <div className="l-modules__head">
                    <div>
                        <p className="l-eyebrow">Por qué Zeta Prop</p>
                        <h2 id="intro-title" className="l-section__title">
                            Lo que hoy hacés a mano, resuelto.
                        </h2>
                    </div>
                    <p className="l-section__lede">
                        Las tareas que se repiten todas las semanas en una inmobiliaria, antes y después de Zeta Prop.
                    </p>
                </div>

                <div className="l-compare" role="table" aria-label="Tareas de una inmobiliaria, hoy y con Zeta Prop">
                    <div className="l-compare__row l-compare__row--head" role="row">
                        <span role="columnheader">Tarea</span>
                        <span role="columnheader">Hoy</span>
                        <span role="columnheader">Con Zeta Prop</span>
                    </div>
                    {TASKS.map((item) => (
                        <div key={item.task} className="l-compare__row" role="row">
                            <span className="l-compare__task" role="rowheader">
                                {item.task}
                            </span>
                            <span className="l-compare__before" role="cell">
                                <span className="l-compare__label" aria-hidden="true">
                                    Hoy
                                </span>
                                {item.before}
                            </span>
                            <span className="l-compare__after" role="cell">
                                <span className="l-compare__label" aria-hidden="true">
                                    Con Zeta Prop
                                </span>
                                {item.after}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="l-compare__cta">
                    <PrimaryCta href="/register">Probar 14 días gratis</PrimaryCta>
                    <span className="l-hero__note-inline">Sin tarjeta de crédito</span>
                </div>
            </div>
        </section>
    );
}
