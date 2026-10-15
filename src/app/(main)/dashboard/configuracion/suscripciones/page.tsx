"use client";

import { useState } from "react";
import { Users, Layers } from "lucide-react";
import { RoleProtection } from "@/ui/components/auth/RoleProtection";
import SubscribersTab from "./components/SubscribersTab";
import PlansTab from "./components/PlansTab";

type TabType = "subscriptions" | "plans";

export default function SubscriptionsPage() {
    const [activeTab, setActiveTab] = useState<TabType>("subscriptions");
    const [isEditing, setIsEditing] = useState(false);

    const tabs = [
        { id: "subscriptions" as TabType, label: "Suscripciones", icon: Users },
        { id: "plans" as TabType, label: "Planes", icon: Layers },
    ];

    return (
        <RoleProtection requiredPermission="/dashboard/configuracion/suscripciones">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="font-heading text-2xl font-bold text-[var(--color-ink)]">Planes y Suscripciones</h1>
                    <p className="text-[var(--color-muted)]">Gestiona los suscriptores y planes de la plataforma</p>
                </div>

                {/* Tabs */}
                {!isEditing && (
                    <div className="border-b border-[var(--color-rule)]">
                        <nav className="flex gap-6">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${isActive
                                                ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                                                : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink-2)] hover:border-[var(--color-neutral)]'
                                            }`}
                                    >
                                        <Icon strokeWidth={1.5} size={18} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                )}

                {/* Tab Content */}
                <div>
                    {activeTab === "subscriptions" && <SubscribersTab />}
                    {activeTab === "plans" && <PlansTab onEditingChange={setIsEditing} />}
                </div>
            </div>
        </RoleProtection>
    );
}
