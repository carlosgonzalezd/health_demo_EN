import React, { useState } from 'react';
import {
    ChevronLeft, History, FileText, Pill, Clipboard,
    MoreHorizontal, Printer, Mail, Download, Phone,
    Calendar, MapPin, User, Activity, AlertCircle, CheckCircle2,
    Heart, Shield, Microscope, Stethoscope, Loader2, Zap
} from 'lucide-react';

const PatientDetail = ({ patient, onBack, onDeepAnalysis, isAnalyzing = false }) => {
    const [activeTab, setActiveTab] = useState('resume');

    if (!patient) return null;

    const tabs = [
        { id: 'resume', label: 'Clinical Summary', icon: Clipboard },
        { id: 'history', label: 'Timeline', icon: History },
        { id: 'scans', label: 'Imaging Studies', icon: FileText },
        { id: 'meds', label: 'Care Plan', icon: Pill },
    ];

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            {/* Header / Patient Profile Card */}
            <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] border border-black/5 shadow-sm p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-8">
                        <div className="relative">
                            <div className="size-24 rounded-[2rem] bg-blue-50 text-[#007db8] flex items-center justify-center text-3xl font-extrabold shadow-inner border border-blue-100">
                                {patient.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="absolute -bottom-2 -right-2 size-8 rounded-full bg-green-500 border-4 border-white flex items-center justify-center text-white shadow-sm">
                                <CheckCircle2 size={14} strokeWidth={3} />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-3xl font-extrabold text-[#364356] font-outfit tracking-tight">{patient.name}</h2>
                                <span className="px-3 py-1 bg-blue-50 text-[#007db8] text-[10px] font-extrabold rounded-full uppercase tracking-widest border border-blue-100">Patient 360º View</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 mt-2 text-sm font-medium text-slate-500 font-sans">
                                <span className="flex items-center gap-2">
                                    <span className="font-mono text-[11px] font-bold text-slate-400">NHC:</span>
                                    <span className="font-bold text-slate-700 font-mono tracking-tighter">{patient.id}</span>
                                </span>
                                <div className="w-px h-3 bg-slate-200"></div>
                                <span className="flex items-center gap-2">
                                    <User size={14} className="text-[#007db8]" />
                                    {patient.age} years · {patient.sex}
                                </span>
                                <div className="w-px h-3 bg-slate-200"></div>
                                <span className="flex items-center gap-2">
                                    <MapPin size={14} className="text-[#007db8]" />
                                    Main Campus · Ward 4B
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:text-[#007db8] hover:bg-blue-50 transition-all border border-slate-100">
                            <Printer size={20} />
                        </button>
                        <button className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:text-[#007db8] hover:bg-blue-50 transition-all border border-slate-100">
                            <Download size={20} />
                        </button>
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 px-6 py-3 bg-[#364356] text-white rounded-xl text-xs font-extrabold uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
                        >
                            <ChevronLeft size={16} strokeWidth={3} />
                            Back to List
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border border-black/5 w-fit">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all ${isActive
                                ? 'bg-white text-[#007db8] shadow-sm border border-black/5 translate-y-[-1px]'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <Icon size={14} strokeWidth={isActive ? 3 : 2} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-6">
                    {activeTab === 'resume' && (
                        <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] border border-black/5 shadow-sm p-10 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            <section>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="size-10 rounded-xl bg-blue-50 text-[#007db8] flex items-center justify-center">
                                        <div className="material-symbols-outlined text-2xl">clinical_notes</div>
                                    </div>
                                    <h3 className="text-xl font-extrabold text-[#364356] font-outfit">Medical History Analysis</h3>
                                </div>
                                <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100 leading-relaxed text-slate-600 font-medium">
                                    {patient.history || "No significant history recorded in FHIR."}
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={() => onDeepAnalysis && onDeepAnalysis(patient)}
                                        disabled={isAnalyzing}
                                        className="flex items-center gap-2 text-[10px] font-extrabold text-[#007db8] uppercase tracking-widest bg-blue-50 hover:bg-blue-100 transition-all px-4 py-2 rounded-lg border border-blue-100 disabled:opacity-50"
                                    >
                                        {isAnalyzing ? (
                                            <>
                                                <Loader2 size={12} className="animate-spin" />
                                                Analyzing with GB10...
                                            </>
                                        ) : (
                                            <>
                                                <Zap size={12} fill="#007db8" />
                                                Deep AI History Expansion
                                            </>
                                        )}
                                    </button>
                                </div>
                            </section>

                            <section>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="size-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                                        <div className="material-symbols-outlined text-2xl">emergency_home</div>
                                    </div>
                                    <h3 className="text-xl font-extrabold text-[#364356] font-outfit">Reason for Admission</h3>
                                </div>
                                <div className="text-lg font-bold text-slate-800 bg-orange-50/30 p-6 rounded-2xl border-l-4 border-orange-500">
                                    {patient.reason}
                                </div>
                            </section>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 bg-green-50/30 rounded-2xl border border-green-100/50 flex items-center gap-4">
                                    <div className="size-12 rounded-xl bg-white flex items-center justify-center text-green-600 shadow-sm">
                                        <Activity size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-extrabold text-green-700 uppercase tracking-widest">Status</p>
                                        <p className="text-sm font-extrabold text-green-900 uppercase">Clinically Stable</p>
                                    </div>
                                </div>
                                <div className="p-6 bg-blue-50/30 rounded-2xl border border-blue-100/50 flex items-center gap-4">
                                    <div className="size-12 rounded-xl bg-white flex items-center justify-center text-[#007db8] shadow-sm">
                                        <Shield size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-extrabold text-[#007db8] uppercase tracking-widest">Insurance</p>
                                        <p className="text-sm font-extrabold text-slate-900 uppercase">Premium Care PluS</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] border border-black/5 shadow-sm p-10 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-extrabold text-[#364356] font-outfit">Clinical Evolution Timeline</h3>
                                <span className="text-[10px] font-bold text-[#007db8] bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest border border-blue-100">Live EHR Sync</span>
                            </div>

                            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                                {/* Timeline Item 1: Current Reason */}
                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-blue-500 text-white shadow shadow-blue-500/20 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-transform duration-300 group-hover:scale-110 z-10">
                                        <Activity size={16} />
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex items-center justify-between mb-1">
                                            <time className="font-mono text-[10px] font-bold text-slate-400">TODAY, 2026</time>
                                            <span className="text-[9px] font-extrabold text-[#007db8] uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">Admission</span>
                                        </div>
                                        <div className="text-slate-800 font-bold mb-1">Emergency Admission: {patient.reason}</div>
                                        <div className="text-slate-500 text-xs font-medium">Initial assessment complete. Manchester Triage level applied.</div>
                                    </div>
                                </div>

                                {/* Timeline Item 2: Historical context */}
                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-[#364356] text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-transform duration-300 group-hover:scale-110 z-10">
                                        <History size={16} />
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm group-hover:bg-white transition-all">
                                        <div className="flex items-center justify-between mb-1">
                                            <time className="font-mono text-[10px] font-bold text-slate-400 font-outfit">PREVIOUS HISTORY</time>
                                        </div>
                                        <div className="text-slate-700 font-bold mb-1">Prior Diagnosis & Records</div>
                                        <div className="text-slate-500 text-xs font-medium leading-relaxed italic">"{patient.history}"</div>
                                    </div>
                                </div>

                                {/* Timeline Item 3: System Note */}
                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-green-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-transform duration-300 group-hover:scale-110 z-10">
                                        <FileText size={16} />
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                                        <div className="flex items-center justify-between mb-1">
                                            <time className="font-mono text-[10px] font-bold text-slate-400">HL7 ARCHIVE</time>
                                        </div>
                                        <div className="text-slate-700 font-bold mb-1">Archive Synchronization</div>
                                        <div className="text-slate-500 text-xs font-medium">External HL7/FHIR nodes successfully indexed for patient {patient.id}.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'scans' && (
                        <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] border border-black/5 shadow-sm p-10 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="size-10 rounded-xl bg-blue-50 text-[#007db8] flex items-center justify-center">
                                    <div className="material-symbols-outlined text-2xl">image_search</div>
                                </div>
                                <h3 className="text-xl font-extrabold text-[#364356] font-outfit">Available Imaging Studies</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="group relative overflow-hidden rounded-2xl border border-slate-200 aspect-square bg-[#0a0c10] flex items-center justify-center hover:border-[#007db8] transition-all cursor-pointer">
                                    <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity bg-[url('https://images.unsplash.com/photo-1559757175-5700dde675bc?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80')] bg-cover bg-center"></div>
                                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
                                        <p className="text-[10px] font-extrabold uppercase tracking-widest opacity-80">Chest X-Ray</p>
                                        <p className="text-xs font-bold">Anterior-Posterior View</p>
                                    </div>
                                </div>
                                <div className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-[#007db8] hover:border-[#007db8]/30 transition-all cursor-pointer">
                                    <Plus size={32} />
                                    <span className="text-[10px] font-extrabold uppercase tracking-widest">Add New Study</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {(activeTab !== 'resume' && activeTab !== 'history' && activeTab !== 'scans') && (
                        <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] border border-black/5 shadow-sm p-20 text-center space-y-6">
                            <div className="size-20 rounded-full bg-blue-50 flex items-center justify-center mx-auto text-[#007db8] animate-pulse">
                                <Microscope size={40} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-extrabold text-[#364356] font-outfit uppercase tracking-tighter">Deep Inference Required</h3>
                                <p className="text-slate-400 font-medium max-w-sm mx-auto mt-2">Connecting to GB10 cluster to retrieve long-term temporal records and high-resolution clinical assets.</p>
                            </div>
                            <button className="px-8 py-3 bg-[#007db8] text-white rounded-xl text-[10px] font-extrabold uppercase tracking-widest hover:bg-[#005a8a] transition-all">Request Full Sync</button>
                        </div>
                    )}
                </div>

                {/* Right Sidebar Column */}
                <div className="space-y-6">
                    {/* Alerts & Allergies */}
                    <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] border border-black/5 shadow-sm p-8">
                        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-6">Clinical Alerts</h4>
                        <div className="space-y-4">
                            <div className="flex gap-4 p-4 bg-red-50 rounded-2xl border border-red-100">
                                <AlertCircle className="text-red-500 shrink-0" size={20} />
                                <div>
                                    <p className="text-xs font-extrabold text-red-700 uppercase tracking-wide">Penicillin Allergy</p>
                                    <p className="text-[11px] font-medium text-red-600/70 mt-0.5">Reported severe reaction (1998)</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                <Stethoscope className="text-amber-600 shrink-0" size={20} />
                                <div>
                                    <p className="text-xs font-extrabold text-amber-700 uppercase tracking-wide">Smoker (Current)</p>
                                    <p className="text-[11px] font-medium text-amber-600/70 mt-0.5">Refer to cessation program</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Vitals Summary Card */}
                    <div className="bg-[#364356] rounded-[2.5rem] shadow-xl p-8 text-white">
                        <div className="flex items-center justify-between mb-8">
                            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Latest Vitals</h4>
                            <span className="text-[10px] font-bold bg-white/10 px-2 py-1 rounded">2 min ago</span>
                        </div>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-slate-300">Blood Pressure</span>
                                <span className="text-xl font-extrabold font-mono tracking-tighter">128/84 <span className="text-[10px] font-medium opacity-50">mmHg</span></span>
                            </div>
                            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full w-[70%] bg-[#007db8]"></div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-slate-300">Heart Rate</span>
                                <span className="text-xl font-extrabold font-mono tracking-tighter">72 <span className="text-[10px] font-medium opacity-50">bpm</span></span>
                            </div>
                            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full w-[60%] bg-green-400"></div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-slate-300">Oxygen (SpO2)</span>
                                <span className="text-xl font-extrabold font-mono tracking-tighter">98 <span className="text-[10px] font-medium opacity-50">%</span></span>
                            </div>
                            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full w-[98%] bg-blue-400"></div>
                            </div>
                        </div>
                        <button className="w-full mt-10 py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-extrabold uppercase tracking-[0.2em] transition-all">View All Biometrics</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientDetail;
