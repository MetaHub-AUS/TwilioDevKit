const fs = require('fs');
const path = require('path');

console.log("🐜 Gemini Architect: Phase 5 (Fixed) - Visual Fusion...");

const FILES = {
    // 1. APP SHELL (Matches Screenshot Layout & Header)
    "src/App.js": `
import React from 'react';
import GeminiCommLink from './components/GeminiCommLink';
import RevisitTable from './components/revisit/RevisitTable';
import SmartSurvey from './components/SmartSurvey';
import './styles.css';

function App() {
  return (
    <div className="app-container">
      {/* HEADER - Matches EST Workspace Screenshot */}
      <header className="est-header">
        <div className="header-left">
            <h1 className="est-logo">EST WORKSPACE</h1>
            <div className="header-actions">
                <button className="nav-btn">📋 View Team Directory</button>
                <button className="nav-btn">⚙️ Manage Teams</button>
            </div>
        </div>
        
        <div className="header-metrics">
            <div className="metric-pill">
                <span className="label">AGENTS AVAILABLE</span>
                <span className="value">4</span>
            </div>
            <div className="metric-pill">
                <span className="label">CONTACTS IN QUEUE</span>
                <span className="value">0</span>
            </div>
        </div>

        <div className="header-right">
            <button className="tool-btn">Launch Pad</button>
            <button className="tool-btn">RTT Workbook</button>
            <button className="tool-btn active">Revisit Table</button>
            <button className="logout-btn">Sign out</button>
        </div>
      </header>

      {/* 3-COLUMN LAYOUT */}
      <main className="workspace-grid">
        <div className="col-left">
            <GeminiCommLink />
        </div>
        
        <div className="col-middle">
            {/* The Gemini Command Center lives in the center */}
            <RevisitTable isOpen={true} />
        </div>
        
        <div className="col-right">
            <SmartSurvey />
        </div>
      </main>
    </div>
  );
}

export default App;
`,

    // 2. LEFT COLUMN: COMM LINK (Visual Replica of Connect CCP)
    "src/components/GeminiCommLink.js": `
import React, { useState } from 'react';

const GeminiCommLink = () => {
    const [status, setStatus] = useState('Offline'); // Matching screenshot 'Offline'
    const [number, setNumber] = useState('');

    const append = (n) => setNumber(prev => prev + n);

    return (
        <div className="panel comm-panel">
            <div className="comm-header">
                <div className="status-dropdown">
                    <span className="status-dot offline"></span> {status} ▼
                </div>
                <div className="comm-icons">
                    <span>📞</span> <span>⚙️</span>
                </div>
            </div>

            <div className="number-pad-section">
                <h3>Number pad</h3>
                <div className="input-display">
                    <span className="flag">🇦🇺 ▼</span>
                    <input 
                        value={number} 
                        onChange={e => setNumber(e.target.value)}
                        placeholder="Enter a phone number"
                    />
                </div>
                
                <div className="dial-grid">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map(n => (
                        <button key={n} className="dial-btn" onClick={() => append(n)}>
                            {n}
                            <span className="subtext">
                                {n===2?'ABC':n===3?'DEF':n===4?'GHI':n===5?'JKL':n===6?'MNO':n===7?'PQRS':n===8?'TUV':n===9?'WXYZ':''}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="call-actions">
                    <button className="quick-connect-btn">👥 Quick connects</button>
                    <button className="call-btn">📞 Call</button>
                </div>
            </div>
            
            <div className="gemini-ear">
                <p>🤖 Gemini Listening...</p>
            </div>
        </div>
    );
};
export default GeminiCommLink;
`,

    // 3. RIGHT COLUMN: SMART SURVEY (Matches Screenshot + Voice Logic)
    "src/components/SmartSurvey.js": `
import React, { useState } from 'react';
import { analyzeVoiceNote } from '../utils/geminiAi';

const SmartSurvey = () => {
    const [category, setCategory] = useState('');
    const [sentiment, setSentiment] = useState('Neutral');
    const [isListening, setIsListening] = useState(false);

    // GEMINI VOICE FILLER
    const toggleVoice = () => {
        if (!('webkitSpeechRecognition' in window)) return alert("Voice API not supported");
        const recognition = new window.webkitSpeechRecognition();
        recognition.lang = 'en-AU';
        recognition.start();
        setIsListening(true);

        recognition.onresult = (e) => {
            const text = e.results[0][0].transcript.toLowerCase();
            
            // Intelligent Mapping
            if (text.includes('complaint')) setCategory('Complaint');
            else if (text.includes('aerial')) setCategory('Aerial Operations');
            else if (text.includes('suspect')) setCategory('SAR - Suspect Ant Report');
            else if (text.includes('threat')) setCategory('Threat');
            
            if (text.includes('angry') || text.includes('upset')) setSentiment('Negative');
            if (text.includes('happy') || text.includes('thanks')) setSentiment('Positive');
            
            setIsListening(false);
        };
    };

    return (
        <div className="panel survey-panel">
            <div className="panel-header-strip">POST-CALL SURVEY</div>
            <div className="scroll-content">
                
                <div className="voice-commander" onClick={toggleVoice}>
                    <button className={\`mic-trigger \${isListening ? 'active' : ''}\`}>
                        {isListening ? '🛑 Listening...' : '🎙️ Auto-Fill with Voice'}
                    </button>
                </div>

                <div className="section-group">
                    <h4>FAST</h4>
                    {['SAR - Suspect Ant Report', 'TAR - Treatment Ant Report', 'Aerial Operations', 'Threat', 'Other', 'Complaint', 'CST'].map(opt => (
                        <label key={opt} className="radio-row">
                            <input 
                                type="radio" 
                                name="cat" 
                                checked={category === opt}
                                onChange={() => setCategory(opt)}
                            />
                            {opt}
                        </label>
                    ))}
                </div>

                <div className="section-group">
                    <h4>HOT TOPICS</h4>
                    <label className="radio-row"><input type="radio" name="hot" /> Bulk SMS Response</label>
                    <label className="radio-row"><input type="radio" name="hot" /> Deactivate Self-Treatment Report</label>
                </div>

                <div className="section-group">
                    <h4>SENTIMENT</h4>
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

                <div className="form-footer">
                    <label>Customer Phone Number</label>
                    <input className="gov-input" placeholder="04..." />
                    <button className="submit-btn">Submit</button>
                </div>
            </div>
        </div>
    );
};
export default SmartSurvey;
`,

    // 4. STYLES (Matches EST Blue & Dark Background)
    "src/styles.css": `
:root {
    --est-blue: #0B4F6C;
    --dark-bg: #1e293b;
    --panel-bg: #ffffff;
    --teal-light: #e0f7fa;
}

body { margin: 0; font-family: 'Roboto', sans-serif; background-color: var(--dark-bg); height: 100vh; overflow: hidden; }

/* LAYOUT GRID */
.app-container { display: flex; flex-direction: column; height: 100vh; }
.workspace-grid { 
    display: grid; 
    grid-template-columns: 320px 1fr 380px; /* Matching Screenshot Proportions */
    gap: 15px; 
    padding: 15px; 
    flex: 1; 
    overflow: hidden;
}

/* HEADER */
.est-header { 
    background-color: var(--est-blue); 
    height: 60px; 
    display: flex; 
    align-items: center; 
    justify-content: space-between; 
    padding: 0 20px; 
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    color: white;
}
.est-logo { font-size: 20px; font-weight: 700; margin-right: 20px; letter-spacing: 0.5px; text-transform: uppercase; }
.header-left, .header-right { display: flex; align-items: center; gap: 10px; }
.nav-btn { background: #f0f0f0; border: none; padding: 6px 12px; border-radius: 4px; font-size: 13px; font-weight: 600; cursor: pointer; color: #333; display: flex; align-items: center; gap: 5px; }
.tool-btn { background: white; border: 1px solid rgba(255,255,255,0.3); color: #333; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500;}
.tool-btn.active { background: white; color: var(--est-blue); font-weight: bold; border-color: white;}
.logout-btn { background: #d9534f; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-weight: bold; }

/* METRICS PILLS */
.header-metrics { display: flex; gap: 0; background: rgba(0,0,0,0.2); border-radius: 20px; overflow: hidden;}
.metric-pill { display: flex; flex-direction: column; align-items: center; padding: 5px 20px; border-right: 1px solid rgba(255,255,255,0.1); line-height: 1.1; min-width: 100px; }
.metric-pill:last-child { border: none; }
.metric-pill .label { font-size: 9px; opacity: 0.8; letter-spacing: 0.5px; }
.metric-pill .value { font-size: 16px; font-weight: bold; }

/* PANELS */
.panel { background: white; border-radius: 8px; display: flex; flex-direction: column; height: 100%; overflow: hidden; }
.col-middle { display: flex; flex-direction: column; height: 100%; }

/* COMM LINK (Left) */
.comm-header { padding: 10px 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; background: #232f3e; color: white; align-items: center;}
.status-dropdown { background: #344050; padding: 5px 10px; border-radius: 4px; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 5px; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.status-dot.offline { background: #888; border: 1px solid #fff; }
.comm-icons { font-size: 16px; cursor: pointer; display: flex; gap: 10px;}
.number-pad-section { padding: 20px; flex: 1; display: flex; flex-direction: column; }
.number-pad-section h3 { font-size: 14px; margin-top: 0; margin-bottom: 10px; }
.input-display { display: flex; border: 1px solid #ccc; border-radius: 4px; padding: 8px; margin-bottom: 20px; align-items: center; }
.flag { font-size: 14px; color: #555; padding-right: 5px; border-right: 1px solid #eee; cursor: pointer; }
.input-display input { border: none; outline: none; flex: 1; font-size: 14px; margin-left: 10px; font-style: italic; }
.dial-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; width: 80%; margin: 0 auto 20px auto; }
.dial-btn { background: white; border: none; font-size: 18px; font-weight: bold; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 40px; }
.dial-btn:hover { color: var(--est-blue); }
.dial-btn .subtext { font-size: 7px; color: #999; font-weight: normal; margin-top: 0px; letter-spacing: 1px; }
.call-actions { display: flex; justify-content: space-between; margin-top: auto; }
.quick-connect-btn { background: white; border: 1px solid #008080; color: #008080; padding: 8px 12px; border-radius: 4px; font-weight: bold; font-size: 12px; cursor: pointer; }
.call-btn { background: #eee; color: #aaa; border: none; padding: 8px 20px; border-radius: 4px; font-weight: bold; cursor: not-allowed; }
.gemini-ear { background: #e8f5e9; padding: 5px; text-align: center; font-size: 11px; color: #2e7d32; border-top: 1px solid #c8e6c9; }

/* SURVEY (Right) */
.survey-panel { border-top: 5px solid #f0ad4e; }
.panel-header-strip { font-weight: bold; font-size: 11px; padding: 10px; border-bottom: 1px solid #eee; text-transform: uppercase; color: #333; letter-spacing: 0.5px; }
.scroll-content { overflow-y: auto; padding: 15px; flex: 1; }
.section-group { border: 1px solid #e0f7fa; border-radius: 5px; padding: 10px; margin-bottom: 15px; }
.section-group h4 { margin: 0 0 10px 0; font-size: 10px; color: #008080; text-transform: uppercase; border-bottom: 1px solid #e0f7fa; padding-bottom: 5px; font-weight: bold; }
.radio-row { display: flex; align-items: center; font-size: 12px; margin-bottom: 8px; cursor: pointer; color: #555; }
.radio-row input { margin-right: 8px; }
.sentiment-row { display: flex; gap: 5px; }
.sentiment-btn { flex: 1; border: 1px solid #ddd; background: #f9f9f9; padding: 5px; font-size: 11px; border-radius: 15px; cursor: pointer; font-weight: bold; color: #555; }
.sentiment-btn.positive.selected { background: #d4edda; border-color: #28a745; color: #155724; }
.sentiment-btn.neutral.selected { background: #fff3cd; border-color: #ffc107; color: #856404; }
.sentiment-btn.negative.selected { background: #f8d7da; border-color: #dc3545; color: #721c24; }
.submit-btn { width: 100%; background: #008080; color: white; border: none; padding: 10px; border-radius: 4px; font-weight: bold; margin-top: 10px; cursor: pointer; }
.form-footer label { font-size: 12px; color: #555; display: block; margin-bottom: 5px; }
.mic-trigger { width: 100%; background: #eee; border: none; padding: 8px; font-size: 12px; margin-bottom: 15px; border-radius: 4px; cursor: pointer; color: #333; }
.mic-trigger.active { background: #ffcccc; animation: pulse 1s infinite; }

/* REVISIT TABLE OVERRIDE (Fit Middle Column) */
.panel-container { display: flex; height: 100%; border-radius: 8px; overflow: hidden; box-shadow: none; border: 1px solid #ddd; }
.panel-left { border-radius: 0 !important; box-shadow: none !important; }
.panel-right { display: none; } /* Hide right panel of Command Center to fit layout */
`
};

// --- EXECUTION ---
async function installPhase5() {
    console.log("🎨 Applying EST Workspace Visuals...");

    for (const [filePath, content] of Object.entries(FILES)) {
        const fullPath = path.join(__dirname, filePath);
        const dir = path.dirname(fullPath);
        
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        
        fs.writeFileSync(fullPath, content);
        console.log("✅ Applied: " + filePath);
    }

    console.log("\n🚀 Phase 5 Complete.");
    console.log("1. Restart server: 'npm run dev'");
    console.log("2. Verify the 3-column layout matches the screenshot.");
}

installPhase5();