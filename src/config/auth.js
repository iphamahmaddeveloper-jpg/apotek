export const ROLES = {
  OWNER: 'OWNER',
  STAFF: 'STAFF'
};

export const USER_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE'
};

export const DEFAULT_USERS = [
  {
    id: 'usr-owner',
    username: 'owner',
    password: 'owner123',
    name: 'Hendra Pratama (Owner & Apoteker)',
    role: ROLES.OWNER,
    roleTitle: 'Pemilik Apotek / Super Admin',
    email: 'owner@medikasejahtera.id',
    phone: '0812-9988-7766',
    avatar: 'HP',
    status: USER_STATUS.ACTIVE,
    joinDate: '2024-01-01'
  },
  {
    id: 'usr-siti',
    username: 'siti',
    password: 'siti123',
    name: 'Siti Rahma, S.Farm',
    role: ROLES.STAFF,
    roleTitle: 'Karyawan / Kasir Shift',
    email: 'siti.rahma@medikasejahtera.id',
    phone: '0852-9988-7711',
    avatar: 'SR',
    status: USER_STATUS.ACTIVE,
    joinDate: '2024-06-15'
  },
  {
    id: 'usr-budi',
    username: 'budi',
    password: 'budi123',
    name: 'Budi Santoso',
    role: ROLES.STAFF,
    roleTitle: 'Karyawan / Asisten Apoteker',
    email: 'budi.santoso@medikasejahtera.id',
    phone: '0813-4455-6677',
    avatar: 'BS',
    status: USER_STATUS.ACTIVE,
    joinDate: '2025-02-01'
  }
];

export const SHIFT_TYPES = [
  { id: 'shift_1', name: 'Shift 1 (Pagi - Siang)', hours: '08:00 - 15:00 WIB', defaultCash: 200000 },
  { id: 'shift_2', name: 'Shift 2 (Siang - Malam)', hours: '15:00 - 22:00 WIB', defaultCash: 200000 },
  { id: 'shift_full', name: 'Shift Penuh (Lembur)', hours: '08:00 - 22:00 WIB', defaultCash: 200000 }
];
