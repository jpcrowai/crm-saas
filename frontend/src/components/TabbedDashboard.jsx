import React, { useState } from 'react';
import './TabbedDashboard.css';

const TabbedDashboard = ({ tabs, defaultTab = 0 }) => {
    const [activeTab, setActiveTab] = useState(defaultTab);

    return (
        <div className="tabbed-dashboard-container">
            <div className="dashboard-tabs-header">
                <div className="tabs-list">
                    {tabs.map((tab, idx) => (
                        <button
                            key={idx}
                            className={`dashboard-tab-trigger ${activeTab === idx ? 'active' : ''}`}
                            onClick={() => setActiveTab(idx)}
                        >
                            <span className="tab-label">{tab.label}</span>
                            {activeTab === idx && (
                                <div className="tab-active-indicator" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="dashboard-tab-content">
                {tabs[activeTab].content}
            </div>
        </div>
    );
};

export default TabbedDashboard;
