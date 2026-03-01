"use client";

import { useState, useEffect } from 'react';

export default function TrainingTab({ employeeId }) {
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (employeeId) {
            fetchEnrollments();
        }
    }, [employeeId]);

    const fetchEnrollments = async () => {
        try {
            const res = await fetch(`/api/training/enrollments?employeeId=${employeeId}`);
            if (res.ok) {
                const data = await res.json();
                setEnrollments(data);
            }
        } catch (error) {
            console.error('Failed to fetch training enrollments:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Completed': return <span className="badge badge-success">Completed</span>;
            case 'In Progress': return <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.1)', color: 'var(--info)' }}>In Progress</span>;
            case 'Enrolled':
            default: return <span className="badge badge-neutral">Enrolled</span>;
        }
    };

    if (loading) {
        return (
            <div className="animate-fadeInUp" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading learning records...
            </div>
        );
    }

    if (enrollments.length === 0) {
        return (
            <div className="animate-fadeInUp" style={{ padding: '60px 40px', textAlign: 'center', border: '1px dashed rgba(255, 255, 255, 0.1)', borderRadius: '12px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🎓</div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>No Training Records Found</h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto', lineHeight: 1.5 }}>
                    This employee has not been enrolled in any courses yet.
                </p>
            </div>
        );
    }

    // Calculate learning metrics
    const completedCourses = enrollments.filter(e => e.status === 'Completed').length;
    const totalMinutes = enrollments.filter(e => e.status === 'Completed').reduce((acc, e) => acc + (e.course?.duration || 0), 0);
    const averageScore = enrollments.filter(e => e.status === 'Completed' && e.score).length > 0
        ? Math.round(enrollments.filter(e => e.status === 'Completed' && e.score).reduce((acc, e) => acc + e.score, 0) / enrollments.filter(e => e.status === 'Completed' && e.score).length)
        : null;

    return (
        <div className="animate-fadeInUp">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--cyber-cyan)', margin: 0 }}>Learning & Development</h2>
            </div>
            
            {/* Vitals Summary Matrix */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: 'rgba(0, 243, 255, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0, 243, 255, 0.1)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontSize: '24px', opacity: 0.8 }}>✅</div>
                    <div>
                        <div style={{ color: 'var(--cyber-teal)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Courses Completed</div>
                        <div style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold' }}>{completedCourses}</div>
                    </div>
                </div>
                <div style={{ background: 'rgba(0, 243, 255, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0, 243, 255, 0.1)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontSize: '24px', opacity: 0.8 }}>⏱️</div>
                    <div>
                        <div style={{ color: 'var(--cyber-teal)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Learning Hours</div>
                        <div style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold' }}>{(totalMinutes / 60).toFixed(1)} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>hrs</span></div>
                    </div>
                </div>
                {averageScore && (
                    <div style={{ background: 'rgba(0, 243, 255, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0, 243, 255, 0.1)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ fontSize: '24px', opacity: 0.8 }}>🎯</div>
                        <div>
                            <div style={{ color: 'var(--cyber-teal)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Avg. Score</div>
                            <div style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold' }}>{averageScore}%</div>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="data-table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Course Name</th>
                            <th>Instructor</th>
                            <th>Duration</th>
                            <th>Status</th>
                            <th>Score</th>
                            <th>Completion Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {enrollments.map(enroll => {
                            return (
                                <tr key={enroll.id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{enroll.course?.title}</div>
                                        {enroll.course?.description && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{enroll.course.description}</div>}
                                    </td>
                                    <td>{enroll.course?.instructor || '—'}</td>
                                    <td>{enroll.course?.duration} mins</td>
                                    <td>{getStatusBadge(enroll.status)}</td>
                                    <td>
                                        {enroll.score ? (
                                            <span style={{ color: 'var(--cyber-teal)', fontFamily: 'monospace', fontWeight: 'bold' }}>
                                                {enroll.score}%
                                            </span>
                                        ) : '—'}
                                    </td>
                                    <td>{enroll.completionDate ? new Date(enroll.completionDate).toLocaleDateString() : '—'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
