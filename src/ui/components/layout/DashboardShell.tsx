"use client";

import { useState } from "react";
import DashboardSidebar from "./DashboardSidebar";
import Footer from "./Footer";
import { Menu } from "lucide-react";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-[calc(100vh-65px)] bg-gray-50">
      <div className="flex flex-1 relative">
        {/* Mobile Header Toggle */}
        <div className="md:hidden absolute top-4 left-4 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 md:p-6 w-full overflow-x-hidden">
          <div className="md:hidden h-12 mb-4" /> {/* Spacer for mobile toggle */}
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}