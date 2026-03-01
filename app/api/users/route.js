import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        const roles = session?.user?.roles || [];
        if (!session || (!roles.includes('Super Admin'))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const users = await prisma.user.findMany({
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        department: { select: { name: true } }
                    }
                },
                userRoles: {
                    include: {
                        role: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error('Fetch users error:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        const roles = session?.user?.roles || [];
        if (!session || (!roles.includes('Super Admin'))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { email, password, displayName, employeeId, selectedRoles } = body;

        if (!email || !password || !displayName) {
            return NextResponse.json({ error: 'Missing required configuration fields' }, { status: 400 });
        }

        // Check for existing email
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        // Transaction to ensure User and Roles are created atomically
        const newUser = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email,
                    passwordHash,
                    displayName,
                    employeeId: employeeId ? parseInt(employeeId) : null,
                    isActive: 1
                }
            });

            if (selectedRoles && selectedRoles.length > 0) {
                // Fetch actual role IDs from names
                const dbRoles = await tx.role.findMany({
                    where: { name: { in: selectedRoles } }
                });

                const roleAssignments = dbRoles.map(r => ({
                    userId: user.id,
                    roleId: r.id
                }));

                if (roleAssignments.length > 0) {
                    await tx.userRole.createMany({
                        data: roleAssignments
                    });
                }
            }

            return tx.user.findUnique({
                where: { id: user.id },
                include: {
                    employee: true,
                    userRoles: { include: { role: true } }
                }
            });
        });

        return NextResponse.json(newUser, { status: 201 });
    } catch (error) {
        console.error('Create user error:', error);
        return NextResponse.json({ error: 'Failed to create system user' }, { status: 500 });
    }
}
