/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Siswa } from '../types';
import { LIST_KELAS, ACADEMIC_MONTHS } from '../data';
import { 
  Search, 
  UserPlus, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  BookOpen, 
  X,
  Phone,
  Home,
  CreditCard,
  User,
  Calendar,
  AlertCircle,
  Sparkles,
  Plus,
  DollarSign,
  FileSpreadsheet,
  Upload,
  Download,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StudentListProps {
  siswa: Siswa[];
  onAddSiswa: (newSiswa: Omit<Siswa, 'id' | 'statusSPP'>) => void;
  onBulkAddSiswa: (newSiswaList: Omit<Siswa, 'id' | 'statusSPP'>[]) => void;
  onUpdateSiswa: (updatedSiswa: Siswa) => void;
  onDeleteSiswa: (id: string) => void;
  onFastPaySPP: (studentId: string, month: string, method: 'Tunai' | 'Transfer Bank') => void;
  onQuickRemind: (student: Siswa, month: string) => void;
  selectedSiswaId: string | null;
  setSelectedSiswaId: (id: string | null) => void;
  onAddCustomFee: (studentId: string, name: string, nominal: number) => boolean;
  onAddGlobalFee: (name: string, nominal: number) => boolean;
  onPayBiayaLain: (studentId: string, feeIds: string[], method: 'Tunai' | 'Transfer Bank' | 'E-Wallet', notes: string) => { success: boolean; lastTransactions: any[] };
}

export default function StudentList({
  siswa,
  onAddSiswa,
  onBulkAddSiswa,
  onUpdateSiswa,
  onDeleteSiswa,
  onFastPaySPP,
  onQuickRemind,
  selectedSiswaId,
  setSelectedSiswaId,
  onAddCustomFee,
  onAddGlobalFee,
  onPayBiayaLain
}: StudentListProps) {
  // Filters and table states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('Semua');
  
  // Modals for CRUD operations
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null);

  // New Student input fields
  const [newNis, setNewNis] = useState('');
  const [newNama, setNewNama] = useState('');
  const [newKelas, setNewKelas] = useState('1-A');
  const [newNamaOrangTua, setNewNamaOrangTua] = useState('');
  const [newNoWhatsApp, setNewNoWhatsApp] = useState('628');
  const [newAlamat, setNewAlamat] = useState('');
  const [newNominalSPP, setNewNominalSPP] = useState(250000);
  const [newTanggalLahir, setNewTanggalLahir] = useState('12-05-2015');

  // Rapid Pay internal trigger
  const [isRapidPayOpen, setIsRapidPayOpen] = useState(false);
  const [rapidPayMonth, setRapidPayMonth] = useState('');
  const [rapidPayMethod, setRapidPayMethod] = useState<'Tunai' | 'Transfer Bank'>('Tunai');

  // Non-SPP Local Management Preferences
  const [activeLedgerTab, setActiveLedgerTab] = useState<'spp' | 'lainnya'>('spp');

  // Master Non-SPP Presets
  const PRESET_BIAYA = [
    { nama: 'Biaya Seragam Sekolah', nominal: 450000 },
    { nama: 'Biaya Buku Pelajaran', nominal: 350000 },
    { nama: 'Uang Sarana Prasarana (Sarpas)', nominal: 800000 },
    { nama: 'Uang Kegiatan & Ekstrakurikuler', nominal: 200050 },
    { nama: 'Biaya Study Tour / Field Trip', nominal: 150000 },
    { nama: 'Peralatan & Atribut Sekolah', nominal: 100000 },
    { nama: 'Uang Pendaftaran / PPDB', nominal: 300000 },
  ];

  // Modals for non-SPP fees
  const [isGlobalFeeModalOpen, setIsGlobalFeeModalOpen] = useState(false);
  const [globalFeeName, setGlobalFeeName] = useState('');
  const [globalFeeNominal, setGlobalFeeNominal] = useState(150000);
  const [globalFeePresetIdx, setGlobalFeePresetIdx] = useState<number | 'custom'>('custom');

  const [isCustomFeeModalOpen, setIsCustomFeeModalOpen] = useState(false);
  const [customFeeName, setCustomFeeName] = useState('');
  const [customFeeNominal, setCustomFeeNominal] = useState(100000);
  const [customFeePresetIdx, setCustomFeePresetIdx] = useState<number | 'custom'>('custom');

  // States for paying individual non-SPP fee
  const [isPayFeeLainOpen, setIsPayFeeLainOpen] = useState(false);
  const [selectedFeeLainId, setSelectedFeeLainId] = useState('');
  const [selectedFeeLainName, setSelectedFeeLainName] = useState('');
  const [selectedFeeLainNominal, setSelectedFeeLainNominal] = useState(0);
  const [payFeeLainMethod, setPayFeeLainMethod] = useState<'Tunai' | 'Transfer Bank' | 'E-Wallet'>('Tunai');

  // States for editing single non-SPP fee
  const [isEditFeeModalOpen, setIsEditFeeModalOpen] = useState(false);
  const [editingFeeId, setEditingFeeId] = useState('');
  const [editingFeeName, setEditingFeeName] = useState('');
  const [editingFeeNominal, setEditingFeeNominal] = useState(0);

  // States for importing students via Excel
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);
  const [excelParsedStudents, setExcelParsedStudents] = useState<Omit<Siswa, 'id' | 'statusSPP'>[]>([]);
  const [excelImportErrors, setExcelImportErrors] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const excelInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    try {
      const wb = XLSX.utils.book_new();
      const wsData = [
        ["NIS", "Nama Siswa", "Kelas", "Nama Orang Tua", "No WhatsApp", "Alamat", "Nominal SPP"],
        ["124001", "Abdurrahman Rafif", "1A", "Muhammad Ilyas", "081234567890", "Jl. Jenderal Sudirman No. 15, Baturaja", 200000],
        ["124002", "Aisyah Humaira Salsabila", "1B", "Rizki Pratama", "085277665544", "Perumnas Surya Adi Blok D, Baturaja", 150000],
        ["124003", "Fatih Rasyid Al-Mubarak", "2A", "Budi Hermawan", "089655443322", "Jl. Dr. Sutomo No. 89, Baturaja", 150000],
        ["124004", "Kayla Nabila", "3B", "Hendra Wijaya", "628211122233", "Jl. Pancur Mas, Baturaja", 150000]
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      const wscols = [
        { wch: 10 },
        { wch: 25 },
        { wch: 8 },
        { wch: 20 },
        { wch: 15 },
        { wch: 35 },
        { wch: 12 }
      ];
      ws['!cols'] = wscols;

      XLSX.utils.book_append_sheet(wb, ws, "Template_Siswa");
      XLSX.writeFile(wb, "Template_Siswa_SDIT_Al_Fatih.xlsx");
    } catch (err) {
      alert("Gagal mengunduh template Excel. Silakan gunakan template CSV.");
    }
  };

  const handleDownloadTemplateCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["NIS,Nama Siswa,Kelas,Nama Orang Tua,No WhatsApp,Alamat,Nominal SPP",
         "124001,Abdurrahman Rafif,1A,Muhammad Ilyas,081234567890,Jl. Jenderal Sudirman No. 15 Baturaja,200000",
         "124002,Aisyah Humaira Salsabila,1B,Rizki Pratama,085277665544,Perumnas Surya Adi Blok D Baturaja,150000",
         "124003,Fatih Rasyid Al-Mubarak,2A,Budi Hermawan,089655443322,Jl. Dr. Sutomo No. 89 Baturaja,150000"].join("\n");
         
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Template_Siswa_SDIT_Al_Fatih.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExcelFileLoad = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const bstr = e.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        
        const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        if (rawRows.length < 2) {
          alert("File kosong atau tidak memiliki data.");
          return;
        }

        const headers = rawRows[0].map(h => String(h || '').toLowerCase().trim());
        
        let nisIdx = headers.findIndex(h => h.includes('nis') || h.includes('induk') || h === 'no');
        let namaIdx = headers.findIndex(h => h.includes('nama') || h.includes('murid') || h.includes('siswa') || h === 'name');
        let kelasIdx = headers.findIndex(h => h.includes('kelas') || h.includes('class') || h === 'grade');
        let ortuIdx = headers.findIndex(h => h.includes('orang') || h.includes('ortu') || h.includes('wali') || h.includes('ayah') || h.includes('ibu') || h.includes('parent'));
        let waIdx = headers.findIndex(h => h.includes('wa') || h.includes('whatsapp') || h.includes('hp') || h.includes('telepon') || h.includes('phone') || h.includes('kontak') || h.includes('no_hp'));
        let alamatIdx = headers.findIndex(h => h.includes('alamat') || h.includes('address') || h.includes('rumah') || h.includes('tinggal'));
        let sppIdx = headers.findIndex(h => h.includes('spp') || h.includes('nominal') || h.includes('biaya') || h.includes('tarif'));

        if (nisIdx === -1) nisIdx = 0;
        if (namaIdx === -1) namaIdx = 1;
        if (kelasIdx === -1) kelasIdx = 2;
        if (ortuIdx === -1) ortuIdx = 3;
        if (waIdx === -1) waIdx = 4;
        if (alamatIdx === -1) alamatIdx = 5;
        if (sppIdx === -1) sppIdx = 6;

        const parsedList: Omit<Siswa, 'id' | 'statusSPP'>[] = [];
        const logs: string[] = [];

        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row.length === 0 || row.every(cell => cell === null || cell === undefined || cell === '')) {
            continue;
          }

          const rawNis = row[nisIdx];
          const rawNama = row[namaIdx];
          const rawKelas = row[kelasIdx];
          const rawOrtu = row[ortuIdx];
          const rawWa = row[waIdx];
          const rawAlamat = row[alamatIdx];
          const rawSpp = row[sppIdx];

          if (!rawNama || String(rawNama).trim() === '') {
            logs.push(`Baris ${i + 1}: Lewati (Nama Murid kosong)`);
            continue;
          }

          const nama = String(rawNama).trim();
          const nis = rawNis ? String(rawNis).trim() : `NIS-${Math.floor(100000 + Math.random() * 900000)}`;
          
          let kelasStr = rawKelas ? String(rawKelas).trim().toUpperCase() : '1A';
          let matchClass = LIST_KELAS.find(k => k === kelasStr);
          if (!matchClass) {
            kelasStr = kelasStr.replace(/KELAS/g, '').replace(/\s+/g, '');
            matchClass = LIST_KELAS.find(k => k === kelasStr) || LIST_KELAS[0];
          }

          const namaOrangTua = rawOrtu ? String(rawOrtu).trim() : 'Orang Tua / Wali';

          let noWhatsApp = rawWa ? String(rawWa).replace(/[^0-9]/g, '') : '';
          if (noWhatsApp.startsWith('08')) {
            noWhatsApp = '628' + noWhatsApp.substring(2);
          } else if (noWhatsApp.startsWith('8')) {
            noWhatsApp = '628' + noWhatsApp.substring(1);
          } else if (noWhatsApp === '') {
            noWhatsApp = '6281200000000';
            logs.push(`Baris ${i + 1}: No WhatsApp dialihkan ke "6281200000000" karena data kosong.`);
          }

          const alamat = rawAlamat ? String(rawAlamat).trim() : 'Baturaja';

          let nominalSPP = 250000;
          if (rawSpp !== undefined && rawSpp !== null) {
            const parsedSpp = Number(String(rawSpp).replace(/[^0-9]/g, ''));
            if (!isNaN(parsedSpp) && parsedSpp > 0) {
              nominalSPP = parsedSpp;
            }
          }

          parsedList.push({
            nis,
            nama,
            kelas: matchClass,
            namaOrangTua,
            noWhatsApp,
            alamat,
            nominalSPP
          });
        }

        setExcelParsedStudents(parsedList);
        setExcelImportErrors(logs);
      } catch (err) {
        console.error(err);
        alert("Gagal memproses file Excel, mohon pastikan format kolom sesuai template.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExcelDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleExcelFileLoad(file);
    }
  };

  const handleExcelSubmitImport = () => {
    if (excelParsedStudents.length === 0) {
      alert("Tidak ada data siswa yang valid untuk diimpor.");
      return;
    }
    onBulkAddSiswa(excelParsedStudents);
    alert(`Berhasil mengimpor ${excelParsedStudents.length} siswa baru secara massal!`);
    setIsExcelImportModalOpen(false);
    setExcelParsedStudents([]);
    setExcelImportErrors([]);
  };

  // Filter students
  const filteredStudents = siswa.filter(s => {
    const matchesSearch = s.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.nis.includes(searchQuery);
    const matchesClass = selectedClassFilter === 'Semua' || s.kelas === selectedClassFilter;
    return matchesSearch && matchesClass;
  });

  const handleOpenAddModal = () => {
    setNewNis(String(20261000 + siswa.length + 1));
    setNewNama('');
    setNewKelas('1-A');
    setNewNamaOrangTua('');
    setNewNoWhatsApp('628');
    setNewAlamat('');
    setNewNominalSPP(250000);
    setNewTanggalLahir('12-05-2015');
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNama || !newNamaOrangTua || !newNoWhatsApp) {
      alert('Mohon isi semua data wajib.');
      return;
    }
    // Clean WhatsApp Number formatting to 628xxx format
    let cleanWA = newNoWhatsApp.replace(/[^0-9]/g, '');
    if (cleanWA.startsWith('08')) {
      cleanWA = '628' + cleanWA.substring(2);
    } else if (cleanWA.startsWith('8')) {
      cleanWA = '628' + cleanWA.substring(1);
    }
    onAddSiswa({
      nis: newNis,
      nama: newNama,
      kelas: newKelas,
      namaOrangTua: newNamaOrangTua,
      noWhatsApp: cleanWA,
      alamat: newAlamat,
      nominalSPP: Number(newNominalSPP),
      tanggalLahir: newTanggalLahir,
    });
    setIsAddModalOpen(false);
  };

  const handleOpenEditModal = (student: Siswa, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent opening details ledger
    setEditingSiswa(student);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSiswa || !editingSiswa.nama || !editingSiswa.namaOrangTua) return;
    
    // Clean WA
    let cleanWA = editingSiswa.noWhatsApp.replace(/[^0-9]/g, '');
    if (cleanWA.startsWith('08')) {
      cleanWA = '628' + cleanWA.substring(2);
    }
    
    onUpdateSiswa({
      ...editingSiswa,
      noWhatsApp: cleanWA,
    });
    setIsEditModalOpen(false);
    setEditingSiswa(null);
  };

  const handleDeleteClick = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Apakah Anda yakin ingin menghapus data murid "${name}"? Seluruh histori SPP-nya juga akan dihapus.`)) {
      onDeleteSiswa(id);
      if (selectedSiswaId === id) setSelectedSiswaId(null);
    }
  };

  const handleDeleteFeeLain = (feeId: string, feeName: string) => {
    if (!activeStudent) return;
    if (confirm(`Apakah Anda yakin ingin menghapus tagihan "${feeName}" dari siswa ${activeStudent.nama}?`)) {
      const updatedList = (activeStudent.biayaLainnya || []).filter(f => f.id !== feeId);
      onUpdateSiswa({
        ...activeStudent,
        biayaLainnya: updatedList
      });
    }
  };

  const handleEditFeeLainSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent || !editingFeeId || !editingFeeName.trim()) return;
    const updatedList = (activeStudent.biayaLainnya || []).map(f => {
      if (f.id === editingFeeId) {
        return {
          ...f,
          nama: editingFeeName.trim(),
          nominal: Number(editingFeeNominal)
        };
      }
      return f;
    });
    onUpdateSiswa({
      ...activeStudent,
      biayaLainnya: updatedList
    });
    setIsEditFeeModalOpen(false);
  };

  // Find selected student info
  const activeStudent = siswa.find(s => s.id === selectedSiswaId) || null;

  // Render Rupiah standard format
  const rupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Sidebar: Student list column */}
      <div className={`bg-white rounded-lg border border-slate-200 shadow-sm p-5 ${selectedSiswaId ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-serif font-bold text-slate-900">Sistem Data Siswa Terintegrasi</h2>
            <p className="text-[11px] text-slate-400">Verifikasi NIS, nominal SPP khusus, dan catatan penanggungjawab syariah</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              id="btn_add_global_fee"
              onClick={() => {
                setGlobalFeeName('');
                setGlobalFeeNominal(150000);
                setGlobalFeePresetIdx('custom');
                setIsGlobalFeeModalOpen(true);
              }}
              className="px-3 py-2.5 bg-[#B45309] hover:bg-[#9d4706] text-white text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition rounded-sm shadow-sm cursor-pointer"
            >
              <Sparkles size={11} /> Buat Tagihan Global
            </button>
            <button 
              id="btn_import_excel"
              onClick={() => {
                setExcelParsedStudents([]);
                setExcelImportErrors([]);
                setIsExcelImportModalOpen(true);
              }}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition rounded-sm shadow-sm cursor-pointer"
            >
              <FileSpreadsheet size={11} /> Impor Data Excel
            </button>
            <button 
              id="btn_add_siswa"
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-[#064E3B] hover:bg-[#053d2f] text-white text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition rounded-sm shadow-sm cursor-pointer"
            >
              <UserPlus size={11} /> Tambah Murid Baru
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
              <Search size={14} />
            </span>
            <input 
              id="input_search_student"
              type="text" 
              placeholder="Cari berdasarkan nama atau NIS siswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-[#FDFCFB] border border-slate-250 focus:outline-none focus:ring-1 focus:ring-[#064E3B] rounded-sm text-slate-800"
            />
          </div>
          <div className="w-full sm:w-48">
            <select
              id="select_class_filter"
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FDFCFB] border border-slate-250 focus:outline-none focus:ring-1 focus:ring-[#064E3B] rounded-sm font-semibold text-slate-600"
            >
              <option value="Semua">Semua Kelas</option>
              {LIST_KELAS.map(k => (
                <option key={k} value={k}>Kelas {k}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Interactive Students Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[500px]">
            <thead>
              <tr className="border-b border-slate-200 text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 bg-slate-50/50">
                <th className="py-2.5 px-3">NIS</th>
                <th className="py-2.5 px-3">Nama Siswa</th>
                <th className="py-2.5 px-3">Kelas</th>
                <th className="py-2.5 px-3">Wali Murid / HP</th>
                <th className="py-2.5 px-3 text-right">SPP Bulanan</th>
                <th className="py-2.5 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredStudents.length === 0 ? (
                <tr>
                   <td colSpan={6} className="py-10 text-center text-slate-400 italic font-serif">
                    Tidak ada siswa yang sesuai pencarian.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const isActive = student.id === selectedSiswaId;
                  return (
                    <tr 
                      key={student.id} 
                      onClick={() => setSelectedSiswaId(student.id)}
                      className={`hover:bg-slate-50/75 transition cursor-pointer ${
                        isActive ? 'bg-[#ECFDF5]/60 hover:bg-[#ECFDF5] text-slate-900 border-l-4 border-[#064E3B] font-medium' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-mono text-slate-500">{student.nis}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold font-serif text-[#1E293B]">{student.nama}</div>
                        <div className="text-[10px] text-slate-400 max-w-[200px] truncate" title={student.alamat}>
                          {student.alamat || 'Alamat tinggal belum diinput'}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-sm text-[9px] border border-slate-200/50 uppercase tracking-wider">
                          Kelas {student.kelas}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-slate-700 font-semibold">{student.namaOrangTua}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          +{student.noWhatsApp}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-serif font-bold text-slate-900">
                        {rupiah(student.nominalSPP)}
                      </td>
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center gap-1.5">
                          <button 
                            onClick={(e) => handleOpenEditModal(student, e)}
                            title="Edit Data"
                            className="p-1.5 text-slate-500 hover:text-slate-800 bg-[#FDFCFB] hover:bg-slate-100 transition border border-slate-200 rounded-sm"
                          >
                            <Edit2 size={11} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(student.id, student.nama, e)}
                            title="Hapus Siswa"
                            className="p-1.5 text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 transition border border-rose-100/50 rounded-sm"
                          >
                            <Trash2 size={11} />
                          </button>
                          <button
                            onClick={() => setSelectedSiswaId(student.id)}
                            title="Buka Buku SPP Kontrol"
                            className="p-1.5 text-[#064E3B] hover:text-white hover:bg-[#064E3B] bg-emerald-50 transition border border-emerald-100 rounded-sm"
                          >
                            <BookOpen size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Panel: Personal SPP Control Ledger */}
      <AnimatePresence>
        {selectedSiswaId && activeStudent && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="lg:col-span-5 bg-white rounded-lg border border-slate-200 shadow-sm p-5 sticky top-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#ECFDF5] text-[#064E3B] rounded-sm border border-emerald-100">
                  <BookOpen size={16} />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-slate-900 text-sm">Kartu Kontrol SPP</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Tahun Pelajaran: 2026/2027</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedSiswaId(null)}
                className="p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded text-slate-400 transition"
              >
                <X size={15} />
              </button>
            </div>

            {/* Quick Student Bio */}
            <div className="bg-[#FDFCFB] rounded-sm p-4 mb-4 space-y-2 border border-slate-200">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Nama Siswa:</span>
                <span className="font-serif font-bold text-[#064E3B]">{activeStudent.nama}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">NIS/Kelas:</span>
                <span className="font-semibold text-slate-700">{activeStudent.nis} • Kelas {activeStudent.kelas}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Nama Wali:</span>
                <span className="text-slate-700 font-semibold">{activeStudent.namaOrangTua} (+{activeStudent.noWhatsApp})</span>
              </div>
              <div className="flex justify-between text-xs pt-2.5 border-t border-slate-200">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">SPP Bulanan:</span>
                <span className="font-serif font-bold text-[#B45309]">{rupiah(activeStudent.nominalSPP)}</span>
              </div>
            </div>            {/* Dual Tabs for Ledger: SPP Bulanan vs. Tagihan Non-SPP */}
            <div className="flex border-b border-slate-200 mb-4 text-[10.5px] font-bold uppercase tracking-wider">
              <button
                type="button"
                onClick={() => setActiveLedgerTab('spp')}
                className={`flex-1 py-2 text-center border-b-2 transition ${
                  activeLedgerTab === 'spp'
                    ? 'border-[#064E3B] text-[#064E3B]'
                    : 'border-transparent text-slate-400 hover:text-slate-650 cursor-pointer'
                }`}
              >
                SPP Bulanan
              </button>
              <button
                type="button"
                onClick={() => setActiveLedgerTab('lainnya')}
                className={`flex-1 py-1.5 text-center border-b-2 transition flex items-center justify-center gap-1 ${
                  activeLedgerTab === 'lainnya'
                    ? 'border-[#064E3B] text-[#064E3B]'
                    : 'border-transparent text-slate-400 hover:text-slate-650 cursor-pointer'
                }`}
              >
                <span>Tagihan Non-SPP</span>
                <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded-full text-[9px] font-mono">
                  {activeStudent.biayaLainnya?.length || 0}
                </span>
              </button>
            </div>

            {activeLedgerTab === 'spp' ? (
              <>
                {/* 12 Academic Months Grid */}
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Matriks Setoran Bulanan:</h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {ACADEMIC_MONTHS.map(month => {
                    const paysObj = activeStudent.statusSPP[month];
                    const isPaid = paysObj?.paid === true;

                    return (
                      <div 
                        key={month} 
                        className={`flex items-center justify-between p-2.5 rounded-sm border text-[11px] transition duration-155 ${
                          isPaid 
                            ? 'bg-[#ECFDF5]/50 border-emerald-100 text-[#064E3B]' 
                            : 'bg-rose-50/15 border-rose-100/50 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {isPaid ? (
                            <CheckCircle2 size={13} className="text-[#064E3B] shrink-0" />
                          ) : (
                            <XCircle size={13} className="text-rose-500 shrink-0" />
                          )}
                          <span className="font-bold uppercase tracking-wider text-[10px]">{month.split(' ')[0]}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isPaid ? (
                            <div className="text-right">
                              <span className="font-bold text-[#064E3B] text-[10px] uppercase tracking-wider">Lunas</span>
                              <span className="block text-[8px] text-slate-400 font-mono">Tgl: {paysObj.paidAt}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button 
                                onClick={() => onQuickRemind(activeStudent, month)}
                                title="Kirim Pesan Tagihan WA"
                                className="px-2 py-1 bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-100 rounded-sm text-[9px] font-bold uppercase tracking-wider transition cursor-pointer"
                              >
                                Tagih
                              </button>
                              <button
                                onClick={() => {
                                  setRapidPayMonth(month);
                                  setIsRapidPayOpen(true);
                                }}
                                className="px-2.5 py-1 bg-[#B45309] hover:bg-[#9d4706] text-white border border-[#B45309] text-[9px] font-bold uppercase tracking-wider rounded-sm transition cursor-pointer"
                              >
                                Bayar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                {/* Non-SPP Fees List */}
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Daftar Tagihan Sekolah:</h4>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomFeeName('');
                      setCustomFeeNominal(100000);
                      setCustomFeePresetIdx('custom');
                      setIsCustomFeeModalOpen(true);
                    }}
                    className="px-2 py-1 bg-emerald-50 text-[#064E3B] border border-emerald-100 hover:bg-[#064E3B] hover:text-white transition rounded-sm text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={10} /> Tambah Tagihan
                  </button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {!activeStudent.biayaLainnya || activeStudent.biayaLainnya.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 italic text-[11px] bg-slate-50 rounded-sm border border-dashed border-slate-200">
                      Belum ada tagihan non-SPP terdaftar.
                    </div>
                  ) : (
                    activeStudent.biayaLainnya.map(fee => {
                      const isFeePaid = fee.paid === true;
                      return (
                        <div
                          key={fee.id}
                          className={`flex items-center justify-between p-2.5 rounded-sm border text-[11px] transition duration-155 ${
                            isFeePaid
                              ? 'bg-[#ECFDF5]/50 border-emerald-100 text-[#064E3B]'
                              : 'bg-[#FDFCFB] border-slate-200 hover:border-slate-350 text-slate-650'
                          }`}
                        >
                          <div className="space-y-0.5 text-left">
                            <p className="font-bold text-slate-800 text-[10.5px] leading-tight flex items-center gap-1.5">
                              {fee.nama}
                            </p>
                            <p className={`font-serif font-bold text-[10px] ${isFeePaid ? 'text-emerald-700' : 'text-amber-800'}`}>
                              {rupiah(fee.nominal)}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {isFeePaid ? (
                              <div className="text-right">
                                <span className="font-bold text-[#064E3B] text-[8px] bg-emerald-100/80 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">Lunas</span>
                                <span className="block text-[8px] text-slate-400 font-mono mt-0.5">Tgl: {fee.paidAt}</span>
                              </div>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  title="Edit Tagihan"
                                  onClick={() => {
                                    setEditingFeeId(fee.id);
                                    setEditingFeeName(fee.nama);
                                    setEditingFeeNominal(fee.nominal);
                                    setIsEditFeeModalOpen(true);
                                  }}
                                  className="p-1 text-slate-500 hover:text-slate-800 bg-[#FDFCFB] hover:bg-slate-100 border border-slate-200 rounded-sm transition cursor-pointer"
                                >
                                  <Edit2 size={11} />
                                </button>
                                <button
                                  type="button"
                                  title="Hapus Tagihan"
                                  onClick={() => handleDeleteFeeLain(fee.id, fee.nama)}
                                  className="p-1 text-rose-500 hover:text-rose-700 bg-[#FDFCFB] hover:bg-rose-50 border border-slate-200 rounded-sm transition cursor-pointer"
                                >
                                  <Trash2 size={11} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedFeeLainId(fee.id);
                                    setSelectedFeeLainName(fee.nama);
                                    setSelectedFeeLainNominal(fee.nominal);
                                    setPayFeeLainMethod('Tunai');
                                    setIsPayFeeLainOpen(false); // will set to true inside modal trigger
                                    setIsPayFeeLainOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-[#B45309] hover:bg-[#9d4706] text-white border border-[#B45309] text-[9px] font-bold uppercase tracking-wider rounded-sm transition cursor-pointer ml-1"
                                >
                                  Bayar
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
            
            <p className="text-[9px] italic text-slate-400 mt-4 text-center border-t border-slate-100 pt-3">
              *Tahun pelajaran SDIT Al Fatih dihitung mulai dari bulan Juli s.d. Juni.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rapid Pay Dialog */}
      {isRapidPayOpen && activeStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg border border-slate-300 shadow-2xl p-6 w-full max-w-sm"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-serif font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <CreditCard size={15} className="text-[#B45309]" /> Selesaikan Setoran SPP Cepat
              </h3>
              <button 
                onClick={() => setIsRapidPayOpen(false)}
                className="p-1 hover:bg-slate-100 rounded text-slate-400"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3 text-xs mb-5">
              <p className="text-slate-500 font-sans">Mencatat pelunasan SPP langsung untuk siswa berikut:</p>
              <div className="p-3 bg-[#FDFCFB] border border-slate-200 rounded-sm leading-relaxed">
                <p className="font-serif font-bold text-slate-800">{activeStudent.nama}</p>
                <p className="text-slate-500 text-[10px] mt-0.5">Bulan Tagihan: <strong className="text-[#064E3B] font-serif">{rapidPayMonth}</strong></p>
                <p className="text-slate-500 text-[10px]">Nominal Setoran: <strong className="text-slate-800 font-mono">{rupiah(activeStudent.nominalSPP)}</strong></p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Metode Pembayaran:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRapidPayMethod('Tunai')}
                    className={`p-2 rounded-sm border text-[10px] font-bold uppercase tracking-wider text-center transition ${
                      rapidPayMethod === 'Tunai' 
                        ? 'bg-[#ECFDF5] border-[#064E3B] text-[#064E3B]' 
                        : 'bg-[#FDFCFB] border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Tunai (Kasir)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRapidPayMethod('Transfer Bank')}
                    className={`p-2 rounded-sm border text-[10px] font-bold uppercase tracking-wider text-center transition ${
                      rapidPayMethod === 'Transfer Bank' 
                        ? 'bg-[#ECFDF5] border-[#064E3B] text-[#064E3B]' 
                        : 'bg-[#FDFCFB] border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Transfer Syariah
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsRapidPayOpen(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px] rounded-sm transition border border-slate-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                id="btn_confirm_rapid_pay"
                onClick={() => {
                  onFastPaySPP(activeStudent.id, rapidPayMonth, rapidPayMethod);
                  setIsRapidPayOpen(false);
                }}
                className="flex-1 py-2 bg-[#064E3B] hover:bg-[#053d2f] text-white font-bold uppercase tracking-wider text-[10px] rounded-sm transition flex items-center justify-center gap-1 cursor-pointer"
              >
                Simpan Setoran
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Add Global Fee */}
      {isGlobalFeeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-xs text-left">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg border border-slate-300 shadow-2xl p-6 w-full max-w-sm"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-serif font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Sparkles size={16} className="text-[#B45309]" /> Daftarkan Tagihan Global
              </h3>
              <button onClick={() => setIsGlobalFeeModalOpen(false)} className="p-1 hover:bg-slate-100 rounded text-slate-400">
                <X size={15} />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (!globalFeeName.trim()) { alert('Mohon isi nama tagihan'); return; }
              onAddGlobalFee(globalFeeName, Number(globalFeeNominal));
              alert(`Berhasil mendaftarkan tagihan "${globalFeeName}" sebesar Rp ${globalFeeNominal.toLocaleString('id-ID')} ke seluruh siswa!`);
              setIsGlobalFeeModalOpen(false);
            }} className="space-y-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">Template / Jenis Tagihan:</label>
                <select
                  value={globalFeePresetIdx}
                  onChange={(e) => {
                    const val = e.target.value;
                    setGlobalFeePresetIdx(val as any);
                    if (val !== 'custom') {
                      const preset = PRESET_BIAYA[Number(val)];
                      setGlobalFeeName(preset.nama);
                      setGlobalFeeNominal(preset.nominal);
                    }
                  }}
                  className="w-full p-2.5 bg-[#FDFCFB] border border-slate-250 rounded-sm focus:ring-1 focus:ring-[#064E3B] font-medium text-slate-700"
                >
                  <option value="custom">-- Tulis Kustom / Lainnya --</option>
                  {PRESET_BIAYA.map((item, idx) => (
                    <option key={idx} value={idx}>
                      {item.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">Nama Tagihan:</label>
                <input 
                  type="text" 
                  value={globalFeeName} 
                  onChange={(e) => {
                    setGlobalFeeName(e.target.value);
                    setGlobalFeePresetIdx('custom');
                  }}
                  placeholder="Contoh: Uang Kegiatan Komputer, Biaya Jas Almamater"
                  required
                  className="w-full p-2.5 bg-[#FDFCFB] border border-slate-250 rounded-sm focus:ring-1 focus:ring-[#064E3B] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">Nominal Tagihan (Rupiah):</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 font-bold text-xs">Rp</span>
                  <input 
                    type="number" 
                    value={globalFeeNominal} 
                    onChange={(e) => {
                      setGlobalFeeNominal(Number(e.target.value));
                      setGlobalFeePresetIdx('custom');
                    }}
                    required
                    className="w-full pl-9 pr-4 py-2.5 bg-[#FDFCFB] border border-slate-250 rounded-sm focus:ring-1 focus:ring-[#064E3B] focus:outline-none font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-sm text-[10px] leading-relaxed text-amber-900 border border-amber-200/60 font-medium">
                Pendaftaran tagihan global ini akan secara otomatis menambahkan jenis tagihan baru ke setiap siswa yang terdaftar di database keuangan sekolah.
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsGlobalFeeModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px] rounded-sm transition border border-slate-205 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#B45309] hover:bg-[#9d4706] text-white font-bold uppercase tracking-wider text-[10px] rounded-sm transition cursor-pointer"
                >
                  Proses Massal
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal Add Custom Student Fee */}
      {isCustomFeeModalOpen && activeStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-xs text-left">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg border border-slate-300 shadow-2xl p-6 w-full max-w-sm"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-serif font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Plus size={16} className="text-[#064E3B]" /> Tambah Tagihan Khusus Siswa
              </h3>
              <button onClick={() => setIsCustomFeeModalOpen(false)} className="p-1 hover:bg-slate-100 rounded text-slate-400">
                <X size={15} />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (!customFeeName.trim()) { alert('Mohon isi nama tagihan'); return; }
              onAddCustomFee(activeStudent.id, customFeeName, Number(customFeeNominal));
              alert(`Berhasil mendaftarkan tagihan kustom "${customFeeName}" sebesar Rp ${customFeeNominal.toLocaleString('id-ID')} hanya untuk siswa ${activeStudent.nama}!`);
              setIsCustomFeeModalOpen(false);
            }} className="space-y-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">Penerima Tagihan:</label>
                <input 
                  type="text" 
                  value={`${activeStudent.nama} (${activeStudent.nis})`} 
                  disabled
                  className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-sm text-slate-500 cursor-not-allowed font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">Template / Jenis Tagihan:</label>
                <select
                  value={customFeePresetIdx}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomFeePresetIdx(val as any);
                    if (val !== 'custom') {
                      const preset = PRESET_BIAYA[Number(val)];
                      setCustomFeeName(preset.nama);
                      setCustomFeeNominal(preset.nominal);
                    }
                  }}
                  className="w-full p-2.5 bg-[#FDFCFB] border border-slate-250 rounded-sm focus:ring-1 focus:ring-[#064E3B] font-medium text-slate-700"
                >
                  <option value="custom">-- Tulis Kustom / Lainnya --</option>
                  {PRESET_BIAYA.map((item, idx) => (
                    <option key={idx} value={idx}>
                      {item.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">Nama Tagihan Non-SPP Baru:</label>
                <input 
                  type="text" 
                  value={customFeeName} 
                  onChange={(e) => {
                    setCustomFeeName(e.target.value);
                    setCustomFeePresetIdx('custom');
                  }}
                  placeholder="Contoh: Titipan Uang Buku Tambahan, Denda Keterlambatan"
                  required
                  className="w-full p-2.5 bg-[#FDFCFB] border border-slate-250 rounded-sm focus:ring-1 focus:ring-[#064E3B] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">Nominal Tagihan (Rupiah):</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 font-bold text-xs">Rp</span>
                  <input 
                    type="number" 
                    value={customFeeNominal} 
                    onChange={(e) => {
                      setCustomFeeNominal(Number(e.target.value));
                      setCustomFeePresetIdx('custom');
                    }}
                    required
                    className="w-full pl-9 pr-4 py-2.5 bg-[#FDFCFB] border border-slate-250 rounded-sm focus:ring-1 focus:ring-[#064E3B] focus:outline-none font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCustomFeeModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px] rounded-sm transition border border-slate-205 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#064E3B] hover:bg-[#053d2f] text-white font-bold uppercase tracking-wider text-[10px] rounded-sm transition cursor-pointer"
                >
                  Tambah Tagihan
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal Pay Individual Non-SPP Fee */}
      {isPayFeeLainOpen && activeStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-xs text-left">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg border border-slate-300 shadow-2xl p-6 w-full max-w-sm"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-serif font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <CreditCard size={15} className="text-[#064E3B]" /> Pembayaran Tagihan Non-SPP
              </h3>
              <button onClick={() => setIsPayFeeLainOpen(false)} className="p-1 hover:bg-slate-100 rounded text-slate-400">
                <X size={15} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-[#FDFCFB] border border-slate-200 rounded-sm leading-relaxed">
                <p className="font-bold text-slate-700">{activeStudent.nama}</p>
                <div className="mt-2 text-[10.5px] space-y-1 text-slate-500">
                  <p>Jenis Tagihan: <strong className="text-slate-800">{selectedFeeLainName}</strong></p>
                  <p>Harus Dibayar: <strong className="text-amber-800 font-serif font-bold text-xs">{rupiah(selectedFeeLainNominal)}</strong></p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Metode Pembayaran:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Tunai', 'Transfer Bank', 'E-Wallet'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPayFeeLainMethod(m)}
                      className={`py-2 rounded-sm border text-[9px] font-bold uppercase tracking-wider text-center transition cursor-pointer ${
                        payFeeLainMethod === m 
                          ? 'bg-[#ECFDF5] border-[#064E3B] text-[#064E3B]' 
                          : 'bg-[#FDFCFB] border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {m === 'Transfer Bank' ? 'Transfer' : m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPayFeeLainOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px] rounded-sm transition border border-slate-205 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onPayBiayaLain(activeStudent.id, [selectedFeeLainId], payFeeLainMethod, 'Lunas kustom via kontrol data siswa');
                    alert(`Pembayaran untuk "${selectedFeeLainName}" sebesar Rp ${selectedFeeLainNominal.toLocaleString('id-ID')} telah sukses disimpan.`);
                    setIsPayFeeLainOpen(false);
                  }}
                  className="flex-1 py-2.5 bg-[#064E3B] hover:bg-[#053d2f] text-white font-bold uppercase tracking-wider text-[10px] rounded-sm transition cursor-pointer"
                >
                  Selesaikan Bayar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Add Student */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg border border-slate-300 shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-serif font-bold text-slate-900 text-md flex items-center gap-1.5">
                <UserPlus size={16} className="text-[#064E3B]" /> Formulir Tambah Murid Baru
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-100 rounded text-slate-400">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">NIS (Nomor Induk Siswa):</label>
                  <input 
                    type="text" 
                    value={newNis} 
                    onChange={(e) => setNewNis(e.target.value)}
                    required
                    className="w-full p-2.5 bg-[#FDFCFB] border border-slate-250 rounded-sm font-mono focus:ring-1 focus:ring-[#064E3B] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">Kelas:</label>
                  <select 
                    value={newKelas} 
                    onChange={(e) => setNewKelas(e.target.value)}
                    className="w-full p-2.5 bg-[#FDFCFB] border border-slate-250 rounded-sm focus:ring-1 focus:ring-[#064E3B] font-bold text-slate-700"
                  >
                    {LIST_KELAS.map(k => (
                      <option key={k} value={k}>Kelas {k}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">Nama Lengkap Murid:</label>
                <input 
                  id="input_new_nama"
                  type="text" 
                  value={newNama} 
                  onChange={(e) => setNewNama(e.target.value)}
                  placeholder="Contoh: Muhammad Ali Jamil"
                  required
                  className="w-full p-2.5 bg-[#FDFCFB] border border-slate-250 rounded-sm focus:ring-1 focus:ring-[#064E3B] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">Nama Wali Murid (Orang Tua):</label>
                  <input 
                    id="input_new_wali"
                    type="text" 
                    value={newNamaOrangTua} 
                    onChange={(e) => setNewNamaOrangTua(e.target.value)}
                    placeholder="Nama Ibu / Bapak / Wali"
                    required
                    className="w-full p-2.5 bg-[#FDFCFB] border border-slate-250 rounded-sm focus:ring-1 focus:ring-[#064E3B] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">No. WhatsApp Wali:</label>
                  <input 
                    id="input_new_wa"
                    type="text" 
                    value={newNoWhatsApp} 
                    onChange={(e) => setNewNoWhatsApp(e.target.value)}
                    placeholder="Contoh: 6281234..."
                    required
                    className="w-full p-2.5 bg-[#FDFCFB] border border-slate-250 rounded-sm focus:ring-1 focus:ring-[#064E3B] focus:outline-none font-mono"
                  />
                  <p className="text-[9px] text-slate-400 italic">Format internasional (Contoh: 628...)</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">Nominal SPP Default (Bulanan):</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 font-bold text-xs">Rp</span>
                    <input 
                      type="number" 
                      value={newNominalSPP} 
                      onChange={(e) => setNewNominalSPP(Number(e.target.value))}
                      required
                      className="w-full pl-9 pr-4 py-2.5 bg-[#FDFCFB] border border-slate-250 rounded-sm focus:ring-1 focus:ring-[#064E3B] focus:outline-none font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">Tgl Lahir (DD-MM-YYYY):</label>
                  <input 
                    type="text" 
                    value={newTanggalLahir} 
                    onChange={(e) => setNewTanggalLahir(e.target.value)}
                    placeholder="DD-MM-YYYY (Contoh: 12-05-2015)"
                    required
                    className="w-full p-2.5 bg-[#FDFCFB] border border-slate-250 rounded-sm focus:ring-1 focus:ring-[#064E3B] focus:outline-none font-mono font-bold text-slate-800"
                  />
                  <p className="text-[9px] text-slate-400 italic">Sandi Wali: 8 digit tanpa strip (12052015)</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">Alamat Tinggal Rumah:</label>
                <textarea 
                  value={newAlamat} 
                  onChange={(e) => setNewAlamat(e.target.value)}
                  placeholder="Tuliskan alamat lengkap..."
                  rows={2}
                  className="w-full p-2.5 bg-[#FDFCFB] border border-slate-250 rounded-sm focus:ring-1 focus:ring-[#064E3B] focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px] rounded-sm transition border border-slate-205"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn_submit_add_siswa"
                  className="flex-1 py-3 bg-[#064E3B] hover:bg-[#053d2f] text-white font-bold uppercase tracking-wider text-[10px] rounded-sm transition"
                >
                  Simpan Murid
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal Edit Student */}
      {isEditModalOpen && editingSiswa && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg border border-slate-300 shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-serif font-bold text-slate-900 text-md flex items-center gap-1.5">
                <Edit2 size={16} className="text-[#064E3B]" /> Edit Biodata Murid
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 hover:bg-slate-100 rounded text-slate-400">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">NIS:</label>
                  <input 
                    type="text" 
                    value={editingSiswa.nis} 
                    disabled
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-sm font-mono text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">Kelas:</label>
                  <select 
                    value={editingSiswa.kelas} 
                    onChange={(e) => setEditingSiswa({...editingSiswa, kelas: e.target.value})}
                    className="w-full p-2.5 bg-[#FDFCFB] border border-slate-250 rounded-sm focus:ring-1 focus:ring-[#064E3B] font-bold text-slate-700"
                  >
                    {LIST_KELAS.map(k => (
                      <option key={k} value={k}>Kelas {k}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">Nama Lengkap Murid:</label>
                <input 
                  type="text" 
                  value={editingSiswa.nama} 
                  onChange={(e) => setEditingSiswa({...editingSiswa, nama: e.target.value})}
                  required
                  className="w-full p-2.5 bg-[#FDFCFB] border border-slate-250 rounded-sm focus:ring-1 focus:ring-[#064E3B] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">Wali Murid:</label>
                  <input 
                    type="text" 
                    value={editingSiswa.namaOrangTua} 
                    onChange={(e) => setEditingSiswa({...editingSiswa, namaOrangTua: e.target.value})}
                    required
                    className="w-full p-2.5 bg-[#FDFCFB] border border-slate-250 rounded-sm focus:ring-1 focus:ring-[#064E3B] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">No. WhatsApp Wali:</label>
                  <input 
                    type="text" 
                    value={editingSiswa.noWhatsApp} 
                    onChange={(e) => setEditingSiswa({...editingSiswa, noWhatsApp: e.target.value})}
                    required
                    className="w-full p-2.5 bg-[#FDFCFB] border border-slate-250 rounded-sm focus:ring-1 focus:ring-[#064E3B] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">Nominal SPP Default:</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 font-bold text-xs">Rp</span>
                    <input 
                      type="number" 
                      value={editingSiswa.nominalSPP} 
                      onChange={(e) => setEditingSiswa({...editingSiswa, nominalSPP: Number(e.target.value)})}
                      required
                      className="w-full pl-9 pr-4 py-2.5 bg-[#FDFCFB] border border-slate-250 rounded-sm focus:ring-1 focus:ring-[#064E3B] focus:outline-none font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">Tgl Lahir (DD-MM-YYYY):</label>
                  <input 
                    type="text" 
                    value={editingSiswa.tanggalLahir || ''} 
                    onChange={(e) => setEditingSiswa({...editingSiswa, tanggalLahir: e.target.value})}
                    placeholder="DD-MM-YYYY (Contoh: 12-05-2015)"
                    required
                    className="w-full p-2.5 bg-[#FDFCFB] border border-slate-250 rounded-sm focus:ring-1 focus:ring-[#064E3B] focus:outline-none font-mono font-bold text-slate-800"
                  />
                  <p className="text-[9px] text-slate-400 italic">Sandi Wali: 8 digit tanpa strip (12052015)</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">Alamat Tinggal:</label>
                <textarea 
                  value={editingSiswa.alamat || ''} 
                  onChange={(e) => setEditingSiswa({...editingSiswa, alamat: e.target.value})}
                  rows={2}
                  className="w-full p-2.5 bg-[#FDFCFB] border border-slate-250 rounded-sm focus:ring-1 focus:ring-[#064E3B] focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px] rounded-sm transition border border-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn_submit_edit_siswa"
                  className="flex-1 py-3 bg-[#064E3B] hover:bg-[#053d2f] text-white font-bold uppercase tracking-wider text-[10px] rounded-sm transition"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal Edit Non-SPP Fee */}
      {isEditFeeModalOpen && activeStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-xs text-left text-[#1E293B]">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg border border-slate-300 shadow-2xl p-6 w-full max-w-sm font-sans"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-serif font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Edit2 size={16} className="text-[#064E3B]" /> Edit Rincian Tagihan Siswa
              </h3>
              <button onClick={() => setIsEditFeeModalOpen(false)} className="p-1 hover:bg-slate-100 rounded text-slate-400">
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleEditFeeLainSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">Siswa:</label>
                <input 
                  type="text" 
                  value={`${activeStudent.nama} (Kelas ${activeStudent.kelas})`} 
                  disabled
                  className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-sm text-slate-500 cursor-not-allowed font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">Nama Tagihan:</label>
                <input 
                  type="text" 
                  value={editingFeeName} 
                  onChange={(e) => setEditingFeeName(e.target.value)}
                  required
                  className="w-full p-2.5 bg-[#FDFCFB] border border-slate-250 rounded-sm focus:ring-1 focus:ring-[#064E3B] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">Nominal Tagihan (Rupiah):</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 font-bold text-xs">Rp</span>
                  <input 
                    type="number" 
                    value={editingFeeNominal} 
                    onChange={(e) => setEditingFeeNominal(Number(e.target.value))}
                    required
                    className="w-full pl-9 pr-4 py-2.5 bg-[#FDFCFB] border border-slate-250 rounded-sm focus:ring-1 focus:ring-[#064E3B] focus:outline-none font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditFeeModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px] rounded-sm transition border border-slate-205 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#064E3B] hover:bg-[#053d2f] text-white font-bold uppercase tracking-wider text-[10px] rounded-sm transition cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal Import Excel */}
      {isExcelImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-xs text-left text-[#1E293B]">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg border border-slate-300 shadow-2xl p-6 w-full max-w-2xl font-sans"
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4 font-sans">
              <h3 className="font-serif font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <FileSpreadsheet size={16} className="text-emerald-600" /> Impor Data Siswa Massal via Excel/CSV
              </h3>
              <button 
                onClick={() => {
                  setIsExcelImportModalOpen(false);
                  setExcelParsedStudents([]);
                  setExcelImportErrors([]);
                }} 
                className="p-1 hover:bg-slate-100 rounded text-slate-400 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Instruction & Download Templates */}
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-sm p-4 mb-4 space-y-3 font-sans">
              <p className="text-slate-700 leading-relaxed font-medium">
                Untuk mengimpor data siswa secara sekaligus, mohon gunakan berkas dengan kolom berikut: 
                <strong className="text-[#064E3B] block mt-1 font-mono text-[10px]">
                  NIS | Nama Siswa | Kelas | Nama Orang Tua | No WhatsApp | Alamat | Nominal SPP
                </strong>
              </p>
              <div className="flex flex-wrap gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold uppercase tracking-wider rounded-sm transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download size={11} /> Unduh Template Excel (.xlsx)
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTemplateCSV}
                  className="px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white font-bold uppercase tracking-wider rounded-sm transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download size={11} /> Unduh Template CSV (.csv)
                </button>
              </div>
            </div>

            {/* Drag & Drop File Zone (complying with Usability guidelines for file upload) */}
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleExcelDrop}
              onClick={() => excelInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
                isDragOver 
                  ? 'border-emerald-500 bg-emerald-50/35 scale-[1.01]' 
                  : 'border-slate-300 bg-[#FDFCFB]/70 hover:bg-slate-50 hover:border-slate-400'
              }`}
            >
              <input 
                type="file" 
                ref={excelInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleExcelFileLoad(file);
                }}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />
              <Upload size={24} className={isDragOver ? "text-emerald-600 animate-bounce" : "text-slate-400"} />
              <div>
                <p className="font-bold text-slate-700 uppercase tracking-wider text-[9px]">Tarik & Lepas File Excel/CSV Anda di Sini</p>
                <p className="text-slate-400 text-[10px] mt-0.5 font-medium">atau klik untuk menyeleksi dokumen dari perangkat Anda (.xlsx, .xls, .csv)</p>
              </div>
            </div>

            {/* Warnings or Log notifications if any */}
            {excelImportErrors.length > 0 && (
              <div className="mt-4 bg-amber-50/80 border border-amber-200 rounded-sm p-3 max-h-24 overflow-y-auto font-mono text-[9px] text-amber-800 space-y-1">
                <p className="font-sans font-bold uppercase tracking-wider text-[8px] text-amber-900 flex items-center gap-1 mb-1">
                  <AlertTriangle size={11} /> Catatan Pengalihan Data:
                </p>
                {excelImportErrors.map((err, idx) => (
                  <p key={idx}>• {err}</p>
                ))}
              </div>
            )}

            {/* Preview Parsed Student Rows */}
            {excelParsedStudents.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center font-sans">
                  <h4 className="font-bold text-[#064E3B] uppercase tracking-wider text-[9px]">Preview Data Siswa ({excelParsedStudents.length} Siswa):</h4>
                  <button 
                    onClick={() => {
                      setExcelParsedStudents([]);
                      setExcelImportErrors([]);
                    }} 
                    className="text-rose-600 hover:underline font-bold text-[9px] uppercase tracking-wider cursor-pointer"
                  >
                    Bersihkan Preview
                  </button>
                </div>
                <div className="border border-slate-200 rounded-sm overflow-hidden overflow-x-auto max-h-48 scrollbar-none">
                  <table className="w-full text-left border-collapse bg-slate-50 text-[10px] font-sans">
                    <thead className="bg-[#064E3B] text-white text-[9px] uppercase tracking-wider font-bold">
                      <tr>
                        <th className="py-2 px-3 border-b border-emerald-800">NIS</th>
                        <th className="py-2 px-3 border-b border-emerald-800">Nama Siswa</th>
                        <th className="py-2 px-3 border-b border-emerald-800 text-center">Kelas</th>
                        <th className="py-2 px-3 border-b border-emerald-800">Orang Tua/Wali</th>
                        <th className="py-2 px-3 border-b border-emerald-800 text-center">No WhatsApp</th>
                        <th className="py-2 px-3 border-b border-emerald-800 text-right">SPP Bulanan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium text-slate-700 bg-white">
                      {excelParsedStudents.map((stud, idx) => (
                        <tr key={idx} className="hover:bg-emerald-50/20 font-sans">
                          <td className="py-1.5 px-3 font-mono text-[9px] border-r border-slate-100">{stud.nis}</td>
                          <td className="py-1.5 px-3 font-bold text-slate-900 border-r border-slate-100">{stud.nama}</td>
                          <td className="py-1.5 px-2 text-center font-bold text-[#064E3B] border-r border-slate-100">{stud.kelas}</td>
                          <td className="py-1.5 px-3 border-r border-slate-100">{stud.namaOrangTua}</td>
                          <td className="py-1.5 px-3 font-mono text-[9px] text-center border-r border-slate-100">{stud.noWhatsApp}</td>
                          <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">{rupiah(stud.nominalSPP)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Footer buttons */}
            <div className="flex gap-2 pt-4 border-t border-slate-200 mt-5 font-sans">
              <button
                type="button"
                onClick={() => {
                  setIsExcelImportModalOpen(false);
                  setExcelParsedStudents([]);
                  setExcelImportErrors([]);
                }}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-750 font-bold uppercase tracking-wider text-[10px] rounded-sm transition border border-slate-200 cursor-pointer text-center"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExcelSubmitImport}
                disabled={excelParsedStudents.length === 0}
                className={`flex-1 py-3 font-bold uppercase tracking-wider text-[10px] rounded-sm transition cursor-pointer text-center ${
                  excelParsedStudents.length > 0 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
              >
                {excelParsedStudents.length > 0 ? `Konfirmasi Impor ${excelParsedStudents.length} Siswa` : 'Konfirmasi Impor'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
