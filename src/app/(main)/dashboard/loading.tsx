export default function DashboardLoadingScreen() {
    return (
        <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
            <div className="text-center space-y-6">
                {/* Custom loading image */}
                <div className="flex justify-center mb-8">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 rounded-2xl blur-3xl opacity-30 animate-pulse" />
                        <img
                            src="/assets/img/loading.png"
                            alt="Cargando Zeta Prop"
                            className="relative h-20 w-auto animate-pulse"
                        />
                    </div>
                </div>

                {/* Loading dots animation */}
                <div className="flex justify-center gap-2">
                    <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>

                {/* Loading text */}
                <p className="text-sm text-gray-500 font-medium">Cargando tu dashboard...</p>
            </div>
        </div>
    );
}
