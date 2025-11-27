
import React, { useState, useEffect } from 'react';
import { DataStore } from '../utils/mockDataStore';
import { FieldTeamData } from '../models'; // Using Audit Model

const TeamCommand = () => {
    const [teams, setTeams] = useState([]);

    // Audit 1.3: DataStore Query Pattern
    useEffect(() => {
        const loadTeams = async () => {
            const results = await DataStore.query(FieldTeamData);
            setTeams(results);
        };
        loadTeams();
    }, []);

    return (
        <div className="assets-container">
            {teams.map(team => (
                <div key={team.teamNumber} className="asset-card">
                    <div className="asset-header">
                        <span className="unit-id">Unit {team.teamNumber}</span>
                        <span className={`status-dot ${team.status}`}></span>
                    </div>
                    <div className="asset-badge">{team.type} UNIT</div>
                    <div className="asset-details">
                        <p><strong>Leader:</strong> {team.teamLeader}</p>
                        <p><strong>Area:</strong> {team.area}</p>
                    </div>
                    <div className="battery-wrapper">
                        <div className="battery-level" style={{width: `${team.battery}%`}}></div>
                    </div>
                </div>
            ))}
        </div>
    );
};
export default TeamCommand;
