import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar, Clock, Newspaper } from "lucide-react";
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
        <section className="l-section l-section--tight">
            <div className="l-container">
                <div className="l-blog__head">
                    <div>
                        <span className="l-kicker">
                            <Newspaper size={14} />
                            Blog & novedades
                        </span>
                        <h2 className="l-section__title" style={{ marginBottom: 0 }}>Últimas publicaciones</h2>
                    </div>
                    <Link href="/blog" className="l-blog__see-all">
                        Ver todos los artículos
                        <ArrowRight size={18} />
                    </Link>
                </div>

                <div className="l-blog__grid">
                    {posts.map((post) => {
                        const words = post.content.split(/\s+/).length;
                        const readTime = Math.ceil(words / 200);
                        const dateStr = post.publishedAt
                            ? post.publishedAt.toLocaleDateString("es-AR")
                            : "";

                        return (
                            <Link key={post.id} href={`/blog/${post.slug}`} className="l-blog-card">
                                <div className="l-blog-card__image">
                                    {post.imageUrl ? (
                                        <Image
                                            src={post.imageUrl}
                                            alt={post.title}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, 33vw"
                                        />
                                    ) : (
                                        <div className="l-blog-card__placeholder">Sin imagen</div>
                                    )}
                                    <span className="l-blog-card__category">{post.category}</span>
                                </div>

                                <div className="l-blog-card__body">
                                    <div className="l-blog-card__meta">
                                        {dateStr && (
                                            <span><Calendar size={13} /> {dateStr}</span>
                                        )}
                                        <span><Clock size={13} /> {readTime} min</span>
                                    </div>

                                    <h3 className="l-blog-card__title">{post.title}</h3>

                                    <p className="l-blog-card__excerpt">
                                        {post.excerpt.length > 100 ? `${post.excerpt.substring(0, 100)}... ` : post.excerpt}
                                        <span className="l-blog-card__read-more">Leer más</span>
                                    </p>

                                    {post.author?.name && (
                                        <div className="l-blog-card__author">
                                            <div className="l-blog-card__avatar">
                                                {post.author.photo && (
                                                    <Image src={post.author.photo} alt={post.author.name} fill className="object-cover" sizes="24px" />
                                                )}
                                            </div>
                                            <span className="l-blog-card__author-name">{post.author.name}</span>
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
