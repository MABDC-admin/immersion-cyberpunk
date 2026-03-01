import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    const roles = session?.user?.roles || [];
    const isSuperAdmin = roles.includes('Super Admin');

    if (!isSuperAdmin) {
        // System Settings are strictly for Super Admins
        redirect('/dashboard');
    }

    const settings = await prisma.companySetting.findMany({
        orderBy: { key: 'asc' }
    });

    // Also fetch roles and users for the "Role Management" tab
    const allRoles = await prisma.role.findMany({
        include: {
            _count: { select: { userRoles: true } }
        },
        orderBy: { id: 'asc' }
    });

    return <SettingsClient initialSettings={settings} roles={allRoles} />;
}
