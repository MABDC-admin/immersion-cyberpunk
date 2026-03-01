import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'MABDC HR Portal — UAE Employee Management',
  description: 'Modern HR & Employee management portal with RBAC, leave management, attendance, and payroll for UAE organizations.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="bg-mesh" aria-hidden="true"></div>
          {children}
        </Providers>
      </body>
    </html>
  );
}
