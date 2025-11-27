/**
 * NFAEP Field Dashboard Component
 * Field operations management with route optimization
 */

import React, { useState, useEffect, useCallback } from 'react';
import { generateExactRoutePDF } from '../../utils/generateRoutePDF';
import { getBrisbaneDate, toAwsDate, toDisplayDate } from '../../utils/dateHelpers';
import './FieldDashboard.css';

const FieldDashboard = ({ onSignOut }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getBrisbaneDate());
  const [savedRoutes, setSavedRoutes] = useState(null);
  const [optimizing, setOptimizing] = useState(false);
  const [siteId, setSiteId] = useState('Gold Coast');

  const displayDate = toDisplayDate(selectedDate);
  const awsDate = toAwsDate(selectedDate);

  // Load jobs for selected date
  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: Replace with real DataStore query
      // const siteDate = createSiteDate(siteId, awsDate);
      // const slots = await DataStore.query(AppointmentSlot, c => c.siteDate.eq(siteDate));

      // Mock data for now
      const mockJobs = [
        {
          time: '07:30',
          status: 'BOOKED',
          jobNumber: 'JOB-001',
          address: '123 Main St, Gold Coast',
          teamNumberFound: '60',
          propertySizeHa: 2.5,
          customerName: 'John Smith',
          customerPhone: '0411222333',
          version: 1
        },
        {
          time: '08:30',
          status: 'BOOKED',
          jobNumber: 'JOB-002',
          address: '456 Beach Rd, Gold Coast',
          teamNumberFound: '60',
          propertySizeHa: 1.8,
          customerName: 'Jane Doe',
          customerPhone: '0422333444',
          version: 1
        },
        {
          time: '10:00',
          status: 'OPEN',
          version: 1
        }
      ];

      setJobs(mockJobs);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  }, [siteId, awsDate]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Optimize routes
  const handleOptimizeRoutes = async () => {
    setOptimizing(true);
    try {
      const bookedJobs = jobs.filter(j => j.status === 'BOOKED');

      if (bookedJobs.length === 0) {
        alert('No booked jobs to optimize');
        return;
      }

      // TODO: Call submitRouteJob mutation
      // const bookings = bookedJobs.map(job => ({
      //   time: job.time,
      //   address: job.address,
      //   jobNumber: job.jobNumber,
      //   siteCode: job.siteCode,
      //   propertySizeHa: job.propertySizeHa,
      //   teamNumberFound: job.teamNumberFound,
      //   comment: job.comment
      // }));

      // const response = await API.graphql({
      //   query: submitRouteJob,
      //   variables: { bookings, date: awsDate }
      // });

      // For now, create mock optimized routes
      const mockRoutes = {
        summary: {
          totalBookings: bookedJobs.length,
          totalVehicles: 1,
          totalDistance: 45.2
        },
        routes: [
          {
            vehicleId: '60',
            stops: bookedJobs.map((job, idx) => ({
              stopNumber: idx + 1,
              time: job.time,
              address: job.address,
              jobNumber: job.jobNumber,
              propertySizeHa: job.propertySizeHa,
              estimatedDuration: 45,
              distanceFromPrevious: idx === 0 ? 0 : 8.5
            })),
            totalHa: bookedJobs.reduce((sum, j) => sum + (j.propertySizeHa || 0), 0)
          }
        ]
      };

      setSavedRoutes({ vehicles: mockRoutes.routes, summary: mockRoutes.summary });
      alert('Routes optimized successfully!');
    } catch (error) {
      console.error('Error optimizing routes:', error);
      alert('Failed to optimize routes');
    } finally {
      setOptimizing(false);
    }
  };

  // Generate PDF
  const generateRoutePDF = () => {
    if (!savedRoutes) {
      alert('Please optimize routes first');
      return;
    }

    const transformedData = {
      summary: savedRoutes.summary,
      routes: savedRoutes.vehicles
    };

    generateExactRoutePDF(transformedData, displayDate);
  };

  // Navigate date
  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
    setSavedRoutes(null);
  };

  return (
    <div className="field-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>🚁 Field Operations Dashboard</h1>
          <p className="subtitle">Route planning & job management</p>
        </div>
        <div className="header-right">
          {onSignOut && (
            <button className="btn-secondary" onClick={onSignOut}>
              Sign Out
            </button>
          )}
        </div>
      </header>

      <div className="dashboard-controls">
        <div className="date-control">
          <button className="btn-icon" onClick={() => changeDate(-1)}>←</button>
          <div className="date-display">
            <span className="date-label">Selected Date</span>
            <span className="date-value">{displayDate}</span>
          </div>
          <button className="btn-icon" onClick={() => changeDate(1)}>→</button>
        </div>

        <div className="site-control">
          <label>Site:</label>
          <select value={siteId} onChange={(e) => setSiteId(e.target.value)}>
            <option value="Gold Coast">Gold Coast</option>
            <option value="Brisbane South">Brisbane South</option>
            <option value="Logan">Logan</option>
            <option value="Ipswich">Ipswich</option>
          </select>
        </div>

        <div className="action-buttons">
          <button
            className="btn-primary"
            onClick={handleOptimizeRoutes}
            disabled={optimizing || jobs.filter(j => j.status === 'BOOKED').length === 0}
          >
            {optimizing ? 'Optimizing...' : '🧭 Optimize Routes'}
          </button>

          <button
            className="btn-success"
            onClick={generateRoutePDF}
            disabled={!savedRoutes}
          >
            📄 Generate PDF
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="jobs-panel">
          <h2>Today's Jobs ({jobs.length})</h2>

          {loading ? (
            <div className="loading">Loading jobs...</div>
          ) : (
            <div className="jobs-list">
              {jobs.map((job, idx) => (
                <div key={idx} className={`job-card ${job.status.toLowerCase()}`}>
                  <div className="job-header">
                    <span className="job-time">{job.time}</span>
                    <span className={`job-status status-${job.status.toLowerCase()}`}>
                      {job.status}
                    </span>
                  </div>

                  {job.status === 'BOOKED' && (
                    <div className="job-details">
                      <div className="job-field">
                        <strong>Job #:</strong> {job.jobNumber}
                      </div>
                      <div className="job-field">
                        <strong>Address:</strong> {job.address}
                      </div>
                      <div className="job-field">
                        <strong>Customer:</strong> {job.customerName}
                      </div>
                      <div className="job-field">
                        <strong>Size:</strong> {job.propertySizeHa} ha
                      </div>
                      <div className="job-field">
                        <strong>Team:</strong> {job.teamNumberFound}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {savedRoutes && (
          <div className="routes-panel">
            <h2>Optimized Routes</h2>
            <div className="route-summary">
              <div className="summary-item">
                <span className="summary-label">Total Bookings</span>
                <span className="summary-value">{savedRoutes.summary.totalBookings}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Vehicles</span>
                <span className="summary-value">{savedRoutes.summary.totalVehicles}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Distance</span>
                <span className="summary-value">{savedRoutes.summary.totalDistance?.toFixed(1)} km</span>
              </div>
            </div>

            <div className="routes-list">
              {savedRoutes.vehicles.map((vehicle, idx) => (
                <div key={idx} className="vehicle-route">
                  <h3>Vehicle {vehicle.vehicleId}</h3>
                  <div className="stops">
                    {vehicle.stops.map((stop, stopIdx) => (
                      <div key={stopIdx} className="stop-item">
                        <span className="stop-number">{stop.stopNumber}</span>
                        <span className="stop-time">{stop.time}</span>
                        <span className="stop-address">{stop.address}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FieldDashboard;
