# Dell Premium Live Telemetry Monitor (GB10 Standard)

This document contains the standardized code for the **Performance Monitor** (Live Telemetry) used across all Dell AI Innovation projects. 

## Design Principles
- **Aesthetics**: Glassmorphism (bg-white/90, backdrop-blur-xl).
- **Branding**: Uses Dell Blue (#007db8) and Outfit font for headings.
- **Interactivity**: Pulsing indicators for live connection and hover effects.
- **Metrics**: GPU Load, Memory Usage, and Token Throughput.

## Dependencies
- **Tailwind CSS**: For layout and glass-morphism.
- **Material Symbols Outlined**: For icons.
- **Lucide React (optional)**: Some versions use Zap/Bolt icons.
- **Google Fonts**: Inter (UI) and Outfit (Headings).

## Standardized Code (React/JSX)

```jsx
{/* standardized Performance Monitor (Live Telemetry) */}
<div className="w-full bg-white/90 rounded-3xl border border-black/5 p-6 shadow-sm backdrop-blur-xl mb-4 animate-in fade-in slide-in-from-top-4 relative overflow-hidden group">
    {/* Subtle Glow Hover Effect */}
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    
    {/* Header Section */}
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
        {/* The Mandatory Live Telemetry Badge */}
        <span className="text-[10px] font-bold bg-[#007db8]/5 text-[#007db8] px-2.5 py-1 rounded-lg border border-[#007db8]/10 backdrop-blur-sm shadow-sm whitespace-nowrap uppercase tracking-widest">
            Live Telemetry
        </span>
    </div>

    {/* Gauges & Metrics Container */}
    <div className="flex items-end justify-between w-full h-full gap-8">
        
        {/* GPU Gauge */}
        <div className="flex flex-col items-center justify-end flex-1">
            <div className="relative w-28 h-14 overflow-hidden flex justify-center">
                <svg className="w-28 h-28 absolute top-0" viewBox="0 0 100 100">
                    <path d="M 15 50 A 35 35 0 0 1 85 50" fill="none" stroke="#f3f4f6" strokeWidth="10" strokeLinecap="round" />
                    <path 
                        d="M 15 50 A 35 35 0 0 1 85 50" 
                        fill="none" 
                        stroke="#ef4444" 
                        strokeWidth="10" 
                        strokeLinecap="round" 
                        strokeDasharray="109.95" 
                        strokeDashoffset={109.95 - (stats.gpu / 100) * 109.95} 
                        className="transition-all duration-1000 ease-out drop-shadow-[0_2px_4px_rgba(239,68,68,0.3)]" 
                    />
                </svg>
                <div className="absolute bottom-0 w-full text-center flex flex-col items-center">
                    <span className="text-sm font-extrabold text-gray-800 tabular-nums">{stats.gpu}%</span>
                </div>
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">GPU Usage</span>
        </div>

        {/* Memory Gauge */}
        <div className="flex flex-col items-center justify-end flex-1">
            <div className="relative w-28 h-14 overflow-hidden flex justify-center">
                <svg className="w-28 h-28 absolute top-0" viewBox="0 0 100 100">
                    <path d="M 15 50 A 35 35 0 0 1 85 50" fill="none" stroke="#f3f4f6" strokeWidth="10" strokeLinecap="round" />
                    <path 
                        d="M 15 50 A 35 35 0 0 1 85 50" 
                        fill="none" 
                        stroke="#f97316" 
                        strokeWidth="10" 
                        strokeLinecap="round" 
                        strokeDasharray="109.95" 
                        strokeDashoffset={109.95 - (stats.mem / 100) * 109.95} 
                        className="transition-all duration-1000 ease-out drop-shadow-[0_2px_4px_rgba(249,115,22,0.3)]" 
                    />
                </svg>
                <div className="absolute bottom-0 w-full text-center flex flex-col items-center">
                    <span className="text-sm font-extrabold text-gray-800 tabular-nums">{stats.mem}%</span>
                </div>
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Mem Usage</span>
        </div>

        {/* Throughput Metric */}
        <div className="border-l border-gray-100 pl-8 flex flex-col justify-end h-16 flex-[2]">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span> 
                Inference Speed
            </span>
            <div className="text-4xl font-mono uppercase font-extrabold text-gray-900 flex items-baseline gap-2">
                {stats.throughput} <span className="text-[11px] font-sans text-gray-500 font-bold bg-gray-100 px-2 py-1 rounded-lg uppercase tracking-widest">tok/s</span>
            </div>
        </div>
    </div>
</div>
```

## CSS Utilities
Ensure the following classes are defined or available via Tailwind:
- `glass-panel`: Custom background blur and border.
- `font-outfit`: Outfit Google Font.
- `animate-pulse`: Standard Tailwind pulse animation.
- `fade-in / slide-in-from-top-4`: Transition animations.
