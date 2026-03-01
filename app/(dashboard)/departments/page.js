import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DepartmentsClient from "./DepartmentsClient";

export default async function DepartmentsPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    const roles = session?.user?.roles || [];
    const hasAccess = roles.includes('Super Admin') || roles.includes('HR Admin');

    if (!hasAccess) {
        redirect('/dashboard');
    }

    return <DepartmentsClient />;
}
