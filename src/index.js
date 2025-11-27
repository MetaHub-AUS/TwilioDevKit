import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { configureAmplify } from './configureAmplify';

// Initialize AWS Amplify
try {
  configureAmplify();
  console.log('✓ AWS Amplify initialized successfully');
} catch (error) {
  console.error('✗ Failed to initialize Amplify:', error);
  console.warn('⚠ Application will run with mock data');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
