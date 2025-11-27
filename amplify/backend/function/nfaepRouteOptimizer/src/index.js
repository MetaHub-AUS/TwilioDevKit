/**
 * NFAEP Route Optimizer Lambda
 * Submits async route optimization jobs to DynamoDB for processing
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

const ROUTE_JOBS_TABLE = process.env.ROUTE_JOBS_TABLE || 'NFAEPRouteJobs';

/**
 * Submit route optimization job
 * Creates a PENDING job in DynamoDB which triggers the RouteJobProcessor via Streams
 */
exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const { bookings, date } = event.arguments;
  const jobId = randomUUID();

  if (!bookings || bookings.length === 0) {
    throw new Error('No bookings provided');
  }

  if (!date) {
    throw new Error('Date is required');
  }

  // Create PENDING job record
  const job = {
    jobId,
    status: 'PENDING',
    bookings: JSON.stringify(bookings),
    date,
    createdAt: new Date().toISOString()
  };

  await docClient.send(new PutCommand({
    TableName: ROUTE_JOBS_TABLE,
    Item: job
  }));

  console.log('Created route job:', jobId);

  return {
    jobId,
    status: 'PENDING'
  };
};
