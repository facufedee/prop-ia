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

    const chipClass = (active: boolean) =>
        `shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            active ? "bg-indigo-600 text-white" : "bg-white text-gray-700 ring-1 ring-gray-200 hover:ring-indigo-300 hover:text-indigo-600"
        }`;

    return (
        <section aria-labelledby="all-posts" className="border-t border-gray-200 pt-10">
            <div className="mb-6 flex flex-col gap-4">
                <h2 id="all-posts" className="text-2xl font-semibold text-gray-900">
                    {selected ?? "Más artículos"}
                </h2>
                {categories.length > 1 && (
                    <div role="group" aria-label="Filtrar por categoría" className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
                        <button type="button" aria-pressed={selected === null} onClick={() => selectCategory(null)} className={chipClass(selected === null)}>
                            Todos
                        </button>
                        {categories.map((category) => (
                            <button
                                key={category}
                                type="button"
                                aria-pressed={selected === category}
                                onClick={() => selectCategory(category)}
                                className={chipClass(selected === category)}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {visible.length === 0 ? (
                <p className="py-12 text-center text-gray-500">Ya viste todos los artículos de arriba.</p>
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
                        className="rounded-full bg-white px-6 py-3 text-sm font-medium text-gray-900 ring-1 ring-gray-200 transition-colors hover:text-indigo-600 hover:ring-indigo-300"
                    >
                        Ver más artículos ({filtered.length - limit})
                    </button>
                </div>
            )}
        </section>
    );
}
