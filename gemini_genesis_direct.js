const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("🐜 Gemini Architect: Engaging Direct Manual Override (Fixed)...");

// --- THE BLUEPRINT ---
const FILES = {
    // 1. THE BRAIN (Backend Server)
    "server/server.js": `
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;
const DB_PATH = path.join(__dirname, 'data', 'sites.json');

// THE BIO-MEMORY ENGINE
app.get('/api/site/:id', (req, res) => {
    const requestedId = req.params.id.toUpperCase();
    console.log(\`🔎 Searching Bio-Memory for: \${requestedId}\`);
    
    fs.readFile(DB_PATH, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        
        const sites = JSON.parse(data);
        const site = sites.find(s => s.siteId === requestedId);
        
        if (site) {
            console.log("✅ Site Found. Sending Intelligence...");
            setTimeout(() => res.json(site), 600); 
        } else {
            res.status(404).json({ message: 'Site not found in Biosecurity Register' });
        }
    });
});

app.listen(PORT, () => {
    console.log(\`\\n🔥 NFAEP Bio-Memory Server Online at http://localhost:\${PORT}\`);
});
`,

    // 2. THE MEMORY (Data)
    "server/data/sites.json": `
[
    {
        "siteId": "SITE-49201",
        "address": "12 Gumtree Lane, Heritage Park",
        "zone": "Eradication Zone A",
        "zoneColor": "#e74c3c",
        "hazards": ["Large Dog (Mastiff) - 'Rex'", "Side Gate Locked (Code: 1234)"],
        "accessHistory": "NOTICE_LEFT (2024-10-12)",
        "instructions": "Client leaves key under the pot plant on Tuesdays. DO NOT ENTER without calling."
    },
    {
        "siteId": "SITE-88102",
        "address": "45 River Road, Yeronga",
        "zone": "Suppression Zone",
        "zoneColor": "#f39c12",
        "hazards": ["Steep Driveway", "Bee Hives in rear"],
        "accessHistory": "TREATED (2024-09-01)",
        "instructions": "Owner requires 24h notice. Call EST to book."
    },
    {
        "siteId": "SITE-11005",
        "address": "8 Industrial Ave, Wacol",
        "zone": "Surveillance Zone",
        "zoneColor": "#27ae60",
        "hazards": ["Heavy Machinery", "PPE Required (High Vis)"],
        "accessHistory": "CONSENT_GRANTED",
        "instructions": "Report to Site Office upon arrival."
    }
]
`,

    // 3. THE FACE (Frontend Logic)
    "src/App.js": `
import React from 'react';
import SiteLookup from './components/SiteLookup';
import './styles.css';

function App() {
  return (
    <div className="app-container">
      <header className="gov-header">
        <div className="gov-logo">🇦🇺 NFAEP</div>
        <div className="gov-title">National Fire Ant Eradication Program | <strong>Agent Workspace</strong></div>
      </header>

      <main className="main-content">
        <div className="panel-left">
            <h2>Revisit Booking Portal</h2>
            <p className="subtext">Enter Site ID from Property Access Notice (PAN)</p>
            <SiteLookup />
        </div>
        
        <div className="panel-right">
            <div className="info-card">
                <h3>System Status</h3>
                <div className="status-row"><span className="dot green"></span> Bio-Memory Online</div>
                <div className="status-row"><span className="dot green"></span> Field Teams Active</div>
                <div className="status-row"><span className="dot orange"></span> Aerial Ops (Zone A)</div>
            </div>
            
            <div className="info-card" style={{marginTop: '20px'}}>
                <h3>Quick Reference</h3>
                <p style={{fontSize: '14px', color: '#666'}}>
                   <strong>Test IDs:</strong><br/>
                   • SITE-49201 (Hazards)<br/>
                   • SITE-88102 (Suppression)<br/>
                   • SITE-11005 (Commercial)
                </p>
            </div>
        </div>
      </main>
    </div>
  );
}

export default App;
`,

    // 4. THE MAGIC COMPONENT (Lookup)
    "src/components/SiteLookup.js": `
import React, { useState, useEffect } from 'react';

const SiteLookup = () => {
    const [siteId, setSiteId] = useState('');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            if (siteId.length >= 5) {
                fetchSiteData(siteId);
            }
        }, 800);
        return () => clearTimeout(timer);
    }, [siteId]);

    const fetchSiteData = async (id) => {
        if (!id) return;
        setLoading(true);
        setError('');
        setData(null);

        try {
            const formattedId = id.toUpperCase().startsWith('SITE-') ? id : \`SITE-\${id}\`;
            const response = await fetch(\`http://localhost:3001/api/site/\${formattedId}\`);
            
            if (!response.ok) throw new Error("Site ID not found in Register");
            
            const result = await response.json();
            setData(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="lookup-container">
            <div className="input-group">
                <label>SITE REFERENCE ID</label>
                <input 
                    type="text" 
                    placeholder="e.g. 49201" 
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    className="gov-input"
                    autoFocus
                />
                {loading && <div className="spinner">Searching Bio-Memory...</div>}
            </div>

            {error && <div className="alert error">❌ {error}</div>}

            {data && (
                <div className="result-card fade-in">
                    <div className="badge-row">
                        <span className="badge" style={{backgroundColor: data.zoneColor}}>
                            {data.zone}
                        </span>
                        <span className="badge history">{data.accessHistory}</span>
                    </div>

                    <div className="field-group">
                        <label>PROPERTY ADDRESS</label>
                        <div className="data-field large">{data.address}</div>
                    </div>

                    <div className="field-group danger-zone">
                        <label>⚠️ IDENTIFIED HAZARDS</label>
                        <ul>
                            {data.hazards.map((h, i) => <li key={i}>{h}</li>)}
                        </ul>
                    </div>

                    <div className="field-group instruction-zone">
                        <label>ACCESS INSTRUCTIONS</label>
                        <div className="data-field">{data.instructions}</div>
                    </div>

                    <button className="gov-btn primary">CONFIRM REVISIT BOOKING</button>
                </div>
            )}
        </div>
    );
};

export default SiteLookup;
`,

    // 5. STYLES
    "src/styles.css": `
body { margin: 0; font-family: 'Roboto', sans-serif; background-color: #f4f7f6; color: #333; }
.app-container { display: flex; flex-direction: column; height: 100vh; }
.gov-header { background: #008080; color: white; padding: 15px 30px; display: flex; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
.gov-logo { font-size: 24px; font-weight: bold; margin-right: 20px; border-right: 1px solid rgba(255,255,255,0.3); padding-right: 20px; }
.gov-title { font-size: 18px; }
.main-content { display: flex; padding: 40px; gap: 40px; max-width: 1200px; margin: 0 auto; width: 100%; }
.panel-left { flex: 2; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
.panel-right { flex: 1; }
h2 { margin-top: 0; color: #005f5f; }
.subtext { color: #666; margin-bottom: 25px; }
.input-group { margin-bottom: 20px; }
.input-group label { display: block; font-size: 12px; font-weight: bold; color: #555; margin-bottom: 5px; letter-spacing: 0.5px; }
.gov-input { width: 100%; padding: 15px; font-size: 18px; border: 2px solid #ddd; border-radius: 4px; box-sizing: border-box; transition: 0.3s; }
.gov-input:focus { border-color: #008080; outline: none; }
.result-card { border-top: 4px solid #008080; padding-top: 20px; margin-top: 20px; }
.fade-in { animation: fadeIn 0.5s ease-in; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.field-group { margin-bottom: 15px; }
.data-field { background: #f9f9f9; padding: 12px; border-radius: 4px; font-weight: 500; }
.large { font-size: 18px; }
.badge-row { display: flex; gap: 10px; margin-bottom: 20px; }
.badge { padding: 5px 10px; border-radius: 4px; color: white; font-size: 12px; font-weight: bold; text-transform: uppercase; }
.badge.history { background: #555; }
.danger-zone { border: 1px solid #ffcccc; background: #fff5f5; padding: 15px; border-radius: 4px; }
.danger-zone label { color: #d8000c; }
.danger-zone ul { margin: 0; padding-left: 20px; color: #d8000c; font-weight: bold; }
.gov-btn { width: 100%; padding: 15px; background: #008080; color: white; border: none; font-size: 16px; font-weight: bold; border-radius: 4px; cursor: pointer; margin-top: 20px; }
.gov-btn:hover { background: #006666; }
.info-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
.status-row { display: flex; align-items: center; margin-bottom: 10px; font-size: 14px; }
.dot { height: 10px; width: 10px; border-radius: 50%; margin-right: 10px; display: inline-block; }
.green { background: #28a745; }
.orange { background: #fd7e14; }
.spinner { color: #008080; font-weight: bold; margin-top: 5px; }
.alert { color: #d8000c; font-weight: bold; margin-top: 10px; }
`,

    // 6. ENTRY
    "src/index.js": `
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
`,
    "public/index.html": `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>NFAEP Agent Workspace</title>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
`,
    // 7. CONFIG
    "package.json": JSON.stringify({
      "name": "nfaep-agent-workspace",
      "version": "1.0.0",
      "private": true,
      "dependencies": {
        "concurrently": "^9.1.0",
        "cors": "^2.8.5",
        "express": "^4.21.1",
        "react": "^18.3.1",
        "react-dom": "^18.3.1",
        "react-scripts": "^5.0.1"
      },
      "scripts": {
        "start": "react-scripts start",
        "server": "node server/server.js",
        "dev": "concurrently \"npm run server\" \"npm run start\""
      },
      "eslintConfig": { "extends": [ "react-app" ] },
      "browserslist": { "production": [ ">0.2%", "not dead", "not op_mini all" ], "development": [ "last 1 chrome version", "last 1 firefox version", "last 1 safari version" ] }
    }, null, 2)
};

// --- EXECUTION ---
async function build() {
    console.log("🏗️  Constructing Files...");
    
    for (const [filePath, content] of Object.entries(FILES)) {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        
        // Write the file (No syntax error here now)
        fs.writeFileSync(filePath, content);
        console.log(`✅ Created: ${filePath}`);
    }

    console.log("\n⚙️  Installing Engines (Dependencies)...");
    try {
        execSync('npm install', { stdio: 'inherit' });
        console.log("\n🔥 SYSTEM READY.");
        console.log("👉 Run this command now: npm run dev");
    } catch (e) {
        console.error("Install failed. Try running 'npm install' manually.");
    }
}

build();