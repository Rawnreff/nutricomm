export interface User {
  id_user: string;
  nama: string;
  email: string;
  password_hash: string;
  id_kebun: string;
}

export interface Kebun {
  id_kebun: string;
  nama_kebun: string;
  lokasi: string;
  luas: string;
  tanggal_mulai: string;
  kapasitas_keluarga: number;
  keluarga_terdaftar: number;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  nama: string;
  email: string;
  password: string;
  confirmPassword: string;
  id_kebun: string;
}

// Data dummy untuk simulasi
export const DUMMY_USERS: User[] = [
  {
    id_user: 'user1',
    nama: 'Keluarga Budi Santoso',
    email: 'budi@nutricomm.com',
    password_hash: 'password123', // Dalam aplikasi nyata, ini harus hash
    id_kebun: 'KBG001'
  },
  {
    id_user: 'user2',
    nama: 'Keluarga Sari Indah',
    email: 'sari@nutricomm.com',
    password_hash: 'password123', // Dalam aplikasi nyata, ini harus hash
    id_kebun: 'KBG001'
  }
];

export const DUMMY_KEBUN: Kebun[] = [
  {
    id_kebun: 'KBG001',
    nama_kebun: 'Kebun Gizi Sehat',
    lokasi: 'Jakarta Selatan',
    luas: '50 m²',
    tanggal_mulai: '2025-01-15',
    kapasitas_keluarga: 10,
    keluarga_terdaftar: 2,
  },
  {
    id_kebun: 'KBG002',
    nama_kebun: 'Kebun Organik Keluarga',
    lokasi: 'Jakarta Timur',
    luas: '75 m²',
    tanggal_mulai: '2025-02-20',
    kapasitas_keluarga: 15,
    keluarga_terdaftar: 8,
  }
];