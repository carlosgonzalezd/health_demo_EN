import os
import shutil
import json
import requests
from datetime import datetime

# 1. GENERATE DUMMY DATA VIA OLLAMA (Delegation to GB10 Rule)
OLLAMA_URL = "http://100.74.34.8:11434/api/generate"
MODEL = "gpt-oss:20b"
prompt = """
Generate a JSON array of 50 synthetic smart city sensor nodes.
Include the following fields for each node:
- id: e.g., "NODE-001"
- location: e.g., "M-40 Orbital Motorway", "Fuencarral District Hub"
- type: e.g., "TRAFFIC", "AIR_QUALITY", "ENERGY"
- status: e.g., "ACTIVE", "WARNING", "MAINTENANCE"
Return ONLY the raw JSON array, without any markdown formatting or explanation.
"""

payload = {
    "model": MODEL,
    "prompt": prompt,
    "stream": False
}

try:
    print("Delegating generation to GB10 Ollama...")
    res = requests.post(OLLAMA_URL, json=payload, timeout=60).json()
    generated_text = res.get("response", "[]").strip()
    eval_count = res.get("eval_count", 0)
    prompt_eval_count = res.get("prompt_eval_count", 0)
    total_tokens = eval_count + prompt_eval_count
    
    # Save tokens_saved file
    token_log = f"""Tokens Saved via Dell AI Factory (GB10)

By delegating heavy inference tasks (like generating UI structural prompts and massive data simulation) to the local GB10 cluster instead of using public cloud models, we are saving considerable resources.
Total Tokens Saved: {total_tokens}

Detailed Inference Log
Date/Time\tTask Description\tModel Used\tTokens
{datetime.now().strftime("%Y-%m-%d %H:%M")}\tGeneration of 50 synthetic smart city nodes\t{MODEL}\t{total_tokens}
"""
    with open("/home/dell-ai-innovation/health_demo_EN/tokens_saved", "a" if os.path.exists("/home/dell-ai-innovation/health_demo_EN/tokens_saved") else "w") as f:
        f.write("\n" + token_log if os.path.exists("/home/dell-ai-innovation/health_demo_EN/tokens_saved") else token_log)
    
except Exception as e:
    print("Ollama generation failed, using fallback static data.", e)
    generated_text = '[{"id":"NODE-001","location":"M-40","type":"TRAFFIC","status":"ACTIVE"}]'

# 2. CREATE FOLDER STRUCTURE
src = "/home/dell-ai-innovation/health_demo_EN"
dest = "/home/dell-ai-innovation/smart_city_demo_EN"

if os.path.exists(dest):
    shutil.rmtree(dest)

os.makedirs(dest)
for item in ['frontend', 'backend', 'docker-compose.yml', 'Dockerfile.frontend', 'Dockerfile.backend', '.dockerignore']:
    s = os.path.join(src, item)
    d = os.path.join(dest, item)
    if os.path.exists(s):
        if os.path.isdir(s): shutil.copytree(s, d)
        else: shutil.copy2(s, d)

# Write generated JSON to backend
with open(os.path.join(dest, "backend", "nodes.json"), "w") as f:
    f.write(generated_text)

# 3. MODIFY DOCKER COMPOSE
with open(os.path.join(dest, "docker-compose.yml"), "r") as f:
    dc = f.read()

dc = dc.replace("health_demo_EN", "smartcity_demo")
dc = dc.replace('"4101:80"', '"4103:80"')
dc = dc.replace('"5000:5000"', '"5003:5000"')
dc = dc.replace('"4102:4102"', '"4104:4102"')

with open(os.path.join(dest, "docker-compose.yml"), "w") as f:
    f.write(dc)

# 4. MODIFY FRONTEND APP.JSX
app_jsx = """import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

const BACKEND_URL = "/api";

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [chatMessage, setChatMessage] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: 'Hello! I am the **Dell AI Smart City Assistant**.\\n\\nI am monitoring infrastructure telemetry on GB10. How can I help?' }
  ]);

  return (
    <div className="bg-[#060606] font-display text-slate-100 min-h-screen overflow-x-hidden flex flex-col">
      {/* Header from MCP */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-white/5 bg-black/90 backdrop-blur-md px-8 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 border-2 border-[#0076ce] rounded-full relative">
              <div className="font-black text-[10px] tracking-tighter text-[#0076ce] flex items-center">D<span className="font-black text-base leading-none -rotate-12 ml-[1px] text-[#0076ce]">E</span>LL</div>
            </div>
            <div className="flex flex-col">
              <h2 className="text-white text-xl font-bold leading-tight tracking-tight uppercase">Dell AI <span className="text-slate-400 font-light">Smart City</span></h2>
              <span className="text-[9px] uppercase tracking-[0.2em] text-[#0076ce] font-bold">Command Center</span>
            </div>
          </div>
        </div>
        <div className="flex flex-1 justify-end gap-6 items-center">
          <nav className="flex items-center gap-10 mr-4">
            <button onClick={() => setActiveTab('dashboard')} className={`${activeTab==='dashboard'? 'text-[#0076ce] border-b-2 border-[#0076ce]': 'text-slate-400'} text-sm font-bold pb-1 uppercase tracking-wider transition-colors hover:text-white`}>Dashboard</button>
            <button onClick={() => setActiveTab('digital_twin')} className={`${activeTab==='digital_twin'? 'text-[#0076ce] border-b-2 border-[#0076ce]': 'text-slate-400'} text-sm font-bold pb-1 uppercase tracking-wider transition-colors hover:text-white`}>Digital Twin</button>
            <button onClick={() => setActiveTab('fleet')} className={`${activeTab==='fleet'? 'text-[#0076ce] border-b-2 border-[#0076ce]': 'text-slate-400'} text-sm font-bold pb-1 uppercase tracking-wider transition-colors hover:text-white`}>Fleet</button>
            <button onClick={() => setActiveTab('settings')} className={`${activeTab==='settings'? 'text-[#0076ce] border-b-2 border-[#0076ce]': 'text-slate-400'} text-sm font-bold pb-1 uppercase tracking-wider transition-colors hover:text-white`}>Settings</button>
          </nav>
          <button onClick={() => setShowChat(!showChat)} className="flex min-w-[140px] cursor-pointer items-center justify-center rounded-sm h-11 px-6 bg-[#0076ce] hover:bg-[#0066b3] text-white text-sm font-bold transition-all uppercase tracking-widest">
            <span className="material-symbols-outlined mr-2 text-lg">smart_toy</span> Dell AI
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-8 grid grid-cols-12 gap-8 max-w-[2400px] mx-auto flex-1 w-full">
        {activeTab === 'dashboard' && (
          <div className="col-span-12 grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-3 flex flex-col gap-8">
                <div style={{background: 'rgba(18, 18, 18, 0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.08)'}} className="rounded-lg p-6 flex flex-col gap-5 border-l-4 border-l-[#0076ce]">
                    <div className="flex items-center justify-between">
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Live Traffic Intensity</h3>
                        <span className="material-symbols-outlined text-[#0076ce] text-xl">sensors</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <div>
                        <p className="text-white text-4xl font-mono uppercase tracking-tight">604 <span className="text-slate-500 text-lg font-normal">veh/h</span></p>
                        <p className="text-green-500 text-sm font-bold flex items-center mt-2">
                        <span className="material-symbols-outlined text-sm mr-1">trending_up</span>+28% VS PREVIOUS
                                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col-span-12 lg:col-span-6 flex flex-col gap-8">
                <div style={{background: 'rgba(18, 18, 18, 0.8)'}} className="rounded-lg p-8 h-[600px] flex items-center justify-center border border-white/5">
                    <p className="text-slate-500 font-mono text-xl">Central Map View Not Loaded</p>
                </div>
            </div>
            <div className="col-span-12 lg:col-span-3 flex flex-col gap-8">
                <div style={{background: 'rgba(18, 18, 18, 0.8)'}} className="rounded-lg p-6 flex flex-col gap-8 border border-white/5">
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Compute Performance</h3>
                    <div className="flex flex-col gap-8">
                        <div className="flex items-center gap-5">
                            <span className="text-3xl font-mono text-white">76%</span>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">GPU Load</span>
                                <span className="text-sm text-white font-bold">RTX-6000 Ada Gen</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Floating Chat */}
      {showChat && (
          <div className="fixed bottom-20 right-8 w-96 max-h-[600px] flex flex-col bg-[#121212] border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden">
            <div className="bg-[#0076ce] p-4 flex justify-between items-center">
                <span className="font-bold text-white uppercase text-sm tracking-widest">Dell AI Agent</span>
                <button onClick={() => setShowChat(false)} className="text-white hover:text-gray-200 material-symbols-outlined">close</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs text-slate-300 h-96">
                {chatHistory.map((m, i) => (
                    <div key={i} className={`p-3 rounded-lg ${m.role === 'user' ? 'bg-[#0076ce]/20 border border-[#0076ce]/30 ml-auto max-w-[80%]' : 'bg-white/5 border border-white/10 mr-auto max-w-[90%]'}`}>
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                ))}
            </div>
            <div className="p-4 border-t border-white/10 bg-black">
                <input value={chatMessage} onChange={e => setChatMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && setChatMessage('')} placeholder="Command inference..." className="w-full bg-white/5 border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-[#0076ce] text-xs font-mono" />
            </div>
          </div>
      )}
    </div>
  );
}

export default App;
"""

with open(os.path.join(dest, "frontend", "src", "App.jsx"), "w") as f:
    f.write(app_jsx)

# 5. Modify Nginx conf if it exists
nginx_path = os.path.join(dest, "frontend", "nginx.conf")
if os.path.exists(nginx_path):
    with open(nginx_path, "r") as f:
        nx = f.read()
    nx = nx.replace("proxy_pass http://backend:5000", "proxy_pass http://smartcity_backend:5000")
    with open(nginx_path, "w") as f:
        f.write(nx)

print("Smart City Project generated successfully at", dest)
