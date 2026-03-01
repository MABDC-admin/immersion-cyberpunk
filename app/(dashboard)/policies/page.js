import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PoliciesClient from "./PoliciesClient";

export default async function PoliciesPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    return <PoliciesClient session={session} />;
}
