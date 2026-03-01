'use client';

import React, { useState, useEffect } from 'react';

export default function ApprovalsClient({ currentUser, systemRoles, users }) {
    const [requests, setRequests] = useState([]);
    const [workflows, setWorkflows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('My Queue');
    
    // For creating requests (Mock integration)
    const [showNewRequest, setShowNewRequest] = useState(false);
    const [requestForm, setRequestForm] = useState({ workflowId: '', comments: '' });

    // For workflow builder (Admin only)
    const [showBuilder, setShowBuilder] = useState(false);
    const [builderForm, setBuilderForm] = useState({ name: '', entityType: 'GeneralRequest' });
    const [builderSteps, setBuilderSteps] = useState([{ approverRole: '', specificUserId: '' }]);
    const [actionComments, setActionComments] = useState('');

    const isAdmin = currentUser.roles?.includes('Super Admin');

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'My Queue' || activeTab === 'My Submissions') {
                const res = await fetch('/api/approvals/requests');
                if (res.ok) {
                    let data = await res.json();
                    if (activeTab === 'My Submissions') {
                        data = data.filter(r => r.requesterId === parseInt(currentUser.id));
                    } else {
                        data = data.filter(r => r.requesterId !== parseInt(currentUser.id) && r.status === 'Pending');
                    }
                    setRequests(data);
                }
            } else if (activeTab === 'Workflows' && isAdmin) {
                const res = await fetch('/api/approvals/workflows');
                if (res.ok) setWorkflows(await res.json());
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, action) => {
        try {
            const res = await fetch(`/api/approvals/requests/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, comments: actionComments })
            });
            if (res.ok) {
                setActionComments('');
                fetchData();
            }
        } catch (error) {
            console.error('Action error:', error);
        }
    };

    const submitRequest = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/approvals/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestForm)
            });
            if (res.ok) {
                setShowNewRequest(false);
                setRequestForm({ workflowId: '', comments: '' });
                fetchData();
            }
        } catch (error) {
            console.error('Submit error:', error);
        }
    };

    const saveWorkflow = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/approvals/workflows', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...builderForm, steps: builderSteps })
            });
            if (res.ok) {
                setShowBuilder(false);
                setBuilderForm({ name: '', entityType: 'GeneralRequest' });
                setBuilderSteps([{ approverRole: '', specificUserId: '' }]);
                fetchData();
            }
        } catch (error) {
            console.error('Save workflow error:', error);
        }
    };

    return (
        <div className="page">
            <div className="page-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 className="page-title">✅ Approval Workflows</h1>
                    <p className="page-subtitle">Manage, route, and sign off on internal requests.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-secondary" onClick={() => setShowNewRequest(true)}>
                        + Submit Request
                    </button>
                    {isAdmin && activeTab === 'Workflows' && (
                        <button className="btn btn-primary" onClick={() => setShowBuilder(true)}>
                            ⚙️ Build Workflow
                        </button>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid rgba(0, 243, 255, 0.2)' }}>
                {['My Queue', 'My Submissions', isAdmin ? 'Workflows' : null].filter(Boolean).map(tab => (
                    <button 
                        key={tab} 
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '12px 24px',
                            background: activeTab === tab ? 'var(--cyber-cyan)' : 'transparent',
                            color: activeTab === tab ? 'var(--cyber-dark)' : 'var(--cyber-cyan)',
                            fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px',
                            borderRadius: '8px 8px 0 0', cursor: 'pointer', fontFamily: 'monospace'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '50px', color: 'var(--primary)', animation: 'pulse 2s infinite' }}>⏳ Scanning Neural Pathways...</div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {/* REQUESTS QUEUE / SUBMISSIONS */}
                    {(activeTab === 'My Queue' || activeTab === 'My Submissions') && (
                        requests.length === 0 ? (
                            <div className="stat-card" style={{ textAlign: 'center', padding: '60px' }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📭</div>
                                <h3>No Pending Items</h3>
                                <p style={{ color: 'var(--text-muted)' }}>Your queue is currently clear.</p>
                            </div>
                        ) : (
                            requests.map(req => {
                                const totalSteps = req.workflow?.steps?.length || 1;
                                const progress = req.status === 'Approved' ? 100 : req.status === 'Rejected' ? 100 : ((req.currentStepOrder - 1) / totalSteps) * 100;
                                
                                return (
                                    <div key={req.id} className="stat-card" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                                        <div style={{ flex: 1, minWidth: '300px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                                <span className={`badge ${req.status === 'Approved' ? 'badge-success' : req.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>
                                                    {req.status.toUpperCase()}
                                                </span>
                                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                    {new Date(req.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                                                {req.workflow?.name}
                                            </h3>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
                                                Requested by: <strong style={{ color: 'var(--cyber-cyan)' }}>{req.requester?.firstName} {req.requester?.lastName}</strong> ({req.requester?.department?.name || 'HQ'})
                                            </p>

                                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', fontStyle: 'italic', borderLeft: '3px solid var(--border-color)' }}>
                                                {req.comments || 'No initial remarks provided by requester.'}
                                            </div>

                                            {activeTab === 'My Queue' && req.status === 'Pending' && (
                                                <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                                                    <input 
                                                        type="text" 
                                                        className="input-field" 
                                                        placeholder="Add an optional remark before actioning..." 
                                                        style={{ flex: 1, padding: '8px' }}
                                                        onBlur={(e) => setActionComments(e.target.value)}
                                                    />
                                                    <button className="btn btn-primary" style={{ padding: '8px 16px', background: 'var(--success)', borderColor: 'var(--success)' }} onClick={() => handleAction(req.id, 'Approve')}>
                                                        Approve
                                                    </button>
                                                    <button className="btn btn-secondary" style={{ padding: '8px 16px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }} onClick={() => handleAction(req.id, 'Reject')}>
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Progress Tracker Sidebar */}
                                        <div style={{ flex: 1, minWidth: '250px', background: 'rgba(0, 243, 255, 0.03)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                            <h4 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--cyber-teal)', marginBottom: '16px' }}>Routing Progress</h4>
                                            
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                                                <div style={{ position: 'absolute', left: '11px', top: '24px', bottom: '24px', width: '2px', background: 'rgba(255,255,255,0.1)', zIndex: 0 }}></div>
                                                
                                                {req.workflow?.steps?.map((step, idx) => {
                                                    const isPast = req.status === 'Approved' || req.currentStepOrder > step.stepOrder;
                                                    const isCurrent = req.status === 'Pending' && req.currentStepOrder === step.stepOrder;
                                                    const isRejectedHere = req.status === 'Rejected' && req.currentStepOrder === step.stepOrder;
                                                    
                                                    let nodeColor = 'rgba(255,255,255,0.2)';
                                                    if (isPast) nodeColor = 'var(--success)';
                                                    if (isCurrent) nodeColor = 'var(--cyber-cyan)';
                                                    if (isRejectedHere) nodeColor = 'var(--danger)';

                                                    return (
                                                        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', position: 'relative', zIndex: 1 }}>
                                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: nodeColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: isCurrent ? '0 0 10px var(--cyber-cyan)' : 'none' }}>
                                                                {isPast && <span style={{ color: '#000', fontSize: '12px' }}>✓</span>}
                                                                {isRejectedHere && <span style={{ color: '#000', fontSize: '12px' }}>✕</span>}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: '13px', fontWeight: 600, color: isCurrent ? 'var(--cyber-cyan)' : isPast ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                                                    Step {step.stepOrder}: {step.approverRole || 'Designated Person'}
                                                                </div>
                                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                                    {isPast ? 'Cleared' : isCurrent ? 'Awaiting Action' : 'Queued'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )
                    )}

                    {/* WORKFLOW BUILDER LIST */}
                    {activeTab === 'Workflows' && isAdmin && (
                        <div className="data-table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Workflow Name</th>
                                        <th>Entity Type</th>
                                        <th>Routing Steps</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {workflows.map(wf => (
                                        <tr key={wf.id}>
                                            <td style={{ fontWeight: 600, color: 'var(--cyber-cyan)' }}>{wf.name}</td>
                                            <td>{wf.entityType}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                    {wf.steps.map(s => (
                                                        <span key={s.id} className="badge badge-neutral" style={{ fontSize: '10px' }}>{s.stepOrder}. {s.approverRole || 'User'}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td><span className={`badge ${wf.isActive ? 'badge-success' : 'badge-danger'}`}>{wf.isActive ? 'Active' : 'Disabled'}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* NEW REQUEST MODAL */}
            {showNewRequest && (
                <div className="modal-overlay" style={{ zIndex: 1000 }}>
                    <div className="modal-content stat-card" style={{ maxWidth: '500px' }}>
                        <h2 style={{ marginBottom: '20px', color: 'var(--cyber-cyan)' }}>Initialize Approval Thread</h2>
                        <form onSubmit={submitRequest}>
                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                <label className="form-label">Select Workflow Route</label>
                                <select className="form-select" value={requestForm.workflowId} onChange={(e) => setRequestForm({...requestForm, workflowId: e.target.value})} required>
                                    <option value="">Choose template...</option>
                                    <option value="1">Standard Leave Request</option>
                                    <option value="2">Expense Form Approval</option>
                                    {/* Ideally we fetch actual active workflows for dropdown here, mock values for UI shape */}
                                </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: '24px' }}>
                                <label className="form-label">Justification / Remarks</label>
                                <textarea className="form-input" rows="4" placeholder="Provide context for the approvers..." value={requestForm.comments} onChange={(e) => setRequestForm({...requestForm, comments: e.target.value})} required></textarea>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Submit Request</button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowNewRequest(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* WORKFLOW BUILDER MODAL */}
            {showBuilder && (
                <div className="modal-overlay" style={{ zIndex: 1000 }}>
                    <div className="modal-content stat-card" style={{ maxWidth: '600px' }}>
                        <h2 style={{ marginBottom: '20px', color: 'var(--primary)' }}>⚙️ Matrix Routing Builder</h2>
                        <form onSubmit={saveWorkflow}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                                <div className="form-group">
                                    <label className="form-label">Workflow Name</label>
                                    <input className="form-input" value={builderForm.name} onChange={(e) => setBuilderForm({...builderForm, name: e.target.value})} placeholder="e.g. C-Level Expense Route" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Trigger Entity</label>
                                    <select className="form-select" value={builderForm.entityType} onChange={(e) => setBuilderForm({...builderForm, entityType: e.target.value})}>
                                        <option value="GeneralRequest">General Request</option>
                                        <option value="LeaveRequest">Leave Request</option>
                                        <option value="ExpenseClaim">Expense Claim</option>
                                    </select>
                                </div>
                            </div>

                            <h3 style={{ fontSize: '14px', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Routing Sequence</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                                {builderSteps.map((step, index) => (
                                    <div key={index} style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{index + 1}</div>
                                        <div style={{ flex: 1 }}>
                                            <select className="form-select" value={step.approverRole} onChange={(e) => {
                                                const newSteps = [...builderSteps];
                                                newSteps[index].approverRole = e.target.value;
                                                setBuilderSteps(newSteps);
                                            }}>
                                                <option value="">Select Target Role...</option>
                                                {systemRoles.map(role => <option key={role} value={role}>{role}</option>)}
                                            </select>
                                        </div>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>OR</span>
                                        <div style={{ flex: 1 }}>
                                            <select className="form-select" value={step.specificUserId} onChange={(e) => {
                                                const newSteps = [...builderSteps];
                                                newSteps[index].specificUserId = e.target.value;
                                                setBuilderSteps(newSteps);
                                            }}>
                                                <option value="">Specific User...</option>
                                                {users.map(u => <option key={u.id} value={u.id}>{u.employee?.firstName} {u.employee?.lastName} ({u.email})</option>)}
                                            </select>
                                        </div>
                                        <button type="button" className="btn btn-icon" onClick={() => {
                                            const newSteps = builderSteps.filter((_, i) => i !== index);
                                            setBuilderSteps(newSteps);
                                        }} style={{ color: 'var(--danger)' }}>✕</button>
                                    </div>
                                ))}
                                <button type="button" className="btn btn-secondary" style={{ width: '100%', borderStyle: 'dashed' }} onClick={() => setBuilderSteps([...builderSteps, { approverRole: '', specificUserId: '' }])}>
                                    + Add Escaping Step
                                </button>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Deploy Routing Matrix</button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowBuilder(false)}>Abort</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
