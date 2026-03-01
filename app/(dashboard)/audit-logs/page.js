import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AuditLogsClient from "./AuditLogsClient";

export default async function AuditLogsPage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.roles?.includes('Super Admin')) {
        redirect('/dashboard');
    }

    return <AuditLogsClient session={session} />;
}
