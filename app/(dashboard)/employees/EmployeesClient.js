'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AttendanceTab from './components/AttendanceTab';
import LeaveTab from './components/LeaveTab';
import ShiftsTab from './components/ShiftsTab';
import PayrollTab from './components/PayrollTab';
import BenefitsTab from './components/BenefitsTab';
import DocumentsTab from './components/DocumentsTab';
import PerformanceTab from './components/PerformanceTab';
import TrainingTab from './components/TrainingTab';

export default function EmployeesClient({ employees: initialEmployees, departments, positions }) {
    const [employees, setEmployees] = useState(initialEmployees);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalTab, setModalTab] = useState('Vitals');
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [form, setForm] = useState({
        empNo: '', firstName: '', lastName: '', email: '', phone: '',
        departmentId: '', positionId: '', joinDate: '', status: 'Active',
        nationality: '', gender: '', dateOfBirth: '', maritalStatus: '',
        passportNumber: '', passportExpiry: '', emiratesId: '', emiratesIdExpiry: '',
        visaType: '', visaExpiry: '', unifiedNumber: '',
        personalEmail: '', residentialAddress: '', homeCountryAddress: '',
        emergencyContactName: '', emergencyContactRelation: '', emergencyContactNumber: '',
        gradeLevel: '', employmentType: '', workLocation: '', probationPeriod: '',
        contractType: '', workPermitNumber: '', sponsorshipType: '',
        paymentMethod: 'Bank Transfer', wpsFileNumber: '', swiftCode: '',
        bankName: '', iban: '', routingCode: '', basicSalary: '',
        annualLeaveBalance: 30, sickLeaveBalance: 15, leaveAccrualRate: 2.5, biometricId: '',
        mohreContractNumber: '', establishmentCard: '', medicalInsurancePolicy: ''
    });
    const [viewingIndex, setViewingIndex] = useState(null);
    const [activeTab, setActiveTab] = useState('Personal');
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const router = useRouter();

    const filtered = employees.filter((e) =>
        `${e.firstName} ${e.lastName} ${e.email} ${e.department} ${e.empNo}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    const openCreate = () => {
        setEditingEmployee(null);
        setModalTab('Vitals');
        setForm({
            empNo: `EMP-${String(employees.length + 1).padStart(3, '0')}`,
            firstName: '', lastName: '', email: '', phone: '',
            departmentId: '', positionId: '', joinDate: new Date().toISOString().split('T')[0], status: 'Active',
            nationality: '', gender: '', dateOfBirth: '', maritalStatus: '',
            passportNumber: '', passportExpiry: '', emiratesId: '', emiratesIdExpiry: '',
            visaType: '', visaExpiry: '', unifiedNumber: '',
            personalEmail: '', residentialAddress: '', homeCountryAddress: '',
            emergencyContactName: '', emergencyContactRelation: '', emergencyContactNumber: '',
            gradeLevel: '', employmentType: '', workLocation: '', probationPeriod: '',
            contractType: '', workPermitNumber: '', sponsorshipType: '',
            paymentMethod: 'Bank Transfer', wpsFileNumber: '', swiftCode: '',
            bankName: '', iban: '', routingCode: '', basicSalary: '',
            annualLeaveBalance: 30, sickLeaveBalance: 15, leaveAccrualRate: 2.5, biometricId: '',
            mohreContractNumber: '', establishmentCard: '', medicalInsurancePolicy: ''
        });
        setShowModal(true);
    };

    const openEdit = (emp) => {
        setEditingEmployee(emp);
        setModalTab('Vitals');
        setForm({
            empNo: emp.empNo || '', firstName: emp.firstName || '', lastName: emp.lastName || '',
            email: emp.email || '', phone: emp.phone || '',
            departmentId: emp.departmentId || '', positionId: emp.positionId || '',
            joinDate: emp.joinDate || '', status: emp.status || 'Active',
            nationality: emp.nationality || '', gender: emp.gender || '', dateOfBirth: emp.dateOfBirth || '', maritalStatus: emp.maritalStatus || '',
            passportNumber: emp.passportNumber || '', passportExpiry: emp.passportExpiry || '', emiratesId: emp.emiratesId || '', emiratesIdExpiry: emp.emiratesIdExpiry || '',
            visaType: emp.visaType || '', visaExpiry: emp.visaExpiry || '', unifiedNumber: emp.unifiedNumber || '',
            personalEmail: emp.personalEmail || '', residentialAddress: emp.residentialAddress || '', homeCountryAddress: emp.homeCountryAddress || '',
            emergencyContactName: emp.emergencyContactName || '', emergencyContactRelation: emp.emergencyContactRelation || '', emergencyContactNumber: emp.emergencyContactNumber || '',
            gradeLevel: emp.gradeLevel || '', employmentType: emp.employmentType || '', workLocation: emp.workLocation || '', probationPeriod: emp.probationPeriod || '',
            contractType: emp.contractType || '', workPermitNumber: emp.workPermitNumber || '', sponsorshipType: emp.sponsorshipType || '',
            paymentMethod: emp.paymentMethod || 'Bank Transfer', wpsFileNumber: emp.wpsFileNumber || '', swiftCode: emp.swiftCode || '',
            bankName: emp.bankName || '', iban: emp.iban || '', routingCode: emp.routingCode || '', basicSalary: emp.basicSalary || '',
            annualLeaveBalance: emp.annualLeaveBalance ?? 30, sickLeaveBalance: emp.sickLeaveBalance ?? 15,
            leaveAccrualRate: emp.leaveAccrualRate ?? 2.5, biometricId: emp.biometricId || '',
            mohreContractNumber: emp.mohreContractNumber || '', establishmentCard: emp.establishmentCard || '', medicalInsurancePolicy: emp.medicalInsurancePolicy || ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = editingEmployee
            ? `/api/employees/${editingEmployee.id}`
            : '/api/employees';
        const method = editingEmployee ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        });

        if (res.ok) {
            setShowModal(false);
            router.refresh();
            // Optimistic update
            const updated = await res.json();
            if (editingEmployee) {
                setEmployees(employees.map(emp => emp.id === updated.id ? updated : emp));
            } else {
                setEmployees([...employees, updated]);
            }
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this employee?')) return;
        const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
        if (res.ok) {
            setEmployees(employees.filter(emp => emp.id !== id));
        }
    };

    const handlePhotoUpload = async (e, employeeId) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingPhoto(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const uploadData = await uploadRes.json();
            if (!uploadRes.ok) throw new Error(uploadData.error);

            // Update employee avatarUrl in DB
            const updateRes = await fetch(`/api/employees/${employeeId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ avatarUrl: uploadData.key })
            });

            if (!updateRes.ok) throw new Error('Failed to update profile photo');

            await fetchEmployees(); // Re-fetch to get the signed URL
            alert('Photo updated successfully! (It may take a second to reflect)');

        } catch (error) {
            alert('Photo upload failed: ' + error.message);
        } finally {
            setUploadingPhoto(false);
        }
    };

    const viewingEmployee = viewingIndex !== null ? filtered[viewingIndex] : null;

    const handlePrev = () => setViewingIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
    const handleNext = () => setViewingIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));

    return (
        <>
            {viewingEmployee ? (
                <div className="page" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
                    <div className="circuit-bg" />

                    {/* Top Navigation Bar */}
                    <div style={{ padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(6, 20, 16, 0.8)', borderBottom: '1px solid rgba(0, 243, 255, 0.2)', position: 'relative', zIndex: 2 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setViewingIndex(null)}>
                            ← Back to Grid
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--cyber-teal)', fontFamily: 'monospace' }}>
                            <span>{viewingIndex + 1} of {filtered.length}</span>
                            <button className="btn btn-icon btn-sm" onClick={handlePrev}>&lt;</button>
                            <button className="btn btn-icon btn-sm" onClick={handleNext}>&gt;</button>
                        </div>
                    </div>

                    {/* Profile Header */}
                    <div style={{ padding: '40px 32px 0', position: 'relative', zIndex: 2 }}>
                        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                            <div
                                onClick={() => document.getElementById('avatarInput').click()}
                                style={{
                                    width: 120, height: 120, borderRadius: '12px',
                                    background: viewingEmployee.avatarUrl ? `url(${viewingEmployee.avatarUrl}) center/cover no-repeat` : 'linear-gradient(135deg, var(--cyber-teal), var(--cyber-cyan))',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '48px', fontWeight: 800, color: 'var(--cyber-dark)',
                                    boxShadow: '0 0 20px rgba(0, 243, 255, 0.3)', border: '2px solid var(--cyber-cyan)', flexShrink: 0,
                                    cursor: 'pointer', position: 'relative', overflow: 'hidden'
                                }}>
                                {!viewingEmployee.avatarUrl && (viewingEmployee.firstName?.[0] || '') + (viewingEmployee.lastName?.[0] || '')}
                                <div className="avatar-overlay" style={{
                                    position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)',
                                    color: '#fff', fontSize: '10px', padding: '4px', textAlign: 'center',
                                    opacity: uploadingPhoto ? 1 : 0, transition: 'opacity 0.2s'
                                }}>
                                    {uploadingPhoto ? 'UPLOADING...' : 'CHANGE PHOTO'}
                                </div>
                                <input
                                    type="file"
                                    id="avatarInput"
                                    hidden
                                    accept="image/*"
                                    onChange={(e) => handlePhotoUpload(e, viewingEmployee.id)}
                                />
                                <style jsx>{`
                                    div:hover .avatar-overlay { opacity: 1 !important; }
                                `}</style>
                            </div>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <h1 style={{ fontSize: '36px', fontWeight: 900, color: '#fff', margin: '0 0 8px 0', letterSpacing: '1px' }}>
                                    {viewingEmployee.firstName} {viewingEmployee.lastName}
                                </h1>
                                <div style={{ fontSize: '18px', color: 'var(--cyber-teal)' }}>
                                    {viewingEmployee.positionRel?.title || 'No Position Provided'}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button className="btn btn-primary" onClick={() => openEdit(viewingEmployee)}>
                                    Add and Edit Fields
                                </button>
                                <button className="btn btn-icon">
                                    ⋯
                                </button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '32px', borderBottom: '1px solid rgba(0, 243, 255, 0.2)', overflowX: 'auto', paddingBottom: '0' }}>
                            {['Personal', 'Attendance Mgmt', 'Leave Mgmt', 'Shifts & Schedules', 'Payroll', 'Benefits', 'Documents', 'Performance'].map((tab) => {
                                const isActive = activeTab === tab;
                                return (
                                    <div
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        style={{
                                            padding: '12px 24px',
                                            color: isActive ? 'var(--cyber-dark)' : 'var(--cyber-cyan)',
                                            background: isActive ? 'var(--cyber-cyan)' : 'transparent',
                                            fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px',
                                            borderRadius: '8px 8px 0 0', cursor: 'pointer', fontFamily: 'monospace', whiteSpace: 'nowrap',
                                            transition: 'all 0.2s ease-in-out',
                                            borderTop: isActive ? 'none' : '1px solid transparent',
                                            borderLeft: isActive ? 'none' : '1px solid transparent',
                                            borderRight: isActive ? 'none' : '1px solid transparent',
                                        }}
                                        className={!isActive ? 'hover-glow-text' : ''}
                                    >
                                        {tab}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Content Body */}
                    <div style={{ display: 'flex', gap: '32px', padding: '32px', position: 'relative', zIndex: 2, flex: 1, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        {/* Left Sidebar (Vitals) */}
                        <div style={{ width: '280px', flexShrink: 0, background: 'rgba(6, 20, 16, 0.6)', border: '1px solid rgba(0, 243, 255, 0.2)', borderRadius: '12px', padding: '24px' }}>
                            <h3 style={{ color: 'var(--cyber-teal)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px' }}>Vitals</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', gap: '12px', color: '#b2ebf2', fontSize: '14px' }}>
                                    <span>📞</span> {viewingEmployee.phone || '—'}
                                </div>
                                <div style={{ display: 'flex', gap: '12px', color: '#b2ebf2', fontSize: '14px', wordBreak: 'break-all' }}>
                                    <span>✉️</span> {viewingEmployee.email || '—'}
                                </div>
                                <div style={{ display: 'flex', gap: '12px', color: '#b2ebf2', fontSize: '14px' }}>
                                    <span>🏢</span> {viewingEmployee.department?.name || '—'}
                                </div>
                                <div style={{ display: 'flex', gap: '12px', color: '#b2ebf2', fontSize: '14px' }}>
                                    <span>🏷️</span> {viewingEmployee.empNo || '—'}
                                </div>
                                <div style={{ display: 'flex', gap: '12px', color: '#b2ebf2', fontSize: '14px' }}>
                                    <span>📅</span> Hire Date: {viewingEmployee.joinDate || '—'}
                                </div>
                                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(0, 243, 255, 0.2)' }}>
                                    <span className={`badge ${viewingEmployee.status === 'Active' ? 'badge-success' : 'badge-danger'}`} style={{ width: '100%', justifyContent: 'center' }}>
                                        STATUS: {viewingEmployee.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div style={{ flex: 1, minWidth: '300px', background: 'rgba(6, 20, 16, 0.6)', border: '1px solid rgba(0, 243, 255, 0.2)', borderRadius: '12px', padding: '32px', minHeight: '400px' }}>
                            {activeTab === 'Personal' && (
                                <div className="animate-fadeInUp" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

                                    {/* --- 1. Basic Information --- */}
                                    <section>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                            <h2 style={{ color: 'var(--cyber-cyan)', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '12px', margin: 0, textTransform: 'uppercase', letterSpacing: '2px' }}>
                                                <span>📇</span> Basic Information
                                            </h2>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                            <div style={{ background: 'rgba(0, 243, 255, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0, 243, 255, 0.1)' }}>
                                                <div style={{ color: 'var(--cyber-teal)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Nationality</div>
                                                <div style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>{viewingEmployee.nationality || 'Not Specified'}</div>
                                            </div>
                                            <div style={{ background: 'rgba(0, 243, 255, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0, 243, 255, 0.1)' }}>
                                                <div style={{ color: 'var(--cyber-teal)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Gender</div>
                                                <div style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>{viewingEmployee.gender || 'Not Specified'}</div>
                                            </div>
                                            <div style={{ background: 'rgba(0, 243, 255, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0, 243, 255, 0.1)' }}>
                                                <div style={{ color: 'var(--cyber-teal)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Birth Date</div>
                                                <div style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>{viewingEmployee.dateOfBirth || 'Not Specified'}</div>
                                            </div>
                                            <div style={{ background: 'rgba(0, 243, 255, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0, 243, 255, 0.1)' }}>
                                                <div style={{ color: 'var(--cyber-teal)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Marital Status</div>
                                                <div style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>{viewingEmployee.maritalStatus || 'Not Specified'}</div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* --- 2. Contact Details --- */}
                                    <section>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderTop: '1px solid rgba(0, 243, 255, 0.1)', paddingTop: '32px' }}>
                                            <h2 style={{ color: 'var(--cyber-cyan)', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '12px', margin: 0, textTransform: 'uppercase', letterSpacing: '2px' }}>
                                                <span>📱</span> Contact & Address
                                            </h2>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                                            <div style={{ background: 'rgba(0, 243, 255, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0, 243, 255, 0.1)' }}>
                                                <div style={{ color: 'var(--cyber-teal)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Personal Email</div>
                                                <div style={{ color: '#fff', fontSize: '14px', wordBreak: 'break-all' }}>{viewingEmployee.personalEmail || '—'}</div>
                                            </div>
                                            <div style={{ background: 'rgba(0, 243, 255, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0, 243, 255, 0.1)' }}>
                                                <div style={{ color: 'var(--cyber-teal)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Emergency Contact</div>
                                                <div style={{ color: '#fff', fontSize: '15px' }}>{viewingEmployee.emergencyContactName || '—'}</div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
                                                    {viewingEmployee.emergencyContactRelation ? viewingEmployee.emergencyContactRelation + ' • ' : ''}
                                                    {viewingEmployee.emergencyContactNumber || '—'}
                                                </div>
                                            </div>
                                            <div style={{ background: 'rgba(0, 243, 255, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0, 243, 255, 0.1)' }}>
                                                <div style={{ color: 'var(--cyber-teal)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Residential Address (UAE)</div>
                                                <div style={{ color: '#fff', fontSize: '14px', wordBreak: 'break-word', lineHeight: 1.4 }}>{viewingEmployee.residentialAddress || '—'}</div>
                                            </div>
                                            <div style={{ background: 'rgba(0, 243, 255, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0, 243, 255, 0.1)' }}>
                                                <div style={{ color: 'var(--cyber-teal)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Home Country Address</div>
                                                <div style={{ color: '#fff', fontSize: '14px', wordBreak: 'break-word', lineHeight: 1.4 }}>{viewingEmployee.homeCountryAddress || '—'}</div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* --- 3. UAE Compliance & HR --- */}
                                    <section>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderTop: '1px solid rgba(0, 243, 255, 0.1)', paddingTop: '32px' }}>
                                            <h2 style={{ color: 'var(--cyber-cyan)', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '12px', margin: 0, textTransform: 'uppercase', letterSpacing: '2px' }}>
                                                <span>🏢</span> UAE Compliance & Legal
                                            </h2>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                            <div style={{ background: 'rgba(0, 243, 255, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0, 243, 255, 0.1)' }}>
                                                <div style={{ color: 'var(--cyber-teal)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Emirates ID</div>
                                                <div style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>{viewingEmployee.emiratesId || '—'}</div>
                                                <div style={{ color: 'var(--cyber-cyan)', fontSize: '11px', marginTop: '4px' }}>Exp: {viewingEmployee.emiratesIdExpiry || '—'}</div>
                                            </div>
                                            <div style={{ background: 'rgba(0, 243, 255, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0, 243, 255, 0.1)' }}>
                                                <div style={{ color: 'var(--cyber-teal)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Passport #</div>
                                                <div style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>{viewingEmployee.passportNumber || '—'}</div>
                                                <div style={{ color: 'var(--cyber-cyan)', fontSize: '11px', marginTop: '4px' }}>Exp: {viewingEmployee.passportExpiry || '—'}</div>
                                            </div>
                                            <div style={{ background: 'rgba(0, 243, 255, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0, 243, 255, 0.1)' }}>
                                                <div style={{ color: 'var(--cyber-teal)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Visa & UID</div>
                                                <div style={{ color: '#fff', fontSize: '15px' }}>{viewingEmployee.visaType || '—'}</div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>UID: {viewingEmployee.unifiedNumber || '—'}</div>
                                            </div>
                                            <div style={{ background: 'rgba(0, 243, 255, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0, 243, 255, 0.1)' }}>
                                                <div style={{ color: 'var(--cyber-teal)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Sponsorship</div>
                                                <div style={{ color: '#fff', fontSize: '15px' }}>{viewingEmployee.sponsorshipType || '—'}</div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* --- 4. Employment Profile details --- */}
                                    <section>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                            <div style={{ background: 'rgba(0, 243, 255, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0, 243, 255, 0.1)' }}>
                                                <div style={{ color: 'var(--cyber-teal)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>MOHRE Contract #</div>
                                                <div style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>{viewingEmployee.mohreContractNumber || '—'}</div>
                                            </div>
                                            <div style={{ background: 'rgba(0, 243, 255, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0, 243, 255, 0.1)' }}>
                                                <div style={{ color: 'var(--cyber-teal)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Work Permit #</div>
                                                <div style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>{viewingEmployee.workPermitNumber || '—'}</div>
                                            </div>
                                            <div style={{ background: 'rgba(0, 243, 255, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0, 243, 255, 0.1)' }}>
                                                <div style={{ color: 'var(--cyber-teal)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Contract Type</div>
                                                <div style={{ color: '#fff', fontSize: '15px' }}>{viewingEmployee.contractType || '—'}</div>
                                            </div>
                                            <div style={{ background: 'rgba(0, 243, 255, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0, 243, 255, 0.1)' }}>
                                                <div style={{ color: 'var(--cyber-teal)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Probation Period</div>
                                                <div style={{ color: '#fff', fontSize: '15px' }}>{viewingEmployee.probationPeriod || '—'}</div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* --- 5. Bank Details --- */}
                                    <section>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderTop: '1px solid rgba(0, 243, 255, 0.1)', paddingTop: '32px' }}>
                                            <h2 style={{ color: 'var(--cyber-cyan)', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '12px', margin: 0, textTransform: 'uppercase', letterSpacing: '2px' }}>
                                                <span>🏦</span> Financial Information
                                            </h2>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                                            <div style={{ background: 'rgba(0, 243, 255, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0, 243, 255, 0.1)' }}>
                                                <div style={{ color: 'var(--cyber-teal)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Bank Name</div>
                                                <div style={{ color: '#fff', fontSize: '15px' }}>{viewingEmployee.bankName || '—'}</div>
                                            </div>
                                            <div style={{ background: 'rgba(0, 243, 255, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0, 243, 255, 0.1)' }}>
                                                <div style={{ color: 'var(--cyber-teal)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>IBAN</div>
                                                <div style={{ color: '#fff', fontSize: '15px', fontFamily: 'monospace', letterSpacing: '1px' }}>{viewingEmployee.iban || '—'}</div>
                                            </div>
                                            <div style={{ background: 'rgba(0, 243, 255, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0, 243, 255, 0.1)' }}>
                                                <div style={{ color: 'var(--cyber-teal)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Payment Method</div>
                                                <div style={{ color: '#fff', fontSize: '15px' }}>
                                                    {viewingEmployee.paymentMethod || '—'}
                                                    {viewingEmployee.wpsFileNumber && <span style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block', marginTop: '4px' }}>WPS: {viewingEmployee.wpsFileNumber}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                </div>
                            )}

                            {activeTab === 'Attendance Mgmt' && <AttendanceTab employeeId={viewingEmployee.id} />}
                            {activeTab === 'Leave Mgmt' && <LeaveTab employeeId={viewingEmployee.id} />}
                            {activeTab === 'Shifts & Schedules' && <ShiftsTab employee={viewingEmployee} />}
                            {activeTab === 'Payroll' && <PayrollTab employee={viewingEmployee} />}
                            {activeTab === 'Benefits' && <BenefitsTab employee={viewingEmployee} />}
                            {activeTab === 'Documents' && <DocumentsTab employee={viewingEmployee} />}
                            {activeTab === 'Performance' && <PerformanceTab employeeId={viewingEmployee.id} />}
                            {activeTab === 'Training / LMS' && <TrainingTab employeeId={viewingEmployee.id} />}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="page">
                    <div className="page-header">
                        <div>
                            <h1 className="page-title">👥 Employees</h1>
                            <p className="page-subtitle">{employees.length} team members</p>
                        </div>
                        <button className="btn btn-primary" onClick={openCreate}>
                            ＋ Add Employee
                        </button>
                    </div>

                    {/* Search & Filter */}
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                        <div className="search-box" style={{ flex: 1, minWidth: '200px' }}>
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder="Search employees..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Employee Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}
                        className="stagger">
                        {filtered.map((emp, index) => (
                            <div key={emp.id} className="stat-card animate-fadeInUp" style={{ cursor: 'pointer', transition: 'all 0.3s ease', padding: '16px' }} onClick={() => setViewingIndex(index)}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                    <div style={{
                                        width: 48, height: 48, borderRadius: 'var(--radius-full)',
                                        background: emp.avatarUrl ? `url(${emp.avatarUrl}) center/cover no-repeat` : 'linear-gradient(135deg, var(--accent), hsl(calc(var(--hue) + 40), var(--sat), 55%))',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '18px', fontWeight: 700, color: 'white', flexShrink: 0,
                                        border: emp.avatarUrl ? '1px solid rgba(0, 243, 255, 0.3)' : 'none'
                                    }}>
                                        {!emp.avatarUrl && (emp.firstName?.[0] || '') + (emp.lastName?.[0] || '')}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: '15px' }}>
                                            {emp.firstName} {emp.lastName}
                                        </div>
                                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                            {emp.empNo}
                                        </div>
                                    </div>
                                    <span className={`badge ${emp.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                                        {emp.status}
                                    </span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', marginBottom: '16px' }}>
                                    <div>
                                        <span style={{ color: 'var(--text-muted)' }}>Department</span>
                                        <div style={{ fontWeight: 600 }}>{emp.department?.name || '—'}</div>
                                    </div>
                                    <div>
                                        <span style={{ color: 'var(--text-muted)' }}>Position</span>
                                        <div style={{ fontWeight: 600 }}>{emp.positionRel?.title || '—'}</div>
                                    </div>
                                    <div>
                                        <span style={{ color: 'var(--text-muted)' }}>Email</span>
                                        <div style={{ fontWeight: 500, wordBreak: 'break-all' }}>{emp.email || '—'}</div>
                                    </div>
                                    <div>
                                        <span style={{ color: 'var(--text-muted)' }}>Joined</span>
                                        <div style={{ fontWeight: 500 }}>{emp.joinDate || '—'}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); openEdit(emp); }}>
                                        ✏️ Edit
                                    </button>
                                    <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); handleDelete(emp.id); }}>
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filtered.length === 0 && (
                        <div className="empty-state">
                            <div className="empty-state-icon">👤</div>
                            <div className="empty-state-text">No employees found</div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal animate-fadeInUp" style={{ maxWidth: '800px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title" style={{ marginBottom: '16px' }}>
                            {editingEmployee ? '✏️ Edit Employee' : '➕ New Employee'}
                        </h2>

                        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid rgba(0, 243, 255, 0.2)', overflowX: 'auto', paddingBottom: '0' }}>
                            {['Vitals', 'Personal', 'Compliance', 'Bank', 'Leave'].map((tab) => (
                                <div
                                    key={tab}
                                    onClick={() => setModalTab(tab)}
                                    style={{
                                        padding: '8px 16px',
                                        color: modalTab === tab ? 'var(--cyber-dark)' : 'var(--cyber-cyan)',
                                        background: modalTab === tab ? 'var(--cyber-cyan)' : 'transparent',
                                        fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11px',
                                        borderRadius: '6px 6px 0 0', cursor: 'pointer', fontFamily: 'monospace', whiteSpace: 'nowrap',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {tab}
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div style={{ minHeight: '350px' }}>
                                {modalTab === 'Vitals' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="animate-fadeInUp">
                                        <div className="form-group"><label className="form-label">Employee No</label><input className="form-input" value={form.empNo} onChange={(e) => setForm({ ...form, empNo: e.target.value })} /></div>
                                        <div className="form-group"><label className="form-label">Status</label>
                                            <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                                <option value="Active">Active</option><option value="Inactive">Inactive</option><option value="On Leave">On Leave</option>
                                            </select>
                                        </div>
                                        <div className="form-group"><label className="form-label">Department</label>
                                            <select className="form-select" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
                                                <option value="">Select Department...</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group"><label className="form-label">Position</label>
                                            <select className="form-select" value={form.positionId} onChange={(e) => setForm({ ...form, positionId: e.target.value })}>
                                                <option value="">Select Position...</option>{positions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group"><label className="form-label">Grade / Level</label><input className="form-input" value={form.gradeLevel} onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })} /></div>
                                        <div className="form-group"><label className="form-label">Employment Type</label>
                                            <select className="form-select" value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value })}>
                                                <option value="">Select...</option><option value="Full-Time">Full-Time</option><option value="Part-Time">Part-Time</option><option value="Contract">Contract</option>
                                            </select>
                                        </div>
                                        <div className="form-group"><label className="form-label">Work Location</label><input className="form-input" value={form.workLocation} onChange={(e) => setForm({ ...form, workLocation: e.target.value })} /></div>
                                        <div className="form-group"><label className="form-label">Joining Date</label><input className="form-input" type="date" value={form.joinDate} onChange={(e) => setForm({ ...form, joinDate: e.target.value })} /></div>
                                        <div className="form-group"><label className="form-label">Probation Period</label><input className="form-input" value={form.probationPeriod} placeholder="e.g. 6 Months" onChange={(e) => setForm({ ...form, probationPeriod: e.target.value })} /></div>
                                        <div className="form-group"><label className="form-label">Contract Type</label>
                                            <select className="form-select" value={form.contractType} onChange={(e) => setForm({ ...form, contractType: e.target.value })}>
                                                <option value="">Select...</option><option value="Unlimited">Unlimited</option><option value="Limited">Limited</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {modalTab === 'Personal' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="animate-fadeInUp">
                                        <div className="form-group"><label className="form-label">First Name</label><input className="form-input" value={form.firstName} required onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
                                        <div className="form-group"><label className="form-label">Last Name</label><input className="form-input" value={form.lastName} required onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
                                        <div className="form-group"><label className="form-label">Nationality</label><input className="form-input" value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} /></div>
                                        <div className="form-group"><label className="form-label">Gender</label>
                                            <select className="form-select" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                                                <option value="">Select...</option><option value="Male">Male</option><option value="Female">Female</option>
                                            </select>
                                        </div>
                                        <div className="form-group"><label className="form-label">Date of Birth</label><input className="form-input" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} /></div>
                                        <div className="form-group"><label className="form-label">Marital Status</label>
                                            <select className="form-select" value={form.maritalStatus} onChange={(e) => setForm({ ...form, maritalStatus: e.target.value })}>
                                                <option value="">Select...</option><option value="Single">Single</option><option value="Married">Married</option>
                                            </select>
                                        </div>
                                        <div className="form-group" style={{ gridColumn: '1 / -1' }}><hr style={{ borderColor: 'rgba(0, 243, 255, 0.1)', margin: '4px 0' }} /></div>
                                        <div className="form-group"><label className="form-label">Company Email</label><input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                                        <div className="form-group"><label className="form-label">Personal Email</label><input className="form-input" type="email" value={form.personalEmail} onChange={(e) => setForm({ ...form, personalEmail: e.target.value })} /></div>
                                        <div className="form-group"><label className="form-label">Mobile Number (UAE)</label><input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                                        <div className="form-group"><label className="form-label">Emergency Contact Name</label><input className="form-input" value={form.emergencyContactName} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} /></div>
                                        <div className="form-group"><label className="form-label">Emergency Contact Relation</label><input className="form-input" value={form.emergencyContactRelation} onChange={(e) => setForm({ ...form, emergencyContactRelation: e.target.value })} /></div>
                                        <div className="form-group"><label className="form-label">Emergency Contact Number</label><input className="form-input" value={form.emergencyContactNumber} onChange={(e) => setForm({ ...form, emergencyContactNumber: e.target.value })} /></div>
                                        <div className="form-group" style={{ gridColumn: '1 / -1' }}><label className="form-label">Residential Address (UAE)</label><input className="form-input" value={form.residentialAddress} onChange={(e) => setForm({ ...form, residentialAddress: e.target.value })} /></div>
                                        <div className="form-group" style={{ gridColumn: '1 / -1' }}><label className="form-label">Home Country Address</label><input className="form-input" value={form.homeCountryAddress} onChange={(e) => setForm({ ...form, homeCountryAddress: e.target.value })} /></div>
                                    </div>
                                )}

                                {modalTab === 'Compliance' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="animate-fadeInUp">
                                        <div className="form-group"><label className="form-label">Emirates ID</label><input className="form-input" value={form.emiratesId} placeholder="784-XXXX-XXXXXXX-X" onChange={(e) => setForm({ ...form, emiratesId: e.target.value })} /></div>
                                        <div className="form-group"><label className="form-label">Emirates ID Expiry</label><input className="form-input" type="date" value={form.emiratesIdExpiry} onChange={(e) => setForm({ ...form, emiratesIdExpiry: e.target.value })} /></div>
                                        <div className="form-group"><label className="form-label">Passport Number</label><input className="form-input" value={form.passportNumber} onChange={(e) => setForm({ ...form, passportNumber: e.target.value })} /></div>
                                        <div className="form-group"><label className="form-label">Passport Expiry</label><input className="form-input" type="date" value={form.passportExpiry} onChange={(e) => setForm({ ...form, passportExpiry: e.target.value })} /></div>
                                        <div className="form-group"><label className="form-label">Visa Type</label><input className="form-input" value={form.visaType} placeholder="e.g. Employment" onChange={(e) => setForm({ ...form, visaType: e.target.value })} /></div>
                                        <div className="form-group"><label className="form-label">Visa Expiry</label><input className="form-input" type="date" value={form.visaExpiry} onChange={(e) => setForm({ ...form, visaExpiry: e.target.value })} /></div>
                                        <div className="form-group"><label className="form-label">Unified Number (UID)</label><input className="form-input" value={form.unifiedNumber} onChange={(e) => setForm({ ...form, unifiedNumber: e.target.value })} /></div>
                                        <div className="form-group"><label className="form-label">Sponsorship Type</label>
                                            <select className="form-select" value={form.sponsorshipType} onChange={(e) => setForm({ ...form, sponsorshipType: e.target.value })}>
                                                <option value="">Select...</option><option value="Company Sponsored">Company Sponsored</option><option value="Family Sponsored">Family Sponsored</option>
                                            </select>
                                        </div>
                                        <div className="form-group" style={{ gridColumn: '1 / -1' }}><hr style={{ borderColor: 'rgba(0, 243, 255, 0.1)', margin: '4px 0' }} /></div>
                                        <div className="form-group"><label className="form-label">MOHRE Contract #</label><input className="form-input" value={form.mohreContractNumber} onChange={(e) => setForm({ ...form, mohreContractNumber: e.target.value })} /></div>
                                        <div className="form-group"><label className="form-label">Work Permit #</label><input className="form-input" value={form.workPermitNumber} onChange={(e) => setForm({ ...form, workPermitNumber: e.target.value })} /></div>
                                        <div className="form-group"><label className="form-label">Establishment Card</label><input className="form-input" value={form.establishmentCard} onChange={(e) => setForm({ ...form, establishmentCard: e.target.value })} /></div>
                                        <div className="form-group"><label className="form-label">Insurance Policy #</label><input className="form-input" value={form.medicalInsurancePolicy} onChange={(e) => setForm({ ...form, medicalInsurancePolicy: e.target.value })} /></div>
                                    </div>
                                )}

                                {modalTab === 'Bank' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="animate-fadeInUp">
                                        <div className="form-group"><label className="form-label">Basic Salary (AED)</label><input className="form-input" type="number" step="0.01" value={form.basicSalary} onChange={(e) => setForm({ ...form, basicSalary: e.target.value })} /></div>
                                        <div className="form-group"><label className="form-label">Payment Method</label>
                                            <select className="form-select" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                                                <option value="Bank Transfer">Bank Transfer</option><option value="WPS">WPS</option>
                                            </select>
                                        </div>
                                        <div className="form-group"><label className="form-label">WPS Salary File #</label><input className="form-input" value={form.wpsFileNumber} onChange={(e) => setForm({ ...form, wpsFileNumber: e.target.value })} /></div>
                                        <div className="form-group" style={{ gridColumn: '1 / -1' }}><hr style={{ borderColor: 'rgba(0, 243, 255, 0.1)', margin: '4px 0' }} /></div>
                                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                            <div style={{ padding: '12px', background: 'rgba(0, 243, 255, 0.05)', borderRadius: '8px', border: '1px solid rgba(0, 243, 255, 0.2)', marginBottom: '8px' }}>
                                                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>ℹ️ Note: Core Allowances and Deductions (Housing, Transport, etc) are assigned via the central <strong>Benefits</strong> module.</p>
                                            </div>
                                        </div>
                                        <div className="form-group" style={{ gridColumn: '1 / -1' }}><label className="form-label">Bank Name</label><input className="form-input" value={form.bankName} placeholder="e.g. Emirates NBD" onChange={(e) => setForm({ ...form, bankName: e.target.value })} /></div>
                                        <div className="form-group"><label className="form-label">IBAN</label><input className="form-input" placeholder="AE..." value={form.iban} onChange={(e) => setForm({ ...form, iban: e.target.value })} /></div>
                                        <div className="form-group"><label className="form-label">Routing / SWIFT Code</label><input className="form-input" value={form.swiftCode} onChange={(e) => setForm({ ...form, swiftCode: e.target.value })} /></div>
                                    </div>
                                )}

                                {modalTab === 'Leave' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="animate-fadeInUp">
                                        <div className="form-group"><label className="form-label">Annual Leave Balance (Days)</label><input className="form-input" type="number" step="0.5" value={form.annualLeaveBalance} onChange={(e) => setForm({ ...form, annualLeaveBalance: e.target.value })} /></div>
                                        <div className="form-group"><label className="form-label">Sick Leave Balance (Days)</label><input className="form-input" type="number" step="0.5" value={form.sickLeaveBalance} onChange={(e) => setForm({ ...form, sickLeaveBalance: e.target.value })} /></div>
                                        <div className="form-group"><label className="form-label">Leave Accrual Rate (Days/Mo)</label><input className="form-input" type="number" step="0.1" value={form.leaveAccrualRate} onChange={(e) => setForm({ ...form, leaveAccrualRate: e.target.value })} /></div>
                                        <div className="form-group"><label className="form-label">Biometric Machine ID</label><input className="form-input" value={form.biometricId} onChange={(e) => setForm({ ...form, biometricId: e.target.value })} /></div>
                                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                            <div style={{ padding: '12px', background: 'rgba(0, 243, 255, 0.05)', borderRadius: '8px', border: '1px solid rgba(0, 243, 255, 0.2)', marginTop: '8px' }}>
                                                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>ℹ️ Note: Shifts and working hours are managed centrally through the <strong>Shifts & Schedules</strong> module and assigned automatically.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '32px', borderTop: '1px solid rgba(0, 243, 255, 0.2)', paddingTop: '24px', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ minWidth: '150px' }}>
                                    {editingEmployee ? 'Update' : 'Create'} Employee
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
