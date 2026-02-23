import React, { useState } from 'react';
import {
    ChevronLeft, History, FileText, Pill, Clipboard,
    MoreHorizontal, Printer, Mail, Download, Phone,
    Calendar, MapPin, User, Activity, AlertCircle, CheckCircle
} from 'lucide-react';

const PatientDetail = ({ patient, history = [], onBack }) => {
    const [activeTab, setActiveTab] = useState('resume');

    if (!patient) return null;

    const tabs = [
        { id: 'resume', label: 'Clinical Summary', icon: Clipboard },
        { id: 'history', label: 'Timeline', icon: History },
        { id: 'scans', label: 'Imaging Studies', icon: FileText },
        { id: 'meds', label: 'Care Plan', icon: Pill },
    ];

    return (
        <div className="patient-detail-root animate-fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="glass-pane" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '2rem' }}>
                        <div className="p-avatar-v3" style={{ width: '80px', height: '80px', fontSize: '2rem', background: '#3b82f6' }}>{patient.name[0]}</div>
                        <div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{patient.name}</h2>
                            <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>NHC: {patient.id} • {patient.age} years, {patient.sex}</div>
                        </div>
                    </div>
                    <button onClick={onBack} className="glass-pane" style={{ padding: '8px 16px', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ChevronLeft size={18} /> Back
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            background: 'transparent', border: 'none', padding: '10px',
                            color: activeTab === tab.id ? '#3b82f6' : '#64748b',
                            borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                            fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                    >
                        <tab.icon size={16} /> {tab.label}
                    </button>
                ))}
            </div>

            <div className="tab-content" style={{ overflowY: 'auto' }}>
                {activeTab === 'resume' && (
                    <div className="glass-pane" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontWeight: 800, marginBottom: '1rem' }}>Medical Evolution</h3>
                        <p style={{ lineHeight: 1.8 }}>{patient.history}</p>
                        <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <CheckCircle size={24} color="#10b981" />
                            <div>
                                <div style={{ fontWeight: 800, color: '#10b981' }}>STABLE CONDITION</div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>No abnormalities detected in the latest vital signs.</div>
                            </div>
                        </div>
                    </div>
                )}
                {/* Fallback for other tabs */}
                {activeTab !== 'resume' && (
                    <div className="glass-pane" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                        Loading extended information from GB10...
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientDetail;
