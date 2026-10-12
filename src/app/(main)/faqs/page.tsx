"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { PrimaryCta } from "@/ui/sections/PhotoHero";
import { FAQ_CATEGORIES as categories } from "./faqData";

export default function FAQsPage() {
    const [openKey, setOpenKey] = useState<string | null>(null);

    const toggle = (key: string) => setOpenKey(openKey === key ? null : key);

    return (
        <main className="flex-1">
            {/* ── Page header ── */}
            <section className="l-section s-page-head" aria-labelledby="faqs-title">
                <div className="l-container">
                    <div className="s-page-head__inner">
                        <p className="l-eyebrow">FAQs</p>
                        <h1 id="faqs-title" className="s-page-title">
                            Preguntas Frecuentes
                        </h1>
                        <p className="s-page-lede">
                            Todo lo que necesitás saber sobre Zeta Prop para gestionar tu inmobiliaria.
                        </p>
                    </div>
                </div>
            </section>

            {/* FAQ Categories */}
            <section className="l-section l-section--tight">
                <div className="l-container">
                    {categories.map((cat) => (
                        <div key={cat.title} className="s-faq-group l-faq">
                            <h2 className="l-section__title">{cat.title}</h2>
                            <div className="s-faq-list">
                                {cat.faqs.map((faq, i) => {
                                    const key = `${cat.title}-${i}`;
                                    const isOpen = openKey === key;
                                    const panelId = `faq-panel-${key.replace(/\s+/g, "-")}`;
                                    return (
                                        <div key={key} className="s-faq-item">
                                            <button
                                                type="button"
                                                onClick={() => toggle(key)}
                                                className="s-faq-item__button"
                                                aria-expanded={isOpen}
                                                aria-controls={panelId}
                                            >
                                                <span>{faq.question}</span>
                                                <ChevronDown className="s-faq-item__icon" size={20} aria-hidden="true" />
                                            </button>
                                            <div
                                                id={panelId}
                                                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"}`}
                                            >
                                                <p className="s-faq-item__answer">{faq.answer}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="l-section l-section--tight" aria-labelledby="faqs-cta-title">
                <div className="l-container l-cta-band">
                    <h2 id="faqs-cta-title">¿No encontrás lo que buscás?</h2>
                    <p>Escribinos y te respondemos a la brevedad.</p>
                    <PrimaryCta href="/contacto">Contactanos</PrimaryCta>
                </div>
            </section>
        </main>
    );
}
