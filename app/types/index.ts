export interface SensorData {
  id_kebun: string;
  suhu: number;
  kelembapan_udara: number;
  kelembapan_tanah: number;
  cahaya: number;
  co2: number;
  timestamp: string;
}

export interface User {
  id_user: string;
  nama: string;
  email: string;
  id_kebun: string;
}

export interface Absensi {
  id_user: string;
  id_kebun: string;
  tanggal: string;
  status: 'hadir' | 'tidak hadir';
}

export interface Aktivitas {
  id_user: string;
  id_kebun: string;
  kegiatan: string;
  tanggal: string;
  keterangan?: string;
}

export interface Kebun {
  id_kebun: string;
  nama_kebun: string;
  lokasi: string;
  luas: string;
  tanggal_mulai: string;
}