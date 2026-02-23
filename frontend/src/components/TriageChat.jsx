import { useState, useRef, useEffect } from 'react';
import { Send, Activity, Loader2 } from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const TriageChat = ({ backendUrl, selectedModel, contextData }) => {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hola. Soy tu asistente de triaje. ¿Tienes dudas sobre la clasificación del paciente o el protocolo Manchester?' }
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
            let contextStr = "Contexto Triaje: Sin datos previos.";
            if (contextData) {
                contextStr = `Contexto Triaje: Paciente ${contextData.priority_name} (Nivel ${contextData.level}). 
                Justificación: ${contextData.justification}. 
                Acciones: ${contextData.actions}.`;
            }

            const res = await axios.post(`${backendUrl}/chat`, {
                model: selectedModel,
                message: userMsg.content,
                context: contextStr,
                history: [] // We could pass history if the backend supports full convo context
            });
            setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Error de conexión." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="planilla-chatbot-section" style={{ marginTop: '2rem' }}>
            <div className="chat-smart-container">
                <div className="chat-header-inline" style={{ borderBottom: '2px solid #0ea5e9', background: '#f8fafc' }}>
                    <Activity size={20} style={{ color: '#0ea5e9' }} />
                    <span style={{ fontWeight: '800', letterSpacing: '-0.02em', color: '#0f172a' }}>ASISTENTE CLÍNICO DE TRIAJE</span>
                </div>

                <div className="chat-messages-inline" style={{ padding: '2rem 1.5rem', background: '#fefefe' }}>
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
                    {loading && (
                        <div className="chat-msg assistant" style={{ fontStyle: 'italic', color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem' }}>
                            <Loader2 className="spin" size={18} /> <strong>Analizando Protocolo Manchester...</strong>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form className="chat-input-inline" onSubmit={handleSend}>
                    <input
                        placeholder="Ej: ¿Por qué fiebre de 40 es Naranja y no Rojo?"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                    />
                    <button type="submit" disabled={loading || !input} className="btn-primary" style={{ width: 'auto', padding: '0 1.5rem' }}>
                        <Send size={18} /> Enviar
                    </button>
                </form>
            </div>
        </div>
    );
};
