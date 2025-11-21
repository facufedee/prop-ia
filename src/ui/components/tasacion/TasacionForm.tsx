"use client";

import { useState, useEffect } from "react";
import { PropertyData } from "@/lib/prediction/preprocessor";
import { Home, Ruler, Building2, Clock, Bath, BedDouble, Landmark, MapPin, Hash, CircleDollarSign } from "lucide-react";

const initialFormState: PropertyData = {
    bedrooms: null,
    bathrooms: null,
    area_total: null,
    area_covered: null,
    floor: null,
    construction_year: null,
    rooms: null,
    expenses: null,
    property_type: '',
    barrio: '',
    ciudad: '',
    provincia: '',
    all_features: '',
};

const exampleProperty: PropertyData = {
    bedrooms: 3,
    bathrooms: 2,
    area_total: 150,
    area_covered: 120,
    floor: 5,
    construction_year: 2010,
    rooms: 4,
    expenses: 5000,
    property_type: 'Departamento',
    barrio: 'Palermo',
    ciudad: 'Capital Federal',
    provincia: 'Capital Federal',
    all_features: 'pileta, sum, seguridad, cochera, balcon',
};

const propertyTypeOptions = [
    "Departamento",
    "Casa",
    "PH"
];

const commonFeatures = [
    "pileta", "sum", "seguridad", "cochera", "balcon", "terraza", "jardin", "gimnasio", "laundry", "calefaccion"
];
const barrioOptions = [
    " Country Maschwitz Club", " los alamos", "9 de Abril", "Abasto", "Abril Club de Campo", "Acacias Blancas", "Acassuso", "Achiras", "Adrogué", "Aeropuerto Internacional Ezeiza", "Agronomía", "Agua Blanca", "Agua de Oro", "Aguas Verdes", "Albanueva Barrio Cerrado", "Alberdi", "Aldea Brasilera", "Aldo Bonzi", "Alejandro Korn", "Alejandro Roca", "Alem", "Alfar", "Alférez San Martin", "Almafuerte", "Almagro", "Almirante Brown", "Alta Gracia", "Altamira", "Alto Los Cardales", "Altos de Hudson I", "Altos de Hudson II", "Altos de Manzanares 1 y 2", "Altos de Matheu", "Altos del Golf", "Altos del Pilar", "Alvear", "Anisacate", "Apóstoles", "Arequito", "Armenia Country Club", "Arroyo Ceibal", "Arroyo Seco", "Arturo Seguí", "Ascochinga", "Avellaneda", "Azara", "Azul", "Bahía Blanca", "Bahía del Sol", "Balcarce", "Balneario San Cayetano", "Balvanera", "Banfield", "Baradero", "Barbarita, Barrio Cerrado", "Barracas", "Barrancas de San Jose", "Barrancas de Santa María", "Barranqueras", "Barrio  Pirvado Los Naranjos", "Barrio 9 de Julio", "Barrio Acacias", "Barrio Aeroparque", "Barrio Alamo Alto", "Barrio Alto Camet", "Barrio Araucarias", "Barrio Barrancas del Lago", "Barrio Belisario Roldán", "Barrio Cabos del Lago", "Barrio Camet", "Barrio Ceibos", "Barrio Cerrado", "Barrio Cerrado \"Ayres Plaza\"", "Barrio Cerrado \"Buenos Aires Village\"", "Barrio Cerrado \"El Aromo\"", "Barrio Cerrado \"El Casco de Moreno\"", "Barrio Cerrado \"El Estribo\"", "Barrio Cerrado \"Isla del Sol\"", "Barrio Cerrado \"La Candelaria\"", "Barrio Cerrado \"La Cautiva del Pilar\"", "Barrio Cerrado \"La Cañada de Pilar\"", "Barrio Cerrado \"La Chacra\"", "Barrio Cerrado \"La Damasia\"", "Barrio Cerrado \"La Delfina\"", "Barrio Cerrado \"La Emilia\"", "Barrio Cerrado \"La Escondida\"", "Barrio Cerrado \"La Montura\"", "Barrio Cerrado \"La Tranquera\"", "Barrio Cerrado \"Las Araucarias\"", "Barrio Cerrado \"Las Marías\"", "Barrio Cerrado \"Los Alcanfores\"", "Barrio Cerrado \"Los Condes\"", "Barrio Cerrado \"Los Fresnos\"", "Barrio Cerrado \"Los Ombúes de Hudson\"", "Barrio Cerrado \"Los Potrillos\"", "Barrio Cerrado \"Los Senderos\"", "Barrio Cerrado \"Roble Joven\"", "Barrio Cerrado \"Sausalito\"", "Barrio Cerrado \"Soles de Pilar\"", "Barrio Cerrado \"SpringDale\"", "Barrio Cerrado \"Tres Horquetas\"", "Barrio Cerrado \"Villa Rosa\"", "Barrio Cerrado El Casco de Alvarez", "Barrio Cerrado El Lauquén", "Barrio Cerrado El Lucero", "Barrio Cerrado Fincas de Maschwitz", "Barrio Cerrado La Masia", "Barrio Cerrado Lagos del Norte", "Barrio Cerrado Las Casuarinas", "Barrio Cerrado Los Abedules", "Barrio Cerrado San Andres", "Barrio El Golf", "Barrio El Moro", "Barrio El Yacht", "Barrio Fortunato de La Plaza", "Barrio La Alameda", "Barrio La Armonía", "Barrio La Cuesta", "Barrio La Isla", "Barrio La Perla Norte", "Barrio Las Glorietas", "Barrio Los Alisos", "Barrio Los Castores", "Barrio Los Jazmines - Pilar del Este", "Barrio Los Lagos", "Barrio Los Sauces", "Barrio Los Tilos", "Barrio Marinas", "Barrio Melazzi", "Barrio Norte", "Barrio Parque Almirante Irízar", "Barrio Parque General San Martin", "Barrio Parque Girado", "Barrio Parque Matheu", "Barrio Parque San Martin", "Barrio Privado \"Ayres de Pilar\"", "Barrio Privado \"Lomas de Fátima\"", "Barrio Privado El Recodo  S.A.", "Barrio Privado El Resuello", "Barrio Privado El Rodal", "Barrio Privado Santa Rita", "Barrio Privado Villa Olivos", "Barrio San Agustin", "Barrio San Alfonso - Pilar del Este", "Barrio San Benito", "Barrio San Eduardo - Pilar del Este", "Barrio San Francisco", "Barrio San Gabriel", "Barrio San Isidro Labrador", "Barrio San Jerónimo - Pilar del Este", "Barrio San Juan", "Barrio San Marco", "Barrio San Matías", "Barrio San Rafael", "Barrio Santa Clara", "Barrio Santa Emilia - Pilar del Este", "Barrio Santa Guadalupe - Pilar del Este", "Barrio Santa Teresa", "Barrio Sarmiento", "Barrio Vistas", "Barrio cerrado La Cascada", "Barrio cerrado Santa Ana", "BarrioPortezuelo", "Batán", "Beccar", "Belgrano", "Bell Ville", "Bella Vista", "Belén de Escobar", "Benavidez", "Benavidez Greens", "Berazategui", "Berazategui Oeste", "Berisso", "Bermudas Country Club", "Bernal", "Bernardino Rivadavia", "Bialet Massé", "Billinghurst", "Boat Center Barrio Cerrado", "Boca", "Boca Ratón", "Boedo", "Bosque Peralta Ramos", "Boulogne Sur Mer", "Brandsen", "Brickland", "Bs.As. G.B.A. Zona Norte", "Bs.As. G.B.A. Zona Oeste", "Bs.As. G.B.A. Zona Sur", "Buena Nueva", "Buenos Aires Costa Atlántica", "Buenos Aires Interior", "Burzaco", "Cabalango", "Caballito", "Cabildo", "Cafayate", "Caisamar", "Caleta Olivia", "Calmayo", "Camet", "Campana", "Campo Chico Country Club", "Campo Grande", "Campo Grande Country Club", "Campo Quijano", "Campos de Roca", "Campos de Álvarez", "Candelaria", "Canning", "Capilla del Monte", "Capilla del Rosario", "Capilla del Señor", "Capital Federal", "Capitán Bermúdez", "Capitán Sarmiento", "Carapachay", "Cardales Country Club", "Cariló", "Carlos Casares", "Carlos Keen", "Carlos Spegazzini", "Carmel Country Club", "Carmen de Patagones", "Carolina", "Carpintería", "Casa Grande", "Caseros", "Castelar", "Castellanos", "Catalinas", "Catamarca", "Cañadón Seco", "Cañuelas", "Centenario", "Centro", "Centro / Microcentro", "Cerrillos", "Cerro Azul", "Chacarita", "Chacras de Coria", "Chacras de La Trinidad", "Chajarí", "Chapadmalal", "Chascomús", "Chauvín", "Chivilcoy", "Choele Choel", "Chubut", "Cinco Saltos", "Cipolletti", "City Bell", "Ciudad Evita", "Ciudad Jardín Lomas del Palomar", "Ciudadela", "Claraz", "Claromecó", "Claypole", "Club El Carmen - Sector casas", "Club de Campo Aranzazu", "Club de Campo La Martona", "Club de Campo Pueyrredón", "Coghlan", "Colastiné", "Colegiales", "Colina de Peralta Ramos", "Colonia Benitez", "Colonia Caroya", "Colonia Elía", "Colonia Tirolesa", "Colón", "Comandante Nicanor Otamendi", "Comodoro Rivadavia", "Complejo de Barrios Privados La Magdalena", "Concepción del Uruguay", "Concordia", "Confluencia", "Congreso", "Constitución", "Corcovado", "Coronda", "Coronel Brandsen", "Coronel Dorrego", "Coronel Du Graty", "Coronel Moldes", "Coronel Suárez", "Corrientes", "Cosquín", "Costa Azul", "Costa Esmeralda", "Costa Uruguay Sur", "Costa del Este", "Country Banco Provincia", "Country Club Aranjuez", "Country Club Las lajas", "Country Farm Club", "Country Golf El Sosiego", "Country La Tradición", "Country Maschwitz Privado", "Country Nuevo Quilmes", "Country Saint Thomas", "Country San Jorge Village", "Cruce Castelar", "Crucecita", "Cruz del Eje", "Cuartel V", "Cushamen", "Córdoba", "Del Viso", "Delta", "Derqui", "Despeñaderos", "Dina Huapi", "Dique Luján", "Dock Sud", "Domselaar", "Don Bosco", "Don Orione", "Don Torcuato", "Dorrego", "Dunamar", "Echeverría del Lago", "El Calafate", "El Canton Barrio Golf", "El Canton Barrio Islas", "El Canton Barrio Norte", "El Canton Barrio Puerto", "El Casco de Leloir", "El Cazador", "El Centauro", "El Chaltén", "El Dorado", "El Encuentro", "El Jagüel", "El Manzano", "El Molino", "El Nacional Club de Campo", "El Naudir", "El Palomar", "El Pato", "El Pato Country Club", "El Remanso", "El Rocío", "El Sauce", "El Talar", "El Talar de Pacheco", "El Trapiche", "El Viejo Vivero", "El Volcán", "El Zorzal", "Elvira", "Empalme Lobos", "Empalme Villa Constitución", "Ensenada", "Enyoi", "Escalante", "Escobar", "Esperanza", "Esquel", "Estancias del Pilar", "Esteban Echeverría", "Etcheverry", "Ex La Ponderosa", "Exaltación de la Cruz", "Ezeiza", "Ezpeleta", "Faro Norte", "Federación", "Fighiera", "Fincas de Hudson", "Fincas de Iraola", "Fincas de Iraola II", "Fincas de San Vicente", "Fincas del Alba", "Fincas del Lago", "Florencio Varela", "Flores", "Floresta", "Florida", "Florida Oeste", "Formosa", "Francisco Alvarez", "Franck", "Fray Luis Beltrán", "Funes", "Fátima", "Galapagos Country Club", "Garuhapé", "Garupá", "Garín", "General Alvarado", "General Alvear", "General Belgrano", "General Cabrera", "General Fernández Oro", "General Las Heras", "General Lavalle", "General Madariaga", "General Pacheco", "General Pico", "General Pinto", "General Pueyrredón", "General Roca", "General Rodríguez", "General San Martín", "Gerli", "Glew", "Gobernador Benegas", "Godoy Cruz", "Golf Club Argentino", "Golfer's Country Club", "González Catán", "Gorina", "Gral San Martin", "Granadero Baigorria", "Grand Bell", "Grand Bourg", "GreenVille Polo & Resort", "Gregorio de Laferrere", "Gualeguaychú", "Guernica", "Guillermo Hudson", "Gálvez", "Güemes", "Güer Aike", "Hacoaj Barrio Cerrado", "Haedo", "Haras María Elena", "Haras María Victoria", "Haras San Pablo", "Haras Santa Maria", "Haras del Pilar - El Establo", "Haras del Pilar - La Caballeriza", "Haras del Pilar - Las Praderas 1 y 2", "Haras del Sol - Barrio Privado", "Haras del Sur I", "Haras del Sur II", "Hermitage", "Hernando", "Highland Park Country Club", "Hindu Club", "Huerta Grande", "Hurlingham", "Ibarlucea", "Indio Cuá Country Club", "Ingeniero Adolfo Sourdeaux", "Ingeniero Juan Allan", "Ingeniero Pablo Nogués", "Iriondo", "Isidro Casanova", "Islas", "Islas del Canal", "Ituzaingó", "Jesús María", "Jose Leon Suarez", "Jose Marmol", "José C Paz", "José Hernández", "José Ingenieros", "Juana Koslay", "Jujuy", "Junin de los Andes", "Junín", "Juramento", "La Agustina", "La Angélica", "La Arboleda de Maschwitz", "La Caldera", "La Calera", "La Caleta", "La Cesarina", "La Comarca", "La Cumbre", "La Cumbrecita", "La Escondida de Manzanares", "La Esperanza Club de Campo", "La Falda", "La Granja", "La Herradura", "La Lomada de Pilar", "La Lonja", "La Lucila", "La Lucila del Mar", "La Madrugada", "La Martinica", "La Matanza", "La Pampa", "La Paz", "La Peregrina", "La Perla", "La Pilarica", "La Plata", "La Punilla", "La Punta", "La Ranita", "La Reja", "La Rioja", "La Tablada", "La Unión", "La horqueta de Echeverría", "Laboulaye", "Lago Epuyén", "Laguna del Sol", "Lanús", "Lanús Este", "Lanús Oeste", "Laprida", "Larena Country Club", "Las Calles", "Las Cañitas", "Las Gaviotas", "Las Golondrinas", "Las Grutas", "Las Heras", "Las Palmas", "Las Rosas", "Las Toninas", "Libertad", "Lima", "Lincoln", "Liniers", "Lisandro Olmos", "Llavallol", "Lobería", "Lobos", "Loma Hermosa", "Loma Verde", "Lomas de Benavidez", "Lomas de Zamora", "Lomas del Mirador", "Lomas del Río Luján", "Longchamps", "Los Acantilados", "Los Angeles Village", "Los Cardales", "Los Cocos", "Los Horneros CC", "Los Hornillos", "Los Hornos", "Los Lagartos Country Club", "Los Laureles", "Los Molinos", "Los Pilares - Barrio Privado", "Los Pinares", "Los Pingüinos Country Club", "Los Polvorines", "Los Reartes", "Los Robles de Maschwitz", "Los Sauces Country Club", "Los Tres Coniles", "Los Troncos", "Luis Beltrán", "Luis Guillón", "Luján", "Luján de Cuyo", "Luque", "Lácar", "Macrocentro", "Maipú", "Malabrigo", "Malagueño", "Malargüe", "Malvinas Argentinas", "Manantiales", "Manfredi", "Manuel Alberti", "Manuel B Gonnet", "Manzanares", "Manzone", "Mapuche Country Club", "Maquinista Savio", "Mar Azul", "Mar Chiquita", "Mar de Ajó", "Mar de Cobo", "Mar de las Pampas", "Mar del Plata", "Mar del Sur", "Mar del Tuyú", "Marcos Paz", "Mariano Acosta", "Marina Del Sol (Sun's Marine)", "Marinas Golf Barrio Cerrado", "Martindale Country Club", "Martín Coronado", "Martínez", "María Grande", "María Juana", "Maschwitz", "Mataderos", "Matheu", "Mayling Club de Campo", "Mayu Sumaj", "Mburucuyá", "Medal Country Club", "Melchor Romero", "Mendiolaza", "Mendoza", "Mercedes", "Merlo", "Mi Granja", "Mi Refugio", "Mina Clavero", "Ministro Rivadavia", "Miraflores Country Club", "Miramar", "Misiones", "Monje", "Monserrat", "Monte Castro", "Monte Chingolo", "Monte Cristo", "Monte Grande", "Monte Hermoso", "Monte Vera", "Moreno", "Morón", "Mundialista", "Munro", "Murphy", "Muñiz", "Máximo Paz", "Naposta", "Navarro", "Necochea", "Nelson", "Neuquén", "Nono", "Nordelta", "Nueva Atlantis", "Nueve de Julio", "Nuñez", "Oberá", "Obispo Trejo", "Olavarría", "Oliva", "Olivera", "Oliveros", "Olivos", "Olivos Golf Club", "Oncativo", "Once", "Open Door", "Oro Verde", "Ostende", "Pablo Podestá", "Pacheco Golf Club", "Palermo", "Palermo Chico", "Palermo Hollywood", "Palermo Soho", "Palermo Viejo", "Pampa del Infierno", "Paraná", "Parque Avellaneda", "Parque Centenario", "Parque Chacabuco", "Parque Chas", "Parque Leloir", "Parque Luro", "Parque Patricios", "Paso de la Patria", "Paso de los Libres", "Paso del Rey", "Paternal", "Pavón", "Pedro Luro", "Pehuajó", "Pehuen-có", "Pergamino", "Perú", "Pilar", "Pilar Golf Country Club", "Pilar Green Park", "Pilar Village", "Pilar del Lago", "Pinamar", "Pinos de Anchorena", "Pinto", "Piñeiro", "Platanos", "Playa Chica", "Playa Grande", "Playa Serena", "Playa Varese", "Plaza Colón", "Plaza Mitre", "Plaza Rocha", "Plottier", "Pompeya", "Pontevedra", "Posadas", "Potrerillos", "Potrero de Garay", "Potrero de los Funes", "Prados del Oeste", "Presidencia Roque Sáenz Peña", "Presidente Perón", "Princess", "Providencia", "Pueblo Andino", "Pueblo Esther", "Puerto", "Puerto Esperanza", "Puerto Iguazú", "Puerto Libertad", "Puerto Madero", "Punilla", "Punta Alta", "Punta Chica Village", "Punta Iglesia", "Punta Indio", "Punta Lara", "Punta Mogotes", "Pérez", "QBay Yacht", "Quemú Quemú", "Quilmes", "Rada Tilly", "Rafael Calzada", "Rafael Castillo", "Rafaela", "Ramallo", "Ramos Mejía", "Rancagua", "Ranelagh", "Rawson", "Recoleta", "Reconquista", "Recreo", "Remedios de Escalada", "Renca", "Resistencia", "Reta", "Retiro", "Ricardo Rojas", "Ricardone", "Rincon", "Rincon Del Arca", "Rincón de Maschwitz", "Rincón de Milberg", "Rincón de la Costa", "Rincón de los Sauces", "Ringuelet", "Rivadavia", "Rocha", "Rodeo de la Cruz", "Roldán", "Roosevelt", "Rosario", "Rosario de Lerma", "Rumenco", "Río Ceballos", "Río Cuarto", "Río Gallegos", "Río Grande", "Río Negro", "Río Primero", "Río Segundo", "Río Tercero", "Río de Los Sauces", "Saavedra", "Saint Matthews", "Saldán", "Salsipuedes", "Salta", "Salvador María", "San Alberto", "San Andres", "San Andrés de Giles", "San Antonio", "San Antonio De Padua", "San Antonio de Areco", "San Antonio de Arredondo", "San Benito", "San Bernardo", "San Carlos", "San Carlos Centro", "San Carlos de Bariloche", "San Clemente del Tuyú", "San Cristobal", "San Diego Country Club", "San Eliseo Country, Golf, Hotel & Spa", "San Fernando", "San Fernando del Valle de Catamarca", "San Francisco", "San Francisco Club de Campo", "San Francisco Solano", "San Francisco del Monte", "San Isidro", "San Isidro Chico", "San Javier", "San Jerónimo Norte", "San Jorge", "San Jose", "San José", "San Juan", "San Justo", "San Lorenzo", "San Lucas Village", "San Luis", "San Martín", "San Martín de los Andes", "San Miguel", "San Miguel Oeste", "San Miguel de Ghiso", "San Miguel de Tucumán", "San Miguel del Monte", "San Nicolás", "San Nicolás de los Arroyos", "San Pedro", "San Rafael", "San Ramón de la Nueva Orán", "San Roque", "San Salvador de Jujuy", "San Telmo", "San Vicente", "Santa Ana", "Santa Barbara Barrio Cerrado", "Santa Catalina", "Santa Clara del Mar", "Santa Fe", "Santa Isabel", "Santa Luisa", "Santa María", "Santa María de los Olivos", "Santa Rosa", "Santa Rosa de Calamuchita", "Santa Teresita", "Santa Trinidad", "Santa-Catalina", "Santiago Del Estero", "Santo Tomé", "Santos Lugares", "Santos Tesei", "Sarandi", "Septiembre", "Serodino", "Sierra de la Ventana", "Sierra de los Padres", "Sinsacate", "Solar del Bosque", "Solares del Talar", "Sourigues", "St. Patrick Country", "Stella Maris", "Suipacha", "Sáenz Peña", "Tafí Viejo", "Tafí del Valle", "Talar del Lago 1", "Talar del lago 2", "Tancacha", "Tandil", "Tanti", "Tapiales", "Temperley", "Terminal Nueva", "Terminal Vieja", "Terralagos", "Terravista Barrio Privado", "The Boating Club", "Tierra Del Fuego", "Tigre", "Tilisarao", "Timbúes", "Toay", "Tolosa", "Tornquist", "Torres", "Torreón", "Tortugas Country Club", "Tortuguitas", "Trelew", "Trenque Lauquen", "Tres Arroyos", "Tres de Febrero", "Trevelín", "Tribunales", "Trinidad", "Tristán Suárez", "Troncos del Talar", "Trujui", "Tucumán", "Tunuyán", "Turdera", "Unquillo", "Uribelarrea", "Valentín Alsina", "Valeria del Mar", "Valle Claro", "Valle Hermoso", "Veinticinco de Mayo", "Velez Sarsfield", "Venado Tuerto", "Versalles", "Verónica", "Vicente Casares", "Vicente López", "Victoria", "Viedma", "Vila Vela Terrazas al Lago", "Villa Adelina", "Villa Allende", "Villa Amancay", "Villa Ariza", "Villa Astolfi", "Villa Ballester", "Villa Bertha", "Villa Bonich", "Villa Bordeau", "Villa Bosch", "Villa Carlos Paz", "Villa Celina", "Villa Centenario", "Villa Cerro Azul", "Villa Ciudad Parque Los Reartes", "Villa Ciudad de América", "Villa Constitución", "Villa Crespo", "Villa Cura Brochero", "Villa Devoto", "Villa Dolores", "Villa Dominico", "Villa Elvira", "Villa Fiorito", "Villa Fontana", "Villa General Belgrano", "Villa General Mitre", "Villa Gesell", "Villa Giardino", "Villa Granaderos De San Martin", "Villa Icho Cruz", "Villa La Angostura", "Villa La Bolsa", "Villa Larca", "Villa Libertad", "Villa Llao Llao", "Villa Los Aromos", "Villa Lugano", "Villa Luro", "Villa Luzuriaga", "Villa Lynch", "Villa Lynch Pueyrredón", "Villa Madero", "Villa Maipu", "Villa Marques De Aguado", "Villa Martelli", "Villa María", "Villa Mercedes", "Villa Monteagudo", "Villa Nueva", "Villa Ortuzar", "Villa Pacheco", "Villa Paranacito", "Villa Parque Santa Ana", "Villa Parque Siquiman", "Villa Primera", "Villa Pueyrredón", "Villa Raffo", "Villa Real", "Villa Riachuelo", "Villa Rosa", "Villa Rumipal", "Villa Santa Cruz del Lago", "Villa Santa Rita", "Villa Sarmiento", "Villa Soldati", "Villa Tesei", "Villa Udaondo", "Villa Urquiza", "Villa Vatteone", "Villa Ventana", "Villa de Las Rosas", "Villa de Mayo", "Villa de Soto", "Villa del Dique", "Villa del Parque", "Villa del Totoral", "Village Golf & Tennis Country Club", "Villars", "Virasoro Village", "Virrey del Pino", "Virreyes", "Wenceslao Escalante", "Wilde", "William Morris", "Yerba Buena", "Zelaya", "Zárate", "coordenadas 34.255511", "desconocido", "Área 1 \"Nuestra Señora del Pilar\"", "Área 11 \"Nuestra Señora de Lourdes\"", "Área 8 \"Nuestra Señora de Torreciudad\""
];
const ciudadOptions = [
    "Abasto", "Achiras", "Agronomía", "Agua Blanca", "Agua de Oro", "Aguas Verdes", "Aldea Brasilera", "Alejandro Roca", "Almafuerte", "Almagro", "Almirante Brown", "Alta Gracia", "Alvear", "Anisacate", "Apóstoles", "Arequito", "Arroyo Ceibal", "Arroyo Seco", "Ascochinga", "Avellaneda", "Azara", "Azul", "Bahía Blanca", "Balcarce", "Balvanera", "Baradero", "Barracas", "Barranqueras", "Barrio Norte", "Belgrano", "Bell Ville", "Bella Vista", "Berazategui", "Berisso", "Bialet Massé", "Boca", "Boedo", "Bolívar", "Brandsen", "Buena Nueva", "Cabalango", "Caballito", "Cachi", "Cafayate", "Caleta Olivia", "Calmayo", "Camet", "Campana", "Campo Grande", "Campo Quijano", "Candelaria", "Capilla del Monte", "Capilla del Rosario", "Capitán Bermúdez", "Capitán Sarmiento", "Cariló", "Carlos Casares", "Carolina", "Carpintería", "Casa Grande", "Caseros", "Castellanos", "Catalinas", "Cañadón Seco", "Cañuelas", "Centenario", "Centro / Microcentro", "Cerrillos", "Cerro Azul", "Chacarita", "Chacras de Coria", "Chajarí", "Chapadmalal", "Chascomús", "Chicoana", "Chivilcoy", "Choele Choel", "Cinco Saltos", "Cipolletti", "Claromecó", "Coghlan", "Colastiné", "Colegiales", "Colonia Benitez", "Colonia Caroya", "Colonia Elía", "Colonia Tirolesa", "Colón", "Comodoro Rivadavia", "Concepción del Uruguay", "Concordia", "Confluencia", "Congreso", "Constitución", "Corcovado", "Coronda", "Coronel Dorrego", "Coronel Du Graty", "Coronel Moldes", "Coronel Suárez", "Corrientes", "Cosquín", "Costa Azul", "Costa Chica", "Costa Esmeralda", "Costa Uruguay Sur", "Costa del Este", "Cruz del Eje", "Cushamen", "Córdoba", "Despeñaderos", "Dina Huapi", "Distrito Audiovisual", "Distrito Tecnológico", "Distrito de las Artes", "Distrito del Deporte", "Dorrego", "Dunamar", "El Calafate", "El Chaltén", "El Dorado", "El Manantial", "El Manzano", "El Sauce", "El Tipal", "El Trapiche", "El Volcán", "Empalme Villa Constitución", "Ensenada", "Escalante", "Escobar", "Esperanza", "Esquel", "Esteban Echeverría", "Exaltación de la Cruz", "Ezeiza", "Falda del Carmen", "Federación", "Fighiera", "Florencio Varela", "Flores", "Floresta", "Formosa", "Franck", "Fray Luis Beltrán", "Funes", "Garuhapé", "Garupá", "General Alvarado", "General Alvear", "General Belgrano", "General Cabrera", "General Fernández Oro", "General Güemes", "General Lagos", "General Las Heras", "General Lavalle", "General Madariaga", "General Paz", "General Pico", "General Pinto", "General Pueyrredón", "General Roca", "General Rodríguez", "General San Martín", "Gobernador Benegas", "Godoy Cruz", "Granadero Baigorria", "Gualeguaychú", "Gálvez", "Güer Aike", "Hernando", "Huerta Grande", "Hurlingham", "Ibarlucea", "Iriondo", "Ituzaingó", "Jesús María", "José C Paz", "Juana Koslay", "Junin de los Andes", "Junín", "La Caldera", "La Calera", "La Costa", "La Cumbre", "La Cumbrecita", "La Falda", "La Granja", "La Lucila del Mar", "La Matanza", "La Paz", "La Plata", "La Punilla", "La Punta", "La Rioja", "Laboulaye", "Lago Epuyén", "Lanús", "Laprida", "Las Calles", "Las Cañitas", "Las Gaviotas", "Las Grutas", "Las Heras", "Las Palmas", "Las Rosas", "Las Toninas", "Lincoln", "Liniers", "Lobería", "Lobos", "Lomas de Zamora", "Los Cocos", "Los Hornillos", "Los Laureles", "Los Molinos", "Los Reartes", "Luis Beltrán", "Luján", "Luján de Cuyo", "Lules", "Luque", "Lácar", "Maipú", "Malabrigo", "Malagueño", "Malargüe", "Malvinas Argentinas", "Manantiales", "Manfredi", "Mar Azul", "Mar Chiquita", "Mar de Ajó", "Mar de Cobo", "Mar de las Pampas", "Mar del Plata", "Mar del Sur", "Mar del Tuyú", "Marcos Paz", "María Grande", "María Juana", "Mataderos", "Mayu Sumaj", "Mburucuyá", "Melincué", "Mendiolaza", "Mendoza", "Mercedes", "Merlo", "Mi Granja", "Mina Clavero", "Miramar", "Monje", "Monserrat", "Monte Castro", "Monte Cristo", "Monte Hermoso", "Monte Vera", "Moreno", "Morón", "Murphy", "Navarro", "Necochea", "Nelson", "Neuquén", "Nono", "Nueva Atlantis", "Nueve de Julio", "Nuñez", "Oberá", "Obispo Trejo", "Olavarría", "Oliva", "Oliveros", "Oncativo", "Once", "Oro Verde", "Ostende", "Palermo", "Pampa del Infierno", "Paraná", "Parque Avellaneda", "Parque Centenario", "Parque Chacabuco", "Parque Chas", "Parque Patricios", "Paso de la Patria", "Paso de los Libres", "Patagones", "Paternal", "Pehuajó", "Pehuen-có", "Pergamino", "Perú", "Pilar", "Pinamar", "Pinar del Sol", "Pinto", "Plottier", "Pompeya", "Posadas", "Potrerillos", "Potrero de Garay", "Potrero de los Funes", "Presidencia Roque Sáenz Peña", "Presidente Perón", "Providencia", "Pueblo Andino", "Pueblo Esther", "Puerto Esperanza", "Puerto General San Martín", "Puerto Iguazú", "Puerto Libertad", "Puerto Madero", "Puerto Madryn", "Punilla", "Punta Alta", "Punta Indio", "Pérez", "Quebracho Herrado", "Quemú Quemú", "Quilmes", "Rada Tilly", "Rafaela", "Ramallo", "Rancagua", "Rawson", "Recoleta", "Reconquista", "Recreo", "Renca", "Resistencia", "Reta", "Retiro", "Ricardone", "Rincón de los Sauces", "Rivadavia", "Rodeo de la Cruz", "Roldán", "Rosario", "Rosario de Lerma", "Río Ceballos", "Río Cuarto", "Río Gallegos", "Río Grande", "Río Primero", "Río Segundo", "Río Tercero", "Río de Los Sauces", "Saavedra", "Saldán", "Salsipuedes", "Salta", "San Agustín", "San Andrés de Giles", "San Antonio", "San Antonio de Areco", "San Antonio de Arredondo", "San Benito", "San Bernardo", "San Carlos", "San Carlos Centro", "San Carlos de Bariloche", "San Cayetano", "San Clemente del Tuyú", "San Cristobal", "San Fernando", "San Fernando del Valle de Catamarca", "San Francisco", "San Francisco del Monte", "San Isidro", "San Javier", "San Jerónimo Norte", "San Jorge", "San Juan", "San Justo", "San Lorenzo", "San Luis", "San Martín", "San Martín de los Andes", "San Miguel", "San Miguel de Tucumán", "San Miguel del Monte", "San Nicolás", "San Nicolás de los Arroyos", "San Pedro", "San Rafael", "San Ramón de la Nueva Orán", "San Roque", "San Salvador de Jujuy", "San Telmo", "San Vicente", "Santa Ana", "Santa Catalina", "Santa Clara del Mar", "Santa Fe", "Santa Luisa", "Santa María", "Santa Rosa", "Santa Rosa de Calamuchita", "Santa Teresita", "Santo Tomé", "Sauce Viejo", "Serodino", "Sierra Grande", "Sinsacate", "Suipacha", "Tafí Viejo", "Tafí del Valle", "Tancacha", "Tandil", "Tanti", "Tartagal", "Tigre", "Tilisarao", "Timbúes", "Toay", "Tornquist", "Trelew", "Trenque Lauquen", "Tres Arroyos", "Tres de Febrero", "Trevelín", "Tribunales", "Trinidad", "Tunuyán", "Unquillo", "Ushuaia", "Valeria del Mar", "Valle Hermoso", "Veinticinco de Mayo", "Velez Sarsfield", "Venado Tuerto", "Versalles", "Vicente López", "Victoria", "Viedma", "Villa Allende", "Villa Amancay", "Villa Carlos Paz", "Villa Cerro Azul", "Villa Ciudad Parque Los Reartes", "Villa Ciudad de América", "Villa Constitución", "Villa Crespo", "Villa Cura Brochero", "Villa Devoto", "Villa Dolores", "Villa Fontana", "Villa General Belgrano", "Villa General Mitre", "Villa Gesell", "Villa Giardino", "Villa Icho Cruz", "Villa La Angostura", "Villa La Bolsa", "Villa Larca", "Villa Llao Llao", "Villa Los Aromos", "Villa Lugano", "Villa Luro", "Villa María", "Villa Mercedes", "Villa Nueva", "Villa Ortuzar", "Villa Paranacito", "Villa Parque Santa Ana", "Villa Parque Siquiman", "Villa Pueyrredón", "Villa Real", "Villa Riachuelo", "Villa Rumipal", "Villa Santa Cruz del Lago", "Villa Santa Rita", "Villa Soldati", "Villa Urquiza", "Villa de Las Rosas", "Villa de Soto", "Villa del Dique", "Villa del Parque", "Villa del Totoral", "Villarino", "Wenceslao Escalante", "Yerba Buena", "Zárate", "desconocido"
];
const locationData: Record<string, { ciudades: string[]; barrios: string[] }> = {
    "Capital Federal": {
        ciudades: ["Capital Federal"],
        barrios: ["Palermo", "Belgrano", "Recoleta", "Almagro", "Caballito", "Flores", "Villa Crespo", "Balvanera", "San Telmo", "Barracas", "Boedo", "Chacarita", "Coghlan", "Colegiales", "Constitución", "Monserrat", "Nueva Pompeya", "Núñez", "Parque Avellaneda", "Parque Chacabuco", "Parque Patricios", "Puerto Madero", "Retiro", "Saavedra", "San Cristobal", "San Nicolás", "Tribunales", "Versalles", "Villa del Parque", "Villa Devoto", "Villa General Mitre", "Villa Lugano", "Villa Luro", "Villa Ortúzar", "Villa Pueyrredón", "Villa Real", "Villa Riachuelo", "Villa Santa Rita", "Villa Soldati", "Villa Urquiza"]
    },
    "Buenos Aires": {
        ciudades: ["La Plata", "Mar del Plata", "Bahía Blanca", "Tandil", "Olavarría", "Quilmes", "Lanús", "Avellaneda", "Lomas de Zamora", "Morón"],
        barrios: ["Centro", "Norte", "Sur", "Este", "Oeste", "Noroeste", "Suroeste"]
    },
    "Córdoba": {
        ciudades: ["Córdoba", "Villa Carlos Paz", "Cosquín", "Alta Gracia", "Río Cuarto"],
        barrios: ["Centro", "Nueva Córdoba", "General Paz", "Alberdi", "Cerro de las Rosas"]
    },
    "Santa Fe": {
        ciudades: ["Rosario", "Santa Fe", "Rafaela", "Venado Tuerto", "Reconquista"],
        barrios: ["Centro", "Norte", "Sur", "Oeste", "Fisherton", "Pichincha"]
    },
    "Mendoza": {
        ciudades: ["Mendoza", "Godoy Cruz", "Maipú", "Luján de Cuyo", "San Rafael"],
        barrios: ["Centro", "Godoy Cruz", "Maipú", "Chacras de Coria", "Luján de Cuyo"]
    },
    "Tucumán": {
        ciudades: ["San Miguel de Tucumán", "Tafí Viejo", "Yerba Buena", "Banda del Río Salí"],
        barrios: ["Centro", "Norte", "Sur", "Este", "Oeste", "Yerba Buena"]
    },
    "Salta": {
        ciudades: ["Salta", "San Ramón de la Nueva Orán", "Tartagal", "General Güemes"],
        barrios: ["Centro", "Norte", "Sur", "San Lorenzo", "Villa San Antonio"]
    },
    "Chaco": {
        ciudades: ["Resistencia", "Barranqueras", "Fontana", "Puerto Vilelas"],
        barrios: ["Centro", "Norte", "Sur", "Barranqueras", "Villa Don Enrique"]
    },
    "Misiones": {
        ciudades: ["Posadas", "Oberá", "Eldorado", "Puerto Iguazú", "Leandro N. Alem"],
        barrios: ["Centro", "Norte", "Sur", "Miguel Lanús", "Villa Urquiza"]
    },
    "Entre Ríos": {
        ciudades: ["Paraná", "Concordia", "Gualeguaychú", "Colón", "Concepción del Uruguay"],
        barrios: ["Centro", "Norte", "Sur", "Alto Paraná", "Villa Urquiza"]
    },
    "Bs.As. G.B.A. Zona Norte": {
        ciudades: ["San Isidro", "Vicente López", "San Fernando", "Tigre", "Escobar"],
        barrios: ["Centro", "Norte", "Sur", "Este", "Oeste"]
    },
    "Bs.As. G.B.A. Zona Oeste": {
        ciudades: ["Morón", "Hurlingham", "Ituzaingó", "Merlo", "Moreno"],
        barrios: ["Centro", "Norte", "Sur", "Este", "Oeste"]
    },
    "Bs.As. G.B.A. Zona Sur": {
        ciudades: ["Avellaneda", "Lanús", "Lomas de Zamora", "Quilmes", "Berazategui"],
        barrios: ["Centro", "Norte", "Sur", "Este", "Oeste"]
    },
    "Buenos Aires Costa Atlántica": {
        ciudades: ["Mar del Plata", "Pinamar", "Villa Gesell", "Miramar", "Necochea"],
        barrios: ["Centro", "Norte", "Sur", "Playa", "Centro"]
    },
    "Buenos Aires Interior": {
        ciudades: ["Tandil", "Olavarría", "Azul", "Bolívar", "Pergamino"],
        barrios: ["Centro", "Norte", "Sur", "Este", "Oeste"]
    },
    "Catamarca": {
        ciudades: ["San Fernando del Valle de Catamarca", "Valle Viejo", "Andalgalá"],
        barrios: ["Centro", "Norte", "Sur", "Este", "Oeste"]
    },
    "Chubut": {
        ciudades: ["Rawson", "Trelew", "Puerto Madryn", "Comodoro Rivadavia"],
        barrios: ["Centro", "Norte", "Sur", "Este", "Oeste"]
    },
    "Corrientes": {
        ciudades: ["Corrientes", "Goya", "Mercedes", "Curuzú Cuatiá"],
        barrios: ["Centro", "Norte", "Sur", "Este", "Oeste"]
    },
    "Formosa": {
        ciudades: ["Formosa", "Clorinda", "Pirané"],
        barrios: ["Centro", "Norte", "Sur", "Este", "Oeste"]
    },
    "Jujuy": {
        ciudades: ["San Salvador de Jujuy", "Palpalá", "Libertador General San Martín"],
        barrios: ["Centro", "Norte", "Sur", "Este", "Oeste"]
    },
    "La Pampa": {
        ciudades: ["Santa Rosa", "General Pico", "Toay"],
        barrios: ["Centro", "Norte", "Sur", "Este", "Oeste"]
    },
    "La Rioja": {
        ciudades: ["La Rioja", "Chilecito", "Chamical"],
        barrios: ["Centro", "Norte", "Sur", "Este", "Oeste"]
    },
    "Neuquén": {
        ciudades: ["Neuquén", "Cipolletti", "Plottier", "Centenario"],
        barrios: ["Centro", "Norte", "Sur", "Este", "Oeste"]
    },
    "Río Negro": {
        ciudades: ["Viedma", "San Carlos de Bariloche", "General Roca", "Cipolletti"],
        barrios: ["Centro", "Norte", "Sur", "Este", "Oeste"]
    },
    "San Juan": {
        ciudades: ["San Juan", "Rawson", "Chimbas"],
        barrios: ["Centro", "Norte", "Sur", "Este", "Oeste"]
    },
    "San Luis": {
        ciudades: ["San Luis", "Villa Mercedes", "Merlo"],
        barrios: ["Centro", "Norte", "Sur", "Este", "Oeste"]
    },
    "Santa Cruz": {
        ciudades: ["Río Gallegos", "Caleta Olivia", "Pico Truncado"],
        barrios: ["Centro", "Norte", "Sur", "Este", "Oeste"]
    },
    "Santiago Del Estero": {
        ciudades: ["Santiago del Estero", "La Banda", "Termas de Río Hondo"],
        barrios: ["Centro", "Norte", "Sur", "Este", "Oeste"]
    },
    "Tierra Del Fuego": {
        ciudades: ["Ushuaia", "Río Grande"],
        barrios: ["Centro", "Norte", "Sur", "Este", "Oeste"]
    },
    "desconocido": {
        ciudades: ["Desconocido"],
        barrios: ["Desconocido"]
    }
};

const provinciaOptions = [
    "Capital Federal",
    "Córdoba",
    "Santa Fe",
    "Mendoza",
    "Tucumán",
    "Salta",
    "Chaco",
    "Misiones",
    "Entre Ríos",
    "Bs.As. G.B.A. Zona Norte",
    "Bs.As. G.B.A. Zona Oeste",
    "Bs.As. G.B.A. Zona Sur",
    "Buenos Aires Costa Atlántica",
    "Buenos Aires Interior",
    "Catamarca",
    "Chubut",
    "Corrientes",
    "Formosa",
    "Jujuy",
    "La Pampa",
    "La Rioja",
    "Neuquén",
    "Río Negro",
    "San Juan",
    "San Luis",
    "Santa Cruz",
    "Santiago Del Estero",
    "Tierra Del Fuego"
];

export default function TasacionForm() {
    const [form, setForm] = useState<PropertyData>(initialFormState);
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
    const [selectedProvincia, setSelectedProvincia] = useState<string>('');
    const [selectedCiudad, setSelectedCiudad] = useState<string>('');
    const [ciudadOptions, setCiudadOptions] = useState<string[]>([]);
    const [barrioOptions, setBarrioOptions] = useState<string[]>([]);
    const [result, setResult] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [useMLModel, setUseMLModel] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((prev: PropertyData) => ({ ...prev, [name]: value }));
    };

    const handleFeatureChange = (feature: string, checked: boolean) => {
        if (checked) {
            setSelectedFeatures(prev => [...prev, feature]);
        } else {
            setSelectedFeatures(prev => prev.filter(f => f !== feature));
        }
    };

    const handleProvinciaChange = (value: string) => {
        setSelectedProvincia(value);
        setForm((prev: PropertyData) => ({ ...prev, provincia: value }));
        setResult(null); // Reset result when location changes
        if (value && locationData[value as keyof typeof locationData]) {
            setCiudadOptions(locationData[value as keyof typeof locationData].ciudades);
            setSelectedCiudad('');
            setBarrioOptions([]);
            setForm((prev: PropertyData) => ({ ...prev, ciudad: '', barrio: '' }));
        } else {
            setCiudadOptions([]);
            setBarrioOptions([]);
        }
    };

    const handleCiudadChange = (value: string) => {
        setSelectedCiudad(value);
        setForm((prev: PropertyData) => ({ ...prev, ciudad: value }));
        setResult(null); // Reset result when location changes
        if (selectedProvincia && value && locationData[selectedProvincia as keyof typeof locationData]) {
            setBarrioOptions(locationData[selectedProvincia as keyof typeof locationData].barrios);
            setForm((prev: PropertyData) => ({ ...prev, barrio: '' }));
        }
    };

    const isFormValid = () => {
        return (
            form.property_type &&
            form.provincia &&
            form.ciudad &&
            form.barrio &&
            form.area_total &&
            form.area_covered &&
            form.rooms &&
            form.bathrooms
        );
    };

    // Auto-recalculate when form changes and result exists
    useEffect(() => {
        if (result !== null && isFormValid()) {
            const timer = setTimeout(() => {
                handleSubmit(new Event('submit') as any);
            }, 500); // Debounce for 500ms
            return () => clearTimeout(timer);
        }
    }, [form, selectedFeatures]);

    const handleFillExample = () => {
        setForm(exampleProperty);
        setSelectedFeatures(['pileta', 'sum', 'seguridad', 'cochera', 'balcon']);
        setSelectedProvincia('Capital Federal');
        setSelectedCiudad('Capital Federal');
        setCiudadOptions(locationData['Capital Federal'].ciudades);
        setBarrioOptions(locationData['Capital Federal'].barrios);
        setResult(null); // Reset result when loading example
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setLoading(true);
        setResult(null);
        setError(null);

        try {
            const apiData = {
                rooms: form.rooms ? Number(form.rooms) : null,
                bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
                surface_total: form.area_total ? Number(form.area_total) : null,
                surface_covered: form.area_covered ? Number(form.area_covered) : null,
                floor: form.floor ? Number(form.floor) : null,
                lat: null,
                lon: null,
                property_type: form.property_type,
                location: form.barrio || `${form.ciudad}, ${form.provincia}`,
                description: selectedFeatures.join(', '),
                expenses: form.expenses ? Number(form.expenses) : null,
                construction_year: form.construction_year ? Number(form.construction_year) : null
            };

            const url = useMLModel ? '/api/predict?useML=true' : '/api/predict';
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(apiData)
            });

            if (!response.ok) {
                throw new Error(`Error en la API: ${response.status}`);
            }

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }

            setResult(data.prediction);

        } catch (err: any) {
            setError(`Error en la predicción: ${err.message}`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    const renderInputField = (name: keyof PropertyData, label: string, icon: React.ReactNode, type = "text", placeholder = " ") => (
        <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 pointer-events-none">
                {icon}
            </span>
            <input
                name={name as string}
                type={type}
                placeholder={label}
                value={(form as any)[name] || ''}
                onChange={handleChange}
                className="w-full border bg-gray-50 pl-10 p-3 rounded-xl text-black
                focus:ring-2 focus:ring-black focus:bg-white transition-all
                placeholder-transparent peer"
            />
            <label className="absolute left-9 -top-2.5 text-gray-500 text-sm bg-white px-1 transition-all
                peer-placeholder-shown:top-3 peer-placeholder-shown:text-base
                peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-black">
                {label}
            </label>
        </div>
    );

    const renderSelectField = (name: keyof PropertyData, label: string, icon: React.ReactNode, options: string[], disabled: boolean = false, onChange?: (value: string) => void) => (
        <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 pointer-events-none">
                {icon}
            </span>
            <select
                name={name as string}
                value={(form as any)[name] || ''}
                onChange={(e) => onChange ? onChange(e.target.value) : handleChange(e)}
                disabled={disabled}
                className="w-full border bg-gray-50 pl-10 p-3 rounded-xl text-black
                focus:ring-2 focus:ring-black focus:bg-white transition-all appearance-none disabled:bg-gray-100 disabled:text-gray-400"
            >
                <option value="">{disabled ? `Selecciona ${label.toLowerCase()} primero` : label}</option>
                {options.map(option => (
                    <option key={option} value={option}>{option}</option>
                ))}
            </select>
            <label className="absolute left-9 -top-2.5 text-gray-500 text-sm bg-white px-1 transition-all">
                {label}
            </label>
        </div>
    );

    return (
        <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-semibold text-gray-900 flex items-center gap-3">
                    <Home className="w-7 h-7 text-black" />
                    Tasador de Inmuebles
                </h2>
                <div className="flex items-center gap-4">
                    <label className="flex items-center space-x-2 text-sm">
                        <input
                            type="checkbox"
                            checked={useMLModel}
                            onChange={(e) => setUseMLModel(e.target.checked)}
                            className="rounded border-gray-300 text-black focus:ring-black"
                        />
                        <span className="text-gray-700">Usar Modelo IA</span>
                    </label>
                    <button
                        type="button"
                        onClick={handleFillExample}
                        className="text-sm bg-gray-100 text-gray-800 px-3 py-1 rounded-lg hover:bg-gray-200 transition"
                    >
                        Usar Ejemplo
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {renderSelectField("property_type", "Tipo de Propiedad", <Landmark />, propertyTypeOptions)}
                    {renderSelectField("provincia", "Provincia", <MapPin />, provinciaOptions, false, handleProvinciaChange)}
                    {renderSelectField("ciudad", "Ciudad", <MapPin />, ciudadOptions, !selectedProvincia, handleCiudadChange)}
                    {renderSelectField("barrio", "Barrio", <MapPin />, barrioOptions, !selectedCiudad)}
                   {renderInputField("area_total", "Área Total (m²)", <Ruler />, "number")}
                   {renderInputField("area_covered", "Área Cubierta (m²)", <Ruler />, "number")}
                   {renderInputField("rooms", "Ambientes", <Building2 />, "number")}
                   {renderInputField("bedrooms", "Dormitorios", <BedDouble />, "number")}
                   {renderInputField("bathrooms", "Baños", <Bath />, "number")}
                   {renderInputField("floor", "Piso", <Hash />, "number")}
                   {renderInputField("construction_year", "Año de Construcción", <Clock />, "number")}
                   {renderInputField("expenses", "Expensas (ARS)", <CircleDollarSign />, "number")}
                </div>
                
                <div className="mt-5">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Características Adicionales
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {commonFeatures.map(feature => (
                            <label key={feature} className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={selectedFeatures.includes(feature)}
                                    onChange={(e) => handleFeatureChange(feature, e.target.checked)}
                                    className="rounded border-gray-300 text-black focus:ring-black"
                                />
                                <span className="text-sm text-gray-700 capitalize">{feature}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading || !isFormValid()}
                    className="w-full mt-8 bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {loading ? 'Calculando...' : !isFormValid() ? 'Complete todos los campos requeridos' : `Calcular Tasación${useMLModel ? ' (IA)' : ' (Rápido)'}`}
                </button>
            </form>

            {error && (
                <div className="mt-6 p-4 bg-red-100 text-red-700 rounded-xl border border-red-200">
                    <p className="font-semibold">Error</p>
                    <p>{error}</p>
                </div>
            )}

            {result !== null && (
                <div className="mt-6 p-5 bg-green-50 rounded-xl border border-green-200 text-center">
                    <p className="text-gray-600 text-lg">Valor Estimado (USD)</p>
                    <p className="font-bold text-green-700 text-4xl mt-2">
                        ${result.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>
            )}
        </div>
    );
}