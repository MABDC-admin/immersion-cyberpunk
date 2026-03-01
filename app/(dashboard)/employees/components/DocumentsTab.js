import React, { useState } from 'react';

const docTypes = [
    'Emirates ID',
    'Passport',
    'Visa',
    'Employment Contract',
    'Health Insurance',
    'Other'
];

export default function DocumentsTab({ employee }) {
    const defaultDocuments = employee?.documents || [];
    const [extraDocuments, setExtraDocuments] = useState([]);
    const documents = [...extraDocuments, ...defaultDocuments];

    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ title: '', type: docTypes[0], expiryDate: '' });
    const [fileOptions, setFileOptions] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('type', formData.type);
            data.append('employeeId', employee.id);
            if (formData.expiryDate) {
                data.append('expiryDate', formData.expiryDate);
            }
            if (fileOptions) {
                data.append('file', fileOptions);
            }

            const res = await fetch('/api/documents', {
                method: 'POST',
                body: data,
            });
            if (res.ok) {
                const newDoc = await res.json();
                setExtraDocuments([newDoc, ...extraDocuments]);
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

    const getStatusTheme = (status) => {
        switch (status) {
            case 'Valid': return 'var(--success)';
            case 'Expiring Soon': return 'var(--warning)';
            case 'Expired': return 'var(--danger)';
            default: return 'var(--info)';
        }
    };

    return (
        <div className="animate-fadeInUp">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ color: 'var(--cyber-cyan)', fontSize: '18px', letterSpacing: '1px', margin: 0 }}>
                    📁 Corporate & Legal Documents
                </h3>
                <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ padding: '8px 16px', fontSize: '14px' }}>
                    + Upload Document
                </button>
            </div>
            
            {documents.length === 0 ? (
                <div style={{ padding: '30px', background: 'rgba(0, 243, 255, 0.05)', borderRadius: '8px', border: '1px solid rgba(0, 243, 255, 0.1)', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No documents have been uploaded to this employee's vault.
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    {documents.map(doc => (
                        <div key={doc.id} style={{ 
                            background: 'rgba(6, 20, 16, 0.6)', 
                            border: '1px solid rgba(0, 243, 255, 0.15)', 
                            borderRadius: '12px', 
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: getStatusTheme(doc.status) }} />
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ color: '#fff', fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>{doc.title}</div>
                                    <div style={{ color: 'var(--cyber-teal)', fontSize: '12px', textTransform: 'uppercase' }}>{doc.type}</div>
                                </div>
                                <span className="badge" style={{ background: 'transparent', border: `1px solid ${getStatusTheme(doc.status)}`, color: getStatusTheme(doc.status), padding: '4px 8px', fontSize: '10px' }}>
                                    {doc.status}
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Uploaded:</span>
                                    <span style={{ color: '#b2ebf2' }}>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                                </div>
                                {doc.expiryDate && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Expires:</span>
                                        <span style={{ color: getStatusTheme(doc.status) }}>{doc.expiryDate}</span>
                                    </div>
                                )}
                                <div style={{ marginTop: '12px', textAlign: 'right' }}>
                                    <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', textDecoration: 'none' }}>Download</a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" style={{ zIndex: 1000 }}>
                    <div className="modal-content glass-card animate-fadeInUp" style={{ maxWidth: '500px' }}>
                        <h2 style={{ marginBottom: '24px' }}>Upload Document for {employee.firstName}</h2>
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
