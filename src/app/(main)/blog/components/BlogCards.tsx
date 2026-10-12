import Link from "next/link";
import Image from "next/image";
import { ImageOff } from "lucide-react";

export interface BlogCardData {
    slug: string;
    title: string;
    excerpt: string;
    imageUrl: string;
    category: string;
    authorName: string;
    dateLabel: string | null;
    readingMinutes: number;
}

function CoverImage({ post, sizes, priority = false, className = "" }: { post: BlogCardData; sizes: string; priority?: boolean; className?: string }) {
    return post.imageUrl ? (
        <Image
            src={post.imageUrl}
            alt=""
            fill
            priority={priority}
            sizes={sizes}
            className={`object-cover transition-transform duration-500 group-hover:scale-105 ${className}`}
        />
    ) : (
        <div className="s-blog-cover-empty">
            <ImageOff size={28} aria-hidden />
        </div>
    );
}

export function PostMeta({ post, className = "text-[var(--color-muted)]" }: { post: BlogCardData; className?: string }) {
    return (
        <p className={`flex items-center gap-2 text-xs ${className}`}>
            {post.dateLabel && <span>{post.dateLabel}</span>}
            {post.dateLabel && <span aria-hidden className="h-1 w-1 rounded-full bg-current opacity-60" />}
            <span>{post.readingMinutes} min de lectura</span>
        </p>
    );
}

export function CategoryBadge({ category, inverted = false }: { category: string; inverted?: boolean }) {
    if (!category) return null;
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-[var(--color-accent)] ${
                inverted ? "border border-[var(--color-rule)] bg-[var(--glass)] backdrop-blur" : "bg-[var(--color-accent-soft)]"
            }`}
        >
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
            {category}
        </span>
    );
}

export function FeaturedPost({ post }: { post: BlogCardData }) {
    return (
        <article className="group relative flex min-h-[340px] overflow-hidden rounded-3xl border border-[var(--color-rule-2)] bg-[var(--color-paper-2)] sm:min-h-[420px] lg:h-full">
            <CoverImage post={post} priority sizes="(max-width: 1024px) 100vw, 66vw" />
            <div aria-hidden className="s-blog-scrim" />
            <div className="relative mt-auto w-full space-y-3 p-6 sm:p-8">
                <CategoryBadge category={post.category} inverted />
                <h2 className="max-w-2xl font-[family-name:var(--font-heading)] text-2xl font-medium leading-tight tracking-[-0.03em] text-[var(--color-ink)] sm:text-3xl">
                    <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 focus:outline-none focus-visible:underline">
                        {post.title}
                    </Link>
                </h2>
                <PostMeta post={post} className="text-[var(--color-ink-2)]" />
            </div>
        </article>
    );
}

export function LatestPostItem({ post }: { post: BlogCardData }) {
    return (
        <article className="group relative flex gap-4">
            <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl border border-[var(--color-rule-2)] bg-[var(--color-paper-3)]">
                <CoverImage post={post} sizes="96px" />
            </div>
            <div className="min-w-0 space-y-1.5">
                <h3 className="line-clamp-3 text-sm font-medium leading-snug text-[var(--color-ink)] transition-colors group-hover:text-[var(--color-accent-2)]">
                    <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 focus:outline-none focus-visible:underline">
                        {post.title}
                    </Link>
                </h3>
                <PostMeta post={post} />
            </div>
        </article>
    );
}

export function PostCard({ post }: { post: BlogCardData }) {
    return (
        <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-rule-2)] bg-[var(--color-paper-2)] p-2 transition-colors duration-300 hover:border-[var(--color-rule)] hover:bg-[var(--color-paper-3)]">
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-[var(--color-paper-3)]">
                <CoverImage post={post} sizes="(max-width: 640px) 85vw, (max-width: 1024px) 45vw, 30vw" />
            </div>
            <div className="flex flex-1 flex-col gap-3 p-4">
                <div>
                    <CategoryBadge category={post.category} />
                </div>
                <h3 className="line-clamp-2 font-[family-name:var(--font-heading)] text-lg font-medium leading-snug tracking-[-0.02em] text-[var(--color-ink)] transition-colors group-hover:text-[var(--color-accent-2)]">
                    <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 focus:outline-none focus-visible:underline">
                        {post.title}
                    </Link>
                </h3>
                <p className="line-clamp-3 text-sm leading-relaxed text-[var(--color-ink-2)]">{post.excerpt}</p>
                <PostMeta post={post} className="mt-auto pt-2 text-[var(--color-muted)]" />
            </div>
        </article>
    );
}
