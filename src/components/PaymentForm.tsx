/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Siswa, TransaksiKas, TransaksiMidtrans, MidtransConfig } from '../types';
import { ACADEMIC_MONTHS } from '../data';
import { 
  Users, 
  Search, 
  CreditCard, 
  Printer, 
  CheckCircle, 
  X,
  MessageSquare,
  Sparkles,
  Info,
  ShieldCheck,
  AlertCircle,
  Wallet,
  ExternalLink,
  Clock,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PaymentFormProps {
  siswa: Siswa[];
  onProcessPayment: (
    studentId: string,
    months: string[],
    method: 'Tunai' | 'Transfer Bank' | 'E-Wallet',
    notes: string
  ) => { success: boolean; lastTransactions: TransaksiKas[] };
  selectedSiswaIdForPayment: string | null;
  setSelectedSiswaIdForPayment: (id: string | null) => void;
  onProcessPaymentLain: (
    studentId: string,
    feeIds: string[],
    method: 'Tunai' | 'Transfer Bank' | 'E-Wallet',
    notes: string
  ) => { success: boolean; lastTransactions: TransaksiKas[] };
  midtransTransactions: TransaksiMidtrans[];
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
  onVerifyMidtransTransaction: (id: string) => void;
  onRejectMidtransTransaction: (id: string) => void;
  midtransConfig?: MidtransConfig;
}

export default function PaymentForm({
  siswa,
  onProcessPayment,
  selectedSiswaIdForPayment,
  setSelectedSiswaIdForPayment,
  onProcessPaymentLain,
  midtransTransactions,
  onCreateMidtransTransaction,
  onVerifyMidtransTransaction,
  onRejectMidtransTransaction,
  midtransConfig
}: PaymentFormProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Selected student
  const [selectedStudent, setSelectedStudent] = useState<Siswa | null>(null);
  
  // Tab switcher: SPP vs Non-SPP (Lainnya)
  const [paymentTypeTab, setPaymentTypeTab] = useState<'spp' | 'lainnya'>('spp');

  // Checkout choices
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedFeesLain, setSelectedFeesLain] = useState<string[]>([]);
  
  const [activeSubTab, setActiveSubTab] = useState<'entri' | 'verifikasi_midtrans'>('entri');
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'Transfer Bank' | 'E-Wallet' | 'Midtrans'>('Tunai');
  const [notes, setNotes] = useState('');

  // Midtrans checkout states
  const [isProcessingMidtrans, setIsProcessingMidtrans] = useState(false);
  const [showSnapSimulator, setShowSnapSimulator] = useState(false);
  const [simulatorOrderId, setSimulatorOrderId] = useState<string | null>(null);
  const [simulatorSelectedMethod, setSimulatorSelectedMethod] = useState<'gopay' | 'bsi_va' | 'qris'>('gopay');
  const [midtransErrorMessage, setMidtransErrorMessage] = useState<string | null>(null);

  // Search filter for verification panel
  const [verifySearchQuery, setVerifySearchQuery] = useState('');
  const [verifyStatusFilter, setVerifyStatusFilter] = useState<'semua' | 'pending_verification' | 'verified' | 'failed'>('semua');

  // Receipt Modal
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [lastPaidStudent, setLastPaidStudent] = useState<Siswa | null>(null);
  const [paidReceiptTransactions, setPaidReceiptTransactions] = useState<TransaksiKas[]>([]);
  const [generatedInvoiceNum, setGeneratedInvoiceNum] = useState('');

  // Synchronize state if parent passes selectedSiswaIdForPayment
  useEffect(() => {
    if (selectedSiswaIdForPayment) {
      const match = siswa.find(s => s.id === selectedSiswaIdForPayment);
      if (match) {
        setSelectedStudent(match);
        setSearchQuery(match.nama);
        // auto select first unpaid month
        const unpaid = ACADEMIC_MONTHS.filter(m => !match.statusSPP[m]?.paid);
        if (unpaid.length > 0) {
          setSelectedMonths([unpaid[0]]);
        } else {
          setSelectedMonths([]);
        }
      }
    }
  }, [selectedSiswaIdForPayment, siswa]);

  // Dynamically load Midtrans Snap JS SDK
  useEffect(() => {
    const clientKey = midtransConfig?.clientKey;
    if (clientKey && clientKey !== 'SB-Mid-client-mock') {
      const scriptId = 'midtrans-snap-script';
      let script = document.getElementById(scriptId) as HTMLScriptElement;
      const isSandbox = clientKey.startsWith('SB-');
      const srcUrl = isSandbox 
        ? 'https://app.sandbox.midtrans.com/snap/snap.js'
        : 'https://app.midtrans.com/snap/snap.js';

      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = srcUrl;
        script.setAttribute('data-client-key', clientKey);
        document.body.appendChild(script);
      } else {
        // Update client key attribute if config changed
        script.setAttribute('data-client-key', clientKey);
        if (script.src !== srcUrl) {
          script.src = srcUrl;
        }
      }
    }
  }, [midtransConfig]);

  // Handle student search filter
  const matchingStudents = searchQuery.trim() === '' 
    ? [] 
    : siswa.filter(s => 
        s.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.nis.includes(searchQuery)
      );

  const handleSelectStudent = (student: Siswa) => {
    setSelectedStudent(student);
    setSearchQuery(student.nama);
    setShowDropdown(false);
    setSelectedSiswaIdForPayment(null); // clear global link
    
    // Auto-select the first unpaid academic month
    const unpaid = ACADEMIC_MONTHS.filter(m => !student.statusSPP[m]?.paid);
    if (unpaid.length > 0) {
      setSelectedMonths([unpaid[0]]);
    } else {
      setSelectedMonths([]);
    }
    setNotes('');
  };

  const handleToggleMonth = (month: string) => {
    if (selectedMonths.includes(month)) {
      setSelectedMonths(selectedMonths.filter(m => m !== month));
    } else {
      setSelectedMonths([...selectedMonths, month].sort((a, b) => {
        return ACADEMIC_MONTHS.indexOf(a) - ACADEMIC_MONTHS.indexOf(b);
      }));
    }
  };

  const handleToggleFeeLain = (feeId: string) => {
    if (selectedFeesLain.includes(feeId)) {
      setSelectedFeesLain(selectedFeesLain.filter(id => id !== feeId));
    } else {
      setSelectedFeesLain([...selectedFeesLain, feeId]);
    }
  };

  const calculateTotal = () => {
    if (!selectedStudent) return 0;
    if (paymentTypeTab === 'spp') {
      return selectedMonths.length * selectedStudent.nominalSPP;
    } else {
      const currentList = selectedStudent.biayaLainnya || [];
      return currentList
        .filter(fee => selectedFeesLain.includes(fee.id))
        .reduce((sum, fee) => sum + fee.nominal, 0);
    }
  };

  const triggerReceipt = (transactions: TransaksiKas[]) => {
    const today = new Date();
    const serial = Math.floor(1000 + Math.random() * 9000);
    const invoiceNo = `INV/${today.getFullYear()}${(today.getMonth()+1).toString().padStart(2,'0')}/AF/${serial}`;
    
    setLastPaidStudent({...selectedStudent!});
    setPaidReceiptTransactions(transactions);
    setGeneratedInvoiceNum(invoiceNo);
    setReceiptModalOpen(true);

    // Reset local checkout screen
    setSelectedStudent(null);
    setSearchQuery('');
    setSelectedMonths([]);
    setSelectedFeesLain([]);
    setNotes('');
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      alert('Mohon pilih siswa terlebih dahulu.');
      return;
    }

    if (paymentMethod === 'Midtrans') {
      if (paymentTypeTab !== 'spp') {
        alert('Mohon maaf, metode Midtrans saat ini dikonfigurasi untuk pengesahan SPP bulanan terlebih dahulu.');
        return;
      }
      if (selectedMonths.length === 0) {
        alert('Mohon centang/pilih minimal satu bulan SPP yang ingin dibayar.');
        return;
      }

      const totalNominal = calculateTotal();
      setIsProcessingMidtrans(true);
      setMidtransErrorMessage(null);

      // Make payment token request to Express backend
      fetch('/api/midtrans/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          studentNis: selectedStudent.nis,
          studentNama: selectedStudent.nama,
          amount: totalNominal,
          months: selectedMonths,
          parentPhone: selectedStudent.noWhatsApp,
          customServerKey: midtransConfig?.serverKey || undefined,
          customClientKey: midtransConfig?.clientKey || undefined
        })
      })
      .then(res => {
        if (!res.ok) throw new Error('Terjadi kesalahan komunikasi dengan server gateway.');
        return res.json();
      })
      .then(data => {
        setIsProcessingMidtrans(false);
        if (data.success) {
          // If mock/simulated token
          if (data.isSimulated) {
            setSimulatorOrderId(data.orderId);
            setShowSnapSimulator(true);
          } else {
            // Real Midtrans integration!
            if ((window as any).snap) {
              (window as any).snap.pay(data.token, {
                onSuccess: function(result: any) {
                  onCreateMidtransTransaction(
                    data.orderId,
                    selectedStudent.id,
                    selectedMonths,
                    totalNominal,
                    data.token,
                    notes || 'Bayar online via Midtrans Snap',
                    false, // needs bendahara verification
                    result.payment_type || 'Credit Card/E-Wallet'
                  );
                  alert('Pembayaran berhasil diproses Midtrans! Silakan hubungi Bendahara Kelas untuk melakukan verifikasi akhir dan menerbitkan kuitansi salinan.');
                  setSelectedStudent(null);
                  setSearchQuery('');
                  setSelectedMonths([]);
                },
                onPending: function(result: any) {
                  onCreateMidtransTransaction(
                    data.orderId,
                    selectedStudent.id,
                    selectedMonths,
                    totalNominal,
                    data.token,
                    notes || 'Menunggu Pembayaran online via Midtrans Snap',
                    false,
                    'Virtual Account/E-Pay'
                  );
                  alert('Transaksi dibuat! Silakan merujuk instruksi pembayaran di popup Snap. Status di sistem adalah Menunggu Verifikasi.');
                  setSelectedStudent(null);
                  setSearchQuery('');
                  setSelectedMonths([]);
                },
                onError: function() {
                  alert('Pembayaran Midtrans gagal atau dibatalkan.');
                }
              });
            } else {
              console.log("Snap token acquired, showing high-fidelity simulator for smooth sandbox demonstration:", data.token);
              setSimulatorOrderId(data.orderId);
              setShowSnapSimulator(true);
            }
          }
        } else {
          setMidtransErrorMessage(data.message || 'Gagal menerbitkan token Midtrans.');
        }
      })
      .catch(err => {
        setIsProcessingMidtrans(false);
        setMidtransErrorMessage(err.message || 'Koneksi ke gateway terputus.');
      });

      return;
    }
    
    if (paymentTypeTab === 'spp') {
      if (selectedMonths.length === 0) {
        alert('Mohon centang/pilih minimal satu bulan SPP yang ingin dibayar.');
        return;
      }
      
      const res = onProcessPayment(selectedStudent.id, selectedMonths, paymentMethod, notes);
      
      if (res.success) {
        triggerReceipt(res.lastTransactions);
      }
    } else {
      if (selectedFeesLain.length === 0) {
        alert('Mohon pilih minimal satu iuran/tagihan non-SPP yang ingin dibayar.');
        return;
      }
      
      const res = onProcessPaymentLain(selectedStudent.id, selectedFeesLain, paymentMethod, notes);
      
      if (res.success) {
        triggerReceipt(res.lastTransactions);
      }
    }
  };

  const rupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  // Create WhatsApp Web deep link for receipt manual backup
  const handleGenerateWhatsAppLink = () => {
    if (!lastPaidStudent || paidReceiptTransactions.length === 0) return '#';
    const totalPaid = paidReceiptTransactions.reduce((acc, curr) => acc + curr.nominal, 0);
    const monthsStr = paidReceiptTransactions.map(t => t.bulanSPP).join(', ');
    
    const message = 
      `Yth. Bapak/Ibu Wali Murid dari *${lastPaidStudent.nama}* (Kelas ${lastPaidStudent.kelas}),\n\n` +
      `Alhamdulillah, pembayaran SPP sekolah putra/i Anda telah berhasil kami terima.\n\n` +
      `*Rincian Pembayaran:*\n` +
      `• No. Resi: _${generatedInvoiceNum}_\n` +
      `• Bulan: *${monthsStr}*\n` +
      `• Total: *${rupiah(totalPaid)}*\n` +
      `• Metode: _${paymentMethod}_\n` +
      `• Tanggal: _${paidReceiptTransactions[0]?.tanggal}_\n\n` +
      `Semoga menjadi amal ibadah berkah dan melancarkan proses proses belajar mengajar anak tercinta. Jazakumullahu Khairan Katsiran.\n\n` +
      `-- *SDIT AL FATIH BATURAJA* --`;

    return `https://wa.me/${lastPaidStudent.noWhatsApp}?text=${encodeURIComponent(message)}`;
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const filteredMidtransList = midtransTransactions.filter(tx => {
    const sQuery = verifySearchQuery.toLowerCase();
    const matchesSearch = 
      tx.id.toLowerCase().includes(sQuery) ||
      tx.siswaNama.toLowerCase().includes(sQuery) ||
      tx.siswaNis.toLowerCase().includes(sQuery);

    if (!matchesSearch) return false;

    if (verifyStatusFilter === 'semua') return true;
    return tx.status === verifyStatusFilter;
  });

  const handleSimulatedPaymentSuccess = (paymentType: string) => {
    if (!selectedStudent || !simulatorOrderId) return;

    onCreateMidtransTransaction(
      simulatorOrderId,
      selectedStudent.id,
      selectedMonths,
      calculateTotal(),
      'simulated-token-' + Math.random().toString(36).substring(2, 11),
      notes || 'Simulasi Bayar Online via Midtrans Snap',
      false, // needs bendahara verification
      paymentType === 'gopay' ? 'GoPay QRIS' : paymentType === 'bsi_va' ? 'BSI Virtual Account' : 'QRIS ShopeePay'
    );

    alert('MANTAP! Simulasi Dana Masuk Gateway Berhasil.\n\nSistem telah mencatatkan transaksi ini dengan status MENUNGGU VERIFIKASI. Sekarang, silakan beralih ke Tab "Verifikasi Midtrans" di atas untuk mengesahkannya sebagai Bendahara sekolah.');
    
    // Reset inputs
    setShowSnapSimulator(false);
    setSimulatorOrderId(null);
    setSelectedStudent(null);
    setSearchQuery('');
    setSelectedMonths([]);
  };

  return (
    <div className="space-y-6">
      {/* Subtab top switches */}
      <div className="flex bg-[#F1F5F9] p-1.5 rounded-sm max-w-sm border border-slate-200 no-print select-none">
        <button
          type="button"
          onClick={() => setActiveSubTab('entri')}
          className={`flex-1 py-2 px-3 rounded-sm font-sans text-[11px] font-bold uppercase tracking-wider transition duration-150 cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'entri'
              ? 'bg-[#064E3B] text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <CreditCard size={12} />
          <span>Loket Kasir</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('verifikasi_midtrans')}
          className={`flex-1 py-1.5 px-3 rounded-sm font-sans text-[11px] font-bold uppercase tracking-wider transition duration-150 cursor-pointer flex items-center justify-center gap-1.5 relative ${
            activeSubTab === 'verifikasi_midtrans'
              ? 'bg-[#064E3B] text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck size={13} />
          <span>Verifikasi Midtrans</span>
          {midtransTransactions.filter(t => t.status === 'pending_verification').length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-[#B45309] text-white text-[8px] font-black w-4.5 h-4.5 flex items-center justify-center rounded-full animate-bounce">
              {midtransTransactions.filter(t => t.status === 'pending_verification').length}
            </span>
          )}
        </button>
      </div>

      {activeSubTab === 'entri' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Checkout Selection Column */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 lg:col-span-8">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-3">
              <div className="p-2 bg-[#ECFDF5] text-[#064E3B] rounded-sm border border-emerald-100">
                <CreditCard size={18} />
              </div>
              <div>
                <h2 className="text-lg font-serif font-bold text-slate-900">Entri Pembayaran SPP</h2>
                <p className="text-[11px] text-slate-400 font-sans">Pilih nama siswa, centang bulan setoran, dan cetak lembar kuitansi resmi</p>
              </div>
            </div>

        <form onSubmit={handleCheckoutSubmit} className="space-y-5 text-xs">
          {/* Autocomplete Student Search */}
          <div className="space-y-1.5 relative">
            <label className="font-bold text-slate-550 uppercase tracking-wider text-[9px] flex items-center gap-1">
              <Users size={12} className="text-slate-400" /> Pencarian Siswa Terdaftar:
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search size={14} />
              </span>
              <input 
                id="search_checkout_siswa"
                type="text"
                placeholder="Ketik nama lengkap atau nomor induk siswa (NIS)..."
                value={searchQuery}
                onFocus={() => setShowDropdown(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                  if (selectedStudent && e.target.value !== selectedStudent.nama) {
                    setSelectedStudent(null);
                    setSelectedMonths([]);
                  }
                }}
                className="w-full pl-9 pr-4 py-2.5 bg-[#FDFCFB] border border-slate-250 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#064E3B] text-slate-800"
              />
              {selectedStudent && (
                <button 
                  type="button"
                  onClick={() => {
                    setSelectedStudent(null);
                    setSearchQuery('');
                    setSelectedMonths([]);
                  }}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-650"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Results Dropdown */}
            {showDropdown && matchingStudents.length > 0 && (
              <div className="absolute z-30 w-full bg-white border border-slate-350 rounded-sm mt-1 shadow-md overflow-hidden max-h-52 overflow-y-auto font-sans">
                {matchingStudents.map(student => (
                  <div 
                    key={student.id}
                    onClick={() => handleSelectStudent(student)}
                    className="p-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition border-b border-slate-100 last:border-b-0"
                  >
                    <div>
                      <p className="font-bold text-slate-800">{student.nama}</p>
                      <p className="text-[10px] text-slate-500 font-mono">NIS: {student.nis} • Kelas {student.kelas}</p>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#064E3B] bg-emerald-50 px-2 py-0.5 rounded-sm">Pilih</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Student selection summary */}
          {selectedStudent ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#FDFCFB] rounded-sm p-4 border border-slate-205 space-y-3"
            >
              <div className="flex flex-wrap justify-between items-center gap-2">
                <div>
                  <h4 className="font-serif font-bold text-sm text-slate-900">{selectedStudent.nama}</h4>
                  <p className="text-slate-400 text-[10px] font-mono leading-relaxed">
                    NIS: {selectedStudent.nis} | Kelas {selectedStudent.kelas} | Wali: {selectedStudent.namaOrangTua}
                  </p>
                </div>
                <div className="bg-[#ECFDF5] text-[#064E3B] border border-emerald-100 font-bold px-3 py-1 text-right rounded-sm">
                  <span className="text-[9px] block text-emerald-700 font-normal uppercase tracking-wider">Tarif SPP:</span>
                  <span className="font-serif font-bold text-xs">{rupiah(selectedStudent.nominalSPP)}</span>
                </div>
              </div>

              {/* Tabs for SPP Bulanan vs. Biaya Non-SPP */}
              <div className="flex border-b border-slate-200 mb-4 text-xs font-bold uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => setPaymentTypeTab('spp')}
                  className={`flex-1 py-2 text-center border-b-2 transition ${
                    paymentTypeTab === 'spp'
                      ? 'border-[#064E3B] text-[#064E3B]'
                      : 'border-transparent text-slate-400 hover:text-slate-650 cursor-pointer'
                  }`}
                >
                  SPP Bulanan
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentTypeTab('lainnya')}
                  className={`flex-1 py-1.5 text-center border-b-2 transition flex items-center justify-center gap-1 ${
                    paymentTypeTab === 'lainnya'
                      ? 'border-[#064E3B] text-[#064E3B]'
                      : 'border-transparent text-slate-400 hover:text-slate-650 cursor-pointer'
                  }`}
                >
                  <span>Biaya Non-SPP</span>
                  <span className="px-1.5 py-0.2 bg-slate-200 text-slate-600 rounded-full text-[9px] font-mono">
                    {selectedStudent.biayaLainnya?.length || 0}
                  </span>
                </button>
              </div>

              {paymentTypeTab === 'spp' ? (
                /* Matrix of months for student */
                <div className="space-y-1.5 text-left font-sans">
                  <label className="font-bold text-slate-500 uppercase tracking-widest text-[9px] block">Status Setoran Bulanan:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ACADEMIC_MONTHS.map(month => {
                      const isPaid = selectedStudent.statusSPP[month]?.paid === true;
                      const isChecked = selectedMonths.includes(month);

                      return (
                        <div 
                          key={month}
                          onClick={() => !isPaid && handleToggleMonth(month)}
                          className={`p-2 rounded-sm border text-center relative select-none transition ${
                            isPaid 
                              ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                              : isChecked
                                ? 'bg-[#ECFDF5] border-[#064E3B] text-[#064E3B] font-bold shadow-none cursor-pointer'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 cursor-pointer'
                          }`}
                        >
                          <span className="block font-bold text-[10px] uppercase tracking-wider">{month.split(' ')[0]}</span>
                          {isPaid ? (
                            <span className="text-[8px] text-[#064E3B] bg-[#ECFDF5] font-bold px-1.5 py-0.5 rounded-sm inline-block mt-1 border border-emerald-100 uppercase tracking-wider">LUNAS</span>
                          ) : isChecked ? (
                            <span className="text-[8px] text-amber-800 bg-amber-50 font-bold px-1.5 py-0.5 rounded-sm inline-block mt-1 border border-amber-201">DIPILIH</span>
                          ) : (
                            <span className="text-[8px] text-rose-600 bg-rose-50 font-bold px-1.5 py-0.5 rounded-sm inline-block mt-1 border border-rose-100/50">TUNGGAKAN</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Biaya Non-SPP checklist */
                <div className="space-y-1.5 text-left font-sans">
                  <label className="font-bold text-slate-500 uppercase tracking-widest text-[9px] block">Pilih Tagihan Sekolah (Bisa Ganda):</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {!selectedStudent.biayaLainnya || selectedStudent.biayaLainnya.length === 0 ? (
                      <p className="col-span-2 text-center py-6 text-slate-400 italic text-[11px]">Belum ada tagihan terdaftar.</p>
                    ) : (
                      selectedStudent.biayaLainnya.map(fee => {
                        const isPaid = fee.paid === true;
                        const isChecked = selectedFeesLain.includes(fee.id);

                        return (
                          <div 
                            key={fee.id}
                            onClick={() => !isPaid && handleToggleFeeLain(fee.id)}
                            className={`p-2.5 rounded-sm border select-none transition flex flex-col justify-between ${
                              isPaid 
                                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                : isChecked
                                  ? 'bg-[#ECFDF5] border-[#064E3B] text-[#064E3B] shadow-none cursor-pointer'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 cursor-pointer'
                            }`}
                          >
                            <div className="text-left">
                              <span className="block font-bold text-[10.5px] leading-tight text-slate-800">{fee.nama}</span>
                              <span className={`block font-serif font-bold text-[10px] mt-0.5 ${isPaid ? 'text-slate-400 font-mono' : 'text-[#B45309]'}`}>{rupiah(fee.nominal)}</span>
                            </div>
                            <div className="text-left mt-2.5">
                              {isPaid ? (
                                <span className="text-[8px] text-[#064E3B] bg-[#ECFDF5] font-bold px-1.5 py-0.5 rounded-sm inline-block border border-emerald-100 uppercase tracking-wider">LUNAS</span>
                              ) : isChecked ? (
                                <span className="text-[8px] text-[#064E3B] bg-emerald-50 font-bold px-1.5 py-0.5 rounded-sm inline-block border border-emerald-250 uppercase tracking-wider">DIPILIH</span>
                              ) : (
                                <span className="text-[8px] text-amber-850 bg-amber-50 font-bold px-1.5 py-0.5 rounded-sm inline-block border border-amber-200 uppercase tracking-wider">BELUM BAYAR</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="py-12 border-2 border-dashed border-slate-200 rounded-sm flex flex-col items-center justify-center text-slate-400 bg-[#FDFCFB]">
              <Users size={28} className="mb-2 text-slate-300" />
              <p className="font-serif font-bold text-xs text-slate-600">Pilih / Cari Nama Murid Terlebih Dahulu</p>
              <p className="text-[10px] text-slate-400 font-sans mt-0.5">Sistem data akan mencocokkan status setoran otomatis</p>
            </div>
          )}

          {/* Payment Method & Metadata inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-550 uppercase tracking-wider text-[9px]">Metode Transaksi:</label>
              <select
                id="select_payment_method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full p-2.5 bg-[#FDFCFB] border border-slate-250 rounded-sm font-semibold focus:ring-1 focus:ring-[#064E3B]"
              >
                <option value="Tunai">Tunai (Cash di Loket)</option>
                <option value="Transfer Bank">Transfer Bank Syariah (BSI / Muamalat)</option>
                <option value="E-Wallet">E-Wallet Sekolah (LinkAja / QRIS)</option>
                <option value="Midtrans">Online - Midtrans Payment Gateway (GoPay / BSI / QRIS)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-550 uppercase tracking-wider text-[9px]">Catatan / Keterangan Pembayaran:</label>
              <input
                id="input_checkout_notes"
                type="text"
                placeholder={paymentMethod === 'Midtrans' ? "Misal: Bayar lunas mandiri, titipan via web" : "Misal: pelunasan titipan saku, kuitansi cetak ganda"}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 bg-[#FDFCFB] border border-slate-250 rounded-sm focus:ring-1 focus:ring-[#064E3B]"
              />
            </div>
          </div>

          {midtransErrorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-[11px] rounded-sm flex items-center gap-2">
              <AlertCircle size={14} />
              <span>{midtransErrorMessage}</span>
            </div>
          )}

          <button
            id="btn_checkout_submit"
            type="submit"
            disabled={isProcessingMidtrans || !selectedStudent || (paymentTypeTab === 'spp' ? selectedMonths.length === 0 : selectedFeesLain.length === 0)}
            className={`w-full py-3.5 rounded-sm font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer ${
              isProcessingMidtrans || !selectedStudent || (paymentTypeTab === 'spp' ? selectedMonths.length === 0 : selectedFeesLain.length === 0)
                ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-[#064E3B] hover:bg-[#053d2f] text-white shadow-sm text-xs'
            }`}
          >
            {isProcessingMidtrans ? (
              <>
                <RefreshCw size={14} className="animate-spin text-slate-400" />
                <span>Menghubungkan Midtrans...</span>
              </>
            ) : paymentMethod === 'Midtrans' ? (
              <>
                <Wallet size={14} />
                <span>Terbit Token & Bayar Online (Midtrans)</span>
              </>
            ) : (
              <span>Selesaikan Transaksi & Terbitkan Kuitansi</span>
            )}
          </button>
        </form>
      </div>

      {/* Info Column (Right-hand statistics) */}
      <div className="lg:col-span-4 space-y-4 font-sans text-left">
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm text-slate-800 relative overflow-hidden">
          <h3 className="font-serif font-bold text-[#064E3B] text-sm mb-3 border-b border-slate-100 pb-2">Rangkuman Setoran</h3>
          
          <div className="space-y-3.5 text-xs">
            {paymentTypeTab === 'spp' ? (
              <>
                <div className="flex justify-between items-center text-slate-500 border-b border-slate-100 pb-2">
                  <span className="font-medium">Iuran terpilih:</span>
                  <span className="font-bold text-slate-800">{selectedMonths.length} Bulan</span>
                </div>
                
                <div className="flex justify-between items-center text-slate-500 border-b border-slate-100 pb-2">
                  <span className="font-medium">Iuran per bulan:</span>
                  <span className="font-serif font-bold text-slate-800">
                    {selectedStudent ? rupiah(selectedStudent.nominalSPP) : 'Rp 0'}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center text-slate-500 border-b border-slate-100 pb-2">
                  <span className="font-medium">Iuran terpilih:</span>
                  <span className="font-bold text-slate-800">{selectedFeesLain.length} Item</span>
                </div>
              </>
            )}

            <div className="flex justify-between items-center border-b border-slate-150 pb-2 text-xs pt-1">
              <span className="font-bold text-slate-900">Total Pembayaran:</span>
              <span className="font-serif font-bold text-[#B45309] text-sm">
                {rupiah(calculateTotal())}
              </span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-[#FDFCFB] rounded-sm border border-slate-200 text-[10px] text-slate-500 leading-relaxed flex gap-1.5">
            <Info size={14} className="text-[#B45309] shrink-0 mt-0.5" />
            <span>Mencetak setoran di sini otomatis mencatatkan kas masuk SDIT Al Fatih dan meluncurkan simulator notifikasi WhatsApp wali murid.</span>
          </div>
        </div>

        {/* Instansi info block */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 text-xs space-y-2">
          <p className="font-bold font-serif text-[#064E3B] block border-b pb-1">Panduan Kasir:</p>
          <div className="space-y-2 text-[11px] text-slate-500 leading-relaxed">
            <p>1. <strong>Penyesuaian Nominal</strong><br/>Tarif dapat diubah melalui Manajemen Siswa apabila murid mendapatkan beasiswa syariah khusus.</p>
            <p>2. <strong>Koreksi Keliru Input</strong><br/>Hapus transaksi pada Buku Kas Umum untuk menganulir, status kartu tagihan akan otomatis kembali tertunggak.</p>
          </div>
        </div>
      </div>
    </div>
    ) : (
        /* TREASURER MIDTRANS VERIFICATION SYSTEM */
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-5 text-left font-sans text-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-emerald-50 text-[#064E3B] border border-emerald-100 rounded-sm">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h2 className="text-base font-serif font-bold text-slate-900">Otorisasi & Verifikasi Midtrans Wallet</h2>
                <p className="text-[10.5px] text-slate-400">Verifikasi manual bendahara untuk menyamakan catatan mutasi uang dengan kartu tagihan lunas.</p>
              </div>
            </div>
            
            <div className="bg-amber-50 text-amber-800 border border-amber-201 rounded-sm p-3 text-[10.5px] font-sans leading-relaxed max-w-xs shrink-0 flex gap-1.5 shadow-xs">
              <AlertCircle size={14} className="text-[#B45309] shrink-0 mt-0.5" />
              <span>Persetujuan bendahara otomatis mendebet Buku Kas Jurnal Umum dan membunyikan simulated WhatsApp resi lunas ke nomor wali murid.</span>
            </div>
          </div>

          {/* Verification toolbar filters */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-50 p-4 rounded-sm border border-slate-100">
            <div className="sm:col-span-8 relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search size={13} />
              </span>
              <input
                type="text"
                value={verifySearchQuery}
                onChange={(e) => setVerifySearchQuery(e.target.value)}
                placeholder="Cari transaksi berdasarkan Nama Siswa, NIS, atau Order ID..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-250 rounded-sm text-slate-700 placeholder-slate-400 focus:outline-[#064E3B] focus:ring-1 focus:ring-[#064E3B]"
              />
            </div>

            <div className="sm:col-span-4">
              <select
                value={verifyStatusFilter}
                onChange={(e) => setVerifyStatusFilter(e.target.value as any)}
                className="w-full p-2 bg-white border border-slate-250 rounded-sm font-semibold focus:outline-[#064E3B] text-slate-700 focus:ring-1 focus:ring-[#064E3B]"
              >
                <option value="semua">Semua Status Rekod</option>
                <option value="pending_verification">Menunggu Verifikasi ({midtransTransactions.filter(t => t.status === 'pending_verification').length})</option>
                <option value="verified">Lunas Sah Verified</option>
                <option value="failed">Gagal / Ditolak</option>
              </select>
            </div>
          </div>

          {/* List of Midtrans Transaction Records */}
          <div className="border border-slate-205 rounded-sm overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans text-xs font-medium">
                <thead>
                  <tr className="bg-[#F8FAFC] text-slate-500 font-bold uppercase tracking-wider text-[9px] border-b border-slate-200">
                    <th className="py-3 px-4">Order ID / Tanggal</th>
                    <th className="py-3 px-4">Siswa (NIS)</th>
                    <th className="py-3 px-4 text-center">Bulan Tagihan</th>
                    <th className="py-3 px-4 text-right">Nominal</th>
                    <th className="py-3 px-4 text-center">Metode Bayar</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center no-print">Otorisasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {filteredMidtransList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                        Tidak ditemukan catatan pembayaran Midtrans yang sesuai kriteria filter.
                      </td>
                    </tr>
                  ) : (
                    filteredMidtransList.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-4 font-mono text-[10.5px]">
                          <span className="font-bold text-slate-850 block">{tx.id}</span>
                          <span className="text-slate-400 text-[10px] flex items-center gap-1 mt-0.5">
                            <Clock size={10} /> {tx.tanggal}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-800 block text-[11px]">{tx.siswaNama}</span>
                          <span className="text-slate-500 font-mono text-[9px]">NIS: {tx.siswaNis} • Kelas {tx.siswaKelas}</span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-700">
                          {tx.months.join(', ')}
                        </td>
                        <td className="py-3 px-4 text-right font-serif font-black text-slate-900 text-[11.5px]">
                          {rupiah(tx.amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-block px-2 py-0.5 bg-slate-105 border border-slate-200 rounded-sm font-semibold text-slate-600 text-[10px]">
                            {tx.paymentMethodDetails || 'Midtrans Snap'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {tx.status === 'pending_verification' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-201 font-bold rounded-sm uppercase tracking-wider text-[9px] animate-pulse">
                              MENUNGGU VERIFIKASI
                            </span>
                          ) : tx.status === 'verified' ? (
                            <div className="space-y-0.5 text-center flex flex-col items-center">
                              <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 bg-emerald-50 text-[#064E3B] border border-emerald-250 font-bold rounded-sm uppercase tracking-wider text-[9px]">
                                <CheckCircle size={10} /> VERIFIED
                              </span>
                              <span className="text-[9px] text-slate-400 block font-mono">Oleh: {tx.verifiedBy || 'Bendahara'}</span>
                            </div>
                          ) : tx.status === 'failed' ? (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 text-slate-400 border border-slate-200 font-bold rounded-sm uppercase tracking-wider text-[9px]">
                              DITOLAK
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-150 font-bold rounded-sm uppercase tracking-wider text-[9px]">
                              PENDING BAYAR
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center no-print">
                          {tx.status === 'pending_verification' ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Apakah Anda yakin ingin memverifikasi pelunasan SPP untuk Siswa ${tx.siswaNama} sebesar ${rupiah(tx.amount)}?`)) {
                                    onVerifyMidtransTransaction(tx.id);
                                    alert('Pembayaran sukses disahkan bendahara! Resi WhatsApp otomatis dikirimkan ke pihak Wali Murid.');
                                  }
                                }}
                                className="px-2.5 py-1.5 bg-[#064E3B] hover:bg-[#053d2f] text-white font-bold rounded-sm transition text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer shadow-xs border border-[#064E3B]"
                              >
                                <CheckCircle size={11} /> Sahkan Lunas
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm('Tolak dan batalkan catatan transaksi masuk ini?')) {
                                    onRejectMidtransTransaction(tx.id);
                                  }
                                }}
                                className="p-1.5 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-rose-600 rounded-sm transition border border-slate-200 cursor-pointer"
                                title="Tolak Transaksi"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : tx.status === 'verified' ? (
                            <span className="text-[10px] text-emerald-700 font-semibold flex items-center justify-center gap-0.5">
                              <ShieldCheck size={12} /> Buku Kas Sinkron
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MIDTRANS HIGH-FIDELITY SNAP POPUP SIMULATOR MODAL */}
      <AnimatePresence>
        {showSnapSimulator && selectedStudent && (
          <div className="fixed inset-0 bg-[#0F172AC0] backdrop-blur-xs flex items-center justify-center p-4 z-50 font-sans">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-md shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 text-left"
            >
              {/* Midtrans Header */}
              <div className="bg-[#1E293B] text-white p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="bg-sky-500 w-2 h-5 rounded-xs animate-pulse"></div>
                  <div>
                    <h3 className="font-bold tracking-tight text-xs uppercase text-sky-400">Midtrans Sandbox</h3>
                    <p className="text-[10px] text-slate-400">Secure Payment Gateway - Token Pembayaran</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowSnapSimulator(false);
                    setSimulatorOrderId(null);
                  }}
                  className="p-1 hover:bg-slate-700 rounded-sm text-slate-300 transition"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Secure content body */}
              <div className="p-5 space-y-4 text-xs font-sans text-slate-700">
                {/* Store detail card */}
                <div className="bg-slate-50 rounded-sm p-4 border border-slate-200 space-y-2">
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span className="uppercase tracking-wider">Merchant / Toko:</span>
                    <span className="uppercase tracking-wider">ID Transaksi:</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-800 font-bold text-[11px] font-mono">
                    <span className="text-[#064E3B] font-serif">SDIT AL FATIH BATURAJA</span>
                    <span className="text-slate-650 font-sans">{simulatorOrderId}</span>
                  </div>
                  <div className="border-t border-slate-200/50 pt-2 flex justify-between items-center">
                    <span className="text-slate-500">Membayar tagihan SPP untuk:</span>
                    <strong className="text-slate-850">{selectedStudent.nama} ({selectedStudent.nis})</strong>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500">
                    <span>Bulan SPP:</span>
                    <span className="font-bold text-slate-700">{selectedMonths.join(', ')}</span>
                  </div>
                </div>

                {/* Amount display */}
                <div className="text-center bg-[#F0FDF4] p-4 rounded-sm border border-emerald-100">
                  <p className="text-[10px] uppercase tracking-widest text-[#064E3B] font-bold">JUMLAH NOMINAL TAGIHAN:</p>
                  <h1 className="text-2xl font-serif font-black text-[#047857] mt-1">
                    {rupiah(calculateTotal())}
                  </h1>
                </div>

                {/* Payment Methods Selection list */}
                <div className="space-y-2">
                  <p className="font-bold text-slate-500 text-[10px] uppercase tracking-wider">Pilih Opsi Pembayaran Sandbox:</p>
                  
                  {/* Option 1: GoPay */}
                  <div 
                    onClick={() => setSimulatorSelectedMethod('gopay')}
                    className={`p-3 rounded-sm border cursor-pointer transition flex items-center justify-between ${
                      simulatorSelectedMethod === 'gopay'
                        ? 'border-sky-500 bg-sky-50/25'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-6 bg-sky-600 rounded-xs text-white font-bold flex items-center justify-center font-mono text-[10px]">
                        gopay
                      </div>
                      <div>
                        <strong className="text-slate-800 block text-[11px]">GoPay (Simulasi Scan QR)</strong>
                        <span className="text-slate-400 text-[9px]">Konfirmasi otomatis saldo dompet digital</span>
                      </div>
                    </div>
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      simulatorSelectedMethod === 'gopay' ? 'border-sky-500 bg-sky-500 text-white' : 'border-slate-350'
                    }`}>
                      {simulatorSelectedMethod === 'gopay' && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                    </span>
                  </div>

                  {/* Option 2: BSI VA */}
                  <div 
                    onClick={() => setSimulatorSelectedMethod('bsi_va')}
                    className={`p-3 rounded-sm border cursor-pointer transition flex items-center justify-between ${
                      simulatorSelectedMethod === 'bsi_va'
                        ? 'border-emerald-600 bg-emerald-50/15'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-6 bg-[#005E50] rounded-xs text-white font-bold flex items-center justify-center text-[9px]">
                        BSI
                      </div>
                      <div>
                        <strong className="text-slate-800 block text-[11px]">BSI Virtual Account</strong>
                        <span className="text-slate-400 text-[9px]">Nomor VA: 9888 + NIS Siswa</span>
                      </div>
                    </div>
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      simulatorSelectedMethod === 'bsi_va' ? 'border-[#005E50] bg-[#005E50] text-white' : 'border-slate-350'
                    }`}>
                      {simulatorSelectedMethod === 'bsi_va' && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                    </span>
                  </div>

                  {/* Option 3: QRIS ShopeePay */}
                  <div 
                    onClick={() => setSimulatorSelectedMethod('qris')}
                    className={`p-3 rounded-sm border cursor-pointer transition flex items-center justify-between ${
                      simulatorSelectedMethod === 'qris'
                        ? 'border-amber-500 bg-amber-50/25'
                        : 'border-[#E2E8F0] hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-6 bg-rose-500 rounded-xs text-white font-bold flex items-center justify-center text-[9px] font-mono">
                        qris
                      </div>
                      <div>
                        <strong className="text-slate-800 block text-[11px]">QRIS Universal QR Code</strong>
                        <span className="text-slate-400 text-[9px]">Bisa di-scan dari aplikasi BCA, Mandiri, Shopee</span>
                      </div>
                    </div>
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      simulatorSelectedMethod === 'qris' ? 'border-amber-500 bg-amber-500 text-white' : 'border-slate-350'
                    }`}>
                      {simulatorSelectedMethod === 'qris' && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                    </span>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="button"
                  onClick={() => handleSimulatedPaymentSuccess(simulatorSelectedMethod)}
                  className="w-full py-3 bg-[#1E293B] hover:bg-[#0F172A] text-white text-[11px] font-bold uppercase tracking-wider rounded-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-3 border border-[#1E293B]"
                >
                  <ShieldCheck size={14} className="text-sky-400" />
                  <span>Simulasikan Pembayaran Berhasil</span>
                </button>

                <div className="p-2.5 bg-slate-100 rounded-sm italic text-[#64748B] text-[10px] text-center">
                  🔐 Transaksi dienkripsi menggunakan protokol sandboxing 256-bit SSL untuk simulasi loket.
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invoice Receipt Modal: Printable & Sharable */}
      <AnimatePresence>
        {receiptModalOpen && lastPaidStudent && paidReceiptTransactions.length > 0 && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto font-sans">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg border border-slate-350 shadow-2xl p-6 w-full max-w-lg no-print my-8 max-h-[90vh] overflow-y-auto"
            >
              {/* Receipt controller buttons */}
              <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4 no-print">
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#064E3B] bg-[#ECFDF5] border border-emerald-250 px-2.5 py-1 rounded-sm uppercase tracking-wider">
                  <CheckCircle size={12} /> Setoran Berhasil
                </span>
                
                <div className="flex gap-2">
                  <button 
                    onClick={handlePrintReceipt}
                    className="p-2 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded-sm transition flex items-center gap-1 border border-slate-200 cursor-pointer"
                  >
                    <Printer size={12} /> Cetak
                  </button>
                  <a 
                    href={handleGenerateWhatsAppLink()}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 py-1.5 bg-[#064E3B] hover:bg-[#053d2f] text-white text-[10px] font-bold uppercase tracking-wider rounded-sm transition flex items-center gap-1 shadow-sm border border-[#064E3B]"
                  >
                    <MessageSquare size={12} /> WA Wali
                  </a>
                  <button 
                    onClick={() => setReceiptModalOpen(false)}
                    className="p-2 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded-sm transition flex items-center gap-1 border border-slate-200 cursor-pointer"
                  >
                    <X size={12} /> Tutup
                  </button>
                </div>
              </div>

              {/* Printable Kuitansi Sheet Area */}
              <div className="border border-slate-350 p-6 rounded-sm bg-[#FDFCFB] font-mono text-[10px] text-slate-800 print-area relative shadow-sm">
                {/* School Letterhead (Kop Surat) */}
                <div className="text-center border-b border-slate-400 pb-3 mb-4 space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-[#064E3B] flex items-center justify-center text-white font-bold text-xs tracking-widest leading-none shrink-0 border border-amber-500 select-none no-print">AF</span>
                    <div>
                      <h4 className="font-serif font-bold text-[9px] text-slate-500 uppercase tracking-widest">YAYASAN KHALIFAH GENERASI CEMERLANG</h4>
                      <h3 className="font-serif font-bold text-[#064E3B] uppercase tracking-wider text-xs">SDIT AL FATIH BATURAJA</h3>
                    </div>
                  </div>
                  <p className="text-[8px] text-slate-400 font-sans">Jl. Sako Raya Gg. Kelapa Gading I Sako, Baturaja, Sumsel | Telp: (0711) 85934</p>
                </div>

                {/* Receipt Metadata */}
                <h2 className="text-center font-serif font-bold text-xs text-slate-900 tracking-wider uppercase mb-3 text-sm">KUITANSI PEMBAYARAN RESMI</h2>
                
                <div className="grid grid-cols-2 gap-4 mb-4 text-[10px] text-slate-600 bg-white p-3 rounded-sm border border-slate-200">
                  <div className="space-y-1">
                    <p>No. Invoice: <strong className="text-slate-900 font-serif">{generatedInvoiceNum}</strong></p>
                    <p>Wali Murid: <strong className="text-slate-900">{lastPaidStudent.namaOrangTua}</strong></p>
                    <p>WA Wali: <span>+{lastPaidStudent.noWhatsApp}</span></p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p>Tgl Bayar: <span>{paidReceiptTransactions[0]?.tanggal}</span></p>
                    <p>Nama Murid: <strong className="text-[#064E3B]">{lastPaidStudent.nama}</strong></p>
                    <p>Kelas: <strong>Class {lastPaidStudent.kelas} (NIS: {lastPaidStudent.nis})</strong></p>
                  </div>
                </div>

                {/* Ledger Items Table */}
                <table className="w-full text-[10px] text-left mb-4 bg-white border border-slate-200 rounded-sm overflow-hidden">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-250">
                      <th className="py-2 px-3">No</th>
                      <th className="py-2 px-3 col-span-2">Deskripsi Setoran</th>
                      <th className="py-2 px-3 text-right">Harga Satuan</th>
                      <th className="py-2 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {paidReceiptTransactions.map((t, index) => (
                      <tr key={t.id}>
                        <td className="py-2 px-3">{index + 1}</td>
                        <td className="py-2 px-3">
                          <span className="font-bold text-slate-800">SPP Bulanan - {t.bulanSPP}</span><br/>
                          <span className="text-[8px] text-slate-400 font-sans">Iuran pokok operasional pendidikan</span>
                        </td>
                        <td className="py-2 px-3 text-right font-serif">{rupiah(t.nominal)}</td>
                        <td className="py-2 px-3 text-right font-serif font-bold text-slate-850">{rupiah(t.nominal)}</td>
                      </tr>
                    ))}
                    <tr className="bg-[#FDFCFB] font-bold border-t border-slate-250">
                      <td colSpan={3} className="py-2.5 px-3 text-right uppercase text-slate-500 text-[9px] tracking-wider">Jumlah Pembayaran</td>
                      <td className="py-2.5 px-3 text-right font-serif text-[#064E3B] text-xs">
                        {rupiah(paidReceiptTransactions.reduce((acc, curr) => acc + curr.nominal, 0))}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Footer Signature */}
                <div className="grid grid-cols-2 gap-4 pt-4 mt-6 border-t border-dashed border-slate-350">
                  <div className="text-[9px] text-slate-400 self-end font-sans">
                    <p>* Kuitansi divalidasi sistem keuangan sekolah syariah.</p>
                    <p>* Sah & mengikat sebagai dokumen pembukuan kas.</p>
                  </div>
                  <div className="text-right space-y-10">
                    <div>
                      <p className="text-[9px] text-slate-500">Baturaja, {paidReceiptTransactions[0]?.tanggal}</p>
                      <p className="font-bold text-slate-700 uppercase tracking-wider text-[8px]">Bendahara Sekolah</p>
                    </div>
                    <div>
                      <strong className="text-slate-800 border-b border-slate-800 pb-0.5">Ustazah Fatmawati, S.Pd.I</strong>
                      <p className="text-[8px] text-slate-500 mt-0.5 font-mono">NIP: 19881012.FTH2026</p>
                    </div>
                  </div>
                </div>

                {/* Simulated Green Circular Stamp */}
                <div className="absolute left-1/4 bottom-14 border-2 border-emerald-600/20 text-emerald-700/25 font-bold rounded-full w-24 h-24 flex items-center justify-center text-center text-[8px] -rotate-12 pointer-events-none select-none uppercase tracking-widest font-serif leading-relaxed font-sans">
                  LUNAS<br/>SDIT AL FATIH<br/>BATURAJA
                </div>
              </div>

              {/* Warning to close */}
              <div className="mt-4 text-center text-[11px] text-slate-400 leading-relaxed">
                Tekan tombol <strong>Cetak</strong> untuk mencetak secara fisik ke printer loket kasir sekolah.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
