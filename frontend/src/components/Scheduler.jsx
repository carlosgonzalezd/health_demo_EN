import React from 'react';
import {
    Calendar, Clock, User, Filter,
    MoreHorizontal, ChevronLeft, ChevronRight, Plus,
    ShieldCheck, MapPin, Zap
} from 'lucide-react';

const Scheduler = ({ doctors = [] }) => {
    // Ultra-safe render
    if (!doctors) return <div className="glass-pane">Loading staff data...</div>;

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-700">
            {/* Header section with Stats */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-extrabold text-[#364356] font-outfit tracking-tight">Shift Management</h2>
                    <p className="text-sm font-medium text-slate-400 mt-1">Duty planning and occupancy for Sector GB10 • February 2026</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="glass-panel px-6 py-3 rounded-2xl border border-white/60 shadow-sm flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                            <span className="material-symbols-outlined text-lg">check_circle</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Status</p>
                            <p className="text-xs font-extrabold text-slate-700 uppercase mt-0.5">Fully Staffed</p>
                        </div>
                    </div>
                    <button className="px-6 py-3 bg-[#007db8] text-white rounded-xl text-xs font-extrabold uppercase tracking-widest hover:bg-[#005a8a] transition-all shadow-lg active:scale-95 flex items-center gap-2">
                        <Plus size={16} strokeWidth={3} />
                        New Assignment
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Calendar View */}
                <div className="xl:col-span-2 glass-panel p-8 rounded-[2.5rem] border border-white/60 shadow-sm space-y-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="size-10 rounded-xl bg-blue-50 text-[#007db8] flex items-center justify-center">
                                <Calendar size={20} />
                            </div>
                            <h3 className="text-xl font-extrabold text-[#364356] font-outfit">Staff Duty Roster</h3>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                            <button className="p-2.5 rounded-lg hover:bg-white hover:text-[#007db8] text-slate-400 transition-all"><ChevronLeft size={16} /></button>
                            <span className="text-[10px] font-extrabold uppercase tracking-widest px-4 text-[#364356]">February 2026</span>
                            <button className="p-2.5 rounded-lg hover:bg-white hover:text-[#007db8] text-slate-400 transition-all"><ChevronRight size={16} /></button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-px bg-slate-100 rounded-3xl overflow-hidden border border-slate-100">
                        {days.map(d => (
                            <div key={d} className="bg-slate-50/50 py-4 text-center text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{d}</div>
                        ))}
                        {Array.from({ length: 28 }).map((_, i) => (
                            <div key={i} className={`bg-white min-h-[100px] p-4 group hover:bg-blue-50/30 transition-all cursor-pointer ${i === 18 ? 'ring-2 ring-inset ring-[#007db8]/20' : ''}`}>
                                <span className={`text-[11px] font-bold ${i === 18 ? 'text-[#007db8]' : 'text-slate-400'}`}>{i + 1}</span>
                                {i === 18 && (
                                    <div className="mt-2 space-y-1">
                                        <div className="px-2 py-0.5 rounded bg-blue-100 text-[#007db8] text-[8px] font-extrabold uppercase truncate">AM Shift</div>
                                        <div className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-[8px] font-extrabold uppercase truncate">PM Shift</div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Staff List & Alerts */}
                <div className="space-y-6">
                    <div className="glass-panel p-8 rounded-[2.5rem] border border-white/60 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-extrabold text-[#364356] font-outfit">Available Staff</h3>
                            <button className="text-[10px] font-extrabold text-[#007db8] uppercase tracking-widest">View All</button>
                        </div>
                        <div className="space-y-4">
                            {doctors && doctors.length > 0 ? doctors.slice(0, 5).map((doc, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-md transition-all cursor-pointer group">
                                    <div className="size-10 rounded-xl bg-white text-[#007db8] flex items-center justify-center font-extrabold border border-slate-100 shadow-sm group-hover:bg-[#007db8] group-hover:text-white transition-all">
                                        {doc.name ? doc.name[0] : 'S'}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-extrabold text-slate-800">{doc.name}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{doc.specialty || 'General Duty'}</div>
                                    </div>
                                    <div className="size-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                                </div>
                            )) : (
                                <div className="text-center py-10 opacity-30">
                                    <User size={32} className="mx-auto mb-2" />
                                    <p className="text-xs font-bold uppercase tracking-widest">No staff loaded</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-8 rounded-[2.5rem] bg-[#364356] text-white shadow-xl space-y-4 relative overflow-hidden">
                        <Zap size={80} className="absolute -right-8 -bottom-8 opacity-5 text-white" />
                        <div className="flex items-center gap-3 text-blue-300">
                            <ShieldCheck size={20} />
                            <h4 className="text-xs font-extrabold uppercase tracking-widest">GPU System Coverage</h4>
                        </div>
                        <p className="text-sm font-medium leading-relaxed text-slate-300">
                            The GB10 cluster reports <span className="text-white font-extrabold italic">100% operational status</span> for real-time inference across all clinical sectors.
                        </p>
                        <div className="pt-2">
                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full w-full bg-[#007db8] shadow-[0_0_12px_rgba(0,125,184,0.6)]"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Scheduler;
