
import React, { useState, useEffect } from 'react';

const SiteLookup = () => {
    const [siteId, setSiteId] = useState('');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [simulating, setSimulating] = useState(false);
    const [simulation, setSimulation] = useState(null);
    const [note, setNote] = useState('');
    const [isListening, setIsListening] = useState(false);

    // Debounce Lookup
    useEffect(() => {
        const timer = setTimeout(() => {
            if (siteId.length >= 5) fetchSiteData(siteId);
        }, 800);
        return () => clearTimeout(timer);
    }, [siteId]);

    const fetchSiteData = async (id) => {
        setLoading(true);
        setData(null);
        setSimulation(null);
        try {
            const formattedId = id.toUpperCase().startsWith('SITE-') ? id : `SITE-${id}`;
            const res = await fetch(`http://localhost:3001/api/site/${formattedId}`);
            if (res.ok) setData(await res.json());
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const runSimulation = async (time) => {
        setSimulating(true);
        try {
            const res = await fetch('http://localhost:3001/api/simulate-booking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId, time, teamType: 'UTV' })
            });
            setSimulation(await res.json());
        } catch(e) {}
        finally { setSimulating(false); }
    }

    // Voice Dictation Logic
    const toggleListening = () => {
        if (!('webkitSpeechRecognition' in window)) return alert("Browser does not support speech");
        
        if (isListening) {
            setIsListening(false);
            return;
        }

        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-AU';
        recognition.start();
        setIsListening(true);

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setNote(prev => prev + " " + transcript);
            setIsListening(false);
        };
    };

    return (
        <div className="panel-container">
            <div className="panel-left">
                <h2>Bio-Memory Lookup</h2>
                <div className="input-group">
                    <label>SITE ID (Try SITE-49201)</label>
                    <input 
                        className="gov-input" 
                        value={siteId} 
                        onChange={e => setSiteId(e.target.value)} 
                        placeholder="Scan or Type ID..."
                        autoFocus
                    />
                    {loading && <div className="spinner">Searching Database...</div>}
                </div>

                {data && (
                    <div className="result-card fade-in">
                        <div className="badge-row">
                            <span className="badge" style={{backgroundColor: data.zoneColor}}>{data.zone}</span>
                            <span className="badge history">{data.accessHistory}</span>
                        </div>
                        <h3>{data.address}</h3>
                        
                        <div className="danger-zone">
                            <label>⚠️ HAZARDS DETECTED</label>
                            <ul>{data.hazards.map(h => <li key={h}>{h}</li>)}</ul>
                        </div>

                        <div className="booking-section">
                            <label>Select Time Slot</label>
                            <div className="time-grid">
                                {['08:00', '10:30', '13:00'].map(time => (
                                    <button 
                                        key={time} 
                                        className="time-btn"
                                        onClick={() => runSimulation(time)}
                                    >
                                        {time}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="input-group">
                            <label>Access Notes (Voice Enabled)</label>
                            <div className="voice-input-wrapper">
                                <textarea 
                                    className="gov-textarea" 
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                />
                                <button 
                                    className={`mic-btn ${isListening ? 'listening' : ''}`}
                                    onClick={toggleListening}
                                >
                                    {isListening ? '🛑' : '🎙️'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="panel-right">
                {simulating && <div className="analyzing">🤖 Gemini RouteBrain is analyzing traffic & schedules...</div>}
                
                {simulation && (
                    <div className="ai-insight-card fade-in">
                        <h3>Route Impact Analysis</h3>
                        <div className="score-ring" style={{
                            borderColor: simulation.efficiencyScore > 80 ? '#28a745' : '#f39c12'
                        }}>
                            {simulation.efficiencyScore}%
                            <span>Efficiency</span>
                        </div>
                        <div className="insight-details">
                            <p><strong>Impact:</strong> {simulation.impactLabel}</p>
                            <p><strong>Added Travel:</strong> {simulation.travelTimeAdded}</p>
                            <p><strong>Assigned:</strong> {simulation.nearestTech}</p>
                        </div>
                        <button className="gov-btn primary">CONFIRM OPTIMIZED BOOKING</button>
                    </div>
                )}
                
                {!simulation && !simulating && (
                    <div className="placeholder-state">
                        <div className="icon">🧠</div>
                        <p>Select a time slot to see AI Route Predictions</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SiteLookup;
