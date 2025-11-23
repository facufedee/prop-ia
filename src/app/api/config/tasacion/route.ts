import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const CONFIG_FILE_PATH = path.join(process.cwd(), 'data', 'tasacion_config.json');

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
            const data = await fs.readFile(CONFIG_FILE_PATH, 'utf-8');
            return NextResponse.json(JSON.parse(data));
        } catch (error) {
            // If file doesn't exist, return empty object or default
            return NextResponse.json({});
        }
    } catch (error) {
        return NextResponse.json({ error: 'Failed to read config' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        await ensureDirectory();
        await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(body, null, 2));
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
    }
}
