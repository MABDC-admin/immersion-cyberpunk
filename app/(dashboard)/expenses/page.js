import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ExpensesClient from "./ExpensesClient";

export default async function ExpensesPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    const userEmployeeId = session.user.employeeId;
    if (!userEmployeeId) {
        // Handle case where user isn't linked to an employee
        return (
            <div className="page glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                <h1 className="page-title" style={{ color: 'var(--cyber-pink)' }}>Access Denied</h1>
                <p>Your user account is not linked to an employee profile. Please contact HR.</p>
            </div>
        );
    }

    const roles = session.user.roles || [];
    const isHR = roles.includes('HR Admin') || roles.includes('Super Admin');

    // Fetch user's expenses
    const myExpenses = await prisma.expense.findMany({
        where: { employeeId: userEmployeeId },
        include: {
            employee: {
                select: {
                    firstName: true,
                    lastName: true,
                    empNo: true
                }
            }
        },
        orderBy: { date: 'desc' }
    });

    // If HR, fetch all for overview
    let allExpenses = [];
    if (isHR) {
        allExpenses = await prisma.expense.findMany({
            include: {
                employee: {
                    select: {
                        firstName: true,
                        lastName: true,
                        empNo: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    return (
        <ExpensesClient 
            initialMyExpenses={myExpenses} 
            initialAllExpenses={allExpenses}
            isHR={isHR}
            userEmployeeId={userEmployeeId}
        />
    );
}
