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
        // The (main) layout template appends the brand.
        title: post.title,
        description: post.excerpt,
        // Self-canonical so shares (LinkedIn/WhatsApp/Facebook) and search resolve to the post.
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
        <main className="flex-1 pb-24">
            {/* Header */}
            <header className="mx-auto max-w-3xl px-5 pt-28 sm:px-6 md:pt-32">
                <Link href="/blog" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[var(--color-ink-2)] transition-colors hover:text-[var(--color-ink)]">
                    <ArrowLeft size={16} />
                    Blog
                </Link>

                <div className="mt-4">
                    <CategoryBadge category={post.category} />
                </div>

                <h1 className="mt-4 font-[family-name:var(--font-heading)] text-3xl font-medium leading-[1.1] tracking-[-0.03em] text-balance text-[var(--color-ink)] sm:text-4xl md:text-5xl">{post.title}</h1>

                {post.excerpt && <p className="mt-5 text-lg leading-relaxed text-[var(--color-ink-2)] md:text-xl">{post.excerpt}</p>}

                <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-[var(--color-rule)] py-4">
                    <div className="flex items-center gap-3">
                        {post.author?.photo ? (
                            <Image src={post.author.photo} alt="" width={40} height={40} className="h-10 w-10 rounded-full border border-[var(--color-rule)] object-cover" />
                        ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-rule)] bg-[var(--color-paper-3)] text-[var(--color-ink-2)]">
                                <User size={18} aria-hidden />
                            </div>
                        )}
                        <div className="text-sm">
                            <p className="font-medium text-[var(--color-ink)]">{authorName}</p>
                            <p className="flex flex-wrap items-center gap-2 text-[var(--color-muted)]">
                                {date && <time dateTime={date.toISOString()}>{formatPostDate(date)}</time>}
                                {date && <span aria-hidden className="h-1 w-1 rounded-full bg-current opacity-60" />}
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
                    <div className="relative aspect-[16/9] overflow-hidden rounded-3xl border border-[var(--color-rule-2)] bg-[var(--color-paper-2)]">
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
                            <li key={tag} className="rounded-full border border-[var(--color-rule)] bg-[var(--color-paper-2)] px-3 py-1 text-sm font-medium text-[var(--color-ink-2)]">
                                #{tag}
                            </li>
                        ))}
                    </ul>
                )}

                <div className="mt-12 flex flex-col gap-4 rounded-3xl border border-[var(--color-rule-2)] bg-[var(--color-paper-2)] p-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="font-[family-name:var(--font-heading)] font-semibold text-[var(--color-ink)]">¿Te resultó útil?</p>
                        <p className="text-sm text-[var(--color-ink-2)]">Compartilo con tu equipo o con un colega.</p>
                    </div>
                    <ShareButtons title={post.title} slug={post.slug} excerpt={post.excerpt} />
                </div>
            </div>

            {/* Related */}
            {related.length > 0 && (
                <section aria-labelledby="related-posts" className="mx-auto mt-24 max-w-7xl px-5 sm:px-6">
                    <div className="s-blog-section mb-8 flex flex-wrap items-end justify-between gap-4">
                        <h2 id="related-posts" className="s-blog-h2">Seguí leyendo</h2>
                        <Link href="/blog" className="l-link-arrow min-h-11 text-sm">
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
