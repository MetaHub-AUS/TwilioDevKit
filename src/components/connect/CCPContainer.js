/**
 * NFAEP Amazon Connect CCP Container
 * Embeds the Amazon Connect Contact Control Panel
 */

import React, { useEffect, useRef, useState } from 'react';
import './CCPContainer.css';

const CCPContainer = ({ ccpUrl, instanceUrl, onAgentStateChange }) => {
  const containerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only initialize if CCP URL is provided
    if (!ccpUrl) {
      setError('CCP URL not configured');
      return;
    }

    try {
      // Check if connect is available (Amazon Connect Streams API)
      if (window.connect) {
        console.log('Initializing Amazon Connect CCP...');

        // Initialize CCP
        window.connect.core.initCCP(containerRef.current, {
          ccpUrl: ccpUrl,
          loginPopup: true,
          softphone: {
            allowFramedSoftphone: true
          }
        });

        // Subscribe to agent events
        window.connect.agent((agent) => {
          console.log('Agent initialized:', agent.getName());

          agent.onStateChange((agentStateChange) => {
            console.log('Agent state changed:', agentStateChange.newState);
            if (onAgentStateChange) {
              onAgentStateChange(agentStateChange);
            }
          });
        });

        // Subscribe to contact events
        window.connect.contact((contact) => {
          console.log('Contact event:', contact.getContactId());

          contact.onConnected(() => {
            console.log('Contact connected');
          });

          contact.onEnded(() => {
            console.log('Contact ended');
          });
        });

        setIsLoaded(true);
      } else {
        console.warn('Amazon Connect Streams API not loaded');
        setError('Connect Streams API not available');
      }
    } catch (err) {
      console.error('Error initializing CCP:', err);
      setError(err.message);
    }
  }, [ccpUrl, onAgentStateChange]);

  if (error) {
    return (
      <div className="ccp-container ccp-error">
        <div className="error-message">
          <h3>⚠️ CCP Not Available</h3>
          <p>{error}</p>
          <small>Configure Amazon Connect to enable this feature</small>
        </div>
      </div>
    );
  }

  if (!ccpUrl) {
    return (
      <div className="ccp-container ccp-placeholder">
        <div className="placeholder-content">
          <div className="placeholder-icon">📞</div>
          <h3>Amazon Connect</h3>
          <p>CCP will appear here when configured</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ccp-container">
      {!isLoaded && (
        <div className="ccp-loading">
          <div className="spinner"></div>
          <p>Loading Contact Control Panel...</p>
        </div>
      )}
      <div
        ref={containerRef}
        id="ccp-container"
        className="ccp-iframe"
        style={{ display: isLoaded ? 'block' : 'none' }}
      />
    </div>
  );
};

export default CCPContainer;
