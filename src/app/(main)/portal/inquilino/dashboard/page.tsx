import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";

// Same secret as route
const PORTAL_JWT_SECRET = process.env.PORTAL_JWT_SECRET || "default_portal_secret_key_12345";

export default async function TenantDashboardPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('portal_all_token')?.value;

    if (!token) {
        redirect("/portal/inquilino/login");
    }

    let payload: any = {};
    try {
        const verified = await jwtVerify(
            token,
            new TextEncoder().encode(PORTAL_JWT_SECRET)
        );
        payload = verified.payload;
    } catch (e) {
        redirect("/portal/inquilino/login");
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    Hola, {payload.tenantName || 'Inquilino'}
                </h1>
                <p className="text-gray-500 mt-1">
                    Estás viendo el detalle del contrato <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{payload.contractId}</span>
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Estado de Cuenta</h3>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-gray-700 font-medium">Al día</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mt-2">$ 450.000</p>
                    <p className="text-sm text-gray-400">Próximo vencimiento: 10/02/2026</p>

                    <button className="mt-6 w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700">
                        Ver Cupón de Pago
                    </button>
                </div>

                {/* Contract Info */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Mi Alquiler</h3>
                    <ul className="space-y-3 text-sm text-gray-600">
                        <li className="flex justify-between">
                            <span>Dirección:</span>
                            <span className="font-medium text-gray-900">Av. Libertador 1234, 4A</span>
                        </li>
                        <li className="flex justify-between">
                            <span>Inicio Contrato:</span>
                            <span className="font-medium text-gray-900">01/01/2024</span>
                        </li>
                        <li className="flex justify-between">
                            <span>Fin Contrato:</span>
                            <span className="font-medium text-gray-900">01/01/2027</span>
                        </li>
                        <li className="flex justify-between">
                            <span>Ajuste:</span>
                            <span className="font-medium text-gray-900">Semestral (ICL)</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Simulated Payments History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800">Historial de Pagos</h3>
                </div>
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 font-medium text-gray-500">Periodo</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Fecha Pago</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Monto</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        <tr>
                            <td className="px-6 py-4">Enero 2026</td>
                            <td className="px-6 py-4">05/01/2026</td>
                            <td className="px-6 py-4 font-medium">$ 450.000</td>
                            <td className="px-6 py-4">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs fonts-medium bg-green-100 text-green-800">Pagado</span>
                            </td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4">Diciembre 2025</td>
                            <td className="px-6 py-4">08/12/2025</td>
                            <td className="px-6 py-4 font-medium">$ 420.000</td>
                            <td className="px-6 py-4">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs fonts-medium bg-green-100 text-green-800">Pagado</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
