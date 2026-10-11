import { Inter_Tight, Montserrat } from "next/font/google";

// Landing-only typefaces: a geometric sans for headlines and a tight grotesk for UI/body.
export const landingHeading = Montserrat({
    variable: "--font-landing-heading",
    subsets: ["latin"],
    weight: ["500", "600", "700"],
    display: "swap",
});

export const landingSans = Inter_Tight({
    variable: "--font-landing-sans",
    subsets: ["latin"],
    display: "swap",
});
