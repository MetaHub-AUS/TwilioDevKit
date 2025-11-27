
// Enum definition from Audit 1.1
export const SlotStatus = {
    OPEN: 'OPEN',
    HOLD: 'HOLD',
    BOOKED: 'BOOKED',
    COMPLETED: 'COMPLETED',
    NEEDS_REBOOK: 'NEEDS_REBOOK'
};

// Full AppointmentSlot Model (Audit 1.1)
export class AppointmentSlot {
    constructor(init) {
        this.siteDate = init.siteDate; // Primary Key
        this.time = init.time;         // Sort Key
        this.status = init.status;
        this.version = init.version || 1; // Optimistic Locking
        this.lastUpdated = new Date().toISOString();
        
        // Optional Fields
        this.jobNumber = init.jobNumber;
        this.siteCode = init.siteCode;
        this.propertySizeHa = init.propertySizeHa;
        this.address = init.address;
        this.teamNumberFound = init.teamNumberFound;
        this.estInitial = init.estInitial;
        this.comment = init.comment;
        this.customerName = init.customerName;
        this.customerPhone = init.customerPhone;
    }
}

// FieldTeamData Model (Audit 1.1)
export class FieldTeamData {
    constructor(init) {
        this.teamNumber = init.teamNumber; // Primary Key
        this.teamLeader = init.teamLeader;
        this.phone = init.phone;
        this.email = init.email;
        this.area = init.area;
        this.type = init.type;
        this.status = init.status || 'ACTIVE'; // Added for UI state
        this.battery = init.battery || 100;    // Added for UI state
    }
}
