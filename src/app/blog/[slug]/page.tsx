import { blogService } from "@/infrastructure/services/blogService";
import Link from "next/link";
import { ArrowLeft, Calendar, User, Clock } from "lucide-react";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import ShareButtons from "../components/ShareButtons";

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const post = await blogService.getPostBySlug(slug);

    if (!post) return { title: "Artículo no encontrado" };

    return {
        title: `${post.title} - Blog Prop-IA`,
        description: post.excerpt,
        openGraph: {
            title: post.title,
            description: post.excerpt,
            images: post.imageUrl ? [post.imageUrl] : [],
            type: "article",
            publishedTime: post.publishedAt instanceof Date ? post.publishedAt.toISOString() : (post.publishedAt as any)?.toDate?.().toISOString(),
            authors: [post.author?.name || "Prop-IA"],
        }
    };
}

export const revalidate = 60;

export default async function BlogPostPage({ params }: Props) {
    const { slug } = await params;
    const post = await blogService.getPostBySlug(slug);

    if (!post) {
        notFound();
    }

    // Suggested posts (excluding current)
    const relatedPosts = await blogService.getRelatedPosts(post.slug, 3);
    // Wait, getRelatedPosts expects ID or similar. Currently implementation passes string. 
    // But getPostBySlug returns ID inside post object. 
    // And getRelatedPosts in service filters by ID. 
    // Let's pass post.id if available, but service signature currently takes string currentId
    // I need to make sure I am passing the ID to filter out correctly. 
    // The previous implementation used `filter(post => post.id !== currentId)`. 
    // So I should pass the ID.
    const related = post.id ? await blogService.getRelatedPosts(post.id) : [];

    // Simple reading time calc
    const words = post.content.split(/\s+/).length;
    const readTime = Math.ceil(words / 200);

    return (
        <main className="bg-white min-h-screen pb-24">

            {/* Header / Hero */}
            <div className="relative h-[400px] md:h-[500px] w-full bg-gray-900 flex items-center justify-center overflow-hidden">
                {post.imageUrl && (
                    <>
                        <div className="absolute inset-0 bg-black/60 z-10" />
                        <Image
                            src={post.imageUrl}
                            alt={post.title}
                            fill
                            priority
                            className="object-cover z-0"
                            sizes="100vw"
                        />
                    </>
                )}

                <div className="relative z-20 max-w-4xl mx-auto px-6 text-center text-white space-y-6">
                    <span className="inline-block px-4 py-1.5 bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 backdrop-blur-sm rounded-full text-sm font-medium">
                        {post.category}
                    </span>
                    <h1 className="text-3xl md:text-5xl font-bold leading-tight">
                        {post.title}
                    </h1>

                    <div className="flex items-center justify-center gap-6 text-gray-300 text-sm md:text-base">
                        <div className="flex items-center gap-2">
                            {post.author?.photo ? (
                                <img src={post.author.photo} alt={post.author.name} className="w-8 h-8 rounded-full border border-gray-500" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                                    <User size={14} />
                                </div>
                            )}
                            <span className="font-medium text-white">{post.author?.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Calendar size={16} />
                            {post.publishedAt
                                ? (post.publishedAt instanceof Date ? post.publishedAt.toLocaleDateString() : (post.publishedAt as any)?.toDate?.().toLocaleDateString())
                                : "-"
                            }
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Clock size={16} />
                            {readTime} min lectura
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <div className="max-w-3xl mx-auto px-6 -mt-20 relative z-30">
                <article className="bg-white rounded-2xl p-8 md:p-12 shadow-xl border border-gray-100">

                    {/* Share Buttons (Top) */}
                    <ShareButtons title={post.title} slug={post.slug} />

                    {/* Excerpt */}
                    <p className="text-xl md:text-2xl text-gray-600 font-serif leading-relaxed mb-10 italic border-l-4 border-indigo-500 pl-6">
                        {post.excerpt}
                    </p>

                    {/* Main Text */}
                    <div className="prose prose-lg prose-indigo max-w-none text-gray-700">
                        <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                            {post.content}
                        </ReactMarkdown>
                    </div>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                        <div className="mt-8 flex flex-wrap gap-2">
                            {post.tags.map(tag => (
                                <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full font-medium shadow-sm">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="mt-12 pt-8 border-t border-gray-100 flex justify-between items-center">
                        <Link href="/blog" className="text-gray-500 hover:text-indigo-600 font-medium flex items-center gap-2 transition-colors">
                            <ArrowLeft size={18} />
                            Volver al Blog
                        </Link>
                    </div>

                </article>
            </div>

            {/* Related Posts */}
            {related.length > 0 && (
                <div className="max-w-7xl mx-auto px-6 mt-24">
                    <h3 className="text-2xl font-bold text-gray-900 mb-8">Artículos Relacionados</h3>
                    <div className="grid md:grid-cols-3 gap-8">
                        {related.map((p) => (
                            <Link key={p.id} href={`/blog/${p.slug}`} className="group">
                                <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all">
                                    <div className="aspect-video overflow-hidden relative">
                                        {p.imageUrl ? (
                                            <Image
                                                src={p.imageUrl}
                                                alt={p.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform"
                                                sizes="(max-width: 768px) 100vw, 33vw"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-100" />
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <div className="text-xs text-indigo-600 font-semibold mb-2">{p.category}</div>
                                        <h4 className="font-bold text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                            {p.title}
                                        </h4>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

        </main>
    );
}
