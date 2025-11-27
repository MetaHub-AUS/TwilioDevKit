const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process'); // This lets the script run terminal commands
const { GoogleGenerativeAI } = require("@google/generative-ai");

// --- CONFIGURATION ---
const API_KEY = "AIzaSyCBclm8o3Jxqbab1b1XaAmDFe7Pqk-hDG4"; 
const MODEL_ID = "gemini-3-pro-preview"; 

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_ID });

const PROJECT_BLUEPRINT = `
You are the Chief Architect and DevOps Engineer for the National Fire Ant Eradication Program (NFAEP).

### GOAL
Create a FULLY functional "Agent Workspace" application, including configuration and public assets.

### REQUIREMENTS
1.  **"Bio-Memory" Server:** Node.js/Express server serving 'server/data/sites.json'.
2.  **Database:** 'server/data/sites.json' seeded with realistic Fire Ant data (SiteID, Hazards like "Aggressive Dog", Zone "Eradication A").
3.  **Frontend:** React App (src/App.js) with a "Revisit Booking" form that auto-fills based on SiteID lookup.
4.  **Configuration:** A 'package.json' that includes all dependencies (express, cors, react, react-dom, react-scripts, concurrently) and scripts.
5.  **Public Assets:** A 'public/index.html' with NFAEP branding.

### OUTPUT FORMAT
Return a JSON object where keys are filenames and values are the code/content.
Files to generate:
1.  "server/server.js"
2.  "server/data/sites.json"
3.  "src/App.js"
4.  "src/components/SiteLookup.js"
5.  "src/index.js" (Entry point for React)
6.  "src/styles.css" (Government style: Teal/White/Clean)
7.  "public/index.html" (The HTML canvas)
8.  "package.json" (MUST include 'scripts': {'start': 'react-scripts start', 'server': 'node server/server.js', 'dev': 'concurrently "npm run server" "npm run start"'})
`;

async function buildProject() {
    console.log("🐜 Gemini Architect is taking full control...");

    const prompt = `
    ${PROJECT_BLUEPRINT}
    RETURN ONLY RAW VALID JSON. No markdown.
    `;

    try {
        // 1. GENERATE CODE
        console.log("🧠 Dreaming up the application structure...");
        const result = await model.generateContent(prompt);
        let responseText = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        const files = JSON.parse(responseText);

        // 2. WRITE FILES
        console.log("🏗️  Constructing files...");
        for (const [filePath, content] of Object.entries(files)) {
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            
            // If writing package.json, ensure it's valid string format
            const fileContent = typeof content === 'object' ? JSON.stringify(content, null, 2) : content;
            
            fs.writeFileSync(filePath, fileContent);
            console.log(`✅ Created: ${filePath}`);
        }

        // 3. AUTOMATED DEVOPS (The "Wow" Part)
        console.log("\n⚙️  Running DevOps: Installing dependencies automatically...");
        console.log("    (This might take a minute, grab a coffee ☕)...");
        
        // This command installs all the libraries defined in the new package.json
        execSync('npm install', { stdio: 'inherit' });

        console.log("\n🔥 MISSION ACCOMPLISHED.");
        console.log("The entire system is built and installed.");
        console.log("👉 Just run: npm run dev");

    } catch (error) {
        console.error("❌ Construction failed:", error);
    }
}

buildProject();