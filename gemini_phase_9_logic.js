const fs = require('fs');
const path = require('path');

console.log("🧠 Gemini Architect: Phase 9 - Logic, Tables, and Roles...");

const FILES = {
    // 1. APP.JS - Now with ROLE-BASED CONDITIONAL RENDERING
    "src/App.js": `
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
                className={\`nav-tab \${activeTab === 'command' ? 'active' : ''}\`}
                onClick={() => setActiveTab('command')}
            >
                📡 Command Center
            </button>
            
            {/* Only Field Leaders can access the Asset Dashboard */}
            {userRole === 'FieldLeader' && (
                <button 
                    className={\`nav-tab \${activeTab === 'assets' ? 'active' : ''}\`}
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
`,

    // 2. REVISIT TABLE - Now with LIST VIEW TOGGLE (The "Table" you asked for)
    "src/components/revisit/RevisitTable.js": `
import React, { useState, useEffect } from 'react';
import { AppointmentSlot, SlotStatus } from '../../models';
import { predictSlotEfficiency } from '../../utils/geminiAi';

const RevisitTable = ({ isOpen }) => {
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [slots, setSlots] = useState([]);
    const [bookingModal, setBookingModal] = useState(null);
    const [siteId, setSiteId] = useState('Gold Coast');

    useEffect(() => {
        const loadSlots = async () => {
            const times = ['07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00'];
            const mockSlots = times.map(t => ({ 
                time: t, 
                status: Math.random() > 0.7 ? SlotStatus.BOOKED : SlotStatus.OPEN,
                jobNumber: Math.random() > 0.8 ? 'JOB-' + Math.floor(Math.random()*1000) : null,
                address: '123 Fake St, Southport', // Added for Table View
                team: 'Team 60' // Added for Table View
            }));
            setSlots(mockSlots);
        };
        loadSlots();
    }, [siteId]);

    const handleBook = () => {
        setSlots(prev => prev.map(s => s.time === bookingModal.time ? {...s, status: SlotStatus.BOOKED, jobNumber: 'JOB-NEW'} : s));
        setBookingModal(null);
    };

    return (
        <div className="panel white-panel shadow-panel">
            <div className="gemini-card-header">
                <h2>📡 Gemini Command Center</h2>
                {/* VIEW TOGGLE BUTTONS */}
                <div className="view-toggle">
                    <button 
                        className={\`toggle-btn \${viewMode === 'grid' ? 'active' : ''}\`}
                        onClick={() => setViewMode('grid')}
                    >⊞ Grid</button>
                    <button 
                        className={\`toggle-btn \${viewMode === 'list' ? 'active' : ''}\`}
                        onClick={() => setViewMode('list')}
                    >☰ Table</button>
                </div>
            </div>

            <div className="control-bar">
                <input className="gov-input" value={siteId} onChange={e => setSiteId(e.target.value)} />
            </div>

            {/* CONDITIONAL RENDERING: GRID vs LIST */}
            {viewMode === 'grid' ? (
                <div className="slots-grid">
                    {slots.map(slot => {
                        const prediction = predictSlotEfficiency(slot.time);
                        const isBooked = slot.status === SlotStatus.BOOKED;
                        return (
                            <div key={slot.time} className={\`slot-card \${slot.status}\`}>
                                <div className="slot-time">{slot.time}</div>
                                <div className="slot-status">{slot.status}</div>
                                {!isBooked && <div className="ai-prediction-text">{prediction.rating}</div>}
                                {isBooked ? <div className="job-tag">{slot.jobNumber}</div> : 
                                    <button className="analyze-btn" onClick={() => setBookingModal(slot)}>Analyze</button>
                                }
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* THE TABLE VIEW (Audit Requirement) */
                <div className="table-container">
                    <table className="gemini-table">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Status</th>
                                <th>Job #</th>
                                <th>Address</th>
                                <th>Est. Team</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {slots.map(slot => (
                                <tr key={slot.time} className={slot.status === 'BOOKED' ? 'row-booked' : ''}>
                                    <td className="time-cell">{slot.time}</td>
                                    <td><span className={\`status-pill \${slot.status}\`}>{slot.status}</span></td>
                                    <td>{slot.jobNumber || '-'}</td>
                                    <td>{slot.address}</td>
                                    <td>{slot.team}</td>
                                    <td>
                                        {slot.status === 'OPEN' && (
                                            <button className="table-btn" onClick={() => setBookingModal(slot)}>Book</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* BOOKING MODAL (Kept same) */}
            {bookingModal && (
                <div className="modal-overlay">
                    <div className="mini-modal">
                        <div className="mini-header">Confirm Booking: {bookingModal.time}</div>
                        <div className="mini-body">
                            <p>Confirm booking for {siteId}?</p>
                            <div className="action-row">
                                <button className="gov-btn primary" onClick={handleBook}>Confirm</button>
                                <button className="gov-btn secondary" onClick={() => setBookingModal(null)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default RevisitTable;
`,

    // 3. STYLES (Adding the Table & Role Switcher styles)
    "src/styles.css": `
/* ... (Keep previous CSS variables) ... */
:root {
    --gemini-teal: #008080;
    --gemini-dark: #111827;
    --bg-gray: #f3f4f6;
    --accent-green: #10b981;
    --accent-blue: #0ea5e9;
}
body { margin: 0; font-family: 'Inter', sans-serif; background-color: var(--bg-gray); color: #374151; height: 100vh; overflow: hidden; }

/* LAYOUT */
.app-container { display: flex; flex-direction: column; height: 100vh; }
.workspace-grid { display: grid; grid-template-columns: 280px 1fr 320px; gap: 20px; padding: 20px; flex: 1; overflow: hidden; }
.full-canvas { padding: 40px; overflow-y: auto; flex: 1; }

/* HEADER & ROLE SWITCHER */
.gemini-header { background-color: var(--gemini-teal); height: 60px; display: flex; align-items: center; padding: 0 20px; color: white; justify-content: space-between; }
.logo-area { display: flex; align-items: center; gap: 15px; }
.brand { font-size: 20px; font-weight: 800; margin: 0; }
.header-nav { display: flex; gap: 20px; height: 100%; margin-right: auto; margin-left: 40px; }
.nav-tab { background: transparent; border: none; color: rgba(255,255,255,0.7); font-weight: 600; font-size: 13px; cursor: pointer; border-bottom: 3px solid transparent; height: 100%; }
.nav-tab.active { color: white; border-bottom-color: white; }

.role-switcher { display: flex; align-items: center; gap: 10px; background: rgba(0,0,0,0.2); padding: 5px 10px; border-radius: 6px; }
.role-label { font-size: 11px; font-weight: 600; text-transform: uppercase; opacity: 0.8; }
.role-select { background: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; cursor: pointer; color: var(--gemini-teal); }

/* VIEW TOGGLES (Grid vs List) */
.view-toggle { display: flex; background: rgba(255,255,255,0.2); border-radius: 4px; overflow: hidden; margin-left: auto; }
.toggle-btn { background: transparent; border: none; color: rgba(255,255,255,0.8); padding: 5px 10px; font-size: 11px; cursor: pointer; }
.toggle-btn.active { background: white; color: var(--gemini-teal); font-weight: bold; }

/* DATA TABLE STYLES (The "Audit" Requirement) */
.table-container { padding: 0; overflow-y: auto; flex: 1; }
.gemini-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.gemini-table th { background: #f9fafb; padding: 12px 15px; text-align: left; font-weight: 600; color: #6b7280; border-bottom: 1px solid #e5e7eb; position: sticky; top: 0; }
.gemini-table td { padding: 12px 15px; border-bottom: 1px solid #f3f4f6; color: #374151; }
.gemini-table tr:hover { background: #f9fafb; }
.row-booked { background: #f0f9ff; }
.time-cell { font-weight: 700; color: var(--gemini-dark); }
.status-pill { padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
.status-pill.OPEN { background: #d1fae5; color: #065f46; }
.status-pill.BOOKED { background: #e0f2fe; color: #0369a1; }
.table-btn { background: var(--gemini-teal); color: white; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600; }

/* PREVIOUS STYLES (Cards, Panels, etc.) */
.panel { border-radius: 8px; display: flex; flex-direction: column; height: 100%; overflow: hidden; background: white; border: 1px solid #e5e7eb; }
.col-middle { display: flex; flex-direction: column; height: 100%; }
.col-right { display: flex; flex-direction: column; gap: 20px; height: 100%; }
.dark-panel { background: var(--gemini-dark); color: white; }
.gemini-card-header { background: var(--gemini-teal); color: white; padding: 15px 20px; display: flex; align-items: center; }
.gemini-card-header h2 { margin: 0; font-size: 16px; font-weight: 700; }
.control-bar { padding: 15px; border-bottom: 1px solid #f3f4f6; }
.gov-input { width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; }
.slots-grid { padding: 20px; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 15px; overflow-y: auto; background: #f9fafb; flex: 1; }
.slot-card { background: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb; border-left: 4px solid var(--accent-green); }
.slot-card.BOOKED { border-left-color: var(--accent-blue); background: #f0f9ff; }
.ai-prediction-text { font-size: 10px; font-weight: 700; color: #d97706; text-transform: uppercase; }
.job-tag { font-size: 12px; color: var(--accent-blue); font-weight: bold; }
.analyze-btn { background: var(--gemini-teal); color: white; border: none; padding: 6px; width: 100%; border-radius: 4px; cursor: pointer; margin-top: 10px; font-size: 12px; }
.modal-overlay { position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 999; }
.mini-modal { background: white; width: 400px; padding: 20px; border-radius: 8px; }
.action-row { display: flex; gap: 10px; margin-top: 15px; }
.gov-btn { flex: 1; padding: 8px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
.gov-btn.primary { background: var(--gemini-teal); color: white; }
.gov-btn.secondary { background: #e5e7eb; }
/* Keep other styles like Comm Link / Survey from previous phases implicitly or add them here if missing */
.comm-header-dark { padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; } 
.dark-pad { padding: 20px; } .dark-input { width: 100%; padding: 10px; background: rgba(255,255,255,0.1); border:none; color: white; margin-bottom: 15px; }
.dial-grid-dark { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; } .dial-btn-dark { background: rgba(255,255,255,0.1); border:none; color: white; padding: 10px; }
.call-btn-dark { width: 100%; background: var(--accent-green); border:none; padding: 10px; margin-top: 15px; font-weight: bold; color: white; }
.ai-widget-card { background: var(--gemini-dark); color: white; padding: 20px; border-radius: 8px; }
.survey-panel-wrapper { padding: 20px; } .submit-btn-teal { width: 100%; background: var(--gemini-teal); color: white; border: none; padding: 10px; margin-top: 20px; }
`
};

// --- EXECUTION ---
async function installPhase9() {
    console.log("⚙️ Installing Logic Layer (Roles + Tables)...");

    for (const [filePath, content] of Object.entries(FILES)) {
        const fullPath = path.join(__dirname, filePath);
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(fullPath, content);
        console.log("✅ Updated: " + filePath);
    }

    console.log("\n🚀 Phase 9 Complete.");
    console.log("1. Restart 'npm run dev'");
    console.log("2. Look at the Header: Change 'View As' to see different screens.");
    console.log("3. Look at Command Center: Click '☰ Table' to see the list view.");
}

installPhase9();