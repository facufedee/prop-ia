"use client";

import BlogForm from "../components/BlogForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewPostPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/blog"
                    className="p-2 hover:bg-[var(--color-paper-3)] rounded-lg text-[var(--color-ink-2)] transition-colors"
                >
                    <ArrowLeft strokeWidth={1.5} size={20} />
                </Link>
                <div>
                    <h1 className="font-heading text-2xl font-bold text-[var(--color-ink)]">Nuevo Artículo</h1>
                    <p className="text-[var(--color-muted)]">Crear una nueva publicación para el blog</p>
                </div>
            </div>

            <BlogForm />
        </div>
    );
}
