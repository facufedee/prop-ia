import { db, storage } from "@/infrastructure/firebase/client";
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export interface BlogPost {
    id?: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    imageUrl: string;
    category: string;
    author: {
        name: string;
        photo?: string;
        uid?: string;
    };
    published: boolean;
    publishedAt?: Timestamp | Date;
    expiresAt?: Timestamp | Date;
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
}

const COLLECTION_NAME = "blog_posts";

export const blogService = {
    // Implement Image Upload
    async uploadImage(file: File): Promise<string> {
        try {
            if (!storage) throw new Error("Storage not initialized");
            // Create a unique filename
            const filename = `blog/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
            const storageRef = ref(storage, filename);

            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            return downloadURL;
        } catch (error) {
            console.error("Error uploading image:", error);
            throw error;
        }
    },

    // Get all posts (for dashboard)
    async getAllPosts(): Promise<BlogPost[]> {
        try {
            if (!db) throw new Error("Firestore not initialized");
            const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as BlogPost));
        } catch (error) {
            console.error("Error fetching all blog posts:", error);
            throw error;
        }
    },

    // Get only published posts (for public site)
    async getPublishedPosts(): Promise<BlogPost[]> {
        try {
            if (!db) throw new Error("Firestore not initialized");
            const now = new Date();

            // Note: Complex queries with multiple fields might require an index in Firestore
            // For now we filter in memory if the dataset is small, or simple query
            // Strategy: Get all published content and filter expiration in client to avoid index issues initially
            const q = query(
                collection(db, COLLECTION_NAME),
                where("published", "==", true),
                orderBy("createdAt", "desc")
            );

            const snapshot = await getDocs(q);
            const posts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as BlogPost));

            // Client-side filtering for expiration and scheduled publication if needed
            return posts.filter(post => {
                const pubDate = post.publishedAt instanceof Timestamp ? post.publishedAt.toDate() : post.publishedAt;
                const expDate = post.expiresAt instanceof Timestamp ? post.expiresAt.toDate() : post.expiresAt;

                // If publishedAt is in the future, don't show yet
                if (pubDate && pubDate > now) return false;

                // If expiresAt is in the past, don't show
                if (expDate && expDate < now) return false;

                return true;
            });

        } catch (error) {
            console.error("Error fetching published blog posts:", error);
            throw error;
        }
    },

    // Get single post by ID
    async getPostById(id: string): Promise<BlogPost | null> {
        try {
            if (!db) throw new Error("Firestore not initialized");
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as BlogPost;
            }
            return null;
        } catch (error) {
            console.error("Error fetching blog post by ID:", error);
            throw error;
        }
    },

    // Get single post by Slug (for public site)
    async getPostBySlug(slug: string): Promise<BlogPost | null> {
        try {
            if (!db) throw new Error("Firestore not initialized");
            const q = query(collection(db, COLLECTION_NAME), where("slug", "==", slug), where("published", "==", true));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                return { id: doc.id, ...doc.data() } as BlogPost;
            }
            return null;
        } catch (error) {
            console.error("Error fetching blog post by slug:", error);
            throw error;
        }
    },

    // Create new post
    async createPost(post: Omit<BlogPost, "id" | "createdAt" | "updatedAt">): Promise<string> {
        try {
            if (!db) throw new Error("Firestore not initialized");
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...post,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            });
            return docRef.id;
        } catch (error) {
            console.error("Error creating blog post:", error);
            throw error;
        }
    },

    // Update existing post
    async updatePost(id: string, post: Partial<BlogPost>): Promise<void> {
        try {
            if (!db) throw new Error("Firestore not initialized");
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, {
                ...post,
                updatedAt: Timestamp.now()
            });
        } catch (error) {
            console.error("Error updating blog post:", error);
            throw error;
        }
    },

    // Delete post
    async deletePost(id: string): Promise<void> {
        try {
            if (!db) throw new Error("Firestore not initialized");
            const docRef = doc(db, COLLECTION_NAME, id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting blog post:", error);
            throw error;
        }
    },

    // Get related posts (simple implementation: recent posts excluding current)
    async getRelatedPosts(currentId: string, limitCount: number = 3): Promise<BlogPost[]> {
        try {
            // Get published posts (using existing logic)
            const allPublished = await this.getPublishedPosts();

            // Filter current and slice
            return allPublished
                .filter(post => post.id !== currentId)
                .slice(0, limitCount);

        } catch (error) {
            console.error("Error fetching related posts:", error);
            return [];
        }
    }
};
