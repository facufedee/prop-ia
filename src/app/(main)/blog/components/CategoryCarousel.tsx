"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PostCard, type BlogCardData } from "./BlogCards";

export function CategoryCarousel({ title, posts }: { title: string; posts: BlogCardData[] }) {
    const headingId = `carousel-${title.normalize("NFD").replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}`;
    const trackRef = useRef<HTMLUListElement>(null);
    const [canPrev, setCanPrev] = useState(false);
    const [canNext, setCanNext] = useState(false);

    const updateButtons = useCallback(() => {
        const el = trackRef.current;
        if (!el) return;
        setCanPrev(el.scrollLeft > 4);
        setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }, []);

    useEffect(() => {
        updateButtons();
        window.addEventListener("resize", updateButtons);
        return () => window.removeEventListener("resize", updateButtons);
    }, [updateButtons]);

    const scroll = (direction: 1 | -1) => {
        const el = trackRef.current;
        if (!el) return;
        el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: "smooth" });
    };

    const buttonClass = "s-icon-btn";

    return (
        <section aria-labelledby={headingId} className="s-blog-section">
            <div className="mb-6 flex items-center justify-between gap-4">
                <h2 id={headingId} className="s-blog-h2">
                    {title}
                </h2>
                <div className="flex gap-2">
                    <button type="button" onClick={() => scroll(-1)} disabled={!canPrev} aria-label={`Anteriores de ${title}`} className={buttonClass}>
                        <ArrowLeft size={18} />
                    </button>
                    <button type="button" onClick={() => scroll(1)} disabled={!canNext} aria-label={`Siguientes de ${title}`} className={buttonClass}>
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>
            <ul
                ref={trackRef}
                onScroll={updateButtons}
                className="-mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-5 px-5 pb-4 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 [&::-webkit-scrollbar]:hidden"
            >
                {posts.map((post) => (
                    <li key={post.slug} className="w-[85%] shrink-0 snap-start sm:w-[calc(50%-10px)] lg:w-[calc((100%-40px)/3)]">
                        <PostCard post={post} />
                    </li>
                ))}
            </ul>
        </section>
    );
}
