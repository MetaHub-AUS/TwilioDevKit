/**
 * NFAEP Contact Center Metrics Lambda
 * Fetches Amazon Connect queue metrics (if Connect is configured)
 */

const { ConnectClient, GetCurrentMetricDataCommand } = require('@aws-sdk/client-connect');

const connectClient = new ConnectClient({ region: process.env.AWS_REGION || 'ap-southeast-2' });

// Environment variables
const CONNECT_INSTANCE_ID = process.env.CONNECT_INSTANCE_ID;
const CONNECT_QUEUE_ARNS = process.env.CONNECT_QUEUE_ARNS ? process.env.CONNECT_QUEUE_ARNS.split(',') : [];

/**
 * Get Amazon Connect metrics
 */
exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  // If Connect is not configured, return mock data
  if (!CONNECT_INSTANCE_ID || CONNECT_QUEUE_ARNS.length === 0) {
    console.log('Amazon Connect not configured, returning mock metrics');
    return {
      contactsInQueue: 0,
      agentsAvailable: 0,
      oldestContactAgeSeconds: 0,
      lastUpdated: new Date().toISOString()
    };
  }

  try {
    const command = new GetCurrentMetricDataCommand({
      InstanceId: CONNECT_INSTANCE_ID,
      Filters: {
        Queues: CONNECT_QUEUE_ARNS,
        Channels: ['VOICE', 'CHAT', 'TASK']
      },
      CurrentMetrics: [
        { Name: 'AGENTS_AVAILABLE', Unit: 'COUNT' },
        { Name: 'CONTACTS_IN_QUEUE', Unit: 'COUNT' },
        { Name: 'OLDEST_CONTACT_AGE', Unit: 'SECONDS' }
      ]
    });

    const response = await connectClient.send(command);

    let contactsInQueue = 0;
    let agentsAvailable = 0;
    let oldestContactAgeSeconds = 0;

    if (response.MetricResults) {
      for (const result of response.MetricResults) {
        if (result.Collections) {
          for (const collection of result.Collections) {
            const metric = collection.Metric;
            const value = collection.Value || 0;

            if (metric.Name === 'CONTACTS_IN_QUEUE') {
              contactsInQueue += value;
            } else if (metric.Name === 'AGENTS_AVAILABLE') {
              agentsAvailable += value;
            } else if (metric.Name === 'OLDEST_CONTACT_AGE') {
              oldestContactAgeSeconds = Math.max(oldestContactAgeSeconds, value);
            }
          }
        }
      }
    }

    return {
      contactsInQueue,
      agentsAvailable,
      oldestContactAgeSeconds,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching Connect metrics:', error);

    // Return mock data on error
    return {
      contactsInQueue: 0,
      agentsAvailable: 0,
      oldestContactAgeSeconds: 0,
      lastUpdated: new Date().toISOString()
    };
  }
};
