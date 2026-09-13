"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Quote, HeartHandshake, CheckCircle2 } from "lucide-react";

export default function HumanPromise() {
    return (
        <section className="l-section">
            <div className="l-container l-promise__grid">
                {/* LEFT — text */}
                <div>
                    <span className="l-kicker">
                        <HeartHandshake size={14} />
                        Nuestra promesa
                    </span>

                    <h2 className="l-promise__title">
                        Tu voz importa. <span>Siempre.</span>
                    </h2>

                    <Quote size={28} className="l-promise__quote" />

                    <div className="l-promise__body">
                        <p>
                            Sabemos lo que se siente pagar una plataforma y que nadie te escuche. Por eso, desde nuestra versión básica,{" "}
                            <strong>tenés un canal directo y prioritario</strong> para sugerir nuevos módulos, reportar mejoras o pedir las funcionalidades que tu inmobiliaria necesita para ser más eficiente.
                        </p>
                        <p>
                            No queremos que solo nos pagues una suscripción; <strong>queremos ser tu socio tecnológico</strong>. Tu crecimiento es nuestro crecimiento, y nuestro compromiso es que nunca te sientas solo en la digitalización de tu negocio.
                        </p>
                        <p className="l-promise__closer">Crecemos juntos. 🚀</p>
                    </div>

                    <Link href="/register" className="l-btn l-btn--primary">
                        Empezá tu prueba gratuita de 14 días
                        <ArrowRight size={18} />
                    </Link>
                    <p className="l-promise__fineprint">
                        <CheckCircle2 size={16} />
                        Sin tarjetas, sin letra chica. Empezá a crecer hoy.
                    </p>
                </div>

                {/* RIGHT — image */}
                <div className="l-promise__frame">
                    <Image
                        src="/assets/img/human_promise.png"
                        alt="Tu socio tecnológico inmobiliario"
                        fill
                        sizes="(max-width: 68rem) 100vw, 50vw"
                    />
                    <div className="l-promise__badge">
                        <span className="l-promise__badge-dot" />
                        <div>
                            <p className="l-promise__badge-title">+64 inmobiliarias activas</p>
                            <p className="l-promise__badge-sub">creciendo con Zeta Prop hoy</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
