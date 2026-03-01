import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CalendarClient from './CalendarClient';

export const metadata = {
    title: 'Calendar | MABDC Portal',
};

export default async function CalendarPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    return <CalendarClient />;
}
