/**
 * Shared price formatter for public-facing property displays. Falls back to
 * "Consultar Precio" when hidden or when price is 0/empty — agents sometimes
 * leave the price field blank and it defaults to 0, which used to render as
 * a literal "USD 0" across cards, map pins and detail pages.
 */
export function formatPropertyPrice(
    price: number | string | null | undefined,
    currency?: string | null,
    hidePrice?: boolean | null
): string {
    const numericPrice = Number(price);
    if (hidePrice || !numericPrice) return "Consultar Precio";
    return `${currency || "USD"} ${numericPrice.toLocaleString("es-AR")}`;
}
