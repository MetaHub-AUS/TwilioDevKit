
import React, { useState } from 'react';

const SmartSurvey = () => {
    const [category, setCategory] = useState('');
    const [sentiment, setSentiment] = useState('Neutral');

    return (
        <div className="panel white-panel survey-panel-wrapper">
            <div className="survey-header">Post-Call Survey</div>
            <div className="survey-body">
                <button className="voice-fill-btn">✨ Auto-Fill with Voice</button>

                <div className="survey-section">
                    <label>Category</label>
                    <select className="gov-select" onChange={e => setCategory(e.target.value)}>
                        <option>Select Category...</option>
                        <option>SAR - Suspect Ant Report</option>
                        <option>TAR - Treatment</option>
                        <option>Aerial Operations</option>
                        <option>Complaint</option>
                    </select>
                </div>

                <div className="survey-section">
                    <label>Sentiment</label>
                    <div className="sentiment-row">
                        {['Positive', 'Neutral', 'Negative'].map(s => (
                            <button 
                                key={s}
                                className={`sent-pill ${s} ${sentiment===s?'active':''}`}
                                onClick={() => setSentiment(s)}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                <button className="submit-btn-teal">Submit</button>
            </div>
        </div>
    );
};
export default SmartSurvey;
