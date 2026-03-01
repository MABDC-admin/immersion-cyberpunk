import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';

export async function PUT(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        const roles = session?.user?.roles || [];
        if (!session || (!roles.includes('Super Admin'))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await Promise.resolve(params);
        const userId = parseInt(resolvedParams.id);
        const body = await request.json();

        const { displayName, employeeId, isActive, selectedRoles, password } = body;

        let updateData = {
            displayName,
            employeeId: employeeId ? parseInt(employeeId) : null,
            isActive: isActive ? 1 : 0
        };

        if (password) {
            updateData.passwordHash = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.$transaction(async (tx) => {
            const user = await tx.user.update({
                where: { id: userId },
                data: updateData
            });

            // Update Roles if provided
            if (selectedRoles !== undefined) {
                // Wipe existing
                await tx.userRole.deleteMany({
                    where: { userId: user.id }
                });

                if (selectedRoles.length > 0) {
                    const dbRoles = await tx.role.findMany({
                        where: { name: { in: selectedRoles } }
                    });

                    if (dbRoles.length > 0) {
                        const roleAssignments = dbRoles.map(r => ({
                            userId: user.id,
                            roleId: r.id
                        }));
                        await tx.userRole.createMany({ data: roleAssignments });
                    }
                }
            }

            const finalUser = await tx.user.findUnique({
                where: { id: user.id },
                include: {
                    employee: {
                        select: { firstName: true, lastName: true, department: { select: { name: true } } }
                    },
                    userRoles: { include: { role: true } }
                }
            });
            return finalUser;
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Update user error:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        const roles = session?.user?.roles || [];
        if (!session || (!roles.includes('Super Admin'))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await Promise.resolve(params);
        const userId = parseInt(resolvedParams.id);

        // Soft delete: Prevent login by setting isActive to 0
        const deactivatedUser = await prisma.user.update({
            where: { id: userId },
            data: { isActive: 0 }
        });

        return NextResponse.json({ success: true, message: 'User deactivated', user: deactivatedUser });
    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json({ error: 'Failed to deactivate user' }, { status: 500 });
    }
}
