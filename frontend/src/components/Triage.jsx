import React, { useState } from 'react';
import {
    Activity, AlertTriangle, RefreshCw, Clipboard, Zap,
    Thermometer, Heart, Wind, Droplets, Info
} from 'lucide-react';
import axios from 'axios';

const Triage = ({ patients = [], backendUrl }) => {
    const [vitals, setVitals] = useState({ hr: "", sbp: "", dbp: "", temp: "", spo2: "" });
    const [complaint, setComplaint] = useState("");
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleTriageSubmit = async () => {
        setLoading(true);
        try {
            const res = await axios.post(`${backendUrl}/triage`, {
                complaint: complaint,
                vitals: {
                    hr: vitals.hr,
                    bp_sys: vitals.sbp,
                    bp_dia: vitals.dbp,
                    temp: vitals.temp,
                    spo2: vitals.spo2
                },
                patient_context: selectedPatient,
                model: "biomistral:latest"
            });
            setResult(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="triage-root fade-in" style={{ padding: '1rem', height: '100%', overflowY: 'auto' }}>
            <div className="section-header-v3">
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Manchester Triage System (MTS)</h2>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Clinical risk classification using international protocols and AI support.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 800, fontSize: '0.8rem', background: 'rgba(59, 130, 246, 0.1)', padding: '8px 15px', borderRadius: '20px' }}>
                    <Info size={16} /> MTS PROTOCOL v2026.1 ACTIVE
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem', marginTop: '1.5rem' }}>
                {/* Input Section */}
                <div className="glass-pane" style={{ padding: '2rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Clipboard size={18} color="var(--primary)" /> Admission Assessment
                    </h3>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>Registered Patient</label>
                        <select
                            onChange={(e) => setSelectedPatient(patients.find(p => p.id === e.target.value))}
                            style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', color: 'white', outline: 'none' }}
                        >
                            <option value="">-- New Admission / Anonymous --</option>
                            {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="vitals-input">
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', marginBottom: '8px' }}>HEART RATE (BPM)</label>
                            <div style={{ position: 'relative' }}>
                                <Heart size={14} style={{ position: 'absolute', left: '12px', top: '15px', color: 'var(--danger)' }} />
                                <input type="number" placeholder="80" value={vitals.hr} onChange={e => setVitals({ ...vitals, hr: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 12px 12px 35px', color: 'white' }} />
                            </div>
                        </div>
                        <div className="vitals-input">
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', marginBottom: '8px' }}>OXYGEN (SpO2%)</label>
                            <div style={{ position: 'relative' }}>
                                <Wind size={14} style={{ position: 'absolute', left: '12px', top: '15px', color: 'var(--primary)' }} />
                                <input type="number" placeholder="98" value={vitals.spo2} onChange={e => setVitals({ ...vitals, spo2: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 12px 12px 35px', color: 'white' }} />
                            </div>
                        </div>
                        <div className="vitals-input">
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', marginBottom: '8px' }}>TEMPERATURE (°C)</label>
                            <div style={{ position: 'relative' }}>
                                <Thermometer size={14} style={{ position: 'absolute', left: '12px', top: '15px', color: 'var(--warning)' }} />
                                <input type="number" step="0.1" placeholder="36.5" value={vitals.temp} onChange={e => setVitals({ ...vitals, temp: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 12px 12px 35px', color: 'white' }} />
                            </div>
                        </div>
                        <div className="vitals-input">
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', marginBottom: '8px' }}>BLOOD PRESSURE (S/D)</label>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <input type="number" placeholder="120" value={vitals.sbp} onChange={e => setVitals({ ...vitals, sbp: e.target.value })} style={{ width: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', color: 'white' }} />
                                <span style={{ padding: '8px 0', opacity: 0.3 }}>/</span>
                                <input type="number" placeholder="80" value={vitals.dbp} onChange={e => setVitals({ ...vitals, dbp: e.target.value })} style={{ width: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', color: 'white' }} />
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>Chief Complaint & Symptoms</label>
                        <textarea
                            rows="4"
                            placeholder="Describe the symptoms detected by nursing staff or reported by the patient..."
                            value={complaint}
                            onChange={(e) => setComplaint(e.target.value)}
                            style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '15px', color: 'white', outline: 'none', resize: 'none', fontSize: '0.95rem', lineHeight: 1.6 }}
                        ></textarea>
                    </div>

                    <button
                        onClick={handleTriageSubmit}
                        disabled={loading || !complaint}
                        style={{ width: '100%', background: 'var(--primary)', border: 'none', padding: '16px', borderRadius: '12px', color: 'white', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontSize: '1rem', transition: 'all 0.2s', opacity: loading ? 0.7 : 1 }}
                    >
                        {loading ? <RefreshCw className="spin" size={20} /> : <Zap size={20} />}
                        {loading ? 'Syncing with BioMistral AI...' : 'Calculate Manchester Severity'}
                    </button>
                </div>

                {/* Results Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {result ? (
                        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Priority Card */}
                            <div className={`triage-priority-card level-${result.level}`} style={{
                                padding: '2.5rem', borderRadius: 'var(--radius-xl)', color: 'white',
                                background: result.level === 1 ? 'linear-gradient(135deg, #ef4444 0%, #7f1d1d 100%)' :
                                    result.level === 2 ? 'linear-gradient(135deg, #f97316 0%, #9a3412 100%)' :
                                        result.level === 3 ? 'linear-gradient(135deg, #eab308 0%, #854d0e 100%)' :
                                            'linear-gradient(135deg, #22c55e 0%, #166534 100%)',
                                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.9 }}>Manchester LEVEL {result.level}</span>
                                    <AlertTriangle size={32} />
                                </div>
                                <h2 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-1px' }}>{result.priority_name}</h2>
                                <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem', fontWeight: 700 }}>
                                    <Clock size={20} /> MAX WAIT TIME: {result.level === 1 ? 'IMMEDIATE' : result.level === 2 ? '15 MIN' : result.level === 3 ? '60 MIN' : '120 MIN'}
                                </div>
                            </div>

                            <div className="glass-pane" style={{ padding: '1.5rem' }}>
                                <h4 style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem' }}>Medical Justification (AI)</h4>
                                <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#fff' }}>{result.justification}</p>
                            </div>

                            <div className="glass-pane" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
                                <h4 style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem' }}>Suggested Action Protocol</h4>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {result.actions.split(';').map((action, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '10px' }}>
                                            <div style={{ minWidth: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', marginTop: '8px' }}></div>
                                            {action.trim()}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="glass-pane" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', textAlign: 'center' }}>
                            <Activity size={80} style={{ opacity: 0.05, marginBottom: '1.5rem' }} />
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-muted)' }}>Awaiting Clinical Data</h3>
                            <p style={{ color: 'var(--text-dim)', maxWidth: '300px', fontSize: '0.9rem', marginTop: '10px' }}>Complete the vital signs and chief complaint fields to obtain an automatic risk classification.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Triage;
