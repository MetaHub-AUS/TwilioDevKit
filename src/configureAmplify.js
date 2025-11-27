/**
 * NFAEP Amplify Configuration
 * Configure AWS Amplify with environment-specific settings
 */

import { Amplify } from 'aws-amplify';

/**
 * Configure Amplify
 * This should be called once at app startup
 */
export function configureAmplify() {
  // Check if running in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';

  // For now, use a mock configuration for local development
  // In production, these values will come from environment variables or Amplify CLI
  const amplifyConfig = {
    aws_project_region: process.env.REACT_APP_AWS_REGION || 'ap-southeast-2',
    aws_appsync_graphqlEndpoint: process.env.REACT_APP_GRAPHQL_ENDPOINT || 'http://localhost:20002/graphql',
    aws_appsync_region: process.env.REACT_APP_AWS_REGION || 'ap-southeast-2',
    aws_appsync_authenticationType: process.env.REACT_APP_AUTH_TYPE || 'API_KEY',
    aws_appsync_apiKey: process.env.REACT_APP_API_KEY || 'da2-fakeApiId123456',

    // Cognito Configuration (optional - for authentication)
    aws_cognito_region: process.env.REACT_APP_AWS_REGION || 'ap-southeast-2',
    aws_user_pools_id: process.env.REACT_APP_USER_POOL_ID || '',
    aws_user_pools_web_client_id: process.env.REACT_APP_USER_POOL_CLIENT_ID || '',

    // DataStore Configuration
    aws_appsync_dangerously_connect_to_http_endpoint_for_testing: isDevelopment,

    // API Configuration
    API: {
      GraphQL: {
        endpoint: process.env.REACT_APP_GRAPHQL_ENDPOINT || 'http://localhost:20002/graphql',
        region: process.env.REACT_APP_AWS_REGION || 'ap-southeast-2',
        defaultAuthMode: process.env.REACT_APP_AUTH_TYPE || 'apiKey',
        apiKey: process.env.REACT_APP_API_KEY || 'da2-fakeApiId123456'
      }
    }
  };

  try {
    Amplify.configure(amplifyConfig);
    console.log('✓ Amplify configured successfully');

    if (isDevelopment) {
      console.log('📡 Development mode - using local/mock endpoints');
    }
  } catch (error) {
    console.error('✗ Error configuring Amplify:', error);

    // In development, continue with mock data
    if (isDevelopment) {
      console.warn('⚠ Continuing with mock data for development');
    } else {
      throw error;
    }
  }
}

export default configureAmplify;
