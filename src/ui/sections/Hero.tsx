import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Illustrative sample data for the product composition (not real customers).
const RENT_ROWS = [
    { address: "Av. Rivadavia 4520, 3° B", detail: "Caballito · Lucía Fernández", amount: "$612.400", status: "paid", label: "Cobrado" },
    { address: "Gurruchaga 1130, PB", detail: "Palermo · Martín Rossi", amount: "$735.000", status: "paid", label: "Cobrado" },
    { address: "Cnel. Paulino Rojas 390", detail: "Ituzaingó · Sofía Benítez", amount: "$448.900", status: "due", label: "Vence el 12" },
    { address: "Belgrano 2215, 7° A", detail: "Morón · Diego Acosta", amount: "$389.500", status: "late", label: "4 días de atraso" },
] as const;

export default function Hero() {
    return (
        <section className="l-hero" aria-labelledby="hero-title">
            <div className="l-hero__grid">
                <div className="l-reveal" style={{ ["--i" as string]: 0 }}>
                    <p className="l-hero__eyebrow">Software para inmobiliarias</p>

                    <h1 id="hero-title">
                        Alquileres al día. Propiedades en orden. <em>Tu propia web.</em>
                    </h1>

                    <p className="l-hero__lede">
                        Zeta Prop reúne lo que una inmobiliaria usa todos los días: contratos y cobros de alquileres,
                        tu cartera de propiedades y un sitio web con tu marca que se actualiza solo. Todo por una
                        cuota mensual.
                    </p>

                    <div className="l-hero__ctas">
                        <Link href="/register" className="l-btn l-btn--primary">
                            Probar 14 días gratis
                        </Link>
                        <Link href="/precios" className="l-link-arrow">
                            Ver precios
                            <ArrowRight size={16} aria-hidden />
                        </Link>
                    </div>

                    <p className="l-hero__fineprint">Sin tarjeta de crédito ni pagos anticipados.</p>
                </div>

                <div className="l-hero__visual l-reveal" style={{ ["--i" as string]: 1 }} aria-hidden="true">
                    <div className="l-sheet">
                        <div className="l-sheet__head">
                            <p className="l-sheet__title">Alquileres · Octubre</p>
                            <p className="l-sheet__meta">42 contratos activos</p>
                        </div>
                        <div className="l-sheet__summary">
                            <p className="l-sheet__figure">
                                <strong>$18.640.000</strong>
                                <span>cobrados de $21.300.000</span>
                            </p>
                            <div className="l-sheet__progress">
                                <span style={{ width: "87.5%" }} />
                            </div>
                        </div>
                        <ul className="l-sheet__rows">
                            {RENT_ROWS.map((row) => (
                                <li key={row.address} className="l-sheet__row">
                                    <div className="l-sheet__address">
                                        <p>{row.address}</p>
                                        <p>{row.detail}</p>
                                    </div>
                                    <span className="l-sheet__amount">{row.amount}</span>
                                    <span className={`l-status l-status--${row.status}`}>{row.label}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="l-hero__note">
                        <p>Ajuste por IPC calculado</p>
                        <p>
                            Av. Rivadavia 4520 pasa a <strong>$689.300</strong> desde noviembre.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
