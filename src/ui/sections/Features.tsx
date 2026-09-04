import { Building2, Users, Calendar, DollarSign, FileText, TrendingUp } from "lucide-react";

const TILES = [
    {
        icon: Building2,
        title: "Gestión de propiedades",
        body: "Centralizá todo tu inventario en un solo lugar: fichas técnicas completas, fotos, videos y estado en tiempo real.",
        span: "l-bento__tile--wide",
    },
    {
        icon: FileText,
        title: "Contratos digitales",
        body: "Generá contratos de alquiler y venta listos para descargar, sin plantillas sueltas en Word.",
        span: "l-bento__tile--narrow",
    },
    {
        icon: Calendar,
        title: "Agenda inteligente",
        body: "Coordiná visitas sin solapamientos, con sincronización automática y recordatorios por WhatsApp.",
        span: "l-bento__tile--third",
    },
    {
        icon: DollarSign,
        title: "Gestión financiera",
        body: "Recibos automáticos, cálculo de punitorios y liquidaciones a propietarios sin planillas manuales.",
        span: "l-bento__tile--third",
    },
    {
        icon: Users,
        title: "Clientes y propietarios",
        body: "Seguimiento de leads, perfiles de búsqueda y pipeline de conversión en un solo panel.",
        span: "l-bento__tile--narrow",
    },
    {
        icon: TrendingUp,
        title: "Reportes y analytics",
        body: "Métricas de rendimiento de agentes, propiedades más vistas y facturación del mes en vivo.",
        span: "l-bento__tile--wide",
    },
];

export default function Features() {
    return (
        <section className="l-section">
            <div className="l-container">
                <div className="l-section__head">
                    <h2 className="l-section__title">Todo lo que necesita tu inmobiliaria, en un solo lugar.</h2>
                    <p className="l-section__lede">
                        Una plataforma completa, sin integraciones complicadas ni costos ocultos.
                    </p>
                </div>

                <div className="l-bento">
                    {TILES.map((tile, i) => (
                        <div key={tile.title} className={`l-bento__tile ${tile.span} l-reveal`} style={{ ["--i" as string]: i }}>
                            <span className="l-bento__icon">
                                <tile.icon size={18} />
                            </span>
                            <h3 className="l-bento__title">{tile.title}</h3>
                            <p className="l-bento__body">{tile.body}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
