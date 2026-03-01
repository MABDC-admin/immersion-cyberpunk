import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PayrollClient from "./PayrollClient";

export default async function PayrollPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    const roles = session?.user?.roles || [];
    const hasAccess = roles.includes('Super Admin') || roles.includes('HR Admin');

    if (!hasAccess) {
        redirect('/dashboard');
    }

    const payrollRuns = await prisma.payrollRun.findMany({
        include: {
            _count: {
                select: { payrollItems: true }
            }
        },
        orderBy: [
            { year: 'desc' },
            { month: 'desc' }
        ]
    });

    return <PayrollClient initialRuns={JSON.parse(JSON.stringify(payrollRuns))} />;
}
