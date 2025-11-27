
// Audit 1.1: Critical Pattern for Composite Keys
export const createSiteDate = (siteId, date) => {
    if (!siteId || !date) return "";
    const normalizedSiteId = siteId.toLowerCase().replace(/\s+/g, '');
    return `site#${normalizedSiteId}#${date}`;
};

// Audit 3.3: Phone Formatting
export function formatPhoneDisplay(value) {
    if (!value) return "";
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 4) return digits;
    else if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    else return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 10)}`;
}

// Audit 3.3: Date Formatting
export function toAwsDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Gemini Intelligence (Kept for features)
export const predictSlotEfficiency = (time) => {
    const hour = parseInt(time.split(':')[0]);
    let score = 85; 
    if (hour > 10 && hour < 14) score += 10;
    return { rating: score > 90 ? 'OPTIMAL' : score > 75 ? 'GOOD' : 'HIGH_TRAVEL' };
};
