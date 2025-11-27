import Link from "next/link";

export default function AccessDeniedPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
                <p className="text-lg text-gray-600 mb-8">
                    Necesitas iniciar sesión o registrarte para acceder a esta página.
                </p>
                <div className="flex gap-4 justify-center">
                    <Link
                        href="/login"
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
                    >
                        Iniciar sesión
                    </Link>
                    <Link
                        href="/register"
                        className="px-6 py-3 border border-gray-300 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition"
                    >
                        Registrarse
                    </Link>
                </div>
            </div>
        </div>
    );
}
