
import React, { useState, useEffect } from 'react';
import { AppointmentSlot, SlotStatus } from '../../models';
import { predictSlotEfficiency } from '../../utils/geminiAi';
import { getBrisbaneDate, toAwsDate, toDisplayDate, createSiteDate, formatPhoneDisplay } from '../../utils/dateHelpers';

const RevisitTable = ({ isOpen }) => {
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [slots, setSlots] = useState([]);
    const [bookingModal, setBookingModal] = useState(null);
    const [bookingForm, setBookingForm] = useState({
        customerName: '',
        customerPhone: '',
        address: '',
        propertySizeHa: '',
        jobNumber: '',
        teamNumberFound: '',
        comment: ''
    });
    const [siteId, setSiteId] = useState('Gold Coast');
    const [selectedDate, setSelectedDate] = useState(getBrisbaneDate());

    const displayDate = toDisplayDate(selectedDate);
    const awsDate = toAwsDate(selectedDate);

    useEffect(() => {
        const loadSlots = async () => {
            // TODO: Replace with real DataStore query
            // const siteDate = createSiteDate(siteId, awsDate);
            // const results = await DataStore.query(AppointmentSlot, c => c.siteDate.eq(siteDate));

            const times = ['07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00'];
            const mockSlots = times.map(t => ({
                time: t,
                status: Math.random() > 0.7 ? SlotStatus.BOOKED : SlotStatus.OPEN,
                jobNumber: Math.random() > 0.8 ? 'JOB-' + Math.floor(Math.random()*1000) : null,
                address: Math.random() > 0.7 ? '123 Main St, Gold Coast' : null,
                teamNumberFound: Math.random() > 0.7 ? '60' : null,
                customerName: Math.random() > 0.7 ? 'John Smith' : null,
                customerPhone: Math.random() > 0.7 ? '0411222333' : null,
                propertySizeHa: Math.random() > 0.7 ? parseFloat((Math.random() * 5).toFixed(1)) : null,
                version: 1
            }));
            setSlots(mockSlots);
        };
        loadSlots();
    }, [siteId, awsDate]);

    const handleBook = async () => {
        try {
            // TODO: Replace with real bookSlot mutation
            // const result = await API.graphql({
            //   query: bookSlot,
            //   variables: {
            //     siteId,
            //     date: awsDate,
            //     time: bookingModal.time,
            //     expectedVersion: bookingModal.version,
            //     ...bookingForm
            //   }
            // });

            // Mock booking
            setSlots(prev => prev.map(s =>
                s.time === bookingModal.time
                    ? {
                        ...s,
                        status: SlotStatus.BOOKED,
                        ...bookingForm,
                        version: s.version + 1
                    }
                    : s
            ));

            setBookingModal(null);
            setBookingForm({
                customerName: '',
                customerPhone: '',
                address: '',
                propertySizeHa: '',
                jobNumber: '',
                teamNumberFound: '',
                comment: ''
            });
        } catch (error) {
            console.error('Error booking slot:', error);
            alert('Failed to book slot');
        }
    };

    const handleOpenBookingModal = (slot) => {
        setBookingModal(slot);
        // Pre-fill form if rebooking
        if (slot.status === SlotStatus.BOOKED) {
            setBookingForm({
                customerName: slot.customerName || '',
                customerPhone: slot.customerPhone || '',
                address: slot.address || '',
                propertySizeHa: slot.propertySizeHa || '',
                jobNumber: slot.jobNumber || '',
                teamNumberFound: slot.teamNumberFound || '',
                comment: slot.comment || ''
            });
        }
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
                                {isBooked ? (
                                    <div className="job-details-mini">
                                        <div className="job-tag">{slot.jobNumber || 'NO JOB#'}</div>
                                        {slot.customerName && <div className="customer-name">{slot.customerName}</div>}
                                    </div>
                                ) : (
                                    <button className="analyze-btn" onClick={() => handleOpenBookingModal(slot)}>Book Now</button>
                                )}
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
                                        {slot.status === 'OPEN' ? (
                                            <button className="table-btn" onClick={() => handleOpenBookingModal(slot)}>Book</button>
                                        ) : (
                                            <button className="table-btn view" onClick={() => handleOpenBookingModal(slot)}>View</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ENHANCED BOOKING MODAL with all fields */}
            {bookingModal && (
                <div className="modal-overlay">
                    <div className="booking-modal">
                        <div className="modal-header">
                            Book Appointment: {bookingModal.time} - {displayDate}
                        </div>
                        <div className="modal-body">
                            <div className="form-grid">
                                <div className="form-field">
                                    <label>Customer Name *</label>
                                    <input
                                        type="text"
                                        className="gov-input"
                                        value={bookingForm.customerName}
                                        onChange={(e) => setBookingForm({...bookingForm, customerName: e.target.value})}
                                        placeholder="Enter customer name"
                                    />
                                </div>

                                <div className="form-field">
                                    <label>Phone *</label>
                                    <input
                                        type="tel"
                                        className="gov-input"
                                        value={formatPhoneDisplay(bookingForm.customerPhone)}
                                        onChange={(e) => setBookingForm({...bookingForm, customerPhone: e.target.value.replace(/\D/g, '')})}
                                        placeholder="0411 222 333"
                                    />
                                </div>

                                <div className="form-field full-width">
                                    <label>Property Address *</label>
                                    <input
                                        type="text"
                                        className="gov-input"
                                        value={bookingForm.address}
                                        onChange={(e) => setBookingForm({...bookingForm, address: e.target.value})}
                                        placeholder="Enter property address"
                                    />
                                </div>

                                <div className="form-field">
                                    <label>Property Size (ha)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        className="gov-input"
                                        value={bookingForm.propertySizeHa}
                                        onChange={(e) => setBookingForm({...bookingForm, propertySizeHa: e.target.value})}
                                        placeholder="2.5"
                                    />
                                </div>

                                <div className="form-field">
                                    <label>Job Number</label>
                                    <input
                                        type="text"
                                        className="gov-input"
                                        value={bookingForm.jobNumber}
                                        onChange={(e) => setBookingForm({...bookingForm, jobNumber: e.target.value})}
                                        placeholder="JOB-XXX"
                                    />
                                </div>

                                <div className="form-field">
                                    <label>Team Number</label>
                                    <input
                                        type="text"
                                        className="gov-input"
                                        value={bookingForm.teamNumberFound}
                                        onChange={(e) => setBookingForm({...bookingForm, teamNumberFound: e.target.value})}
                                        placeholder="60"
                                    />
                                </div>

                                <div className="form-field full-width">
                                    <label>Comments</label>
                                    <textarea
                                        className="gov-input"
                                        rows="3"
                                        value={bookingForm.comment}
                                        onChange={(e) => setBookingForm({...bookingForm, comment: e.target.value})}
                                        placeholder="Additional notes..."
                                    />
                                </div>
                            </div>

                            <div className="action-row">
                                <button
                                    className="gov-btn primary"
                                    onClick={handleBook}
                                    disabled={!bookingForm.customerName || !bookingForm.customerPhone || !bookingForm.address}
                                >
                                    Confirm Booking
                                </button>
                                <button
                                    className="gov-btn secondary"
                                    onClick={() => {
                                        setBookingModal(null);
                                        setBookingForm({
                                            customerName: '',
                                            customerPhone: '',
                                            address: '',
                                            propertySizeHa: '',
                                            jobNumber: '',
                                            teamNumberFound: '',
                                            comment: ''
                                        });
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default RevisitTable;
