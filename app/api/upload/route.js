import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadToS3 } from '@/lib/s3';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const originalName = file.name;
        const extension = originalName.split('.').pop();
        const key = `uploads/${uuidv4()}.${extension}`;
        const contentType = file.type;

        console.log(`📤 Uploading ${originalName} to MinIO as ${key}`);
        await uploadToS3(buffer, key, contentType);

        return NextResponse.json({
            success: true,
            key,
            originalName
        });
    } catch (error) {
        console.error('❌ Upload API Error:', error);
        return NextResponse.json({ error: 'Upload failed', details: error.message }, { status: 500 });
    }
}
