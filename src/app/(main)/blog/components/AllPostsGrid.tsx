"use client";

import { useMemo, useState } from "react";
import { PostCard, type BlogCardData } from "./BlogCards";

interface AllPostsGridProps {
    /** Posts not already shown above the fold; displayed when no category is selected. */
    rest: BlogCardData[];
    /** Every post, used when filtering by category. */
    all: BlogCardData[];
    categories: string[];
}

const PAGE_SIZE = 9;

export function AllPostsGrid({ rest, all, categories }: AllPostsGridProps) {
    const [selected, setSelected] = useState<string | null>(null);
    const [limit, setLimit] = useState(PAGE_SIZE);

    const filtered = useMemo(
        () => (selected ? all.filter((post) => post.category === selected) : rest),
        [selected, all, rest],
    );
    const visible = filtered.slice(0, limit);

    const selectCategory = (category: string | null) => {
        setSelected(category);
        setLimit(PAGE_SIZE);
    };

    if (rest.length === 0 && categories.length < 2) return null;

    return (
        <section aria-labelledby="all-posts" className="s-blog-section">
            <div className="mb-6 flex flex-col gap-4">
                <h2 id="all-posts" className="s-blog-h2">
                    {selected ?? "Más artículos"}
                </h2>
                {categories.length > 1 && (
                    <div role="group" aria-label="Filtrar por categoría" className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
                        <button type="button" aria-pressed={selected === null} onClick={() => selectCategory(null)} className="s-chip">
                            Todos
                        </button>
                        {categories.map((category) => (
                            <button
                                key={category}
                                type="button"
                                aria-pressed={selected === category}
                                onClick={() => selectCategory(category)}
                                className="s-chip"
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {visible.length === 0 ? (
                <p className="py-12 text-center text-[var(--color-ink-2)]">Ya viste todos los artículos de arriba.</p>
            ) : (
                <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {visible.map((post) => (
                        <li key={post.slug}>
                            <PostCard post={post} />
                        </li>
                    ))}
                </ul>
            )}
            {filtered.length > limit && (
                <div className="mt-10 flex justify-center">
                    <button
                        type="button"
                        onClick={() => setLimit((current) => current + PAGE_SIZE)}
                        className="l-btn l-btn--secondary min-h-11 cursor-pointer font-[inherit]"
                    >
                        Ver más artículos ({filtered.length - limit})
                    </button>
                </div>
            )}
        </section>
    );
}
