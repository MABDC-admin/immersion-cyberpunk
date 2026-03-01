"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TrainingClient({ activeEmployees }) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('Catalog'); // 'Catalog' or 'Enrollments'
    
    // Course State
    const [courses, setCourses] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [courseForm, setCourseForm] = useState({ title: '', description: '', instructor: '', duration: 60 });
    
    // Enrollment State
    const [enrollments, setEnrollments] = useState([]);
    const [loadingEnrollments, setLoadingEnrollments] = useState(true);
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [editingEnrollment, setEditingEnrollment] = useState(null);
    const [enrollForm, setEnrollForm] = useState({ employeeId: '', courseId: '', status: 'Enrolled', score: '', completionDate: '' });

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCourses();
        fetchEnrollments();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await fetch('/api/training');
            if (res.ok) setCourses(await res.json());
        } catch (error) {
            console.error('Failed to fetch courses', error);
        } finally {
            setLoadingCourses(false);
        }
    };

    const fetchEnrollments = async () => {
        try {
            const res = await fetch('/api/training/enrollments');
            if (res.ok) setEnrollments(await res.json());
        } catch (error) {
            console.error('Failed to fetch enrollments', error);
        } finally {
            setLoadingEnrollments(false);
        }
    };

    // --- Course Actions ---
    const openCreateCourse = () => {
        setEditingCourse(null);
        setCourseForm({ title: '', description: '', instructor: '', duration: 60 });
        setError('');
        setShowCourseModal(true);
    };

    const openEditCourse = (course) => {
        setEditingCourse(course);
        setCourseForm({ title: course.title, description: course.description || '', instructor: course.instructor || '', duration: course.duration });
        setError('');
        setShowCourseModal(true);
    };

    const handleCourseSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const url = editingCourse ? `/api/training/${editingCourse.id}` : '/api/training';
            const method = editingCourse ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(courseForm),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to save course');
            }

            const saved = await res.json();
            if (editingCourse) {
                setCourses(courses.map(c => c.id === saved.id ? saved : c));
            } else {
                setCourses([...courses, { ...saved, _count: { enrollments: 0 } }]);
            }
            setShowCourseModal(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteCourse = async (id) => {
        if (!confirm('Are you sure you want to delete this course?')) return;
        try {
            const res = await fetch(`/api/training/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete');
            }
            setCourses(courses.filter(c => c.id !== id));
        } catch (err) {
            alert(err.message);
        }
    };

    // --- Enrollment Actions ---
    const openCreateEnrollment = () => {
        setEditingEnrollment(null);
        setEnrollForm({ 
            employeeId: activeEmployees[0]?.id || '', 
            courseId: courses[0]?.id || '', 
            status: 'Enrolled', score: '', completionDate: '' 
        });
        setError('');
        setShowEnrollModal(true);
    };

    const openEditEnrollment = (enrollment) => {
        setEditingEnrollment(enrollment);
        setEnrollForm({ 
            employeeId: enrollment.employeeId, 
            courseId: enrollment.courseId, 
            status: enrollment.status, 
            score: enrollment.score || '', 
            completionDate: enrollment.completionDate ? new Date(enrollment.completionDate).toISOString().split('T')[0] : ''
        });
        setError('');
        setShowEnrollModal(true);
    };

    const handleEnrollmentSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const url = editingEnrollment ? `/api/training/enrollments/${editingEnrollment.id}` : '/api/training/enrollments';
            const method = editingEnrollment ? 'PUT' : 'POST';

            const payload = { ...enrollForm };
            if (!payload.score) payload.score = null;
            if (!payload.completionDate) payload.completionDate = null;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to save enrollment');
            }

            const saved = await res.json();
            if (editingEnrollment) {
                setEnrollments(enrollments.map(e => e.id === saved.id ? saved : e));
            } else {
                setEnrollments([saved, ...enrollments]);
                // Automatically increment the course count on the client for UX
                setCourses(courses.map(c => c.id === saved.courseId ? { ...c, _count: { enrollments: c._count.enrollments + 1 } } : c));
            }
            setShowEnrollModal(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteEnrollment = async (id, courseId) => {
        if (!confirm('Are you sure you want to remove this enrollment?')) return;
        try {
            const res = await fetch(`/api/training/enrollments/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            setEnrollments(enrollments.filter(e => e.id !== id));
            // Automatically decrement the course count
            setCourses(courses.map(c => c.id === courseId ? { ...c, _count: { enrollments: Math.max(0, c._count.enrollments - 1) } } : c));
        } catch (err) {
            alert(err.message);
        }
    };

    // --- Rendering Helpers ---
    const getStatusBadge = (status) => {
        switch (status) {
            case 'Completed': return <span className="badge badge-success">Completed</span>;
            case 'In Progress': return <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.1)', color: 'var(--info)' }}>In Progress</span>;
            case 'Enrolled':
            default: return <span className="badge badge-neutral">Enrolled</span>;
        }
    };

    return (
        <div className="page animate-fadeInUp">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Training & LMS</h1>
                    <p className="page-subtitle">Manage course catalog and employee enrollments</p>
                </div>
                <div>
                    {activeTab === 'Catalog' ? (
                        <button className="btn btn-primary" onClick={openCreateCourse}>+ New Course</button>
                    ) : (
                        <button className="btn btn-primary" onClick={openCreateEnrollment} disabled={courses.length === 0}>+ Enroll Employee</button>
                    )}
                </div>
            </div>

            <div className="profile-tabs" style={{ marginBottom: '24px' }}>
                {['Catalog', 'Enrollments'].map(tab => (
                    <button
                        key={tab}
                        className={`profile-tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                        style={{ flex: 1, textAlign: 'center' }}
                    >
                        {tab === 'Catalog' ? '📚 Course Catalog' : '🎓 Employee Enrollments'}
                    </button>
                ))}
            </div>

            <div className="data-table-wrapper animate-fadeInUp" key={activeTab}>
                {activeTab === 'Catalog' && (
                    <>
                        {loadingCourses ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading catalog...</div>
                        ) : courses.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center' }}><div className="empty-state-text">No courses available.</div></div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Course Title</th>
                                        <th>Instructor</th>
                                        <th>Duration</th>
                                        <th>Enrolled</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {courses.map(course => (
                                        <tr key={course.id}>
                                            <td style={{ fontWeight: 600 }}>
                                                {course.title}
                                                {course.description && <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'normal', marginTop: '4px' }}>{course.description}</div>}
                                            </td>
                                            <td>{course.instructor || '—'}</td>
                                            <td>{course.duration} mins</td>
                                            <td>
                                                <span className="badge" style={{ background: 'rgba(0, 243, 255, 0.1)', color: 'var(--cyber-cyan)' }}>
                                                    {course._count?.enrollments || 0}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => openEditCourse(course)}>Edit</button>
                                                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCourse(course.id)} disabled={course._count?.enrollments > 0}>Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </>
                )}

                {activeTab === 'Enrollments' && (
                    <>
                        {loadingEnrollments ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading enrollments...</div>
                        ) : enrollments.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center' }}><div className="empty-state-text">No active enrollments.</div></div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th>Course</th>
                                        <th>Status</th>
                                        <th>Score</th>
                                        <th>Completion Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {enrollments.map(enroll => (
                                        <tr key={enroll.id}>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{enroll.employee?.firstName} {enroll.employee?.lastName}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{enroll.employee?.empNo || '—'}</div>
                                            </td>
                                            <td>{enroll.course?.title}</td>
                                            <td>{getStatusBadge(enroll.status)}</td>
                                            <td>
                                                {enroll.score ? (
                                                    <span style={{ color: 'var(--cyber-teal)', fontFamily: 'monospace', fontWeight: 'bold' }}>{enroll.score}%</span>
                                                ) : '—'}
                                            </td>
                                            <td>{enroll.completionDate ? new Date(enroll.completionDate).toLocaleDateString() : '—'}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => openEditEnrollment(enroll)}>Edit</button>
                                                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteEnrollment(enroll.id, enroll.courseId)}>Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </>
                )}
            </div>

            {/* Course Modal */}
            {showCourseModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass-card animate-fadeInUp" style={{ maxWidth: '500px' }}>
                        <h2 style={{ marginBottom: '24px' }}>{editingCourse ? 'Edit Course' : 'Create Course'}</h2>
                        {error && <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}
                        <form onSubmit={handleCourseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="form-group">
                                <label className="form-label">Course Title</label>
                                <input type="text" className="form-input" value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea className="form-input" rows="3" value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group">
                                    <label className="form-label">Instructor</label>
                                    <input type="text" className="form-input" value={courseForm.instructor} onChange={(e) => setCourseForm({ ...courseForm, instructor: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Duration (Minutes)</label>
                                    <input type="number" className="form-input" value={courseForm.duration} onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })} required />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCourseModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save Course'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Enrollment Modal */}
            {showEnrollModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass-card animate-fadeInUp" style={{ maxWidth: '500px' }}>
                        <h2 style={{ marginBottom: '24px' }}>{editingEnrollment ? 'Update Enrollment' : 'Enroll Employee'}</h2>
                        {error && <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}
                        <form onSubmit={handleEnrollmentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            
                            {!editingEnrollment && (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">Employee</label>
                                        <select className="form-input" value={enrollForm.employeeId} onChange={(e) => setEnrollForm({ ...enrollForm, employeeId: e.target.value })} required>
                                            <option value="" disabled>Select Employee</option>
                                            {activeEmployees.map(emp => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.empNo || 'N/A'})</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Course</label>
                                        <select className="form-input" value={enrollForm.courseId} onChange={(e) => setEnrollForm({ ...enrollForm, courseId: e.target.value })} required>
                                            <option value="" disabled>Select Course</option>
                                            {courses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}
                                        </select>
                                    </div>
                                </>
                            )}
                            {editingEnrollment && (
                                <div style={{ padding: '16px', background: 'var(--surface-hover)', borderRadius: '8px', marginBottom: '8px' }}>
                                    <div style={{ fontWeight: 600 }}>{editingEnrollment.employee?.firstName} {editingEnrollment.employee?.lastName}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Course: {editingEnrollment.course?.title}</div>
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select className="form-input" value={enrollForm.status} onChange={(e) => setEnrollForm({ ...enrollForm, status: e.target.value })} required>
                                    <option value="Enrolled">Enrolled</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>

                            {/* Only show Score/Date if completed, or allow tracking manually */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group">
                                    <label className="form-label">Score (%)</label>
                                    <input type="number" min="0" max="100" className="form-input" value={enrollForm.score} onChange={(e) => setEnrollForm({ ...enrollForm, score: e.target.value })} placeholder="Optional" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Completion Date</label>
                                    <input type="date" className="form-input" value={enrollForm.completionDate} onChange={(e) => setEnrollForm({ ...enrollForm, completionDate: e.target.value })} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowEnrollModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save Enrollment'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
