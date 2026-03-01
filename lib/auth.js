import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                    include: {
                        userRoles: {
                            include: { role: true },
                        },
                        employee: true,
                    },
                });

                if (!user || !user.isActive) return null;

                const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
                if (!isValid) return null;

                return {
                    id: String(user.id),
                    email: user.email,
                    name: user.displayName,
                    roles: user.userRoles.map((ur) => ur.role.name),
                    employeeId: user.employeeId,
                    employee: user.employee,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.roles = user.roles;
                token.employeeId = user.employeeId;
                token.employee = user.employee;
            }
            return token;
        },
        async session({ session, token }) {
            session.user.id = token.sub;
            session.user.roles = token.roles;
            session.user.employeeId = token.employeeId;
            session.user.employee = token.employee;
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: 'jwt',
    },
    secret: process.env.NEXTAUTH_SECRET,
};
