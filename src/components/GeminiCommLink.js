
import React, { useState } from 'react';

const GeminiCommLink = () => {
    const [status, setStatus] = useState('Available');
    const [number, setNumber] = useState('');

    const append = (n) => setNumber(prev => prev + n);

    return (
        <div className="panel dark-panel">
            <div className="comm-header-dark">
                <h3>📞 Comm Link</h3>
                <div className="status-badge-dark">
                    <span className="dot green"></span> {status}
                </div>
            </div>

            {/* IFRAME CONTAINER WOULD GO HERE */}
            <div id="ccp-container" style={{display:'none'}}></div>

            <div className="dark-pad">
                <input 
                    className="dark-input"
                    value={number} 
                    onChange={e => setNumber(e.target.value)}
                    placeholder="Enter Number..."
                />
                
                <div className="dial-grid-dark">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map(n => (
                        <button key={n} className="dial-btn-dark" onClick={() => append(n)}>{n}</button>
                    ))}
                </div>

                <div className="call-actions">
                    <button className="call-btn-dark">Call</button>
                </div>
            </div>
        </div>
    );
};
export default GeminiCommLink;
