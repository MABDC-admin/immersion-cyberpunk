import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import HelpdeskClient from "./HelpdeskClient";

export default async function HelpdeskPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    return <HelpdeskClient session={session} />;
}
