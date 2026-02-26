import { useState, useRef, useEffect } from 'react';
import { Send, Activity, Loader2 } from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const TriageChat = ({ backendUrl, selectedModel, contextData }) => {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello. I am your Triage Assistant. Do you have any questions about the patient\'s classification or the Manchester protocol?' }
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
            let contextStr = "Triage Context: No previous data.";
            if (contextData) {
                contextStr = `Triage Context: Patient ${contextData.priority_name} (Level ${contextData.level}). 
                Justification: ${contextData.justification}. 
                Actions: ${contextData.actions}.`;
            }

            const res = await axios.post(`${backendUrl}/chat`, {
                model: selectedModel,
                message: userMsg.content,
                context: contextStr,
                history: [] // We could pass history if the backend supports full convo context
            });
            setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Connection error." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[500px] glass-panel rounded-[2.5rem] border border-white/60 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="px-8 py-5 border-b border-gray-100 bg-white/50 backdrop-blur-md flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-blue-50 text-[#007db8] flex items-center justify-center">
                        <Activity size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-extrabold text-[#111418] uppercase tracking-wider font-outfit">Clinical Triage Assistant</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Powered by GB10 Neural Engine</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[10px] font-extrabold text-[#007db8] uppercase tracking-widest">Active Inference</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-50/30">
                {messages.map((m, i) => (
                    <div
                        key={i}
                        className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[85%] px-6 py-4 rounded-[1.5rem] text-sm font-medium leading-relaxed shadow-sm ${m.role === 'assistant'
                                    ? 'bg-white border border-gray-100 text-slate-700 rounded-tl-none'
                                    : 'bg-[#007db8] text-white rounded-br-none'
                                }`}
                        >
                            {m.role === 'assistant' ? (
                                <div className="markdown-content prose prose-sm prose-slate">
                                    <ReactMarkdown>{m.content}</ReactMarkdown>
                                </div>
                            ) : (
                                m.content
                            )}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-100 px-6 py-4 rounded-[1.5rem] rounded-tl-none shadow-sm flex items-center gap-3 text-slate-400">
                            <Loader2 className="animate-spin" size={16} />
                            <span className="text-xs font-extrabold uppercase tracking-widest">Reasoning Manchester Protocol...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="p-6 bg-white border-t border-gray-100" onSubmit={handleSend}>
                <div className="relative group">
                    <input
                        placeholder="Ask about Manchester criteria, vitals interpretation..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-[#007db8]/30 focus:bg-white rounded-2xl py-4 pl-6 pr-16 text-sm font-bold text-gray-800 outline-none transition-all shadow-inner"
                    />
                    <button
                        type="submit"
                        disabled={loading || !input}
                        className="absolute right-2 top-2 bottom-2 px-4 rounded-xl bg-[#007db8] text-white hover:bg-[#005a8a] transition-all disabled:opacity-30 disabled:hover:bg-[#007db8]"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TriageChat;
