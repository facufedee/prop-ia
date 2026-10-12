import OpengraphImage from "./opengraph-image";

// Same artwork as the Open Graph image. Config exports are declared here rather than
// re-exported because Next reads them statically from each metadata image file.
export const alt = "Zeta Prop: software para inmobiliarias";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
    return OpengraphImage();
}
