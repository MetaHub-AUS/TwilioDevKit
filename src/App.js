
import React, { useState, useEffect } from 'react';
import GeminiCommLink from './components/GeminiCommLink';
import RevisitTable from './components/revisit/RevisitTable';
import SmartSurvey from './components/SmartSurvey';
import TeamCommand from './components/TeamCommand';
import './styles.css';

function App() {
  // STATE: Simulating the Authentication Context from Audit 3.2
  const [userRole, setUserRole] = useState('Agent'); // 'Agent' or 'FieldLeader'
  const [activeTab, setActiveTab] = useState('command');

  // Effect: When Role Changes, force the correct view (Conditional Rendering)
  useEffect(() => {
      if (userRole === 'Agent') setActiveTab('command');
      if (userRole === 'FieldLeader') setActiveTab('assets');
  }, [userRole]);

  return (
    <div className="app-container">
      <header className="gemini-header">
        <div className="header-left">
            <div className="logo-area">
                <h1 className="brand">AU NFAEP</h1>
                <div className="divider"></div>
                <div className="sub-brand">
                    <div className="title">National Fire Ant Eradication Program</div>
                    <div className="badge">Gemini Ops v3.0</div>
                </div>
            </div>
        </div>
        
        <nav className="header-nav">
            {/* CONDITIONAL RENDERING: Agents see Command, Leaders see Assets */}
            <button 
                className={`nav-tab ${activeTab === 'command' ? 'active' : ''}`}
                onClick={() => setActiveTab('command')}
            >
                📡 Command Center
            </button>
            
            {/* Only Field Leaders can access the Asset Dashboard */}
            {userRole === 'FieldLeader' && (
                <button 
                    className={`nav-tab ${activeTab === 'assets' ? 'active' : ''}`}
                    onClick={() => setActiveTab('assets')}
                >
                    🚁 Field Assets
                </button>
            )}
        </nav>

        {/* ROLE SIMULATOR (Top Right) */}
        <div className="role-switcher">
            <span className="role-label">View As:</span>
            <select 
                className="role-select"
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
            >
                <option value="Agent">Call Centre Agent</option>
                <option value="FieldLeader">Field Leader</option>
            </select>
        </div>
      </header>

      <main className={activeTab === 'assets' ? "full-canvas" : "workspace-grid"}>
        
        {/* VIEW 1: FIELD ASSETS (Conditional) */}
        {activeTab === 'assets' ? (
            <TeamCommand />
        ) : (
            /* VIEW 2: AGENT WORKSPACE (3-Column) */
            <>
                <div className="col-left">
                    <GeminiCommLink />
                </div>
                
                <div className="col-middle">
                    {/* Passes userRole so the Table can show extra "Admin" buttons if needed */}
                    <RevisitTable isOpen={true} role={userRole} />
                </div>
                
                <div className="col-right">
                    <div className="ai-widget-card">
                        <div className="widget-header">🤖 Active Intelligence</div>
                        <div className="health-ring"><div className="ring-text">94%<span>HEALTH</span></div></div>
                    </div>
                    <SmartSurvey />
                </div>
            </>
        )}
      </main>
    </div>
  );
}

export default App;
