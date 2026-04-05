import { adminDb } from "@/infrastructure/firebase/admin";
import { PublicProperty, PublicAgency } from "./publicService";
import { BlogPost } from "./blogService";

const PROPERTIES_COLLECTION = "properties";
const USERS_COLLECTION = "users";
const BLOG_COLLECTION = "blog_posts";

export const publicServerService = {
    // Get featured properties for landing page
    getFeaturedProperties: async (limitCount: number = 8): Promise<PublicProperty[]> => {
        try {
            const snapshot = await adminDb.collection(PROPERTIES_COLLECTION)
                .where("publishToPortal", "==", true)
                .limit(100) // Fetch more to shuffle like the client does
                .get();

            const properties = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Ensure dates are serialized
                    createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
                } as PublicProperty;
            });

            // Shuffle and slice
            const shuffled = properties.sort(() => Math.random() - 0.5);
            const featured = shuffled.slice(0, limitCount);

            // Populate agency data
            const featuredWithAgency = await Promise.all(featured.map(async (p) => {
                const agency = await publicServerService.getAgencyById(p.userId);
                return { ...p, agency };
            }));

            return JSON.parse(JSON.stringify(featuredWithAgency)); // Ensure full serialization
        } catch (error) {
            console.error("Error fetching featured properties on server:", error);
            return [];
        }
    },

    // Get published blog posts for landing page
    getPublishedBlogPosts: async (limitCount: number = 4): Promise<BlogPost[]> => {
        try {
            const now = new Date();
            const snapshot = await adminDb.collection(BLOG_COLLECTION)
                .where("published", "==", true)
                .orderBy("createdAt", "desc")
                .limit(limitCount * 2) // Fetch more to filter expired in-memory if needed
                .get();

            const posts = snapshot.docs.map(doc => {
                const data = doc.data();
                
                // Excerpt generation if missing
                let excerpt = data.excerpt;
                if (!excerpt && data.content) {
                    const plainText = data.content
                        .replace(/[#*`_\[\]]/g, '')
                        .replace(/\n/g, ' ')
                        .trim();
                    excerpt = plainText.substring(0, 150);
                }

                return {
                    id: doc.id,
                    ...data,
                    excerpt,
                    // Serialize dates
                    publishedAt: data.publishedAt?.toDate?.()?.toISOString() || data.publishedAt,
                    createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
                    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
                } as BlogPost;
            });

            // Additional filtering (expiration)
            const filteredPosts = posts.filter(post => {
                if (post.expiresAt) {
                    const expDate = new Date(post.expiresAt as any);
                    if (expDate < now) return false;
                }
                return true;
            }).slice(0, limitCount);

            return JSON.parse(JSON.stringify(filteredPosts));
        } catch (error) {
            console.error("Error fetching blog posts on server:", error);
            return [];
        }
    },

    // Helper: Get Agency by ID
    getAgencyById: async (uid: string): Promise<PublicAgency | undefined> => {
        if (!uid) return undefined;
        try {
            const userDoc = await adminDb.collection(USERS_COLLECTION).doc(uid).get();
            if (userDoc.exists) {
                const data = userDoc.data()!;
                return {
                    uid: userDoc.id,
                    displayName: data.displayName || "Inmobiliaria",
                    agencyName: data.agencyName,
                    photoURL: data.photoURL,
                    logoUrl: data.logoUrl,
                    email: data.email,
                    phoneNumber: data.phoneNumber,
                    slug: publicServerService.slugify(data.displayName || "agency")
                };
            }
        } catch (error) {
            console.error("Error fetching agency on server:", error);
        }
        return undefined;
    },

    slugify: (text: string) => {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-');
    }
};
