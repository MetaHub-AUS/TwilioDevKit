const fs = require('fs');
const path = require('path');

console.log("🐜 Gemini Architect: Phase 2 - Engaging Intelligent Operations...");

const FILES = {
    // 1. UPGRADED BRAIN (Server with Team & Route Logic)
    "server/server.js": `
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;
const SITES_PATH = path.join(__dirname, 'data', 'sites.json');
const TEAMS_PATH = path.join(__dirname, 'data', 'teams.json');

// --- LOAD DATA ---
// Helper to safely read JSON
const readData = (p) => {
    if (!fs.existsSync(p)) return [];
    return JSON.parse(fs.readFileSync(p, 'utf8'));
};

// 1. BIO-MEMORY LOOKUP
app.get('/api/site/:id', (req, res) => {
    const requestedId = req.params.id.toUpperCase();
    console.log(\`🔎 Bio-Memory Access: \${requestedId}\`);
    const sites = readData(SITES_PATH);
    const site = sites.find(s => s.siteId === requestedId);
    
    if (site) {
        setTimeout(() => res.json(site), 400); // Simulate network
    } else {
        res.status(404).json({ message: 'Site not found' });
    }
});

// 2. TEAM COMMAND CENTER
app.get('/api/teams', (req, res) => {
    console.log("🚁 Fetching Field Assets...");
    res.json(readData(TEAMS_PATH));
});

// 3. ROUTE IMPACT SIMULATOR (The "Gemini Brain")
app.post('/api/simulate-booking', (req, res) => {
    const { siteId, time, teamType } = req.body;
    
    // Simulate complex AI calculation
    const efficiency = Math.floor(Math.random() * (100 - 70) + 70);
    const impact = efficiency > 90 ? "OPTIMAL" : efficiency > 80 ? "GOOD" : "HIGH_TRAVEL";
    
    res.json({
        efficiencyScore: efficiency,
        impactLabel: impact,
        travelTimeAdded: efficiency > 90 ? "5 mins" : "25 mins",
        nearestTech: "Team 60 (2km away)"
    });
});

app.listen(PORT, () => {
    console.log(\`\\n🔥 GeminiOps Center Online at http://localhost:\${PORT}\`);
});
`,

    // 2. NEW DATA: FIELD TEAMS
    "server/data/teams.json": `
[
    {
        "teamNumber": "60",
        "type": "UTV",
        "leader": "Sarah Connor",
        "status": "ACTIVE",
        "location": "Gold Coast - Sector 4",
        "skills": ["Rough Terrain", "Surveillance"],
        "battery": 85
    },
    {
        "teamNumber": "K9-2",
        "type": "K9",
        "leader": "Max Rockatansky",
        "status": "BUSY",
        "location": "Brisbane South",
        "skills": ["Odour Detection", "Rapid Scan"],
        "battery": 60
    },
    {
        "teamNumber": "AERIAL-1",
        "type": "DRONE",
        "leader": "Cipher",
        "status": "CHARGING",
        "location": "Depot HQ",
        "skills": ["Aerial Mapping", "Zone A Treatment"],
        "battery": 15
    }
]
`,

    // 3. MAIN APP UPGRADE (Tabbed Interface)
    "src/App.js": `
import React, { useState } from 'react';
import SiteLookup from './components/SiteLookup';
import TeamCommand from './components/TeamCommand';
import './styles.css';

function App() {
  const [activeTab, setActiveTab] = useState('booking');

  return (
    <div className="app-container">
      <header className="gov-header">
        <div className="gov-logo">🇦🇺 NFAEP</div>
        <div className="header-content">
            <div className="gov-title">National Fire Ant Eradication Program</div>
            <div className="system-badge">Gemini Ops v3.0</div>
        </div>
      </header>

      <nav className="mission-control-tabs">
        <button 
            className={\`tab-btn \${activeTab === 'booking' ? 'active' : ''}\`}
            onClick={() => setActiveTab('booking')}
        >
            📡 Revisit Booking
        </button>
        <button 
            className={\`tab-btn \${activeTab === 'teams' ? 'active' : ''}\`}
            onClick={() => setActiveTab('teams')}
        >
            🚁 Team Command
        </button>
      </nav>

      <main className="main-content">
        {activeTab === 'booking' ? <SiteLookup /> : <TeamCommand />}
      </main>
    </div>
  );
}

export default App;
`,

    // 4. SMART BOOKING (Upgraded SiteLookup with Voice & AI)
    "src/components/SiteLookup.js": `
import React, { useState, useEffect } from 'react';

const SiteLookup = () => {
    const [siteId, setSiteId] = useState('');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [simulating, setSimulating] = useState(false);
    const [simulation, setSimulation] = useState(null);
    const [note, setNote] = useState('');
    const [isListening, setIsListening] = useState(false);

    // Debounce Lookup
    useEffect(() => {
        const timer = setTimeout(() => {
            if (siteId.length >= 5) fetchSiteData(siteId);
        }, 800);
        return () => clearTimeout(timer);
    }, [siteId]);

    const fetchSiteData = async (id) => {
        setLoading(true);
        setData(null);
        setSimulation(null);
        try {
            const formattedId = id.toUpperCase().startsWith('SITE-') ? id : \`SITE-\${id}\`;
            const res = await fetch(\`http://localhost:3001/api/site/\${formattedId}\`);
            if (res.ok) setData(await res.json());
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const runSimulation = async (time) => {
        setSimulating(true);
        try {
            const res = await fetch('http://localhost:3001/api/simulate-booking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId, time, teamType: 'UTV' })
            });
            setSimulation(await res.json());
        } catch(e) {}
        finally { setSimulating(false); }
    }

    // Voice Dictation Logic
    const toggleListening = () => {
        if (!('webkitSpeechRecognition' in window)) return alert("Browser does not support speech");
        
        if (isListening) {
            setIsListening(false);
            return;
        }

        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-AU';
        recognition.start();
        setIsListening(true);

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setNote(prev => prev + " " + transcript);
            setIsListening(false);
        };
    };

    return (
        <div className="panel-container">
            <div className="panel-left">
                <h2>Bio-Memory Lookup</h2>
                <div className="input-group">
                    <label>SITE ID (Try SITE-49201)</label>
                    <input 
                        className="gov-input" 
                        value={siteId} 
                        onChange={e => setSiteId(e.target.value)} 
                        placeholder="Scan or Type ID..."
                        autoFocus
                    />
                    {loading && <div className="spinner">Searching Database...</div>}
                </div>

                {data && (
                    <div className="result-card fade-in">
                        <div className="badge-row">
                            <span className="badge" style={{backgroundColor: data.zoneColor}}>{data.zone}</span>
                            <span className="badge history">{data.accessHistory}</span>
                        </div>
                        <h3>{data.address}</h3>
                        
                        <div className="danger-zone">
                            <label>⚠️ HAZARDS DETECTED</label>
                            <ul>{data.hazards.map(h => <li key={h}>{h}</li>)}</ul>
                        </div>

                        <div className="booking-section">
                            <label>Select Time Slot</label>
                            <div className="time-grid">
                                {['08:00', '10:30', '13:00'].map(time => (
                                    <button 
                                        key={time} 
                                        className="time-btn"
                                        onClick={() => runSimulation(time)}
                                    >
                                        {time}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="input-group">
                            <label>Access Notes (Voice Enabled)</label>
                            <div className="voice-input-wrapper">
                                <textarea 
                                    className="gov-textarea" 
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                />
                                <button 
                                    className={\`mic-btn \${isListening ? 'listening' : ''}\`}
                                    onClick={toggleListening}
                                >
                                    {isListening ? '🛑' : '🎙️'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="panel-right">
                {simulating && <div className="analyzing">🤖 Gemini RouteBrain is analyzing traffic & schedules...</div>}
                
                {simulation && (
                    <div className="ai-insight-card fade-in">
                        <h3>Route Impact Analysis</h3>
                        <div className="score-ring" style={{
                            borderColor: simulation.efficiencyScore > 80 ? '#28a745' : '#f39c12'
                        }}>
                            {simulation.efficiencyScore}%
                            <span>Efficiency</span>
                        </div>
                        <div className="insight-details">
                            <p><strong>Impact:</strong> {simulation.impactLabel}</p>
                            <p><strong>Added Travel:</strong> {simulation.travelTimeAdded}</p>
                            <p><strong>Assigned:</strong> {simulation.nearestTech}</p>
                        </div>
                        <button className="gov-btn primary">CONFIRM OPTIMIZED BOOKING</button>
                    </div>
                )}
                
                {!simulation && !simulating && (
                    <div className="placeholder-state">
                        <div className="icon">🧠</div>
                        <p>Select a time slot to see AI Route Predictions</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SiteLookup;
`,

    // 5. NEW: TEAM COMMAND (Visual Dashboard)
    "src/components/TeamCommand.js": `
import React, { useState, useEffect } from 'react';

const TeamCommand = () => {
    const [teams, setTeams] = useState([]);

    useEffect(() => {
        fetch('http://localhost:3001/api/teams')
            .then(res => res.json())
            .then(setTeams)
            .catch(e => console.error(e));
    }, []);

    return (
        <div className="team-grid">
            {teams.map(team => (
                <div key={team.teamNumber} className="team-card">
                    <div className="team-header">
                        <span className="team-id">Unit {team.teamNumber}</span>
                        <span className={\`status-dot \${team.status}\`}></span>
                    </div>
                    <div className="team-type">{team.type} UNIT</div>
                    <div className="team-details">
                        <p><strong>Leader:</strong> {team.leader}</p>
                        <p><strong>Loc:</strong> {team.location}</p>
                        <div className="skill-tags">
                            {team.skills.map(s => <span key={s}>{s}</span>)}
                        </div>
                    </div>
                    <div className="battery-bar">
                        <div className="level" style={{width: \`\${team.battery}%\`}}></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TeamCommand;
`,

    // 6. STYLES UPGRADE
    "src/styles.css": `
:root { --teal: #008080; --dark: #1E293B; --light: #f4f7f6; }
body { margin: 0; font-family: 'Roboto', sans-serif; background: var(--light); color: #333; }
.app-container { height: 100vh; display: flex; flex-direction: column; }

/* Header */
.gov-header { background: var(--teal); color: white; padding: 15px 30px; display: flex; align-items: center; }
.gov-logo { font-size: 24px; font-weight: bold; padding-right: 20px; border-right: 1px solid rgba(255,255,255,0.3); margin-right: 20px; }
.gov-title { font-weight: 500; font-size: 18px; }
.system-badge { background: rgba(0,0,0,0.2); padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-top: 4px; display: inline-block;}

/* Navigation */
.mission-control-tabs { background: #005f5f; padding: 0 30px; display: flex; gap: 10px; }
.tab-btn { background: none; border: none; color: rgba(255,255,255,0.7); padding: 15px 20px; cursor: pointer; font-weight: bold; border-bottom: 3px solid transparent; }
.tab-btn.active { color: white; border-bottom-color: #01BAEF; }

/* Layout */
.main-content { padding: 30px; max-width: 1200px; margin: 0 auto; width: 100%; box-sizing: border-box; }
.panel-container { display: flex; gap: 30px; }
.panel-left { flex: 2; background: white; padding: 25px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
.panel-right { flex: 1; }

/* Inputs */
.gov-input, .gov-textarea { width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 4px; font-size: 16px; margin-top: 5px; box-sizing: border-box;}
.gov-input:focus, .gov-textarea:focus { border-color: var(--teal); outline: none; }
.input-group { margin-bottom: 20px; }
.gov-textarea { height: 80px; resize: none; }

/* Voice Input */
.voice-input-wrapper { position: relative; }
.mic-btn { position: absolute; bottom: 10px; right: 10px; background: #eee; border: none; border-radius: 50%; width: 35px; height: 35px; cursor: pointer; transition: 0.3s; }
.mic-btn:hover { background: #ddd; }
.mic-btn.listening { background: #ffcccc; animation: pulse 1s infinite; }

/* Team Cards */
.team-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
.team-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-top: 4px solid var(--teal); }
.team-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.team-id { font-weight: bold; font-size: 18px; }
.team-type { font-size: 12px; font-weight: bold; color: #666; background: #eee; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 10px; }
.status-dot { width: 10px; height: 10px; border-radius: 50%; background: #ccc; }
.status-dot.ACTIVE { background: #28a745; box-shadow: 0 0 5px #28a745; }
.status-dot.BUSY { background: #f39c12; }
.skill-tags span { background: #e0f2f1; color: var(--teal); font-size: 11px; padding: 2px 6px; border-radius: 4px; margin-right: 5px; }
.battery-bar { height: 4px; background: #eee; border-radius: 2px; margin-top: 15px; }
.battery-bar .level { height: 100%; background: var(--teal); border-radius: 2px; }

/* AI Insight Card */
.ai-insight-card { background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); color: white; padding: 25px; border-radius: 12px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
.score-ring { width: 100px; height: 100px; border: 8px solid #28a745; border-radius: 50%; display: flex; flex-direction: column; justify-content: center; align-items: center; margin: 0 auto 20px; font-size: 24px; font-weight: bold; }
.score-ring span { font-size: 10px; font-weight: normal; text-transform: uppercase; opacity: 0.7; }
.insight-details { text-align: left; background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; }
.gov-btn { width: 100%; padding: 12px; background: var(--teal); color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; }

/* Time Grid */
.time-grid { display: flex; gap: 10px; margin-top: 5px; }
.time-btn { flex: 1; padding: 10px; background: white; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; }
.time-btn:hover { background: #e0f2f1; border-color: var(--teal); }
.booking-section { margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }

/* Animations */
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
.fade-in { animation: fadeIn 0.5s ease-out; }
.spinner { color: var(--teal); font-weight: bold; font-size: 14px; margin-top: 5px; }
.analyzing { text-align: center; font-style: italic; color: #666; margin-bottom: 20px; animation: pulse 1.5s infinite; }
.placeholder-state { text-align: center; color: #999; margin-top: 50px; }
.placeholder-state .icon { font-size: 40px; margin-bottom: 10px; opacity: 0.5; }
`
};

// --- EXECUTION ---
async function installPhase2() {
    console.log("🛠️  Applying Gemini Upgrades...");

    for (const [filePath, content] of Object.entries(FILES)) {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(filePath, content);
        console.log(`✅ Updated: ${filePath}`);
    }

    console.log("\n🚀 Phase 2 Installed Successfully.");
    console.log("Restart the system to see the changes:");
    console.log("1. Press Ctrl+C to stop the current server.");
    console.log("2. Run: npm run dev");
}

installPhase2();