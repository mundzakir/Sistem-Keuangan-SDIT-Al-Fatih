import React, { useState } from 'react';
import { 
  User, 
  Calendar, 
  Wallet, 
  LogOut, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  CreditCard, 
  ArrowRight, 
  Lock, 
  BookOpen, 
  Award,
  DollarSign,
  Printer,
  ChevronRight,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';
import { Siswa, TransaksiMidtrans, BiayaLain } from '../types';

interface ParentPortalProps {
  student: Siswa;
  midtransTransactions: TransaksiMidtrans[];
  midtransConfig: {
    serverKey: string;
    clientKey: string;
  };
  onProcessPayment: (
    studentId: string,
    months: string[],
    method: 'Tunai' | 'Transfer Bank' | 'E-Wallet',
    notes: string
  ) => any;
  onPayBiayaLain: (
    studentId: string,
    feeIds: string[],
    method: 'Tunai' | 'Transfer Bank' | 'E-Wallet',
    notes: string
  ) => any;
  onCreateMidtransTransaction: (
    orderId: string,
    studentId: string,
    months: string[],
    amount: number,
    snapToken: string,
    notes: string,
    isApprovedImmediate: boolean,
    methodDetails: string
  ) => void;
  onLogout: () => void;
}

export default function ParentPortal({
  student,
  midtransTransactions,
  midtransConfig,
  onProcessPayment,
  onPayBiayaLain,
  onCreateMidtransTransaction,
  onLogout
}: ParentPortalProps) {
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedFees, setSelectedFees] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'Instant' | 'Manual_BSI'>('Instant');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [midtransStatus, setMidtransStatus] = useState<'idle' | 'snap_active' | 'success'>('idle');
  const [activePaymentOrderId, setActivePaymentOrderId] = useState<string | null>(null);

  // List of academic months (same list defined in App.tsx)
  const ACADEMIC_MONTHS = [
    'Juli 2026', 'Agustus 2026', 'September 2026',
    'Oktober 2026', 'November 2026', 'Desember 2026',
    'Januari 2027', 'Februari 2027', 'Maret 2027',
    'April 2027', 'Mei 2027', 'Juni 2027'
  ];

  // Map other fees
  const otherFees: BiayaLain[] = student.biayaLainnya || [
    { id: 'bl-1', nama: 'Uang Seragam Sekolah Baru', nominal: 350000, paid: false },
    { id: 'bl-2', nama: 'Buku Paket K-Merdeka & LKS Ganjil', nominal: 220000, paid: false },
    { id: 'bl-3', nama: 'Iuran Kegiatan Ekstrakurikuler', nominal: 50000, paid: true, paidAt: '2026-06-15', transactionId: 't-manual-init' }
  ];

  const handleToggleMonth = (month: string) => {
    if (selectedMonths.includes(month)) {
      setSelectedMonths(prev => prev.filter(m => m !== month));
    } else {
      setSelectedMonths(prev => [...prev, month]);
    }
  };

  const handleToggleFee = (feeId: string) => {
    if (selectedFees.includes(feeId)) {
      setSelectedFees(prev => prev.filter(id => id !== feeId));
    } else {
      setSelectedFees(prev => [...prev, feeId]);
    }
  };

  const totalSppChecked = selectedMonths.length * student.nominalSPP;
  const totalFeesChecked = otherFees
    .filter(f => selectedFees.includes(f.id))
    .reduce((sum, f) => sum + f.nominal, 0);

  const grandTotal = totalSppChecked + totalFeesChecked;

  const handlePayNow = () => {
    if (grandTotal <= 0) {
      alert('Silakan pilih minimal 1 tagihan SPP atau tagihan lainnya untuk dibayar.');
      return;
    }

    setIsProcessing(true);
    setSuccessMessage(null);

    // Simulated short timeout to mimic network call
    setTimeout(() => {
      const orderId = `ALFATIH-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      
      if (paymentMethod === 'Instant') {
        // High fidelity Midtrans Snap simulation
        setMidtransStatus('snap_active');
        setActivePaymentOrderId(orderId);
        setIsProcessing(false);
      } else {
        // Simulated Direct Syariah Transfer payment
        // 1. Process SPP
        if (selectedMonths.length > 0) {
          onProcessPayment(
            student.id, 
            selectedMonths, 
            'Transfer Bank', 
            `[PORTAL ORBIT] Transfer Bank Wali (NIS: ${student.nis})`
          );
        }
        // 2. Process BiayaLain
        if (selectedFees.length > 0) {
          onPayBiayaLain(
            student.id, 
            selectedFees, 
            'Transfer Bank', 
            `[PORTAL ORBIT] Transfer bank Wali (NIS: ${student.nis})`
          );
        }

        setSuccessMessage(`Alhamdulillah! Pembayaran sebesar Rp ${grandTotal.toLocaleString('id-ID')} berhasil diverifikasi langsung secara syariah.`);
        setSelectedMonths([]);
        setSelectedFees([]);
        setIsProcessing(false);
      }
    }, 1000);
  };

  const handleConfirmSimulatedSnap = () => {
    if (!activePaymentOrderId) return;
    setIsProcessing(true);

    setTimeout(() => {
      // Create transaction record
      const snapToken = `snap-token-${Date.now()}`;
      const notes = `Online Snap Portal Wali: ${selectedMonths.join(', ')} ${selectedFees.length > 0 ? '(+Biaya Lain)' : ''}`;
      
      // Auto-approve immediate to make the checkout experience perfect for parents!
      onCreateMidtransTransaction(
        activePaymentOrderId,
        student.id,
        selectedMonths,
        grandTotal,
        snapToken,
        notes,
        true, // isApprovedImmediate
        'GoPay / QRIS'
      );

      // Now process other fees too if selected as part of order
      if (selectedFees.length > 0) {
        onPayBiayaLain(
          student.id,
          selectedFees,
          'Transfer Bank',
          `[SNAP-ONLINE] ${notes}`
        );
      }

      setMidtransStatus('success');
      setSuccessMessage(`Alhamdulillah! Pembayaran Midtrans Snap berhasil diselesaikan. Tagihan terpilih otomatis lunas.`);
      setSelectedMonths([]);
      setSelectedFees([]);
      setActivePaymentOrderId(null);
      setIsProcessing(false);
    }, 1200);
  };

  const myTransactions = midtransTransactions.filter(t => t.siswaId === student.id);

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col font-sans select-none antialiased text-[#1E293B]">
      
      {/* Top Brand Banner */}
      <div className="bg-[#064E3B] text-white py-3 px-4 sm:px-6 shadow-md border-b border-emerald-800 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-1.5 rounded-full">
            <User className="text-amber-500 shrink-0" size={18} />
          </div>
          <div>
            <h1 className="font-serif font-black tracking-tight text-md">SDIT Al Fatih Baturaja</h1>
            <p className="text-[10px] text-emerald-100 font-mono tracking-wider uppercase font-semibold">
              Keluarga Wali Murid • Portal Pembayaran Mandiri Syariah
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-amber-400">{student.namaOrangTua}</p>
            <p className="text-[10px] text-slate-300 font-semibold font-mono">Wali dari {student.nama}</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 bg-red-900/40 hover:bg-red-900/60 text-red-100 border border-red-800/50 py-1.5 px-3 rounded-sm text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
          >
            <LogOut size={12} />
            Keluar Portal
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Welcome Callout Banner */}
        <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm flex flex-col md:flex-row gap-5 items-start justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full -mr-10 -mt-10 pointer-events-none"></div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-sm font-bold uppercase">Wali Murid Terotentikasi</span>
              <span className="px-2.5 py-0.5 text-[9px] bg-amber-150 text-amber-900 border border-amber-200 rounded-sm font-bold uppercase font-mono">NIS: {student.nis}</span>
            </div>
            <h2 className="text-lg font-serif font-bold text-slate-900">
              Assalamu'alaikum Wr. Wb. Bapak/Ibu Wali {student.namaOrangTua}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
              Selamat datang di Portal Wali Murid SDIT Al Fatih. Silakan pilih tagihan bulanan SPP maupun iuran lainnya di bawah ini, lalu selesaikan pembayaran secara mudah menggunakan transfer syariah instan atau sistem online Midtrans.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 sm:p-4 min-w-[240px] text-xs space-y-2 shrink-0">
            <h3 className="font-bold text-slate-700 pb-1.5 border-b border-slate-200">ℹ️ Biodata Murid Aktif</h3>
            <div className="grid grid-cols-2 gap-y-1 text-[11px] font-medium">
              <span className="text-slate-400">Nama Lengkap:</span>
              <span className="text-slate-800 font-bold text-right">{student.nama}</span>
              <span className="text-slate-400">Kelas Belajar:</span>
              <span className="text-slate-800 font-bold text-right">Kelas {student.kelas}</span>
              <span className="text-slate-400">No. WhatsApp:</span>
              <span className="text-slate-800 font-mono text-right font-bold">+{student.noWhatsApp}</span>
              <span className="text-slate-400">Tarif SPP:</span>
              <span className="text-emerald-700 font-bold text-right">Rp {student.nominalSPP.toLocaleString('id-ID')} /bln</span>
            </div>
          </div>
        </div>

        {/* Global Notifications */}
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-lg flex items-start gap-3 text-xs leading-relaxed"
          >
            <CheckCircle className="text-emerald-700 shrink-0 mt-0.5" size={16} />
            <div>
              <p className="font-bold">Alhamdulillah, Pembayaran Berhasil!</p>
              <p className="text-slate-650 mt-1">{successMessage}</p>
            </div>
          </motion.div>
        )}

        {/* Dynamic Snap Modal View */}
        {midtransStatus === 'snap_active' && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg border-2 border-[#0D9488] shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="bg-gradient-to-r from-[#0D9488] to-[#047857] text-white p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CreditCard size={18} />
                  <span className="font-bold uppercase tracking-wider text-xs">Simulasi Midtrans Snap Pay</span>
                </div>
                <span className="bg-white/20 text-[10px] px-2 py-0.5 rounded font-mono font-bold font-semibold uppercase">{activePaymentOrderId}</span>
              </div>

              <div className="p-6 space-y-4">
                <div className="text-center bg-slate-50 border border-slate-100 p-4 rounded space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Total Pembayaran</span>
                  <h4 className="text-2xl font-black text-[#0D9488] font-mono">Rp {grandTotal.toLocaleString('id-ID')}</h4>
                  <p className="text-[10px] text-slate-500 font-semibold italic">Termasuk SPP ({selectedMonths.length} Bulan) + {selectedFees.length} Biaya Lainnya</p>
                </div>

                <div className="space-y-2 text-xs">
                  <p className="font-bold text-slate-700">Metode Pembayaran Mandiri online:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" className="p-3 bg-teal-50 border border-teal-200 text-[#0c7667] rounded-sm font-bold text-center flex flex-col items-center justify-center gap-1">
                      <span className="text-lg">📱</span>
                      QRIS / GoPay / ShopeePay
                    </button>
                    <button type="button" className="p-3 bg-slate-50 border border-slate-200 text-slate-600 rounded-sm font-bold text-center flex flex-col items-center justify-center gap-1 opacity-70">
                      <span className="text-lg">🏦</span>
                      Virtual Account
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 italic leading-relaxed text-center">
                  Ini adalah gerbang uji sandbox (simulasi) Midtrans yang terhubung dengan akun sekolah. Klik tombol di bawah untuk menyelesaikan pembayaran simulasi demi pemutakhiran data secara instant.
                </p>
              </div>

              <div className="bg-slate-50 p-4 flex gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setMidtransStatus('idle');
                    setActivePaymentOrderId(null);
                  }}
                  className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded-sm transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSimulatedSnap}
                  className="flex-1 py-2.5 bg-[#0D9488] hover:bg-[#0c7667] text-white text-[10px] font-bold uppercase tracking-wider rounded-sm transition shadow flex items-center justify-center gap-1.5"
                >
                  Bayar Berhasil 🚀
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Portal Core Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT PANEL: Invoices and selection (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* SPP monthly list */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3 flex justify-between items-center border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-[#064E3B]" />
                  <h3 className="font-serif font-black text-xs text-slate-900 uppercase">Tagihan SPP Bulanan (TP 2026/2027)</h3>
                </div>
                <span className="text-[10px] bg-[#064E3B] text-white px-2 py-0.5 rounded font-bold">Pilih Tagihan SPP Anda</span>
              </div>

              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {ACADEMIC_MONTHS.map((month) => {
                  const paymentState = student.statusSPP[month];
                  const isPaid = paymentState?.paid;
                  const isSelected = selectedMonths.includes(month);

                  return (
                    <div 
                      key={month}
                      className={`border p-3.5 rounded-sm relative flex flex-col justify-between h-24 transition ${
                        isPaid 
                          ? 'bg-slate-50/50 border-slate-200 opacity-65'
                          : isSelected
                            ? 'bg-[#064E3B]/5 border-[#064E3B] ring-1 ring-[#064E3B]'
                            : 'bg-[#FDFCFB]/80 hover:bg-white border-slate-250 cursor-pointer hover:shadow-xs'
                      }`}
                      onClick={() => !isPaid && handleToggleMonth(month)}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-[11px] text-slate-800 block">{month}</span>
                        {!isPaid && (
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => {}} // handled by div click
                            className="h-3.5 w-3.5 text-[#064E3B] border-slate-300 rounded cursor-pointer"
                          />
                        )}
                      </div>

                      <div className="flex justify-between items-end mt-2">
                        <div className="text-[10px] font-mono font-bold text-slate-500">
                          Rp {student.nominalSPP.toLocaleString('id-ID')}
                        </div>

                        {isPaid ? (
                          <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-150 font-bold">
                            <CheckCircle size={10} className="text-emerald-700" />
                            LUNAS
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded font-bold ${
                            isSelected 
                              ? 'bg-amber-100 text-amber-955 border border-amber-200' 
                              : 'bg-red-55 text-red-800 border border-red-150'
                          }`}>
                            <Clock size={10} className={isSelected ? 'text-amber-700' : 'text-red-700'} />
                            {isSelected ? 'TERPILIH' : 'BELUM BAYAR'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Non-SPP other dues */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3 flex justify-between items-center border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-[#064E3B]" />
                  <h3 className="font-serif font-black text-xs text-slate-900 uppercase">Tagihan Biaya Lainnya (Seragam, Buku & Tabungan)</h3>
                </div>
                <span className="text-[10px] bg-[#B45309] text-white px-2 py-0.5 rounded font-bold">Non-SPP</span>
              </div>

              <div className="p-4 space-y-2.5">
                {otherFees.map((fee) => {
                  const isPaid = fee.paid;
                  const isSelected = selectedFees.includes(fee.id);

                  return (
                    <div 
                      key={fee.id}
                      onClick={() => !isPaid && handleToggleFee(fee.id)}
                      className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border rounded-sm transition ${
                        isPaid 
                          ? 'bg-slate-50/50 border-slate-200 opacity-60' 
                          : isSelected
                            ? 'bg-[#B45309]/5 border-[#B45309] ring-1 ring-[#B45309]'
                            : 'bg-[#FDFCFB]/80 hover:bg-white border-slate-250 cursor-pointer'
                      }`}
                    >
                      <div className="flex gap-2.5 items-start">
                        {!isPaid && (
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => {}} // handled by div click
                            className="mt-0.5 focus:ring-0 border-slate-300 w-3.5 h-3.5"
                          />
                        )}
                        <div>
                          <p className="font-bold text-[11px] text-slate-800">{fee.nama}</p>
                          {isPaid && fee.paidAt && (
                            <p className="text-[9px] text-slate-400 font-mono italic">Tanggal lunas: {fee.paidAt}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-2 sm:mt-0 font-mono font-bold text-xs">
                        <span className="text-slate-600">Rp {fee.nominal.toLocaleString('id-ID')}</span>
                        {isPaid ? (
                          <span className="text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-150 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                            <CheckCircle size={10} className="text-emerald-700" />
                            LUNAS
                          </span>
                        ) : (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5 ${
                            isSelected 
                              ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                              : 'bg-red-50 text-red-800 border border-red-150'
                          }`}>
                            <Clock size={10} className="text-red-700" />
                            {isSelected ? 'DIPILIH' : 'PENDING'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* RIGHT PANEL: Statement / Totalizer & online payment config (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Payment Summary */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden sticky top-4">
              <div className="bg-[#064E3B] text-white px-4 py-3">
                <h3 className="font-serif font-black text-xs uppercase text-slate-100 flex items-center gap-1.5">
                  <Wallet size={14} className="text-amber-400" />
                  Kalkulasi Pembayaran
                </h3>
              </div>

              <div className="p-4 space-y-4 text-xs">
                {/* Itemized check list */}
                <div className="space-y-2 pb-3 border-b border-slate-100">
                  <h4 className="font-bold text-slate-500 uppercase tracking-widest text-[9px]">Daftar Pilihan:</h4>
                  
                  {selectedMonths.length === 0 && selectedFees.length === 0 ? (
                    <div className="text-slate-400 italic text-[11px] py-1">Belum ada tagihan yang dicentang.</div>
                  ) : (
                    <div className="space-y-1.5 font-medium max-h-40 overflow-y-auto pr-1">
                      {selectedMonths.map(m => (
                        <div key={m} className="flex justify-between items-center text-[11px] text-slate-800">
                          <span>SPP Bulan {m}</span>
                          <span className="font-mono">Rp {student.nominalSPP.toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                      {otherFees.filter(f => selectedFees.includes(f.id)).map(f => (
                        <div key={f.id} className="flex justify-between items-center text-[11px] text-slate-800">
                          <span className="truncate max-w-[160px]">{f.nama}</span>
                          <span className="font-mono">Rp {f.nominal.toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Subtotals */}
                <div className="space-y-1 py-1 text-[11px] font-medium border-b border-slate-100">
                  <div className="flex justify-between text-slate-500">
                    <span>Total SPP Terpilih:</span>
                    <span className="font-mono">Rp {totalSppChecked.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Total Uang Non-SPP:</span>
                    <span className="font-mono">Rp {totalFeesChecked.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Grand Total */}
                <div className="flex justify-between items-center py-1">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Total Pembayaran:</span>
                  <span className="text-lg font-black text-[#0c7667] font-mono">Rp {grandTotal.toLocaleString('id-ID')}</span>
                </div>

                {/* Payment method selector */}
                <div className="space-y-1.5 pt-1.5 border-t border-slate-100">
                  <span className="font-bold text-slate-500 uppercase tracking-widest text-[9px] block">Opsi Metode Pembayaran:</span>
                  
                  <div className="space-y-1.5">
                    <label className={`flex items-start gap-2.5 p-2.5 border rounded-sm cursor-pointer transition ${
                      paymentMethod === 'Instant' 
                        ? 'bg-teal-50 border-[#0D9488]' 
                        : 'bg-[#FDFCFB] border-slate-200'
                    }`}>
                      <input 
                        type="radio" 
                        name="pay_method" 
                        value="Instant"
                        checked={paymentMethod === 'Instant'}
                        onChange={() => setPaymentMethod('Instant')}
                        className="mt-0.5 text-[#0D9488]"
                      />
                      <div>
                        <p className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                          ⚡ Bayar Instan Online (Midtrans)
                          {midtransConfig.clientKey ? <span className="inline-block px-1 bg-teal-100 text-teal-800 rounded text-[8px]">Aktif</span> : null}
                        </p>
                        <p className="text-[10px] text-slate-500">Bayar instant via QRIS/GoPay/ShopeePay & Virtual Account</p>
                      </div>
                    </label>

                    <label className={`flex items-start gap-2.5 p-2.5 border rounded-sm cursor-pointer transition ${
                      paymentMethod === 'Manual_BSI' 
                        ? 'bg-[#064E3B]/5 border-[#064E3B]' 
                        : 'bg-[#FDFCFB] border-slate-200'
                    }`}>
                      <input 
                        type="radio" 
                        name="pay_method" 
                        value="Manual_BSI"
                        checked={paymentMethod === 'Manual_BSI'}
                        onChange={() => setPaymentMethod('Manual_BSI')}
                        className="mt-0.5 text-[#064E3B]"
                      />
                      <div>
                        <p className="font-bold text-slate-800 text-[11px]">🏧 Simulasi Pembayaran BSI (Lunas Cepat)</p>
                        <p className="text-[10px] text-slate-500">Transfer bank Syariah BSI secara instan demi audit kasir</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="button"
                  id="btn_bayar_mandiri_wali"
                  onClick={handlePayNow}
                  disabled={isProcessing || grandTotal === 0}
                  className="w-full py-3 bg-[#064E3B] hover:bg-[#053d2f] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed  text-white text-[10px] font-bold uppercase tracking-widest rounded-sm transition text-center shadow-md flex items-center justify-center gap-1 cursor-pointer"
                >
                  {isProcessing ? 'Memproses Transaksi...' : `Bayar Sekarang Rp ${grandTotal.toLocaleString('id-ID')}`}
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            {/* Simulated Midtrans History or School Ledger */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                <span className="font-serif font-black text-xs text-slate-900 uppercase">Riwayat Pembayaran Online</span>
                <span className="text-[10px] font-mono text-slate-400 font-bold">{myTransactions.length} Pembayaran</span>
              </div>

              <div className="p-3 text-xs divide-y divide-slate-100 max-h-56 overflow-y-auto">
                {myTransactions.length === 0 ? (
                  <p className="text-slate-400 italic text-[11px] text-center py-4">Belum ada riwayat pembayaran online via Midtrans.</p>
                ) : (
                  myTransactions.map(t => (
                    <div key={t.id} className="py-2 space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-mono text-slate-400">{t.tanggal}</span>
                        <span className={`inline-block px-1 rounded text-[8px] font-bold uppercase ${
                          t.status === 'verified' 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-150' 
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                        }`}>
                          {t.status === 'verified' ? 'Lunas / Sukses' : 'Menunggu Otorisasi'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800 text-[11px]">Rp {t.amount.toLocaleString('id-ID')}</span>
                        <span className="text-[10px] text-slate-500 font-mono font-semibold">{t.paymentMethodDetails}</span>
                      </div>
                      <p className="text-[9px] text-slate-400 truncate">{t.notes}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Footer Branding */}
      <footer className="bg-white mt-12 py-6 border-t border-slate-200 font-sans text-center text-[10px] text-slate-400">
        <p>© 2026 SDIT Al Fatih Baturaja • Rabbani • Cendekia • Berakhlak Mulia</p>
        <p className="mt-1 text-[9px] text-slate-350">Aplikasi Portal Pembayaran Syariah terintegrasi dengan Midtrans Gateway sandbox</p>
      </footer>

    </div>
  );
}
