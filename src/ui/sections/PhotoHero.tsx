import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { photoSrc, type LandingPhoto } from "./landingPhotos";

interface PhotoHeroProps {
    photo: LandingPhoto;
    labelledBy: string;
    /** "statement": larger headline for a short, single-promise hero (home). */
    variant?: "default" | "statement";
    /** Replaces the default photo layer (e.g. an animated backdrop). */
    backdrop?: ReactNode;
    children: ReactNode;
    aside?: ReactNode;
}

export function PhotoHero({ photo, labelledBy, variant = "default", backdrop, children, aside }: PhotoHeroProps) {
    return (
        <section className={`l-hero l-hero--${variant}`} aria-labelledby={labelledBy}>
            <div className="l-hero__frame">
                {backdrop ?? <Image src={photoSrc(photo)} alt="" fill priority sizes="100vw" className="l-hero__photo" />}
                <div className="l-hero__scrim" aria-hidden="true" />
                <div className="l-hero__grid">
                    <div className="l-reveal" style={{ ["--i" as string]: 0 }}>
                        {children}
                    </div>
                    {aside && (
                        <div className="l-hero__visual l-reveal" style={{ ["--i" as string]: 1 }}>
                            {aside}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

export function PrimaryCta({ href, children }: { href: string; children: ReactNode }) {
    return (
        <Link href={href} className="l-btn l-btn--primary">
            {children}
            <span className="l-btn__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
            </span>
        </Link>
    );
}
