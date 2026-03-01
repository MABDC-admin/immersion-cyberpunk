import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import OnboardingClient from "./OnboardingClient";

export default async function OnboardingPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    const roles = session?.user?.roles || [];
    const hasAccess = roles.includes('Super Admin') || roles.includes('HR Admin');

    if (!hasAccess) {
        redirect('/dashboard');
    }

    const templates = await prisma.onboardingTask.findMany({
        orderBy: { dayDue: 'asc' }
    });

    const activeOnboardings = await prisma.employee.findMany({
        where: {
            onboardingTasks: { some: {} }
        },
        include: {
            department: true,
            positionRel: true,
            onboardingTasks: {
                include: { task: true }
            }
        }
    });

    const allEmployees = await prisma.employee.findMany({
        where: { status: 'Active' },
        select: { id: true, firstName: true, lastName: true },
        orderBy: { firstName: 'asc' }
    });

    return <OnboardingClient templates={templates} activeOnboardings={activeOnboardings} allEmployees={allEmployees} />;
}
