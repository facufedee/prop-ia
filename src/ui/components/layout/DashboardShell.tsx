"use client";

import { useState } from "react";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";
import DashboardFooter from "./DashboardFooter";
import ChatPanel from "@/ui/components/chat/ChatPanel";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <DashboardHeader onMobileMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-950" data-dashboard>
          {children}
        </main>

        <DashboardFooter />
      </div>

      {/* Floating AI chat — visible on all screen sizes */}
      <ChatPanel />
    </div>
  );
}