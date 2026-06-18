/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Siswa, TransaksiTabungan, UserAccount } from '../types';
import { LIST_KELAS } from '../data';
import { 
  PiggyBank, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Search, 
  Users, 
  Clock, 
  CheckCircle2, 
  HelpCircle,
  TrendingUp, 
  User, 
  Calendar, 
  Plus, 
  DollarSign,
  AlertTriangle,
  X,
  FileSpreadsheet,
  Trash2,
  Check,
  ShieldCheck,
  BadgeAlert,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';

interface StudentSavingsProps {
  siswa: Siswa[];
  currentUser: UserAccount | null;
  transactions: TransaksiTabungan[];
  onAddTransaction: (trans: Omit<TransaksiTabungan, 'id' | 'tanggal' | 'petugasNama' | 'adminApproved'>) => void;
  onVerifyTransaction: (id: string) => void;
  onDeleteTransaction: (id: string) => void;
}

export default function StudentSavings({
  siswa,
  currentUser,
  transactions,
  onAddTransaction,
  onVerifyTransaction,
  onDeleteTransaction
}: StudentSavingsProps) {
  // Tabs
  const [activeTab, setActiveTab] = useState<'siswa' | 'mutasi'>('siswa');

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('Semua');
  const [filterType, setFilterType] = useState<'semua' | 'setor' | 'tarik'>('semua');
  const [filterStatus, setFilterStatus] = useState<'semua' | 'pending' | 'verified'>('semua');

  // Modal active states
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalType, setTxModalType] = useState<'setor' | 'tarik'>('setor');
  const [selectedStudent, setSelectedStudent] = useState<Siswa | null>(null);

  // Form states
  const [txNominal, setTxNominal] = useState<number>(0);
  const [txKeterangan, setTxKeterangan] = useState('');

  // Selected student history preview (Modal)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyStudent, setHistoryStudent] = useState<Siswa | null>(null);

  // Helper function to format currency
  const rupiah = (nominal: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(nominal);
  };

  // Calculate savings balance for each student based on approved/all transactions
  const studentBalances = useMemo(() => {
    const balances: { [siswaId: string]: number } = {};
    
    // Initialize
    siswa.forEach(s => {
      balances[s.id] = 0;
    });

    // Compute from transactions
    transactions.forEach(t => {
      if (balances[t.siswaId] !== undefined) {
        if (t.tipe === 'setor') {
          balances[t.siswaId] += t.nominal;
        } else {
          balances[t.siswaId] -= t.nominal;
        }
      }
    });

    return balances;
  }, [siswa, transactions]);

  // Overall Statistics
  const stats = useMemo(() => {
    let totalBalance = 0;
    let totalSetorMonth = 0;
    let totalTarikMonth = 0;
    let pendingVerification = 0;

    // Direct sum of currently held balances
    (Object.values(studentBalances) as number[]).forEach(b => {
      totalBalance += b;
    });

    // Current date values for monthly filtering
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth(); // 0-indexed

    transactions.forEach(t => {
      // Pending count
      if (!t.adminApproved) {
        pendingVerification++;
      }

      // Monthly accumulations
      const txDate = new Date(t.tanggal);
      if (txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonthNum) {
        if (t.tipe === 'setor') {
          totalSetorMonth += t.nominal;
        } else {
          totalTarikMonth += t.nominal;
        }
      }
    });

    return {
      totalBalance,
      totalSetorMonth,
      totalTarikMonth,
      pendingVerification
    };
  }, [transactions, studentBalances]);

  // Handle transaction submission
  const handleTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    if (txNominal <= 0) {
      alert('Nominal harus lebih besar dari Rp 0.');
      return;
    }

    if (txModalType === 'tarik') {
      const currentBalance = studentBalances[selectedStudent.id] || 0;
      if (txNominal > currentBalance) {
        alert(`Penarikan gagal! Saldo tabungan ${selectedStudent.nama} tidak mencukupi.\n\nSaldo Saat Ini: ${rupiah(currentBalance)}\nNominal Penarikan: ${rupiah(txNominal)}`);
        return;
      }
    }

    // Call prop method with form fields
    onAddTransaction({
      siswaId: selectedStudent.id,
      siswaNama: selectedStudent.nama,
      siswaKelas: selectedStudent.kelas,
      tipe: txModalType,
      nominal: txNominal,
      keterangan: txKeterangan.trim() || (txModalType === 'setor' ? 'Setoran Tunai Siswa' : 'Penarikan Tabungan Siswa')
    });

    setIsTxModalOpen(false);
    setTxNominal(0);
    setTxKeterangan('');
    setSelectedStudent(null);
  };

  // Delete transaction confirm
  const handleDeleteTx = (id: string, name: string, tipe: string, nominal: number) => {
    const authMessage = currentUser?.role === 'admin' 
      ? `Apakah Anda benar-benar yakin ingin membatalkan/menghapus mutasi tabungan ini?\n\nSiswa: ${name}\nTipe: ${tipe.toUpperCase()}\nNominal: ${rupiah(nominal)}\n\nTindakan ini akan memulihkan saldo tabungan siswa.`
      : `Hanya Administrator yang memiliki wewenang untuk menghapus rekaman mutasi demi keamanan data. Silakan hubungi admin sekolah.`;

    if (currentUser?.role !== 'admin') {
      alert(authMessage);
      return;
    }

    if (confirm(authMessage)) {
      onDeleteTransaction(id);
    }
  };

  // Filter student list
  const filteredSiswa = useMemo(() => {
    return siswa.filter(s => {
      const matchesSearch = s.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.nis.includes(searchTerm) || 
                            s.namaOrangTua.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesKelas = selectedKelas === 'Semua' || s.kelas === selectedKelas;
      return matchesSearch && matchesKelas;
    });
  }, [siswa, searchTerm, selectedKelas]);

  // Filter transactions log
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.siswaNama.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            t.keterangan.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesKelas = selectedKelas === 'Semua' || t.siswaKelas === selectedKelas;
      const matchesType = filterType === 'semua' || t.tipe === filterType;
      
      let matchesStatus = true;
      if (filterStatus === 'pending') {
        matchesStatus = !t.adminApproved;
      } else if (filterStatus === 'verified') {
        matchesStatus = !!t.adminApproved;
      }

      return matchesSearch && matchesKelas && matchesType && matchesStatus;
    });
  }, [transactions, searchTerm, selectedKelas, filterType, filterStatus]);

  // Export ledger to Excel
  const handleExportExcel = () => {
    try {
      const dataToExport = filteredTransactions.map((t, idx) => ({
        "No": idx + 1,
        "Tanggal": t.tanggal,
        "Nama Siswa": t.siswaNama,
        "Kelas": t.siswaKelas,
        "Tipe": t.tipe === 'setor' ? 'SETORAN (MASUK)' : 'PENARIKAN (KELUAR)',
        "Nominal": t.nominal,
        "Keterangan": t.keterangan,
        "Pencatat (Petugas)": t.petugasNama,
        "Status Verifikasi Admin": t.adminApproved ? 'Sah & Terverifikasi' : 'Pending Otorisasi'
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      
      const wscols = [
        { wch: 6 },
        { wch: 20 },
        { wch: 25 },
        { wch: 8 },
        { wch: 20 },
        { wch: 15 },
        { wch: 35 },
        { wch: 20 },
        { wch: 20 }
      ];
      ws['!cols'] = wscols;

      XLSX.utils.book_append_sheet(wb, ws, "Mutasi_Tabungan_Al_Fatih");
      XLSX.writeFile(wb, `Laporan_Mutasi_Tabungan_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      alert("Gagal mengekspor data ke Excel.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none text-sky-600 select-none">
          <PiggyBank size={120} />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 text-left">
            <span className="inline-block px-2.5 py-0.5 text-[8.5px] bg-sky-600 font-bold text-white uppercase tracking-[0.2em] leading-none rounded-none">
              SISTEM TABUNGAN WADIAH SYARIAH
            </span>
            <h2 className="text-xl font-serif font-bold text-slate-900 tracking-tight">
              Buku Tabungan & Simpanan Siswa Al-Fatih
            </h2>
            <p className="text-slate-500 text-xs max-w-xl leading-relaxed">
              Kelola titipan tabungan siswa secara transparan. Bendahara tabungan mencatat setoran/penarikan harian dengan pengawasan, validasi berkala, dan otorisasi langsung oleh Kepala Administrasi.
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('siswa')}
              className={`px-4 py-2 text-[10.5px] uppercase font-bold tracking-wider border rounded-sm transition ${
                activeTab === 'siswa'
                  ? 'bg-sky-50 text-sky-800 border-sky-200 shadow-xs'
                  : 'bg-white text-slate-500 hover:text-slate-800 border-slate-200'
              }`}
            >
              <span className="flex items-center gap-1.5"><Users size={12} /> Daftar Saldo Siswa</span>
            </button>
            <button
              onClick={() => setActiveTab('mutasi')}
              className={`px-4 py-2 text-[10.5px] uppercase font-bold tracking-wider border rounded-sm transition ${
                activeTab === 'mutasi'
                  ? 'bg-sky-50 text-sky-800 border-sky-200 shadow-xs'
                  : 'bg-white text-slate-500 hover:text-slate-800 border-slate-200'
              }`}
            >
              <span className="flex items-center gap-1.5"><Clock size={12} /> Jurnal Mutasi</span>
            </button>
          </div>
        </div>
      </div>

      {/* Role Notice & Info Bar */}
      <div className="flex flex-col md:flex-row gap-3 bg-white p-3 border border-slate-200 rounded-sm text-xs items-center justify-between text-left">
        <div className="flex items-center gap-2">
          {currentUser?.role === 'admin' ? (
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          ) : currentUser?.role === 'bendahara_tabungan' ? (
            <div className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          )}
          <span className="font-medium text-slate-700">
            Akses Masuk Anda: <strong className="text-slate-900 border-b border-dotted pb-0.5 capitalize">{currentUser?.role === 'bendahara_tabungan' ? 'Bendahara Tabungan (Staff)' : currentUser?.role || 'Pengunjung'}</strong>
          </span>
        </div>
        
        <div className="text-[10px] text-slate-400 font-medium">
          {currentUser?.role === 'bendahara_tabungan' && (
            <span className="text-sky-700 font-bold bg-sky-50 px-2 py-1 rounded-sm border border-sky-100">
              ✓ Anda memiliki akses penuh mencatat setoran/tarikan tabungan. Seluruh mutasi akan diawasi & disahkan oleh Admin.
            </span>
          )}
          {currentUser?.role === 'admin' && (
            <span className="text-amber-700 font-bold bg-amber-50 px-2 py-1 rounded-sm border border-amber-100">
              ★ Otoritas Pengawas: Anda dapat langsung memverifikasi transaksi, menghapus koreksi, dan melakukan audit.
            </span>
          )}
          {currentUser?.role === 'petugas' && (
            <span className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded-sm border border-emerald-100">
              🔒 Akses Read-Only: Hanya Bendahara Tabungan & Admin yang dapat memproses transaksi tabungan.
            </span>
          )}
        </div>
      </div>

      {/* Financial Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Saldo Pool */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 font-sans text-left relative overflow-hidden flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Dana Tabungan Pool</p>
              <h3 className="text-lg font-mono font-bold text-slate-800 leading-tight">
                {rupiah(stats.totalBalance)}
              </h3>
            </div>
            <div className="w-8 h-8 rounded-sm bg-sky-50 text-sky-600 flex items-center justify-center">
              <PiggyBank size={16} />
            </div>
          </div>
          <div className="pt-3.5 border-t border-slate-100 mt-2 flex items-center gap-1.5 text-slate-400 text-[10px] font-medium">
            <TrendingUp size={11} className="text-[#064E3B]" />
            <span>Simpanan aman di kas sekolah</span>
          </div>
        </div>

        {/* Setoran Bulan Ini */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 font-sans text-left relative overflow-hidden flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Setoran Bulan Ini</p>
              <h3 className="text-lg font-mono font-bold text-emerald-700 leading-tight">
                {rupiah(stats.totalSetorMonth)}
              </h3>
            </div>
            <div className="w-8 h-8 rounded-sm bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownLeft size={16} />
            </div>
          </div>
          <div className="pt-3.5 border-t border-slate-100 mt-2 flex items-center gap-1.5 text-slate-400 text-[10px] font-medium">
            <Calendar size={11} className="text-emerald-600" />
            <span>Akumulasi setoran masuk</span>
          </div>
        </div>

        {/* Penarikan Bulan Ini */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 font-sans text-left relative overflow-hidden flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Penarikan Bulan Ini</p>
              <h3 className="text-lg font-mono font-bold text-rose-700 leading-tight">
                {rupiah(stats.totalTarikMonth)}
              </h3>
            </div>
            <div className="w-8 h-8 rounded-sm bg-rose-50 text-rose-500 flex items-center justify-center">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <div className="pt-3.5 border-t border-slate-100 mt-2 flex items-center gap-1.5 text-slate-400 text-[10px] font-medium">
            <Calendar size={11} className="text-rose-500" />
            <span>Arus keluar ditarik siswa</span>
          </div>
        </div>

        {/* Pending Verification Warnings */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 font-sans text-left relative overflow-hidden flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Belum Otorisasi Admin</p>
              <h3 className={`text-lg font-mono font-bold leading-tight ${stats.pendingVerification > 0 ? 'text-amber-600 animate-pulse' : 'text-slate-600'}`}>
                {stats.pendingVerification} Transaksi
              </h3>
            </div>
            <div className={`w-8 h-8 rounded-sm flex items-center justify-center ${stats.pendingVerification > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
              <BadgeAlert size={16} />
            </div>
          </div>
          <div className="pt-3.5 border-t border-slate-100 mt-2 flex items-center gap-1.5 text-slate-400 text-[10px] font-medium">
            <ShieldCheck size={11} className="text-amber-500" />
            <span>Mulai verifikasi berkala oleh Admin</span>
          </div>
        </div>
      </div>

      {/* Main filter, search and lists */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden p-6 space-y-4">
        
        {/* Navigation Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          
          <div className="flex flex-col sm:flex-row gap-2 flex-1 max-w-2xl text-left">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder={activeTab === 'siswa' ? "Cari NIS, nama siswa atau orang tua..." : "Cari nama siswa atau keterangan mutasi..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#FDFCFB] border border-slate-250 rounded-sm font-sans text-xs focus:outline-none focus:ring-1 focus:ring-[#064E3B] text-slate-705 placeholder:text-slate-400 font-medium"
              />
            </div>

            {/* Class filter dropdown */}
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="py-2 pl-3 pr-8 bg-[#FDFCFB] border border-slate-250 rounded-sm font-sans text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#064E3B] text-slate-700"
            >
              <option value="Semua">Semua Kelas</option>
              {LIST_KELAS.map((k) => (
                <option key={k} value={k}>
                  Kelas {k}
                </option>
              ))}
            </select>

            {/* Mutasi Ledger Additional Filters */}
            {activeTab === 'mutasi' && (
              <>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="py-2 pl-3 pr-8 bg-[#FDFCFB] border border-slate-250 rounded-sm font-sans text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#064E3B] text-slate-700"
                >
                  <option value="semua">Semua Tipe</option>
                  <option value="setor">Setoran Saja</option>
                  <option value="tarik">Penarikan Saja</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="py-2 pl-3 pr-8 bg-[#FDFCFB] border border-slate-250 rounded-sm font-sans text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#064E3B] text-slate-700"
                >
                  <option value="semua">Semua Status</option>
                  <option value="pending font-bold text-amber-600">Pending</option>
                  <option value="verified text-emerald-600">Terverifikasi</option>
                </select>
              </>
            )}
          </div>

          <div>
            {activeTab === 'mutasi' && (
              <button
                type="button"
                onClick={handleExportExcel}
                className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition rounded-sm shadow-sm cursor-pointer"
              >
                <FileSpreadsheet size={11} /> Ekspor Jurnal
              </button>
            )}
          </div>
        </div>

        {/* Tab content */}
        {activeTab === 'siswa' && (
          <div className="border border-slate-200 rounded-sm overflow-hidden overflow-x-auto text-left">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#064E3B] text-white text-[10px] font-bold uppercase tracking-wider font-sans">
                <tr>
                  <th className="py-3 px-4 border-b border-slate-200">NIS</th>
                  <th className="py-3 px-4 border-b border-slate-200">Nama Siswa</th>
                  <th className="py-3 px-3 border-b border-slate-200 text-center">Kelas</th>
                  <th className="py-3 px-4 border-b border-slate-200">Nama Wali Murid</th>
                  <th className="py-3 px-4 border-b border-slate-200 text-right">Saldo Tabungan</th>
                  <th className="py-3 px-4 border-b border-slate-200 text-center">Tindakan Pengelolaan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredSiswa.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-bold uppercase tracking-wider">
                      Tidak ada data siswa yang cocok dengan pencarian / kelas.
                    </td>
                  </tr>
                ) : (
                  filteredSiswa.map((stud) => {
                    const balance = studentBalances[stud.id] || 0;
                    return (
                      <tr key={stud.id} className="hover:bg-slate-50/40 transition">
                        <td className="py-3 px-4 font-mono font-medium text-[11px] text-slate-550">{stud.nis}</td>
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-900">{stud.nama}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{stud.noWhatsApp}</p>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-bold px-2 py-0.5 bg-emerald-50 text-[#064E3B] border border-emerald-100 rounded-sm text-[10px]">
                            {stud.kelas}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{stud.namaOrangTua}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-800 text-[12px]">
                          {rupiah(balance)}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                setHistoryStudent(stud);
                                setIsHistoryModalOpen(true);
                              }}
                              className="px-2 py-1 bg-slate-50 text-slate-650 border border-slate-200 hover:bg-slate-100 rounded-sm text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                            >
                              Riwayat
                            </button>
                            
                            {/* Actions block only for authorized roles */}
                            {currentUser?.role !== 'petugas' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedStudent(stud);
                                    setTxModalType('setor');
                                    setIsTxModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-emerald-650 text-white hover:bg-emerald-700 rounded-sm text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-0.5 cursor-pointer"
                                >
                                  <Plus size={10} /> Setor
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedStudent(stud);
                                    setTxModalType('tarik');
                                    setIsTxModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-rose-600 text-white hover:bg-rose-700 rounded-sm text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-0.5 cursor-pointer"
                                >
                                  Tarik
                                </button>
                              </>
                            ) : (
                              <span className="text-[9px] text-slate-400 font-medium font-serif italic">Hanya Baca</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Mutation Ledger Jurnal Tab */}
        {activeTab === 'mutasi' && (
          <div className="border border-slate-200 rounded-sm overflow-hidden overflow-x-auto text-left">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#064E3B] text-white text-[10px] font-bold uppercase tracking-wider font-sans">
                <tr>
                  <th className="py-3 px-4 border-b border-slate-200">Waktu / Tanggal</th>
                  <th className="py-3 px-4 border-b border-slate-200">Siswa & Kelas</th>
                  <th className="py-3 px-3 border-b border-slate-200 text-center">Tipe</th>
                  <th className="py-3 px-4 border-b border-slate-200 text-right">Nominal</th>
                  <th className="py-3 px-4 border-b border-slate-200">Keterangan Mutasi</th>
                  <th className="py-3 px-4 border-b border-slate-200">Pencatat/Petugas</th>
                  <th className="py-3 px-4 border-b border-slate-200 text-center">Supervisi Admin</th>
                  {currentUser?.role === 'admin' && (
                    <th className="py-3 px-3 border-b border-slate-200 text-center">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700 bg-white">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={currentUser?.role === 'admin' ? 8 : 7} className="py-12 text-center text-slate-400 font-bold uppercase tracking-wider">
                      Tidak ada catatan transaksi tabungan yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/40 transition">
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                        {tx.tanggal}
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900">{tx.siswaNama}</p>
                          <span className="text-[9px] bg-slate-100 px-1 py-0.2 rounded text-slate-500 uppercase tracking-widest font-mono">
                            Kelas {tx.siswaKelas}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {tx.tipe === 'setor' ? (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-emerald-100/90 text-emerald-900 border border-emerald-200 text-[10px] font-bold rounded-sm uppercase tracking-wide">
                            <Plus size={9} /> Setor
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-rose-100 text-rose-900 border border-rose-200 text-[10px] font-bold rounded-sm uppercase tracking-wide">
                            Tarik
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[11px] text-slate-800">
                        {tx.tipe === 'setor' ? '+' : '-'}{rupiah(tx.nominal)}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate leading-relaxed" title={tx.keterangan}>
                        {tx.keterangan}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px] flex items-center gap-1 mt-1.5 border-none">
                        <User size={11} className="text-slate-400" />
                        {tx.petugasNama}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {tx.adminApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[8.5px] bg-[#E6F4EA] font-bold text-[#137333] uppercase tracking-wider rounded-sm select-none border border-emerald-300">
                            <ShieldCheck size={11} className="text-[#137333]" /> Sah & Terverifikasi
                          </span>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[8.5px] bg-amber-50 text-amber-800 font-bold uppercase tracking-wider rounded-sm select-none border border-amber-300">
                              <AlertTriangle size={11} className="text-amber-600 animate-pulse" /> Pending Otorisasi
                            </span>
                            {currentUser?.role === 'admin' && (
                              <button
                                type="button"
                                onClick={() => onVerifyTransaction(tx.id)}
                                className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded-sm font-bold text-[9px] uppercase tracking-wider mt-1 cursor-pointer transition shadow-xs"
                              >
                                Verifikasi
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      {currentUser?.role === 'admin' && (
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            title="Hapus / Koreksi Transaksi"
                            onClick={() => handleDeleteTx(tx.id, tx.siswaNama, tx.tipe, tx.nominal)}
                            className="p-1.5 text-rose-500 hover:text-white bg-white hover:bg-rose-500 border border-rose-200 rounded-sm transition cursor-pointer"
                          >
                            <Trash2 size={11} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: POST SETOR / TARIK MUTASI */}
      <AnimatePresence>
        {isTxModalOpen && selectedStudent && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-xs text-left text-[#1E293B] font-sans">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg border border-slate-300 shadow-2xl p-6 w-full max-w-sm"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-3 border-b border-slate-250 mb-4">
                <h3 className="font-serif font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <PiggyBank size={16} className={txModalType === 'setor' ? 'text-emerald-600' : 'text-rose-500'} />
                  Proses {txModalType === 'setor' ? 'Setoran Tabungan' : 'Penarikan Tabungan'}
                </h3>
                <button 
                  onClick={() => setIsTxModalOpen(false)} 
                  className="p-1 hover:bg-slate-100 rounded text-slate-400 cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Form body */}
              <form onSubmit={handleTxSubmit} className="space-y-4">
                
                {/* Student read-only card */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm space-y-1">
                  <p className="font-bold text-slate-500 uppercase text-[8.5px] tracking-wider leading-none">Identitas Siswa</p>
                  <p className="font-bold text-slate-900 text-[12px]">{selectedStudent.nama} (Kelas {selectedStudent.kelas})</p>
                  <div className="flex justify-between text-[10px] pt-1.5 border-t border-slate-200 mt-1 font-mono">
                    <span className="text-slate-500 font-sans">Saldo Saat Ini:</span>
                    <strong className="text-sky-700 font-bold">{rupiah(studentBalances[selectedStudent.id] || 0)}</strong>
                  </div>
                </div>

                {/* Amount input */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">
                    Jumlah Nominal (Rupiah):
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 font-bold text-xs">Rp</span>
                    <input 
                      type="number" 
                      value={txNominal || ''} 
                      onChange={(e) => setTxNominal(Number(e.target.value))}
                      placeholder="Contoh: 50000"
                      required
                      min={100}
                      className="w-full pl-9 pr-4 py-2.5 bg-[#FDFCFB] border border-slate-250 rounded-sm focus:ring-1 focus:ring-sky-500 focus:outline-none font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>

                {/* Keterangan input */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">
                    Keterangan / Berita Transaksi:
                  </label>
                  <textarea 
                    value={txKeterangan} 
                    onChange={(e) => setTxKeterangan(e.target.value)}
                    placeholder={txModalType === 'setor' ? 'Contoh: Tabungan sisa uang saku' : 'Contoh: Beli buku tulis LKS'}
                    rows={2}
                    className="w-full p-2 bg-[#FDFCFB] border border-slate-250 rounded-sm focus:ring-1 focus:ring-sky-500 focus:outline-none font-sans text-xs"
                  />
                </div>

                {/* Info about supervision */}
                <div className="flex gap-2 p-2.5 bg-sky-50/50 border border-sky-100 rounded-sm text-[10px] text-sky-900 leading-relaxed text-left font-serif">
                  <ShieldCheck size={16} className="text-sky-600 shrink-0 mt-0.5" />
                  <p>
                    Sebagai pengawasan berkala, transaksi ini akan dicatat atas nama Anda (<strong>{currentUser?.namaLengkap}</strong>) dan menunggu otorisasi persetujuan Admin agar berstatus Sah sepenuhnya.
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTxModalOpen(false);
                      setTxNominal(0);
                      setTxKeterangan('');
                    }}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px] rounded-sm transition border border-slate-200 cursor-pointer text-center"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-2.5 font-bold uppercase tracking-wider text-[10px] rounded-sm transition cursor-pointer text-center text-white ${
                      txModalType === 'setor' ? 'bg-emerald-650 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    Kirim {txModalType === 'setor' ? 'Setoran' : 'Penarikan'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: DETAIL RIWAYAT TABUNGAN PER SISWA */}
      <AnimatePresence>
        {isHistoryModalOpen && historyStudent && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-xs text-left text-[#1E293B] font-sans">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg border border-slate-300 shadow-2xl p-6 w-full max-w-xl flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4 font-sans">
                <div className="text-left">
                  <span className="text-[8px] bg-sky-600 text-white font-bold px-2 py-0.5 uppercase tracking-wider leading-none">Buku Buku Tabungan Mandiri</span>
                  <h3 className="font-serif font-bold text-slate-900 text-sm flex items-center gap-1.5 mt-1">
                    <PiggyBank size={16} className="text-sky-600" /> Riwayat Simpanan: {historyStudent.nama}
                  </h3>
                </div>
                <button 
                  onClick={() => {
                    setIsHistoryModalOpen(false);
                    setHistoryStudent(null);
                  }} 
                  className="p-1 hover:bg-slate-100 rounded text-slate-400 cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Bio Grid */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 border border-slate-200 rounded-sm mb-4 font-sans">
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Nomor Induk Siswa (NIS)</p>
                  <p className="font-bold text-slate-800 font-mono text-[10.5px]">{historyStudent.nis}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Kelas Terdaftar</p>
                  <p className="font-bold text-[#064E3B]">{historyStudent.kelas}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Nama Wali Murid</p>
                  <p className="font-bold text-slate-800">{historyStudent.namaOrangTua}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Total Simpanan Wadiah</p>
                  <p className="font-mono font-bold text-sky-700 text-xs">{rupiah(studentBalances[historyStudent.id] || 0)}</p>
                </div>
              </div>

              {/* Transaction list specific to student */}
              <div className="flex-1 overflow-y-auto space-y-2 border border-slate-200 rounded-sm bg-[#FDFCFB]/50 p-3 mb-4 scrollbar-thin">
                <p className="font-sans font-bold uppercase tracking-wider text-[9px] text-slate-500 mb-2">History Ledger Mutasi Buku:</p>
                
                {transactions.filter(t => t.siswaId === historyStudent.id).length === 0 ? (
                  <div className="py-8 text-center text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    Belum ada riwayat menabung untuk siswa/i ini.
                  </div>
                ) : (
                  transactions
                    .filter(t => t.siswaId === historyStudent.id)
                    .map((tx) => (
                      <div 
                        key={tx.id} 
                        className="bg-white border border-slate-200 p-2.5 rounded-sm flex items-center justify-between gap-3 text-[11px] font-sans hover:shadow-xs transition"
                      >
                        <div className="space-y-1 flex-1 text-left">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {tx.tipe === 'setor' ? (
                              <span className="px-1.5 py-0.2 bg-emerald-100/90 text-emerald-950 border border-emerald-250 font-bold text-[8.5px] uppercase tracking-wider rounded-none">SETOR</span>
                            ) : (
                              <span className="px-1.5 py-0.2 bg-rose-100 text-rose-950 border border-rose-250 font-bold text-[8.5px] uppercase tracking-wider rounded-none">TARIK</span>
                            )}
                            <span className="font-mono text-[9.5px] text-slate-400">{tx.tanggal}</span>
                            
                            {/* Verification badge inside history detail */}
                            {tx.adminApproved ? (
                              <span className="text-[8px] px-1 bg-emerald-50 text-emerald-700 font-bold uppercase rounded-sm">Disahkan</span>
                            ) : (
                              <span className="text-[8px] px-1 bg-amber-50 text-amber-600 font-bold uppercase rounded-sm animate-pulse">Menunggu Disahkan</span>
                            )}
                          </div>
                          <p className="text-slate-700 font-medium leading-relaxed">{tx.keterangan}</p>
                          <p className="text-[9.5px] text-slate-400 font-mono">Pencatat: {tx.petugasNama}</p>
                        </div>
                        
                        <div className="text-right">
                          <p className={`font-mono font-bold text-xs ${tx.tipe === 'setor' ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {tx.tipe === 'setor' ? '+' : '-'}{rupiah(tx.nominal)}
                          </p>
                        </div>
                      </div>
                    ))
                )}
              </div>

              {/* Close Button only */}
              <div className="pt-3 border-t border-slate-200 font-sans">
                <button
                  type="button"
                  onClick={() => {
                    setIsHistoryModalOpen(false);
                    setHistoryStudent(null);
                  }}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px] rounded-sm transition border border-slate-250 cursor-pointer text-center"
                >
                  Tutup Riwayat
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
