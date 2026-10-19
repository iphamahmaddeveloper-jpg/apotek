import { mockProducts, mockTransactions, mockIncomingGoods } from '../mockData';
import { defaultSettings } from '../config/settings';
import { DEFAULT_USERS, ROLES } from '../config/auth';

const KEYS = {
  PRODUCTS: 'apotek_products_v3',
  TRANSACTIONS: 'apotek_transactions_v3',
  INCOMING: 'apotek_incoming_v3',
  SETTINGS: 'apotek_settings_v3',
  USER: 'apotek_user_v3',
  USERS: 'apotek_users_list_v3',
  SHIFTS: 'apotek_shifts_v3',
  ACTIVE_SHIFT: 'apotek_active_shift_v3'
};

// Safe JSON parser
function safeGet(key, fallback) {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item);
  } catch (err) {
    console.warn(`Error reading ${key} from localStorage:`, err);
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${key} to localStorage:`, err);
  }
}

// Initial Mock Shifts for Demonstration
const initialMockShifts = [
  {
    id: 'SHF-9901',
    shiftName: 'Shift 2 (Siang - Malam)',
    userId: 'usr-siti',
    userName: 'Siti Rahma, S.Farm',
    role: ROLES.STAFF,
    startTime: new Date(Date.now() - 86400000).toISOString(),
    endTime: new Date(Date.now() - 86400000 + (7 * 3600000)).toISOString(),
    status: 'CLOSED',
    initialCash: 200000,
    expectedCash: 345000,
    actualCash: 345000,
    difference: 0,
    cashSalesTotal: 145000,
    nonCashSalesTotal: 120000,
    totalTransactions: 6,
    notes: 'Serah terima aman ke shift berikutnya, stok kasir seimbang.'
  },
  {
    id: 'SHF-9902',
    shiftName: 'Shift 1 (Pagi - Siang)',
    userId: 'usr-budi',
    userName: 'Budi Santoso',
    role: ROLES.STAFF,
    startTime: new Date(Date.now() - 86400000 * 2).toISOString(),
    endTime: new Date(Date.now() - 86400000 * 2 + (7 * 3600000)).toISOString(),
    status: 'CLOSED',
    initialCash: 200000,
    expectedCash: 398000,
    actualCash: 398000,
    difference: 0,
    cashSalesTotal: 198000,
    nonCashSalesTotal: 85000,
    totalTransactions: 8,
    notes: 'Laci kasir pas, struk rapi.'
  }
];

export const storage = {
  getProducts: () => safeGet(KEYS.PRODUCTS, mockProducts),
  setProducts: (data) => safeSet(KEYS.PRODUCTS, data),

  getTransactions: () => safeGet(KEYS.TRANSACTIONS, mockTransactions),
  setTransactions: (data) => safeSet(KEYS.TRANSACTIONS, data),

  getIncomingGoods: () => safeGet(KEYS.INCOMING, mockIncomingGoods),
  setIncomingGoods: (data) => safeSet(KEYS.INCOMING, data),

  getSettings: () => safeGet(KEYS.SETTINGS, defaultSettings),
  setSettings: (data) => safeSet(KEYS.SETTINGS, data),

  // Public security: null by default if not logged in
  getUser: () => safeGet(KEYS.USER, null),
  setUser: (data) => safeSet(KEYS.USER, data),
  removeUser: () => {
    try {
      localStorage.removeItem(KEYS.USER);
    } catch (e) {
      console.error(e);
    }
  },

  getUsers: () => safeGet(KEYS.USERS, DEFAULT_USERS),
  setUsers: (data) => safeSet(KEYS.USERS, data),

  getShifts: () => safeGet(KEYS.SHIFTS, initialMockShifts),
  setShifts: (data) => safeSet(KEYS.SHIFTS, data),

  getActiveShift: () => safeGet(KEYS.ACTIVE_SHIFT, null),
  setActiveShift: (data) => safeSet(KEYS.ACTIVE_SHIFT, data),

  resetToDefault: () => {
    try {
      localStorage.removeItem(KEYS.PRODUCTS);
      localStorage.removeItem(KEYS.TRANSACTIONS);
      localStorage.removeItem(KEYS.INCOMING);
      localStorage.removeItem(KEYS.SETTINGS);
      localStorage.removeItem(KEYS.USER);
      localStorage.removeItem(KEYS.USERS);
      localStorage.removeItem(KEYS.SHIFTS);
      localStorage.removeItem(KEYS.ACTIVE_SHIFT);
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  }
};
