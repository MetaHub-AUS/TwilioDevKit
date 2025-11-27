
import { SlotStatus } from '../models';

let slots = [];
let teams = [
    { teamNumber: '60', teamLeader: 'Sarah Connor', type: 'UTV', area: 'Gold Coast', status: 'active', battery: 85 },
    { teamNumber: 'K9-2', teamLeader: 'Max Rockatansky', type: 'K9', area: 'Brisbane South', status: 'busy', battery: 60 },
    { teamNumber: 'AERIAL-1', teamLeader: 'Cipher', type: 'DRONE', area: 'Depot HQ', status: 'charging', battery: 15 }
];

export const DataStore = {
    query: async (model, predicate) => {
        // Simulate query logic
        if (model.name === 'AppointmentSlot') {
            return slots;
        }
        if (model.name === 'FieldTeamData') {
            return teams;
        }
        return [];
    },
    save: async (item) => {
        console.log("💾 DataStore Save:", item);
        // Simulate "save or update"
        const existingIndex = slots.findIndex(s => s.time === item.time);
        if (existingIndex >= 0) {
            slots[existingIndex] = item;
        } else {
            slots.push(item);
        }
        return item;
    },
    observe: () => {
        return { subscribe: () => ({ unsubscribe: () => {} }) };
    }
};
