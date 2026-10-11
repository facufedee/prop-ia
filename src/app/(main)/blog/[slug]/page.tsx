import { blogService } from "@/infrastructure/services/blogService";
import Link from "next/link";
import { ArrowLeft, ArrowRight, User } from "lucide-react";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Metadata } from "next";
import { formatPostDate, getReadingMinutes, pickRelatedPosts, toPostDate } from "@/lib/blog/blogLayout";
import ShareButtons from "../components/ShareButtons";
import { ArticleMarkdown } from "../components/ArticleMarkdown";
import { CategoryBadge, PostCard } from "../components/BlogCards";
import { toCardData } from "../toCardData";

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const post = await blogService.getPostBySlug(slug);

    if (!post) return { title: "Artículo no encontrado" };

    const url = `https://zetaprop.com.ar/blog/${post.slug}`;

    return {
        title: `${post.title} - Blog Zeta Prop`,
        description: post.excerpt,
        // The (main) layout sets canonical to the homepage; without overriding it here,
        // LinkedIn/WhatsApp/Facebook resolve the shared link to the homepage instead of the post.
        alternates: { canonical: url },
        openGraph: {
            url,
            siteName: "Zeta Prop",
            locale: "es_AR",
            title: post.title,
            description: post.excerpt,
            images: post.imageUrl ? [post.imageUrl] : [],
            type: "article",
            publishedTime: toPostDate(post.publishedAt)?.toISOString(),
            authors: [post.author?.name || "Zeta Prop"],
        },
        // Without this, Next.js inherits the root layout's site-wide `twitter` block
        // wholesale (it only merges metadata per top-level key, not per sub-field), so
        // every blog post shared on X/Twitter showed the generic logo instead of its
        // own cover image.
        twitter: {
            card: "summary_large_image",
            title: post.title,
            description: post.excerpt,
            images: post.imageUrl ? [post.imageUrl] : [],
        },
    };
}

export const revalidate = 60;

export default async function BlogPostPage({ params }: Props) {
    const { slug } = await params;
    const post = await blogService.getPostBySlug(slug);

    if (!post) {
        notFound();
    }

    const allPosts = (await blogService.getPublishedPosts().catch(() => [])).map(toCardData);
    const related = pickRelatedPosts(allPosts, post.slug, 3);

    const date = toPostDate(post.publishedAt) ?? toPostDate(post.createdAt);
    const readingMinutes = getReadingMinutes(post.content);
    const authorName = post.author?.name || "Equipo Zeta Prop";

    return (
        <main className="min-h-screen bg-white pb-24">
            {/* Header */}
            <header className="mx-auto max-w-3xl px-5 pt-24 sm:px-6 md:pt-32">
                <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-indigo-600">
                    <ArrowLeft size={16} />
                    Blog
                </Link>

                <div className="mt-6">
                    <CategoryBadge category={post.category} />
                </div>

                <h1 className="mt-4 text-3xl font-bold leading-[1.15] tracking-tight text-gray-900 sm:text-4xl md:text-5xl">{post.title}</h1>

                {post.excerpt && <p className="mt-5 text-lg leading-relaxed text-gray-600 md:text-xl">{post.excerpt}</p>}

                <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-gray-100 py-4">
                    <div className="flex items-center gap-3">
                        {post.author?.photo ? (
                            <Image src={post.author.photo} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                                <User size={18} aria-hidden />
                            </div>
                        )}
                        <div className="text-sm">
                            <p className="font-medium text-gray-900">{authorName}</p>
                            <p className="flex items-center gap-2 text-gray-500">
                                {date && <time dateTime={date.toISOString()}>{formatPostDate(date)}</time>}
                                {date && <span aria-hidden className="h-1 w-1 rounded-full bg-gray-400" />}
                                <span>{readingMinutes} min de lectura</span>
                            </p>
                        </div>
                    </div>
                    <div className="lg:hidden">
                        <ShareButtons title={post.title} slug={post.slug} excerpt={post.excerpt} />
                    </div>
                </div>
            </header>

            {/* Cover */}
            {post.imageUrl && (
                <div className="mx-auto mt-10 max-w-5xl px-5 sm:px-6">
                    <div className="relative aspect-[16/9] overflow-hidden rounded-3xl bg-gray-100">
                        <Image src={post.imageUrl} alt={post.title} fill priority sizes="(max-width: 1024px) 100vw, 1024px" className="object-cover" />
                    </div>
                </div>
            )}

            {/* Body with sticky share rail on desktop */}
            <div className="relative mx-auto mt-12 max-w-3xl px-5 sm:px-6">
                <aside className="absolute inset-y-0 -left-20 hidden lg:block" aria-label="Compartir artículo">
                    <div className="sticky top-32">
                        <ShareButtons title={post.title} slug={post.slug} excerpt={post.excerpt} variant="rail" />
                    </div>
                </aside>

                <article>
                    <ArticleMarkdown content={post.content} />
                </article>

                {post.tags && post.tags.length > 0 && (
                    <ul className="mt-10 flex flex-wrap gap-2" aria-label="Etiquetas">
                        {post.tags.map((tag) => (
                            <li key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
                                #{tag}
                            </li>
                        ))}
                    </ul>
                )}

                <div className="mt-12 flex flex-col gap-4 rounded-3xl bg-gray-50 p-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="font-semibold text-gray-900">¿Te resultó útil?</p>
                        <p className="text-sm text-gray-600">Compartilo con tu equipo o con un colega.</p>
                    </div>
                    <ShareButtons title={post.title} slug={post.slug} excerpt={post.excerpt} />
                </div>
            </div>

            {/* Related */}
            {related.length > 0 && (
                <section aria-labelledby="related-posts" className="mx-auto mt-24 max-w-7xl px-5 sm:px-6">
                    <div className="mb-8 flex items-end justify-between gap-4 border-t border-gray-200 pt-10">
                        <h2 id="related-posts" className="text-2xl font-semibold text-gray-900">Seguí leyendo</h2>
                        <Link href="/blog" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                            Ver todo el blog
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {related.map((p) => (
                            <li key={p.slug}>
                                <PostCard post={p} />
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </main>
    );
}
