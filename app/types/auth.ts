export interface User {
  id_user: string;
  nama: string;
  email: string;
  password_hash: string;
  id_kebun: string;
  nomor_keluarga: number; // 1-5
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

export interface Absensi {
  id_absensi: string;
  id_kebun: string;
  id_user: string;
  tanggal: string;
  status: 'hadir' | 'tidak_hadir' | 'belum_absensi';
  created_at: string;
}

export interface JadwalAbsensi {
  tanggal: string;
  id_user: string; // keluarga yang bertugas
  nama_keluarga: string;
  nomor_keluarga: number;
  status: 'selesai' | 'akan_datang' | 'hari_ini';
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

// Data dummy untuk 5 keluarga
export const DUMMY_USERS: User[] = [
  {
    id_user: 'user1',
    nama: 'Keluarga Budi Santoso',
    email: 'budi@nutricomm.com',
    password_hash: 'password123',
    id_kebun: 'KBG001',
    nomor_keluarga: 1
  },
  {
    id_user: 'user2',
    nama: 'Keluarga Sari Indah',
    email: 'sari@nutricomm.com',
    password_hash: 'password123',
    id_kebun: 'KBG001',
    nomor_keluarga: 2
  },
  {
    id_user: 'user3',
    nama: 'Keluarga Ahmad Wijaya',
    email: 'ahmad@nutricomm.com',
    password_hash: 'password123',
    id_kebun: 'KBG001',
    nomor_keluarga: 3
  },
  {
    id_user: 'user4',
    nama: 'Keluarga Maya Sari',
    email: 'maya@nutricomm.com',
    password_hash: 'password123',
    id_kebun: 'KBG001',
    nomor_keluarga: 4
  },
  {
    id_user: 'user5',
    nama: 'Keluarga Rina Permata',
    email: 'rina@nutricomm.com',
    password_hash: 'password123',
    id_kebun: 'KBG001',
    nomor_keluarga: 5
  }
];

export const DUMMY_KEBUN: Kebun[] = [
  {
    id_kebun: 'KBG001',
    nama_kebun: 'Kebun Gizi Sehat',
    lokasi: 'Jakarta Selatan',
    luas: '50 m²',
    tanggal_mulai: '2025-01-15',
    kapasitas_keluarga: 5,
    keluarga_terdaftar: 5,
  },
  {
    id_kebun: 'KBG002',
    nama_kebun: 'Kebun Organik Keluarga',
    lokasi: 'Jakarta Timur',
    luas: '50 m²',
    tanggal_mulai: '2025-02-20',
    kapasitas_keluarga: 5,
    keluarga_terdaftar: 0,
  }
];