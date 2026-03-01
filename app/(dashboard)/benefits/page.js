import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import BenefitsClient from "./BenefitsClient";

export default async function BenefitsPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    const roles = session?.user?.roles || [];
    const hasAccess = roles.includes('Super Admin') || roles.includes('HR Admin');

    if (!hasAccess) {
        redirect('/dashboard');
    }

    const benefits = await prisma.benefit.findMany({
        include: {
            _count: {
                select: { employees: true }
            }
        },
        orderBy: { name: 'asc' }
    });

    return <BenefitsClient initialBenefits={benefits} />;
}
