'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from '../app/providers';

const themes = ['default', 'ocean', 'emerald', 'sunset', 'violet', 'rose', 'amber', 'teal'];

export default function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { theme, changeTheme } = useTheme();

    const [openGroup, setOpenGroup] = useState(null);

    const roles = session?.user?.roles || [];

    // Group definitions mapped to roles
    const menuGroups = [
        {
            group: 'Overview',
            roles: ['Employee', 'Manager', 'HR Admin', 'Super Admin'],
            items: [
                { name: 'Dashboard', path: '/dashboard', icon: '📊' },
                { name: 'My Tasks', path: '/my-tasks', icon: '📝' },
                { name: 'Calendar', path: '/calendar', icon: '📅' },
            ],
        },
        {
            group: 'Employee Self-Service',
            roles: ['Employee', 'Manager', 'HR Admin', 'Super Admin'],
            items: [
                { name: 'My Profile', path: '/profile', icon: '👤' },
                { name: 'My Attendance', path: '/attendance', icon: '⏰' },
                { name: 'My Leave', path: '/leave', icon: '🏖️' },
                { name: 'My Payslips', path: '/payslips', icon: '💸' },
                { name: 'My Requests', path: '/requests', icon: '📄' },
                { name: 'My Documents', path: '/documents', icon: '📁' },
            ],
        },
        {
            group: 'Approvals & Team',
            roles: ['Manager'],
            items: [
                { name: 'Team Attendance', path: '/attendance', icon: '👥' },
                { name: 'Leave Approvals', path: '/leave', icon: '✅' },
            ],
        },
        {
            group: 'HR Management',
            roles: ['HR Admin', 'Super Admin'],
            items: [
                { name: 'Employees', path: '/employees', icon: '👥' },
                { name: 'Departments', path: '/departments', icon: '🏢' },
                { name: 'Positions', path: '/positions', icon: '👔' },
                { name: 'Shifts & Schedules', path: '/shifts', icon: '⏱️' },
                { name: 'Attendance Mgmt', path: '/attendance', icon: '🛎️' },
                { name: 'Leave Mgmt', path: '/leave', icon: '🏖️' },
                { name: 'Payroll', path: '/payroll', icon: '💰' },
                { name: 'Benefits', path: '/benefits', icon: '🎁' },
                { name: 'Documents', path: '/coming-soon', icon: '📑' },
            ],
        },
        {
            group: 'Talent',
            roles: ['HR Admin', 'Super Admin'],
            items: [
                { name: 'Recruitment', path: '/recruitment', icon: '🎯' },
                { name: 'Onboarding', path: '/onboarding', icon: '🚀' },
                { name: 'Performance', path: '/performance', icon: '⭐' },
                { name: 'Training / LMS', path: '/training', icon: '🎓' },
                { name: 'Discipline', path: '/discipline', icon: '🛡️' },
                { name: 'Offboarding', path: '/offboarding', icon: '👋' },
            ],
        },
        {
            group: 'Communication',
            roles: ['Employee', 'Manager', 'HR Admin', 'Super Admin'],
            items: [
                { name: 'Announcements', path: '/announcements', icon: '📢' },
                { name: 'Policies', path: '/policies', icon: '📜' },
                { name: 'HR Helpdesk', path: '/helpdesk', icon: '🎫' },
            ],
        },
        {
            group: 'Reports & Analytics',
            roles: ['HR Admin', 'Super Admin'],
            items: [
                { name: 'Headcount', path: '/reports?tab=headcount', icon: '📈' },
                { name: 'Attendance Reports', path: '/reports?tab=attendance', icon: '📊' },
                { name: 'Leave Reports', path: '/reports?tab=leave', icon: '📉' },
                { name: 'Payroll Reports', path: '/reports?tab=payroll', icon: '🧾' },
                { name: 'Exports', path: '/reports?tab=exports', icon: '📥' },
            ],
        },
        {
            group: 'Admin & Settings (RBAC)',
            roles: ['Super Admin'],
            items: [
                { name: 'Users', path: '/users', icon: '👥' },
                { name: 'Roles & Permissions', path: '/settings', icon: '🛡️' },
                { name: 'Approval Workflows', path: '/approvals', icon: '✅' },
                { name: 'Company Settings', path: '/settings', icon: '⚙️' },
                { name: 'Audit Logs', path: '/audit-logs', icon: '🔍' },
            ],
        },
    ];

    // Filter groups based on user roles
    const visibleGroups = menuGroups.map(group => ({
        ...group,
        items: group.items,
        isVisible: roles.some(role => group.roles.includes(role)),
    })).filter(g => g.isVisible);

    useEffect(() => {
        let initialOpen = 'Overview';
        menuGroups.forEach(g => {
            const isActive = g.items.some(item => pathname === item.path || (pathname.startsWith(item.path) && item.path !== '/dashboard' && item.path !== '/coming-soon'));
            if (isActive) initialOpen = g.group;
        });

        setOpenGroup(prev => {
            if (prev === null) return initialOpen;
            return prev;
        });
    }, [pathname]);

    const toggleGroup = (groupName) => {
        setOpenGroup(prev => prev === groupName ? null : groupName);
    };

    if (!session) return null;

    const initials = (session.user?.name || 'U')
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon">HR</div>
                <div>
                    <div className="sidebar-logo-text">MABDC Portal</div>
                    <div className="sidebar-logo-sub">HR System</div>
                </div>
            </div>

            <nav className="sidebar-nav">
                {visibleGroups.map((group, idx) => {
                    const isOpen = openGroup === group.group;
                    return (
                        <div className={`nav-section ${isOpen ? 'open' : ''}`} key={idx}>
                            <div className="nav-section-title" onClick={() => toggleGroup(group.group)}>
                                {group.group}
                            </div>
                            <div className="nav-section-content">
                                <div className="nav-section-content-inner">
                                    {group.items.map((item) => {
                                        const isDocuments = item.name.includes('Documents');
                                        return (
                                            <Link
                                                key={item.name}
                                                href={item.path}
                                                className={`nav-link ${pathname === item.path || (pathname.startsWith(item.path) && item.path !== '/dashboard' && item.path !== '/coming-soon') ? 'active' : ''}`}
                                                title={item.name}
                                                style={isDocuments ? {
                                                    color: '#00f3ff',
                                                    textShadow: '0 0 10px rgba(0, 243, 255, 0.8)',
                                                    border: '1px solid rgba(0, 243, 255, 0.3)',
                                                    background: 'rgba(0, 243, 255, 0.05)'
                                                } : {}}
                                            >
                                                <span className="nav-icon" style={isDocuments ? { filter: 'drop-shadow(0 0 8px #00f3ff)' } : {}}>{item.icon}</span>
                                                <span>{item.name}</span>
                                            </Link>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )
                })}

                {/* Theme Picker */}
                <div className="nav-section" style={{ marginTop: '16px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-muted)', padding: '12px 12px 6px' }}>Theme</div>
                    <div style={{ padding: '8px 12px' }}>
                        <div className="theme-picker" style={{ flexWrap: 'wrap', background: 'transparent', border: 'none', padding: 0 }}>
                            {themes.map((t) => (
                                <button
                                    key={t}
                                    className={`theme-dot ${theme === t ? 'active' : ''}`}
                                    data-theme={t}
                                    onClick={() => changeTheme(t)}
                                    title={t.charAt(0).toUpperCase() + t.slice(1)}
                                    aria-label={`Select ${t} theme`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user" onClick={() => signOut({ callbackUrl: '/login' })}>
                    <div className="sidebar-avatar">{initials}</div>
                    <div>
                        <div className="sidebar-user-name">{session.user?.name}</div>
                        <div className="sidebar-user-role">{roles[0] || 'User'} · Sign Out</div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
