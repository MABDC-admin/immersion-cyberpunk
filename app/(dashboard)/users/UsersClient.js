'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UsersClient({ initialUsers, rolesList, unlinkedEmployees }) {
    const [users, setUsers] = useState(initialUsers || []);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [selectedUser, setSelectedUser] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const [form, setForm] = useState({
        email: '',
        password: '',
        displayName: '',
        employeeId: '',
        selectedRoles: [],
        isActive: true
    });

    const resetForm = () => {
        setForm({
            email: '',
            password: '',
            displayName: '',
            employeeId: '',
            selectedRoles: [],
            isActive: true
        });
        setError('');
    };

    const openAddModal = () => {
        resetForm();
        setModalMode('add');
        setSelectedUser(null);
        setShowModal(true);
    };

    const openEditModal = (user) => {
        resetForm();
        setForm({
            email: user.email,
            password: '', // Leave blank unless they want to reset it
            displayName: user.displayName,
            employeeId: user.employeeId ? user.employeeId.toString() : '',
            selectedRoles: user.userRoles.map(ur => ur.role.name),
            isActive: user.isActive === 1
        });
        setModalMode('edit');
        setSelectedUser(user);
        setShowModal(true);
    };

    const handleRoleToggle = (roleName) => {
        setForm(prev => {
            if (prev.selectedRoles.includes(roleName)) {
                return { ...prev, selectedRoles: prev.selectedRoles.filter(r => r !== roleName) };
            } else {
                return { ...prev, selectedRoles: [...prev.selectedRoles, roleName] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsProcessing(true);

        const isAdding = modalMode === 'add';
        const url = isAdding ? '/api/users' : `/api/users/${selectedUser.id}`;
        const method = isAdding ? 'POST' : 'PUT';

        if (isAdding && !form.password) {
            setError('Password is required for new users.');
            setIsProcessing(false);
            return;
        }

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || `Failed to ${isAdding ? 'create' : 'update'} user`);
            }

            const returnedUser = await res.json();

            if (isAdding) {
                setUsers([returnedUser, ...users]);
            } else {
                setUsers(users.map(u => (u.id === returnedUser.id ? returnedUser : u)));
            }

            setShowModal(false);
            router.refresh();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const toggleActiveStatus = async (user) => {
        try {
            const newStatus = user.isActive === 1 ? 0 : 1;
            const res = await fetch(`/api/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: newStatus, displayName: user.displayName })
            });

            if (!res.ok) throw new Error('Failed to toggle status');
            const updatedUser = await res.json();
            setUsers(users.map(u => (u.id === updatedUser.id ? updatedUser : u)));
            router.refresh();
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">👥 User Management</h1>
                    <p className="page-subtitle">Manage portal access, RBAC roles, and map logins to employee profiles</p>
                </div>
                <button className="btn btn-primary" onClick={openAddModal}>
                    + Add New User
                </button>
            </div>

            <div className="data-table-wrapper animate-fadeInUp">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>User Details</th>
                            <th>System Roles (RBAC)</th>
                            <th>Linked Profile</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td>
                                    <div style={{ fontWeight: 600, color: 'var(--cyber-cyan)' }}>{user.displayName}</div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{user.email}</div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        {user.userRoles.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No Roles Assigned</span>}
                                        {user.userRoles.map(ur => (
                                            <span
                                                key={ur.roleId}
                                                className="badge badge-info"
                                                style={{
                                                    background: ur.role.name === 'Super Admin' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                                                    color: ur.role.name === 'Super Admin' ? 'var(--danger)' : 'var(--info)'
                                                }}
                                            >
                                                {ur.role.name}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td>
                                    {user.employee ? (
                                        <div style={{ fontSize: '13px' }}>
                                            <span style={{ color: 'var(--cyber-teal)', fontWeight: 600 }}>{user.employee.firstName} {user.employee.lastName}</span>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{user.employee.department?.name || 'No Dept'}</div>
                                        </div>
                                    ) : (
                                        <span className="badge badge-warning" style={{ opacity: 0.7 }}>Unlinked</span>
                                    )}
                                </td>
                                <td>
                                    <button
                                        className={`badge ${user.isActive === 1 ? 'badge-success' : 'badge-danger'}`}
                                        style={{ cursor: 'pointer', border: 'none' }}
                                        onClick={() => toggleActiveStatus(user)}
                                        title="Click to toggle access"
                                    >
                                        {user.isActive === 1 ? 'Active' : 'Locked'}
                                    </button>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(user)}>Edit Access</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                                    <div className="empty-state-text">No system users found.</div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal for Add/Edit */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal animate-fadeInUp" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
                        <h2 className="modal-title">{modalMode === 'add' ? 'Add New System User' : 'Edit User Access'}</h2>

                        {error && (
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '12px', borderRadius: 'var(--radius)', marginBottom: '16px', fontSize: '14px' }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div className="form-group">
                                    <label className="form-label">Display Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={form.displayName}
                                        onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                                        required
                                        placeholder="E.g., John Smith"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email Handle (Login ID)</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        required
                                        disabled={modalMode === 'edit'}
                                        style={modalMode === 'edit' ? { opacity: 0.6 } : {}}
                                    />
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                <label className="form-label">
                                    {modalMode === 'add' ? 'Password' : 'Reset Password (Leave blank to keep current)'}
                                </label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    required={modalMode === 'add'}
                                    autoComplete="new-password"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '24px' }}>
                                <label className="form-label">Link to Employee Profile (Optional)</label>
                                <select
                                    className="form-input"
                                    value={form.employeeId}
                                    onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                                >
                                    <option value="">-- No linked profile (Standalone Admin) --</option>
                                    {modalMode === 'edit' && selectedUser?.employee && (
                                        <option value={selectedUser.employeeId}>
                                            Current: {selectedUser.employee.firstName} {selectedUser.employee.lastName}
                                        </option>
                                    )}
                                    {unlinkedEmployees.map(emp => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.firstName} {emp.lastName}
                                        </option>
                                    ))}
                                </select>
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    Links this login to an HR record so they can use "My Profile" & "My Leave".
                                </p>
                            </div>

                            <div className="form-group" style={{ marginBottom: '32px' }}>
                                <label className="form-label">System Roles (RBAC)</label>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {rolesList.map(role => (
                                        <button
                                            key={role.id}
                                            type="button"
                                            onClick={() => handleRoleToggle(role.name)}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '20px',
                                                fontSize: '13px',
                                                cursor: 'pointer',
                                                border: form.selectedRoles.includes(role.name) ? '1px solid var(--cyber-cyan)' : '1px solid var(--border)',
                                                background: form.selectedRoles.includes(role.name) ? 'rgba(34, 211, 238, 0.1)' : 'transparent',
                                                color: form.selectedRoles.includes(role.name) ? 'var(--cyber-cyan)' : 'var(--text-muted)'
                                            }}
                                        >
                                            {role.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                {modalMode === 'edit' && (
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: 'auto', fontSize: '13px', color: 'var(--text-primary)' }}>
                                        <input
                                            type="checkbox"
                                            checked={form.isActive}
                                            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                        />
                                        Account Active
                                    </label>
                                )}
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)} disabled={isProcessing}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={isProcessing}>
                                    {isProcessing ? 'Saving...' : (modalMode === 'add' ? 'Create User' : 'Save Changes')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
