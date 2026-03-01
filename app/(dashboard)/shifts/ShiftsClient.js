'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ShiftsClient({ initialShifts }) {
    const [shifts, setShifts] = useState(initialShifts || []);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingShift, setEditingShift] = useState(null);
    const [form, setForm] = useState({
        name: '',
        startTime: '09:00',
        endTime: '18:00',
        workDays: '1,2,3,4,5',
        description: ''
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const filtered = shifts.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.description || '').toLowerCase().includes(search.toLowerCase())
    );

    const openCreate = () => {
        setEditingShift(null);
        setForm({
            name: '',
            startTime: '09:00',
            endTime: '18:00',
            workDays: '1,2,3,4,5',
            description: ''
        });
        setError('');
        setShowModal(true);
    };

    const openEdit = (shift) => {
        setEditingShift(shift);
        setForm({
            name: shift.name,
            startTime: shift.startTime,
            endTime: shift.endTime,
            workDays: shift.workDays,
            description: shift.description || ''
        });
        setError('');
        setShowModal(true);
    };

    const handleDayToggle = (dayIndex) => {
        let days = form.workDays ? form.workDays.split(',').map(Number) : [];
        if (days.includes(dayIndex)) {
            days = days.filter(d => d !== dayIndex);
        } else {
            days.push(dayIndex);
        }
        setForm({ ...form, workDays: days.sort().join(',') });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const url = editingShift ? `/api/shifts/${editingShift.id}` : '/api/shifts';
            const method = editingShift ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || `Failed to ${editingShift ? 'update' : 'create'} shift`);
            }

            const savedShift = await res.json();
            
            if (editingShift) {
                setShifts(shifts.map(s => s.id === savedShift.id ? savedShift : s));
            } else {
                setShifts([...shifts, { ...savedShift, _count: { employees: 0 } }]);
            }
            
            setShowModal(false);
            router.refresh();

        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this shift? This will remove it from all assigned employees.')) return;
        
        try {
            const res = await fetch(`/api/shifts/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete shift');
            }
            
            setShifts(shifts.filter(s => s.id !== id));
            router.refresh();
        } catch (error) {
            alert(error.message);
        }
    };

    const formatDays = (daysString) => {
        if (!daysString) return 'None';
        // Handle strings like "Mon,Tue,Wed" (from seeds) vs numeric "1,2,3" (from UI)
        if (/[a-zA-Z]/.test(daysString)) {
            return daysString.split(',').join(', ');
        }
        const dayMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return daysString.split(',').map(d => dayMap[parseInt(d)]).filter(Boolean).join(', ');
    };

    const dayOptions = [
        { label: 'S', value: 0, full: 'Sunday' },
        { label: 'M', value: 1, full: 'Monday' },
        { label: 'T', value: 2, full: 'Tuesday' },
        { label: 'W', value: 3, full: 'Wednesday' },
        { label: 'T', value: 4, full: 'Thursday' },
        { label: 'F', value: 5, full: 'Friday' },
        { label: 'S', value: 6, full: 'Saturday' },
    ];

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">⏱️ Shifts & Schedules</h1>
                    <p className="page-subtitle">Manage company working hours and schedules</p>
                </div>
                <button className="btn btn-primary" onClick={openCreate}>
                    ＋ New Shift
                </button>
            </div>

            {/* Search */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <div className="search-box" style={{ flex: 1, maxWidth: '400px' }}>
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search shifts..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Data Table */}
            <div className="data-table-wrapper animate-fadeInUp">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Shift Name</th>
                            <th>Time</th>
                            <th>Working Days</th>
                            <th>Description</th>
                            <th>Assigned Employees</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                                    <div className="empty-state-text">No shifts found.</div>
                                </td>
                            </tr>
                        ) : (
                            filtered.map((s) => (
                                <tr key={s.id}>
                                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                                    <td>
                                        <span className="badge badge-info">
                                            {s.startTime} - {s.endTime}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '13px' }}>
                                        {formatDays(s.workDays)}
                                    </td>
                                    <td style={{ color: 'var(--text-muted)' }}>{s.description || '—'}</td>
                                    <td>
                                        <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>
                                            {s._count?.employees || 0} Members
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}>Edit</button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal animate-fadeInUp" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">{editingShift ? '✏️ Edit Shift' : '➕ New Shift'}</h2>

                        {error && (
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '12px', borderRadius: 'var(--radius)', marginBottom: '16px', fontSize: '14px' }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Shift Name</label>
                                <input
                                    className="form-input"
                                    placeholder="e.g., Morning Shift, Night Shift"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div className="form-group">
                                    <label className="form-label">Start Time</label>
                                    <input
                                        type="time"
                                        className="form-input"
                                        value={form.startTime}
                                        onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">End Time</label>
                                    <input
                                        type="time"
                                        className="form-input"
                                        value={form.endTime}
                                        onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label" style={{ marginBottom: '8px' }}>Working Days</label>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {dayOptions.map((day) => {
                                        const isActive = (form.workDays || '').split(',').map(Number).includes(day.value);
                                        return (
                                            <button
                                                key={day.value}
                                                type="button"
                                                onClick={() => handleDayToggle(day.value)}
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    border: 'none',
                                                    background: isActive ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                    color: 'white',
                                                    fontWeight: isActive ? 700 : 400,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    boxShadow: isActive ? '0 0 10px rgba(var(--primary-rgb), 0.3)' : 'none'
                                                }}
                                                title={day.full}
                                            >
                                                {day.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description (Optional)</label>
                                <textarea
                                    className="form-input"
                                    placeholder="Describe the shift schedule..."
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)} disabled={isSubmitting}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : (editingShift ? 'Save Changes' : 'Create Shift')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
