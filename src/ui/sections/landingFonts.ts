import { Instrument_Serif, Inter_Tight } from "next/font/google";

// Landing-only typefaces: an editorial serif for headlines and a tight grotesk for UI/body.
export const landingSerif = Instrument_Serif({
    variable: "--font-landing-serif",
    subsets: ["latin"],
    weight: "400",
    style: ["normal", "italic"],
    display: "swap",
});

export const landingSans = Inter_Tight({
    variable: "--font-landing-sans",
    subsets: ["latin"],
    display: "swap",
});
