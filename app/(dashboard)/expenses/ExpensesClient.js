'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ExpensesClient({ initialMyExpenses, initialAllExpenses, isHR, userEmployeeId }) {
    const [myExpenses, setMyExpenses] = useState(initialMyExpenses || []);
    const [allExpenses, setAllExpenses] = useState(initialAllExpenses || []);
    const [activeTab, setActiveTab] = useState('my-expenses');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [uploading, setUploading] = useState(false);
    const [receiptKey, setReceiptKey] = useState('');

    const [newExpense, setNewExpense] = useState({
        amount: '',
        category: 'Travel',
        date: new Date().toISOString().split('T')[0],
        description: '',
        receiptUrl: ''
    });

    const router = useRouter();

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setMessage({ text: '', type: '' });

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Upload failed');

            setReceiptKey(data.key);
            setNewExpense({ ...newExpense, receiptUrl: data.key }); // We store the key in the database
            setMessage({ text: 'File uploaded successfully!', type: 'success' });
        } catch (error) {
            setMessage({ text: 'Upload failed: ' + error.message, type: 'error' });
        } finally {
            setUploading(false);
        }
    };

    const handleSubmitExpense = async (e) => {
        e.preventDefault();

        if (!receiptKey) {
            setMessage({ text: 'Please upload a receipt first.', type: 'error' });
            return;
        }

        setIsSubmitting(true);
        setMessage({ text: '', type: '' });

        try {
            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newExpense,
                    receiptUrl: receiptKey // Send the S3 key
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to submit expense');

            setMessage({ text: 'Expense submitted successfully!', type: 'success' });

            // Refresh local state
            const resUpdated = await fetch('/api/expenses');
            if (resUpdated.ok) {
                const refreshedData = await resUpdated.json();
                setMyExpenses(refreshedData);
            }

            setShowModal(false);
            setNewExpense({
                amount: '',
                category: 'Travel',
                date: new Date().toISOString().split('T')[0],
                description: '',
                receiptUrl: ''
            });
            setReceiptKey('');
            router.refresh();
        } catch (error) {
            setMessage({ text: error.message, type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            'Pending': { bg: 'rgba(255, 193, 7, 0.1)', color: '#ffc107', border: '1px solid #ffc107' },
            'Approved': { bg: 'rgba(0, 255, 159, 0.1)', color: 'var(--cyber-teal)', border: '1px solid var(--cyber-teal)' },
            'Rejected': { bg: 'rgba(255, 0, 112, 0.1)', color: 'var(--cyber-pink)', border: '1px solid var(--cyber-pink)' },
            'Paid': { bg: 'rgba(0, 243, 255, 0.1)', color: 'var(--cyber-cyan)', border: '1px solid var(--cyber-cyan)' }
        };
        const style = styles[status] || styles['Pending'];
        return (
            <span style={{
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                ...style
            }}>
                {status}
            </span>
        );
    };

    return (
        <div className="page animate-fadeInUp">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Expense Management</h1>
                    <p className="page-subtitle">Submit and track business-related reimbursements</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    + SUBMIT NEW EXPENSE
                </button>
            </div>

            {/* Tabs */}
            <div className="profile-tabs" style={{ marginBottom: '32px' }}>
                <button
                    className={`profile-tab ${activeTab === 'my-expenses' ? 'active' : ''}`}
                    onClick={() => setActiveTab('my-expenses')}
                >
                    💰 MY REIMBURSEMENTS
                </button>
                {isHR && (
                    <button
                        className={`profile-tab ${activeTab === 'all-expenses' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all-expenses')}
                    >
                        🏢 COMPANY-WIDE OVERVIEW
                    </button>
                )}
            </div>

            {message.text && (
                <div className="glass-card animate-fadeInUp" style={{
                    padding: '16px',
                    marginBottom: '24px',
                    background: message.type === 'success' ? 'rgba(0, 255, 159, 0.05)' : 'rgba(255, 0, 112, 0.05)',
                    color: message.type === 'success' ? 'var(--cyber-teal)' : 'var(--cyber-pink)',
                    border: `1px solid ${message.type === 'success' ? 'var(--cyber-teal)' : 'var(--cyber-pink)'}`
                }}>
                    {message.text}
                </div>
            )}

            {activeTab === 'my-expenses' && (
                <div className="glass-card animate-fadeInUp" style={{ padding: '0', overflow: 'hidden' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>DATE</th>
                                <th>CATEGORY</th>
                                <th>DESCRIPTION</th>
                                <th>AMOUNT</th>
                                <th>STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myExpenses.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                        No expense claims found.
                                    </td>
                                </tr>
                            ) : (
                                myExpenses.map(expense => (
                                    <tr key={expense.id}>
                                        <td>{new Date(expense.date).toLocaleDateString()}</td>
                                        <td>{expense.category}</td>
                                        <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {expense.description || '-'}
                                        </td>
                                        <td style={{ color: 'var(--cyber-cyan)', fontWeight: 'bold' }}>
                                            AED {expense.amount.toFixed(2)}
                                        </td>
                                        <td><StatusBadge status={expense.status} /></td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'all-expenses' && isHR && (
                <div className="glass-card animate-fadeInUp" style={{ padding: '0', overflow: 'hidden' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>EMPLOYEE</th>
                                <th>DATE</th>
                                <th>CATEGORY</th>
                                <th>AMOUNT</th>
                                <th>STATUS</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allExpenses.map(expense => (
                                <tr key={expense.id}>
                                    <td>
                                        <div style={{ fontWeight: 'bold' }}>{expense.employee?.firstName} {expense.employee?.lastName}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{expense.employee?.empNo}</div>
                                    </td>
                                    <td>{new Date(expense.date).toLocaleDateString()}</td>
                                    <td>{expense.category}</td>
                                    <td style={{ color: 'var(--cyber-cyan)', fontWeight: 'bold' }}>
                                        AED {expense.amount.toFixed(2)}
                                    </td>
                                    <td><StatusBadge status={expense.status} /></td>
                                    <td>
                                        {expense.receiptUrl ? (
                                            <a
                                                href={expense.receiptUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-ghost btn-sm"
                                            >
                                                VIEW RECEIPT
                                            </a>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>NO RECEIPT</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Submit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content glass-card animate-fadeInUp" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', borderTop: '4px solid var(--cyber-cyan)' }}>
                        <div className="modal-header">
                            <h2 style={{ color: 'var(--cyber-cyan)' }}>Submit Expense Claim</h2>
                        </div>
                        <form onSubmit={handleSubmitExpense}>
                            <div className="form-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
                                <div className="form-group">
                                    <label className="form-label">Amount (AED)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-input"
                                        required
                                        value={newExpense.amount}
                                        onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Category</label>
                                    <select
                                        className="form-input"
                                        value={newExpense.category}
                                        onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                                    >
                                        <option>Travel</option>
                                        <option>Meals</option>
                                        <option>Supplies</option>
                                        <option>Equipment</option>
                                        <option>Client Entertainment</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label">Date of Expenditure</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        required
                                        value={newExpense.date}
                                        onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                                    />
                                </div>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label">Description / Purpose</label>
                                    <textarea
                                        className="form-input"
                                        rows="3"
                                        value={newExpense.description}
                                        onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                                    ></textarea>
                                </div>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label">Receipt Proof (JPG, PNG, PDF)</label>
                                    <div style={{
                                        border: '2px dashed rgba(0, 243, 255, 0.2)',
                                        borderRadius: '8px',
                                        padding: '20px',
                                        textAlign: 'center',
                                        background: 'rgba(0, 243, 255, 0.02)'
                                    }}>
                                        <input
                                            type="file"
                                            id="receiptInput"
                                            className="form-input"
                                            style={{ display: 'none' }}
                                            onChange={handleFileUpload}
                                            accept="image/*,application/pdf"
                                        />
                                        <label htmlFor="receiptInput" style={{ cursor: 'pointer' }}>
                                            <div style={{ fontSize: '24px', marginBottom: '8px' }}>{uploading ? '⏳' : '📎'}</div>
                                            <div style={{ color: 'var(--cyber-cyan)', fontWeight: 'bold' }}>
                                                {uploading ? 'UPLOADING...' : receiptKey ? 'RECEIPT ATTACHED' : 'CLICK TO UPLOAD RECEIPT'}
                                            </div>
                                            {receiptKey && <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>{receiptKey}</div>}
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-actions" style={{ marginTop: '32px' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>CANCEL</button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'PROCESSING...' : 'SUBMIT REIMBURSEMENT'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
