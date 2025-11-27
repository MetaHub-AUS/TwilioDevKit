const fs = require('fs');
const path = require('path');

console.log("🚁 Gemini Architect: Phase 8 - Restoring Field Asset Dashboard...");

const FILES = {
    // 1. APP.JS (Now supports layout switching)
    "src/App.js": `
import React, { useState } from 'react';
import GeminiCommLink from './components/GeminiCommLink';
import RevisitTable from './components/revisit/RevisitTable';
import SmartSurvey from './components/SmartSurvey';
import TeamCommand from './components/TeamCommand';
import './styles.css';

function App() {
  const [activeTab, setActiveTab] = useState('command');

  return (
    <div className="app-container">
      {/* HEADER */}
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
            <button 
                className={\`nav-tab \${activeTab === 'command' ? 'active' : ''}\`}
                onClick={() => setActiveTab('command')}
            >
                📡 Command Center
            </button>
            <button 
                className={\`nav-tab \${activeTab === 'assets' ? 'active' : ''}\`}
                onClick={() => setActiveTab('assets')}
            >
                🚁 Field Assets
            </button>
        </nav>
      </header>

      {/* CONDITIONAL LAYOUT RENDERING */}
      {activeTab === 'assets' ? (
          /* LAYOUT A: FULL WIDTH FIELD ASSETS */
          <main className="full-canvas">
              <TeamCommand />
          </main>
      ) : (
          /* LAYOUT B: 3-COLUMN COMMAND CENTER */
          <main className="workspace-grid">
            <div className="col-left">
                <GeminiCommLink />
            </div>
            <div className="col-middle">
                <RevisitTable isOpen={true} />
            </div>
            <div className="col-right">
                <div className="ai-widget-card">
                    <div className="widget-header">🤖 Active Intelligence</div>
                    <p className="widget-sub">Gemini is monitoring booking efficiency and hazard reports in real-time.</p>
                    <div className="health-ring">
                        <div className="ring-text">94%<span>HEALTH</span></div>
                    </div>
                </div>
                <SmartSurvey />
            </div>
          </main>
      )}
    </div>
  );
}

export default App;
`,

    // 2. TEAM COMMAND (Restored to the exact 'Image 1' style)
    "src/components/TeamCommand.js": `
import React, { useState, useEffect } from 'react';

const TeamCommand = () => {
    // Mock Data matching your screenshot
    const [teams] = useState([
        {
            id: '60', type: 'UTV UNIT', leader: 'Sarah Connor', loc: 'Gold Coast - Sector 4', 
            status: 'active', battery: 85, skills: ['Rough Terrain', 'Surveillance']
        },
        {
            id: 'K9-2', type: 'K9 UNIT', leader: 'Max Rockatansky', loc: 'Brisbane South', 
            status: 'busy', battery: 60, skills: ['Odour Detection', 'Rapid Scan']
        },
        {
            id: 'AERIAL-1', type: 'DRONE UNIT', leader: 'Cipher', loc: 'Depot HQ', 
            status: 'charging', battery: 15, skills: ['Aerial Mapping', 'Zone A Treatment']
        }
    ]);

    return (
        <div className="assets-container">
            {teams.map(team => (
                <div key={team.id} className="asset-card">
                    <div className="asset-header">
                        <span className="unit-id">Unit {team.id}</span>
                        <span className={\`status-dot \${team.status}\`}></span>
                    </div>
                    
                    <div className="asset-badge">{team.type}</div>
                    
                    <div className="asset-details">
                        <p><strong>Leader:</strong> {team.leader}</p>
                        <p><strong>Loc:</strong> {team.loc}</p>
                    </div>

                    <div className="asset-skills">
                        {team.skills.map(s => <span key={s} className="skill-pill">{s}</span>)}
                    </div>

                    <div className="battery-wrapper">
                        <div className="battery-level" style={{width: \`\${team.battery}%\`}}></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TeamCommand;
`,

    // 3. CSS (Merged: Command Center Styles + Restored Asset Styles)
    "src/styles.css": `
:root {
    --gemini-teal: #008080;
    --gemini-dark: #111827;
    --bg-gray: #f3f4f6;
    --card-white: #ffffff;
    --accent-green: #10b981;
    --accent-blue: #0ea5e9;
    --accent-orange: #f59e0b;
}

body { margin: 0; font-family: 'Inter', sans-serif; background-color: var(--bg-gray); color: #374151; height: 100vh; overflow: hidden; }

.app-container { display: flex; flex-direction: column; height: 100vh; }

/* --- LAYOUTS --- */
.workspace-grid { 
    display: grid; 
    grid-template-columns: 280px 1fr 320px; 
    gap: 20px; 
    padding: 20px; 
    flex: 1; 
    overflow: hidden;
}

.full-canvas {
    padding: 40px;
    overflow-y: auto;
    flex: 1;
}

/* --- HEADER --- */
.gemini-header { 
    background-color: var(--gemini-teal); 
    height: 60px; 
    display: flex; 
    align-items: center; 
    padding: 0 20px; 
    color: white; 
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.logo-area { display: flex; align-items: center; gap: 15px; }
.brand { font-size: 20px; font-weight: 800; margin: 0; }
.divider { width: 1px; height: 30px; background: rgba(255,255,255,0.3); }
.sub-brand .title { font-size: 12px; font-weight: 500; }
.sub-brand .badge { font-size: 10px; background: rgba(0,0,0,0.2); padding: 2px 6px; border-radius: 4px; display: inline-block; }

.header-nav { margin-left: 40px; display: flex; gap: 20px; height: 100%; }
.nav-tab { 
    background: transparent; 
    border: none; 
    color: rgba(255,255,255,0.7); 
    font-weight: 600; 
    font-size: 13px; 
    cursor: pointer; 
    border-bottom: 3px solid transparent;
    height: 100%;
}
.nav-tab.active { color: white; border-bottom-color: white; }

/* --- ASSET CARDS (Restored Style) --- */
.assets-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 30px;
    max-width: 1200px;
    margin: 0 auto;
}

.asset-card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    border-top: 4px solid var(--gemini-teal); /* That specific look */
    padding: 20px;
    display: flex;
    flex-direction: column;
}

.asset-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.unit-id { font-size: 18px; font-weight: 800; color: #111827; }
.status-dot { width: 10px; height: 10px; border-radius: 50%; }
.status-dot.active { background: var(--accent-green); box-shadow: 0 0 5px var(--accent-green); }
.status-dot.busy { background: var(--accent-orange); }
.status-dot.charging { background: #ccc; }

.asset-badge { 
    display: inline-block; 
    background: #f3f4f6; 
    color: #4b5563; 
    font-size: 10px; 
    font-weight: 700; 
    padding: 4px 8px; 
    border-radius: 4px; 
    text-transform: uppercase; 
    align-self: flex-start;
    margin-bottom: 15px;
}

.asset-details p { margin: 5px 0; font-size: 14px; color: #374151; }
.asset-skills { margin-top: 15px; display: flex; gap: 5px; flex-wrap: wrap; }
.skill-pill { background: #e0f2f1; color: var(--gemini-teal); font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 500; }

.battery-wrapper { 
    height: 4px; 
    background: #e5e7eb; 
    border-radius: 2px; 
    margin-top: 20px; 
    width: 100%;
}
.battery-level { height: 100%; background: var(--gemini-teal); border-radius: 2px; }


/* --- COMMAND CENTER STYLES (Preserved) --- */
.panel { border-radius: 8px; display: flex; flex-direction: column; height: 100%; overflow: hidden; }
.col-middle { display: flex; flex-direction: column; height: 100%; }
.col-right { display: flex; flex-direction: column; gap: 20px; height: 100%; }

.dark-panel { background: var(--gemini-dark); color: white; }
.comm-header-dark { padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center; }
.comm-header-dark h3 { margin: 0; font-size: 14px; font-weight: 600; }
.status-badge-dark { font-size: 11px; background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 12px; display: flex; align-items: center; gap: 5px; }
.status-badge-dark .dot { width: 6px; height: 6px; background: var(--accent-green); border-radius: 50%; }
.dark-pad { padding: 20px; }
.dark-input { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 10px; border-radius: 6px; margin-bottom: 20px; box-sizing: border-box; }
.dial-grid-dark { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
.dial-btn-dark { background: rgba(255,255,255,0.1); border: none; color: white; padding: 15px 0; border-radius: 6px; font-weight: 600; cursor: pointer; transition: 0.2s; }
.dial-btn-dark:hover { background: rgba(255,255,255,0.2); }
.call-btn-dark { width: 100%; background: var(--accent-green); border: none; color: white; padding: 12px; border-radius: 6px; font-weight: bold; cursor: pointer; }

.white-panel { background: white; }
.shadow-panel { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb; }
.gemini-card-header { background: var(--gemini-teal); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
.gemini-card-header h2 { margin: 0; font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 10px; }
.control-bar { padding: 20px; border-bottom: 1px solid #f3f4f6; }
.gov-input { width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; box-sizing: border-box; }

.slots-grid { padding: 20px; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 15px; overflow-y: auto; background: #f9fafb; flex: 1; }
.slot-card { background: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb; border-left: 4px solid var(--accent-green); display: flex; flex-direction: column;}
.slot-card.BOOKED { border-left-color: var(--accent-blue); background: #f0f9ff; }
.slot-time { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
.slot-status { font-size: 10px; text-transform: uppercase; color: #6b7280; margin-bottom: 10px; }
.ai-prediction-text { font-size: 10px; font-weight: 700; color: #d97706; text-transform: uppercase; margin-bottom: 10px; }
.analyze-btn { background: var(--gemini-teal); color: white; border: none; padding: 8px; width: 100%; border-radius: 4px; font-weight: 600; font-size: 12px; cursor: pointer; margin-top: auto; }
.job-tag { font-size: 12px; color: var(--accent-blue); font-weight: bold; margin-top: auto; }

.ai-widget-card { background: var(--gemini-dark); color: white; border-radius: 12px; padding: 25px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
.widget-header { font-weight: 700; margin-bottom: 10px; font-size: 14px; }
.widget-sub { font-size: 11px; color: #9ca3af; margin-bottom: 20px; line-height: 1.4; }
.health-ring { width: 80px; height: 80px; border: 6px solid var(--accent-green); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto; }
.ring-text { font-size: 18px; font-weight: 800; text-align: center; line-height: 1; }
.ring-text span { display: block; font-size: 8px; font-weight: 400; margin-top: 2px; }

.survey-panel-wrapper { padding: 20px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.1); flex: 1; }
.survey-header { font-weight: 700; font-size: 14px; margin-bottom: 15px; color: var(--gemini-teal); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
.survey-body { display: flex; flex-direction: column; gap: 15px; height: 100%; }
.voice-fill-btn { width: 100%; background: #e0e7ff; color: #4338ca; border: none; padding: 10px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: 0.2s; }
.voice-fill-btn:hover { background: #c7d2fe; }
.gov-select { width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; }
.sentiment-row { display: flex; gap: 5px; }
.sent-pill { flex: 1; border: 1px solid #e5e7eb; background: white; padding: 6px; font-size: 11px; border-radius: 15px; cursor: pointer; }
.sent-pill.active { background: #f3f4f6; border-color: #9ca3af; font-weight: bold; }
.submit-btn-teal { margin-top: auto; width: 100%; background: var(--gemini-teal); color: white; border: none; padding: 10px; border-radius: 6px; font-weight: bold; cursor: pointer; }

.modal-overlay { position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 999; }
.mini-modal { background: white; width: 400px; border-radius: 8px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
.mini-header { background: #f3f4f6; padding: 15px; font-weight: 700; border-bottom: 1px solid #e5e7eb; }
.mini-body { padding: 20px; display: flex; flex-direction: column; gap: 15px; }
.action-row { display: flex; gap: 10px; margin-top: 10px; }
.gov-btn { flex: 1; padding: 10px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
.gov-btn.primary { background: var(--gemini-teal); color: white; }
.gov-btn.secondary { background: #e5e7eb; color: #374151; }
.mic-btn { width: 100%; background: #fff; border: 1px solid #d1d5db; padding: 10px; border-radius: 6px; cursor: pointer; display: flex; justify-content: center; gap: 5px; }
.mic-btn.listening { background: #fee2e2; border-color: #ef4444; color: #ef4444; }
.hazard-tag { background: #fef3c7; color: #b45309; padding: 8px; border-radius: 4px; font-size: 12px; font-weight: 700; text-align: center; }
`
};

// --- EXECUTION ---
async function installPhase8() {
    console.log("🔧 Restoring Field Assets to Original Vision...");

    for (const [filePath, content] of Object.entries(FILES)) {
        const fullPath = path.join(__dirname, filePath);
        const dir = path.dirname(fullPath);
        
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        
        fs.writeFileSync(fullPath, content);
        console.log("✅ Applied: " + filePath);
    }

    console.log("\n🚀 Phase 8 Complete.");
    console.log("1. Restart server ('npm run dev')");
    console.log("2. Tab 1: Full Command Center (3-Col)");
    console.log("3. Tab 2: Full Width Asset Dashboard (Original Look)");
}

installPhase8();