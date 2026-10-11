import { preload } from "react-dom";

// "Lights on" intro for the home hero photo (public/assets/img/hero-casa.webp, 2400x1340).
// A dimmed, cooler copy of the photo covers the real one; each lit window punches a hole in it,
// one after another, and then the whole dim layer fades out. Pure CSS animation, no JS.
// Window outlines are traced on this specific photo: replacing the image requires new outlines.

const SRC = "/assets/img/hero-casa.webp";
const W = 2400;
const H = 1340;

// Polygons in image pixels, in the order they light up.
const WINDOWS = [
    "576,822 924,822 924,942 576,942", // left pavilion
    "1242,742 1716,654 1716,828 1242,854", // upper floor glazing
    "1764,708 1842,708 1842,816 1764,816", // upper floor, right
    "720,960 1056,946 1056,1116 720,1116", // ground floor, panel 1
    "1056,946 1284,934 1284,1116 1056,1116", // ground floor, panel 2
    "1284,934 1632,917 1632,1116 1284,1116", // ground floor, panel 3
    "1632,917 1908,902 1908,1128 1632,1128", // ground floor, panel 4
];

export function LitHouseBackdrop() {
    preload(SRC, { as: "image", fetchPriority: "high" });

    return (
        <div className="l-lit" aria-hidden="true">
            <svg className="l-lit__svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice">
                <defs>
                    <filter id="lit-dusk" colorInterpolationFilters="sRGB">
                        <feColorMatrix type="matrix" values="0.34 0 0 0 0  0 0.38 0 0 0.004  0 0 0.52 0 0.02  0 0 0 1 0" />
                    </filter>
                    <filter id="lit-bloom" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="28" />
                    </filter>
                    <mask id="lit-windows" maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
                        <rect width={W} height={H} fill="white" />
                        {WINDOWS.map((points, i) => (
                            <polygon key={points} points={points} fill="black" className="l-lit__hole" style={{ ["--n" as string]: i }} />
                        ))}
                    </mask>
                </defs>

                {/* Final state: the real photo. */}
                <image href={SRC} width={W} height={H} />

                {/* Lights-off layer with the windows progressively cut out. */}
                <g className="l-lit__off" mask="url(#lit-windows)">
                    <image href={SRC} width={W} height={H} filter="url(#lit-dusk)" />
                </g>

                {/* Warm bloom that spills onto the dark facade as each window turns on. */}
                <g className="l-lit__bloom" filter="url(#lit-bloom)">
                    {WINDOWS.map((points, i) => (
                        <polygon key={points} points={points} className="l-lit__glow" style={{ ["--n" as string]: i }} />
                    ))}
                </g>
            </svg>
        </div>
    );
}
