const fs = require('fs');
const path = require('path');

console.log("🐜 Gemini Architect: Activating Phase 3 Intelligence Layer...");

const FILES = {
    // 1. MOCK MODELS (Prevents crashes since we don't have Amplify generated models)
    "src/models/index.js": `
export const SlotStatus = {
    OPEN: 'OPEN',
    BOOKED: 'BOOKED',
    HOLD: 'HOLD',
    COMPLETED: 'COMPLETED',
    NEEDS_REBOOK: 'NEEDS_REBOOK'
};

export class AppointmentSlot {
    constructor(init) {
        Object.assign(this, init);
    }
}
`,

    // 2. SIMULATION ENGINE (Mocks AWS DataStore for the demo)
    "src/utils/mockDataStore.js": `
// A local simulation of AWS DataStore so the app works without config
let db = [];

export const DataStore = {
    query: async (model, predicate) => {
        // Return dummy data if empty
        if (db.length === 0) {
            return [];
        }
        return db;
    },
    save: async (item) => {
        console.log("💾 [Gemini DB] Saving:", item);
        db.push(item);
        return item;
    },
    observe: () => {
        return {
            subscribe: (cb) => {
                return { unsubscribe: () => {} };
            }
        };
    }
};
`,

    // 3. UPDATED REVISIT TABLE (Using the Mocks + Voice)
    "src/components/revisit/RevisitTable.js": `
import React, { useState, useEffect } from 'react';
import { DataStore } from '../../utils/mockDataStore'; // Using our Simulation Engine
import { AppointmentSlot, SlotStatus } from '../../models';
import { createSiteDate, predictSlotEfficiency, analyzeVoiceNote } from '../../utils/geminiAi';
import '../agent/AgentWorkspace.css';

const toAwsDate = (date) => date.toISOString().split('T')[0];

const RevisitTable = ({ isOpen, onClose }) => {
    // Always open for this demo view
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [siteId, setSiteId] = useState('Gold Coast');
    const [slots, setSlots] = useState([]);
    const [bookingModal, setBookingModal] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const [voiceText, setVoiceText] = useState("");
    const [detectedHazards, setDetectedHazards] = useState([]);

    useEffect(() => {
        const loadSlots = async () => {
            // Generate intelligent dummy slots for the "Wow" factor
            const times = ['07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00'];
            const mockSlots = times.map(t => ({ 
                time: t, 
                status: Math.random() > 0.8 ? SlotStatus.BOOKED : SlotStatus.OPEN,
                jobNumber: Math.random() > 0.8 ? 'JOB-999' : null
            }));
            setSlots(mockSlots);
        };
        loadSlots();
    }, [selectedDate, siteId]);

    const toggleVoice = () => {
        if (!('webkitSpeechRecognition' in window)) return alert("Voice API not supported in this browser");
        if (isListening) { setIsListening(false); return; }

        const recognition = new window.webkitSpeechRecognition();
        recognition.lang = 'en-AU';
        recognition.start();
        setIsListening(true);

        recognition.onresult = (e) => {
            const text = e.results[0][0].transcript;
            setVoiceText(prev => prev + " " + text);
            setDetectedHazards(analyzeVoiceNote(text));
            setIsListening(false);
        };
    };

    const handleBook = async () => {
        if (!bookingModal) return;
        const newSlot = new AppointmentSlot({
            time: bookingModal.time,
            status: SlotStatus.BOOKED,
            jobNumber: \`JOB-\${Date.now().toString().slice(-4)}\`,
            comment: voiceText
        });
        await DataStore.save(newSlot);
        
        // Update local state to show the booking instantly
        setSlots(prev => prev.map(s => s.time === bookingModal.time ? {...s, status: SlotStatus.BOOKED, jobNumber: newSlot.jobNumber} : s));
        setBookingModal(null);
        setVoiceText("");
        setDetectedHazards([]);
    };

    // We render inline (no modal overlay) for the main view
    return (
        <div className="panel-container">
            <div className="panel-left">
                <div className="modal-header gov-header" style={{borderRadius: '8px 8px 0 0'}}>
                    <h2>📡 Gemini Command Center</h2>
                </div>

                <div className="control-bar" style={{padding: '20px', borderBottom: '1px solid #eee'}}>
                    <input className="gov-input" value={siteId} onChange={e => setSiteId(e.target.value)} />
                </div>

                <div className="slots-grid" style={{height: '500px'}}>
                    {slots.map(slot => {
                        const prediction = predictSlotEfficiency(slot.time, "Generic", slots);
                        const isBooked = slot.status === SlotStatus.BOOKED;

                        return (
                            <div key={slot.time} className={\`slot-card \${slot.status}\`}>
                                <div className="slot-time">{slot.time}</div>
                                <div className="slot-status">{slot.status}</div>
                                
                                {!isBooked && (
                                    <div className="ai-badge" style={{color: prediction.rating === 'OPTIMAL' ? '#28a745' : '#e67e22'}}>
                                        {prediction.rating}
                                    </div>
                                )}

                                {isBooked ? (
                                    <div className="job-info">Job #{slot.jobNumber}</div>
                                ) : (
                                    <button className="gov-btn small" onClick={() => setBookingModal(slot)}>
                                        Analyze & Book
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* RIGHT PANEL: AI INSIGHTS */}
            <div className="panel-right">
                 <div className="ai-insight-card fade-in">
                    <h3>🤖 Active Intelligence</h3>
                    <p style={{opacity: 0.8, fontSize: '14px', marginBottom: '20px'}}>
                        Gemini is monitoring booking efficiency and hazard reports in real-time.
                    </p>
                    <div className="score-ring">94%<span>Health</span></div>
                 </div>
            </div>

            {/* VOICE MODAL OVERLAY */}
            {bookingModal && (
                <div className="modal-overlay">
                    <div className="mini-modal">
                        <h3>Confirm Booking: {bookingModal.time}</h3>
                        <div className="voice-section">
                            <label>Voice Hazard Log</label>
                            <div className="voice-wrapper">
                                <textarea 
                                    className="gov-textarea"
                                    value={voiceText}
                                    onChange={e => setVoiceText(e.target.value)}
                                    placeholder="Click mic and say: 'Beware of the large dog'..."
                                />
                                <button className={\`mic-btn \${isListening ? 'listening' : ''}\`} onClick={toggleVoice}>
                                    {isListening ? '🛑' : '🎙️'}
                                </button>
                            </div>
                        </div>
                        {detectedHazards.length > 0 && (
                            <div className="hazard-warning fade-in">⚠️ DETECTED: {detectedHazards.join(", ")}</div>
                        )}
                        <div className="action-row">
                            <button className="gov-btn primary" onClick={handleBook}>CONFIRM</button>
                            <button className="gov-btn secondary" onClick={() => setBookingModal(null)}>CANCEL</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RevisitTable;
`,

    // 4. UPDATED APP.JS (THE SWITCHBOARD)
    "src/App.js": `
import React, { useState } from 'react';
import RevisitTable from './components/revisit/RevisitTable'; // <-- NOW IMPORTING THE NEW COMPONENT
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
            📡 Command Center
        </button>
        <button 
            className={\`tab-btn \${activeTab === 'teams' ? 'active' : ''}\`}
            onClick={() => setActiveTab('teams')}
        >
            🚁 Field Assets
        </button>
      </nav>

      <main className="main-content">
        {activeTab === 'booking' ? <RevisitTable isOpen={true} /> : <TeamCommand />}
      </main>
    </div>
  );
}

export default App;
`
};

// --- EXECUTION ---
async function activate() {
    console.log("🛠️  Wiring up the new interface...");

    for (const [filePath, content] of Object.entries(FILES)) {
        const fullPath = path.join(__dirname, filePath);
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(fullPath, content);
        console.log(`✅ Wired: ${filePath}`);
    }

    console.log("\n🚀 SYSTEM ACTIVATED.");
    console.log("Please restart your server now:");
    console.log("1. Press Ctrl+C");
    console.log("2. Run 'npm run dev'");
}

activate();