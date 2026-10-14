export default function DashboardFooter() {
    return (
        <footer className="bg-[var(--color-paper)] border-t border-[var(--color-rule)] py-4 px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-[var(--color-muted)]">
                <p>© {new Date().getFullYear()} Zeta Prop. Todos los derechos reservados.</p>
                <p>Hecho en Ituzaingó, Buenos Aires</p>
            </div>
        </footer>
    );
}
