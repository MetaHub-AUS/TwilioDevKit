/**
 * NFAEP Date & Time Utilities
 * Brisbane timezone-aware date handling
 */

/**
 * Get current date in Brisbane timezone
 * @returns {Date} Date object set to Brisbane timezone
 */
export function getBrisbaneDate() {
  const brisbaneTimeStr = new Date().toLocaleString('en-AU', {
    timeZone: 'Australia/Brisbane',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  // Parse the formatted string
  const [datePart] = brisbaneTimeStr.split(',');
  const [day, month, year] = datePart.trim().split('/');

  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0);
}

/**
 * Convert Date to AWS Date format (YYYY-MM-DD)
 * @param {Date} date - JavaScript Date object
 * @returns {string} Date in YYYY-MM-DD format
 */
export function toAwsDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convert Date to display format (DD/MM/YYYY)
 * @param {Date} date - JavaScript Date object
 * @returns {string} Date in DD/MM/YYYY format
 */
export function toDisplayDate(date) {
  return date.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Parse AWS Date string to Date object
 * @param {string} awsDate - Date in YYYY-MM-DD format
 * @returns {Date} JavaScript Date object
 */
export function parseAwsDate(awsDate) {
  const [year, month, day] = awsDate.split('-');
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0);
}

/**
 * Get Brisbane current time as ISO string
 * @returns {string} ISO 8601 datetime string
 */
export function getBrisbaneNow() {
  return new Date().toISOString();
}

/**
 * Format phone number for display (Australian format)
 * @param {string} value - Phone number (digits only or formatted)
 * @returns {string} Formatted phone number (0411 222 333)
 */
export function formatPhoneDisplay(value) {
  if (!value) return '';

  const digits = value.replace(/\D/g, '');

  if (digits.length <= 4) {
    return digits;
  } else if (digits.length <= 7) {
    return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  } else {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 10)}`;
  }
}

/**
 * Normalize phone number to digits only
 * @param {string} value - Phone number (any format)
 * @returns {string} Digits only
 */
export function normalizePhone(value) {
  if (!value) return '';
  return value.replace(/\D/g, '');
}

/**
 * Create composite siteDate key
 * @param {string} siteId - Site identifier (e.g., "Gold Coast")
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {string} Composite key (e.g., "site#goldcoast#2025-11-27")
 */
export function createSiteDate(siteId, date) {
  const normalizedSiteId = siteId.toLowerCase().replace(/\s+/g, '');
  return `site#${normalizedSiteId}#${date}`;
}

/**
 * Parse siteDate composite key
 * @param {string} siteDate - Composite key (e.g., "site#goldcoast#2025-11-27")
 * @returns {Object} { siteId, date }
 */
export function parseSiteDate(siteDate) {
  const parts = siteDate.split('#');
  if (parts.length !== 3 || parts[0] !== 'site') {
    throw new Error('Invalid siteDate format');
  }

  return {
    siteId: parts[1],
    date: parts[2]
  };
}

/**
 * Normalize team number (strip "Team" prefix, extract digits)
 * @param {string} teamNumber - Team identifier (e.g., "Team 60", "60", "K9-2")
 * @returns {string} Normalized team number
 */
export function normalizeTeamNumber(teamNumber) {
  if (!teamNumber) return '';

  // Remove "Team" prefix if present
  let normalized = teamNumber.replace(/^team\s*/i, '');

  // For numeric teams, extract just the digits
  if (/^\d+$/.test(normalized)) {
    return normalized;
  }

  // For special teams (K9, AERIAL, etc.), keep as is
  return normalized;
}
