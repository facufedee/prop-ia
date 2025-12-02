import { db } from "@/infrastructure/firebase/client";
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
    Timestamp
} from "firebase/firestore";

export interface BlogPost {
    id?: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    image: string;
    category: string;
    author: string;
    published: boolean;
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
}

const COLLECTION_NAME = "blog_posts";

export const blogService = {
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
            const q = query(
                collection(db, COLLECTION_NAME),
                where("published", "==", true),
                orderBy("createdAt", "desc")
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as BlogPost));
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
    }
};
