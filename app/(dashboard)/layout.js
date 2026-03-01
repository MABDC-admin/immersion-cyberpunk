import Sidebar from '@/components/Sidebar';
import ConnectionStatus from '@/components/ConnectionStatus';

export default function DashboardLayout({ children }) {
    return (
        <>
            <Sidebar />
            <div style={{ position: 'fixed', top: '16px', right: '24px', zIndex: 100 }}>
                <ConnectionStatus />
            </div>
            <main className="main-content">
                {children}
            </main>
        </>
    );
}
