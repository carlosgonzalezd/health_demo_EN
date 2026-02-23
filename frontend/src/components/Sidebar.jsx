import React from 'react';
import { LayoutDashboard, Users, Activity, FileText, Settings, Plus, LogOut, Calendar } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, onNewScan }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'triaje', label: 'Manchester Triage', icon: Activity },
        { id: 'radiologia', label: 'Radiology AI', icon: FileText },
        { id: 'pacientes', label: 'Patients', icon: Users },
        { id: 'planillas', label: 'Shift Calendar', icon: Calendar },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo-icon">
                    <Activity color="white" size={24} />
                </div>
                <div className="logo-text">
                    <h1>HealthAI</h1>
                    <p>RADIOLOGY DASHBOARD</p>
                </div>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(item.id)}
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="sidebar-footer">
                <button className="new-scan-btn" onClick={onNewScan}>
                    <Plus size={18} />
                    <span>New Scan</span>
                </button>

                <div className="user-profile">
                    <div className="avatar" style={{ backgroundImage: "url('https://ui-avatars.com/api/?name=Dr+Carlos&background=0D8ABC&color=fff')" }}></div>
                    <div className="user-info">
                        <p className="user-name">Dr. Carlos Romero</p>
                        <p className="user-role">Head of Radiology</p>
                    </div>
                    <Settings size={16} className="settings-icon" />
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
