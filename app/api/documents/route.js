import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { uploadToS3, getSignedS3Url, deleteFromS3 } from '@/lib/s3';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const employeeIdParam = searchParams.get('employeeId');

        let whereClause = {};

        // If Super Admin or HR Admin
        if (session.user.role === 'Super Admin' || session.user.role === 'HR Admin') {
            if (employeeIdParam) {
                whereClause = { employeeId: parseInt(employeeIdParam) };
            }
        } else {
            if (!session.user.employeeId) return NextResponse.json({ error: 'No associated employee profile' }, { status: 403 });
            whereClause = { employeeId: session.user.employeeId };
        }

        const documents = await prisma.document.findMany({
            where: whereClause,
            include: {
                employee: {
                    select: { firstName: true, lastName: true, empNo: true }
                }
            },
            orderBy: { uploadDate: 'desc' }
        });

        // Generate signed URLs for documents
        const documentsWithSignedUrls = await Promise.all(documents.map(async (doc) => {
            if (doc.fileUrl && doc.fileUrl.startsWith('documents/')) {
                try {
                    const signedUrl = await getSignedS3Url(doc.fileUrl);
                    return { ...doc, fileUrl: signedUrl, fileKey: doc.fileUrl };
                } catch (err) {
                    console.error('Signed URL error for doc:', err);
                    return doc;
                }
            }
            return doc;
        }));

        return NextResponse.json(documentsWithSignedUrls);
    } catch (error) {
        console.error('Fetch documents error:', error);
        return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const formData = await request.formData();
        const file = formData.get('file');
        const title = formData.get('title');
        const type = formData.get('type');
        const expiryDate = formData.get('expiryDate');
        const employeeIdParam = formData.get('employeeId');

        let targetEmployeeId = session.user.employeeId;

        if (session.user.role === 'Super Admin' || session.user.role === 'HR Admin') {
            if (employeeIdParam) {
                targetEmployeeId = parseInt(employeeIdParam);
            }
        }

        if (!targetEmployeeId) {
            return NextResponse.json({ error: 'Target employee ID required' }, { status: 400 });
        }

        let fileUrl = '#';

        if (file && file.size > 0 && typeof file.arrayBuffer === 'function') {
            const buffer = Buffer.from(await file.arrayBuffer());
            const fileExtension = file.name.split('.').pop();
            const key = `documents/${uuidv4()}.${fileExtension}`;
            const contentType = file.type || 'application/octet-stream';

            console.log(`📤 Uploading document ${file.name} to S3 as ${key}`);
            await uploadToS3(buffer, key, contentType);
            fileUrl = key; // Store the key in the DB
        }

        const newDoc = await prisma.document.create({
            data: {
                employeeId: targetEmployeeId,
                title,
                type,
                fileUrl,
                expiryDate: expiryDate || null,
                status: 'Valid'
            },
            include: {
                employee: {
                    select: { firstName: true, lastName: true, empNo: true }
                }
            }
        });

        return NextResponse.json(newDoc, { status: 201 });
    } catch (error) {
        console.error('Create document error:', error);
        return NextResponse.json({ error: 'Failed to create document record' }, { status: 500 });
    }
}
