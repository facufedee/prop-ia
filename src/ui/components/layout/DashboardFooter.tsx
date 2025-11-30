export default function DashboardFooter() {
    return (
        <footer className="bg-white border-t border-gray-200 py-4 px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-2 text-sm text-gray-500">
                <p>© {new Date().getFullYear()} PROP-IA. Todos los derechos reservados.</p>
                <p>Hecho con ❤️ en Buenos Aires</p>
            </div>
        </footer>
    );
}
