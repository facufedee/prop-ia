import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const IPC_FILE_PATH = path.join(process.cwd(), 'data', 'indices_ipc.json');

// Ensure data directory exists
async function ensureDirectory() {
    const dir = path.join(process.cwd(), 'data');
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
}

export async function GET() {
    try {
        await ensureDirectory();
        try {
            const data = await fs.readFile(IPC_FILE_PATH, 'utf-8');
            return NextResponse.json(JSON.parse(data));
        } catch {
            // Return empty configuration if file doesn't exist
            return NextResponse.json({ years: {} });
        }
    } catch (error) {
        return NextResponse.json({ error: 'Failed to read IPC config' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        await ensureDirectory();
        await fs.writeFile(IPC_FILE_PATH, JSON.stringify(body, null, 2));
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save IPC config' }, { status: 500 });
    }
}
