/**
 * NFAEP Get Route Job Lambda
 * Polls the status of a route optimization job
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

const ROUTE_JOBS_TABLE = process.env.ROUTE_JOBS_TABLE || 'NFAEPRouteJobs';

/**
 * Get route job status
 */
exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const { jobId } = event.arguments;

  if (!jobId) {
    throw new Error('Job ID is required');
  }

  const response = await docClient.send(new GetCommand({
    TableName: ROUTE_JOBS_TABLE,
    Key: { jobId }
  }));

  if (!response.Item) {
    throw new Error(`Job not found: ${jobId}`);
  }

  const job = response.Item;

  return {
    jobId: job.jobId,
    status: job.status, // PENDING | PROCESSING | COMPLETED | FAILED
    result: job.result || null,
    error: job.error || null,
    createdAt: job.createdAt
  };
};
