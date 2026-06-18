/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Siswa, TransaksiKas, WhatsAppLog, WhatsAppConfig, UserAccount, TransaksiTabungan, TransaksiMidtrans, MidtransConfig } from './types';
import { 
  INITIAL_SISWA, 
  INITIAL_TRANSAKSI, 
  INITIAL_WA_LOGS, 
  DEFAULT_WA_CONFIG,
  ACADEMIC_MONTHS,
  INITIAL_TABUNGAN_TRANSACTIONS,
  INITIAL_MIDTRANS_TRANSACTIONS
} from './data';

// Component imports
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import PaymentForm from './components/PaymentForm';
import CashBook from './components/CashBook';
import MonthlyReport from './components/MonthlyReport';
import WhatsAppSimulator from './components/WhatsAppSimulator';
import UserManagement from './components/UserManagement';
import StudentSavings from './components/StudentSavings';

// @ts-ignore
import LogoAlFatih from './assets/images/logo_al_fatih_1781782889083.jpg';

// Brand icons
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  FileSpreadsheet, 
  FolderClock, 
  MessageSquare,
  Clock,
  Sparkles,
  Phone,
  User,
  LogOut,
  KeyRound,
  PiggyBank
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import LoginForm from './components/LoginForm';
import ParentPortal from './components/ParentPortal';

export default function App() {
  // Global User Accounts state backed by local storage persistence
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('alfatih_s_users');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      {
        id: 'u-1',
        username: 'admin',
        password: 'YKGC1234',
        namaLengkap: 'Ustazah Admin Keuangan',
        role: 'admin',
        createdAt: '2026-06-15 00:00'
      },
      {
        id: 'u-2',
        username: 'bendahara',
        password: 'bendahara123',
        namaLengkap: 'Ahmad Dahlan S.Pd',
        role: 'bendahara_tabungan',
        createdAt: '2026-06-16 08:30'
      }
    ];
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = sessionStorage.getItem('alfatih_current_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return null;
  });

  const [loggedInParentSiswa, setLoggedInParentSiswa] = useState<Siswa | null>(() => {
    const saved = sessionStorage.getItem('alfatih_parent_siswa');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return null;
  });

  // Session authentication states
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem('alfatih_admin_session') === 'true' || !!sessionStorage.getItem('alfatih_parent_siswa');
  });

  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);

  const handleLoginAttempt = (uname: string, pword: string): { success: boolean; error?: string } => {
    // 1. Check if username is a student's NIS for Parent Portal
    const matchedSiswa = siswa.find(s => s.nis.trim() === uname.trim());
    if (matchedSiswa) {
      const rawDob = (matchedSiswa.tanggalLahir || '').replace(/[^0-9]/g, ''); // "12052015"
      const typedPword = pword.replace(/[^0-9]/g, '');
      if (rawDob === typedPword && typedPword.length === 8) {
        setLoggedInParentSiswa(matchedSiswa);
        sessionStorage.setItem('alfatih_parent_siswa', JSON.stringify(matchedSiswa));
        setIsLoggedIn(true);
        return { success: true };
      } else {
        return { success: false, error: 'Sandi Wali (8 digit tanggal lahir murid) tidak cocok. Gunakan format DDMMYYYY tanpa tanda strip (contoh: 12052015).' };
      }
    }

    // 2. Otherwise fall back to staff/admin login
    const match = users.find(u => u.username.toLowerCase() === uname.toLowerCase().trim());
    if (!match) {
      return { success: false, error: 'Nama pengguna (username) atau Nomor Induk Siswa (NISN) Wali tidak terdaftar.' };
    }
    if (match.password !== pword) {
      return { success: false, error: 'Kata sandi (password) salah.' };
    }
    
    // Success State commitment
    setCurrentUser(match);
    sessionStorage.setItem('alfatih_current_user', JSON.stringify(match));
    sessionStorage.setItem('alfatih_admin_session', 'true');
    setIsLoggedIn(true);
    return { success: true };
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogoutAction = () => {
    sessionStorage.removeItem('alfatih_admin_session');
    sessionStorage.removeItem('alfatih_current_user');
    sessionStorage.removeItem('alfatih_parent_siswa');
    setCurrentUser(null);
    setLoggedInParentSiswa(null);
    setIsLoggedIn(false);
    setShowLogoutModal(false);
  };

  // Global States backed by local storage persistence
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  const [siswa, setSiswa] = useState<Siswa[]>(() => {
    const saved = localStorage.getItem('alfatih_s_siswa');
    let loadedStudents: Siswa[] = INITIAL_SISWA;
    if (saved) {
      try { 
        loadedStudents = JSON.parse(saved); 
      } catch (e) { 
        console.error(e); 
      }
    }
    return loadedStudents.map(s => {
      if (!s.biayaLainnya || s.biayaLainnya.length === 0) {
        return {
          ...s,
          biayaLainnya: [
            { id: 'bl-pendidikan', nama: 'Uang Pendidikan', nominal: 1500000, paid: false },
            { id: 'bl-buku', nama: 'Pembayaran Buku Paket', nominal: 450000, paid: false },
            { id: 'bl-kegiatan', nama: 'Uang Kegiatan Tahunan', nominal: 600000, paid: false },
            { id: 'bl-daftar-ulang', nama: 'Daftar Ulang', nominal: 800000, paid: false }
          ]
        };
      }
      return s;
    });
  });

  const [transaksi, setTransaksi] = useState<TransaksiKas[]>(() => {
    const saved = localStorage.getItem('alfatih_s_transaksi');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_TRANSAKSI;
  });

  const [waLogs, setWaLogs] = useState<WhatsAppLog[]>(() => {
    const saved = localStorage.getItem('alfatih_s_walogs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_WA_LOGS;
  });

  const [waConfig, setWaConfig] = useState<WhatsAppConfig>(() => {
    const saved = localStorage.getItem('alfatih_s_waconfig');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return DEFAULT_WA_CONFIG;
  });

  const [tabunganTransactions, setTabunganTransactions] = useState<TransaksiTabungan[]>(() => {
    const saved = localStorage.getItem('alfatih_s_tabungan_trans');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_TABUNGAN_TRANSACTIONS;
  });

  const [midtransTransactions, setMidtransTransactions] = useState<TransaksiMidtrans[]>(() => {
    const saved = localStorage.getItem('alfatih_s_midtrans_trans');
    let loaded = INITIAL_MIDTRANS_TRANSACTIONS;
    if (saved) {
      try { 
        loaded = JSON.parse(saved); 
      } catch (e) { 
        console.error(e); 
      }
    }
    const seen = new Set<string>();
    return loaded.filter(tx => {
      const txId = (tx.id || '').trim();
      if (!txId || seen.has(txId)) return false;
      seen.add(txId);
      return true;
    });
  });

  const [midtransConfig, setMidtransConfig] = useState<MidtransConfig>(() => {
    const saved = localStorage.getItem('alfatih_s_midtransconfig');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return { serverKey: '', clientKey: '' };
  });

  // Navigation shortcuts
  const [selectedSiswaId, setSelectedSiswaId] = useState<string | null>(null);
  const [selectedSiswaIdForPayment, setSelectedSiswaIdForPayment] = useState<string | null>(null);

  // Active time tick
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }) + ' WIB');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('alfatih_s_siswa', JSON.stringify(siswa));
  }, [siswa]);

  useEffect(() => {
    localStorage.setItem('alfatih_s_transaksi', JSON.stringify(transaksi));
  }, [transaksi]);

  useEffect(() => {
    localStorage.setItem('alfatih_s_walogs', JSON.stringify(waLogs));
  }, [waLogs]);

  useEffect(() => {
    localStorage.setItem('alfatih_s_waconfig', JSON.stringify(waConfig));
  }, [waConfig]);

  useEffect(() => {
    localStorage.setItem('alfatih_s_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('alfatih_s_tabungan_trans', JSON.stringify(tabunganTransactions));
  }, [tabunganTransactions]);

  useEffect(() => {
    localStorage.setItem('alfatih_s_midtrans_trans', JSON.stringify(midtransTransactions));
  }, [midtransTransactions]);

  useEffect(() => {
    localStorage.setItem('alfatih_s_midtransconfig', JSON.stringify(midtransConfig));
  }, [midtransConfig]);

  // TABUNGAN (SAVINGS) CALLBACKS
  const handleAddTabunganTransaction = (newTx: Omit<TransaksiTabungan, 'id' | 'tanggal' | 'petugasNama' | 'adminApproved'>) => {
    const formattedDate = () => {
      const now = new Date();
      const YYYY = now.getFullYear();
      const MM = String(now.getMonth() + 1).padStart(2, '0');
      const DD = String(now.getDate()).padStart(2, '0');
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      return `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}`;
    };

    const transId = `tab-${Date.now()}`;
    const petugasName = currentUser ? currentUser.namaLengkap : 'System';
    const isApproved = currentUser?.role === 'admin'; // Auto approved for Admin

    const transRecord: TransaksiTabungan = {
      ...newTx,
      id: transId,
      tanggal: formattedDate(),
      petugasNama: petugasName,
      adminApproved: isApproved,
    };

    setTabunganTransactions(prev => [transRecord, ...prev]);

    // Send a WhatsApp Log when savings status changes
    const textMsg = `*SDIT AL FATIH - INFORMASI TABUNGAN*\n\nAlhamdulillah, mutasi tabungan telah dicatat untuk *${newTx.siswaNama}* (Kelas ${newTx.siswaKelas}).\n\nTipe Mutasi: *${newTx.tipe === 'setor' ? 'SETORAN (MASUK)' : 'PENARIKAN (KELUAR)'}*\nNominal: *Rp ${newTx.nominal.toLocaleString('id-ID')}*\nKeterangan: _${newTx.keterangan}_\n\nStatus: *${isApproved ? 'Telah Disahkan Admin' : 'Menunggu Otorisasi Admin'}*\n\nTerima kasih atas kepercayaan Anda. Jazakumullahu Khairan.`;
    
    // Find Siswa's phone/parent name
    const matchingStudent = siswa.find(s => s.id === newTx.siswaId);
    if (matchingStudent) {
      const waLogRecord = {
        id: `wal-tab-${Date.now()}`,
        timestamp: formattedDate(),
        studentName: newTx.siswaNama,
        parentName: matchingStudent.namaOrangTua,
        recipientPhone: matchingStudent.noWhatsApp,
        message: textMsg,
        status: 'Terkirim' as const,
        type: 'Pengumuman Kas' as const // mapped category
      };
      setWaLogs(prev => [waLogRecord, ...prev]);
    }
  };

  const handleVerifyTabunganTransaction = (id: string) => {
    setTabunganTransactions(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, adminApproved: true };
      }
      return t;
    }));
  };

  const handleDeleteTabunganTransaction = (id: string) => {
    setTabunganTransactions(prev => prev.filter(t => t.id !== id));
  };

  // MIDTRANS PAYMENT GATEWAY CALLBACKS
  const handleCreateMidtransTransaction = (
    orderId: string,
    studentId: string,
    months: string[],
    amount: number,
    snapToken: string,
    notes: string,
    isApprovedImmediate: boolean,
    methodDetails: string = "GoPay"
  ) => {
    const student = siswa.find(s => s.id === studentId);
    if (!student) return;

    const formattedDate = () => {
      const now = new Date();
      const YYYY = now.getFullYear();
      const MM = String(now.getMonth() + 1).padStart(2, '0');
      const DD = String(now.getDate()).padStart(2, '0');
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      return `${YYYY}-${MM}-${DD} ${hh}:${mm}`;
    };

    const newTx: TransaksiMidtrans = {
      id: orderId,
      tanggal: formattedDate(),
      siswaId: student.id,
      siswaNama: student.nama,
      siswaNis: student.nis,
      siswaKelas: student.kelas,
      parentName: student.namaOrangTua,
      parentPhone: student.noWhatsApp,
      amount,
      months,
      notes,
      status: isApprovedImmediate ? 'verified' : 'pending_verification',
      paymentMethodDetails: methodDetails,
      snapToken
    };

    setMidtransTransactions(prev => {
      if (prev.some(t => t.id === newTx.id)) {
        return prev;
      }
      return [newTx, ...prev];
    });

    // Send notification to Bendahara
    const dateFormatted = formattedDate();
    const bendaharaAlertMsg = `*SDIT AL FATIH - NOTIFIKASI BENDAHARA*\n\nInformasi pembayaran online (Midtrans) baru masuk dari *${student.nama}* (NIS: ${student.nis}, Kelas: ${student.kelas}).\n\nNominal: *Rp ${amount.toLocaleString('id-ID')}*\nBulan: *${months.join(', ')}*\nMetode: *${methodDetails}*\n\nStatus: *Menunggu Otorisasi Bendahara*\n\nHarap masuk ke menu Pembayaran SPP -> Tab Verifikasi Midtrans untuk melakukan pencocokan dan pengesahan tanda lunas.\n\n_Diterima pada: ${dateFormatted}_`;
    
    // Log WA notification to Bendahara (simulated)
    const waLogBendahara: WhatsAppLog = {
      id: `wal-bendahara-${Date.now()}`,
      timestamp: dateFormatted,
      studentName: 'Admin / Bendahara',
      parentName: 'Internal Sekolah',
      recipientPhone: '6281111122233', // Bendahara phone
      message: bendaharaAlertMsg,
      status: 'Terkirim',
      type: 'Pengumuman Kas'
    };
    
    setWaLogs(prev => [waLogBendahara, ...prev]);

    if (isApprovedImmediate) {
      // immediately execute payment SPP
      handleProcessPayment(studentId, months, 'Transfer Bank', `[MIDTRANS AUTO] ${notes}`);
    }
  };

  const handleVerifyMidtransTransaction = (id: string) => {
    const tx = midtransTransactions.find(t => t.id === id);
    if (!tx) return;

    const formattedDate = () => {
      const now = new Date();
      const YYYY = now.getFullYear();
      const MM = String(now.getMonth() + 1).padStart(2, '0');
      const DD = String(now.getDate()).padStart(2, '0');
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      return `${YYYY}-${MM}-${DD} ${hh}:${mm}`;
    };

    // Update state to verified
    setMidtransTransactions(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: 'verified',
          verifiedAt: formattedDate(),
          verifiedBy: currentUser ? currentUser.namaLengkap : 'Ustazah Fatmawati'
        };
      }
      return t;
    }));

    // Process actual payment (triggers SPP status update + Parents receipt notification!)
    handleProcessPayment(tx.siswaId, tx.months, 'Transfer Bank', `[MIDTRANS VERIFIED] ${tx.notes || ''}`);
  };

  const handleRejectMidtransTransaction = (id: string) => {
    setMidtransTransactions(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: 'failed'
        };
      }
      return t;
    }));
  };

  // CORE CALLBAKS

  // 1. Add Siswa
  const handleAddSiswa = (newSiswa: Omit<Siswa, 'id' | 'statusSPP'>) => {
    const freshId = `s-${Date.now()}`;
    
    // Initialize standard monthly matrix as unpaid (statusSPP)
    const initializedStatus: Siswa['statusSPP'] = {};
    ACADEMIC_MONTHS.forEach(month => {
      initializedStatus[month] = { paid: false };
    });

    const student: Siswa = {
      ...newSiswa,
      id: freshId,
      statusSPP: initializedStatus
    };

    setSiswa([...siswa, student]);
  };

  // 1b. Bulk Add Siswa
  const handleBulkAddSiswa = (newSiswaList: Omit<Siswa, 'id' | 'statusSPP'>[]) => {
    const initializedList = newSiswaList.map((item, idx) => {
      const freshId = `s-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`;
      const initializedStatus: Siswa['statusSPP'] = {};
      ACADEMIC_MONTHS.forEach(month => {
        initializedStatus[month] = { paid: false };
      });
      return {
        ...item,
        id: freshId,
        statusSPP: initializedStatus
      } as Siswa;
    });

    setSiswa(prev => [...prev, ...initializedList]);
  };

  // 2. Update Siswa
  const handleUpdateSiswa = (updatedSiswa: Siswa) => {
    setSiswa(siswa.map(s => s.id === updatedSiswa.id ? updatedSiswa : s));
  };

  // 3. Delete Siswa
  const handleDeleteSiswa = (id: string) => {
    setSiswa(siswa.filter(s => s.id !== id));
    // Optionally delete their SPP payment history from Cash general general cash log to maintain balance
    setTransaksi(transaksi.filter(t => t.siswaId !== id));
  };

  // Helper formatting rupiah
  const rupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  // 4. Process Checkout Payment (SPP Core)
  const handleProcessPayment = (
    studentId: string,
    months: string[],
    method: 'Tunai' | 'Transfer Bank' | 'E-Wallet',
    notes: string
  ) => {
    const student = siswa.find(s => s.id === studentId);
    if (!student) return { success: false, lastTransactions: [] };

    const todayDate = new Date().toISOString().substring(0, 10);
    const newTransactions: TransaksiKas[] = [];
    
    // Update student payment matrix
    const updatedStatusSPP = { ...student.statusSPP };

    months.forEach((m) => {
      const transId = `t-spp-${Date.now()}-${Math.floor(Math.random() * 900)}`;
      
      updatedStatusSPP[m] = {
        paid: true,
        paidAt: todayDate,
        transactionId: transId
      };

      const transEntry: TransaksiKas = {
        id: transId,
        tanggal: todayDate,
        tipe: 'pemasukan',
        kategori: 'SPP Bulanan',
        nominal: student.nominalSPP,
        keterangan: `Pembayaran SPP Bulan ${m} - ${student.nama} (Kelas ${student.kelas})`,
        siswaId: student.id,
        siswaNama: student.nama,
        bulanSPP: m,
        metodePembayaran: method,
      };

      newTransactions.push(transEntry);
    });

    // Save and commit student
    const updatedStudent: Siswa = {
      ...student,
      statusSPP: updatedStatusSPP
    };

    setSiswa(siswa.map(s => s.id === studentId ? updatedStudent : s));
    setTransaksi((prev) => [...prev, ...newTransactions]);

    // Dispatch Simulated WhatsApp notification in real time
    const monthsStr = months.join(', ');
    const totalPaid = months.length * student.nominalSPP;
    const nowTime = new Date().toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    
    const waMsg = 
      `*SDIT AL FATIH - KONFIRMASI PEMBAYARAN*\n\n` +
      `Alhamdulillah, terima kasih. Pembayaran SPP untuk siswa/i *${student.nama}* (Kelas ${student.kelas}) untuk bulan *${monthsStr}* sebesar *${rupiah(totalPaid)}* Telah berhasil kami terima.\n\n` +
      `_Metode: ${method}_\n` +
      `_Tanggal: ${todayDate} (${nowTime} WIB)_\n` +
      `_Catatan: ${notes || '-'}_\n\n` +
      `Semoga menjadi rezeki yang berkah dan membawa kelancaran proses belajar putra-putri Bapak/Ibu. Jazakumullahu Khairan Katsiran.\n\n` +
      `-- *Bendahara SDIT Al Fatih Baturaja* --`;

    const freshWAlot: WhatsAppLog = {
      id: `wal-${Date.now()}`,
      timestamp: `${todayDate} ${nowTime}`,
      studentName: student.nama,
      parentName: student.namaOrangTua,
      recipientPhone: student.noWhatsApp,
      message: waMsg,
      status: waConfig.isConnected ? 'Terkirim' : 'Gagal',
      type: 'Pembayaran SPP'
    };

    setWaLogs((prev) => [...prev, freshWAlot]);

    return { success: true, lastTransactions: newTransactions };
  };

  // 5. Fast pay SPP inside individual student control ledger
  const handleFastPaySPP = (studentId: string, month: string, method: 'Tunai' | 'Transfer Bank') => {
    handleProcessPayment(studentId, [month], method, 'Lunas cepat via kontrol data siswa');
  };

  // 6. Quick Remind WhatsApp
  const handleQuickRemind = (student: Siswa, month: string) => {
    const todayDate = new Date().toISOString().substring(0, 10);
    const nowTime = new Date().toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    
    const remindMsg = 
      `*SDIT AL FATIH - INFORMASI TAGIHAN SPP*\n\n` +
      `Assalamu'alaikum Wr. Wb. Bapak/Ibu Wali Murid *${student.namaOrangTua}*,\n` +
      `Semoga Bapak/Ibu dalam keadaan sehat wal afiat.\n\n` +
      `Kami menginfokan bahwa pembayaran uang SPP putra/i Anda *${student.nama}* (Kelas ${student.kelas}) untuk bulan *${month}* sebesar *${rupiah(student.nominalSPP)}* saat ini belum tercatat lunas dikoordinasikan.\n\n` +
      `Pembayaran dapat diselesaikan langsung di loket kasir sekolah (Tunai) atau melalui Transfer Bank Syariah ke rekening BSI Yayasan Khalifah Generasi Cemerlang.\n\n` +
      `Jika Bapak/Ibu sudah menyelesaikan, silakan kirimkan bukti pembayaran untuk audit kami. Terima kasih, Jazakumullahu Khairan Katsiran.\n\n` +
      `-- *Admin Tata Usaha SDIT Al Fatih* --`;

    const freshWALog: WhatsAppLog = {
      id: `wal-${Date.now()}`,
      timestamp: `${todayDate} ${nowTime}`,
      studentName: student.nama,
      parentName: student.namaOrangTua,
      recipientPhone: student.noWhatsApp,
      message: remindMsg,
      status: waConfig.isConnected ? 'Terkirim' : 'Gagal',
      type: 'Tagihan SPP'
    };

    setWaLogs((prev) => [...prev, freshWALog]);
    alert(`Notifikasi tagihan WhatsApp untuk "${student.nama}" (Bulan ${month}) telah berhasil diposting ke log simulator!`);
  };

  // 7. General cash book additions
  const handleAddTransaksiKas = (newT: Omit<TransaksiKas, 'id'>) => {
    const id = `t-non-${Date.now()}`;
    setTransaksi((prev) => [...prev, { ...newT, id }]);
  };

  // 8. Delete transaction row
  const handleDeleteTransaksiKas = (id: string) => {
    const originalEntry = transaksi.find(t => t.id === id);
    setTransaksi(transaksi.filter(t => t.id !== id));

    // If it was a student SPP, we must revert their paid status to false!
    if (originalEntry && originalEntry.siswaId && originalEntry.bulanSPP) {
      const student = siswa.find(s => s.id === originalEntry.siswaId);
      if (student) {
        const updatedStatus = { ...student.statusSPP };
        updatedStatus[originalEntry.bulanSPP] = { paid: false };
        
        setSiswa(siswa.map(s => s.id === student.id ? { ...s, statusSPP: updatedStatus } : s));
      }
    }
  };

  const handleResendMessage = (logId: string) => {
    setWaLogs((prev) => prev.map(l => {
      if (l.id === logId) {
        return {
          ...l,
          status: 'Terkirim',
          timestamp: new Date().toISOString().substring(0,10) + ' ' + new Date().toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
        };
      }
      return l;
    }));
    alert('Pesan berhasil dipicu kembali via WhatsApp Gateway API!');
  };

  const handleClearLogs = () => {
    if (confirm('Apakah Anda yakin ingin menghapus seluruh riwayat logs pengiriman pesan WhatsApp?')) {
      setWaLogs([]);
    }
  };

  // NON-SPP FEE MANAGEMENT ACTIONS
  const handleAddCustomFee = (studentId: string, name: string, nominal: number) => {
    setSiswa(prev => prev.map(s => {
      if (s.id === studentId) {
        const currentList = s.biayaLainnya || [];
        const feeId = `bl-custom-${Date.now()}`;
        return {
          ...s,
          biayaLainnya: [
            ...currentList,
            { id: feeId, nama: name.trim(), nominal: nominal, paid: false }
          ]
        };
      }
      return s;
    }));
    return true;
  };

  const handleAddGlobalFee = (name: string, nominal: number) => {
    setSiswa(prev => prev.map(s => {
      const currentList = s.biayaLainnya || [];
      const feeId = `bl-global-${Date.now()}`;
      return {
        ...s,
        biayaLainnya: [
          ...currentList,
          { id: feeId, nama: name.trim(), nominal: nominal, paid: false }
        ]
      };
    }));
    return true;
  };

  const handlePayBiayaLain = (
    studentId: string,
    feeIds: string[],
    method: 'Tunai' | 'Transfer Bank' | 'E-Wallet',
    notes: string
  ): { success: boolean; lastTransactions: TransaksiKas[] } => {
    const student = siswa.find(s => s.id === studentId);
    if (!student) return { success: false, lastTransactions: [] };

    const todayDate = new Date().toISOString().substring(0, 10);
    const newTransactions: TransaksiKas[] = [];
    
    // Update student payment matrix
    const currentList = student.biayaLainnya || [];
    const updatedBiayaLainnya = currentList.map(fee => {
      if (feeIds.includes(fee.id)) {
        const transId = `t-fee-${Date.now()}-${Math.floor(Math.random() * 900)}`;
        
        let targetCategory = 'Pemasukan Lainnya';
        const feeNameLower = fee.nama.toLowerCase();
        if (feeNameLower.includes('buku')) {
          targetCategory = 'Pemasukan Lainnya';
        } else if (feeNameLower.includes('kegiatan')) {
          targetCategory = 'Uang Kegiatan Siswa';
        } else if (feeNameLower.includes('daftar ulang') || feeNameLower.includes('pendaftaran')) {
          targetCategory = 'Uang Gedung / Pendaftaran';
        } else if (feeNameLower.includes('pendidikan') || feeNameLower.includes('spp')) {
          targetCategory = 'SPP Bulanan';
        }

        const transEntry: TransaksiKas = {
          id: transId,
          tanggal: todayDate,
          tipe: 'pemasukan',
          kategori: targetCategory,
          nominal: fee.nominal,
          keterangan: `Pembayaran ${fee.nama} - ${student.nama} (Kelas ${student.kelas})`,
          siswaId: student.id,
          siswaNama: student.nama,
          metodePembayaran: method,
        };
        newTransactions.push(transEntry);

        return {
          ...fee,
          paid: true,
          paidAt: todayDate,
          transactionId: transId
        };
      }
      return fee;
    });

    const updatedStudent: Siswa = {
      ...student,
      biayaLainnya: updatedBiayaLainnya
    };

    setSiswa(siswa.map(s => s.id === studentId ? updatedStudent : s));
    setTransaksi((prev) => [...prev, ...newTransactions]);

    // Dispatch Simulated WhatsApp notification in real time
    const feesStr = currentList.filter(f => feeIds.includes(f.id)).map(f => f.nama).join(', ');
    const totalPaid = currentList.filter(f => feeIds.includes(f.id)).reduce((sum, f) => sum + f.nominal, 0);
    const nowTime = new Date().toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    
    const waMsg = 
      `*SDIT AL FATIH - KONFIRMASI PEMBAYARAN NON-SPP*\n\n` +
      `Alhamdulillah, terima kasih. Pembayaran biaya sekolah untuk siswa/i *${student.nama}* (Kelas ${student.kelas}) berupa:\n` +
      `• *${feesStr}*\n` +
      `sebesar *${rupiah(totalPaid)}* Telah berhasil kami terima.\n\n` +
      `_Metode: ${method}_\n` +
      `_Tanggal: ${todayDate} (${nowTime} WIB)_\n` +
      `_Catatan: ${notes || '-'}_\n\n` +
      `Semoga menjadi rezeki yang berkah bagi sekolah dan kelancaran pendidikan ananda tercinta. Jazakumullahu Khairan Katsiran.\n\n` +
      `-- *Bendahara SDIT Al Fatih Baturaja* --`;

    const freshWAlog: WhatsAppLog = {
      id: `wal-${Date.now()}`,
      timestamp: `${todayDate} ${nowTime}`,
      studentName: student.nama,
      parentName: student.namaOrangTua,
      recipientPhone: student.noWhatsApp,
      message: waMsg,
      status: waConfig.isConnected ? 'Terkirim' : 'Gagal',
      type: 'Pembayaran SPP'
    };

    setWaLogs((prev) => [...prev, freshWAlog]);

    return { success: true, lastTransactions: newTransactions };
  };

  // USER ACCESS METHODS
  const handleAddUser = (newU: Omit<UserAccount, 'id' | 'createdAt'>): { success: boolean; error?: string } => {
    const exists = users.some(u => u.username.toLowerCase() === newU.username.toLowerCase().trim());
    if (exists) {
      return { success: false, error: 'Username "' + newU.username + '" sudah terdaftar di sistem. Silakan pakai username lain.' };
    }

    const todayDate = new Date().toISOString().substring(0, 10);
    const nowTime = new Date().toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

    const newUser: UserAccount = {
      ...newU,
      id: `u-${Date.now()}`,
      createdAt: `${todayDate} ${nowTime}`
    };

    setUsers([...users, newUser]);
    return { success: true };
  };

  const handleUpdatePassword = (userId: string, newPass: string): boolean => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, password: newPass } : u));
    
    // If the changed user is currently logged in, sync their local session block
    if (currentUser && currentUser.id === userId) {
      const updatedUser = { ...currentUser, password: newPass };
      setCurrentUser(updatedUser);
      sessionStorage.setItem('alfatih_current_user', JSON.stringify(updatedUser));
    }
    return true;
  };

  const handleDeleteUser = (userId: string): boolean => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    return true;
  };

  // Active view layout routing
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            siswa={siswa}
            transaksi={transaksi}
            onNavigate={(t) => setActiveTab(t)}
            setSelectedSiswaIdForPayment={setSelectedSiswaIdForPayment}
            onQuickRemind={handleQuickRemind}
          />
        );
      case 'siswa':
        return (
          <StudentList 
            siswa={siswa}
            onAddSiswa={handleAddSiswa}
            onBulkAddSiswa={handleBulkAddSiswa}
            onUpdateSiswa={handleUpdateSiswa}
            onDeleteSiswa={handleDeleteSiswa}
            onFastPaySPP={handleFastPaySPP}
            onQuickRemind={handleQuickRemind}
            selectedSiswaId={selectedSiswaId}
            setSelectedSiswaId={setSelectedSiswaId}
            onAddCustomFee={handleAddCustomFee}
            onAddGlobalFee={handleAddGlobalFee}
            onPayBiayaLain={handlePayBiayaLain}
          />
        );
      case 'spp':
        return (
          <PaymentForm 
            siswa={siswa}
            onProcessPayment={handleProcessPayment}
            selectedSiswaIdForPayment={selectedSiswaIdForPayment}
            setSelectedSiswaIdForPayment={setSelectedSiswaIdForPayment}
            onProcessPaymentLain={handlePayBiayaLain}
            midtransTransactions={midtransTransactions}
            onCreateMidtransTransaction={handleCreateMidtransTransaction}
            onVerifyMidtransTransaction={handleVerifyMidtransTransaction}
            onRejectMidtransTransaction={handleRejectMidtransTransaction}
            midtransConfig={midtransConfig}
          />
        );
      case 'tabungan':
        return (
          <StudentSavings
            siswa={siswa}
            currentUser={currentUser}
            transactions={tabunganTransactions}
            onAddTransaction={handleAddTabunganTransaction}
            onVerifyTransaction={handleVerifyTabunganTransaction}
            onDeleteTransaction={handleDeleteTabunganTransaction}
          />
        );
      case 'kas':
        return (
          <CashBook 
            transaksi={transaksi}
            onAddTransaksi={handleAddTransaksiKas}
            onDeleteTransaksi={handleDeleteTransaksiKas}
          />
        );
      case 'rekap':
        return (
          <MonthlyReport 
            siswa={siswa}
            transaksi={transaksi}
          />
        );
      case 'whatsapp':
        return (
          <WhatsAppSimulator 
            logs={waLogs}
            config={waConfig}
            onUpdateConfig={setWaConfig}
            onClearLogs={handleClearLogs}
            onResendMessage={handleResendMessage}
          />
        );
      case 'users':
        return (
          <UserManagement 
            users={users}
            currentUser={currentUser}
            onAddUser={handleAddUser}
            onUpdatePassword={handleUpdatePassword}
            onDeleteUser={handleDeleteUser}
            midtransConfig={midtransConfig}
            onUpdateMidtransConfig={setMidtransConfig}
          />
        );
      default:
        return null;
    }
  };

  if (!isLoggedIn) {
    return <LoginForm onLoginAttempt={handleLoginAttempt} />;
  }

  if (loggedInParentSiswa) {
    const freshStudent = siswa.find(s => s.id === loggedInParentSiswa.id) || loggedInParentSiswa;
    return (
      <ParentPortal 
        student={freshStudent}
        midtransTransactions={midtransTransactions}
        midtransConfig={midtransConfig}
        onProcessPayment={handleProcessPayment}
        onPayBiayaLain={handlePayBiayaLain}
        onCreateMidtransTransaction={handleCreateMidtransTransaction}
        onLogout={confirmLogoutAction}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col font-sans select-none antialiased text-[#1E293B]">
      {/* Top Preheader (Islamic School Accent banner) - hidden on print */}
      <div className="bg-[#064E3B] text-white py-2 md:py-1.5 px-4 sm:px-6 text-[10px] flex flex-col md:flex-row justify-between items-center no-print select-none border-b border-[#064E3B]/80 font-semibold tracking-wider uppercase text-center gap-2 md:gap-0">
        <div className="hidden md:flex items-center gap-1.5 text-[#ECFDF5]">
          <Sparkles size={11} className="animate-pulse text-[#B45309]" /> 
          <span>Integrasi Syariah & Keamanan Terbuka SDIT Al Fatih</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[#ECFDF5]/80 font-mono text-[9px] sm:text-[10px]">
          <span>{currentTime}</span>
          <span className="flex items-center gap-1 border-l border-[#ECFDF5]/20 pl-3">
            <User size={11} className="text-[#ECFDF5]/60" />
            {currentUser ? `${currentUser.role === 'admin' ? 'Admin' : 'Petugas'}: ${currentUser.namaLengkap}` : 'Petugas: Admin Keuangan'}
          </span>
          <button
            id="btn_logout_portal"
            onClick={handleLogout}
            className="flex items-center gap-1 text-red-305 hover:text-white transition duration-150 uppercase tracking-widest font-sans font-bold text-[9px] border-l border-[#ECFDF5]/20 pl-3 focus:outline-none cursor-pointer"
          >
            <LogOut size={11} />
            Keluar
          </button>
        </div>
      </div>

      {/* Main Header / Navigation bar */}
      <header className="bg-white border-b border-slate-200 no-print sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between py-3 md:py-5 gap-3 md:gap-4">
            {/* Logo area */}
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 flex shrink-0 items-center justify-center select-none shadow-sm rounded-full overflow-hidden border border-[#B45309]">
                <img 
                  src={LogoAlFatih} 
                  alt="SDIT Al Fatih Baturaja Logo" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-0.5 text-left">
                <span className="inline-block px-1.5 py-0.5 text-[8px] bg-[#B45309] font-bold text-white uppercase tracking-[0.2em] leading-none">ELEMENTARY</span>
                <h1 className="font-serif font-black text-slate-900 text-sm md:text-lg tracking-tight leading-tight">SDIT Al Fatih Baturaja</h1>
                <p className="text-[9px] md:text-[10px] font-medium uppercase tracking-[0.1em] md:tracking-[0.15em] text-slate-400">Portal Keuangan & Buku Jurnal Kasir</p>
              </div>
            </div>

            {/* Navigation Tabs - Highly Responsive horizontal scrolling on mobile */}
            <nav className="flex w-full md:w-auto overflow-x-auto whitespace-nowrap scrollbar-none gap-1 -mb-3 md:-mb-5.5 px-0.5 pb-2 md:pb-0 font-sans border-t border-slate-100 md:border-t-0 pt-2 md:pt-0" aria-label="Tabs">
              {[
                { id: 'dashboard', label: 'Dasbor', icon: LayoutDashboard },
                { id: 'siswa', label: 'Siswa & Kelas', icon: Users },
                { id: 'spp', label: 'Uang SPP', icon: CreditCard },
                { id: 'tabungan', label: 'Tabungan Siswa', icon: PiggyBank },
                { id: 'kas', label: 'Jurnal Kas', icon: FolderClock },
                { id: 'rekap', label: 'Laporan PJ', icon: FileSpreadsheet },
                { id: 'whatsapp', label: 'WA Gateway', icon: MessageSquare },
                { id: 'users', label: 'Hak Akses', icon: KeyRound },
              ].map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`tab_${tab.id}`}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (tab.id !== 'siswa') setSelectedSiswaId(null);
                    }}
                    className={`relative shrink-0 px-3 py-2 md:px-3.5 md:py-4 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.1em] md:tracking-[0.15em] transition duration-150 select-none flex items-center justify-center gap-1.5 rounded-sm md:rounded-none ${
                      isSelected 
                        ? 'text-[#064E3B] border-b-2 border-[#064E3B] bg-[#064E3B]/5 md:bg-transparent' 
                        : 'text-slate-500 hover:text-slate-950 hover:border-slate-300 border-b-2 border-transparent hover:bg-slate-50/50 md:hover:bg-transparent'
                    }`}
                  >
                    <Icon size={12} className={isSelected ? 'text-[#064E3B]' : 'text-slate-400'} />
                    <span>{tab.label}</span>
                    
                    {tab.id === 'spp' && midtransTransactions.filter(t => t.status === 'pending_verification').length > 0 && (
                      <span className="px-1.5 py-0.5 font-bold text-[8px] bg-[#B45309] text-white rounded-full ml-1 animate-ping-custom font-sans">
                        {midtransTransactions.filter(t => t.status === 'pending_verification').length}
                      </span>
                    )}

                    {tab.id === 'whatsapp' && waLogs.filter(l => l.status === 'Gagal').length > 0 && (
                      <span className="px-1.5 py-0.5 font-bold text-[8px] bg-rose-600 text-white rounded-full ml-1 animate-pulse font-sans">
                        {waLogs.filter(l => l.status === 'Gagal').length}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.15 }}
            className="w-full"
          >
            {renderActiveTabContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* App Footer Element */}
      <footer className="bg-white border-t border-slate-250 py-8 text-center text-xs text-slate-500 mt-12 no-print select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-1.5 font-sans">
          <p className="font-serif font-bold text-slate-800 tracking-wide">SDIT Al Fatih Baturaja</p>
          <p className="text-[11px] opacity-75">Sistem Portal Penerimaan Uang SPP & Laporan Keuangan Bertanggungjawab (P-J)</p>
          <p className="text-[10px] uppercase tracking-widest text-[#B45309] font-semibold mt-2">© 2026 Al Fatih Elementary • Yayasan Khalifah Generasi Cemerlang</p>
        </div>
      </footer>

      {/* Custom Dialog Logout Confirmation Overlay */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutModal(false)}
              className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs transition-opacity"
            />

            {/* Modal Content Wrapper */}
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', duration: 0.4 }}
                className="relative transform overflow-hidden bg-white px-6 py-7 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md border border-slate-250 rounded-lg space-y-5"
              >
                {/* Brand Line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#B45309]"></div>

                <div className="flex items-start gap-4">
                  <div className="mx-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 sm:mx-0 sm:h-10 sm:w-10 border border-rose-150">
                    <LogOut size={18} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-serif font-bold text-slate-900 text-base" id="modal-title">
                      Konfirmasi Keluar Portal
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Sesi administrasi Anda saat ini akan diakhiri. Anda perlu memasukkan kembali kredensial akun <strong className="text-slate-800 font-mono">@{currentUser?.username}</strong> untuk mengakses data kembali.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-sm text-[10.5px] leading-relaxed text-amber-900 border border-amber-200/60 font-medium">
                  Pastikan seluruh transaksi SPP siswa dan entri pembukuan kas yang baru dikerjakan telah disimpan agar tidak terjadi diskrepansi data.
                </div>

                <div className="flex flex-row-reverse gap-2 pt-2">
                  <button
                    type="button"
                    onClick={confirmLogoutAction}
                    className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[10.5px] font-bold uppercase tracking-wider rounded-sm transition cursor-pointer"
                  >
                    Ya, Keluar Sesi
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLogoutModal(false)}
                    className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 text-[10.5px] font-bold uppercase tracking-wider rounded-sm transition border border-slate-250 cursor-pointer"
                  >
                    Batalkan
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
