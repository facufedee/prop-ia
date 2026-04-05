import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { adminDb } from "@/infrastructure/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";

interface PostSummary {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    imageUrl: string;
    category: string;
    author?: { name: string; photo?: string };
    publishedAt?: Date;
}

async function getLatestPosts(): Promise<PostSummary[]> {
    try {
        const now = new Date();
        const snap = await adminDb
            .collection("blog_posts")
            .where("published", "==", true)
            .orderBy("createdAt", "desc")
            .limit(10) // fetch extra to account for expiry/future filtering
            .get();

        const posts = snap.docs.map((docSnap) => {
            const d = docSnap.data();
            const pubDate = d.publishedAt instanceof Timestamp ? d.publishedAt.toDate() : (d.publishedAt ?? null);
            const expDate = d.expiresAt instanceof Timestamp ? d.expiresAt.toDate() : (d.expiresAt ?? null);

            // Filter scheduled / expired
            if (pubDate && pubDate > now) return null;
            if (expDate && expDate < now) return null;

            let excerpt = d.excerpt;
            if (!excerpt && d.content) {
                const plainText = d.content.replace(/[#*`_\[\]]/g, "").replace(/\n/g, " ").trim();
                excerpt = plainText.substring(0, 150);
            }

            return {
                id: docSnap.id,
                title: d.title ?? "",
                slug: d.slug ?? "",
                excerpt: excerpt ?? "",
                content: d.content ?? "",
                imageUrl: d.imageUrl ?? "",
                category: d.category ?? "",
                author: d.author,
                publishedAt: pubDate ?? undefined,
            } satisfies PostSummary;
        });

        return (posts.filter(Boolean) as PostSummary[]).slice(0, 3);
    } catch (error) {
        console.error("Failed to fetch latest posts (server)", error);
        return [];
    }
}

export default async function LatestBlogPosts() {
    const posts = await getLatestPosts();

    if (posts.length === 0) return null;

    return (
        <section className="py-14 sm:py-20 lg:py-24 bg-white">
            <div className="max-w-7xl mx-auto px-5 sm:px-6">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div>
                        <span className="inline-block px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-semibold mb-4">
                            BLOG & NOVEDADES
                        </span>
                        <h2 className="text-4xl font-bold text-gray-900">
                            Últimas publicaciones
                        </h2>
                    </div>
                    <Link
                        href="/blog"
                        className="group flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-800 transition-colors"
                    >
                        Ver todos los artículos
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {posts.map((post) => {
                        const words = post.content.split(/\s+/).length;
                        const readTime = Math.ceil(words / 200);
                        const dateStr = post.publishedAt
                            ? post.publishedAt.toLocaleDateString("es-AR")
                            : "";

                        return (
                            <Link key={post.id} href={`/blog/${post.slug}`} className="group flex flex-col h-full bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300">
                                {/* Image */}
                                <div className="relative aspect-[16/10] overflow-hidden">
                                    {post.imageUrl ? (
                                        <Image
                                            src={post.imageUrl}
                                            alt={post.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            sizes="(max-width: 768px) 100vw, 33vw"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                                            Sin imagen
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 text-xs font-bold text-gray-900 rounded-full">
                                        {post.category}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex flex-col flex-1 p-6">
                                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                                        {dateStr && (
                                            <span className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                {dateStr}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <Clock size={14} />
                                            {readTime} min
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                        {post.title}
                                    </h3>

                                    <p className="text-gray-600 text-sm mb-4 flex-1">
                                        {post.excerpt.length > 100 ? `${post.excerpt.substring(0, 100)}... ` : post.excerpt}
                                        <span className="text-indigo-600 font-medium hover:underline inline-block ml-1">
                                            Leer mas
                                        </span>
                                    </p>

                                    {post.author?.name && (
                                        <div className="flex items-center gap-2 pt-4 border-t border-gray-50 mt-auto">
                                            <div className="relative w-6 h-6 rounded-full bg-gray-200 overflow-hidden">
                                                {post.author.photo ? (
                                                    <Image src={post.author.photo} alt={post.author.name} fill className="object-cover" sizes="24px" />
                                                ) : (
                                                    <div className="w-full h-full bg-indigo-100" />
                                                )}
                                            </div>
                                            <span className="text-xs font-medium text-gray-700">
                                                {post.author.name}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
