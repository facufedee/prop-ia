import { ImageResponse } from "next/og";

// Default share image for every (main) page without its own openGraph.images.
export const alt = "Zeta Prop: software para inmobiliarias";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    padding: "0 96px",
                    background: "#110f0d",
                    color: "#f5efe6",
                }}
            >
                <div style={{ display: "flex", fontSize: 128, fontWeight: 700, letterSpacing: "-0.03em" }}>
                    <span style={{ color: "#ffffff" }}>Zeta</span>
                    <span style={{ color: "#d4a76a" }}>Prop</span>
                </div>
                <div style={{ display: "flex", marginTop: 24, fontSize: 56, color: "#f5efe6" }}>
                    Software para inmobiliarias
                </div>
                <div style={{ display: "flex", marginTop: 20, fontSize: 34, color: "#b8ab99" }}>
                    Alquileres · Propiedades · Página web
                </div>
            </div>
        ),
        size
    );
}
