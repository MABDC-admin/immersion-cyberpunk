'use client';

import { useState, useEffect } from 'react';

export default function AttendanceTab({ employeeId }) {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/attendance?employeeId=${employeeId}`)
            .then(res => res.json())
            .then(data => {
                setRecords(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [employeeId]);

    if (loading) return <div style={{ padding: '20px', color: 'var(--cyber-teal)' }}>Loading attendance registry...</div>;

    return (
        <div className="animate-fadeInUp">
            <h3 style={{ color: 'var(--cyber-cyan)', fontSize: '18px', marginBottom: '20px', letterSpacing: '1px' }}>
                📅 Logged Attendance History
            </h3>
            
            {records.length === 0 ? (
                <div style={{ padding: '30px', background: 'rgba(0, 243, 255, 0.05)', borderRadius: '8px', border: '1px solid rgba(0, 243, 255, 0.1)', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No attendance records found for this employee.
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Check In</th>
                                <th>Check Out</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map(record => (
                                <tr key={record.id}>
                                    <td style={{ color: '#fff' }}>{record.date}</td>
                                    <td>{record.checkIn || '--:--'}</td>
                                    <td>{record.checkOut || '--:--'}</td>
                                    <td>
                                        <span className={`badge ${record.status === 'Present' ? 'badge-success' : record.status === 'Late' ? 'badge-warning' : 'badge-danger'}`}>
                                            {record.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
