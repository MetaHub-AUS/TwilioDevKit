/**
 * NFAEP Slot Mutations Lambda
 * Handles appointment slot state transitions with optimistic locking
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

// Environment variables
const APPOINTMENT_SLOT_TABLE = process.env.APPOINTMENT_SLOT_TABLE_NAME || `AppointmentSlot-${process.env.ENV}`;

/**
 * Create composite key for siteDate
 * @param {string} siteId - Site identifier (e.g., "Gold Coast")
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {string} Composite key (e.g., "site#goldcoast#2025-11-27")
 */
function createSiteDate(siteId, date) {
  const normalizedSiteId = siteId.toLowerCase().replace(/\s+/g, '');
  return `site#${normalizedSiteId}#${date}`;
}

/**
 * Get current slot from DynamoDB
 */
async function getSlot(siteDate, time) {
  const params = {
    TableName: APPOINTMENT_SLOT_TABLE,
    Key: { siteDate, time }
  };

  const result = await docClient.send(new GetCommand(params));
  return result.Item;
}

/**
 * Update slot with optimistic locking
 */
async function updateSlot(siteDate, time, updates, expectedVersion) {
  const currentSlot = await getSlot(siteDate, time);

  if (!currentSlot) {
    throw new Error(`Slot not found: ${siteDate} ${time}`);
  }

  if (currentSlot.version !== expectedVersion) {
    throw new Error(`Version mismatch. Expected ${expectedVersion}, got ${currentSlot.version}`);
  }

  const updatedSlot = {
    ...currentSlot,
    ...updates,
    version: currentSlot.version + 1,
    lastUpdated: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await docClient.send(new PutCommand({
    TableName: APPOINTMENT_SLOT_TABLE,
    Item: updatedSlot
  }));

  return updatedSlot;
}

/**
 * Hold a slot (temporary reservation)
 */
async function holdSlot(args) {
  const { siteId, date, time, expectedVersion } = args;
  const siteDate = createSiteDate(siteId, date);

  return await updateSlot(siteDate, time, {
    status: 'HOLD',
    lockExpiresAt: Math.floor(Date.now() / 1000) + 300 // 5 minutes
  }, expectedVersion);
}

/**
 * Release a held slot
 */
async function releaseSlot(args) {
  const { siteId, date, time, expectedVersion } = args;
  const siteDate = createSiteDate(siteId, date);

  return await updateSlot(siteDate, time, {
    status: 'OPEN',
    lockExpiresAt: null
  }, expectedVersion);
}

/**
 * Book a slot
 */
async function bookSlot(args) {
  const { siteId, date, time, expectedVersion, ...bookingData } = args;
  const siteDate = createSiteDate(siteId, date);

  // Normalize phone number (digits only)
  if (bookingData.customerPhone) {
    bookingData.customerPhone = bookingData.customerPhone.replace(/\D/g, '');
  }

  // Normalize team number (strip "Team" prefix, extract digits)
  if (bookingData.teamNumberFound) {
    bookingData.teamNumberFound = bookingData.teamNumberFound.replace(/[^\d]/g, '');
  }

  return await updateSlot(siteDate, time, {
    status: 'BOOKED',
    ...bookingData,
    lockExpiresAt: null
  }, expectedVersion);
}

/**
 * Complete a slot
 */
async function completeSlot(args) {
  const { siteId, date, time, expectedVersion } = args;
  const siteDate = createSiteDate(siteId, date);

  return await updateSlot(siteDate, time, {
    status: 'COMPLETED'
  }, expectedVersion);
}

/**
 * Rebook a slot to a new date/time
 */
async function rebookSlot(args) {
  const { siteId, date, time, newDate, newTime, expectedVersion } = args;
  const oldSiteDate = createSiteDate(siteId, date);
  const newSiteDate = createSiteDate(siteId, newDate);

  const currentSlot = await getSlot(oldSiteDate, time);

  if (!currentSlot) {
    throw new Error(`Slot not found: ${oldSiteDate} ${time}`);
  }

  if (currentSlot.version !== expectedVersion) {
    throw new Error(`Version mismatch. Expected ${expectedVersion}, got ${currentSlot.version}`);
  }

  // Mark old slot as needs rebook
  await updateSlot(oldSiteDate, time, {
    status: 'NEEDS_REBOOK'
  }, expectedVersion);

  // Create new slot
  const newSlot = {
    siteDate: newSiteDate,
    time: newTime,
    status: 'BOOKED',
    clientId: currentSlot.clientId,
    propertyId: currentSlot.propertyId,
    jobNumber: currentSlot.jobNumber,
    siteCode: currentSlot.siteCode,
    propertySizeHa: currentSlot.propertySizeHa,
    address: currentSlot.address,
    teamNumberFound: currentSlot.teamNumberFound,
    estInitial: currentSlot.estInitial,
    comment: currentSlot.comment,
    customerName: currentSlot.customerName,
    customerPhone: currentSlot.customerPhone,
    version: 1,
    lastUpdated: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await docClient.send(new PutCommand({
    TableName: APPOINTMENT_SLOT_TABLE,
    Item: newSlot
  }));

  return newSlot;
}

/**
 * Admin: Open a slot (create if doesn't exist)
 */
async function adminOpenSlot(args) {
  const { siteId, date, time } = args;
  const siteDate = createSiteDate(siteId, date);

  const newSlot = {
    siteDate,
    time,
    status: 'OPEN',
    version: 1,
    lastUpdated: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await docClient.send(new PutCommand({
    TableName: APPOINTMENT_SLOT_TABLE,
    Item: newSlot
  }));

  return newSlot;
}

/**
 * Cancel a booked slot
 */
async function cancelSlot(args) {
  const { siteId, date, time, expectedVersion } = args;
  const siteDate = createSiteDate(siteId, date);

  return await updateSlot(siteDate, time, {
    status: 'OPEN',
    clientId: null,
    propertyId: null,
    jobNumber: null,
    siteCode: null,
    propertySizeHa: null,
    address: null,
    teamNumberFound: null,
    estInitial: null,
    comment: null,
    customerName: null,
    customerPhone: null
  }, expectedVersion);
}

/**
 * Main handler
 */
exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const fieldName = event.fieldName || event.info?.fieldName;
  const args = event.arguments;

  try {
    switch (fieldName) {
      case 'holdSlot':
        return await holdSlot(args);
      case 'releaseSlot':
        return await releaseSlot(args);
      case 'bookSlot':
        return await bookSlot(args);
      case 'completeSlot':
        return await completeSlot(args);
      case 'rebookSlot':
        return await rebookSlot(args);
      case 'adminOpenSlot':
        return await adminOpenSlot(args);
      case 'cancelSlot':
        return await cancelSlot(args);
      default:
        throw new Error(`Unknown operation: ${fieldName}`);
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
