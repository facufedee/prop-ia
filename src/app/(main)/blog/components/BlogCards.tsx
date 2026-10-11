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
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-300">
            <ImageOff size={28} aria-hidden />
        </div>
    );
}

export function PostMeta({ post, className = "text-gray-500" }: { post: BlogCardData; className?: string }) {
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
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                inverted ? "bg-white/90 text-indigo-700 backdrop-blur" : "bg-indigo-50 text-indigo-700"
            }`}
        >
            <span aria-hidden className="h-2 w-2 rounded-full bg-indigo-600" />
            {category}
        </span>
    );
}

export function FeaturedPost({ post }: { post: BlogCardData }) {
    return (
        <article className="group relative flex min-h-[340px] overflow-hidden rounded-3xl bg-gray-900 sm:min-h-[420px] lg:h-full">
            <CoverImage post={post} priority sizes="(max-width: 1024px) 100vw, 66vw" />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-950/40 to-transparent" />
            <div className="relative mt-auto w-full space-y-3 p-6 sm:p-8">
                <CategoryBadge category={post.category} inverted />
                <h2 className="max-w-2xl text-2xl font-semibold leading-tight text-white sm:text-3xl">
                    <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 focus:outline-none focus-visible:underline">
                        {post.title}
                    </Link>
                </h2>
                <PostMeta post={post} className="text-gray-300" />
            </div>
        </article>
    );
}

export function LatestPostItem({ post }: { post: BlogCardData }) {
    return (
        <article className="group relative flex gap-4">
            <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                <CoverImage post={post} sizes="96px" />
            </div>
            <div className="min-w-0 space-y-1.5">
                <h3 className="line-clamp-3 text-sm font-medium leading-snug text-gray-900 transition-colors group-hover:text-indigo-600">
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
        <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white p-2 transition-shadow duration-300 hover:shadow-lg">
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-gray-100">
                <CoverImage post={post} sizes="(max-width: 640px) 85vw, (max-width: 1024px) 45vw, 30vw" />
            </div>
            <div className="flex flex-1 flex-col gap-3 p-4">
                <div>
                    <CategoryBadge category={post.category} />
                </div>
                <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-gray-900 transition-colors group-hover:text-indigo-600">
                    <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 focus:outline-none focus-visible:underline">
                        {post.title}
                    </Link>
                </h3>
                <p className="line-clamp-3 text-sm leading-relaxed text-gray-600">{post.excerpt}</p>
                <PostMeta post={post} className="mt-auto pt-2 text-gray-500" />
            </div>
        </article>
    );
}
