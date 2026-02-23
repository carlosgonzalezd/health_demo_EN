import React from 'react';
import {
    Users, Activity, FileText, TrendingUp, TrendingDown,
    Clock, CheckCircle, AlertTriangle, ArrowUpRight, ArrowDownRight,
    Eye, MoreVertical, Heart, Download
} from 'lucide-react';

const Dashboard = ({ onSelectPatient, patients = [] }) => {
    const stats = [
        { label: 'Estudios Analizados', value: '4,882', trend: '+12.4%', up: true, icon: Activity, color: '#3b82f6' },
        { label: 'Pacientes Activos', value: '1,204', trend: '+2.1%', up: true, icon: Users, color: '#10b981' },
        { label: 'Precisión AI', value: '98.8%', trend: '+0.4%', up: true, icon: Heart, color: '#ef4444' },
        { label: 'T. Respuesta Medio', value: '14m', trend: '-2m', up: true, icon: Clock, color: '#8b5cf6' },
    ];

    const recentActivity = [
        { id: '1', patient: 'Arthur Morgan', type: 'RM Cerebro', time: '12 min ago', status: 'Analizado', priority: 'high' },
        { id: '2', patient: 'Sarah Jenkins', type: 'TAC Abdominal', time: '24 min ago', status: 'Pendiente', priority: 'med' },
        { id: '3', patient: 'John Marston', type: 'X-Ray Tórax', time: '1 hora ago', status: 'Revisado', priority: 'low' },
        { id: '4', patient: 'Sadie Adler', type: 'RM Espinal', time: '2 horas ago', status: 'Analizado', priority: 'high' },
    ];

    return (
        <div className="dashboard-root animate-fade-in">
            <div className="section-header-v3">
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Panel de Control Radiológico</h2>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Bienvenido de nuevo, Dr. Romero. Tienes 12 informes pendientes de firma.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="glass-pane" style={{ padding: '8px 16px', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Download size={16} /> Exportar
                    </button>
                    <button style={{ padding: '8px 16px', background: '#3b82f6', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 800 }}>
                        Archivo PACS
                    </button>
                </div>
            </div>

            <div className="db-grid-v3" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {stats.map((stat, i) => (
                    <div key={i} className="glass-pane" style={{ padding: '1.5rem', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem' }}>
                            {stat.label} <stat.icon size={14} color={stat.color} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                            <span style={{ fontSize: '2rem', fontWeight: 800 }}>{stat.value}</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: stat.up ? '#10b981' : '#ef4444' }}>{stat.trend}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '1.5rem' }}>
                <div className="glass-pane" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '1.5rem' }}>Inferencias Recientes</h3>
                    <table className="study-list-table">
                        <thead><tr><th>Paciente</th><th>Estudio</th><th>Estado</th><th></th></tr></thead>
                        <tbody>
                            {recentActivity.map((activity, i) => (
                                <tr key={i} className="study-row-v3">
                                    <td style={{ fontWeight: 700 }}>{activity.patient}</td>
                                    <td>{activity.type}</td>
                                    <td><span className={`priority-chip ${activity.priority}`}>{activity.priority}</span></td>
                                    <td><Eye size={16} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="glass-pane" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '1.25rem' }}>Estado Nodo GB10</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '5px' }}>
                                <span>Carga GPU Inferencia</span>
                                <span style={{ fontWeight: 800 }}>42%</span>
                            </div>
                            <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                                <div style={{ width: '42%', height: '100%', background: '#3b82f6' }}></div>
                            </div>
                        </div>
                        <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '10px', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981' }}>SISTEMA ÓPTIMO</div>
                            <p style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Latencia media de inferencia: 14ms</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
