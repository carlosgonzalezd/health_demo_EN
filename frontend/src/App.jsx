import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Upload, FileText, Activity, MessageSquare, Send, Server, Bot, User, RefreshCw, AlertCircle, Users, Clipboard, Eye, Cpu, Zap, Info, X, Key, Plus, Trash2, AlertTriangle, Loader2, Calendar, BarChart3, Download, PieChart, CheckCircle2, ChevronDown, Menu, Settings } from 'lucide-react';
import './App.css';
import PatientDetail from './components/PatientDetail';

// Pathology capabilities data
const XRAY_CAPABILITIES = [
    { name: "Atelectasis", es: "Atelectasis", desc: "Partial lung collapse", severity: "⚠️ Medium" },
    { name: "Consolidation", es: "Consolidation", desc: "Solid pneumonia", severity: "🔴 High" },
    { name: "Infiltration", es: "Infiltration", desc: "Pulmonary infiltrate", severity: "⚠️ Medium" },
    { name: "Pneumothorax", es: "Pneumothorax", desc: "Collapsed lung (air in pleura)", severity: "🔴 Urgent" },
    { name: "Edema", es: "Pulmonary Edema", desc: "Fluid in lungs (heart failure)", severity: "🔴 High" },
    { name: "Emphysema", es: "Emphysema", desc: "Alveolar destruction (COPD)", severity: "⚠️ Chronic" },
    { name: "Fibrosis", es: "Fibrosis", desc: "Pulmonary scarring", severity: "⚠️ Chronic" },
    { name: "Effusion", es: "Pleural Effusion", desc: "Fluid in the pleural cavity", severity: "🔴 High" },
    { name: "Pneumonia", es: "Pneumonia", desc: "Pulmonary infection", severity: "🔴 High" },
    { name: "Pleural_Thickening", es: "Pleural Thickening", desc: "Thickening of the pleura", severity: "⚠️ Medium" },
    { name: "Cardiomegaly", es: "Cardiomegaly", desc: "Enlarged heart", severity: "🔴 High" },
    { name: "Nodule", es: "Pulmonary Nodule", desc: "Nodule (possible tumor)", severity: "🔴 High" },
    { name: "Mass", es: "Pulmonary Mass", desc: "Lung mass (cancer suspected)", severity: "🔴 Critical" },
    { name: "Hernia", es: "Diaphragmatic Hernia", desc: "Diaphragm hernia", severity: "⚠️ Medium" },
    { name: "Lung Lesion", es: "Lung Lesion", desc: "Generic lung lesion", severity: "⚠️ Variable" },
    { name: "Fracture", es: "Fracture", desc: "Rib fracture", severity: "⚠️ Medium" },
    { name: "Lung Opacity", es: "Lung Opacity", desc: "Opacity (generic signal)", severity: "⚠️ Variable" },
    { name: "Enlarged Cardiomediastinum", es: "Enlarged Mediastinum", desc: "Widened mediastinum", severity: "🔴 High" }
];

const TRIAGE_CAPABILITIES = [
    { name: "Emergency (Red)", es: "Emergency", desc: "Immediate life threat. Immediate care.", severity: "🔴 Critical" },
    { name: "Very Urgent (Orange)", es: "Very Urgent", desc: "Potential life threat. < 10-15 min.", severity: "🟠 High" },
    { name: "Urgent (Yellow)", es: "Urgent", desc: "Potentially serious. < 60 min.", severity: "🟡 Medium" },
    { name: "Standard (Green)", es: "Standard", desc: "Low urgency. < 2 hours.", severity: "🟢 Low" },
    { name: "Non-Urgent (Blue)", es: "Non-Urgent", desc: "No risk. < 4 hours.", severity: "🔵 Minimal" }
];

const YOLO_CAPABILITIES_SUMMARY = [
    "Person", "Bicycle", "Car", "Motorcycle", "Airplane", "Bus", "Train", "Truck",
    "Boat", "Traffic Light", "Bottle", "Wine Glass", "Fork", "Knife", "Spoon",
    "Bowl", "Banana", "Sandwich", "Laptop", "Mouse", "Keyboard", "Phone",
    "Book", "Clock", "Scissors", "Dog", "Cat", "Horse", "Sheep", "Cow"
];

const CT_CAPABILITIES = [
    { name: "Organ Segmentation", desc: "Automated masking of 117+ unique anatomical structures.", tech: "V-Net / UNet3D" },
    { name: "Skeletal Map", desc: "206-bone identification and density overview.", tech: "TotalSeg-Bones" },
    { name: "Vascular Routing", desc: "Aorta, Vena Cava and major arterial branch tracking.", tech: "TotalSeg-Vessels" },
    { name: "Muscle Mass Index", desc: "Cross-sectional muscle area calculation for sarcopenia analysis.", tech: "TotalSeg-Muscles" }
];

const MRI_CAPABILITIES = [
    { name: "NCR/NET", desc: "Necrotic and non-enhancing tumor core (Region 1).", label: "Necrosis" },
    { name: "ED", desc: "Peritumoral edema (Region 2).", label: "Edema" },
    { name: "ET", desc: "Enhancing tumor (Region 4).", label: "Enhancing" },
    { name: "Volume Analytics", desc: "Total tumor burden calculation in cubic centimeters.", label: "Volume" }
];

const RADIOLOGY_SAMPLES = {
    xray: [
        { name: "Premium Chest PA", url: "/radiology_samples/xray/premium_sample.jpg" },
        { name: "Clinical Case #042", url: "/radiology_samples/xray/sample1.jpg" }
    ],
    ct: [
        { name: "Premium Abdominal CT", url: "/radiology_samples/ct/premium_sample.jpg" },
        { name: "Axial Body Scan", url: "/radiology_samples/ct/sample1.jpg" }
    ],
    mri: [
        { name: "Premium Brain MRI", url: "/radiology_samples/mri/premium_sample.jpg" },
        { name: "High-Res T2 Axial", url: "/radiology_samples/mri/sample1.jpg" }
    ]
};

// Dynamic Backend Configuration
const BACKEND_PORT = window.location.port === "4101" ? "4201" : "4200";
const IS_PRO = window.location.port === "4101";
const BACKEND_URL = `${window.location.protocol}//${window.location.hostname}:${BACKEND_PORT}`;
const DEFAULT_OLLAMA_URL = "http://host.docker.internal:11434";

// NURSES_DATA removed - fetched from backend


const NurseCalendarView = ({ nurseId, nurses, viewDates, schedule, onBack, currentMonthLabel, currentYearLabel }) => {
    const nurse = nurses.find(n => n.id === nurseId);
    if (!nurse) return null;

    // Determine the month to show based on viewMonth context
    // We want the FULL month that corresponds to the view.
    const targetDate = viewDates.length > 0 ? new Date(viewDates[Math.floor(viewDates.length / 2)]) : new Date();
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth(); // 0-11

    // Generate days for this specific month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayObj = new Date(year, month, 1);
    // Adjusted Start Day: 1 (Mon) to 7 (Sun)
    const dayOfWeek = firstDayObj.getDay(); // 0=Sun, 1=Mon...
    const adjustedStartDay = dayOfWeek === 0 ? 7 : dayOfWeek;

    const monthDays = [];
    // Padding for start of month
    // Loop from 1 up to adjustedStartDay (exclusive)
    // E.g. Mon (1): loop 1..1 (empty) -> Correct, starts col 1.
    // E.g. Tue (2): loop 1..2 (1 padding) -> Correct.
    for (let i = 1; i < adjustedStartDay; i++) {
        monthDays.push(null);
    }
    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
        monthDays.push(new Date(year, month, i));
    }

    return (
        <div className="nurse-calendar-view fade-in">
            <div className="calendar-header-bar">
                <h2>
                    {currentMonthLabel}, {year} <ChevronDown size={20} />
                </h2>
                <div className="calendar-header-actions">
                    <button className="btn-icon-circle"><Plus size={20} /></button>
                    <button className="btn-icon-circle"><User size={20} /></button>
                    <button className="btn-icon-circle" onClick={onBack}><Menu size={20} /></button>
                </div>
            </div>

            <div className="calendar-days-header">
                {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(d => (
                    <div key={d} className="day-name-header">{d}</div>
                ))}
            </div>

            <div className="calendar-grid">
                {monthDays.map((dateObj, idx) => {
                    if (!dateObj) return <div key={`empty-${idx}`} className="calendar-day-cell empty"></div>;

                    const dayNum = dateObj.getDate();
                    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                    const dateStr = dateObj.toISOString().split('T')[0];

                    // Find shift
                    const entry = schedule.find(s => s.nurse_id === nurseId && s.date === dateStr);

                    // Determine display class
                    let shiftClass = "off";
                    let shiftLabel = "Off";

                    if (entry) {
                        if (entry.shift === "Morning") { shiftClass = "morning"; shiftLabel = "Morning"; }
                        else if (entry.shift === "Afternoon") { shiftClass = "afternoon"; shiftLabel = "Afternoon"; }
                        else if (entry.shift === "Night") { shiftClass = "night"; shiftLabel = "Night"; }
                    }

                    return (
                        <div key={dateStr} className="calendar-day-cell">
                            <span className={`day-number ${isWeekend ? 'weekend' : ''}`}>{dayNum}</span>
                            <div className={`shift-block-display ${shiftClass}`}>
                                {shiftLabel}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const PlanillaChat = ({ backendUrl, selectedModel }) => {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello. I\'m your expert shift scheduling assistant. I can help you resolve conflicts, cover absences, or plan the next month. What do you need?' }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await axios.post(`${backendUrl}/schedule/chat`, {
                model: selectedModel,
                message: userMsg.content,
                context: "Schedule Management",
                history: []
            });
            setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, there was a connection error." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="planilla-chatbot-section">
            <div className="chat-smart-container">
                <div className="chat-header-inline">
                    <Bot size={20} className="text-primary" />
                    <span>Intelligent Planning Assistant</span>
                </div>

                <div className="chat-messages-inline" style={{ padding: '2rem 1.5rem', background: '#f8fafc' }}>
                    {messages.map((m, i) => (
                        <div
                            key={i}
                            className={`chat-msg ${m.role}`}
                            style={{
                                lineHeight: '1.6',
                                fontSize: '1rem',
                                padding: '1.25rem',
                                borderRadius: m.role === 'assistant' ? '0 1rem 1rem 1rem' : '1rem 1rem 0 1rem',
                                marginBottom: '1.5rem',
                                background: m.role === 'assistant' ? 'white' : '#e0f2fe',
                                border: m.role === 'assistant' ? '1px solid #e2e8f0' : 'none',
                                borderLeft: m.role === 'assistant' ? '4px solid #4f46e5' : 'none',
                                color: '#334155',
                                boxShadow: m.role === 'assistant' ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none',
                                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '90%',
                            }}
                        >
                            {m.role === 'assistant' ? (
                                <div className="markdown-content">
                                    <ReactMarkdown>{m.content}</ReactMarkdown>
                                </div>
                            ) : m.content}
                        </div>
                    ))}
                    {loading && <div className="chat-msg assistant"><Loader2 className="spin" size={14} /> Thinking...</div>}
                    <div ref={messagesEndRef} />
                </div>

                <form className="chat-input-inline" onSubmit={handleSend}>
                    <input
                        placeholder="E.g: I need to cover Ana's night shift on Tuesday..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                    />
                    <button type="submit" disabled={loading || !input} className="btn-primary" style={{ width: 'auto', padding: '0 1.5rem' }}>
                        <Send size={18} /> Send
                    </button>
                </form>
            </div>
        </div>
    );
};

const TriageChat = ({ backendUrl, defaultModel, contextData, activeOllamaUrl }) => {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello. I am your Triage Assistant. Do you have any questions about the patient\'s classification or the Manchester Protocol?' }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            // Include context from the current triage evaluation if available
            let contextStr = "Triage Context: No prior data.";
            if (contextData) {
                contextStr = `Priority: ${contextData.priority_name} (Level ${contextData.level}). 
                Original Justification: ${contextData.justification}. 
                Recommended Actions: ${contextData.actions}.`;
            }

            const res = await axios.post(`${backendUrl}/chat`, {
                model: defaultModel,
                message: userMsg.content,
                context: contextStr,
                ollama_url: activeOllamaUrl, // Use the externally controlled URL
                history: []
            });
            setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Connection error or model timeout." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="planilla-chatbot-section" style={{ marginTop: '2rem' }}>
            <div className="chat-smart-container">
                <div className="chat-header-inline">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Activity size={20} className="text-primary" />
                        <span>Clinical Triage Assistant</span>
                    </div>
                </div>

                <div className="chat-messages-inline" style={{ padding: '2rem 1.5rem', background: '#f8fafc' }}>
                    {messages.map((m, i) => (
                        <div
                            key={i}
                            className={`chat-msg ${m.role}`}
                            style={{
                                lineHeight: '1.6',
                                fontSize: '1rem',
                                padding: '1.25rem',
                                borderRadius: m.role === 'assistant' ? '0 1rem 1rem 1rem' : '1rem 1rem 0 1rem',
                                marginBottom: '1.5rem',
                                background: m.role === 'assistant' ? 'white' : '#e0f2fe',
                                border: m.role === 'assistant' ? '1px solid #e2e8f0' : 'none',
                                borderLeft: m.role === 'assistant' ? '4px solid #0ea5e9' : 'none',
                                color: '#334155',
                                boxShadow: m.role === 'assistant' ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none',
                                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '90%',
                            }}
                        >
                            {m.role === 'assistant' ? (
                                <div className="markdown-content">
                                    <ReactMarkdown>{m.content}</ReactMarkdown>
                                </div>
                            ) : m.content}
                        </div>
                    ))}
                    {loading && <div className="chat-msg assistant"><Loader2 className="spin" size={14} /> Consulting expert ({defaultModel})...</div>}
                    <div ref={messagesEndRef} />
                </div>

                <form className="chat-input-inline" onSubmit={handleSend}>
                    <input
                        placeholder="E.g: Why is a fever of 40 Orange and not Red?"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                    />
                    <button type="submit" disabled={loading || !input} className="btn-primary" style={{ width: 'auto', padding: '0 1.5rem' }}>
                        <Send size={18} /> Send
                    </button>
                </form>
            </div>
        </div>
    );
};




const MonitorCentral = ({ patients }) => {
    return (
        <div className="pro-dashboard fade-in">
            <header className="pro-header">
                <div className="search-bar-pro">
                    <Users size={18} />
                    <input placeholder="Search records or NHC..." />
                </div>
                <div className="user-profile-pro">
                    <div className="user-info-text">
                        <span className="user-name-pro">Dr. Charles Gonzalez</span>
                        <span className="user-status-pro">GPU OPTIMIZED • ACTIVE</span>
                    </div>
                    <div className="user-avatar-pro">CG</div>
                </div>
            </header>

            <section className="pro-hero">
                <h1 className="pro-title">Radiology Control Panel</h1>
                <p className="pro-subtitle">Critical metrics and local inference performance.</p>
            </section>

            <div className="metric-cards-pro">
                <div className="metric-card-pro">
                    <span className="metric-label">AI STUDIES</span>
                    <div className="metric-value-row">
                        <span className="metric-value">4,882</span>
                        <span className="metric-trend positive">+12%</span>
                    </div>
                </div>
                <div className="metric-card-pro">
                    <span className="metric-label">MODEL ACCURACY</span>
                    <div className="metric-value-row">
                        <span className="metric-value">98.8%</span>
                        <span className="metric-trend opt">Opt.</span>
                    </div>
                </div>
                <div className="metric-card-pro">
                    <span className="metric-label">INFERENCE LATENCY</span>
                    <div className="metric-value-row">
                        <span className="metric-value">14ms</span>
                        <span className="metric-trend negative">-2ms</span>
                    </div>
                </div>
                <div className="metric-card-pro">
                    <span className="metric-label">TRIAGE ALERTS</span>
                    <div className="metric-value-row">
                        <span className="metric-value">12</span>
                        <span className="metric-trend active">Act.</span>
                    </div>
                </div>
            </div>

            <div className="card pro-table-card">
                <div className="card-header-pro">
                    <Activity size={18} />
                    <h3>Recent Inferences</h3>
                </div>
                <table className="pro-table">
                    <thead>
                        <tr>
                            <th>PATIENT</th>
                            <th>STUDY</th>
                            <th>PROBABILITY</th>
                            <th>STATUS</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Arthur Morgan</td>
                            <td>Brain MRI</td>
                            <td className="prob-high">88.2%</td>
                            <td><span className="status-badge prioritario">PRIORITY</span></td>
                        </tr>
                        <tr>
                            <td>Jose Perez Alvarez</td>
                            <td>Chest X-Ray</td>
                            <td>12.4%</td>
                            <td><span className="status-badge estable">STABLE</span></td>
                        </tr>
                        <tr>
                            <td>{patients[0]?.name || "Loading..."}</td>
                            <td>Abdominal Scanner</td>
                            <td>45.1%</td>
                            <td><span className="status-badge revision">IN REVIEW</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <footer className="pro-footer">
                HealthOS V3.1 PROFESSIONAL • SECURE ENVIRONMENT • NODE GB10-C881
            </footer>
        </div>
    );
};

function App() {

    const [ollamaUrl, setOllamaUrl] = useState(DEFAULT_OLLAMA_URL);
    const [models, setModels] = useState([]);
    const [selectedModel, setSelectedModel] = useState("");
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [configLoading, setConfigLoading] = useState(false);
    const [configError, setConfigError] = useState(null);

    // Vision Engine
    const [selectedEngine, setSelectedEngine] = useState("xray");
    const [activeRadiologySubTab, setActiveRadiologySubTab] = useState("xray");
    const [activeTab, setActiveTab] = useState("dashboard");
    const [isAnalyzingPatient, setIsAnalyzingPatient] = useState(false);

    const handleDeepPatientAnalysis = async (patient) => {
        if (!patient || !selectedModel) return;
        setIsAnalyzingPatient(true);
        try {
            const context = `PATIENT: ${patient.name} (${patient.age}, ${patient.sex}). CURRENT HISTORY: ${patient.history}. REASON: ${patient.reason}.`;
            const message = "Please expand this patient's medical history into a more detailed and structured clinical summary. Use professional medical terminology. Focus on potential risks and follow-up recommendations based on the current history.";

            const resp = await axios.post(`${BACKEND_URL}/chat`, {
                model: selectedModel,
                message: message,
                context: context,
                ollama_url: ollamaUrl
            });

            if (resp.data && resp.data.response) {
                const updatedPatient = { ...patient, history: resp.data.response };
                setSelectedPatient(updatedPatient);
                // Update in patients list as well
                setPatients(prev => prev.map(p => p.id === patient.id ? updatedPatient : p));
            }
        } catch (err) {
            console.error("Deep analysis failed:", err);
            alert("Deep analysis failed. Check connection to GB10.");
        } finally {
            setIsAnalyzingPatient(false);
        }
    };

    // Triage State
    const [triageVitals, setTriageVitals] = useState({
        hr: "", bp_sys: "", bp_dia: "", temp: "", spo2: ""
    });
    const [triageReason, setTriageReason] = useState("");
    const [triageResult, setTriageResult] = useState(null);
    const [triageLoading, setTriageLoading] = useState(false);
    const [engineStatus, setEngineStatus] = useState({});
    const [showCapabilities, setShowCapabilities] = useState(false);

    // Schedule State
    const [nurses, setNurses] = useState([]);
    const [schedule, setSchedule] = useState([]);
    const [scheduleLoading, setScheduleLoading] = useState(false);
    const [viewMonth, setViewMonth] = useState(0); // 0, 1, 2
    const [selectedNurseId, setSelectedNurseId] = useState(null);

    // Triage Models State
    const [triageAnalysisModel, setTriageAnalysisModel] = useState("");
    const [triageInteractionModel, setTriageInteractionModel] = useState("");

    // Credentials
    const [credentials, setCredentials] = useState([]);
    const [selectedCredentialId, setSelectedCredentialId] = useState("");
    const [showCredModal, setShowCredModal] = useState(false);
    const [newCred, setNewCred] = useState({ name: "", ip: "", port: "11434" });

    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const [age, setAge] = useState('');
    const [sex, setSex] = useState('Male');
    const [symptoms, setSymptoms] = useState('');

    const [chatMessage, setChatMessage] = useState("");
    const [chatHistory, setChatHistory] = useState([
        { role: 'assistant', content: 'Hello! I am the **Dell AI Healthcare Assistant**.\n\nI am ready to help you with clinical triage or radiological analysis. How can I assist you today?' }
    ]);
    const [chatLoading, setChatLoading] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const chatEndRef = useRef(null);

    const canvasRef = useRef(null);
    const imgRef = useRef(null);

    // Hardware stats for live GPU/MEM/Throughput
    const [hwStats, setHwStats] = useState({ gpu: 0, mem: 0, throughput: 0 });

    useEffect(() => {
        fetchInitData();
    }, []);

    // Poll /stats every 3s when radiology, triage or dashboard active (host server for nvidia-smi access)
    // The stats server runs on whichever node the app is on (GB10 or Worki), port 4102.
    // It figures out the host dynamically - if the credential IP is different, it polls that node's stats.
    const getStatsUrl = () => {
        const cred = credentials.find(c => c.id === selectedCredentialId);
        // If a custom node (Worki, etc.) is selected, poll that node's stats server
        if (cred && cred.ip && cred.ip !== 'host.docker.internal') {
            return `http://${cred.ip}:4102`;
        }
        // Default: poll current hostname (GB10)
        return window.location.hostname === 'localhost' ? 'http://localhost:4102' : `http://${window.location.hostname}:4102`;
    };
    useEffect(() => {
        if (activeTab !== 'radiology' && activeTab !== 'triage' && activeTab !== 'dashboard') return;
        const fetchStats = () => {
            const url = getStatsUrl();
            axios.get(`${url}/stats`).then(r => setHwStats(r.data)).catch(() => { });
        };
        fetchStats();
        const interval = setInterval(fetchStats, 3000);
        return () => clearInterval(interval);
    }, [activeTab, selectedCredentialId, credentials]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    const fetchInitData = async () => {
        setConfigLoading(true);
        try {
            // Load credentials first
            const credRes = await axios.get(`${BACKEND_URL}/credentials`);
            const creds = credRes.data;
            setCredentials(creds);

            const confRes = await axios.get(`${BACKEND_URL}/config`);
            const currentUrl = confRes.data.OLLAMA_URL || DEFAULT_OLLAMA_URL;
            setOllamaUrl(currentUrl);

            // Match current URL to a credential
            const matched = creds.find(c => `http://${c.ip}:${c.port}` === currentUrl || `https://${c.ip}:${c.port}` === currentUrl);

            if (matched) {
                setSelectedCredentialId(matched.id);
            } else if (creds.length > 0) {
                // Force select first credential if no match (e.g. GB10)
                const first = creds[0];
                setSelectedCredentialId(first.id);
                const newUrl = `http://${first.ip}:${first.port}`;
                setOllamaUrl(newUrl);
                // Update backend to sync
                await axios.post(`${BACKEND_URL}/config`, { ollama_url: newUrl });
            } else {
                setSelectedCredentialId("");
            }

            const modRes = await axios.get(`${BACKEND_URL}/models`);
            if (modRes.data.models) {
                setModels(modRes.data.models);

                const allModels = modRes.data.models;
                if (allModels.length > 0) {
                    // 1. Global Default (General)
                    setSelectedModel(allModels[0]);

                    // 2. Triage Analysis Default (General High-IQ model preferred for Logic/JSON)
                    const triagePreferred = allModels.find(m => m.includes("gpt-oss") || m.includes("llama3"));
                    setTriageAnalysisModel(triagePreferred || allModels[0]);

                    // 3. Triage Interaction Default (Conversational preferred)
                    const chat = allModels.find(m => m.includes("llama3") || m.includes("mistral"));
                    setTriageInteractionModel(chat || allModels[0]);
                }
            }

            const patRes = await axios.get(`${BACKEND_URL}/patients`);
            setPatients(patRes.data);

            // Check engine status
            const engRes = await axios.get(`${BACKEND_URL}/engines/status`);
            setEngineStatus(engRes.data);

            // Fetch Schedule & Nurses
            await fetchNurses();
            fetchSchedule();
        } catch (e) {
            setConfigError("Server connection failed");
        } finally {
            setConfigLoading(false);
        }
    };

    const handleCredentialChange = async (e) => {
        const val = e.target.value;
        if (val === "ADD_NEW") {
            setNewCred({ name: "", ip: "", port: "11434" });
            setShowCredModal(true);
            return;
        }

        const cred = credentials.find(c => c.id === val);
        if (cred) {
            setSelectedCredentialId(cred.id);
            const url = `http://${cred.ip}:${cred.port}`;
            setOllamaUrl(url);
            // Save immediately
            await updateBackendConfig(url);
        }
    };

    const saveCredential = async () => {
        if (!newCred.name || !newCred.ip || !newCred.port) return;
        try {
            const res = await axios.post(`${BACKEND_URL}/credentials`, newCred);
            setCredentials(res.data.credentials);
            const created = res.data.credential;
            setSelectedCredentialId(created.id);
            const url = `http://${created.ip}:${created.port}`;
            setOllamaUrl(url);
            setShowCredModal(false);
            await updateBackendConfig(url);
        } catch (e) {
            alert("Error saving credential");
        }
    };

    const deleteCredential = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Delete this credential?")) return;
        try {
            const res = await axios.delete(`${BACKEND_URL}/credentials/${id}`);
            setCredentials(res.data.credentials);
            // If deleted current, fallback to first
            if (selectedCredentialId === id) {
                const first = res.data.credentials[0];
                if (first) {
                    setSelectedCredentialId(first.id);
                    const url = `http://${first.ip}:${first.port}`;
                    setOllamaUrl(url);
                    updateBackendConfig(url);
                }
            }
        } catch (e) {
            alert("Error deleting credential");
        }
    };

    const updateBackendConfig = async (url) => {
        setConfigLoading(true);
        try {
            await axios.post(`${BACKEND_URL}/config`, { ollama_url: url });
            const modelRes = await axios.get(`${BACKEND_URL}/models`);
            setModels(modelRes.data.models || []);
            if (modelRes.data.models?.length > 0) setSelectedModel(modelRes.data.models[0]);
            setConfigError(null);
        } catch (e) {
            setConfigError("Error updating configuration.");
        } finally {
            setConfigLoading(false);
        }
    };

    const handleUpdateConfig = async () => {
        setConfigLoading(true);
        try {
            await axios.post(`${BACKEND_URL}/config`, { ollama_url: ollamaUrl });
            const modelRes = await axios.get(`${BACKEND_URL}/models`);
            setModels(modelRes.data.models || []);
            if (modelRes.data.models?.length > 0) setSelectedModel(modelRes.data.models[0]);
            setConfigError(null);
        } catch (e) {
            setConfigError("Error updating configuration.");
        } finally {
            setConfigLoading(false);
        }
    };

    const handlePatientSelect = (e) => {
        const id = e.target.value;
        const patient = patients.find(p => p.id === id);
        if (patient) {
            setSelectedPatient(patient);
            setAge(patient.age);
            setSex(patient.sex);
            setSymptoms(patient.reason);
        } else {
            setSelectedPatient(null);
            setAge('');
            setSymptoms('');
        }
    };

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
            setResult(null);
            setChatHistory([]);
        }
    };

    const loadSampleImage = async (url) => {
        setLoading(true);
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const sampleFile = new File([blob], "sample_radiology.jpg", { type: blob.type });
            setFile(sampleFile);
            setPreview(URL.createObjectURL(sampleFile));
            setResult(null);
            setChatHistory([]);
        } catch (e) {
            alert("Error loading sample image from repository.");
        } finally {
            setLoading(false);
        }
    };

    const drawBoxes = (detections) => {
        const canvas = canvasRef.current;
        const img = imgRef.current;
        if (!canvas || !img) return;
        const ctx = canvas.getContext('2d');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        detections.forEach(det => {
            if (!det.bbox || det.bbox.length < 4) return;
            const [x1, y1, x2, y2] = det.bbox;
            ctx.strokeStyle = '#0ea5e9';
            ctx.lineWidth = 4;
            ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
            ctx.fillStyle = 'rgba(14, 165, 233, 0.8)';
            ctx.font = 'bold 24px Inter';
            ctx.fillText(`${det.class} ${(det.confidence * 100).toFixed(0)}%`, x1, y1 - 10);
        });
    };

    useEffect(() => {
        if (result && result.detections && imgRef.current) {
            if (imgRef.current.complete) drawBoxes(result.detections);
        }
    }, [result]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return;

        setLoading(true);
        setError(null);
        setResult(null);

        // Determine the active Ollama URL from the selected credential
        const activeCred = credentials.find(c => c.id === selectedCredentialId);
        const activeOllamaUrl = activeCred ? `http://${activeCred.ip}:${activeCred.port}` : null;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('model', selectedModel);
        formData.append('patient_id', selectedPatient ? selectedPatient.id : "None");
        formData.append('age', age);
        formData.append('sex', sex);
        formData.append('symptoms', symptoms);
        formData.append('engine', selectedEngine);
        if (activeOllamaUrl) formData.append('ollama_url', activeOllamaUrl);

        try {
            const response = await axios.post(`${BACKEND_URL}/analyze-image`, formData);
            setResult(response.data);
        } catch (err) {
            setError("Error analyzing the case.");
        } finally {
            setLoading(false);
        }
    };

    const handleExportDocx = (reportResult) => {
        if (!reportResult) return;
        const patientStr = selectedPatient?.id ? `Patient ID: ${selectedPatient.id}` : 'Anonymous Patient';

        let formattedReport = reportResult.clinical_report
            .replace(/\n\n/g, '<br/><br/>')
            .replace(/\n/g, '<br/>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/### (.*?)(<br\/>|$)/g, '<h3>$1</h3>');

        const content = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>Radiology Report</title></head>
            <body>
                <h1 style="color:#007db8; font-family: sans-serif;">Official Radiology Report</h1>
                <p style="font-family: sans-serif;"><strong>${patientStr}</strong></p>
                <p style="font-family: sans-serif;"><strong>AI Inference Engine:</strong> ${reportResult.engine}</p>
                <p style="font-family: sans-serif;"><strong>Language Model:</strong> ${reportResult.model_used}</p>
                <hr/>
                <div style="font-family: sans-serif;">
                    ${formattedReport}
                </div>
                <br/><br/>
                <p style="font-size: 10px; color: gray; font-family: sans-serif;"><em>Auto-generated by Dell AI Healthcare Assistant</em></p>
            </body>
            </html>
        `;

        const blob = new Blob(['\ufeff', content], {
            type: 'application/msword'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Radiology_Report_${selectedPatient?.id || 'New'}.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleChatSubmit = async (e) => {
        e.preventDefault();
        if (!chatMessage.trim()) return;

        const contextData = result ? result.findings_context : "No image is currently loaded. Speak based on your general knowledge.";

        const userMsg = { role: 'user', content: chatMessage };
        const assistantMsg = { role: 'assistant', content: '', loading: true };

        setChatHistory(prev => [...prev, userMsg, assistantMsg]);
        setChatMessage("");
        setChatLoading(true);

        try {
            const res = await fetch(`${BACKEND_URL}/chat_stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: selectedModel,
                    message: userMsg.content,
                    context: contextData,
                    history: chatHistory.map(m => ({ role: m.role, content: m.content }))
                })
            });

            if (!res.ok) throw new Error("Error en el stream");

            const reader = res.body.getReader();
            const decoder = new TextDecoder("utf-8");

            setChatHistory(prev => {
                if (prev.length === 0) return prev;
                const newHist = [...prev];
                newHist[newHist.length - 1].loading = false;
                return newHist;
            });

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                let wasCleared = false;
                setChatHistory(prev => {
                    if (prev.length === 0) {
                        wasCleared = true;
                        return prev;
                    }
                    const newHist = [...prev];
                    newHist[newHist.length - 1].content += chunk;
                    return newHist;
                });
                if (wasCleared) break;
            }

        } catch (err) {
            setChatHistory(prev => {
                if (prev.length === 0) return prev;
                const newHist = [...prev];
                newHist[newHist.length - 1].content = "Error communicating with AI model.";
                newHist[newHist.length - 1].loading = false;
                return newHist;
            });
        } finally {
            setChatLoading(false);
        }
    };

    // Render pathology bar chart
    const renderPathologyBars = () => {
        if (!result || !result.pathologies || Object.keys(result.pathologies).length === 0) return null;

        const sorted = Object.entries(result.pathologies)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10); // Top 10

        return (
            <div className="card pathology-chart fade-in">
                <div className="card-header">
                    <Cpu size={18} /> <h4>Pathology Probabilities (Top 10)</h4>
                </div>
                <div className="chart-body">
                    {sorted.map(([name, prob]) => (
                        <div key={name} className="bar-row">
                            <span className="bar-label">{name}</span>
                            <div className="bar-track">
                                <div
                                    className={`bar-fill ${prob > 0.5 ? 'high' : prob > 0.3 ? 'medium' : 'low'}`}
                                    style={{ width: `${Math.max(prob * 100, 2)}%` }}
                                />
                            </div>
                            <span className={`bar-value ${prob > 0.5 ? 'high' : prob > 0.3 ? 'medium' : 'low'}`}>
                                {(prob * 100).toFixed(1)}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const handleTriageSubmit = async () => {
        setTriageLoading(true);
        setTriageResult(null);
        setError("");

        // Find selected credential to determine Ollama URL
        const cred = credentials.find(c => c.id === selectedCredentialId);
        const ollamaTarget = cred ? `http://${cred.ip}:${cred.port}` : null;

        try {
            const resp = await axios.post(`${BACKEND_URL}/triage`, {
                patient_context: selectedPatient,
                vitals: triageVitals,
                complaint: triageReason,
                model: triageAnalysisModel || selectedModel, // Use specific analysis model
                ollama_url: ollamaTarget
            });
            setTriageResult(resp.data);
        } catch (err) {
            console.error(err);
            setError("Error processing triage. Please check backend connection.");
        } finally {
            setTriageLoading(false);
        }
    };



    const fetchNurses = async () => {
        try {
            const res = await axios.get(`${BACKEND_URL}/nurses`);
            setNurses(res.data);
        } catch (e) {
            console.error("Error fetching nurses", e);
        }
    };

    const fetchSchedule = async () => {
        setScheduleLoading(true);
        try {
            const res = await axios.get(`${BACKEND_URL}/schedule`);
            setSchedule(res.data.schedule);
        } catch (e) {
            console.error("Error fetching schedule", e);
        } finally {
            setScheduleLoading(false);
        }
    };

    const downloadScheduleCSV = () => {
        if (!schedule.length) return;

        const DAYS_PER_VIEW = 28;
        const startIdx = viewMonth * DAYS_PER_VIEW;

        // Get unique dates in this range (sorted)
        const allDates = [...new Set(schedule.map(s => s.date))].sort();
        const viewDates = allDates.slice(startIdx, startIdx + DAYS_PER_VIEW);

        // Header
        let csv = "Enfermera,Rol," + viewDates.join(",") + "\n";

        // nurses already in state (nurses)


        nurses.forEach(nurse => {
            const role = nurse.id <= 40 ? "Night" : "Day";
            let row = `"${nurse.name}","${role}"`;

            viewDates.forEach(date => {
                const entry = schedule.find(s => s.nurse_id === nurse.id && s.date === date);
                row += `,"${entry ? entry.shift : ''}"`;
            });
            csv += row + "\n";
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `schedule_month_${viewMonth + 1}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderScheduleStats = (viewDates) => {
        // Calculate basic stats for the current view
        const stats = {
            totalShifts: 0,
            nightShifts: 0,
            dayShifts: 0,
            nurseLoads: {}
        };

        // nurses already in state (nurses)
        nurses.forEach(n => stats.nurseLoads[n.id] = 0);

        schedule.forEach(s => {
            if (viewDates.includes(s.date)) {
                stats.totalShifts++;
                if (s.shift === 'Night') stats.nightShifts++;
                else stats.dayShifts++;
                if (stats.nurseLoads[s.nurse_id] !== undefined) stats.nurseLoads[s.nurse_id]++;
            }
        });

        // Calculate Fairness (Variance of shifts per nurse)
        const loads = Object.values(stats.nurseLoads);
        const mean = loads.reduce((a, b) => a + b, 0) / loads.length;
        const variance = loads.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / loads.length;
        // Simple mock score: 100 - variance * factor. 
        // If everyone has same load, variance 0 -> 100%.
        const fairnessScore = Math.max(0, 100 - (variance * 5)).toFixed(0);

        return (
            <div className="schedule-stats-panel fade-in">
                <div className="stats-header">
                    <h3><BarChart3 size={18} /> Workload Analysis (AI)</h3>
                    <div className="fairness-badge" title="Score based on shift variance among nurses">
                        <PieChart size={14} /> Fairness: <strong>{fairnessScore}%</strong>
                    </div>
                </div>
                <div className="stats-grid">
                    <div className="stat-item">
                        <span className="stat-label">Total Shifts</span>
                        <span className="stat-value">{stats.totalShifts}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Night Shifts</span>
                        <span className="stat-value night">{stats.nightShifts}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Day Shifts</span>
                        <span className="stat-value day">{stats.dayShifts}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Avg/Nurse</span>
                        <span className="stat-value">{mean.toFixed(1)}</span>
                    </div>
                </div>
            </div>
        );
    };

    const renderScheduleGrid = () => {
        if (scheduleLoading) return <div className="loading-spinner"><Loader2 className="spin" /> Generating schedules...</div>;

        const DAYS_PER_VIEW = 28;
        const startIdx = viewMonth * DAYS_PER_VIEW;

        // Dynamic Date Logic
        // Calculate consecutive dates based on Today + viewMonth offset.
        // We assume start of "current month" is the baseline for viewMonth=0?
        // Or simply: Schedule has a start date. We should align with that. 
        // If schedule is empty, fallback to today.

        // Find the earliest date in schedule to anchor the view
        let anchorDate = new Date();
        anchorDate.setDate(1); // Default to 1st of current month

        if (schedule.length > 0) {
            // Find min date
            const dates = schedule.map(s => s.date).sort();
            if (dates.length > 0) anchorDate = new Date(dates[0]);
        }

        // Calculate start date for this view
        const viewStartDate = new Date(anchorDate);
        viewStartDate.setDate(viewStartDate.getDate() + (viewMonth * DAYS_PER_VIEW));

        // Generate consecutive dates
        const viewDates = [];
        for (let i = 0; i < DAYS_PER_VIEW; i++) {
            const d = new Date(viewStartDate);
            d.setDate(d.getDate() + i);
            viewDates.push(d.toISOString().split('T')[0]);
        }

        let currentMonthLabel = "Loading...";
        let currentYearLabel = "";

        if (viewDates.length > 0) {
            const midDate = new Date(viewDates[Math.floor(viewDates.length / 2)]);
            currentMonthLabel = midDate.toLocaleDateString('en-US', { month: 'long' });
            currentYearLabel = midDate.getFullYear();
        }

        // RenderNurseCalendar removed - using global NurseCalendarView


        return (
            <div className="schedule-view-container fade-in">
                {/* UPPER AREA: Sidebar + Calendar/Table */}
                <div className="schedule-upper-area">
                    {/* SIDEBAR */}
                    <aside className="nurse-sidebar">
                        <div className="sidebar-header">
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <input placeholder="Search nurse..." style={{ width: '100%', padding: '0.6rem' }} />
                            </div>
                        </div>
                        <div className="nurse-list">
                            {nurses.map(nurse => {
                                const role = nurse.id <= 20 ? "Night" : "Day";
                                const isSelected = selectedNurseId === nurse.id;
                                return (
                                    <div
                                        key={nurse.id}
                                        className={`nurse-item ${isSelected ? 'selected' : ''}`}
                                        onClick={() => setSelectedNurseId(nurse.id)}
                                    >
                                        <div className="nurse-avatar">{nurse.name.substring(0, 2).toUpperCase()}</div>
                                        <div className="nurse-info-col">
                                            <span className="nurse-name">{nurse.name}</span>
                                            <span className={`nurse-role-badge ${role === 'Night' ? 'night' : 'day'}`}>
                                                {role === 'Night' ? '🌙 Night Shift' : '☀️ Day Shift'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </aside>

                    {/* MAIN CONTENT AREA (Switches between Table and Calendar) */}
                    <main className="planilla-main">
                        {selectedNurseId ? (
                            <NurseCalendarView
                                nurseId={selectedNurseId}
                                nurses={nurses}
                                viewDates={viewDates}
                                schedule={schedule}
                                onBack={() => setSelectedNurseId(null)}
                                currentMonthLabel={currentMonthLabel}
                                currentYearLabel={currentYearLabel}
                            />
                        ) : (
                            <>
                                <div className="schedule-toolbar" style={{ borderBottom: '1px solid #f1f5f9', padding: '0.75rem 1rem' }}>
                                    <div className="schedule-controls">
                                        <button disabled={viewMonth === 0} onClick={() => setViewMonth(viewMonth - 1)}>◀</button>
                                        <h3 style={{ textTransform: 'capitalize' }}>
                                            {currentMonthLabel} {currentYearLabel}
                                        </h3>
                                        <button disabled={viewMonth === 2} onClick={() => setViewMonth(viewMonth + 1)}>▶</button>
                                    </div>
                                    <div className="schedule-actions">
                                        <button className="btn-secondary" onClick={downloadScheduleCSV} title="Download CSV">
                                            <Download size={16} /> Export
                                        </button>
                                        <button className="btn-highlight" onClick={() => alert("AI Analysis: Distribution is optimal.")}>
                                            <CheckCircle2 size={16} /> Validate
                                        </button>
                                    </div>
                                </div>

                                <div className="table-wrapper">
                                    <table className="schedule-table">
                                        <thead>
                                            <tr>
                                                <th style={{ minWidth: '180px', textAlign: 'left', paddingLeft: '1rem' }}>Nurse</th>
                                                {viewDates.map(d => {
                                                    const dateObj = new Date(d);
                                                    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                                                    const dayNum = dateObj.getDate();
                                                    return <th key={d} className={dayName === 'Sat' || dayName === 'Sun' ? 'weekend' : ''}>
                                                        <div className="th-day">{dayName}</div>
                                                        <div className="th-num">{dayNum}</div>
                                                    </th>;
                                                })}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {nurses.map(nurse => {
                                                if (selectedNurseId && selectedNurseId !== nurse.id) return null;

                                                return (
                                                    <tr key={nurse.id} onClick={() => setSelectedNurseId(nurse.id)} style={{ cursor: 'pointer' }}>
                                                        <td className="fixed-col" style={{ textAlign: 'left', paddingLeft: '1rem' }}>
                                                            <strong>{nurse.name}</strong>
                                                            <div className="nurse-role">{nurse.id <= 20 ? '🌙 Night Rot.' : '☀️ Day Shift'}</div>
                                                        </td>
                                                        {viewDates.map(dateStr => {
                                                            const entry = schedule.find(s => s.nurse_id === nurse.id && s.date === dateStr);
                                                            if (!entry) return <td key={dateStr} className="cell-empty"></td>;
                                                            const shortShift = entry.shift === 'Morning' ? 'M' : entry.shift === 'Afternoon' ? 'A' : 'N';
                                                            return (
                                                                <td key={dateStr} className="cell-shift" style={{ backgroundColor: entry.color, color: 'white', fontWeight: 'bold' }}>
                                                                    {shortShift}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </main>
                </div>

                {/* BOTTOM AREA: Chatbot */}
                <PlanillaChat backendUrl={BACKEND_URL} selectedModel={selectedModel} />
            </div>
        );
    };


    return (
        <div className="flex flex-col h-screen overflow-hidden bg-[#F5F6F7] dark:bg-background-dark text-[#111418] font-sans">
            {/* Header */}
            <header className="h-[72px] bg-white border-b border-[#dbe0e6] flex items-center justify-between px-6 shrink-0 z-20">
                <div className="flex items-center gap-6">
                    <div className="flex items-center justify-center">
                        {/* Logo SVG Vectorial DELL */}
                        <svg role="img" viewBox="3 9 19 6" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto fill-[#007db8] -mt-1">
                            <path d="M17.963 14.6V9.324h1.222v4.204h2.14v1.07h-3.362zm-9.784-3.288l2.98-2.292c.281.228.56.458.841.687l-2.827 2.14.611.535 2.827-2.216c.281.228.56.458.841.688a295.83 295.83 0 0 1-2.827 2.216l.61.536 2.83-2.295-.001-1.986h1.223v4.204h2.216v1.07h-3.362v-1.987c-.995.763-1.987 1.529-2.981 2.292l-2.981-2.292c-.144.729-.653 1.36-1.312 1.694-.285.147-.597.24-.915.276-.183.022-.367.017-.551.017H3.516V9.325H5.69a2.544 2.544 0 0 1 1.563.557c.454.36.778.872.927 1.43m-3.516-.917v3.21l.953-.001a1.377 1.377 0 0 0 1.036-.523 1.74 1.74 0 0 0 .182-1.889 1.494 1.494 0 0 0-.976-.766c-.166-.04-.338-.03-.507-.032h-.688z" />
                        </svg>
                        <span className="text-[#007db8] font-sans text-xl tracking-tight ml-[2px] font-normal" style={{ letterSpacing: "-0.5px" }}>Technologies</span>
                    </div>
                    <div className="flex flex-col ml-4 border-l border-slate-200 pl-4 w-64 shrink-0">
                        <h1 className="text-[#364356] text-[22px] font-outfit tracking-widest leading-none font-medium mt-1 uppercase">AI HEALTHCARE ASSISTANT</h1>
                    </div>
                </div>
                <div className="flex items-center gap-4 flex-1 max-w-2xl mx-12">
                    <div className="relative w-full group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-2xl group-focus-within:text-primary transition-colors">search</span>
                        <input className="w-full bg-[#f0f2f4] border-none rounded-xl pl-12 pr-6 py-3 text-base focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none h-12" placeholder="Search patients, studies, or reports..." type="text" />
                    </div>
                </div>
                <div className="flex items-center gap-6 shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-[11px] font-bold text-[#617289] uppercase tracking-wider">PACS Online</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="size-10 flex items-center justify-center rounded-lg bg-[#f0f2f4] text-gray-600 hover:bg-gray-200 transition-colors relative">
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                        <button onClick={fetchInitData} className="px-4 h-10 bg-[#f0f2f4] text-[#111418] text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">sync</span>
                            Sync Data
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative">
                <aside className="w-72 bg-white border-r border-[#dbe0e6] flex flex-col justify-between p-6 shrink-0 shadow-sm z-10">
                    <div className="flex flex-col gap-1 mt-2">
                        <nav className="flex flex-col gap-1">
                            <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left transition-colors ${activeTab === 'dashboard' ? 'sidebar-item-active font-semibold' : 'text-[#617289] hover:bg-gray-50 font-semibold'}`}>
                                <span className="material-symbols-outlined">dashboard</span>
                                <span className="text-sm">Dashboard</span>
                            </button>
                            <button onClick={() => setActiveTab('radiology')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left transition-colors ${activeTab === 'radiology' ? 'sidebar-item-active font-semibold' : 'text-[#617289] hover:bg-gray-50 font-semibold'}`}>
                                <span className="material-symbols-outlined">radiology</span>
                                <span className="text-sm">Radiology</span>
                            </button>
                            <button onClick={() => setActiveTab('triage')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left transition-colors ${activeTab === 'triage' ? 'sidebar-item-active font-semibold' : 'text-[#617289] hover:bg-gray-50 font-semibold'}`}>
                                <span className="material-symbols-outlined">medical_services</span>
                                <span className="text-sm">Triage</span>
                            </button>
                            <button onClick={() => setActiveTab('patients')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left transition-colors ${activeTab === 'patients' ? 'sidebar-item-active font-semibold' : 'text-[#617289] hover:bg-gray-50 font-semibold'}`}>
                                <span className="material-symbols-outlined">group</span>
                                <span className="text-sm">Patients</span>
                            </button>
                        </nav>
                    </div>
                    <div className="flex flex-col gap-4">
                        <button className="flex items-center justify-center gap-2 w-full bg-primary text-white py-3 rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
                            <span className="material-symbols-outlined text-lg">add_circle</span>
                            New Scan
                        </button>
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 border border-gray-100">
                            <div className="size-9 rounded-full bg-[#007db8] flex items-center justify-center text-white font-bold text-xs">GB</div>
                            <div className="flex flex-col overflow-hidden">
                                <p className="text-xs font-bold truncate">Dr. GB10</p>
                                <p className="text-[10px] text-[#617289] font-medium">AI Agent</p>
                            </div>
                            <span className="material-symbols-outlined text-gray-400 text-sm ml-auto cursor-pointer hover:text-primary transition-colors">settings</span>
                        </div>
                    </div>
                </aside>

                <main className="flex-1 flex flex-col overflow-hidden relative bg-[#F5F6F7]">
                    {/* Scrollable Dashboard Area */}
                    <div className="flex-1 overflow-y-auto bg-[#F5F6F7] relative w-full">
                        <div className="p-12 space-y-10 max-w-[1800px] w-full mx-auto pb-44">
                            {activeTab === 'dashboard' && (
                                <div className="fade-in space-y-8">
                                    {/* Top Section: Welcome & Stats */}
                                    <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                                        <div>
                                            <nav className="flex items-center gap-2 text-[13px] font-bold text-[#617289] uppercase tracking-widest mb-3">
                                                <span>Home</span>
                                                <span className="material-symbols-outlined text-sm">chevron_right</span>
                                                <span className="text-primary font-outfit">Radiology Overview</span>
                                            </nav>
                                            <h2 className="text-4xl font-extrabold text-[#111418] tracking-tight font-outfit">Radiology Overview</h2>
                                            <p className="text-[#617289] mt-2 text-base">Efficiency metrics and study throughput for today.</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                                            <div className="glass-panel p-6 rounded-[2rem] border border-white/60 shadow-sm hover:shadow-md transition-all group">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-[10px] font-extrabold text-[#617289] uppercase tracking-widest">Pending Review</p>
                                                    <div className="size-8 rounded-lg bg-blue-50 text-[#007db8] flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-lg">pending_actions</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-4xl font-extrabold font-mono text-[#111418] tracking-tighter">12</span>
                                                    <span className="text-xs font-bold text-green-600 font-mono bg-green-50 px-1.5 rounded">+5%</span>
                                                </div>
                                                <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full w-[65%] bg-[#007db8] rounded-full"></div>
                                                </div>
                                            </div>
                                            <div className="glass-panel p-6 rounded-[2rem] border border-white/60 shadow-sm hover:shadow-md transition-all">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-[10px] font-extrabold text-[#617289] uppercase tracking-widest">Completed</p>
                                                    <div className="size-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-lg">check_circle</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-4xl font-extrabold font-mono text-[#111418] tracking-tighter">48</span>
                                                    <span className="text-xs font-bold text-red-500 font-mono bg-red-50 px-1.5 rounded">-2%</span>
                                                </div>
                                                <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full w-[85%] bg-green-500 rounded-full"></div>
                                                </div>
                                            </div>
                                            <div className="glass-panel p-6 rounded-[2rem] border border-white/60 shadow-sm hover:shadow-md transition-all">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-[10px] font-extrabold text-[#617289] uppercase tracking-widest">Urgent Cases</p>
                                                    <div className="size-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center animate-pulse">
                                                        <span className="material-symbols-outlined text-lg">emergency</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-4xl font-extrabold font-mono text-red-600 tracking-tighter">03</span>
                                                    <span className="text-xs font-bold text-[#007db8] uppercase tracking-widest ml-2">Active</span>
                                                </div>
                                                <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full w-[30%] bg-red-500 rounded-full"></div>
                                                </div>
                                            </div>
                                            <div className="glass-panel p-6 rounded-[2rem] border border-white/60 shadow-sm hover:shadow-md transition-all">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-[10px] font-extrabold text-[#617289] uppercase tracking-widest">Avg Turnaround</p>
                                                    <div className="size-8 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-lg">schedule</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-4xl font-extrabold font-mono text-[#111418] tracking-tighter">14<span className="text-xl">m</span></span>
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2">Stable</span>
                                                </div>
                                                <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full w-[45%] bg-yellow-500 rounded-full"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Main Grid: Studies & Diagnostic Tools */}
                                    <div className="grid grid-cols-12 gap-8">
                                        {/* Recent Studies (Left 7 Columns) */}
                                        <div className="col-span-12 lg:col-span-12 xl:col-span-7 glass-panel p-10 rounded-[2.5rem] border border-white/60 space-y-8 shadow-sm">
                                            <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                                                <h3 className="text-2xl font-extrabold text-[#111418] flex items-center gap-3 font-outfit">
                                                    <div className="size-12 rounded-2xl bg-blue-50 text-[#007db8] flex items-center justify-center shadow-inner">
                                                        <span className="material-symbols-outlined text-2xl">analytics</span>
                                                    </div>
                                                    Recent Imaging Studies
                                                </h3>
                                                <button className="text-[10px] font-extrabold text-white bg-[#007db8] hover:bg-[#005a8a] transition-all uppercase tracking-widest px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/10">View Analysis Hub</button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                {/* Study Card 1 */}
                                                <div className="bg-gray-50/50 rounded-2xl border border-gray-200/80 overflow-hidden hover:border-[#007db8]/50 transition-all group shadow-sm">
                                                    <div className="h-40 bg-gray-200 relative overflow-hidden">
                                                        <div className="absolute inset-0 bg-cover bg-center opacity-90 group-hover:scale-105 transition-transform duration-500" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCx1W5NNnj4NLd2_K8K5I4yquw2Vm-oz6ssV7ostNjq2JBvOoswyRWGts30_tRwuwn8dYs-z6kUARNzOSZL81aJn3nsayVwteoHxTYauT7HgaIab0r0JlH2iEFQ8LD8ulJfRLGPV1wMkvEQrTqGoEyBWEFkTz1S9c0ccNb_oHqKPpLhAubbHAFiDTy5zNxjBMUBift_dw6Z7Kgi_6nbj0ITX9qsRLAtBsfdjEitc7D3J9kJCogyM-jQJnlzgVr1X5b_0tMdwki2Swk')" }}></div>
                                                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-white/90 text-[#111418] border border-gray-200/50 shadow-sm text-[9px] font-extrabold uppercase tracking-widest backdrop-blur-md">MRI • Head</div>
                                                        <div className="absolute top-3 right-3 px-2 py-1 rounded text-[9px] font-extrabold uppercase tracking-widest bg-red-100 text-red-700 border border-red-200 shadow-sm">Urgent</div>
                                                    </div>
                                                    <div className="p-4">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <h4 className="font-bold text-[#111418] text-[14px]">Arthur Morgan</h4>
                                                                <p className="text-[11px] text-[#617289] font-medium">ID: #8821-XP</p>
                                                            </div>
                                                            <span className="text-[9px] font-extrabold text-[#617289] uppercase tracking-wider">10m ago</span>
                                                        </div>
                                                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200/80">
                                                            <div className="flex items-center gap-2">
                                                                <div className="size-6 rounded-full bg-gray-200 flex items-center justify-center">
                                                                    <span className="material-symbols-outlined text-[13px] text-gray-500">person</span>
                                                                </div>
                                                                <span className="text-[11px] font-bold text-[#617289]">Dr. Miller</span>
                                                            </div>
                                                            <button onClick={() => setActiveTab('radiology')} className="text-[10px] font-extrabold uppercase tracking-widest text-[#007db8] px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 hover:bg-[#007db8] hover:text-white transition-colors cursor-pointer relative z-10 w-auto">Review</button>
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Study Card 2 */}
                                                <div className="bg-gray-50/50 rounded-2xl border border-gray-200/80 overflow-hidden hover:border-[#007db8]/50 transition-all group shadow-sm">
                                                    <div className="h-40 bg-gray-200 relative overflow-hidden">
                                                        <div className="absolute inset-0 bg-cover bg-center opacity-90 group-hover:scale-105 transition-transform duration-500" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuClCB9sFQGr6u_WhW0yWSxxEzNenMA6yf3EwZq1J_XwbolVwmZiTaP0VXefmJ31K8rYDjkr2DN0Nz3QxBHT7lWArT2HmQMjqzGzYIocfI__w55pPhioPeVdecUjqn-gmbtIb0YPUtyRvanuJYJI0wf15sHILrXdac_86qja5ca8xsYt576Nga17ebdvTjbMBRM_kVvIN-Zbk4ClcmU7gs-q59MomxzucQTM8wfpfufAOhTwwc0aTAlWWeoUlUHYDBZf_lNF2RNZaVs')" }}></div>
                                                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-white/90 text-[#111418] border border-gray-200/50 shadow-sm text-[9px] font-extrabold uppercase tracking-widest backdrop-blur-md">X-Ray • Chest</div>
                                                        <div className="absolute top-3 right-3 px-2 py-1 rounded text-[9px] font-extrabold uppercase tracking-widest bg-orange-100 text-orange-700 border border-orange-200 shadow-sm">Pending</div>
                                                    </div>
                                                    <div className="p-4">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <h4 className="font-bold text-[#111418] text-[14px]">Sarah Jenkins</h4>
                                                                <p className="text-[11px] text-[#617289] font-medium">ID: #1105-GT</p>
                                                            </div>
                                                            <span className="text-[9px] font-extrabold text-[#617289] uppercase tracking-wider">25m ago</span>
                                                        </div>
                                                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200/80">
                                                            <div className="flex items-center gap-2">
                                                                <div className="size-6 rounded-full bg-gray-200 flex items-center justify-center">
                                                                    <span className="material-symbols-outlined text-[13px] text-gray-500">person</span>
                                                                </div>
                                                                <span className="text-[11px] font-bold text-[#617289]">Dr. GB10</span>
                                                            </div>
                                                            <button onClick={() => setActiveTab('radiology')} className="text-[10px] font-extrabold uppercase tracking-widest text-[#007db8] px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 hover:bg-[#007db8] hover:text-white transition-colors cursor-pointer relative z-10 w-auto">Review</button>
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Study Card 3 */}
                                                <div className="bg-gray-50/50 rounded-2xl border border-gray-200/80 overflow-hidden hover:border-[#007db8]/50 transition-all group shadow-sm">
                                                    <div className="h-40 bg-gray-200 relative overflow-hidden">
                                                        <div className="absolute inset-0 bg-cover bg-center opacity-90 group-hover:scale-105 transition-transform duration-500" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBFDW7FSOAS-UkZVxkBAqvsK0DVm5zqRzi4v_alNHocJibmCFeMr-WWh9iA6JjBH-oRI555O7NYVXyJFP0tGdMa2H4gfvaW84TvQqZXOkVf6tFNRbTXDsQzLIY8eE2qffEeQ-3ympx9RZxwxeoNAS5u1YHovPVSAiLwmGiKmPtKP_yOMhmIBjZMlnuSZdHXHJxR5lM6mnFj_n_SyGQ2eiYat1GEcAnZpkxDCkJLuSGbc-OupAwgghB0YJ4Rnhj7rsWZ3dP899zw6lg')" }}></div>
                                                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-white/90 text-[#111418] border border-gray-200/50 shadow-sm text-[9px] font-extrabold uppercase tracking-widest backdrop-blur-md">CT • Abdomen</div>
                                                        <div className="absolute top-3 right-3 px-2 py-1 rounded text-[9px] font-extrabold uppercase tracking-widest bg-green-100 text-green-700 border border-green-200 shadow-sm">Reviewed</div>
                                                    </div>
                                                    <div className="p-4">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <h4 className="font-bold text-[#111418] text-[14px]">John Doe</h4>
                                                                <p className="text-[11px] text-[#617289] font-medium">ID: #4432-RE</p>
                                                            </div>
                                                            <span className="text-[9px] font-extrabold text-[#617289] uppercase tracking-wider">1h ago</span>
                                                        </div>
                                                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200/80">
                                                            <div className="flex items-center gap-2">
                                                                <div className="size-6 rounded-full bg-gray-200 flex items-center justify-center">
                                                                    <span className="material-symbols-outlined text-[13px] text-gray-500">person</span>
                                                                </div>
                                                                <span className="text-[11px] font-bold text-[#617289]">AI-Assistant Node</span>
                                                            </div>
                                                            <button onClick={() => setActiveTab('patients')} className="text-[10px] font-extrabold uppercase tracking-widest text-[#007db8] px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 hover:bg-[#007db8] hover:text-white transition-colors cursor-pointer relative z-10 w-auto">Medical Record</button>
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Study Card 4 */}
                                                <div className="bg-gray-50/50 rounded-2xl border border-gray-200/80 overflow-hidden hover:border-[#007db8]/50 transition-all group shadow-sm">
                                                    <div className="h-40 bg-gray-200 relative overflow-hidden">
                                                        <div className="absolute inset-0 bg-cover bg-center opacity-90 group-hover:scale-105 transition-transform duration-500" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1530497610245-94d3c16cda28?q=80&w=1000&auto=format&fit=crop')" }}></div>
                                                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-white/90 text-[#111418] border border-gray-200/50 shadow-sm text-[9px] font-extrabold uppercase tracking-widest backdrop-blur-md">X-Ray • Hand</div>
                                                        <div className="absolute top-3 right-3 px-2 py-1 rounded text-[9px] font-extrabold uppercase tracking-widest bg-orange-100 text-orange-700 border border-orange-200 shadow-sm">Pending</div>
                                                    </div>
                                                    <div className="p-4">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <h4 className="font-bold text-[#111418] text-[14px]">Emily Stone</h4>
                                                                <p className="text-[11px] text-[#617289] font-medium">ID: #9901-LQ</p>
                                                            </div>
                                                            <span className="text-[9px] font-extrabold text-[#617289] uppercase tracking-wider">2h ago</span>
                                                        </div>
                                                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200/80">
                                                            <div className="flex items-center gap-2">
                                                                <div className="size-6 rounded-full bg-gray-200 flex items-center justify-center">
                                                                    <span className="material-symbols-outlined text-[13px] text-gray-500">person</span>
                                                                </div>
                                                                <span className="text-[11px] font-bold text-[#617289]">Dr. Miller</span>
                                                            </div>
                                                            <button onClick={() => setActiveTab('radiology')} className="text-[10px] font-extrabold uppercase tracking-widest text-[#007db8] px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 hover:bg-[#007db8] hover:text-white transition-colors cursor-pointer relative z-10 w-auto">Review</button>
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Study Card 5 */}
                                                <div className="bg-gray-50/50 rounded-2xl border border-gray-200/80 overflow-hidden hover:border-[#007db8]/50 transition-all group shadow-sm">
                                                    <div className="h-40 bg-gray-200 relative overflow-hidden">
                                                        <div className="absolute inset-0 bg-cover bg-center opacity-90 group-hover:scale-105 transition-transform duration-500" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1559757175-5700dde675bc?q=80&w=1000&auto=format&fit=crop')" }}></div>
                                                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-white/90 text-[#111418] border border-gray-200/50 shadow-sm text-[9px] font-extrabold uppercase tracking-widest backdrop-blur-md">MRI • Brain</div>
                                                        <div className="absolute top-3 right-3 px-2 py-1 rounded text-[9px] font-extrabold uppercase tracking-widest bg-red-100 text-red-700 border border-red-200 shadow-sm">Urgent</div>
                                                    </div>
                                                    <div className="p-4">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <h4 className="font-bold text-[#111418] text-[14px]">Michael Chang</h4>
                                                                <p className="text-[11px] text-[#617289] font-medium">ID: #4021-XQ</p>
                                                            </div>
                                                            <span className="text-[9px] font-extrabold text-[#617289] uppercase tracking-wider">05m ago</span>
                                                        </div>
                                                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200/80">
                                                            <div className="flex items-center gap-2">
                                                                <div className="size-6 rounded-full bg-gray-200 flex items-center justify-center">
                                                                    <span className="material-symbols-outlined text-[13px] text-gray-500">person</span>
                                                                </div>
                                                                <span className="text-[11px] font-bold text-[#617289]">Dr. Wilson</span>
                                                            </div>
                                                            <button onClick={() => setActiveTab('radiology')} className="text-[10px] font-extrabold uppercase tracking-widest text-[#007db8] px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 hover:bg-[#007db8] hover:text-white transition-colors cursor-pointer relative z-10 w-auto">Review</button>
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Study Card 6 */}
                                                <div className="bg-gray-50/50 rounded-2xl border border-gray-200/80 overflow-hidden hover:border-[#007db8]/50 transition-all group shadow-sm">
                                                    <div className="h-40 bg-gray-200 relative overflow-hidden">
                                                        <div className="absolute inset-0 bg-cover bg-center opacity-90 group-hover:scale-105 transition-transform duration-500" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1599045118108-bf9954418b76?q=80&w=1000&auto=format&fit=crop')" }}></div>
                                                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-white/90 text-[#111418] border border-gray-200/50 shadow-sm text-[9px] font-extrabold uppercase tracking-widest backdrop-blur-md">X-Ray • Knee</div>
                                                        <div className="absolute top-3 right-3 px-2 py-1 rounded text-[9px] font-extrabold uppercase tracking-widest bg-green-100 text-green-700 border border-green-200 shadow-sm">Reviewed</div>
                                                    </div>
                                                    <div className="p-4">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <h4 className="font-bold text-[#111418] text-[14px]">Olivia Bennet</h4>
                                                                <p className="text-[11px] text-[#617289] font-medium">ID: #7721-OP</p>
                                                            </div>
                                                            <span className="text-[9px] font-extrabold text-[#617289] uppercase tracking-wider">3h ago</span>
                                                        </div>
                                                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200/80">
                                                            <div className="flex items-center gap-2">
                                                                <div className="size-6 rounded-full bg-gray-200 flex items-center justify-center">
                                                                    <span className="material-symbols-outlined text-[13px] text-gray-500">person</span>
                                                                </div>
                                                                <span className="text-[11px] font-bold text-[#617289]">Dr. Davis</span>
                                                            </div>
                                                            <button onClick={() => alert('Patient details module currently under construction.')} className="text-[10px] font-extrabold uppercase tracking-widest text-[#617289] px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 hover:bg-gray-200 transition-colors cursor-pointer relative z-10 w-auto">Details</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Sidebar Content (Triage Queue) */}
                                        <div className="col-span-12 lg:col-span-12 xl:col-span-5 space-y-8">
                                            {/* Performance Monitor (Reloj / Gauge Pattern) */}
                                            <div className="w-full bg-white/90 rounded-3xl border border-black/5 p-6 shadow-sm backdrop-blur-xl mb-4 animate-in fade-in slide-in-from-top-4 relative overflow-hidden group">
                                                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                                <div className="flex items-center justify-between mb-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-8 rounded-xl bg-[#007db8]/10 text-[#007db8] flex items-center justify-center border border-[#007db8]/10">
                                                            <span className="material-symbols-outlined text-[18px]">memory</span>
                                                        </div>
                                                        <div>
                                                            <h3 className="text-sm font-extrabold text-[#111418] uppercase tracking-wider font-outfit">GB10 STATUS</h3>
                                                            <p className="text-[10px] font-bold text-gray-400 tracking-wide mt-0.5 flex items-center gap-1">
                                                                <span className="size-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                                                Connected to Local Server
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] font-bold bg-[#007db8]/5 text-[#007db8] px-2.5 py-1 rounded-lg border border-[#007db8]/10 backdrop-blur-sm shadow-sm whitespace-nowrap">Live Telemetry</span>
                                                </div>

                                                <div className="flex items-end justify-between w-full h-full gap-8">

                                                    {/* GPU Gauge */}
                                                    <div className="flex flex-col items-center justify-end flex-1">
                                                        <div className="relative w-28 h-14 overflow-hidden flex justify-center">
                                                            <svg className="w-28 h-28 absolute top-0" viewBox="0 0 100 100">
                                                                {/* Background Arc */}
                                                                <path d="M 15 50 A 35 35 0 0 1 85 50" fill="none" stroke="#f3f4f6" strokeWidth="10" strokeLinecap="round" />
                                                                {/* Progress Arc (Circumference ~ 109.9) */}
                                                                <path d="M 15 50 A 35 35 0 0 1 85 50" fill="none" stroke="#ef4444" strokeWidth="10" strokeLinecap="round" strokeDasharray="109.95" strokeDashoffset={isNaN(hwStats.gpu) ? 109.95 : 109.95 - (hwStats.gpu / 100) * 109.95} className="transition-all duration-1000 ease-out drop-shadow-[0_2px_4px_rgba(239,68,68,0.3)]" />
                                                            </svg>
                                                            <div className="absolute bottom-0 w-full text-center flex flex-col items-center">
                                                                <span className="text-sm font-extrabold text-gray-800 tabular-nums">{hwStats.gpu}%</span>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">GPU Usage</span>
                                                    </div>

                                                    {/* MEM Gauge */}
                                                    <div className="flex flex-col items-center justify-end flex-1">
                                                        <div className="relative w-28 h-14 overflow-hidden flex justify-center">
                                                            <svg className="w-28 h-28 absolute top-0" viewBox="0 0 100 100">
                                                                <path d="M 15 50 A 35 35 0 0 1 85 50" fill="none" stroke="#f3f4f6" strokeWidth="10" strokeLinecap="round" />
                                                                <path d="M 15 50 A 35 35 0 0 1 85 50" fill="none" stroke="#f97316" strokeWidth="10" strokeLinecap="round" strokeDasharray="109.95" strokeDashoffset={isNaN(hwStats.mem) ? 109.95 : 109.95 - (hwStats.mem / 100) * 109.95} className="transition-all duration-1000 ease-out drop-shadow-[0_2px_4px_rgba(249,115,22,0.3)]" />
                                                            </svg>
                                                            <div className="absolute bottom-0 w-full text-center flex flex-col items-center">
                                                                <span className="text-sm font-extrabold text-gray-800 tabular-nums">{hwStats.mem}%</span>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Mem Usage</span>
                                                    </div>

                                                    {/* Throughput */}
                                                    <div className="border-l border-gray-100 pl-8 flex flex-col justify-end h-16 flex-[2]">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px] text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span> Model Throughput</span>
                                                        <div className="text-4xl font-mono uppercase font-extrabold text-gray-900 flex items-baseline gap-2">
                                                            {hwStats.throughput} <span className="text-[11px] font-sans text-gray-500 font-bold bg-gray-100 px-2 py-1 rounded-lg uppercase tracking-widest">tok/s</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <section className="space-y-6">
                                                <div className="flex justify-between items-center">
                                                    <h3 className="text-lg font-extrabold text-[#111418] uppercase tracking-wider font-outfit">Admission Queue</h3>
                                                    <button className="text-[10px] text-[#007db8] font-extrabold bg-blue-50 hover:bg-blue-100 transition-all rounded-lg px-4 py-2 uppercase tracking-widest border border-blue-100">Live Sync</button>
                                                </div>
                                                <div className="glass-panel rounded-[2rem] border border-white/60 shadow-sm overflow-hidden flex flex-col">
                                                    <div className="grid grid-cols-12 gap-2 p-4 bg-gray-50/80 border-b border-gray-200/50 text-[10px] uppercase font-extrabold text-[#617289] tracking-widest">
                                                        <div className="col-span-3">Urgency</div>
                                                        <div className="col-span-5">Patient Details</div>
                                                        <div className="col-span-4">Metrics</div>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <div className="grid grid-cols-12 gap-2 p-5 border-b border-gray-200/30 items-center hover:bg-white/60 transition-colors">
                                                            <div className="col-span-3"><span className="px-3 py-1 bg-red-50 text-red-600 border border-red-100 text-[10px] font-extrabold rounded-full uppercase tracking-widest flex items-center justify-center gap-1.5"><span className="size-2 rounded-full bg-red-500 animate-pulse"></span>Critical</span></div>
                                                            <div className="col-span-5"><p className="text-sm font-extrabold text-[#111418]">Marcus Thompson</p><p className="text-[11px] text-[#617289] font-bold uppercase tracking-wide mt-0.5">M • 64y • ER-9921</p></div>
                                                            <div className="col-span-4"><div className="flex flex-col gap-1 tracking-tighter"><span className="text-[11px] font-bold text-[#111418]">HR: <span className="font-mono text-red-600 text-xs">118</span></span><span className="text-[11px] font-bold text-[#111418]">WAIT: <span className="font-mono text-xs">02m</span></span></div></div>
                                                        </div>
                                                        <div className="grid grid-cols-12 gap-2 p-5 border-b border-gray-200/30 items-center hover:bg-white/60 transition-colors">
                                                            <div className="col-span-3"><span className="px-3 py-1 bg-orange-50 text-orange-600 border border-orange-100 text-[10px] font-extrabold rounded-full uppercase tracking-widest flex items-center justify-center gap-1.5"><span className="size-2 rounded-full bg-orange-500"></span>Urgent</span></div>
                                                            <div className="col-span-5"><p className="text-sm font-extrabold text-[#111418]">Elena Rodriguez</p><p className="text-[11px] text-[#617289] font-bold uppercase tracking-wide mt-0.5">F • 29y • ER-9945</p></div>
                                                            <div className="col-span-4"><div className="flex flex-col gap-1 tracking-tighter"><span className="text-[11px] font-bold text-[#111418]">HR: <span className="font-mono text-xs">94</span></span><span className="text-[11px] font-bold text-[#111418]">WAIT: <span className="font-mono text-orange-600 text-xs">14m</span></span></div></div>
                                                        </div>
                                                        <div className="grid grid-cols-12 gap-2 p-5 border-b border-gray-200/30 items-center hover:bg-white/60 transition-colors">
                                                            <div className="col-span-3"><span className="px-3 py-1 bg-green-50 text-green-600 border border-green-100 text-[10px] font-extrabold rounded-full uppercase tracking-widest flex items-center justify-center gap-1.5"><span className="size-2 rounded-full bg-green-500"></span>Stable</span></div>
                                                            <div className="col-span-5"><p className="text-sm font-extrabold text-[#111418]">David Miller</p><p className="text-[11px] text-[#617289] font-bold uppercase tracking-wide mt-0.5">M • 42y • ER-9912</p></div>
                                                            <div className="col-span-4"><div className="flex flex-col gap-1 tracking-tighter"><span className="text-[11px] font-bold text-[#111418]">HR: <span className="font-mono text-xs">72</span></span><span className="text-[11px] font-bold text-[#111418]">WAIT: <span className="font-mono text-xs">32m</span></span></div></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </section>

                                            {/* Daily Schedule - Wait Rooms */}
                                            <section className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <h3 className="text-sm font-bold text-[#111418] uppercase tracking-wider font-outfit">Waiting Rooms / Appointments</h3>
                                                    <button className="text-xs text-[#007db8] font-bold">Today</button>
                                                </div>
                                                <div className="bg-white rounded-xl border border-gray-200/80 p-5 space-y-4 shadow-sm">
                                                    <div className="flex gap-4">
                                                        <div className="flex flex-col items-center shrink-0 w-10">
                                                            <p className="text-xs font-bold text-[#111418]">09:00</p>
                                                            <div className="w-[2px] h-full bg-gray-100 my-1"></div>
                                                        </div>
                                                        <div className="flex-1 pb-4">
                                                            <div className="bg-blue-50 border-l-4 border-[#007db8] p-3 rounded-r-lg shadow-sm">
                                                                <p className="text-xs font-bold text-[#007db8]">MRI Screening</p>
                                                                <p className="text-[10px] font-medium text-[#617289]">Robert Pattinson • Room 302</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-4">
                                                        <div className="flex flex-col items-center shrink-0 w-10">
                                                            <p className="text-xs font-bold text-[#111418]">10:30</p>
                                                            <div className="w-[2px] h-full bg-gray-100 my-1"></div>
                                                        </div>
                                                        <div className="flex-1 pb-4">
                                                            <div className="bg-gray-50 border-l-4 border-gray-300 p-3 rounded-r-lg hover:border-gray-400 transition-colors cursor-pointer">
                                                                <p className="text-xs font-bold text-gray-800">Routine X-Ray</p>
                                                                <p className="text-[10px] font-medium text-[#617289]">Maria Garcia • Room 105</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-4">
                                                        <div className="flex flex-col items-center shrink-0 w-10">
                                                            <p className="text-xs font-bold text-[#111418]">11:15</p>
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="bg-gray-50 border-l-4 border-gray-300 p-3 rounded-r-lg hover:border-gray-400 transition-colors cursor-pointer">
                                                                <p className="text-xs font-bold text-gray-800">CT Follow-up</p>
                                                                <p className="text-[10px] font-medium text-[#617289]">David Chen • Room 401</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </section>

                                            {/* Specialists On-Call */}
                                            <section className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <h3 className="text-sm font-bold text-[#111418] uppercase tracking-wider font-outfit">Active Specialists</h3>
                                                    <button className="text-[11px] text-[#007db8] bg-blue-50 hover:bg-blue-100 transition-colors shadow-sm rounded-lg px-3 py-1.5 font-bold flex items-center gap-1 border border-blue-100">Live</button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200/80 shadow-sm hover:border-[#007db8]/50 transition-colors cursor-pointer group">
                                                        <div className="relative">
                                                            <img src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=100&auto=format&fit=crop" alt="Dr. Martinez" className="w-10 h-10 rounded-full object-cover group-hover:scale-105 transition-transform" />
                                                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xs font-bold text-[#111418]">Dr. Martinez</h4>
                                                            <p className="text-[10px] font-extrabold text-[#007db8] uppercase tracking-wider">Neurology</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200/80 shadow-sm hover:border-[#007db8]/50 transition-colors cursor-pointer group">
                                                        <div className="relative">
                                                            <img src="https://images.unsplash.com/photo-1594824436998-dd4b80b7b13a?q=80&w=100&auto=format&fit=crop" alt="Dr. Patel" className="w-10 h-10 rounded-full object-cover group-hover:scale-105 transition-transform" />
                                                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xs font-bold text-[#111418]">Dr. Patel</h4>
                                                            <p className="text-[10px] font-extrabold text-[#007db8] uppercase tracking-wider">Radiology</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200/80 shadow-sm hover:border-[#007db8]/50 transition-colors cursor-pointer group">
                                                        <div className="relative">
                                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                                                                <span className="material-symbols-outlined text-blue-600">smart_toy</span>
                                                            </div>
                                                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-purple-500 border-2 border-white rounded-full animate-pulse"></span>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xs font-bold text-[#111418]">AI Llama-3</h4>
                                                            <p className="text-[10px] font-extrabold text-purple-600 uppercase tracking-wider">Inference</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200/80 shadow-sm hover:border-[#007db8]/50 transition-colors cursor-pointer group">
                                                        <div className="relative">
                                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                                                                <span className="material-symbols-outlined text-gray-500">add</span>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xs font-bold text-gray-500">Request</h4>
                                                            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Consult</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </section>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'radiology' && (
                                <div className="fade-in space-y-10 max-w-[1800px] mx-auto">
                                    {/* Page Title - Outside dark container */}
                                    <section className="flex items-center gap-6">
                                        <div className="size-16 rounded-[1.5rem] bg-blue-50 text-[#007db8] flex items-center justify-center shadow-sm">
                                            <span className="material-symbols-outlined text-4xl">radiology</span>
                                        </div>
                                        <div>
                                            <h2 className="text-4xl font-extrabold text-[#111418] tracking-tight font-outfit">AI Radiology Analysis</h2>
                                            <p className="text-base font-medium text-[#617289] mt-1"><strong>Dell AI Healthcare Assistant</strong> • Powered by <strong>GB10</strong></p>
                                        </div>
                                    </section>

                                    {/* Radiology Sub-Tabs Navigation */}
                                    <div className="flex items-center gap-10 border-b border-gray-100 mt-2">
                                        <button
                                            onClick={() => { setActiveRadiologySubTab('xray'); setSelectedEngine('xray'); setResult(null); setFile(null); setPreview(null); }}
                                            className={`pb-4 text-[11px] font-extrabold tracking-[0.2em] uppercase transition-all flex items-center gap-2 ${activeRadiologySubTab === 'xray' ? 'text-[#007db8] border-b-2 border-[#007db8]' : 'text-slate-400 hover:text-slate-600 border-b-2 border-transparent'}`}
                                        >
                                            <span className="material-symbols-outlined text-[18px]">chest</span>
                                            Chest X-Ray
                                        </button>
                                        <button
                                            onClick={() => { setActiveRadiologySubTab('ct'); setSelectedEngine('ct_totalseg'); setResult(null); setFile(null); setPreview(null); }}
                                            className={`pb-4 text-[11px] font-extrabold tracking-[0.2em] uppercase transition-all flex items-center gap-2 ${activeRadiologySubTab === 'ct' ? 'text-[#007db8] border-b-2 border-[#007db8]' : 'text-slate-400 hover:text-slate-600 border-b-2 border-transparent'}`}
                                        >
                                            <span className="material-symbols-outlined text-[18px]">body_system</span>
                                            Body CT Scan
                                        </button>
                                        <button
                                            onClick={() => { setActiveRadiologySubTab('mri'); setSelectedEngine('mri_brats'); setResult(null); setFile(null); setPreview(null); }}
                                            className={`pb-4 text-[11px] font-extrabold tracking-[0.2em] uppercase transition-all flex items-center gap-2 ${activeRadiologySubTab === 'mri' ? 'text-[#007db8] border-b-2 border-[#007db8]' : 'text-slate-400 hover:text-slate-600 border-b-2 border-transparent'}`}
                                        >
                                            <span className="material-symbols-outlined text-[18px]">psychology</span>
                                            Brain MRI
                                        </button>
                                    </div>

                                    {/* Dark container - starts with controls */}
                                    {/* Neural Engine Control Bar - Redesigned to Light Glassmorphism */}
                                    <div className="glass-panel rounded-2xl px-8 py-4 flex flex-wrap items-center justify-between gap-6 shadow-sm border border-white/60">
                                        <div className="flex items-center gap-8 overflow-x-auto pb-1 sm:pb-0 flex-1">
                                            {/* Server Node Selection */}
                                            <div className="flex flex-col gap-1 min-w-[160px]">
                                                <label className="text-[10px] uppercase tracking-wider text-[#617289] font-bold font-outfit">Server Node</label>
                                                <div className="relative group">
                                                    <div className="flex items-center gap-2 text-slate-800 font-bold text-sm transition-colors">
                                                        <span className="material-symbols-outlined text-gray-400 group-hover:text-[#007db8] text-[20px] transition-colors">dns</span>
                                                        <div className="relative flex-1">
                                                            <select
                                                                value={selectedCredentialId}
                                                                onChange={handleCredentialChange}
                                                                className="bg-transparent border-none text-sm font-extrabold text-[#111418] focus:ring-0 outline-none cursor-pointer py-1.5 pl-0 pr-8 w-full truncate appearance-none font-outfit"
                                                                style={{ background: 'none' }}
                                                            >
                                                                {credentials.map(c => (
                                                                    <option key={c.id} value={c.id} className="text-slate-800 font-sans">{c.name}</option>
                                                                ))}
                                                                <option value="ADD_NEW">➕ Add Node</option>
                                                            </select>
                                                            <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 text-[20px] pointer-events-none group-hover:text-[#007db8] transition-colors">keyboard_arrow_down</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="w-px h-10 bg-gray-200"></div>

                                            {/* Report Model Selection */}
                                            <div className="flex flex-col gap-1 min-w-[180px]">
                                                <label className="text-[10px] uppercase tracking-wider text-[#617289] font-bold font-outfit">Report Model</label>
                                                <div className="relative group">
                                                    <div className="flex items-center gap-2 text-slate-800 font-bold text-sm transition-colors">
                                                        <span className="material-symbols-outlined text-gray-400 group-hover:text-[#007db8] text-[20px] transition-colors">psychology</span>
                                                        <div className="relative flex-1">
                                                            <select
                                                                value={selectedModel}
                                                                onChange={e => setSelectedModel(e.target.value)}
                                                                className="bg-transparent border-none text-sm font-extrabold text-[#111418] focus:ring-0 outline-none cursor-pointer py-1.5 pl-0 pr-8 w-full truncate appearance-none font-outfit"
                                                                style={{ background: 'none' }}
                                                            >
                                                                {models.map(mod => <option key={mod} value={mod} className="font-sans">{mod}</option>)}
                                                            </select>
                                                            <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 text-[20px] pointer-events-none group-hover:text-[#007db8] transition-colors">keyboard_arrow_down</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="w-px h-10 bg-gray-200"></div>

                                            {/* Vision Engine Selection */}
                                            <div className="flex flex-col gap-1 min-w-[160px]">
                                                <label className="text-[10px] uppercase tracking-wider text-[#617289] font-bold font-outfit">Vision Engine</label>
                                                <div className="relative group">
                                                    <div className="flex items-center gap-2 text-slate-800 font-bold text-sm transition-colors">
                                                        <span className="material-symbols-outlined text-gray-400 group-hover:text-[#007db8] text-[20px] transition-colors">visibility</span>
                                                        <div className="relative flex-1">
                                                            <select
                                                                value={selectedEngine}
                                                                onChange={e => setSelectedEngine(e.target.value)}
                                                                className="bg-transparent border-none text-sm font-extrabold text-[#111418] focus:ring-0 outline-none cursor-pointer py-1.5 pl-0 pr-8 w-full truncate appearance-none font-outfit"
                                                                style={{ background: 'none' }}
                                                            >
                                                                {activeRadiologySubTab === 'xray' && (
                                                                    <>
                                                                        <option value="xray" className="font-sans">XTraY (Specialized Chest)</option>
                                                                        <option value="yolo" className="font-sans">YOLO v11 (General)</option>
                                                                    </>
                                                                )}
                                                                {activeRadiologySubTab === 'ct' && (
                                                                    <option value="ct_totalseg" className="font-sans">TotalSegmentator AI (Full Body)</option>
                                                                )}
                                                                {activeRadiologySubTab === 'mri' && (
                                                                    <option value="mri_brats" className="font-sans">BraTS AI (Brain Tumor)</option>
                                                                )}
                                                            </select>
                                                            <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 text-[20px] pointer-events-none group-hover:text-[#007db8] transition-colors">keyboard_arrow_down</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleSubmit}
                                                disabled={!file || loading}
                                                className={`ml-auto h-12 px-8 font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md ${!file || loading ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed' : 'bg-[#007db8] text-white hover:bg-[#00608d] shadow-blue-500/20 shadow-lg'}`}
                                            >
                                                {loading ? (
                                                    <>
                                                        <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                                        <span className="tracking-wide text-xs">PROCESSING...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="material-symbols-outlined text-xl">play_circle</span>
                                                        <span className="tracking-wide text-xs">RUN ANALYSIS</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        <div className="flex flex-col gap-2 ml-4 shrink-0 min-w-[280px]">
                                            <div className="flex items-center justify-between px-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="size-1 rounded-full bg-green-500 animate-pulse"></span>
                                                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest font-outfit">GB10 Live Inference</span>
                                                </div>
                                                <span className="text-[8px] font-bold bg-[#007db8]/5 text-[#007db8] px-2 py-0.5 rounded border border-[#007db8]/10">Live Telemetry</span>
                                            </div>
                                            <div className="flex items-center gap-8 bg-white/40 rounded-xl px-8 py-3 border border-white/60 shadow-inner backdrop-blur-md">
                                                {/* GPU Gauge */}
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="relative w-16 h-8 overflow-hidden flex justify-center">
                                                        <svg className="w-16 h-16 absolute top-0" viewBox="0 0 100 100">
                                                            <path d="M 20 50 A 30 30 0 0 1 80 50" fill="none" stroke="#f3f4f6" strokeWidth="12" strokeLinecap="round" />
                                                            <path d="M 20 50 A 30 30 0 0 1 80 50" fill="none" stroke="#ef4444" strokeWidth="12" strokeLinecap="round" strokeDasharray="94.2" strokeDashoffset={isNaN(hwStats.gpu) ? 94.2 : 94.2 - (hwStats.gpu / 100) * 94.2} className="transition-all duration-1000 ease-out drop-shadow-[0_1px_2px_rgba(239,68,68,0.3)]" />
                                                        </svg>
                                                        <div className="absolute bottom-0 w-full text-center flex flex-col items-center">
                                                            <span className="text-[10px] font-extrabold text-[#111418] tabular-nums">{hwStats.gpu}%</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">GPU Load</span>
                                                </div>

                                                {/* MEM Gauge */}
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="relative w-16 h-8 overflow-hidden flex justify-center">
                                                        <svg className="w-16 h-16 absolute top-0" viewBox="0 0 100 100">
                                                            <path d="M 20 50 A 30 30 0 0 1 80 50" fill="none" stroke="#f3f4f6" strokeWidth="12" strokeLinecap="round" />
                                                            <path d="M 20 50 A 30 30 0 0 1 80 50" fill="none" stroke="#f97316" strokeWidth="12" strokeLinecap="round" strokeDasharray="94.2" strokeDashoffset={isNaN(hwStats.mem) ? 94.2 : 94.2 - (hwStats.mem / 100) * 94.2} className="transition-all duration-1000 ease-out drop-shadow-[0_1px_2px_rgba(249,115,22,0.3)]" />
                                                        </svg>
                                                        <div className="absolute bottom-0 w-full text-center flex flex-col items-center">
                                                            <span className="text-[10px] font-extrabold text-[#111418] tabular-nums">{hwStats.mem}%</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">Mem Usage</span>
                                                </div>

                                                <div className="w-px h-8 bg-gray-200"></div>

                                                {/* Throughput */}
                                                <div className="flex flex-col justify-center min-w-[80px]">
                                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 flex items-center gap-1">
                                                        <Zap className="size-2 text-yellow-500 fill-yellow-500" /> Throughput
                                                    </span>
                                                    <div className="text-xl font-mono uppercase font-extrabold text-[#111418] flex items-baseline gap-1">
                                                        {hwStats.throughput} <span className="text-[9px] font-sans text-[#007db8] font-bold uppercase tracking-widest">t/s</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Engine Info Bar */}
                                    <div className="flex items-center justify-between bg-white/80 rounded-xl px-4 py-2.5 border border-white/60 shadow-sm">
                                        {selectedEngine === 'xray' ? (
                                            <span className="flex items-center gap-2 text-[11px] font-bold text-[#007db8]">
                                                <span className="material-symbols-outlined text-[16px]">memory</span>
                                                XTraY Engine · Specialized Chest Radiography · DenseNet121 Cluster
                                            </span>
                                        ) : selectedEngine === 'ct_totalseg' ? (
                                            <span className="flex items-center gap-2 text-[11px] font-bold text-green-600">
                                                <span className="material-symbols-outlined text-[16px]">body_system</span>
                                                TotalSegmentator AI · 117 Anatomical Structures · 3D Voxel Segmentation
                                            </span>
                                        ) : selectedEngine === 'mri_brats' ? (
                                            <span className="flex items-center gap-2 text-[11px] font-bold text-purple-600">
                                                <span className="material-symbols-outlined text-[16px]">psychology</span>
                                                BraTS 2024 Engine · Brain Tumor Segmentation · Multi-Modal MRI Analytics
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2 text-[11px] font-bold text-amber-600">
                                                <span className="material-symbols-outlined text-[16px]">bolt</span>
                                                YOLO v11 Nano · 80 Generic Classes (COCO) · Real-time Scene Analysis
                                            </span>
                                        )}
                                        <button
                                            onClick={() => setShowCapabilities(true)}
                                            className="flex items-center gap-1.5 text-[11px] font-bold text-[#007db8] hover:text-blue-700 transition-colors bg-[#007db8]/10 hover:bg-[#007db8]/20 px-3 py-1.5 rounded-lg border border-[#007db8]/20"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">info</span>
                                            Model Capabilities
                                        </button>
                                    </div>

                                    {/* Patient Context Section */}
                                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-white/80 rounded-xl px-6 py-4 border border-white/60 shadow-sm">
                                        <div className="flex items-center gap-3 min-w-[220px] shrink-0">
                                            <span className="material-symbols-outlined text-[#007db8] text-xl">person_search</span>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] font-extrabold text-[#617289] uppercase tracking-widest font-outfit">Patient Context</label>
                                                <select
                                                    value={selectedPatient?.id || ""}
                                                    onChange={e => handlePatientSelect(e)}
                                                    className="bg-transparent border-none text-sm font-extrabold text-[#111418] focus:ring-0 outline-none cursor-pointer py-0.5 pl-0 pr-6 appearance-none font-outfit"
                                                    style={{ background: 'none' }}
                                                >
                                                    <option value="">No patient selected</option>
                                                    {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        {selectedPatient && (
                                            <div className="flex-1 flex items-start gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50 animate-in fade-in slide-in-from-left-4">
                                                <span className="material-symbols-outlined text-[#007db8] text-lg mt-0.5">medical_information</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[10px] font-extrabold text-[#007db8] uppercase tracking-widest">Medical History</span>
                                                        <span className="text-[9px] font-bold text-gray-400">{selectedPatient.age}y • {selectedPatient.sex}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-600 font-medium leading-relaxed line-clamp-2">{selectedPatient.history}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wide">Reason: {selectedPatient.reason}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Main Body: Upload Left + Results Right */}
                                    <div className="flex flex-col lg:flex-row gap-8 flex-1">

                                        {/* Panel Izquierdo: Carga */}
                                        <div className="flex-[5] flex flex-col justify-center">
                                            <div
                                                onClick={() => document.getElementById('file-upload').click()}
                                                className="glass-panel rounded-[2.5rem] h-full min-h-[500px] flex items-center justify-center p-12 text-center hover:border-[#007db8]/40 hover:bg-white/90 transition-all cursor-pointer group relative overflow-hidden shadow-lg border border-white/80"
                                            >
                                                <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                                                {preview ? (
                                                    <div className="relative inline-block animate-in zoom-in-95 duration-500 w-full h-full flex items-center justify-center">
                                                        <div className="bg-[#0a0c10] p-4 rounded-3xl shadow-2xl relative border border-white/5">
                                                            <img src={preview} className="max-h-[500px] object-contain rounded-2xl mx-auto shadow-inner" />
                                                            {/* AI Simulation Overlay (only for Xray) */}
                                                            {selectedEngine === 'xray' && result && (
                                                                <div className="absolute inset-4 pointer-events-none">
                                                                    <div className="absolute top-1/4 left-1/4 w-32 h-32 border-2 border-[#007db8] rounded-lg bg-[#007db8]/10 animate-pulse">
                                                                        <span className="absolute -top-6 left-0 text-[10px] font-extrabold text-[#007db8] bg-white px-2 py-0.5 rounded shadow-sm border border-[#007db8]/20">98% CONFIDENCE</span>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* CT Simulation Overlay */}
                                                            {selectedEngine === 'ct_totalseg' && result && (
                                                                <div className="absolute inset-4 pointer-events-none overflow-hidden rounded-2xl">
                                                                    <div className="absolute inset-0 border border-green-500/30 bg-green-500/5 backdrop-brightness-125"></div>
                                                                    <div className="absolute top-10 right-10 flex flex-col items-end gap-2">
                                                                        <span className="text-[9px] font-extrabold text-green-400 bg-black/60 px-2 py-1 rounded tracking-widest">VOXEL CLASSIFICATION</span>
                                                                        <div className="size-3 rounded-full bg-green-500 animate-ping"></div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* MRI Simulation Overlay */}
                                                            {selectedEngine === 'mri_brats' && result && (
                                                                <div className="absolute inset-4 pointer-events-none">
                                                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-purple-500/40 rounded-full bg-purple-500/10 animate-[pulse_4s_linear_infinite]">
                                                                        <div className="absolute inset-4 border-2 border-white/10 rounded-full animate-ping"></div>
                                                                    </div>
                                                                    <span className="absolute bottom-4 right-4 text-[9px] font-extrabold text-purple-400 bg-black/60 px-2 py-1 rounded tracking-widest uppercase">Tumor Analytics Active</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 glass-panel text-slate-800 px-6 py-3 rounded-full shadow-xl border border-white/80 flex items-center gap-3">
                                                            <span className="size-2.5 rounded-full bg-green-500 animate-pulse"></span>
                                                            <span className="text-xs font-extrabold uppercase tracking-widest">Diagnostic Context Active</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-8">
                                                        <div className="size-28 rounded-full bg-gray-50 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-50 transition-all border border-gray-100 group-hover:border-[#007db8]/30">
                                                            <span className="material-symbols-outlined text-6xl text-gray-300 group-hover:text-[#007db8]">upload_file</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-[#111418] font-bold text-lg tracking-tight font-outfit">Drag DICOM or PNG files here</p>
                                                            <p className="text-[#617289] font-bold text-sm uppercase tracking-widest mt-2">or click to browse your system</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Quick Samples Section */}
                                            {!preview && !loading && RADIOLOGY_SAMPLES[activeRadiologySubTab] && (
                                                <div className="mt-8 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                                    <p className="text-[10px] font-extrabold text-[#617289] uppercase tracking-widest flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                                                        Or try a curated sample
                                                    </p>
                                                    <div className="flex gap-4 flex-wrap justify-center">
                                                        {RADIOLOGY_SAMPLES[activeRadiologySubTab].map((sample, idx) => (
                                                            <button
                                                                key={idx}
                                                                onClick={(e) => { e.stopPropagation(); loadSampleImage(sample.url); }}
                                                                className="px-6 py-3 bg-white/60 backdrop-blur-md border border-white/80 rounded-2xl shadow-sm hover:shadow-md hover:border-[#007db8]/30 transition-all text-xs font-bold text-gray-700 flex items-center gap-3 active:scale-95 group"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px] text-[#007db8] group-hover:scale-110 transition-transform">image_search</span>
                                                                {sample.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Clear Action if preview is active */}
                                            {preview && !loading && !result && (
                                                <div className="mt-6 flex justify-center">
                                                    <button
                                                        onClick={() => { setFile(null); setPreview(null); setResult(null); }}
                                                        className="flex items-center gap-2 text-[10px] font-extrabold text-[#617289] hover:text-red-500 uppercase tracking-widest transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                                        Clear & Choose Another
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Panel Derecho: Resultados */}
                                        <div className="flex-[3] glass-panel rounded-[2.5rem] border border-white/60 p-10 flex flex-col relative overflow-hidden shadow-sm">

                                            {!result && !loading && (
                                                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
                                                    <div className="size-24 rounded-[2rem] bg-gray-50 flex items-center justify-center mb-8 shadow-inner border border-gray-100">
                                                        <span className="material-symbols-outlined text-6xl text-gray-300">smart_toy</span>
                                                    </div>
                                                    <h4 className="text-base font-extrabold text-[#111418] uppercase tracking-widest font-outfit">Awaiting Neural Inference</h4>
                                                    <p className="text-sm text-[#617289] font-medium leading-relaxed mt-4 uppercase tracking-wide max-w-[250px]">
                                                        Upload a radiological image and run analysis to view real-time findings processed by GB10.
                                                    </p>
                                                </div>
                                            )}

                                            {loading && (
                                                <div className="flex-1 flex flex-col items-center justify-center">
                                                    <div className="relative size-40 mb-10">
                                                        <div className="absolute inset-0 border-[8px] border-blue-50 border-t-[#007db8] rounded-full animate-spin" style={{ animationDuration: '2s' }}></div>
                                                        <div className="absolute inset-4 border-[8px] border-blue-50/50 border-b-[#007db8]/50 rounded-full animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <span className="material-symbols-outlined text-[#007db8] text-4xl animate-pulse">analytics</span>
                                                        </div>
                                                    </div>
                                                    <h4 className="text-sm font-extrabold text-[#007db8] uppercase tracking-widest mb-3 animate-pulse font-outfit">Running Analytical Models</h4>
                                                    <p className="text-[11px] text-[#617289] font-bold uppercase tracking-widest">Computing vectors and convolution layers...</p>
                                                </div>
                                            )}

                                            {result && (
                                                <div className="flex-1 space-y-8 flex flex-col animate-in fade-in slide-in-from-right-8 duration-700">
                                                    <div className="flex items-center justify-between border-b border-gray-100 pb-6 shrink-0">
                                                        <div className="flex items-center gap-3">
                                                            <span className="material-symbols-outlined text-[#007db8] text-2xl">check_circle</span>
                                                            <h4 className="text-lg font-extrabold text-[#111418] uppercase tracking-widest font-outfit">
                                                                {selectedEngine === 'xray' ? 'Thoracic Analysis Report' :
                                                                    selectedEngine === 'ct_totalseg' ? '3D Anatomical Mapping' :
                                                                        selectedEngine === 'mri_brats' ? 'Tumor Volumetric Summary' : 'AI Scene Analysis'}
                                                            </h4>
                                                        </div>
                                                        <span className="px-4 py-1.5 bg-blue-50 text-[#007db8] text-[10px] font-extrabold rounded-full uppercase tracking-widest border border-blue-100">GB10 Processed</span>
                                                    </div>

                                                    <div className="flex-1 overflow-y-auto pr-3 space-y-8 custom-scrollbar">
                                                        {/* XRay Pathologies Bar Chart Representation */}
                                                        {selectedEngine === 'xray' && result.pathologies && (
                                                            <div className="space-y-4">
                                                                <p className="text-[11px] font-bold text-[#617289] uppercase tracking-widest font-outfit mb-4">Top Pathological Predictions</p>
                                                                <div className="space-y-5">
                                                                    {Object.entries(result.pathologies)
                                                                        .sort(([, a], [, b]) => b - a)
                                                                        .slice(0, 5)
                                                                        .map(([name, prob]) => (
                                                                            <div key={name} className="space-y-2">
                                                                                <div className="flex justify-between items-center text-sm font-bold">
                                                                                    <span className="uppercase tracking-wide text-[11px] text-slate-700">{name}</span>
                                                                                    <span className={`font-mono ${prob > 0.5 ? 'text-red-500' : 'text-[#007db8]'}`}>{(prob * 100).toFixed(1)}%</span>
                                                                                </div>
                                                                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                                                                    <div
                                                                                        className={`h-full rounded-full transition-all duration-1000 ${prob > 0.5 ? 'bg-red-500' : 'bg-[#007db8]'}`}
                                                                                        style={{ width: `${prob * 100}%` }}
                                                                                    ></div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* CT Specialized Results (TotalSegmentator) */}
                                                        {selectedEngine === 'ct_totalseg' && result.pathologies && (
                                                            <div className="space-y-4">
                                                                <p className="text-[11px] font-bold text-[#617289] uppercase tracking-widest font-outfit mb-4 flex items-center gap-2">
                                                                    <span className="material-symbols-outlined text-[20px] text-[#007db8]">view_in_ar</span>
                                                                    Anatomical Segmentation (AI 3D)
                                                                </p>
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    {Object.entries(result.pathologies).map(([organ, prob]) => (
                                                                        <div key={organ} className="bg-[#007db8]/5 rounded-2xl p-4 border border-[#007db8]/10 flex flex-col gap-1 hover:bg-[#007db8]/10 transition-colors group">
                                                                            <span className="text-[10px] font-extrabold uppercase tracking-tight text-[#617289] group-hover:text-[#007db8] transition-colors">Organ</span>
                                                                            <span className="text-xs font-extrabold text-[#111418] uppercase tracking-widest">{organ}</span>
                                                                            <div className="mt-2 text-[10px] font-bold text-[#007db8] drop-shadow-sm flex items-center gap-1">
                                                                                <span className="size-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                                                                Segmented
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* MRI Specialized Results (BraTS Tumor Analysis) */}
                                                        {selectedEngine === 'mri_brats' && result.pathologies && (
                                                            <div className="space-y-4">
                                                                <p className="text-[11px] font-bold text-[#617289] uppercase tracking-widest font-outfit mb-4 flex items-center gap-2">
                                                                    <span className="material-symbols-outlined text-[20px] text-purple-600">biotech</span>
                                                                    BraTS Brain Tumor Analytics
                                                                </p>
                                                                <div className="space-y-4">
                                                                    {Object.entries(result.pathologies).map(([region, value]) => (
                                                                        <div key={region} className="bg-slate-900 rounded-3xl p-5 border border-white/10 relative overflow-hidden group shadow-2xl">
                                                                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[40px] rounded-full -mr-16 -mt-16 group-hover:bg-purple-500/20 transition-all duration-700"></div>
                                                                            <div className="flex justify-between items-center mb-3 relative z-10">
                                                                                <span className="text-[10px] font-extrabold text-blue-300 uppercase tracking-widest">{region}</span>
                                                                                <span className="text-lg font-mono text-white font-extrabold">
                                                                                    {typeof value === 'number' && region.includes('Volume') ? <span className="text-purple-400">{value} <small className="text-[10px] text-gray-400 uppercase">cm³</small></span> : `${(value * 100).toFixed(1)}%`}
                                                                                </span>
                                                                            </div>
                                                                            {typeof value === 'number' && !region.includes('Volume') && (
                                                                                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden relative z-10">
                                                                                    <div
                                                                                        className={`h-full bg-gradient-to-r ${region === 'Necrosis' ? 'from-red-500 to-orange-600' : 'from-blue-400 to-purple-600'} rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(168,85,247,0.4)]`}
                                                                                        style={{ width: `${value * 100}%` }}
                                                                                    ></div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Narrative Report */}
                                                        <div className="space-y-4">
                                                            <p className="text-[11px] font-bold text-[#617289] uppercase tracking-widest flex items-center gap-2 font-outfit">
                                                                <span className="material-symbols-outlined text-[18px]">edit_document</span>
                                                                Auto-Generated Clinical Summary
                                                            </p>
                                                            <div className="bg-blue-50/30 rounded-2xl p-6 border border-blue-100/50 relative group hover:bg-blue-50/50 transition-colors">
                                                                <div className="text-[14px] text-slate-700 leading-relaxed font-semibold markdown-body" style={{ whiteSpace: 'pre-wrap' }}>
                                                                    <ReactMarkdown>{result.clinical_report}</ReactMarkdown>
                                                                </div>
                                                                <button className="absolute top-4 right-4 text-gray-400 hover:text-[#007db8] opacity-0 group-hover:opacity-100 transition-all">
                                                                    <span className="material-symbols-outlined text-sm">content_copy</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button onClick={() => handleExportDocx(result)} className="w-full shrink-0 py-4 mt-auto bg-[#007db8] text-white rounded-2xl text-xs font-extrabold uppercase tracking-widest hover:bg-[#00608d] transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20">
                                                        <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
                                                        Export Official Report
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {/* Status Footer Bar - Moved inside Radiology for context */}
                                    <div className="bg-white/70 backdrop-blur-md border border-white/60 rounded-2xl p-4 flex flex-wrap gap-6 items-center justify-between text-xs shadow-sm relative mt-4">
                                        <div className="flex items-center gap-8">
                                            <div className="flex items-center gap-2">
                                                <span className="size-2 rounded-full bg-[#007db8] animate-pulse"></span>
                                                <span className="font-extrabold text-slate-800 uppercase tracking-widest text-[10px]">GB10 Node Active</span>
                                            </div>
                                            <div className="hidden md:flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[16px] text-gray-400">model_training</span>
                                                <span className="font-bold text-gray-500 uppercase tracking-widest text-[9px]">Model:</span>
                                                <span className="font-bold text-slate-700">{selectedModel}</span>
                                            </div>
                                            <div className="hidden md:flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[16px] text-gray-400">settings_suggest</span>
                                                <span className="font-bold text-gray-500 uppercase tracking-widest text-[9px]">Engine:</span>
                                                <span className="font-bold text-slate-700">
                                                    {selectedEngine === 'xray' ? 'XTraY Specialized Chest' :
                                                        selectedEngine === 'ct_totalseg' ? 'TotalSegmentator AI' :
                                                            selectedEngine === 'mri_brats' ? 'BraTS Brain Tumor' : 'YOLO v11'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 hidden lg:flex items-center gap-4">
                                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                                                <span className="material-symbols-outlined text-[14px] text-blue-500">speed</span>
                                                <span className="font-mono uppercase text-[9px] font-bold text-gray-400">Latency: <span className="text-slate-800">12ms</span></span>
                                            </div>
                                            <div className="flex items-center gap-2 bg-[#007db8]/5 px-3 py-1.5 rounded-full border border-[#007db8]/10">
                                                <span className="material-symbols-outlined text-[14px] text-[#007db8]">bolt</span>
                                                <span className="font-mono uppercase text-[9px] font-bold text-[#007db8]">Throughput: <span className="font-extrabold">{hwStats.throughput} T/S</span></span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 font-mono">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Batch: 1</span>
                                            <div className="text-[#007db8] font-extrabold text-[10px] tracking-widest border border-[#007db8]/20 bg-[#007db8]/5 px-2 py-0.5 rounded">READY</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'triage' && (
                                <div className="fade-in max-w-7xl mx-auto py-4">
                                    <div className="bg-white/90 rounded-[2.5rem] border border-black/5 shadow-sm backdrop-blur-xl overflow-hidden flex flex-col md:flex-row min-h-[650px]">
                                        {/* Triage Input Side */}
                                        <div className="w-full md:w-[450px] p-10 border-r border-[#dbe0e6] space-y-8">
                                            <div className="flex items-center gap-4 mb-2">
                                                <div className="size-14 rounded-2xl bg-blue-50 text-[#007db8] flex items-center justify-center shadow-inner">
                                                    <span className="material-symbols-outlined text-3xl">emergency</span>
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-extrabold text-gray-900 leading-tight font-outfit">Emergency Triage (Manchester)</h3>
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">AI Priority Diagnosis</p>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Waiting Room Patient</label>
                                                    <select
                                                        value={(selectedPatient?.id || "")}
                                                        onChange={e => handlePatientSelect(e)}
                                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-[#007db8]/30 focus:bg-white rounded-2xl p-4 text-sm font-bold text-gray-800 outline-none transition-all shadow-inner"
                                                    >
                                                        <option value="">Select patient...</option>
                                                        {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
                                                    </select>
                                                    {selectedPatient && (
                                                        <div className="mt-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 animate-in fade-in slide-in-from-top-4">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="material-symbols-outlined text-[#007db8] text-sm">medical_information</span>
                                                                <span className="text-[10px] font-extrabold text-[#007db8] uppercase tracking-widest">Medical History</span>
                                                                <span className="text-[9px] font-bold text-gray-400 ml-auto">{selectedPatient.age}y • {selectedPatient.sex}</span>
                                                            </div>
                                                            <p className="text-xs text-gray-600 font-medium leading-relaxed">{selectedPatient.history}</p>
                                                            <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-wide">Reason: {selectedPatient.reason}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100 flex flex-col gap-4">
                                                    <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">In-Situ Vital Signs</label>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <input type="text" value={triageVitals.hr} onChange={e => setTriageVitals({ ...triageVitals, hr: e.target.value })} placeholder="FC (bpm)" className="bg-white border border-gray-200 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-[#007db8]/30" />
                                                        <input type="text" value={triageVitals.temp} onChange={e => setTriageVitals({ ...triageVitals, temp: e.target.value })} placeholder="Temp (°C)" className="bg-white border border-gray-200 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-[#007db8]/30" />
                                                        <input type="text" value={triageVitals.bp_sys} onChange={e => setTriageVitals({ ...triageVitals, bp_sys: e.target.value })} placeholder="BP (SYS)" className="bg-white border border-gray-200 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-[#007db8]/30" />
                                                        <input type="text" value={triageVitals.spo2} onChange={e => setTriageVitals({ ...triageVitals, spo2: e.target.value })} placeholder="SpO2 (%)" className="bg-white border border-gray-200 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-[#007db8]/30" />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Reason / Symptoms (Natural Language)</label>
                                                    <textarea
                                                        value={triageReason}
                                                        onChange={e => setTriageReason(e.target.value)}
                                                        placeholder="E.g: Crushing chest pain, radiating to neck, sudden onset 20 min ago..."
                                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-[#007db8]/30 focus:bg-white rounded-2xl p-5 text-sm font-medium text-gray-700 h-32 outline-none transition-all resize-none shadow-inner"
                                                    ></textarea>
                                                </div>

                                                <div className="p-4 bg-[#003B66] text-white rounded-2xl border-2 border-[#002f52] shadow-xl shadow-[#003B66]/40">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <span className="material-symbols-outlined text-blue-300">psychiatry</span>
                                                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-blue-200">Neural Engine Config</label>
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <select value={selectedCredentialId} onChange={e => handleCredentialChange(e)} className="bg-[#004880] border border-[#005a8a] rounded-lg p-2 text-[10px] font-bold text-white outline-none">
                                                            {credentials.map(c => (
                                                                <option key={c.id} value={c.id} className="bg-[#003B66] text-white">{c.name} ({c.ip}:{c.port})</option>
                                                            ))}
                                                        </select>
                                                        <select value={triageAnalysisModel} onChange={e => { setTriageAnalysisModel(e.target.value); setTriageInteractionModel(e.target.value); }} className="bg-[#004880] border border-[#005a8a] rounded-lg p-2 text-[10px] font-bold text-white outline-none">
                                                            {models.map(mod => <option key={mod} value={mod}>{mod}</option>)}
                                                        </select>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={handleTriageSubmit}
                                                    disabled={triageLoading || !triageReason || !(selectedPatient?.id || "")}
                                                    className={`w-full py-5 rounded-2xl font-extrabold text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl ${triageLoading || !triageReason || !(selectedPatient?.id || "") ? 'bg-gray-100 text-gray-300' : 'bg-[#007db8] text-white hover:bg-[#005a8a] hover:-translate-y-1 shadow-[#007db8]/20'}`}
                                                >
                                                    {triageLoading ? (
                                                        <>
                                                            <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                                            <span>Inference in Progress...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="material-symbols-outlined">bolt</span>
                                                            <span>Run Manchester AI</span>
                                                        </>
                                                    )}
                                                </button>



                                            </div>
                                        </div>

                                        {/* Triage Result Side */}
                                        <div className="flex-1 bg-gray-50/50 p-10 flex flex-col border-l md:border-l-0 overflow-y-auto">

                                            {/* Performance Monitor (Reloj / Gauge Pattern at top right) */}
                                            <div className="w-full bg-white/90 rounded-3xl border border-black/5 p-6 shadow-sm backdrop-blur-xl mb-8 animate-in fade-in slide-in-from-top-4 relative overflow-hidden group">
                                                <div className="flex items-center justify-between mb-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-8 rounded-xl bg-[#007db8]/10 text-[#007db8] flex items-center justify-center border border-[#007db8]/10">
                                                            <span className="material-symbols-outlined text-[18px]">memory</span>
                                                        </div>
                                                        <div>
                                                            <h3 className="text-sm font-extrabold text-[#111418] uppercase tracking-wider font-outfit">GB10 STATUS</h3>
                                                            <p className="text-[10px] font-bold text-gray-400 tracking-wide mt-0.5 flex items-center gap-1">
                                                                <span className="size-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                                                Connected to Local Server
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] font-bold bg-[#007db8]/5 text-[#007db8] px-2.5 py-1 rounded-lg border border-[#007db8]/10 backdrop-blur-sm shadow-sm whitespace-nowrap">Live Telemetry</span>
                                                </div>
                                                <div className="flex items-end justify-between w-full h-full gap-8">

                                                    {/* GPU Gauge */}
                                                    <div className="flex flex-col items-center justify-end flex-1">
                                                        <div className="relative w-28 h-14 overflow-hidden flex justify-center">
                                                            <svg className="w-28 h-28 absolute top-0" viewBox="0 0 100 100">
                                                                {/* Background Arc */}
                                                                <path d="M 15 50 A 35 35 0 0 1 85 50" fill="none" stroke="#f3f4f6" strokeWidth="10" strokeLinecap="round" />
                                                                {/* Progress Arc (Circumference ~ 109.9) */}
                                                                <path d="M 15 50 A 35 35 0 0 1 85 50" fill="none" stroke="#ef4444" strokeWidth="10" strokeLinecap="round" strokeDasharray="109.95" strokeDashoffset={109.95 - (hwStats.gpu / 100) * 109.95} className="transition-all duration-1000 ease-out drop-shadow-[0_2px_4px_rgba(239,68,68,0.3)]" />
                                                            </svg>
                                                            <div className="absolute bottom-0 w-full text-center flex flex-col items-center">
                                                                <span className="text-sm font-extrabold text-gray-800 tabular-nums">{hwStats.gpu}%</span>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">GPU Usage</span>
                                                    </div>

                                                    {/* MEM Gauge */}
                                                    <div className="flex flex-col items-center justify-end flex-1">
                                                        <div className="relative w-28 h-14 overflow-hidden flex justify-center">
                                                            <svg className="w-28 h-28 absolute top-0" viewBox="0 0 100 100">
                                                                <path d="M 15 50 A 35 35 0 0 1 85 50" fill="none" stroke="#f3f4f6" strokeWidth="10" strokeLinecap="round" />
                                                                <path d="M 15 50 A 35 35 0 0 1 85 50" fill="none" stroke="#f97316" strokeWidth="10" strokeLinecap="round" strokeDasharray="109.95" strokeDashoffset={109.95 - (hwStats.mem / 100) * 109.95} className="transition-all duration-1000 ease-out drop-shadow-[0_2px_4px_rgba(249,115,22,0.3)]" />
                                                            </svg>
                                                            <div className="absolute bottom-0 w-full text-center flex flex-col items-center">
                                                                <span className="text-sm font-extrabold text-gray-800 tabular-nums">{hwStats.mem}%</span>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Mem Usage</span>
                                                    </div>

                                                    {/* Throughput */}
                                                    <div className="border-l border-gray-100 pl-8 flex flex-col justify-end h-16 flex-[2]">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Zap className="size-3 text-yellow-500 fill-yellow-500" /> Model Throughput</span>
                                                        <div className="text-4xl font-mono uppercase font-extrabold text-gray-900 flex items-baseline gap-2">
                                                            {hwStats.throughput} <span className="text-[11px] font-sans text-gray-500 font-bold bg-gray-100 px-2 py-1 rounded-lg uppercase tracking-widest">tok/s</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Status and Error Alerts */}
                                            {error && (
                                                <div className="w-full max-w-lg mb-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                                                    <AlertCircle className="text-[#007db8] size-5" />
                                                    <p className="text-xs font-bold text-[#007db8]">{error}</p>
                                                </div>
                                            )}

                                            {!triageResult && !triageLoading && (
                                                <div className="text-center space-y-4 opacity-30 my-auto">
                                                    <span className="material-symbols-outlined text-8xl">clinical_notes</span>
                                                    <p className="text-xs font-extrabold uppercase tracking-[0.2em]">Scanning Parameters...</p>
                                                </div>
                                            )}

                                            {triageLoading && (
                                                <div className="text-center space-y-6 my-auto">
                                                    <div className="size-24 border-8 border-blue-50 border-t-[#007db8] rounded-full animate-spin mx-auto"></div>
                                                    <p className="text-sm font-extrabold text-[#007db8] uppercase tracking-widest animate-pulse">Classifying Manchester Severity...</p>
                                                </div>
                                            )}

                                            {triageResult && (
                                                <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-2">
                                                    {/* Cabecera de Urgencia (Formato Imagen) */}
                                                    <div className={`p-6 rounded-2xl flex items-center gap-6 shadow-md text-white ${triageResult?.level === 1 ? 'bg-[#ef4444]' :
                                                        triageResult?.level === 2 ? 'bg-[#f97316]' :
                                                            triageResult?.level === 3 ? 'bg-[#eab308]' : 'bg-[#22c55e]'
                                                        }`}>
                                                        <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm shadow-inner">
                                                            <span className="material-symbols-outlined text-4xl">warning</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] opacity-80 mb-1">MANCHESTER LEVEL {triageResult?.level || 3}</p>
                                                            <h3 className="text-3xl font-extrabold uppercase tracking-tighter font-outfit">{triageResult?.priority_name || 'UNKNOWN'}</h3>
                                                        </div>
                                                    </div>

                                                    {/* Clinical Justification (Formato Imagen) */}
                                                    <div className="glass-panel rounded-2xl overflow-hidden border border-white/60 shadow-sm">
                                                        <div className={`border-l-4 p-5 ${triageResult?.level === 1 ? 'border-red-500' :
                                                            triageResult?.level === 2 ? 'border-orange-500' :
                                                                triageResult?.level === 3 ? 'border-yellow-500' : 'border-blue-500'
                                                            }`}>
                                                            <div className="flex items-center gap-2 mb-4 text-[#617289]">
                                                                <span className="material-symbols-outlined text-lg">content_paste</span>
                                                                <h4 className="text-[10px] font-extrabold uppercase tracking-[0.1em]">Clinical Justification</h4>
                                                            </div>
                                                            <div className="text-[#111418] text-sm font-medium leading-relaxed">
                                                                <ReactMarkdown>{triageResult?.justification || ''}</ReactMarkdown>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Immediate Actions (Formato Imagen) */}
                                                    <div className="glass-panel rounded-2xl overflow-hidden border border-white/60 shadow-sm">
                                                        <div className={`border-l-4 p-5 ${triageResult?.level === 1 ? 'border-red-600' :
                                                            triageResult?.level === 2 ? 'border-orange-600' :
                                                                triageResult?.level === 3 ? 'border-yellow-600' : 'border-[#007db8]'
                                                            }`}>
                                                            <div className="flex items-center gap-2 mb-4 text-[#617289]">
                                                                <span className="material-symbols-outlined text-lg">bolt</span>
                                                                <h4 className="text-[10px] font-extrabold uppercase tracking-[0.1em]">Immediate Actions</h4>
                                                            </div>
                                                            <div className="text-[#111418] text-sm font-medium leading-relaxed">
                                                                <ReactMarkdown>{triageResult?.actions || ''}</ReactMarkdown>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Footer Info & Final Action */}
                                                    <div className="flex items-center justify-between px-2 mt-6">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`size-2 rounded-full animate-pulse ${triageResult?.level === 1 ? 'bg-red-500' : 'bg-blue-500'
                                                                }`}></div>
                                                            <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest font-bold">Inference via {triageAnalysisModel || 'N/A'}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setTriageResult(null);
                                                                setTriageReason('');
                                                                // Mock success feedback
                                                                setActiveTab('patients');
                                                            }}
                                                            className="bg-[#007db8] text-white px-10 py-4 rounded-2xl text-xs font-extrabold uppercase tracking-widest hover:bg-[#00608d] transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                                                        >
                                                            Validate & Admit Patient
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'patients' && (
                                <div className="fade-in bg-white border border-[#dbe0e6] rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                                    <div className="p-8 border-b border-[#dbe0e6] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
                                        <div>
                                            <h3 className="font-extrabold text-2xl text-gray-900 flex items-center gap-3 font-outfit">
                                                <span className="material-symbols-outlined text-[#007db8] text-3xl">folder_shared</span>
                                                Active Clinical Directory
                                            </h3>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Synced via HL7/FHIR with Central Database</p>
                                        </div>
                                        <button onClick={() => alert('Quick admission interface initiated.')} className="bg-[#007db8] text-white shadow-xl shadow-blue-900/10 px-6 py-3 rounded-xl text-xs font-extrabold uppercase tracking-widest flex items-center gap-2 hover:bg-[#005a8a] transition-all">
                                            <span className="material-symbols-outlined text-[18px]">person_add</span> Quick Admission
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-100/50 border-b border-[#dbe0e6]">
                                                <tr>
                                                    <th className="px-8 py-5 text-[10px] uppercase font-extrabold tracking-widest text-gray-400">ID / NHC</th>
                                                    <th className="px-8 py-5 text-[10px] uppercase font-extrabold tracking-widest text-gray-400">Patient</th>
                                                    <th className="px-8 py-5 text-[10px] uppercase font-extrabold tracking-widest text-gray-400">Demographics</th>
                                                    <th className="px-8 py-5 text-[10px] uppercase font-extrabold tracking-widest text-gray-400">Reason for Visit</th>
                                                    <th className="px-8 py-5 text-[10px] uppercase font-extrabold tracking-widest text-gray-400 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {patients.map((p, i) => (
                                                    <tr key={p.id} className="hover:bg-blue-50/30 transition-colors group cursor-pointer">
                                                        <td className="px-8 py-6 text-xs font-mono uppercase font-bold text-gray-400">{p.id}</td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className="size-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-xs uppercase">{p.name.substring(0, 2)}</div>
                                                                <span className="font-extrabold text-gray-900 text-sm group-hover:text-[#007db8] transition-colors">{p.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-2">
                                                                <span className="bg-gray-100 px-2 py-1 rounded text-[10px] font-extrabold text-gray-600 uppercase tracking-widest">{p.age} yrs</span>
                                                                <span className="text-xs font-bold text-gray-400 uppercase">{p.sex}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-sm font-medium max-w-xs truncate text-gray-600">{p.reason}</td>
                                                        <td className="px-8 py-6 text-right">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedPatient(p);
                                                                    setActiveTab('patient_detail');
                                                                }}
                                                                className="text-[#007db8] font-extrabold text-[10px] uppercase tracking-widest bg-[#007db8]/5 border border-[#007db8]/10 px-5 py-2.5 rounded-xl hover:bg-[#007db8] hover:text-white transition-all shadow-sm"
                                                            >
                                                                Open 360º Record
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'patient_detail' && (
                                <PatientDetail
                                    patient={selectedPatient}
                                    onBack={() => setActiveTab('patients')}
                                    onDeepAnalysis={handleDeepPatientAnalysis}
                                    isAnalyzing={isAnalyzingPatient}
                                />
                            )}

                            {activeTab === 'schedules' ? renderScheduleGrid() : false && (
                                <div className="fade-in max-w-4xl mx-auto py-20 text-center space-y-8 bg-white/90 border border-black/5 rounded-[3rem] shadow-sm backdrop-blur-xl">
                                    <div className="size-24 rounded-full bg-blue-50 flex items-center justify-center mx-auto text-[#007db8] shadow-inner">
                                        <span className="material-symbols-outlined text-5xl animate-bounce">event_note</span>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-3xl font-extrabold text-gray-900 leading-tight font-outfit">Intelligent Nursing Planning</h3>
                                        <p className="text-gray-400 max-w-md mx-auto text-sm font-medium">The Dell Pro dynamic rotation system (80 profiles, AI optimized) is processing the deployment to the new graphical interface.</p>
                                    </div>
                                    <button className="px-10 py-4 bg-gray-900 hover:bg-black text-white text-[10px] font-extrabold uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-gray-900/20 active:scale-95">View Compilation Status</button>
                                </div>
                            )}
                        </div>
                    </div> {/* Close max-w container */}

                    {/* Footer Bar */}
                    <footer className="h-10 border-t border-[#dbe0e6] bg-white/80 backdrop-blur-md px-8 flex items-center justify-between shrink-0 z-10 sticky bottom-0">
                        <div className="flex items-center gap-4">
                            <p className="text-[10px] text-[#617289] font-extrabold uppercase tracking-widest">© 2026 Antigravity HealthOS Pro</p>
                            <div className="h-3 w-[2px] bg-gray-300 rounded-full"></div>
                            <p className="text-[10px] text-green-600 font-extrabold uppercase tracking-widest flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">lock</span> HIPAA Compliant V3.1
                            </p>
                        </div>
                    </footer>

                    {/* Floating Chat Widget */}
                    {
                        (activeTab === 'radiology' || activeTab === 'triage') && (
                            <React.Fragment>
                                <div className={`fixed bottom-24 right-8 w-96 bg-white rounded-3xl shadow-2xl border border-[#dbe0e6] flex flex-col overflow-hidden transition-all duration-500 z-50 ${showChat ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95 pointer-events-none'}`} style={{ height: '550px' }}>
                                    <div className="bg-[#007db8] p-5 text-white flex items-center justify-between shadow-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                                <span className="material-symbols-outlined text-3xl">smart_toy</span>
                                            </div>
                                            <div>
                                                <h3 className="font-extrabold text-lg leading-tight tracking-tight font-outfit">Dell Health Assistant</h3>
                                                <span className="text-[10px] font-extrabold tracking-widest uppercase opacity-80 flex items-center gap-1.5">
                                                    <span className="size-1.5 rounded-full bg-green-400 animate-pulse"></span>
                                                    Ready on GB10
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setShowChat(false);
                                                    setChatHistory([]); // Clear history immediately on close
                                                    setChatMessage("");
                                                }}
                                                className="size-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-sm">close</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8fafc] content-start">
                                        {chatHistory.map((msg, idx) => (
                                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end pl-6' : 'justify-start pr-6'}`}>
                                                <div className={`p-3 rounded-2xl text-[13px] shadow-sm leading-relaxed font-medium relative ${msg.role === 'user' ? 'bg-[#007db8] text-white rounded-tr-sm' : 'bg-white border border-[#dbe0e6] text-gray-700 rounded-tl-sm markdown-chat'}`}>
                                                    {msg.role === 'user' ? msg.content : (
                                                        msg.loading ? (
                                                            <span className="flex items-center gap-2 text-gray-500 animate-pulse">
                                                                <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                                                                Generating response with {selectedModel}...
                                                            </span>
                                                        ) : (
                                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <form onSubmit={handleChatSubmit} className="p-3 bg-white border-t border-[#dbe0e6] flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <input type="text" value={chatMessage} onChange={e => setChatMessage(e.target.value)} placeholder="Query findings..." className="flex-1 text-sm border-2 border-transparent bg-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-[#007db8]/30 focus:bg-white transition-all font-medium text-gray-800 placeholder-gray-400" />
                                            <button type="submit" disabled={!chatMessage.trim()} className="size-11 rounded-xl bg-[#007db8] text-white flex items-center justify-center transition-all shadow-md"><span className="material-symbols-outlined text-[20px]">send</span></button>
                                        </div>
                                    </form>
                                </div>
                                <button
                                    onClick={() => {
                                        const willShow = !showChat;
                                        setShowChat(willShow);
                                        if (willShow && chatHistory.length === 0) {
                                            const greeting = activeTab === 'radiology'
                                                ? `Hello! I am the **Dell AI Healthcare Assistant** (via ${selectedModel}).\n\nMy neural engine is ready. How can I help you analyze these findings or clinical context?`
                                                : `Hello! I am the **Dell AI Healthcare Assistant** (via ${triageInteractionModel || 'BioMistral'}).\n\nI am ready to help you with the Manchester protocol classification. What would you like to know?`;
                                            setChatHistory([{ role: 'assistant', content: greeting }]);
                                        }
                                    }}
                                    className={`fixed bottom-8 right-8 h-16 w-auto px-5 rounded-full bg-[#007db8] text-white shadow-2xl flex items-center justify-center hover:-translate-y-1 transition-all z-40 border border-white/20 gap-3 ${showChat ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100'}`}
                                >
                                    <span className="material-symbols-outlined text-[28px]">forum</span>
                                    <span className="text-xs font-extrabold uppercase tracking-widest">Ask AI</span>
                                </button>
                            </React.Fragment>
                        )
                    }
                </main>
            </div>

            {/* CAPABILITIES MODAL */}
            {
                showCapabilities && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setShowCapabilities(false)}>
                        <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <h2 className="text-lg font-extrabold text-[#111418] flex items-center gap-3">
                                    {selectedEngine === 'xray' ? (
                                        <><span className="material-symbols-outlined text-[#007db8]">memory</span> XTraY Engine — Capabilities</>
                                    ) : selectedEngine === 'ct_totalseg' ? (
                                        <><span className="material-symbols-outlined text-green-500">body_system</span> TotalSegmentator — Capabilities</>
                                    ) : selectedEngine === 'mri_brats' ? (
                                        <><span className="material-symbols-outlined text-purple-500">psychology</span> BraTS Brain Tumor — Capabilities</>
                                    ) : (
                                        <><span className="material-symbols-outlined text-yellow-500">bolt</span> YOLOv11 — Capabilities</>
                                    )}
                                </h2>
                                <button onClick={() => setShowCapabilities(false)} className="size-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                                    <span className="material-symbols-outlined text-gray-600">close</span>
                                </button>
                            </div>
                            <div className="overflow-y-auto p-6 space-y-4">
                                {selectedEngine === 'xray' ? (
                                    <>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            <strong>DenseNet121-res224-all</strong> model trained on
                                            NIH ChestX-ray14, CheXpert, MIMIC-CXR, PadChest, Google, and OpenI datasets.
                                            Detects the following <strong>18 thoracic pathologies</strong>:
                                        </p>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm border-collapse">
                                                <thead>
                                                    <tr className="bg-gray-50 text-left">
                                                        <th className="px-3 py-2 font-extrabold text-[10px] uppercase tracking-widest text-gray-500 border-b">#</th>
                                                        <th className="px-3 py-2 font-extrabold text-[10px] uppercase tracking-widest text-gray-500 border-b">Pathology (EN)</th>
                                                        <th className="px-3 py-2 font-extrabold text-[10px] uppercase tracking-widest text-gray-500 border-b">Name</th>
                                                        <th className="px-3 py-2 font-extrabold text-[10px] uppercase tracking-widest text-gray-500 border-b">Description</th>
                                                        <th className="px-3 py-2 font-extrabold text-[10px] uppercase tracking-widest text-gray-500 border-b">Severity</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {XRAY_CAPABILITIES.map((p, i) => (
                                                        <tr key={p.name} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
                                                            <td className="px-3 py-2 text-gray-400 font-mono uppercase font-bold text-xs">{i + 1}</td>
                                                            <td className="px-3 py-2"><code className="text-[11px] bg-gray-100 px-1.5 py-0.5 rounded font-mono uppercase">{p.name}</code></td>
                                                            <td className="px-3 py-2 font-semibold text-gray-700">{p.es}</td>
                                                            <td className="px-3 py-2 text-gray-500">{p.desc}</td>
                                                            <td className="px-3 py-2 font-semibold whitespace-nowrap">{p.severity}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl text-sm text-blue-700">
                                            <span className="material-symbols-outlined text-[16px]">info</span>
                                            This model is optimized exclusively for <strong>Chest X-Ray images</strong>.
                                        </div>
                                    </>
                                ) : selectedEngine === 'ct_totalseg' ? (
                                    <>
                                        <p className="text-sm text-gray-600 leading-relaxed mb-4">
                                            <strong>TotalSegmentator</strong> is a robust tool for anatomical segmentation.
                                            It provides highly accurate masks for 117+ structures.
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {CT_CAPABILITIES.map(cap => (
                                                <div key={cap.name} className="p-4 bg-green-50/50 border border-green-100 rounded-2xl">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[10px] font-extrabold text-green-600 uppercase tracking-widest">{cap.tech}</span>
                                                        <span className="material-symbols-outlined text-green-500">check_circle</span>
                                                    </div>
                                                    <h4 className="font-bold text-gray-800 mb-1">{cap.name}</h4>
                                                    <p className="text-xs text-gray-500 leading-relaxed">{cap.desc}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : selectedEngine === 'mri_brats' ? (
                                    <>
                                        <p className="text-sm text-gray-600 leading-relaxed mb-4">
                                            The <strong>BraTS</strong> (Brain Tumor Segmentation) model identifies sub-regions
                                            of glioma tumors using multi-parametric MRI sequences (T1, T1c, T2, FLAIR).
                                        </p>
                                        <div className="space-y-3">
                                            {MRI_CAPABILITIES.map(cap => (
                                                <div key={cap.name} className="flex items-center gap-4 p-4 bg-purple-50/50 border border-purple-100 rounded-2xl group hover:bg-purple-50 transition-colors">
                                                    <div className="size-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                                        <span className="material-symbols-outlined text-xl">biotech</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-gray-800">{cap.name} — <span className="text-purple-600 uppercase tracking-tighter text-[10px]">{cap.label}</span></h4>
                                                        <p className="text-[11px] text-gray-500">{cap.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            <strong>YOLOv11 Nano</strong> model trained on the COCO dataset.
                                            Detects <strong>80 generic object classes</strong>.
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {YOLO_CAPABILITIES_SUMMARY.map(cls => (
                                                <span key={cls} className="px-3 py-1.5 bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold rounded-full">{cls}</span>
                                            ))}
                                            <span className="px-3 py-1.5 bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs font-semibold rounded-full">+50 more...</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
}

export default App;
