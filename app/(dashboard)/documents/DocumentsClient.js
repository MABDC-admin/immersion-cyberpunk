"use client";

import { useState, useEffect } from 'react';

const docTypes = [
    'Emirates ID',
    'Passport',
    'Visa',
    'Employment Contract',
    'Health Insurance',
    'Other'
];

export default function DocumentsClient() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [fileOptions, setFileOptions] = useState(null);
    const [formData, setFormData] = useState({ title: '', type: docTypes[0], expiryDate: '' });

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const res = await fetch('/api/documents');
            if (res.ok) {
                setDocuments(await res.json());
            }
        } catch (error) {
            console.error('Failed to fetch documents', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('type', formData.type);
            if (formData.expiryDate) {
                data.append('expiryDate', formData.expiryDate);
            }
            if (fileOptions) {
                data.append('file', fileOptions);
            }

            const res = await fetch('/api/documents', {
                method: 'POST',
                // Fetch automatically sets the multipart boundary when passing FormData
                body: data,
            });
            if (res.ok) {
                const newDoc = await res.json();
                setDocuments([newDoc, ...documents]);
                setShowModal(false);
                setFormData({ title: '', type: docTypes[0], expiryDate: '' });
                setFileOptions(null);
            }
        } catch (error) {
            console.error('Failed to submit document', error);
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColor = (status, expiryDate) => {
        if (status === 'Expired') return 'badge-danger';
        if (!expiryDate) return 'badge-success';

        const daysUntilExpiry = (new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
        if (daysUntilExpiry < 0) return 'badge-danger';
        if (daysUntilExpiry < 30) return 'badge-warning';
        return 'badge-success';
    };

    const getStatusText = (status, expiryDate) => {
        if (status === 'Expired') return 'Expired';
        if (!expiryDate) return 'Valid';

        const daysUntilExpiry = (new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
        if (daysUntilExpiry < 0) return 'Expired';
        if (daysUntilExpiry < 30) return 'Expiring Soon';
        return 'Valid';
    };

    return (
        <div className="page animate-fadeInUp">
            <div className="page-header">
                <div>
                    <h1 className="page-title">My Documents</h1>
                    <p className="page-subtitle">Manage your official HR documents and IDs</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Upload Document</button>
            </div>

            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading documents...</div>
                ) : documents.length === 0 ? (
                    <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
                        <p>You haven't uploaded any documents yet.</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Document Title</th>
                                    <th>Employee</th>
                                    <th>Type</th>
                                    <th>Upload Date</th>
                                    <th>Expiry Date</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {documents.map((doc) => (
                                    <tr key={doc.id}>
                                        <td style={{ fontWeight: 500 }}>{doc.title}</td>
                                        <td>
                                            {doc.employee ? (
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span>{doc.employee.firstName} {doc.employee.lastName}</span>
                                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{doc.employee.empNo}</span>
                                                </div>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)' }}>Me</span>
                                            )}
                                        </td>
                                        <td>{doc.type}</td>
                                        <td>{new Date(doc.uploadDate).toLocaleDateString()}</td>
                                        <td>{doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : 'N/A'}</td>
                                        <td>
                                            <span className={`badge ${getStatusColor(doc.status, doc.expiryDate)}`}>
                                                {getStatusText(doc.status, doc.expiryDate)}
                                            </span>
                                        </td>
                                        <td>
                                            <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>Download</a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass-card animate-fadeInUp" style={{ maxWidth: '500px' }}>
                        <h2 style={{ marginBottom: '24px' }}>Upload New Document</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                            <div className="form-group">
                                <label className="form-label">Document Title</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Emirates ID Copy"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Document Type</label>
                                <select
                                    className="form-input"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    required
                                >
                                    {docTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Expiry Date (Optional)</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.expiryDate}
                                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">File</label>
                                <input
                                    type="file"
                                    className="form-input"
                                    style={{ padding: '10px' }}
                                    onChange={(e) => setFileOptions(e.target.files[0])}
                                />
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>PDF, JPG, or PNG (Max 5MB)</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Uploading...' : 'Upload Document'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
