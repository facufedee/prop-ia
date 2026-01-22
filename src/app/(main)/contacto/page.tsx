import ContactForm from "@/ui/sections/ContactForm";

export const metadata = {
    title: "Contacto | CRM Inmobiliario | Gestión de Propiedades | Alquileres | Compra y Venta | Zeta Prop",
    description: "Contacta con el equipo de Zeta Prop. Estamos para ayudarte a potenciar tu inmobiliaria con nuestra tecnología.",
};

export default function ContactPage() {
    return (
        <main className="pt-32">
            <ContactForm />
        </main>
    );
}
