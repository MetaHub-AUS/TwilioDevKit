const fs = require('fs');
const path = require('path');

console.log("🚑 Gemini Medic: Patching bad imports...");

const FILES = {
    // 1. FIX geminiAi.js
    // We remove the '@aws-amplify/datastore' import entirely since this file
    // only contains logic helpers that don't actually read the DB.
    "src/utils/geminiAi.js": `
// REMOVED BAD IMPORTS to allow Simulation Mode
// import { DataStore } from '@aws-amplify/datastore';
// import { AppointmentSlot } from '../models';

// --- AUDIT COMPLIANCE: COMPOSITE KEY GENERATOR ---
export const createSiteDate = (siteId, date) => {
    // Regex removes spaces safely
    const normalizedSiteId = siteId.toLowerCase().replace(/\\s+/g, '');
    return \`site#\${normalizedSiteId}#\${date}\`;
};

// --- GEMINI FEATURE: PREDICTIVE ROUTING ---
export const predictSlotEfficiency = (time, address, existingSlots) => {
    // Simulated AI Logic
    const hour = parseInt(time.split(':')[0]);
    
    // Logic: Mid-day bookings in cluster areas are efficient
    let score = 85; 
    if (hour > 10 && hour < 14) score += 10;
    if (address && address.includes("Highland")) score -= 15; 
    
    return {
        score,
        rating: score > 90 ? 'OPTIMAL' : score > 75 ? 'GOOD' : 'HIGH_TRAVEL',
        travelImpact: score > 90 ? '+5 min' : '+25 min'
    };
};

// --- GEMINI FEATURE: VOICE HAZARD PARSER ---
export const analyzeVoiceNote = (transcript) => {
    const hazards = [];
    const lower = transcript.toLowerCase();
    
    if (lower.includes('dog') || lower.includes('alsatian')) hazards.push('K9_HAZARD');
    if (lower.includes('gate') || lower.includes('locked')) hazards.push('ACCESS_LOCKED');
    if (lower.includes('bees') || lower.includes('wasps')) hazards.push('BIO_HAZARD');
    
    return hazards;
};
`
};

// --- EXECUTION ---
async function applyPatch() {
    for (const [filePath, content] of Object.entries(FILES)) {
        const fullPath = path.join(__dirname, filePath);
        fs.writeFileSync(fullPath, content);
        console.log(`✅ Patched: ${filePath}`);
    }
    console.log("\n🚀 Patch Applied. Restart your server now!");
}

applyPatch();