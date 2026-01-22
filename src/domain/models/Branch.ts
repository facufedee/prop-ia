export interface Branch {
    id: string;
    organizationId: string; // Link to main user/organization
    name: string;
    address: string;
    phone?: string;
    email?: string;
    managerId?: string; // User ID of the branch manager
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
