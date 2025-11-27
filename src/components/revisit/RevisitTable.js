
import React, { useState, useEffect } from 'react';
import { AppointmentSlot, SlotStatus } from '../../models';
import { predictSlotEfficiency } from '../../utils/geminiAi';

const RevisitTable = ({ isOpen }) => {
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [slots, setSlots] = useState([]);
    const [bookingModal, setBookingModal] = useState(null);
    const [siteId, setSiteId] = useState('Gold Coast');

    useEffect(() => {
        const loadSlots = async () => {
            const times = ['07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00'];
            const mockSlots = times.map(t => ({ 
                time: t, 
                status: Math.random() > 0.7 ? SlotStatus.BOOKED : SlotStatus.OPEN,
                jobNumber: Math.random() > 0.8 ? 'JOB-' + Math.floor(Math.random()*1000) : null,
                address: '123 Fake St, Southport', // Added for Table View
                team: 'Team 60' // Added for Table View
            }));
            setSlots(mockSlots);
        };
        loadSlots();
    }, [siteId]);

    const handleBook = () => {
        setSlots(prev => prev.map(s => s.time === bookingModal.time ? {...s, status: SlotStatus.BOOKED, jobNumber: 'JOB-NEW'} : s));
        setBookingModal(null);
    };

    return (
        <div className="panel white-panel shadow-panel">
            <div className="gemini-card-header">
                <h2>📡 Gemini Command Center</h2>
                {/* VIEW TOGGLE BUTTONS */}
                <div className="view-toggle">
                    <button 
                        className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                        onClick={() => setViewMode('grid')}
                    >⊞ Grid</button>
                    <button 
                        className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                        onClick={() => setViewMode('list')}
                    >☰ Table</button>
                </div>
            </div>

            <div className="control-bar">
                <input className="gov-input" value={siteId} onChange={e => setSiteId(e.target.value)} />
            </div>

            {/* CONDITIONAL RENDERING: GRID vs LIST */}
            {viewMode === 'grid' ? (
                <div className="slots-grid">
                    {slots.map(slot => {
                        const prediction = predictSlotEfficiency(slot.time);
                        const isBooked = slot.status === SlotStatus.BOOKED;
                        return (
                            <div key={slot.time} className={`slot-card ${slot.status}`}>
                                <div className="slot-time">{slot.time}</div>
                                <div className="slot-status">{slot.status}</div>
                                {!isBooked && <div className="ai-prediction-text">{prediction.rating}</div>}
                                {isBooked ? <div className="job-tag">{slot.jobNumber}</div> : 
                                    <button className="analyze-btn" onClick={() => setBookingModal(slot)}>Analyze</button>
                                }
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* THE TABLE VIEW (Audit Requirement) */
                <div className="table-container">
                    <table className="gemini-table">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Status</th>
                                <th>Job #</th>
                                <th>Address</th>
                                <th>Est. Team</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {slots.map(slot => (
                                <tr key={slot.time} className={slot.status === 'BOOKED' ? 'row-booked' : ''}>
                                    <td className="time-cell">{slot.time}</td>
                                    <td><span className={`status-pill ${slot.status}`}>{slot.status}</span></td>
                                    <td>{slot.jobNumber || '-'}</td>
                                    <td>{slot.address}</td>
                                    <td>{slot.team}</td>
                                    <td>
                                        {slot.status === 'OPEN' && (
                                            <button className="table-btn" onClick={() => setBookingModal(slot)}>Book</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* BOOKING MODAL (Kept same) */}
            {bookingModal && (
                <div className="modal-overlay">
                    <div className="mini-modal">
                        <div className="mini-header">Confirm Booking: {bookingModal.time}</div>
                        <div className="mini-body">
                            <p>Confirm booking for {siteId}?</p>
                            <div className="action-row">
                                <button className="gov-btn primary" onClick={handleBook}>Confirm</button>
                                <button className="gov-btn secondary" onClick={() => setBookingModal(null)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default RevisitTable;
