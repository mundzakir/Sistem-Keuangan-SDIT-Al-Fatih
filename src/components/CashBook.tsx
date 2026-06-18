/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TransaksiKas, TipeTransaksi } from '../types';
import { KATEGORI_PEMASUKAN, KATEGORI_PENGELUARAN } from '../data';
import { 
  PlusCircle, 
  MinusCircle, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Trash2, 
  FileText,
  Calendar,
  Layers,
  ArrowRight,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CashBookProps {
  transaksi: TransaksiKas[];
  onAddTransaksi: (newTransaksi: Omit<TransaksiKas, 'id'>) => void;
  onDeleteTransaksi: (id: string) => void;
}

export default function CashBook({ transaksi, onAddTransaksi, onDeleteTransaksi }: CashBookProps) {
  // Local transaction creation states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<TipeTransaksi>('pemasukan');
  
  // Transaction input states
  const [inputTanggal, setInputTanggal] = useState(new Date().toISOString().substring(0, 10));
  const [inputNominal, setInputNominal] = useState('');
  const [inputKategori, setInputKategori] = useState('');
  const [inputKeterangan, setInputKeterangan] = useState('');
  const [inputMetode, setInputMetode] = useState<'Tunai' | 'Transfer Bank' | 'E-Wallet'>('Tunai');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'Semua' | 'Pemasukan' | 'Pengeluaran'>('Semua');
  const [categoryFilter, setCategoryFilter] = useState('Semua');

  const handleOpenModal = (type: TipeTransaksi) => {
    setModalType(type);
    setInputTanggal(new Date().toISOString().substring(0, 10));
    setInputNominal('');
    // Auto-select first default category of that type
    setInputKategori(type === 'pemasukan' ? KATEGORI_PEMASUKAN[0] : KATEGORI_PENGELUARAN[0]);
    setInputKeterangan('');
    setInputMetode('Tunai');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputNominal || Number(inputNominal) <= 0 || !inputKeterangan) {
      alert('Mohon lengkapi nominal dan keterangan transaksi.');
      return;
    }

    onAddTransaksi({
      tanggal: inputTanggal,
      tipe: modalType,
      kategori: inputKategori,
      nominal: Number(inputNominal),
      keterangan: inputKeterangan,
      metodePembayaran: inputMetode,
    });

    setIsModalOpen(false);
  };

  // Compile categories for select filters
  const allCategories = Array.from(new Set(transaksi.map(t => t.kategori)));

  // Filter transactions
  const filteredTransactions = transaksi.filter(t => {
    const matchesSearch = t.keterangan.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.siswaNama && t.siswaNama.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          t.id.includes(searchQuery);

    const matchesType = typeFilter === 'Semua' || 
                        (typeFilter === 'Pemasukan' && t.tipe === 'pemasukan') ||
                        (typeFilter === 'Pengeluaran' && t.tipe === 'pengeluaran');

    const matchesCategory = categoryFilter === 'Semua' || t.kategori === categoryFilter;

    return matchesSearch && matchesType && matchesCategory;
  }).sort((a,b) => b.tanggal.localeCompare(a.tanggal)); // Newest first

  // Balance Math
  const incomeTotal = filteredTransactions
    .filter(t => t.tipe === 'pemasukan')
    .reduce((acc, curr) => acc + curr.nominal, 0);

  const expenseTotal = filteredTransactions
    .filter(t => t.tipe === 'pengeluaran')
    .reduce((acc, curr) => acc + curr.nominal, 0);

  const netFiltered = incomeTotal - expenseTotal;

  const rupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Top Header widgets */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-serif font-bold text-slate-950">Buku Kas & Jurnal Keuangan Umum</h2>
          <p className="text-[11px] text-slate-400 font-sans">Mencatat, memvalidasi, dan mengorganisir seluruh debet kredit kas sekolah secara real-time</p>
        </div>
        
        {/* Rapid Actions */}
        <div className="flex gap-2.5 font-sans">
          <button 
            id="btn_add_pemasukan"
            onClick={() => handleOpenModal('pemasukan')}
            className="px-4 py-2 bg-[#064E3B] hover:bg-[#053d2f] text-white text-[10px] font-bold uppercase tracking-wider rounded-sm flex items-center justify-center gap-1 transition shadow-none cursor-pointer"
          >
            <PlusCircle size={13} /> Pemasukan Baru
          </button>
          
          <button 
            id="btn_add_pengeluaran"
            onClick={() => handleOpenModal('pengeluaran')}
            className="px-4 py-2 bg-[#B45309] hover:bg-[#994707] text-white text-[10px] font-bold uppercase tracking-wider rounded-sm flex items-center justify-center gap-1 transition shadow-none cursor-pointer"
          >
            <MinusCircle size={13} /> Pengeluaran Baru
          </button>
        </div>
      </div>

      {/* Grid filtered values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-white p-4 rounded-lg border border-slate-200">
        <div className="p-4 bg-white rounded-sm border border-slate-200 leading-relaxed">
          <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-widest block mb-1">Debet / Pemasukan (Filtered)</span>
          <h2 className="text-lg font-serif font-bold text-[#064E3B]">{rupiah(incomeTotal)}</h2>
        </div>
        <div className="p-4 bg-white rounded-sm border border-slate-200 leading-relaxed">
          <span className="text-[9px] font-bold text-amber-800 uppercase tracking-widest block mb-1">Kredit / Pengeluaran (Filtered)</span>
          <h2 className="text-lg font-serif font-bold text-[#B45309]">{rupiah(expenseTotal)}</h2>
        </div>
        <div className="p-4 bg-[#FDFCFB] rounded-sm border border-slate-200 leading-relaxed">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Selisih Saldo Kas (Filtered)</span>
          <h2 className={`text-lg font-serif font-bold ${netFiltered >= 0 ? 'text-[#064E3B]' : 'text-rose-700'}`}>
            {netFiltered >= 0 ? '+' : ''}{rupiah(netFiltered)}
          </h2>
        </div>
      </div>

      {/* Structured filtration toolbar */}
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 items-center mb-4">
          <div className="relative md:col-span-2">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={14} />
            </span>
            <input 
              id="input_search_ledger"
              type="text"
              placeholder="Cari kata kunci deskripsi transaksi atau nama siswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-[#FDFCFB] border border-slate-250 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
            />
          </div>

          <div>
            <select
              id="select_type_filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-[#FDFCFB] border border-slate-250 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#064E3B] font-bold text-slate-600 font-sans"
            >
              <option value="Semua">Semua Arus Kas</option>
              <option value="Pemasukan">Khusus Pemasukan</option>
              <option value="Pengeluaran">Khusus Pengeluaran</option>
            </select>
          </div>

          <div>
            <select
              id="select_category_filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FDFCFB] border border-slate-250 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#064E3B] font-bold text-slate-600 font-sans"
            >
              <option value="Semua">Semua Kategori</option>
              {allCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-205 text-slate-400 font-bold bg-[#FDFCFB] uppercase tracking-wider text-[9px] rounded-none">
                <th className="py-3 px-3">Kode Ref</th>
                <th className="py-3 px-3">Tanggal</th>
                <th className="py-3 px-3">Keterangan / Rincian</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-3">Metode</th>
                <th className="py-3 px-3 text-right">Nominal</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 select-none">
                    <FileText size={24} className="mx-auto mb-2 opacity-50" />
                    Belum ada rekaman entri kas pencatatan yang cocok.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-[#FDFCFB]/50 transition">
                    <td className="py-3.5 px-3 font-mono text-[9px] text-slate-400">#{t.id.substring(0, 8)}</td>
                    <td className="py-3.5 px-3 font-mono text-slate-500 text-[10px]">{t.tanggal}</td>
                    <td className="py-3.5 px-3 max-w-[320px]">
                      <div className="font-bold text-[#1E293B] line-clamp-2">{t.keterangan}</div>
                      {t.siswaNama && (
                        <div className="text-[9px] text-[#064E3B] bg-[#ECFDF5] border border-emerald-100/50 px-2 py-0.5 rounded-sm inline-block mt-1 font-bold uppercase tracking-wider">
                          SPP Murid: {t.siswaNama} ({t.bulanSPP})
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-3 font-sans">
                      <span className={`inline-block px-2.5 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider border ${
                        t.tipe === 'pemasukan' 
                          ? 'bg-[#ECFDF5] text-[#064E3B] border-emerald-100' 
                          : 'bg-amber-50 text-amber-800 border-amber-150'
                      }`}>
                        {t.kategori}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-500 font-sans text-[11px]">{t.metodePembayaran || '-'}</td>
                    <td className={`py-3.5 px-3 text-right font-serif font-bold text-xs ${
                      t.tipe === 'pemasukan' ? 'text-[#064E3B]' : 'text-[#B45309]'
                    }`}>
                      {t.tipe === 'pemasukan' ? '+' : '-'}{rupiah(t.nominal)}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <button 
                        onClick={() => {
                          if (confirm(`Apakah Anda yakin ingin menghapus transaksi "${t.keterangan}"?`)) {
                            onDeleteTransaksi(t.id);
                          }
                        }}
                        title="Hapus Transaksi"
                        className="p-1.5 text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-50 transition rounded-sm border border-rose-100 cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Addition Floating Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg border border-slate-350 shadow-2xl p-6 w-full max-w-md"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-205 mb-4">
              <h3 className="font-serif font-bold text-slate-900 text-sm flex items-center gap-1.5">
                {modalType === 'pemasukan' ? (
                  <TrendingUp size={16} className="text-[#064E3B]" />
                ) : (
                  <TrendingDown size={16} className="text-[#B45309]" />
                )}
                Tambah {modalType === 'pemasukan' ? 'Setoran Pemasukan' : 'Pengeluaran Sekolah'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-sm text-slate-400 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-widest text-[9px] block">Tanggal:</label>
                  <input 
                    type="date" 
                    value={inputTanggal} 
                    onChange={(e) => setInputTanggal(e.target.value)}
                    required
                    className="w-full p-2.5 bg-[#FDFCFB] border border-slate-250 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#064E3B] font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-widest text-[9px] block">Kategori:</label>
                  <select 
                    value={inputKategori} 
                    onChange={(e) => setInputKategori(e.target.value)}
                    className="w-full p-2.5 bg-[#FDFCFB] border border-slate-250 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#064E3B] font-bold"
                  >
                    {modalType === 'pemasukan' 
                      ? KATEGORI_PEMASUKAN.map(c => <option key={c} value={c}>{c}</option>)
                      : KATEGORI_PENGELUARAN.map(c => <option key={c} value={c}>{c}</option>)
                    }
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-widest text-[9px] block">Nominal Kas (Rupiah):</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 font-bold font-mono">Rp</span>
                  <input 
                    id="input_cash_nominal"
                    type="number" 
                    value={inputNominal} 
                    onChange={(e) => setInputNominal(e.target.value)}
                    placeholder="Masukkan jumlah..."
                    required
                    className="w-full pl-9 pr-4 py-2.5 bg-[#FDFCFB] border border-slate-250 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#064E3B] font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-widest text-[9px] block">Keterangan Transaksi:</label>
                <textarea 
                  id="input_cash_desc"
                  value={inputKeterangan} 
                  onChange={(e) => setInputKeterangan(e.target.value)}
                  placeholder="Contoh: Pembelian tinta siber printer TU loket"
                  required
                  rows={2}
                  className="w-full p-2.5 bg-[#FDFCFB] border border-slate-250 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-widest text-[9px] block">Metode Pembayaran:</label>
                <select 
                  value={inputMetode} 
                  onChange={(e) => setInputMetode(e.target.value as any)}
                  className="w-full p-2.5 bg-[#FDFCFB] border border-slate-250 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#064E3B] font-bold"
                >
                  <option value="Tunai">Tunai</option>
                  <option value="Transfer Bank">Transfer Bank</option>
                  <option value="E-Wallet">E-Wallet</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-205">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold uppercase tracking-wider rounded-sm text-[10px] transition border border-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn_submit_add_cash_entry"
                  className={`flex-1 py-2.5 text-white font-bold uppercase tracking-wider rounded-sm text-[10px] transition cursor-pointer ${
                    modalType === 'pemasukan' ? 'bg-[#064E3B] hover:bg-[#053d2f]' : 'bg-[#B45309] hover:bg-[#994707]'
                  }`}
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
