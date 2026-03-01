import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AnnouncementsClient from './AnnouncementsClient';

export default async function AnnouncementsPage() {
    const session = await getServerSession(authOptions);
    const roles = session?.user?.roles || [];
    const isAdmin = roles.includes('Super Admin') || roles.includes('HR Admin');

    const announcements = await prisma.announcement.findMany({
        orderBy: { createdAt: 'desc' },
    });

    return (
        <AnnouncementsClient
            announcements={JSON.parse(JSON.stringify(announcements))}
            isAdmin={isAdmin}
        />
    );
}
