import type { BlogPost } from "@/infrastructure/services/blogService";
import { formatPostDate, getReadingMinutes, toPostDate } from "@/lib/blog/blogLayout";
import type { BlogCardData } from "./components/BlogCards";

export function toCardData(post: BlogPost): BlogCardData {
    const date = toPostDate(post.publishedAt) ?? toPostDate(post.createdAt);
    return {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        imageUrl: post.imageUrl,
        category: post.category,
        authorName: post.author?.name || "Equipo Zeta Prop",
        dateLabel: date ? formatPostDate(date) : null,
        readingMinutes: getReadingMinutes(post.content),
    };
}
