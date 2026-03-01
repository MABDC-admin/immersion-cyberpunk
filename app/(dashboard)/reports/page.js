import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ReportsClient from "./ReportsClient";

export default async function ReportsPage() {
    const session = await getServerSession(authOptions);

    if (!session || (!session.user.roles?.includes('Super Admin') && !session.user.roles?.includes('HR Admin'))) {
        redirect('/dashboard');
    }

    return <ReportsClient session={session} />;
}
