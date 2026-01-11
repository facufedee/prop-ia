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
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Nuevo Artículo</h1>
                    <p className="text-gray-500">Crear una nueva publicación para el blog</p>
                </div>
            </div>

            <BlogForm />
        </div>
    );
}
