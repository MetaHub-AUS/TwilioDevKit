const fs = require('fs');
const path = require('path');

console.log("🚀 Gemini Architect: Phase 7 (Windows Fixed) - FINAL ASSEMBLY...");

const FILES = {
    // 1. APP STRUCTURE (3-Column Layout, but Gemini Header)
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
      {/* HEADER - THE GEMINI TEAL LOOK */}
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

      {/* 3-COLUMN LAYOUT */}
      <main className="workspace-grid">
        {/* LEFT: AMAZON CONNECT CCP (Dark Mode) */}
        <div className="col-left">
            <GeminiCommLink />
        </div>
        
        {/* MIDDLE: THE COMMAND CENTER CARD */}
        <div className="col-middle">
            {activeTab === 'command' ? <RevisitTable isOpen={true} /> : <TeamCommand />}
        </div>
        
        {/* RIGHT: INTELLIGENCE + SURVEY */}
        <div className="col-right">
            {/* 1. The Active Intelligence Widget */}
            <div className="ai-widget-card">
                <div className="widget-header">🤖 Active Intelligence</div>
                <p className="widget-sub">Gemini is monitoring booking efficiency and hazard reports in real-time.</p>
                <div className="health-ring">
                    <div className="ring-text">94%<span>HEALTH</span></div>
                </div>
            </div>

            {/* 2. The Smart Survey */}
            <SmartSurvey />
        </div>
      </main>
    </div>
  );
}

export default App;
`,

    // 2. LEFT COLUMN: DARK MODE COMM LINK
    "src/components/GeminiCommLink.js": `
import React, { useState } from 'react';

const GeminiCommLink = () => {
    const [status, setStatus] = useState('Available');
    const [number, setNumber] = useState('');

    const append = (n) => setNumber(prev => prev + n);

    return (
        <div className="panel dark-panel">
            <div className="comm-header-dark">
                <h3>📞 Comm Link</h3>
                <div className="status-badge-dark">
                    <span className="dot green"></span> {status}
                </div>
            </div>

            {/* IFRAME CONTAINER WOULD GO HERE */}
            <div id="ccp-container" style={{display:'none'}}></div>

            <div className="dark-pad">
                <input 
                    className="dark-input"
                    value={number} 
                    onChange={e => setNumber(e.target.value)}
                    placeholder="Enter Number..."
                />
                
                <div className="dial-grid-dark">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map(n => (
                        <button key={n} className="dial-btn-dark" onClick={() => append(n)}>{n}</button>
                    ))}
                </div>

                <div className="call-actions">
                    <button className="call-btn-dark">Call</button>
                </div>
            </div>
        </div>
    );
};
export default GeminiCommLink;
`,

    // 3. MIDDLE COLUMN: REVISIT TABLE (The "White Card" Look)
    "src/components/revisit/RevisitTable.js": `
import React, { useState, useEffect } from 'react';
import { DataStore } from '../../utils/mockDataStore';
import { AppointmentSlot, SlotStatus } from '../../models';
import { createSiteDate, predictSlotEfficiency } from '../../utils/geminiAi';

const toAwsDate = (date) => date.toISOString().split('T')[0];

const RevisitTable = ({ isOpen }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [siteId, setSiteId] = useState('Gold Coast');
    const [slots, setSlots] = useState([]);
    const [bookingModal, setBookingModal] = useState(null);
    const [propSize, setPropSize] = useState("0.5");
    const [voiceText, setVoiceText] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [detectedHazards, setDetectedHazards] = useState([]);

    useEffect(() => {
        const loadSlots = async () => {
            const times = ['07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00'];
            const mockSlots = times.map(t => ({ 
                time: t, 
                status: Math.random() > 0.7 ? SlotStatus.BOOKED : SlotStatus.OPEN,
                jobNumber: Math.random() > 0.8 ? 'JOB-999' : null
            }));
            setSlots(mockSlots);
        };
        loadSlots();
    }, [selectedDate, siteId]);

    const handleBook = async () => {
        setSlots(prev => prev.map(s => s.time === bookingModal.time ? {...s, status: SlotStatus.BOOKED} : s));
        setBookingModal(null);
    };

    const toggleVoice = () => {
        setIsListening(!isListening);
        if (!isListening) {
            setTimeout(() => {
                setVoiceText("Warning, large dog at the back.");
                setDetectedHazards(["K9_HAZARD"]);
                setIsListening(false);
            }, 2000);
        }
    };

    return (
        <div className="panel white-panel shadow-panel">
            <div className="gemini-card-header">
                <h2>📡 Gemini Command Center</h2>
            </div>

            <div className="control-bar">
                <input className="gov-input" value={siteId} onChange={e => setSiteId(e.target.value)} />
            </div>

            <div className="slots-grid">
                {slots.map(slot => {
                    const prediction = predictSlotEfficiency(slot.time, "Generic");
                    const isBooked = slot.status === SlotStatus.BOOKED;

                    return (
                        <div key={slot.time} className={\`slot-card \${slot.status}\`}>
                            <div className="slot-time">{slot.time}</div>
                            <div className="slot-status">{slot.status}</div>
                            
                            {!isBooked && (
                                <div className="ai-prediction-text">
                                    {prediction.rating}
                                </div>
                            )}

                            {isBooked ? (
                                <div className="job-tag">Job #{slot.jobNumber}</div>
                            ) : (
                                <button className="analyze-btn" onClick={() => setBookingModal(slot)}>
                                    Analyze & Book
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {bookingModal && (
                <div className="modal-overlay">
                    <div className="mini-modal">
                        <div className="mini-header">Confirm Booking: {bookingModal.time}</div>
                        <div className="mini-body">
                            <div className="input-group">
                                <label>Property Size (Ha)</label>
                                <input type="number" className="gov-input" value={propSize} onChange={e => setPropSize(e.target.value)} />
                            </div>
                            <div className="voice-area">
                                <button className={\`mic-btn \${isListening ? 'listening' : ''}\`} onClick={toggleVoice}>
                                    {isListening ? '🛑' : '🎙️ Add Voice Note'}
                                </button>
                                {voiceText && <div className="voice-transcript">"{voiceText}"</div>}
                                {detectedHazards.length > 0 && <div className="hazard-tag">⚠️ {detectedHazards[0]}</div>}
                            </div>
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

    // 4. RIGHT COLUMN: SURVEY (Clean Card)
    "src/components/SmartSurvey.js": `
import React, { useState } from 'react';

const SmartSurvey = () => {
    const [category, setCategory] = useState('');
    const [sentiment, setSentiment] = useState('Neutral');

    return (
        <div className="panel white-panel survey-panel-wrapper">
            <div className="survey-header">Post-Call Survey</div>
            <div className="survey-body">
                <button className="voice-fill-btn">✨ Auto-Fill with Voice</button>

                <div className="survey-section">
                    <label>Category</label>
                    <select className="gov-select" onChange={e => setCategory(e.target.value)}>
                        <option>Select Category...</option>
                        <option>SAR - Suspect Ant Report</option>
                        <option>TAR - Treatment</option>
                        <option>Aerial Operations</option>
                        <option>Complaint</option>
                    </select>
                </div>

                <div className="survey-section">
                    <label>Sentiment</label>
                    <div className="sentiment-row">
                        {['Positive', 'Neutral', 'Negative'].map(s => (
                            <button 
                                key={s}
                                className={\`sent-pill \${s} \${sentiment===s?'active':''}\`}
                                onClick={() => setSentiment(s)}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                <button className="submit-btn-teal">Submit</button>
            </div>
        </div>
    );
};
export default SmartSurvey;
`,

    // 5. STYLES (The Exact "Gemini Image" Look)
    "src/styles.css": `
:root {
    --gemini-teal: #008080;
    --gemini-dark: #111827;
    --bg-gray: #f3f4f6;
    --card-white: #ffffff;
    --accent-green: #10b981;
    --accent-blue: #0ea5e9;
}

body { margin: 0; font-family: 'Inter', sans-serif; background-color: var(--bg-gray); color: #374151; height: 100vh; overflow: hidden; }

/* LAYOUT */
.app-container { display: flex; flex-direction: column; height: 100vh; }
.workspace-grid { 
    display: grid; 
    grid-template-columns: 280px 1fr 320px; 
    gap: 20px; 
    padding: 20px; 
    flex: 1; 
    overflow: hidden;
}

/* HEADER (Teal, like the image) */
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

/* PANELS */
.panel { border-radius: 8px; display: flex; flex-direction: column; height: 100%; overflow: hidden; }
.col-middle { display: flex; flex-direction: column; height: 100%; }
.col-right { display: flex; flex-direction: column; gap: 20px; height: 100%; }

/* LEFT: DARK COMM LINK */
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

/* MIDDLE: COMMAND CENTER (White Card) */
.white-panel { background: white; }
.shadow-panel { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb; }
.gemini-card-header { 
    background: var(--gemini-teal); 
    color: white; 
    padding: 20px; 
    border-radius: 8px 8px 0 0; 
}
.gemini-card-header h2 { margin: 0; font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 10px; }
.control-bar { padding: 20px; border-bottom: 1px solid #f3f4f6; }
.gov-input { width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; box-sizing: border-box; }

.slots-grid { 
    padding: 20px; 
    display: grid; 
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); 
    gap: 15px; 
    overflow-y: auto; 
    background: #f9fafb; 
    flex: 1; 
}
.slot-card { 
    background: white; 
    padding: 15px; 
    border-radius: 6px; 
    border: 1px solid #e5e7eb; 
    border-left: 4px solid var(--accent-green); 
    display: flex; 
    flex-direction: column;
}
.slot-card.BOOKED { border-left-color: var(--accent-blue); background: #f0f9ff; }
.slot-time { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
.slot-status { font-size: 10px; text-transform: uppercase; color: #6b7280; margin-bottom: 10px; }
.ai-prediction-text { font-size: 10px; font-weight: 700; color: #d97706; text-transform: uppercase; margin-bottom: 10px; }
.analyze-btn { background: var(--gemini-teal); color: white; border: none; padding: 8px; width: 100%; border-radius: 4px; font-weight: 600; font-size: 12px; cursor: pointer; margin-top: auto; }
.job-tag { font-size: 12px; color: var(--accent-blue); font-weight: bold; margin-top: auto; }

/* RIGHT: WIDGETS */
.ai-widget-card { 
    background: var(--gemini-dark); 
    color: white; 
    border-radius: 12px; 
    padding: 25px; 
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); 
}
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

/* MODAL */
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
async function installPhase7() {
    console.log("🔧 Assembling the Final Architecture...");

    for (const [filePath, content] of Object.entries(FILES)) {
        // Windows-safe path handling
        const fullPath = path.join(__dirname, filePath);
        const dir = path.dirname(fullPath);
        
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(fullPath, content);
        
        // Safe logging without complex template interpolation
        console.log("✅ Assembled: " + filePath);
    }

    console.log("\n🚀 SYSTEM READY.");
    console.log("1. Restart server ('npm run dev')");
    console.log("2. Enjoy the 3-Column Layout with Gemini Aesthetics!");
}

installPhase7();