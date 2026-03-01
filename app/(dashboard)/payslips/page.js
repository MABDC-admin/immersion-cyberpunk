import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PayslipsClient from "./PayslipsClient";

export default async function PayslipsPage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        redirect('/login');
    }

    return <PayslipsClient session={session} />;
}
