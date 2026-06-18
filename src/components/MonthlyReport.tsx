/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
// @ts-ignore
import LogoAlFatih from '../assets/images/logo_al_fatih_1781782889083.jpg';
import { Siswa, TransaksiKas } from '../types';
import { ACADEMIC_MONTHS } from '../data';
import { 
  Calendar, 
  Printer, 
  FileText, 
  ArrowDownIcon, 
  ArrowUpIcon, 
  Download,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { motion } from 'motion/react';

interface MonthlyReportProps {
  siswa: Siswa[];
  transaksi: TransaksiKas[];
}

export default function MonthlyReport({ siswa, transaksi }: MonthlyReportProps) {
  // Set current month filter
  const [selectedMonth, setSelectedMonth] = useState('Juli 2026');

  // Math totals for the SELECTED MONTH
  // To identify transactions of selectedMonth, we can check matching trans entries.
  const filteredTransactions = transaksi.filter(t => {
    // 1. Direct match with t.bulanSPP
    if (t.bulanSPP === selectedMonth) return true;
    
    // 2. Contains name in description
    if (t.keterangan.toLowerCase().includes(selectedMonth.toLowerCase())) return true;
    
    // 3. Match dates
    const tDate = new Date(t.tanggal);
    const tMonthName = tDate.toLocaleString('id-ID', { month: 'long' });
    const tYear = tDate.getFullYear();
    const tMatchStr = `${tMonthName} ${tYear}`;
    return tMatchStr.toLowerCase() === selectedMonth.toLowerCase();
  });

  // Categories summation inside selected month
  const incomeSPPPembayaran = filteredTransactions
    .filter(t => t.tipe === 'pemasukan' && t.kategori === 'SPP Bulanan')
    .reduce((acc, curr) => acc + curr.nominal, 0);

  const incomeLainnya = filteredTransactions
    .filter(t => t.tipe === 'pemasukan' && t.kategori !== 'SPP Bulanan')
    .reduce((acc, curr) => acc + curr.nominal, 0);

  const totalIncome = incomeSPPPembayaran + incomeLainnya;

  const totalExpense = filteredTransactions
    .filter(t => t.tipe === 'pengeluaran')
    .reduce((acc, curr) => acc + curr.nominal, 0);

  const netProfit = totalIncome - totalExpense;

  // Student metrics
  const totalAugustStudents = siswa.length;
  const paidStudentsInMonth = siswa.filter(s => s.statusSPP[selectedMonth]?.paid).length;
  const collectionAugustPct = totalAugustStudents > 0 
    ? Math.round((paidStudentsInMonth / totalAugustStudents) * 100)
    : 0;

  const rupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleMockExport = () => {
    alert(`Sukses mengekstrak dokumen! Berkas "Laporan_Keuangan_AlFatih_${selectedMonth.replace(' ', '_')}.csv" berhasil diproses dan diunduh.`);
  };

  return (
    <div className="space-y-6">
      {/* Selection head */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print text-slate-800">
        <div>
          <h2 className="text-lg font-serif font-bold text-slate-950">Rekapitulasi & Pelaporan Keuangan</h2>
          <p className="text-[11px] text-slate-400 font-sans mt-0.5">Pilih periode bulan belajar untuk mengkalkulasi dan mencetak lembar realisasi keuangan sekolah</p>
        </div>

        <div className="flex gap-2 text-[10px] font-sans">
          <div className="w-44 shrink-0">
            <select
              id="select_report_month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 bg-[#FDFCFB] border border-slate-250 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#064E3B] font-bold text-slate-700"
            >
              {ACADEMIC_MONTHS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          
          <button
            id="btn_print_report"
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold uppercase tracking-wider rounded-sm transition flex items-center justify-center gap-1 border border-slate-200 cursor-pointer"
          >
            <Printer size={12} /> Cetak
          </button>
          
          <button
            id="btn_export_csv"
            onClick={handleMockExport}
            className="px-4 py-2 bg-[#064E3B] hover:bg-[#053d2f] text-white font-bold uppercase tracking-wider rounded-sm transition flex items-center justify-center gap-1 shadow-none cursor-pointer"
          >
            <Download size={12} /> Export Excel
          </button>
        </div>
      </div>

      {/* Grid of stats for selected period */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 no-print text-slate-850">
        <div className="bg-white p-4 rounded-lg border border-slate-205 shadow-sm leading-relaxed">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Debet SPP Terkoleksi</span>
          <h3 className="text-lg font-serif font-bold mt-1 text-[#064E3B]">{rupiah(incomeSPPPembayaran)}</h3>
          <p className="text-[10px] text-slate-400 mt-1 font-sans font-sans">Grip partisipasi: <strong className="text-emerald-700">{collectionAugustPct}% ({paidStudentsInMonth}/{totalAugustStudents} siswa)</strong></p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-205 shadow-sm leading-relaxed">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Pemasukan Kas Non-SPP</span>
          <h3 className="text-lg font-serif font-bold mt-1 text-teal-800">{rupiah(incomeLainnya)}</h3>
          <p className="text-[10px] text-slate-400 mt-1 font-sans">Infaq, kegiatan, hibah & BOS</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-205 shadow-sm leading-relaxed">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Kredit Biaya Operasional</span>
          <h3 className="text-lg font-serif font-bold mt-1 text-[#B45309]">{rupiah(totalExpense)}</h3>
          <p className="text-[10px] text-slate-400 mt-1 font-sans">Gaji guru, sarpras, ATK & AC</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-205 shadow-sm leading-relaxed">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Sisa Surplus Bulan Ini</span>
          <h3 className={`text-lg font-serif font-bold mt-1 ${netProfit >= 0 ? 'text-[#064E3B]' : 'text-rose-700'}`}>
            {netProfit >= 0 ? '+' : ''}{rupiah(netProfit)}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1 font-sans">Arus kas bersih surplus/defisit</p>
        </div>
      </div>

      {/* Main Official Document Sheet View */}
      <div className="bg-white rounded-lg border border-slate-300 p-8 max-w-4xl mx-auto print-area relative text-[#1E293B] font-mono text-[11px]">
        
        {/* Kop Yayasan SDIT Al Fatih */}
        <div className="flex flex-col items-center text-center border-b border-slate-400 pb-4 mb-6">
          <div className="w-14 h-14 shrink-0 overflow-hidden rounded-full border border-slate-300 shadow-xs mb-2">
            <img 
              src={LogoAlFatih} 
              alt="SDIT Al Fatih Baturaja Logo" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <h3 className="font-serif font-bold text-[10px] text-slate-500 tracking-wider">YAYASAN KHALIFAH GENERASI CEMERLANG</h3>
          <h2 className="font-serif font-bold text-[#064E3B] uppercase tracking-wider text-sm mt-0.5">SDIT AL FATIH BATURAJA</h2>
          <p className="text-[9px] text-slate-400 italic font-sans mt-0.5">Izin Operasional No: 421.3/2883-Disdik/2026 | NPSN: 60724888</p>
          <p className="text-[8px] text-slate-400 font-sans mt-0.5">Alamat: Jl. Sako Raya Gg. Kelapa Gading I Sako, Sako, Kota Baturaja, Sumatera Selatan</p>
        </div>

        {/* Document Title */}
        <div className="text-center space-y-1 mb-6">
          <h2 className="font-serif font-bold text-xs text-slate-900 tracking-wider uppercase">LAPORAN REKAPITULASI REALISASI KEUANGAN BULANAN</h2>
          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-sans">PERIODE LAPORAN AKADEMIK: <strong className="text-slate-800 font-bold font-serif">{selectedMonth}</strong></p>
        </div>

        {/* Content Statement */}
        <div className="leading-relaxed space-y-4 mb-6 text-[10px]">
          <p className="font-sans text-slate-600 text-[11px]">
            Bismillahirrohmanirrohim. Melalui dokumen memorandum pembukuan ini, Unit Bendahara Keuangan SDIT Al Fatih Baturaja melaporkan pertanggungjawaban realisasi arus kas keluar-masuk (Debet/Kredit) sekolah pada periode <strong>{selectedMonth}</strong>:
          </p>

          <h4 className="font-serif font-bold text-[#064E3B] uppercase border-b border-slate-205 pb-1 text-[10px] tracking-wider mt-4">I. LAPORAN REALISASI KAS MASUK</h4>
          <table className="w-full text-left border border-slate-205 font-mono text-[10px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-300 font-bold text-slate-800">
                <th className="py-2 px-3">Uraian / Deskripsi Pemasukan Belajar</th>
                <th className="py-2 px-3">Klasifikasi Akun</th>
                <th className="py-2 px-3 text-right">Jumlah Terkumpul</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="py-2 px-3 font-sans"><strong>Partisipasi SPP Bulanan Wali Murid</strong> (Tingkat Kolektibilitas {collectionAugustPct}%)</td>
                <td className="py-2 px-3 text-slate-500 font-sans">Iuran Wajib SPP</td>
                <td className="py-2 px-3 text-right font-serif font-bold">{rupiah(incomeSPPPembayaran)}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-sans"><strong>Pemasukan Kas Umum Sekolah</strong> (Infaq Syariah, BOS, Dana Kegiatan dll)</td>
                <td className="py-2 px-3 text-slate-500 font-sans">Pemasukan Umum</td>
                <td className="py-2 px-3 text-right font-serif font-bold">{rupiah(incomeLainnya)}</td>
              </tr>
              <tr className="bg-[#FDFCFB] font-bold text-[#064E3B] border-t border-slate-300">
                <td className="py-2 px-3 uppercase text-right font-sans" colSpan={2}>Subtotal Total Penerimaan</td>
                <td className="py-2 px-3 text-right font-serif">{rupiah(totalIncome)}</td>
              </tr>
            </tbody>
          </table>

          <h4 className="font-serif font-bold text-[#064E3B] uppercase border-b border-slate-205 pb-1 text-[10px] tracking-wider mt-4">II. LAPORAN REALISASI BIAYA / PENGELUARAN BIASA</h4>
          {filteredTransactions.filter(t => t.tipe === 'pengeluaran').length === 0 ? (
            <p className="italic text-slate-400 py-3 text-center border font-sans">Tidak ada pengeluaran kas tercatat pada bulan ini</p>
          ) : (
            <table className="w-full text-left border border-slate-205 font-mono text-[10px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-300 font-bold text-slate-800">
                  <th className="py-2 px-3">Tanggal</th>
                  <th className="py-2 px-3">Deskripsi Pengeluaran</th>
                  <th className="py-2 px-3">Kategori</th>
                  <th className="py-2 px-3 text-right">Alokasi Dana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTransactions.filter(t => t.tipe === 'pengeluaran').map(t => (
                  <tr key={t.id}>
                    <td className="py-2 px-3 text-slate-500 text-[9px]">{t.tanggal}</td>
                    <td className="py-2 px-3 font-sans">{t.keterangan}</td>
                    <td className="py-2 px-3 text-slate-500 font-sans">{t.kategori}</td>
                    <td className="py-2 px-3 text-right font-serif text-[#B45309] font-bold">{rupiah(t.nominal)}</td>
                  </tr>
                ))}
                <tr className="bg-[#FDFCFB] font-bold text-[#B45309] border-t border-slate-300">
                  <td className="py-2.5 px-3 uppercase text-right font-sans" colSpan={3}>Subtotal Total Pengeluaran</td>
                  <td className="py-2.5 px-3 text-right font-serif">{rupiah(totalExpense)}</td>
                </tr>
              </tbody>
            </table>
          )}

          <h4 className="font-serif font-bold text-[#064E3B] uppercase border-b border-slate-205 pb-1 text-[10px] tracking-wider mt-4">III. NERACA POSISI SALDO BERSIH</h4>
          <div className="grid grid-cols-2 gap-4 border border-slate-300 p-4 rounded-sm bg-[#FDFCFB]">
            <div className="space-y-1.5 leading-relaxed font-sans text-slate-600 text-[10px]">
              <p>1. Total Penerimaan (Debet): <span className="font-mono font-bold text-slate-900">{rupiah(totalIncome)}</span></p>
              <p>2. Total Pengeluaran (Kredit): <span className="font-mono font-bold text-slate-900">{rupiah(totalExpense)}</span></p>
            </div>
            <div className="text-right flex flex-col justify-center">
              <span className="text-[8px] text-slate-400 block font-bold leading-normal uppercase tracking-wider font-sans">SELISIH BERSIH SURPLUS</span>
              <span className={`text-md font-serif font-bold ${netProfit >= 0 ? 'text-[#064E3B]' : 'text-rose-700'}`}>
                {netProfit >= 0 ? '+' : ''}{rupiah(netProfit)}
              </span>
            </div>
          </div>
        </div>

        {/* Signatures footer */}
        <div className="grid grid-cols-3 gap-4 pt-6 mt-10 border-t border-slate-350 text-center text-[10px]">
          <div className="space-y-14">
            <div>
              <p className="font-bold text-slate-700 font-sans">Verifikator Yayasan,</p>
              <p className="text-[9px] text-slate-400 font-sans animate-none">Yayasan Khalifah Generasi Cemerlang</p>
            </div>
            <div>
              <strong className="text-slate-800 border-b border-slate-800 pb-0.5">Ust. H. Hendra Wijaya, Lc</strong>
              <p className="text-[8px] text-slate-500 mt-1 font-sans">Direktur Keuangan</p>
            </div>
          </div>
          
          <div className="space-y-14">
            <div>
              <p className="font-bold text-slate-700 font-sans animate-none">Mengetahui & Menyetujui,</p>
              <p className="text-[9px] text-slate-400 font-sans">Kepala Sekolah SDIT Al Fatih</p>
            </div>
            <div>
              <strong className="text-slate-800 border-b border-slate-800 pb-0.5">Ust. H. M. Al-Ghazali, M.Pd</strong>
              <p className="text-[8px] text-slate-500 mt-1 font-sans">NIP. 19821104.AF2012</p>
            </div>
          </div>

          <div className="space-y-14">
            <div>
              <p className="font-bold text-slate-700 font-sans">Bendahara Penerima,</p>
              <p className="text-[9px] text-slate-400 font-sans">Unit Sekolah SDIT Al Fatih</p>
            </div>
            <div>
              <strong className="text-slate-800 border-b border-slate-800 pb-0.5">Ustazah Fatmawati, S.Pd.I</strong>
              <p className="text-[8px] text-slate-500 mt-1 font-sans">NIP. 19881012.FTH2026</p>
            </div>
          </div>
        </div>

        {/* Decorative Green Wet Stamp Mock */}
        <div className="absolute right-1/4 bottom-16 border-2 border-emerald-600/15 text-emerald-800/15 font-bold rounded-full w-24 h-24 flex items-center justify-center text-center text-[8px] -rotate-12 pointer-events-none select-none uppercase tracking-widest font-serif leading-relaxed">
          TERVERIFIKASI<br/>YAYASAN<br/>KHALIFAH
        </div>
      </div>
    </div>
  );
}
