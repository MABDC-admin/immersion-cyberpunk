'use client';

import { useSession } from 'next-auth/react';

export default function DashboardClient({
    isAdmin,
    stats,
    departmentData,
    announcements,
    recentLeaves,
    myAttendance,
    myLeaves,
    user,
}) {
    const { data: session } = useSession();
    const greeting = getGreeting();
    const name = user?.name?.split(' ')[0] || 'User';

    return (
        <div className="page">
            {/* Header */}
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h1 className="page-title">{greeting}, {name} 👋</h1>
                    <p className="page-subtitle">
                        {isAdmin
                            ? "Here's your HR overview for today"
                            : "Here's your personal overview"}
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-info" style={{ fontSize: '13px', padding: '6px 14px' }}>
                        {new Date().toLocaleDateString('en-AE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                </div>
            </div>

            {/* ===== ADMIN DASHBOARD ===== */}
            {isAdmin ? (
                <>
                    {/* Stats Grid */}
                    <div className="stats-grid stagger">
                        <div className="stat-card animate-fadeInUp">
                            <div className="stat-icon primary">👥</div>
                            <div className="stat-value">{stats.employeeCount}</div>
                            <div className="stat-label">Active Employees</div>
                            <span className="stat-change up">↑ Active</span>
                        </div>
                        <div className="stat-card animate-fadeInUp">
                            <div className="stat-icon warning">📋</div>
                            <div className="stat-value">{stats.pendingLeaves}</div>
                            <div className="stat-label">Pending Leave Requests</div>
                            {stats.pendingLeaves > 0 && (
                                <span className="stat-change down">Needs Attention</span>
                            )}
                        </div>
                        <div className="stat-card animate-fadeInUp">
                            <div className="stat-icon success">✅</div>
                            <div className="stat-value">{stats.todayAttendance}</div>
                            <div className="stat-label">Checked In Today</div>
                            <span className="stat-change up">Today</span>
                        </div>
                        <div className="stat-card animate-fadeInUp">
                            <div className="stat-icon info">🏢</div>
                            <div className="stat-value">{stats.departments}</div>
                            <div className="stat-label">Departments</div>
                        </div>
                    </div>

                    {/* Dashboard Grid */}
                    <div className="dashboard-grid">
                        {/* Department Chart */}
                        <div className="glass-card animate-fadeInUp">
                            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>
                                Employees by Department
                            </h3>
                            <div className="chart-area">
                                {departmentData.map((d, i) => (
                                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                        <div
                                            className="chart-bar"
                                            style={{ height: `${Math.max(20, (d._count.id / Math.max(...departmentData.map(x => x._count.id))) * 160)}px` }}
                                        />
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.2 }}>
                                            {d.name || 'Unassigned'}
                                        </span>
                                        <span style={{ fontSize: '14px', fontWeight: 700 }}>{d._count.id}</span>
                                    </div>
                                ))}
                                {departmentData.length === 0 && (
                                    <div className="empty-state" style={{ padding: '20px', width: '100%' }}>
                                        <div className="empty-state-text">No department data yet</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Announcements */}
                        <div className="glass-card animate-slideInRight">
                            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
                                📢 Announcements
                            </h3>
                            {announcements.length === 0 ? (
                                <div className="empty-state" style={{ padding: '20px' }}>
                                    <div className="empty-state-text">No announcements yet</div>
                                </div>
                            ) : (
                                <ul className="activity-list">
                                    {announcements.map((a) => (
                                        <li key={a.id} className="activity-item">
                                            <div
                                                className="activity-dot"
                                                style={{
                                                    background: a.priority === 'high' ? 'var(--danger)' : 'var(--info)',
                                                }}
                                            />
                                            <div>
                                                <div className="activity-text">
                                                    <strong>{a.title}</strong>
                                                </div>
                                                <div className="activity-time">
                                                    {new Date(a.createdAt).toLocaleDateString('en-AE')}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Recent Leave Requests */}
                        <div className="glass-card dashboard-full animate-fadeInUp" style={{ animationDelay: '200ms' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
                                📋 Recent Leave Requests
                            </h3>
                            {recentLeaves.length === 0 ? (
                                <div className="empty-state" style={{ padding: '20px' }}>
                                    <div className="empty-state-text">No leave requests yet</div>
                                </div>
                            ) : (
                                <div className="data-table-wrapper" style={{ border: 'none', background: 'transparent', backdropFilter: 'none' }}>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Employee</th>
                                                <th>Type</th>
                                                <th>Duration</th>
                                                <th>Status</th>
                                                <th>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentLeaves.map((lr) => (
                                                <tr key={lr.id}>
                                                    <td style={{ fontWeight: 600 }}>
                                                        {lr.employee?.firstName} {lr.employee?.lastName}
                                                    </td>
                                                    <td>{lr.leaveType?.name || 'N/A'}</td>
                                                    <td>{lr.days} day{lr.days !== 1 ? 's' : ''}</td>
                                                    <td>
                                                        <span className={`badge ${lr.status === 'APPROVED' ? 'badge-success' :
                                                            lr.status === 'REJECTED' ? 'badge-danger' :
                                                                'badge-warning'
                                                            }`}>
                                                            {lr.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ color: 'var(--text-muted)' }}>
                                                        {lr.startDate} → {lr.endDate}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                /* ===== EMPLOYEE DASHBOARD ===== */
                <>
                    {/* Employee Quick Stats */}
                    <div className="stats-grid stagger">
                        <div className="stat-card animate-fadeInUp">
                            <div className="stat-icon primary">🏖️</div>
                            <div className="stat-value">{myLeaves.filter(l => l.status === 'APPROVED').length}</div>
                            <div className="stat-label">Leaves Taken</div>
                        </div>
                        <div className="stat-card animate-fadeInUp">
                            <div className="stat-icon warning">⏳</div>
                            <div className="stat-value">{myLeaves.filter(l => l.status === 'PENDING').length}</div>
                            <div className="stat-label">Pending Requests</div>
                        </div>
                        <div className="stat-card animate-fadeInUp">
                            <div className="stat-icon success">✅</div>
                            <div className="stat-value">{myAttendance.length}</div>
                            <div className="stat-label">Days Recorded</div>
                        </div>
                        <div className="stat-card animate-fadeInUp">
                            <div className="stat-icon info">⏰</div>
                            <div className="stat-value">
                                {myAttendance.reduce((sum, a) => sum + (a.totalHours || 0), 0).toFixed(0)}h
                            </div>
                            <div className="stat-label">Total Hours (7 days)</div>
                        </div>
                    </div>

                    <div className="dashboard-grid">
                        {/* My Recent Attendance */}
                        <div className="glass-card animate-fadeInUp">
                            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
                                ⏰ My Recent Attendance
                            </h3>
                            {myAttendance.length === 0 ? (
                                <div className="empty-state" style={{ padding: '20px' }}>
                                    <div className="empty-state-text">No attendance records</div>
                                </div>
                            ) : (
                                <ul className="activity-list">
                                    {myAttendance.map((a) => (
                                        <li key={a.id} className="activity-item">
                                            <div
                                                className="activity-dot"
                                                style={{ background: a.timeOut ? 'var(--success)' : 'var(--warning)' }}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <div className="activity-text">
                                                    <strong>{a.date}</strong>
                                                    {' · '}{a.timeIn} → {a.timeOut || 'In progress'}
                                                </div>
                                                <div className="activity-time">
                                                    {a.totalHours ? `${a.totalHours}h total` : 'Currently clocked in'}
                                                    {a.overtimeHours > 0 && ` · ${a.overtimeHours}h OT`}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Announcements */}
                        <div className="glass-card animate-slideInRight">
                            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
                                📢 Announcements
                            </h3>
                            {announcements.length === 0 ? (
                                <div className="empty-state" style={{ padding: '20px' }}>
                                    <div className="empty-state-text">No announcements</div>
                                </div>
                            ) : (
                                <ul className="activity-list">
                                    {announcements.map((a) => (
                                        <li key={a.id} className="activity-item">
                                            <div
                                                className="activity-dot"
                                                style={{
                                                    background: a.priority === 'high' ? 'var(--danger)' : 'var(--info)',
                                                }}
                                            />
                                            <div>
                                                <div className="activity-text">
                                                    <strong>{a.title}</strong>
                                                </div>
                                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                                    {a.body?.slice(0, 100)}{a.body?.length > 100 ? '...' : ''}
                                                </div>
                                                <div className="activity-time">
                                                    {new Date(a.createdAt).toLocaleDateString('en-AE')}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* My Leave Requests */}
                        <div className="glass-card dashboard-full animate-fadeInUp" style={{ animationDelay: '200ms' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
                                🏖️ My Leave Requests
                            </h3>
                            {myLeaves.length === 0 ? (
                                <div className="empty-state" style={{ padding: '20px' }}>
                                    <div className="empty-state-text">No leave requests yet</div>
                                </div>
                            ) : (
                                <div className="data-table-wrapper" style={{ border: 'none', background: 'transparent', backdropFilter: 'none' }}>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Type</th>
                                                <th>Duration</th>
                                                <th>Status</th>
                                                <th>Dates</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {myLeaves.map((lr) => (
                                                <tr key={lr.id}>
                                                    <td style={{ fontWeight: 600 }}>{lr.leaveType?.name || 'N/A'}</td>
                                                    <td>{lr.days} day{lr.days !== 1 ? 's' : ''}</td>
                                                    <td>
                                                        <span className={`badge ${lr.status === 'APPROVED' ? 'badge-success' :
                                                            lr.status === 'REJECTED' ? 'badge-danger' :
                                                                'badge-warning'
                                                            }`}>
                                                            {lr.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ color: 'var(--text-muted)' }}>
                                                        {lr.startDate} → {lr.endDate}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
}
