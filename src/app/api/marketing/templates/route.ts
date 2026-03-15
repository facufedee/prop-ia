import { NextResponse } from 'next/server';
import { marketingEmailService } from '@/infrastructure/services/marketingEmailService';

// GET /api/marketing/templates - List all custom templates + logs stats
export async function GET() {
    try {
        const [templates, stats, logs] = await Promise.all([
            marketingEmailService.getTemplates(),
            marketingEmailService.getEmailStats(),
            marketingEmailService.getEmailLogs(20),
        ]);

        return NextResponse.json({ templates, stats, logs });
    } catch (error: any) {
        console.error('[API /marketing/templates] GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/marketing/templates - Save or update a custom template
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { type, name, subject, html, updatedBy } = body;

        if (!type || !subject || !html) {
            return NextResponse.json({ error: 'Missing type, subject, or html' }, { status: 400 });
        }

        const id = await marketingEmailService.saveTemplate(
            { type, name: name || type, subject, html },
            updatedBy
        );

        return NextResponse.json({ success: true, id });
    } catch (error: any) {
        console.error('[API /marketing/templates] POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/marketing/templates?id=xxx - Delete a custom template (resets to default)
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        }

        await marketingEmailService.deleteTemplate(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[API /marketing/templates] DELETE error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
