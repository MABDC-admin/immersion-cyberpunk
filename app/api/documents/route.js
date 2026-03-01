import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

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

        return NextResponse.json(documents);
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

        let fileUrl = '#'; // Default if no file

        if (file && file.size > 0 && typeof file.arrayBuffer === 'function') {
            const buffer = Buffer.from(await file.arrayBuffer());
            const fileExtension = path.extname(file.name) || '';
            const fileName = `doc_${targetEmployeeId}_${Date.now()}${fileExtension}`;
            const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'documents');
            
            // Ensure directory exists
            try {
                await fs.access(uploadDir);
            } catch {
                await fs.mkdir(uploadDir, { recursive: true });
            }

            const filePath = path.join(uploadDir, fileName);
            await fs.writeFile(filePath, buffer);
            fileUrl = `/uploads/documents/${fileName}`;
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
