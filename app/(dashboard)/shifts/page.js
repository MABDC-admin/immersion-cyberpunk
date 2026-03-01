import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ShiftsClient from "./ShiftsClient";

export default async function ShiftsPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    const roles = session?.user?.roles || [];
    const hasAccess = roles.includes('Super Admin') || roles.includes('HR Admin');

    if (!hasAccess) {
        redirect('/dashboard');
    }

    const shifts = await prisma.shift.findMany({
        include: {
            _count: {
                select: { employees: true }
            }
        },
        orderBy: { name: 'asc' }
    });

    return <ShiftsClient initialShifts={shifts} />;
}
