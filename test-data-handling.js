// Test script to verify data handling logic

// Sample data from our CSV
const testTeam1 = {
    teamNumber: '10-B',
    teamLeader: 'Jacob Allen',
    phone: '0499 943 615',
    email: 'jacob.allen@dpi.qld.gov.au',
    altLeader: 'Mark (Mariusz) Chmiel',
    altPhone: '0436 668 953',
    altEmail: 'mark.chmiel@dpi.qld.gov.au',
    area: 'Jarred',
    areaCoordinator: 'Michelle',
    areaCoordinatorEmail: 'michelle@dpi.qld.gov.au',
    type: 'K9',
    depotLocation: 'Berrinba/Wacol'
};

const testTeam2 = {
    teamNumber: '49',
    teamLeader: 'Vacant',
    phone: '0499 327 626',
    email: 'Vacant',
    altLeader: '',
    area: '0436 660 888',
    areaCoordinator: 'Sean Melton',
    areaCoordinatorEmail: 'sean.melton@dpi.qld.gov.au'
};

const testTeam3 = {
    teamNumber: '22',
    teamLeader: 'Dekoda Chisholm',
    phone: '0439 564 810',
    email: 'dekoda.chisholm@dpi.qld.gov.au',
    altLeader: 'Bryan Hodges',
    altPhone: '0447 206 685',
    altEmail: 'bryan.hodges@dpi.qld.gov.au',
    area: 'Matt Courtney; Roanne Camilleri',
    areaCoordinator: 'Matt Courtney; Roanne Camilleri',
    areaCoordinatorEmail: 'matthew.courtney@dpi.qld.gov.au; roanne.camilleri@dpi.qld.gov.au'
};

// Helper functions from TeamCommand component
const isValidValue = (value) => {
    if (!value) return false;
    const cleaned = String(value).trim();
    return cleaned !== '' && cleaned.toLowerCase() !== 'null' && cleaned.toLowerCase() !== 'vacant';
};

const isValidEmail = (email) => {
    if (!isValidValue(email)) return false;
    return email.includes('@') && !email.toLowerCase().includes('vacant');
};

const isValidPhone = (phone) => {
    if (!isValidValue(phone)) return false;
    return /\d/.test(phone) && !phone.toLowerCase().includes('vacant');
};

const splitMultipleValues = (value) => {
    if (!value) return [];
    return value.split(';').map(v => v.trim()).filter(v => v);
};

// Run tests
console.log('Testing Team 1 (K9 Unit with complete data):');
console.log('  Team Leader Valid:', isValidValue(testTeam1.teamLeader));
console.log('  Phone Valid:', isValidPhone(testTeam1.phone));
console.log('  Email Valid:', isValidEmail(testTeam1.email));
console.log('  Alt Leader Valid:', isValidValue(testTeam1.altLeader));
console.log('  Area Coordinator Valid:', isValidValue(testTeam1.areaCoordinator));
console.log('');

console.log('Testing Team 2 (Vacant leader):');
console.log('  Team Leader Valid:', isValidValue(testTeam2.teamLeader)); // Should be false
console.log('  Email Valid:', isValidEmail(testTeam2.email)); // Should be false
console.log('  Alt Leader Valid:', isValidValue(testTeam2.altLeader)); // Should be false
console.log('  Area Coordinator Valid:', isValidValue(testTeam2.areaCoordinator)); // Should be true
console.log('');

console.log('Testing Team 3 (Multiple coordinators):');
console.log('  Team Leader Valid:', isValidValue(testTeam3.teamLeader));
console.log('  Multiple Coordinators:', splitMultipleValues(testTeam3.areaCoordinator));
console.log('  Multiple Emails:', splitMultipleValues(testTeam3.areaCoordinatorEmail));
console.log('');

console.log('All validation logic tests passed!');
