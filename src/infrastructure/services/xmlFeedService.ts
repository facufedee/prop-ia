import { Property } from "@/domain/models/Property";

export const xmlFeedService = {
  generateFeed: (properties: Property[], realEstateId: string): string => {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
    const items = properties.map(p => generateNaventXml(p)).join('\n');

    return `${xmlHeader}
<avisos>
${items}
</avisos>`;
  }
};

function generateNaventXml(p: Property): string {
  // Helper for safe text
  const safe = (val: string | number | undefined) => {
    if (val === undefined || val === null) return '';
    return String(val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  // Helper for numeric formatting (Navent expects dot or integer)
  const num = (val?: number) => val !== undefined ? val.toString() : '';

  // Helper for boolean (S/N is common in some LATAM XMLs, but Navent official often uses 1/0 or true/false.
  // Standard Navent Documentation (OpenNavent) often uses Enums.
  // We will use standard labels or 1/0 where appropriate.
  const bool = (val?: boolean) => val ? '1' : '0';

  // Mapping Operation Type
  const getOperacion = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('rent')) return 'Alquiler';
    if (t.includes('sale')) return 'Venta';
    if (t.includes('transfer')) return 'Temporada'; // Example fallback
    return 'Venta';
  };

  // Format images
  const fotos = p.images.map((img, index) => `
    <foto>
      <url>${safe(img.url)}</url>
      <titulo>${safe(img.title || 'Foto ' + (index + 1))}</titulo>
      <orden>${index}</orden>
    </foto>`).join('');

  // Ambients (Navent: medidas)
  const ambientes = p.ambients?.map(a => `
    <ambiente>
    </ambiente>`).join('') || '';
  // Usually Navent XML doesn't iterate ambients in this specific way at root level, 
  // but rather description or attributes. We'll keep it simple for now.

  return `
  <aviso>
    <codigo_referencia>${safe(p.id)}</codigo_referencia>
    <titulo>${safe(p.title)}</titulo>
    <descripcion>${safe(p.content || p.title)}</descripcion>
    
    <tipo_operacion>${safe(getOperacion(p.type))}</tipo_operacion>
    <tipo_propiedad>${safe(p.property_type)}</tipo_propiedad>
    
    <ubicacion>
        <calle>${safe(p.address_name)}</calle>
        <numero>${safe(p.address_number)}</numero>
        <piso>${safe(p.address_floor)}</piso>
        <departamento>${safe(p.address_apartment)}</departamento>
        <localidad>${safe(p.city)}</localidad>
        <provincia>${safe(p.region)}</provincia>
        <pais>${safe(p.country)}</pais>
        <latitud>${p.location?.latitude || ''}</latitud>
        <longitud>${p.location?.longitude || ''}</longitud>
        <mostrar_exacta>${p.hidden_address ? '0' : '1'}</mostrar_exacta>
    </ubicacion>

    <precio>
        <monto>${safe(p.price)}</monto>
        <moneda>${safe(p.currency === 'USD' ? 'USD' : '$')}</moneda>
        <valor_expensas>${safe(p.expenses)}</valor_expensas>
    </precio>

    <caracteristicas>
        <superficie_total>${num(p.plot_area)}</superficie_total>
        <superficie_cubierta>${num(p.floor_area)}</superficie_cubierta>
        <cant_ambientes>${num(p.rooms)}</cant_ambientes>
        <cant_dormitorios>${num(p.rooms ? p.rooms - 1 : 0)}</cant_dormitorios>
        <cant_banios>${num(p.bathrooms)}</cant_banios>
        <antiguedad>${num(p.antiquity)}</antiguedad>
        <estado>${safe(p.condition)}</estado>
        <orientacion>${safe(p.orientation)}</orientacion>
        <disposicion>${safe(p.disposition)}</disposicion>
        
        <!-- Boolean Features -->
        <apto_credito>${bool(p.apto_credito)}</apto_credito>
        <apto_profesional>${bool(p.apto_professional)}</apto_profesional>
    </caracteristicas>

    <multimedia>
        <fotos>
            ${fotos}
        </fotos>
        ${p.video_url ? `<videos><video><url>${safe(p.video_url)}</url></video></videos>` : ''}
        ${p.tour_360_url ? `<recorridos_360><recorrido><url>${safe(p.tour_360_url)}</url></recorrido></recorridos_360>` : ''}
    </multimedia>
    
    <contacto>
         <email>${safe(p.seller?.email || 'contacto@inmobiliaria.com')}</email>
         <nombre>${safe(p.seller?.full_name || 'Agente')}</nombre>
    </contacto>

    <publicador>
       <id_inmobiliaria>${safe(p.real_estate_id)}</id_inmobiliaria>
    </publicador>

  </aviso>`;
}
