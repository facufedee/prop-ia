import { z } from "zod";
import { CAROUSEL_TOPICS } from "@/lib/social/carouselTopics";

// Shape and limits of an Instagram carousel draft (Firestore `social_carousels`,
// doc id = topic number). The limits keep every text inside its slide box at
// the sizes used by /api/social/carousel/[id]/image.

export const CAROUSEL_COLLECTION = "social_carousels";

export const CAROUSEL_LIMITS = {
    coverTitle: 100,
    listHeading: 50,
    itemTitle: 45,
    itemDetail: 90,
    itemsPerSlide: 5,
    maxListSlides: 2,
    caption: 2200, // Instagram caption limit
    hashtags: 30, // Instagram hashtag limit
} as const;

export type CarouselStatus = "draft" | "published";

export interface CarouselItem {
    title: string;
    detail: string;
}

export interface CarouselDraftInput {
    topicNumber: number;
    coverTitle: string;
    listHeading: string;
    slides: CarouselItem[][];
    caption: string;
}

const text = (field: string, max: number) =>
    z
        .string({ required_error: `${field} is required`, invalid_type_error: `${field} must be a string` })
        .trim()
        .min(1, `${field} must not be empty`)
        .max(max, `${field} must be at most ${max} characters`);

const itemSchema = z.object({
    title: text("item title", CAROUSEL_LIMITS.itemTitle),
    detail: text("item detail", CAROUSEL_LIMITS.itemDetail),
});

const topicNumbers = new Set(CAROUSEL_TOPICS.map((t) => t.number));

export const carouselDraftSchema = z.object({
    topicNumber: z
        .number({ required_error: "topicNumber is required", invalid_type_error: "topicNumber must be a number" })
        .int("topicNumber must be an integer")
        .refine((n) => topicNumbers.has(n), "topicNumber must be a topic of the bank (1-100)"),
    coverTitle: text("coverTitle", CAROUSEL_LIMITS.coverTitle),
    listHeading: text("listHeading", CAROUSEL_LIMITS.listHeading),
    slides: z
        .array(
            z.array(itemSchema).length(CAROUSEL_LIMITS.itemsPerSlide, `each slide must have exactly ${CAROUSEL_LIMITS.itemsPerSlide} items`),
            { required_error: "slides is required", invalid_type_error: "slides must be an array" }
        )
        .min(1, "slides must have 1 or 2 list slides")
        .max(CAROUSEL_LIMITS.maxListSlides, "slides must have 1 or 2 list slides"),
    caption: text("caption", CAROUSEL_LIMITS.caption).refine(
        (caption) => (caption.match(/#[\p{L}\p{N}_]+/gu) ?? []).length <= CAROUSEL_LIMITS.hashtags,
        `caption must have at most ${CAROUSEL_LIMITS.hashtags} hashtags`
    ),
});

export type ParseResult = { ok: true; data: CarouselDraftInput } | { ok: false; error: string };

export function parseCarouselDraft(input: unknown): ParseResult {
    const result = carouselDraftSchema.safeParse(input);
    if (result.success) return { ok: true, data: result.data };
    const error = result.error.issues
        .map((issue) => (issue.path.length ? `${issue.path.join(".")}: ${issue.message}` : issue.message))
        .join("; ");
    return { ok: false, error };
}
