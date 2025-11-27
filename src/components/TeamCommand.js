
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

    // Helper function to check if a value is valid (not empty, null, or "Vacant")
    const isValidValue = (value) => {
        if (!value) return false;
        const cleaned = String(value).trim();
        return cleaned !== '' && cleaned.toLowerCase() !== 'null' && cleaned.toLowerCase() !== 'vacant';
    };

    // Helper function to validate email
    const isValidEmail = (email) => {
        if (!isValidValue(email)) return false;
        return email.includes('@') && !email.toLowerCase().includes('vacant');
    };

    // Helper function to validate phone
    const isValidPhone = (phone) => {
        if (!isValidValue(phone)) return false;
        return /\d/.test(phone) && !phone.toLowerCase().includes('vacant');
    };

    // Helper function to split multiple coordinators
    const splitMultipleValues = (value) => {
        if (!value) return [];
        return value.split(';').map(v => v.trim()).filter(v => v);
    };

    // Format coordinator emails as clickable links
    const formatCoordinatorEmails = (emails) => {
        if (!emails) return null;
        const emailList = splitMultipleValues(emails);
        if (emailList.length === 0) return null;

        return emailList.map((email, idx) => (
            <span key={idx}>
                {idx > 0 && ', '}
                <a href={`mailto:${email}`} className="contact-link">{email}</a>
            </span>
        ));
    };

    return (
        <div className="assets-container">
            {teams.map(team => (
                <div key={team.teamNumber} className="asset-card">
                    <div className="asset-header">
                        <span className="unit-id">Unit {team.teamNumber}</span>
                        <span className={`status-dot ${team.status}`}></span>
                    </div>

                    {team.type && (
                        <div className="asset-badge">{team.type} UNIT</div>
                    )}

                    <div className="asset-details">
                        {/* Team Leader Section */}
                        <div className="contact-section">
                            <p className="section-title">👤 Team Leader</p>
                            <p className="contact-name">{team.teamLeader || 'N/A'}</p>
                            {isValidPhone(team.phone) && (
                                <p className="contact-item">
                                    📞 <a href={`tel:${team.phone}`} className="contact-link">{team.phone}</a>
                                </p>
                            )}
                            {isValidEmail(team.email) && (
                                <p className="contact-item">
                                    ✉️ <a href={`mailto:${team.email}`} className="contact-link">{team.email}</a>
                                </p>
                            )}
                        </div>

                        {/* Alternate Leader Section */}
                        {isValidValue(team.altLeader) && (
                            <div className="contact-section alt-leader">
                                <p className="section-title">👥 Alternate Leader</p>
                                <p className="contact-name">{team.altLeader}</p>
                                {isValidPhone(team.altPhone) && (
                                    <p className="contact-item">
                                        📞 <a href={`tel:${team.altPhone}`} className="contact-link">{team.altPhone}</a>
                                    </p>
                                )}
                                {isValidEmail(team.altEmail) && (
                                    <p className="contact-item">
                                        ✉️ <a href={`mailto:${team.altEmail}`} className="contact-link">{team.altEmail}</a>
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Area Coordinator Section */}
                        {isValidValue(team.areaCoordinator) && (
                            <div className="contact-section coordinator">
                                <p className="section-title">🗺️ Area Coordinator</p>
                                <p className="contact-name">{team.areaCoordinator}</p>
                                {team.areaCoordinatorEmail && (
                                    <p className="contact-item">
                                        ✉️ {formatCoordinatorEmails(team.areaCoordinatorEmail)}
                                    </p>
                                )}
                                {isValidValue(team.area) && (
                                    <p className="contact-item">📍 Area: {team.area}</p>
                                )}
                            </div>
                        )}

                        {/* Depot Location */}
                        {isValidValue(team.depotLocation) && (
                            <p className="depot-location">
                                <strong>Depot:</strong> {team.depotLocation}
                            </p>
                        )}
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
