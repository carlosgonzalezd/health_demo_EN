import React from 'react';
import { Search, Bell, RefreshCw, Cpu } from 'lucide-react';

const Header = () => {
    return (
        <header className="main-header-bar">
            <div className="search-wrapper">
                <Search className="search-icon" size={18} />
                <input type="text" placeholder="Search for patients, studies or ID..." />
            </div>

            <div className="header-actions">
                <div className="pacs-status">
                    <div className="status-dot pulse"></div>
                    <span className="status-text">PACS ONLINE</span>
                </div>

                <div className="action-buttons">
                    <button className="btn-sync">
                        <RefreshCw size={16} />
                        <span>Sync</span>
                    </button>

                    <button className="btn-icon">
                        <Cpu size={20} />
                    </button>

                    <button className="btn-icon">
                        <Bell size={20} />
                        <div className="notification-badge"></div>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
