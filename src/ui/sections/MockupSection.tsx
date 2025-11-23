export function MockupSection() {
    return (
        <section className="py-24 bg-white px-6">
            <div className="max-w-6xl mx-auto text-center mb-12">
                <h2 className="text-4xl font-bold">Una plataforma moderna y clara</h2>
                <p className="text-gray-600 mt-2">Diseñada para que trabajes más rápido y con menos esfuerzo.</p>
            </div>

            <div className="flex justify-center px-4">
                <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden relative">
                    {/* Mockup Header */}
                    <div className="bg-gray-50 border-b border-gray-100 p-4 flex items-center gap-4">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        </div>
                        <div className="flex-1 bg-white h-8 rounded-lg border border-gray-200 mx-4 max-w-md"></div>
                    </div>

                    {/* Mockup Body */}
                    <div className="p-6 grid md:grid-cols-3 gap-6 bg-gray-50/50">
                        {/* Sidebar Mockup */}
                        <div className="hidden md:block space-y-4">
                            <div className="h-8 bg-gray-200 rounded-lg w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>

                        {/* Main Content Mockup */}
                        <div className="md:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <div className="h-8 bg-gray-900 rounded-lg w-1/3"></div>
                                <div className="h-8 bg-green-100 rounded-lg w-24"></div>
                            </div>
                            <div className="space-y-4">
                                <div className="h-32 bg-gray-100 rounded-xl animate-pulse"></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="h-20 bg-gray-50 rounded-xl"></div>
                                    <div className="h-20 bg-gray-50 rounded-xl"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}