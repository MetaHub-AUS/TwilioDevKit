const fs = require('fs');
const path = require('path');

console.log("💎 Gemini Architect: Phase 6 (Fixed) - RESTORING THE BEAUTY...");

const FILES = {
    // 1. THE STYLES (TOTAL OVERHAUL - Modern, Clean, High-Tech)
    "src/styles.css": `
:root {
    --primary: #008080;
    --primary-dark: #005f5f;
    --accent: #01BAEF;
    --bg-color: #f0f4f8;
    --panel-bg: #ffffff;
    --text-main: #2d3748;
    --text-muted: #718096;
    --danger: #e53e3e;
    --success: #38a169;
    --radius: 12px;
    --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

body { margin: 0; font-family: 'Inter', 'Roboto', sans-serif; background-color: var(--bg-color); color: var(--text-main); height: 100vh; overflow: hidden; }

/* LAYOUT */
.app-container { display: flex; flex-direction: column; height: 100vh; }

.workspace-grid { 
    display: grid; 
    grid-template-columns: 300px 1fr 350px; 
    gap: 20px; 
    padding: 20px; 
    flex: 1; 
    overflow: hidden;
    max-width: 1800px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
}

/* HEADER - Modern & Float */
.est-header { 
    background: white;
    height: 70px; 
    display: flex; 
    align-items: center; 
    justify-content: space-between; 
    padding: 0 30px; 
    box-shadow: var(--shadow);
    z-index: 10;
}
.est-logo { 
    font-size: 22px; 
    font-weight: 800; 
    background: linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -0.5px;
}
.header-left, .header-right { display: flex; align-items: center; gap: 15px; }

/* Header Metrics - Pill Design */
.header-metrics { display: flex; gap: 10px; background: #f7fafc; padding: 5px; border-radius: 30px; border: 1px solid #e2e8f0; }
.metric-pill { display: flex; flex-direction: column; align-items: center; padding: 0 15px; border-right: 1px solid #e2e8f0; line-height: 1.1; }
.metric-pill:last-child { border: none; }
.metric-pill .label { font-size: 10px; font-weight: 700; color: var(--text-muted); letter-spacing: 0.5px; }
.metric-pill .value { font-size: 18px; font-weight: 800; color: var(--primary); }

/* Navigation Buttons */
.nav-btn { background: transparent; border: none; font-weight: 600; color: var(--text-muted); cursor: pointer; padding: 8px 12px; border-radius: 8px; transition: 0.2s; }
.nav-btn:hover { background: #edf2f7; color: var(--primary); }

.tool-btn { 
    background: white; 
    border: 1px solid #e2e8f0; 
    color: var(--text-main); 
    padding: 8px 16px; 
    border-radius: 8px; 
    font-weight: 600; 
    cursor: pointer; 
    transition: 0.2s; 
    font-size: 13px;
}
.tool-btn.active { 
    background: var(--primary); 
    color: white; 
    border-color: var(--primary); 
    box-shadow: 0 2px 10px rgba(0, 128, 128, 0.3);
}
.logout-btn { background: #fff5f5; color: var(--danger); border: 1px solid #feb2b2; padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; }

/* GENERIC PANELS - Card Style */
.panel { 
    background: var(--panel-bg); 
    border-radius: var(--radius); 
    box-shadow: var(--shadow); 
    display: flex; 
    flex-direction: column; 
    height: 100%; 
    overflow: hidden; 
    border: 1px solid white;
}

/* LEFT COLUMN: COMM LINK (The HUD) */
.comm-panel { background: #2D3748; color: white; border: none; } /* Dark Mode for Comm */
.comm-header { padding: 20px; display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); }
.status-badge { background: #48BB78; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; display: flex; align-items: center; gap: 6px; }
.status-badge .dot { width: 8px; height: 8px; background: white; border-radius: 50%; display: block; }

.number-pad-section { padding: 20px; flex: 1; display: flex; flex-direction: column; }
.input-display { 
    background: rgba(0,0,0,0.3); 
    border: 1px solid rgba(255,255,255,0.1); 
    border-radius: 12px; 
    padding: 15px; 
    margin-bottom: 25px; 
    display: flex; 
    align-items: center; 
}
.input-display input { background: transparent; border: none; color: white; font-size: 20px; width: 100%; margin-left: 10px; font-family: monospace; letter-spacing: 2px; }

.dial-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; width: 100%; margin-bottom: auto; }
.dial-btn { 
    background: rgba(255,255,255,0.1); 
    border: none; 
    border-radius: 50%; 
    width: 60px; 
    height: 60px; 
    color: white; 
    font-size: 20px; 
    font-weight: 500; 
    cursor: pointer; 
    margin: 0 auto; 
    transition: 0.2s;
}
.dial-btn:hover { background: rgba(255,255,255,0.2); transform: scale(1.05); }
.call-btn { background: #48BB78; border: none; width: 100%; padding: 15px; border-radius: 12px; font-size: 16px; font-weight: bold; color: white; margin-top: 20px; cursor: pointer; transition: 0.2s; }
.call-btn:hover { background: #38a169; transform: translateY(-2px); }

/* RIGHT COLUMN: SURVEY (Clean Forms) */
.survey-panel { border-top: 6px solid var(--accent); }
.panel-title { padding: 20px; font-size: 14px; font-weight: 800; color: var(--text-muted); letter-spacing: 1px; text-transform: uppercase; border-bottom: 1px solid #edf2f7; }
.scroll-content { padding: 20px; overflow-y: auto; }

.voice-commander { margin-bottom: 25px; }
.mic-trigger { 
    width: 100%; 
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
    color: white; 
    border: none; 
    padding: 15px; 
    border-radius: 12px; 
    font-weight: bold; 
    cursor: pointer; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    gap: 10px; 
    box-shadow: 0 4px 15px rgba(118, 75, 162, 0.4);
    transition: 0.2s;
}
.mic-trigger:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(118, 75, 162, 0.6); }

.survey-group { margin-bottom: 25px; }
.survey-group h4 { margin: 0 0 10px 0; font-size: 11px; color: var(--primary); text-transform: uppercase; font-weight: 800; }

/* Custom Radio Cards */
.radio-card { 
    display: block; 
    background: #f7fafc; 
    border: 1px solid #edf2f7; 
    padding: 10px 15px; 
    border-radius: 8px; 
    margin-bottom: 8px; 
    cursor: pointer; 
    transition: 0.2s; 
    font-size: 13px; font-weight: 500;
    display: flex; align-items: center;
}
.radio-card:hover { background: white; border-color: var(--accent); box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
.radio-card input { margin-right: 10px; accent-color: var(--primary); }
.radio-card.active { background: #e6fffa; border-color: var(--primary); color: var(--primary-dark); }

.sentiment-row { display: flex; gap: 10px; }
.sentiment-btn { flex: 1; border: none; padding: 10px; border-radius: 8px; font-weight: bold; font-size: 12px; cursor: pointer; opacity: 0.6; transition: 0.2s; }
.sentiment-btn:hover { opacity: 0.8; }
.sentiment-btn.selected { opacity: 1; transform: scale(1.05); }
.sentiment-btn.positive { background: #c6f6d5; color: #22543d; }
.sentiment-btn.neutral { background: #feebc8; color: #744210; }
.sentiment-btn.negative { background: #fed7d7; color: #822727; }

/* MIDDLE COLUMN: COMMAND CENTER (The Grid) */
.command-header { padding: 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #edf2f7; }
.gov-input { width: 100%; padding: 12px 15px; border: 2px solid #edf2f7; border-radius: 8px; font-size: 15px; transition: 0.2s; background: #f7fafc; }
.gov-input:focus { border-color: var(--primary); background: white; outline: none; }

.slots-grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); 
    gap: 15px; 
    padding: 20px; 
    overflow-y: auto; 
    background: #f8fafc; 
    flex: 1; 
}

.slot-card { 
    background: white; 
    padding: 20px; 
    border-radius: 12px; 
    box-shadow: 0 2px 4px rgba(0,0,0,0.05); 
    border-left: 5px solid #cbd5e0; 
    display: flex; 
    flex-direction: column; 
    transition: 0.2s; 
    position: relative;
    border: 1px solid #edf2f7;
}
.slot-card:hover { transform: translateY(-3px); box-shadow: 0 10px 15px rgba(0,0,0,0.05); }

.slot-card.OPEN { border-left: 5px solid var(--success); }
.slot-card.BOOKED { border-left: 5px solid var(--accent); background: #f0f9ff; }

.slot-time { font-size: 24px; font-weight: 800; color: var(--text-main); margin-bottom: 5px; }
.slot-status { font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; color: var(--text-muted); margin-bottom: 15px; }

.ai-badge { 
    position: absolute; 
    top: 15px; 
    right: 15px; 
    font-size: 10px; 
    font-weight: 800; 
    padding: 4px 8px; 
    border-radius: 20px; 
    background: #c6f6d5; 
    color: #22543d; 
    text-transform: uppercase; 
}
.ai-badge.medium { background: #feebc8; color: #744210; }

.action-btn { 
    margin-top: auto; 
    width: 100%; 
    padding: 10px; 
    border: none; 
    background: var(--text-main); 
    color: white; 
    border-radius: 8px; 
    font-weight: 600; 
    cursor: pointer; 
    font-size: 12px; 
    transition: 0.2s; 
}
.action-btn:hover { background: black; }

/* MODALS */
.modal-overlay { background: rgba(0,0,0,0.7); backdrop-filter: blur(5px); }
.mini-modal { border: none; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); border-radius: 16px; overflow: hidden; }
.mini-modal h3 { margin-top: 0; color: var(--primary); }
`,

    // 2. UPDATED REVISIT TABLE (Using the new CSS classes)
    "src/components/revisit/RevisitTable.js": `
import React, { useState, useEffect } from 'react';
import { DataStore } from '../../utils/mockDataStore';
import { AppointmentSlot, SlotStatus } from '../../models';
import { createSiteDate, predictSlotEfficiency, analyzeVoiceNote } from '../../utils/geminiAi';

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
            const times = ['07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '11:00'];
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

    return (
        <div className="panel">
            <div className="command-header">
                <div>
                    <h2 style={{margin:0, fontSize: '18px', color: '#008080'}}>Gemini Command Center</h2>
                    <p style={{margin:0, fontSize: '12px', color: '#718096'}}>AI-Optimized Field Scheduling</p>
                </div>
                <div style={{textAlign: 'right'}}>
                    <input className="gov-input" value={siteId} onChange={e => setSiteId(e.target.value)} style={{width: '200px'}} />
                </div>
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
                                <div className={\`ai-badge \${prediction.rating === 'OPTIMAL' ? '' : 'medium'}\`}>
                                    {prediction.rating}
                                </div>
                            )}

                            {isBooked ? (
                                <div style={{marginTop: 'auto', fontSize: '13px', fontWeight: 'bold', color: '#01BAEF'}}>
                                    Job #{slot.jobNumber}
                                </div>
                            ) : (
                                <button className="action-btn" onClick={() => setBookingModal(slot)}>
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
                        <h3>Confirm Booking: {bookingModal.time}</h3>
                        <div className="input-group">
                            <label style={{fontSize: '12px', fontWeight: 'bold'}}>Property Size (Ha)</label>
                            <input type="number" className="gov-input" value={propSize} onChange={e => setPropSize(e.target.value)} />
                        </div>
                        <div style={{marginTop: '20px'}}>
                             <button className="mic-trigger" onClick={() => {}}>🎙️ Add Voice Note</button>
                        </div>
                        <div className="action-row">
                            <button className="gov-btn primary" onClick={handleBook}>Confirm</button>
                            <button className="gov-btn secondary" onClick={() => setBookingModal(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default RevisitTable;
`,

    // 3. UPDATED SURVEY (Better Cards)
    "src/components/SmartSurvey.js": `
import React, { useState } from 'react';

const SmartSurvey = () => {
    const [category, setCategory] = useState('');
    const [sentiment, setSentiment] = useState('Neutral');
    const [isListening, setIsListening] = useState(false);

    const toggleVoice = () => {
        setIsListening(true);
        setTimeout(() => setIsListening(false), 2000); // Mock
    };

    return (
        <div className="panel survey-panel">
            <div className="panel-title">Post-Call Smart Survey</div>
            <div className="scroll-content">
                <button className="mic-trigger" onClick={toggleVoice}>
                     {isListening ? '🛑 Listening...' : '✨ Auto-Fill with Voice AI'}
                </button>

                <div className="survey-group">
                    <h4>Categorization</h4>
                    {['SAR - Suspect Ant Report', 'TAR - Treatment', 'Aerial Operations', 'Threat', 'Complaint'].map(opt => (
                        <div 
                            key={opt} 
                            className={\`radio-card \${category === opt ? 'active' : ''}\`}
                            onClick={() => setCategory(opt)}
                        >
                            <div className="dot" style={{
                                width: '10px', height: '10px', borderRadius: '50%', 
                                border: '2px solid #ccc', marginRight: '10px',
                                background: category === opt ? '#008080' : 'transparent',
                                borderColor: category === opt ? '#008080' : '#ccc'
                            }}></div>
                            {opt}
                        </div>
                    ))}
                </div>

                <div className="survey-group">
                    <h4>Sentiment Analysis</h4>
                    <div className="sentiment-row">
                        {['Positive', 'Neutral', 'Negative'].map(s => (
                            <button 
                                key={s}
                                className={\`sentiment-btn \${s.toLowerCase()} \${sentiment===s?'selected':''}\`}
                                onClick={() => setSentiment(s)}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{marginTop: 'auto'}}>
                    <button className="call-btn" style={{marginTop: '0'}}>Submit Record</button>
                </div>
            </div>
        </div>
    );
};
export default SmartSurvey;
`
};

// --- EXECUTION ---
async function installPhase6() {
    console.log("💎 Polishing pixels...");

    for (const [filePath, content] of Object.entries(FILES)) {
        const fullPath = path.join(__dirname, filePath);
        // Ensure directory exists
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        
        fs.writeFileSync(fullPath, content);
        console.log("✅ Restored: " + filePath);
    }

    console.log("\n🚀 Phase 6 Complete.");
    console.log("We have restored the Gemini High-Tech Aesthetic.");
    console.log("Restart 'npm run dev' to see the difference.");
}

installPhase6();