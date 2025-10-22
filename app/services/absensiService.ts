import { DUMMY_USERS } from '../types/auth';
import { JadwalAbsensi, Absensi } from '../types/auth';

// Generate jadwal absensi untuk 30 hari ke depan
export const generateJadwalAbsensi = (): JadwalAbsensi[] => {
  const jadwal: JadwalAbsensi[] = [];
  const today = new Date();
  
  // Urutan keluarga berdasarkan nomor (1-5), berputar
  const totalKeluarga = 5;
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    const tanggal = date.toISOString().split('T')[0];
    const nomorKeluargaHariIni = (i % totalKeluarga) + 1;
    const keluarga = DUMMY_USERS.find(u => u.nomor_keluarga === nomorKeluargaHariIni);
    
    if (keluarga) {
      let status: 'selesai' | 'akan_datang' | 'hari_ini' = 'akan_datang';
      
      if (i === 0) {
        status = 'hari_ini';
      } else if (i < 0) {
        status = 'selesai';
      }
      
      jadwal.push({
        tanggal,
        id_user: keluarga.id_user,
        nama_keluarga: keluarga.nama,
        nomor_keluarga: keluarga.nomor_keluarga,
        status
      });
    }
  }
  
  return jadwal;
};

// Cek apakah hari ini adalah jadwal keluarga tertentu
export const isHariIniJadwalSaya = (userId: string): boolean => {
  const jadwalHariIni = generateJadwalAbsensi().find(j => j.status === 'hari_ini');
  return jadwalHariIni?.id_user === userId;
};

// Dapatkan keluarga yang bertugas hari ini
export const getKeluargaBertugasHariIni = () => {
  return generateJadwalAbsensi().find(j => j.status === 'hari_ini');
};

// Dapatkan jadwal untuk keluarga tertentu
export const getJadwalUntukKeluarga = (userId: string): JadwalAbsensi[] => {
  return generateJadwalAbsensi().filter(j => j.id_user === userId);
};

// Data absensi dummy
export const dummyAbsensi: Absensi[] = [
  {
    id_absensi: 'abs1',
    id_kebun: 'KBG001',
    id_user: 'user1',
    tanggal: '2025-01-20',
    status: 'hadir',
    created_at: '2025-01-20T08:30:00Z'
  },
  {
    id_absensi: 'abs2',
    id_kebun: 'KBG001',
    id_user: 'user2',
    tanggal: '2025-01-21',
    status: 'hadir',
    created_at: '2025-01-21T09:15:00Z'
  }
];