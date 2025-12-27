export interface ContactMessage {
    id?: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    message: string;
    createdAt?: Date;
    read?: boolean;
}
