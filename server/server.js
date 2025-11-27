
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

const readData = (p) => {
    if (!fs.existsSync(p)) return [];
    return JSON.parse(fs.readFileSync(p, 'utf8'));
};

app.get('/api/site/:id', (req, res) => {
    const requestedId = req.params.id.toUpperCase();
    console.log(`🔎 Bio-Memory Access: ${requestedId}`);
    const sites = readData(SITES_PATH);
    const site = sites.find(s => s.siteId === requestedId);
    
    if (site) {
        setTimeout(() => res.json(site), 400); 
    } else {
        res.status(404).json({ message: 'Site not found' });
    }
});

app.get('/api/teams', (req, res) => {
    console.log("🚁 Fetching Field Assets...");
    res.json(readData(TEAMS_PATH));
});

// FIXED: Now we actually USE the variables to prevent linter warnings
app.post('/api/simulate-booking', (req, res) => {
    const { siteId, time, teamType } = req.body;
    console.log(`🤖 AI Simulation requested for Site ${siteId} at ${time} using ${teamType}`);
    
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
    console.log(`\n🔥 GeminiOps Center Online at http://localhost:${PORT}`);
});
