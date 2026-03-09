import ClientDetailClient from "./ClientDetailClient";

export default async function ClientDetailPage({ params }: { params: Promise<{ type: string, id: string }> }) {
    const { type, id } = await params;
    return <ClientDetailClient type={type} id={id} />;
}
