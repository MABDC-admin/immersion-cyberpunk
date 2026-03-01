'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AttendanceClient({ attendance: initial, employees, isAdmin, currentEmployeeId }) {
    const [records, setRecords] = useState(initial);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        employeeId: currentEmployeeId || '',
        date: new Date().toISOString().split('T')[0],
        timeIn: '08:00',
        timeOut: '17:00',
    });
    const router = useRouter();

    const today = new Date().toISOString().split('T')[0];
    const todayRecord = records.find(r =>
        r.date === today && r.employeeId === currentEmployeeId
    );
    const isClockedIn = todayRecord && !todayRecord.timeOut;

    const handleClockIn = async () => {
        const res = await fetch('/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                employeeId: currentEmployeeId,
                date: today,
                timeIn: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
            }),
        });
        if (res.ok) {
            const created = await res.json();
            setRecords([created, ...records]);
        }
    };

    const handleClockOut = async () => {
        if (!todayRecord) return;
        const timeOut = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        const res = await fetch(`/api/attendance/${todayRecord.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ timeOut }),
        });
        if (res.ok) {
            const updated = await res.json();
            setRecords(records.map(r => r.id === updated.id ? updated : r));
        }
    };

    const handleManualAdd = async (e) => {
        e.preventDefault();
        const timeIn = form.timeIn;
        const timeOut = form.timeOut;
        const totalHours = calcHours(timeIn, timeOut);
        const overtime = Math.max(0, totalHours - 8);

        const res = await fetch('/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                employeeId: parseInt(form.employeeId),
                date: form.date,
                timeIn,
                timeOut,
                totalHours,
                overtimeHours: overtime,
            }),
        });
        if (res.ok) {
            setShowModal(false);
            router.refresh();
            const created = await res.json();
            setRecords([created, ...records]);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this specific attendance record?')) return;
        try {
            const res = await fetch(`/api/attendance/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setRecords(records.filter(r => r.id !== id));
            } else {
                alert('Failed to delete attendance record');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const calcHours = (start, end) => {
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        return Math.max(0, (eh + em / 60) - (sh + sm / 60));
    };

    const totalHoursThisMonth = records
        .filter(r => r.date?.startsWith(today.slice(0, 7)))
        .reduce((sum, r) => sum + (r.totalHours || 0), 0);

    const totalOTThisMonth = records
        .filter(r => r.date?.startsWith(today.slice(0, 7)))
        .reduce((sum, r) => sum + (r.overtimeHours || 0), 0);

    return (
        <div className="cyber-dashboard">
            <style dangerouslySetInnerHTML={{
                __html: `
                .cyber-dashboard {
                    --cyber-dark: #061410;
                    --cyber-cyan: #00f3ff;
                    --cyber-teal: #00bfa5;
                    --cyber-green: #39ff14;
                    --cyber-amber: #ffaa00;
                    background: var(--cyber-dark);
                    color: #e0f7fa;
                    min-height: calc(100vh - 64px);
                    position: relative;
                    padding: 32px;
                    overflow: hidden;
                }
                .circuit-bg {
                    position: absolute;
                    inset: 0;
                    opacity: 0.1;
                    background-image: 
                      linear-gradient(rgba(0, 243, 255, 0.2) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(0, 243, 255, 0.2) 1px, transparent 1px);
                    background-size: 30px 30px;
                    z-index: 0;
                }
                .cyber-header {
                    position: relative;
                    z-index: 2;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 40px;
                    border-bottom: 1px solid rgba(0, 243, 255, 0.2);
                    padding-bottom: 16px;
                }
                .cyber-title {
                    font-size: 32px;
                    font-weight: 800;
                    color: var(--cyber-cyan);
                    text-shadow: 0 0 10px rgba(0, 243, 255, 0.5);
                    margin: 0;
                    letter-spacing: 1px;
                }
                .cyber-subtitle {
                    color: var(--cyber-teal);
                    font-size: 14px;
                    margin-top: 4px;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                }
                .cyber-btn-primary {
                    background: transparent;
                    color: var(--cyber-cyan);
                    border: 1px solid var(--cyber-cyan);
                    box-shadow: 0 0 10px rgba(0, 243, 255, 0.2), inset 0 0 10px rgba(0, 243, 255, 0.1);
                    padding: 12px 24px;
                    border-radius: 4px;
                    font-weight: bold;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .cyber-btn-primary:hover {
                    background: rgba(0, 243, 255, 0.1);
                    box-shadow: 0 0 20px rgba(0, 243, 255, 0.6), inset 0 0 10px rgba(0, 243, 255, 0.4);
                }
                .cyber-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 24px;
                    margin-bottom: 40px;
                    position: relative;
                    z-index: 2;
                }
                .cyber-card {
                    background: rgba(6, 20, 16, 0.6);
                    backdrop-filter: blur(16px);
                    border: 1px solid rgba(57, 255, 20, 0.3);
                    box-shadow: 0 0 20px rgba(57, 255, 20, 0.1);
                    border-radius: 12px;
                    padding: 24px;
                    position: relative;
                    overflow: hidden;
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                .cyber-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 0 30px rgba(57, 255, 20, 0.2);
                    border-color: rgba(57, 255, 20, 0.6);
                }
                .cyber-card::before {
                    content: '🌙';
                    position: absolute;
                    top: -10px;
                    right: -10px;
                    font-size: 80px;
                    opacity: 0.05;
                    transform: rotate(30deg);
                    filter: sepia(1) hue-rotate(80deg) saturate(5);
                }
                .cyber-card-icon {
                    font-size: 28px;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .cyber-card-value {
                    font-size: 42px;
                    font-weight: 900;
                    color: var(--cyber-green);
                    text-shadow: 0 0 15px rgba(57, 255, 20, 0.4);
                    line-height: 1;
                    margin-bottom: 8px;
                }
                .cyber-card-label {
                    color: var(--cyber-teal);
                    font-size: 13px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .gears-bg {
                    position: absolute;
                    top: 10%;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 300px;
                    opacity: 0.03;
                    z-index: 1;
                    pointer-events: none;
                    filter: sepia(1) hue-rotate(80deg) saturate(3);
                }
                .cyber-table-wrapper {
                    position: relative;
                    z-index: 2;
                    background: rgba(6, 20, 16, 0.8);
                    border: 1px solid rgba(0, 243, 255, 0.2);
                    border-radius: 12px;
                    padding: 20px;
                    overflow: hidden;
                }
                .globe-bg {
                    position: absolute;
                    right: -50px;
                    top: -50px;
                    font-size: 400px;
                    opacity: 0.04;
                    z-index: 0;
                    pointer-events: none;
                    filter: sepia(1) hue-rotate(80deg) saturate(5);
                }
                .cyber-table {
                    width: 100%;
                    border-collapse: collapse;
                    position: relative;
                    z-index: 1;
                }
                .cyber-table th {
                    text-align: left;
                    padding: 16px;
                    color: var(--cyber-cyan);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    font-size: 12px;
                    border-bottom: 1px solid rgba(0, 243, 255, 0.3);
                }
                .cyber-table td {
                    padding: 16px;
                    color: #b2ebf2;
                    border-bottom: 1px solid rgba(0, 243, 255, 0.1);
                    font-size: 14px;
                }
                .cyber-table tr:hover td {
                    background: rgba(0, 243, 255, 0.05);
                }
                .cyber-badge {
                    padding: 6px 12px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: bold;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .cyber-badge-green {
                    color: var(--cyber-green);
                    border: 1px solid var(--cyber-green);
                    background: rgba(57, 255, 20, 0.1);
                    text-shadow: 0 0 5px rgba(57, 255, 20, 0.5);
                }
                .cyber-badge-amber {
                    color: var(--cyber-amber);
                    border: 1px solid var(--cyber-amber);
                    background: rgba(255, 170, 0, 0.1);
                    text-shadow: 0 0 5px rgba(255, 170, 0, 0.5);
                }

                .cyber-modal-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(8px);
                    z-index: 1000;
                    display: flex; align-items: center; justify-content: center;
                }
                .cyber-modal {
                    background: var(--cyber-dark);
                    border: 1px solid var(--cyber-cyan);
                    box-shadow: 0 0 40px rgba(0, 243, 255, 0.2);
                    padding: 32px;
                    border-radius: 12px;
                    width: 100%;
                    max-width: 500px;
                }
                .cyber-input {
                    background: rgba(0, 243, 255, 0.05);
                    border: 1px solid rgba(0, 243, 255, 0.3);
                    color: var(--cyber-cyan);
                    padding: 10px;
                    width: 100%;
                    border-radius: 4px;
                    outline: none;
                    font-family: monospace;
                }
                .cyber-input:focus {
                    border-color: var(--cyber-cyan);
                    box-shadow: 0 0 10px rgba(0, 243, 255, 0.3);
                }
            `}} />

            <div className="circuit-bg" />
            <div className="gears-bg">⚙️🕒</div>

            <div className="cyber-header">
                <div>
                    <h1 className="cyber-title">ATTENDANCE_SYSTEM</h1>
                    <p className="cyber-subtitle">
                        {isAdmin ? 'Monitor team attendance and work hours' : 'Track your daily attendance'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {!isAdmin && (
                        <>
                            {!todayRecord && (
                                <button className="cyber-btn-primary" style={{ borderColor: 'var(--cyber-green)', color: 'var(--cyber-green)', boxShadow: '0 0 10px rgba(57, 255, 20, 0.2)' }} onClick={handleClockIn}>
                                    INITIATE_CLOCK_IN
                                </button>
                            )}
                            {isClockedIn && (
                                <button className="cyber-btn-primary" style={{ borderColor: '#ff003c', color: '#ff003c', boxShadow: '0 0 10px rgba(255, 0, 60, 0.2)' }} onClick={handleClockOut}>
                                    TERMINATE_CLOCK_OUT
                                </button>
                            )}
                            {todayRecord && !isClockedIn && (
                                <span className="cyber-badge cyber-badge-green" style={{ fontSize: '14px', display: 'flex', alignItems: 'center' }}>
                                    ✓ CYCLE_COMPLETE
                                </span>
                            )}
                        </>
                    )}
                    {isAdmin && (
                        <button className="cyber-btn-primary" onClick={() => setShowModal(true)}>
                            + Add Record
                        </button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="cyber-stats-grid">
                <div className="cyber-card">
                    <div className="cyber-card-icon">
                        <span style={{ filter: 'drop-shadow(0 0 5px rgba(0, 243, 255, 0.8))' }}>📅</span>
                    </div>
                    <div className="cyber-card-value">{records.length}</div>
                    <div className="cyber-card-label">Total Records</div>
                </div>
                <div className="cyber-card">
                    <div className="cyber-card-icon">
                        <span style={{ filter: 'drop-shadow(0 0 5px rgba(0, 243, 255, 0.8))' }}>🕒 ⚙️ 🖱️</span>
                    </div>
                    <div className="cyber-card-value">{totalHoursThisMonth.toFixed(1)}</div>
                    <div className="cyber-card-label">Hours This Month</div>
                </div>
                <div className="cyber-card">
                    <div className="cyber-card-icon">
                        <span style={{ filter: 'drop-shadow(0 0 5px rgba(255, 170, 0, 0.8))' }}>🔥</span>
                    </div>
                    <div className="cyber-card-value">{totalOTThisMonth.toFixed(1)}</div>
                    <div className="cyber-card-label">OT Hours This Month</div>
                </div>
            </div>

            {/* Table */}
            <div className="cyber-table-wrapper">
                <div className="globe-bg">🌐</div>
                <h3 style={{ color: 'var(--cyber-cyan)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '14px', marginBottom: '20px', borderBottom: '1px solid rgba(0, 243, 255, 0.2)', paddingBottom: '10px' }}>
                    Attendance Records
                </h3>
                <table className="cyber-table">
                    <thead>
                        <tr>
                            {isAdmin && <th>Employee</th>}
                            <th>Date</th>
                            <th>Time In</th>
                            <th>Time Out</th>
                            <th>Total Hours</th>
                            <th>Overtime</th>
                            <th>Status</th>
                            {isAdmin && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {records.map((r) => (
                            <tr key={r.id}>
                                {isAdmin && (
                                    <td style={{ fontWeight: 600, color: 'white' }}>
                                        {r.employee?.firstName} {r.employee?.lastName}
                                    </td>
                                )}
                                <td style={{ fontFamily: 'monospace' }}>{r.date}</td>
                                <td style={{ fontFamily: 'monospace' }}>{r.timeIn || '—'}</td>
                                <td style={{ fontFamily: 'monospace' }}>{r.timeOut || '—'}</td>
                                <td style={{ fontWeight: 700, color: 'var(--cyber-green)', fontFamily: 'monospace' }}>
                                    {r.totalHours ? `${r.totalHours}h` : '—'}
                                </td>
                                <td style={{ fontFamily: 'monospace', color: r.overtimeHours ? 'var(--cyber-amber)' : 'inherit' }}>
                                    {r.overtimeHours ? `${r.overtimeHours}h` : '—'}
                                </td>
                                <td>
                                    <span className={`cyber-badge ${r.timeOut ? 'cyber-badge-green' : 'cyber-badge-amber'}`}>
                                        {r.timeOut ? '✓ Complete' : '⚠ In Progress'}
                                    </span>
                                </td>
                                {isAdmin && (
                                    <td>
                                        <button className="cyber-btn-primary" style={{ padding: '4px 8px', fontSize: '10px', borderColor: '#ff003c', color: '#ff003c', boxShadow: 'none' }} onClick={() => handleDelete(r.id)}>DELETE</button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {records.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--cyber-teal)' }}>
                        <div style={{ fontSize: '32px', marginBottom: '16px' }}>NO_DATA_FOUND</div>
                        <div style={{ fontFamily: 'monospace' }}>system.fetch(records) returned 0</div>
                    </div>
                )}
            </div>

            {/* Manual Add Modal (Admin) */}
            {showModal && (
                <div className="cyber-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="cyber-modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="cyber-title" style={{ fontSize: '20px', marginBottom: '24px' }}>ADD_RECORD.exe</h2>
                        <form onSubmit={handleManualAdd}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', color: 'var(--cyber-teal)', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase' }}>Employee</label>
                                <select className="cyber-input" value={form.employeeId}
                                    onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required>
                                    <option value="" style={{ background: 'var(--cyber-dark)' }}>Select employee...</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id} style={{ background: 'var(--cyber-dark)' }}>
                                            {emp.firstName} {emp.lastName} ({emp.empNo})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', color: 'var(--cyber-teal)', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase' }}>Date</label>
                                <input className="cyber-input" type="date" value={form.date}
                                    onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                                <div>
                                    <label style={{ display: 'block', color: 'var(--cyber-teal)', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase' }}>Time In</label>
                                    <input className="cyber-input" type="time" value={form.timeIn}
                                        onChange={(e) => setForm({ ...form, timeIn: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: 'var(--cyber-teal)', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase' }}>Time Out</label>
                                    <input className="cyber-input" type="time" value={form.timeOut}
                                        onChange={(e) => setForm({ ...form, timeOut: e.target.value })} required />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>ABORT</button>
                                <button type="submit" className="btn btn-primary">EXECUTE</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
