import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import MyTasksClient from './MyTasksClient';

export const metadata = {
    title: 'My Tasks | MABDC Portal',
};

export default async function MyTasksPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    // This is an ESS page, everyone has access to it.
    
    return <MyTasksClient />;
}
