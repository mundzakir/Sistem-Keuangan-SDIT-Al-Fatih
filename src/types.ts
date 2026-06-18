/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BiayaLain {
  id: string;
  nama: string;
  nominal: number;
  paid: boolean;
  paidAt?: string;
  transactionId?: string;
}

export interface Siswa {
  id: string;
  nis: string;
  nama: string;
  kelas: string;
  namaOrangTua: string;
  noWhatsApp: string;
  alamat: string;
  nominalSPP: number;
  tanggalLahir?: string;
  statusSPP: {
    [key: string]: {
      paid: boolean;
      paidAt?: string;
      transactionId?: string;
    };
  }; 
  biayaLainnya?: BiayaLain[];
}

export type TipeTransaksi = 'pemasukan' | 'pengeluaran';

export interface TransaksiKas {
  id: string;
  tanggal: string;
  tipe: TipeTransaksi;
  kategori: string;
  nominal: number;
  keterangan: string;
  siswaId?: string;
  siswaNama?: string;
  bulanSPP?: string; // Format: "Juli 2026"
  metodePembayaran?: 'Tunai' | 'Transfer Bank' | 'E-Wallet';
}

export interface WhatsAppLog {
  id: string;
  timestamp: string;
  studentName: string;
  parentName: string;
  recipientPhone: string;
  message: string;
  status: 'Mengirim' | 'Terkirim' | 'Gagal';
  type: 'Pembayaran SPP' | 'Tagihan SPP' | 'Pengumuman Kas';
}

export interface WhatsAppConfig {
  apiKey: string;
  senderNumber: string;
  isConnected: boolean;
  gateway: 'Fonnte' | 'Wablas' | 'Starsender' | 'Simulasi';
}

export interface TransaksiTabungan {
  id: string;
  tanggal: string; // Format: "YYYY-MM-DD HH:mm:ss"
  siswaId: string;
  siswaNama: string;
  siswaKelas: string;
  tipe: 'setor' | 'tarik';
  nominal: number;
  keterangan: string;
  petugasNama: string; // The user who logged this transaction
  adminApproved?: boolean; // Supervision status: True by default when admin records it, or approved by admin
  isSystemTransfer?: boolean; // In case they use savings to pay for SPP/etc.
}

export interface UserAccount {
  id: string;
  username: string;
  password?: string;
  namaLengkap: string;
  role: 'admin' | 'petugas' | 'bendahara_tabungan';
  createdAt: string;
}

export interface TransaksiMidtrans {
  id: string; // Order ID
  tanggal: string; // Format: "YYYY-MM-DD HH:mm"
  siswaId: string;
  siswaNama: string;
  siswaNis: string;
  siswaKelas: string;
  parentName: string;
  parentPhone: string;
  amount: number;
  months: string[];
  notes?: string;
  status: 'pending_payment' | 'pending_verification' | 'verified' | 'failed';
  paymentMethodDetails?: string; // e.g., "Bank Transfer (BSI)", "GoPay", "QRIS"
  snapToken?: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface MidtransConfig {
  serverKey: string;
  clientKey: string;
}

