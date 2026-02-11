import { Home, Key, Users, Building2, Briefcase, Calculator, Users2 } from "lucide-react";

export interface TutorialStep {
    title: string;
    description: string;
    image?: string; // Placeholder for future
}

export interface Tutorial {
    id: string;
    title: string;
    description: string;
    icon: any;
    steps: TutorialStep[];
}

export const TUTORIALS: Tutorial[] = [
    {
        id: "carga-propiedades",
        title: "Carga de Propiedades",
        description: "Aprende a publicar una nueva propiedad en el sistema paso a paso.",
        icon: Home,
        steps: [
            {
                title: "Acceder al Módulo",
                description: "Dirígete a la sección **Propiedades** en el menú lateral."
            },
            {
                title: "Nueva Propiedad",
                description: "Haz clic en el botón **+ Nueva Propiedad** ubicado en la esquina superior derecha."
            },
            {
                title: "Información Básica",
                description: "Completa los datos principales: Título, Descripción, Tipo de Operación (Venta/Alquiler) y Tipo de Propiedad (Casa, Departamento, etc.)."
            },
            {
                title: "Ubicación",
                description: "Ingresa la dirección exacta. El sistema intentará ubicarla en el mapa automáticamente. Puedes ajustar el pin si es necesario."
            },
            {
                title: "Características",
                description: "Detalla las características: Ambientes, Dormitorios, Baños, Superficie Total y Cubierta, Cocheras, etc."
            },
            {
                title: "Multimedia",
                description: "Sube las fotos de la propiedad. Puedes arrastrar y soltar las imágenes. Recuerda que la primera será la portada."
            },
            {
                title: "Propietario",
                description: "Asigna un propietario existente o crea uno nuevo desde el mismo formulario."
            },
            {
                title: "Guardar",
                description: "Revisa la información y haz clic en **Guardar Propiedad**."
            }
        ]
    },
    {
        id: "carga-inquilinos",
        title: "Carga de Inquilinos",
        description: "Registra nuevos inquilinos para asociarlos a contratos.",
        icon: Users,
        steps: [
            {
                title: "Acceder a Clientes",
                description: "Ve a la sección **Clientes** en el menú lateral."
            },
            {
                title: "Nuevo Cliente",
                description: "Haz clic en **+ Nuevo Cliente**."
            },
            {
                title: "Tipo de Cliente",
                description: "Selecciona **Inquilino** en el tipo de cliente."
            },
            {
                title: "Datos Personales",
                description: "Completa Nombre, Apellido, DNI/CUIT, Email y Teléfono. Es importante que el email sea válido para las notificaciones."
            },
            {
                title: "Guardar",
                description: "Haz clic en **Guardar Cliente**. Ahora podrás buscarlo al crear un contrato de alquiler."
            }
        ]
    },
    {
        id: "carga-propietarios",
        title: "Carga de Propietarios",
        description: "Da de alta propietarios para asignarles sus inmuebles.",
        icon: Users2,
        steps: [
            {
                title: "Acceder a Clientes",
                description: "Ve a la sección **Clientes** en el menú lateral."
            },
            {
                title: "Nuevo Cliente",
                description: "Haz clic en **+ Nuevo Cliente**."
            },
            {
                title: "Tipo de Cliente",
                description: "Selecciona **Propietario**."
            },
            {
                title: "Datos de Contacto",
                description: "Carga todos los datos requeridos. Si es una empresa, puedes usar el campo de Razón Social."
            },
            {
                title: "Datos Bancarios (Opcional)",
                description: "Puedes agregar datos bancarios en las notas internas para futuras transferencias de alquileres."
            },
            {
                title: "Guardar",
                description: "Guarda el perfil. Ya está listo para asignarle propiedades."
            }
        ]
    },
    {
        id: "carga-alquileres",
        title: "Carga de Alquileres",
        description: "Crea y administra contratos de alquiler.",
        icon: Key,
        steps: [
            {
                title: "Módulo Alquileres",
                description: "Ingresa a **Alquileres** desde el menú."
            },
            {
                title: "Nuevo Contrato",
                description: "Presiona **+ Nuevo Contrato**."
            },
            {
                title: "Seleccionar Propiedad",
                description: "Busca y selecciona la propiedad que se va a alquilar (debe estar cargada previamente)."
            },
            {
                title: "Inquilino y Garantes",
                description: "Selecciona el Inquilino principal y, si corresponde, agrega los datos de los garantes."
            },
            {
                title: "Condiciones",
                description: "Define fecha de inicio, duración (meses), monto del alquiler, moneda, día de vencimiento y tipo de ajuste."
            },
            {
                title: "Crear Contrato",
                description: "Al finalizar, se generará el contrato y el sistema creará automáticamente las cuotas/periodos a cobrar."
            }
        ]
    },
    {
        id: "carga-emprendimientos",
        title: "Carga de Emprendimientos",
        description: "Gestiona desarrollos inmobiliarios y sus unidades.",
        icon: Building2,
        steps: [
            {
                title: "Sección Emprendimientos",
                description: "Navega a **Emprendimientos**."
            },
            {
                title: "Nuevo Desarrollo",
                description: "Click en **+ Nuevo Emprendimiento**."
            },
            {
                title: "Datos del Proyecto",
                description: "Nombre del proyecto, Ubicación, Descripción general, Amenities y Fecha de entrega estimada."
            },
            {
                title: "Unidades Funcionales",
                description: "Una vez creado el emprendimiento, podrás agregar las unidades funcionales (departamentos, cocheras, locales) asociadas a él."
            },
            {
                title: "Estado de Avance",
                description: "Puedes ir actualizando el estado de avance de la obra para informar a los inversores."
            }
        ]
    },
    {
        id: "carga-consorcio",
        title: "Carga de Consorcio",
        description: "Guía para la administración de consorcios.",
        icon: Briefcase,
        steps: [
            {
                title: "Nota Importante",
                description: "Actualmente la gestión de consorcios se realiza a través del módulo de **Emprendimientos** o mediante propiedades etiquetadas."
            },
            {
                title: "Crear Consorcio",
                description: "Crea un nuevo Emprendimiento o Propiedad tipo 'Edificio' para agrupar las unidades."
            },
            {
                title: "Asignar Unidades",
                description: "Carga cada departamento como una unidad funcional ligada a ese edificio."
            },
            {
                title: "Gastos Comunes",
                description: "Utiliza el módulo de Finanzas para registrar expensas y gastos comunes asociados al edificio."
            }
        ]
    },
    {
        id: "tasador-online",
        title: "Tasador Online",
        description: "Utiliza la inteligencia artificial para tasar propiedades.",
        icon: Calculator,
        steps: [
            {
                title: "Acceso",
                description: "Ingresa a **Tasación IA** en el menú."
            },
            {
                title: "Datos de la Propiedad",
                description: "Ingresa la ubicación exacta y las características principales (m2, ambientes, antigüedad)."
            },
            {
                title: "Análisis Comparativo",
                description: "El sistema buscará propiedades similares en la zona (comparables) que estén o hayan estado a la venta."
            },
            {
                title: "Resultado",
                description: "Obtendrás un rango de precio estimado (Mínimo, Promedio, Máximo) y un precio sugerido de publicación."
            },
            {
                title: "Reporte",
                description: "Puedes descargar un PDF con el reporte de tasación para presentar al cliente."
            }
        ]
    }
];
