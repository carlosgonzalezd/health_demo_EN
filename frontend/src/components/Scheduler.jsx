import React from 'react';
import {
    Calendar, Clock, User, Filter,
    MoreHorizontal, ChevronLeft, ChevronRight, Plus,
    ShieldCheck, MapPin
} from 'lucide-react';

const Scheduler = ({ doctors = [] }) => {
    // Ultra-safe render
    if (!doctors) return <div className="glass-pane">Cargando datos de staff...</div>;

    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    return (
        <div className="scheduler-root animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="section-header-v3">
                <div style={{ padding: '1rem 0' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Gestión de Turnos</h2>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Planificación de guardia para el sector GB10.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', flex: 1 }}>
                <div className="glass-pane" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontWeight: 800 }}>Febrero 2026</h3>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <button className="glass-pane" style={{ padding: '5px', border: 'none', color: 'white' }}><ChevronLeft size={16} /></button>
                            <button className="glass-pane" style={{ padding: '5px', border: 'none', color: 'white' }}><ChevronRight size={16} /></button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden' }}>
                        {days.map(d => (
                            <div key={d} style={{ textAlign: 'center', padding: '10px', background: '#0a0e14', fontSize: '0.7rem', fontWeight: 800, color: '#64748b' }}>{d}</div>
                        ))}
                        {Array.from({ length: 28 }).map((_, i) => (
                            <div key={i} style={{ padding: '10px', background: '#05070a', minHeight: '60px', opacity: 0.8 }}>
                                <span style={{ fontSize: '0.7rem' }}>{i + 1}</span>
                                {i === 18 && <div style={{ width: '4px', height: '4px', background: '#3b82f6', borderRadius: '50%', margin: '4px auto' }}></div>}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-pane" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <User size={18} color="#3b82f6" /> Staff Disponible (Hoy)
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {doctors && doctors.length > 0 ? doctors.slice(0, 6).map((doc, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                                <div className="p-avatar-v3" style={{ width: '32px', height: '32px' }}>{doc.nombre ? doc.nombre[0] : 'D'}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>{doc.nombre}</div>
                                    <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{doc.especialidad}</div>
                                </div>
                                <div style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%' }}></div>
                            </div>
                        )) : (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.8rem' }}>No hay doctores cargados.</div>
                        )}
                    </div>

                    <div style={{ marginTop: '2rem', padding: '12px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px dashed rgba(59, 130, 246, 0.3)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6', fontWeight: 800, fontSize: '0.7rem', marginBottom: '5px' }}>
                            <ShieldCheck size={14} /> COBERTURA GPU
                        </div>
                        <p style={{ fontSize: '0.65rem', color: '#94a3b8' }}>El sistema registra 100% de operatividad en los nodos de inferencia para el turno actual.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Scheduler;
