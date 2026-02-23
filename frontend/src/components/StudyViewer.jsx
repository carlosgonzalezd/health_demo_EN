import React, { useState } from 'react';
import {
    X, ZoomIn, ZoomOut, Sun, Contrast, RotateCw,
    Square, Circle, Move, Grid, Zap,
    Download, MessageSquare, ShieldCheck
} from 'lucide-react';

const StudyViewer = ({ onClose }) => {
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [zoom, setZoom] = useState(1);

    const studyImage = 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=1200';

    return (
        <div className="pacs-overlay animate-fade-in" style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: '#05070a', zIndex: 2000, display: 'flex', flexDirection: 'column'
        }}>
            <header style={{
                height: '60px', borderBottom: '1px solid var(--border)', padding: '0 1.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0a0e14'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Zap size={20} color="#3b82f6" />
                    <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>ESTACIÓN RADIOLÓGICA GB10</div>
                        <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700 }}>VERSIÓN PRO V3.2</div>
                    </div>
                </div>
                <button onClick={onClose} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
                    <X size={20} />
                </button>
            </header>

            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '250px 1fr 300px', overflow: 'hidden' }}>
                <aside style={{ borderRight: '1px solid var(--border)', padding: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem' }}>Herramientas</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}><span>Brillo</span><span>{brightness}%</span></div>
                            <input type="range" min="0" max="200" value={brightness} onChange={e => setBrightness(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}><span>Contraste</span><span>{contrast}%</span></div>
                            <input type="range" min="0" max="200" value={contrast} onChange={e => setContrast(e.target.value)} />
                        </div>
                    </div>
                </aside>

                <main style={{ background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <div style={{
                        width: '80%', height: '80%',
                        filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                        transform: `scale(${zoom})`,
                        transition: 'transform 0.1s'
                    }}>
                        <img src={studyImage} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="MRI" />
                        <div style={{ position: 'absolute', top: '20%', left: '40%', width: '15%', height: '15%', border: '2px dashed #ef4444', background: 'rgba(239, 68, 68, 0.1)' }}>
                            <div style={{ position: 'absolute', top: '-25px', background: '#ef4444', color: 'white', padding: '2px 6px', fontSize: '0.6rem', fontWeight: 800 }}>MASA AI (88%)</div>
                        </div>
                    </div>
                    <div style={{ position: 'absolute', bottom: '20px', left: '20px', fontSize: '0.7rem', color: '#3b82f6', fontWeight: 800 }}>NEUROSEG-AI V4 INFRASTRUCTURE</div>
                </main>

                <aside style={{ borderLeft: '1px solid var(--border)', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#10b981', marginBottom: '1.5rem' }}>
                        <ShieldCheck size={20} />
                        <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Reporte AI</h3>
                    </div>
                    <div className="glass-pane" style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.05)', marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 800 }}>Glioblastoma Presuntivo</div>
                        <p style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '5px' }}>Región frontal izquierda detectada mediante motor de inferencia local.</p>
                    </div>
                    <button className="btn-primary" style={{ width: '100%', background: '#3b82f6', border: 'none', color: 'white', padding: '10px', borderRadius: '8px', fontWeight: 700 }}>
                        <Download size={16} /> Firmar Informe
                    </button>
                </aside>
            </div>
        </div>
    );
};

export default StudyViewer;
