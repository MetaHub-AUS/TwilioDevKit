/**
 * NFAEP Route Processor Lambda
 * Processes route optimization jobs using AWS Bedrock (Claude)
 * Triggered by DynamoDB Streams on RouteJobs table
 */

const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });
const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

// Environment variables
const ROUTE_JOBS_TABLE = process.env.ROUTE_JOBS_TABLE || 'NFAEPRouteJobs';
const OPTIMIZED_ROUTE_TABLE = process.env.OPTIMIZED_ROUTE_TABLE || 'OptimizedRoute';
const DEPOT_ADDRESS = process.env.DEPOT_ADDRESS || 'NFAEP Depot, Brisbane';
const DEPOT_LAT = parseFloat(process.env.DEPOT_LAT || '-27.4698');
const DEPOT_LNG = parseFloat(process.env.DEPOT_LNG || '153.0251');
const BEDROCK_MODEL_ID = 'anthropic.claude-3-5-sonnet-20241022-v2:0';

/**
 * Calculate simple distance (haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Simple geocoding mock (in production, use actual geocoding service)
 */
function mockGeocode(address) {
  // Return random coordinates around Brisbane area
  const baseLat = -27.4698 + (Math.random() - 0.5) * 0.5;
  const baseLng = 153.0251 + (Math.random() - 0.5) * 0.5;
  return { lat: baseLat, lng: baseLng };
}

/**
 * Build route optimization prompt for Claude
 */
function buildRoutePrompt(bookings, date, depotAddress) {
  const bookingsList = bookings.map((b, idx) =>
    `${idx + 1}. Time: ${b.time}, Address: ${b.address}, Job: ${b.jobNumber || 'N/A'}, ` +
    `Size: ${b.propertySizeHa || 'N/A'} ha, Team: ${b.teamNumberFound || 'TBD'}`
  ).join('\n');

  return `You are a route optimization AI for the National Fire Ant Eradication Program (NFAEP).

DATE: ${date}
DEPOT: ${depotAddress}
BOOKINGS: ${bookings.length}

${bookingsList}

Your task:
1. Group bookings by team (teamNumberFound) or assign teams if not specified
2. Optimize the route order to minimize travel time
3. Ensure all bookings can be completed within working hours (7:30 AM - 4:00 PM)
4. Account for property size (larger properties take more time)
5. Start and end all routes at the depot

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "vehicles": [
    {
      "vehicleNumber": "60",
      "route": [
        {
          "stopNumber": 1,
          "time": "07:30",
          "address": "address here",
          "jobNumber": "JOB-123",
          "propertySizeHa": 2.5,
          "estimatedDuration": 45,
          "distanceFromPrevious": 0
        }
      ]
    }
  ],
  "summary": {
    "totalDistance": 120.5,
    "totalBookings": ${bookings.length},
    "totalVehicles": 2
  }
}

NO markdown, NO code blocks, ONLY the JSON object.`;
}

/**
 * Invoke Bedrock Claude model
 */
async function invokeClaudeModel(prompt) {
  const payload = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 4096,
    temperature: 0.3,
    messages: [{
      role: "user",
      content: prompt
    }]
  };

  const command = new InvokeModelCommand({
    modelId: BEDROCK_MODEL_ID,
    body: JSON.stringify(payload)
  });

  const response = await bedrockClient.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));

  if (!responseBody.content || !responseBody.content[0] || !responseBody.content[0].text) {
    throw new Error('Invalid response from Bedrock');
  }

  return responseBody.content[0].text;
}

/**
 * Process route optimization
 */
async function processRoutes(bookings, date, jobId) {
  console.log(`Processing ${bookings.length} bookings for ${date}`);

  // Build prompt
  const prompt = buildRoutePrompt(bookings, date, DEPOT_ADDRESS);

  // Invoke Claude
  const responseText = await invokeClaudeModel(prompt);

  // Parse JSON response
  let routeData;
  try {
    // Remove any markdown code blocks if present
    const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    routeData = JSON.parse(cleanedText);
  } catch (error) {
    console.error('Failed to parse Claude response:', responseText);
    throw new Error('Invalid JSON response from route optimizer');
  }

  // Validate response structure
  if (!routeData.vehicles || !Array.isArray(routeData.vehicles)) {
    throw new Error('Invalid route data structure');
  }

  // Cache the optimized route
  const teamIds = [...new Set(bookings.map(b => b.teamNumberFound).filter(Boolean))];
  const primaryTeamId = teamIds.length > 0 ? teamIds[0] : 'default';
  const routeId = `${date}_${primaryTeamId}`;

  await docClient.send(new PutCommand({
    TableName: OPTIMIZED_ROUTE_TABLE,
    Item: {
      routeId,
      date,
      siteId: primaryTeamId,
      routeData: JSON.stringify(routeData),
      summary: JSON.stringify(routeData.summary),
      createdAt: new Date().toISOString(),
      jobId
    }
  }));

  console.log('Cached optimized route:', routeId);

  return routeData;
}

/**
 * Update job status
 */
async function updateJobStatus(jobId, status, result = null, error = null) {
  const updateParams = {
    TableName: ROUTE_JOBS_TABLE,
    Key: { jobId },
    UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
    ExpressionAttributeNames: {
      '#status': 'status'
    },
    ExpressionAttributeValues: {
      ':status': status,
      ':updatedAt': new Date().toISOString()
    }
  };

  if (result) {
    updateParams.UpdateExpression += ', #result = :result';
    updateParams.ExpressionAttributeNames['#result'] = 'result';
    updateParams.ExpressionAttributeValues[':result'] = JSON.stringify(result);
  }

  if (error) {
    updateParams.UpdateExpression += ', #error = :error';
    updateParams.ExpressionAttributeNames['#error'] = 'error';
    updateParams.ExpressionAttributeValues[':error'] = error;
  }

  await docClient.send(new UpdateCommand(updateParams));
}

/**
 * Main handler - triggered by DynamoDB Streams
 */
exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    if (record.eventName !== 'INSERT') {
      continue;
    }

    const newImage = record.dynamodb.NewImage;
    const jobId = newImage.jobId.S;
    const status = newImage.status.S;

    if (status !== 'PENDING') {
      continue;
    }

    console.log('Processing new route job:', jobId);

    try {
      // Update to PROCESSING
      await updateJobStatus(jobId, 'PROCESSING');

      // Parse bookings
      const bookings = JSON.parse(newImage.bookings.S);
      const date = newImage.date.S;

      // Process routes
      const result = await processRoutes(bookings, date, jobId);

      // Update to COMPLETED
      await updateJobStatus(jobId, 'COMPLETED', result);

      console.log('Route job completed:', jobId);
    } catch (error) {
      console.error('Error processing route job:', error);
      await updateJobStatus(jobId, 'FAILED', null, error.message);
    }
  }

  return { statusCode: 200 };
};
