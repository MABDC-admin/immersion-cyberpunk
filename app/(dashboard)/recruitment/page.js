import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import RecruitmentClient from "./RecruitmentClient";

export default async function RecruitmentPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    const roles = session?.user?.roles || [];
    const hasAccess = roles.includes('Super Admin') || roles.includes('HR Admin');

    if (!hasAccess) {
        redirect('/dashboard');
    }

    // Fetch active job postings with counts of applicants
    const jobs = await prisma.jobPosting.findMany({
        include: {
            department: true,
            _count: {
                select: { applicants: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    const departments = await prisma.department.findMany({
        orderBy: { name: 'asc' }
    });

    return <RecruitmentClient initialJobs={jobs} departments={departments} />;
}
