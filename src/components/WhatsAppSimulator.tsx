/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { WhatsAppLog, WhatsAppConfig } from '../types';
import { 
  Settings2, 
  MessageSquare, 
  Send, 
  CheckCheck, 
  Wifi, 
  WifiOff, 
  QrCode, 
  RefreshCcw, 
  AlertTriangle,
  Sparkles,
  Smartphone,
  Check,
  Search,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WhatsAppSimulatorProps {
  logs: WhatsAppLog[];
  config: WhatsAppConfig;
  onUpdateConfig: (newConfig: WhatsAppConfig) => void;
  onClearLogs: () => void;
  onResendMessage: (logId: string) => void;
}

export default function WhatsAppSimulator({
  logs,
  config,
  onUpdateConfig,
  onClearLogs,
  onResendMessage
}: WhatsAppSimulatorProps) {
  // Config inputs
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [senderNumber, setSenderNumber] = useState(config.senderNumber);
  const [selectedGateway, setSelectedGateway] = useState(config.gateway);

  // States
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Ref for phone chat auto-scroll
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig({
      apiKey,
      senderNumber,
      gateway: selectedGateway,
      isConnected: selectedGateway === 'Simulasi' ? true : config.isConnected,
    });
    alert('Konfigurasi WhatsApp Gateway berhasil diperbarui!');
  };

  const handleTestConnection = () => {
    setIsTestLoading(true);
    setTestStatus(null);
    setTimeout(() => {
      setIsTestLoading(false);
      if (selectedGateway === 'Simulasi') {
        setTestStatus('SUCCESS');
        onUpdateConfig({ ...config, isConnected: true, gateway: 'Simulasi' });
      } else {
        // Mock actual API test
        if (apiKey.trim() === '') {
          setTestStatus('FAILED_API_KEY');
        } else {
          setTestStatus('GENERATE_QR');
          setIsQrModalOpen(true);
        }
      }
    }, 1500);
  };

  // Mock scan QR code success
  const handleScanSuccess = () => {
    setIsQrModalOpen(false);
    onUpdateConfig({
      ...config,
      isConnected: true,
      gateway: selectedGateway,
      apiKey,
      senderNumber,
    });
    setTestStatus('SUCCESS');
    alert('Sinkronisasi QR Code Berhasil! Gateway WhatsApp siap digunakan secara otomatis.');
  };

  const filteredLogs = logs.filter(l => {
    return l.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           l.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           l.recipientPhone.includes(searchQuery) ||
           l.message.toLowerCase().includes(searchQuery.toLowerCase());
  }).sort((a,b) => b.timestamp.localeCompare(a.timestamp));

  // Phone simulation display list: show last 3 messages for aesthetic preview
  const phoneMessages = [...logs]
    .sort((a,b) => a.timestamp.localeCompare(b.timestamp))
    .slice(-3);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Configuration column (Left) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 lg:col-span-8 space-y-6">
        
        {/* Connection Widget */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className={`p-2.5 rounded-full ${config.isConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {config.isConnected ? <Wifi size={20} /> : <WifiOff size={20} />}
            </div>
            <div>
              <h2 className="text-md font-bold text-slate-100 italic inline-flex items-center gap-1.5">
                WhatsApp API Gateway <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full font-mono">{config.gateway}</span>
              </h2>
              <p className="text-xs text-slate-500">Status Gateway: {config.isConnected ? 'Terhubung (Online)' : 'Terputus (Offline)'}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleTestConnection}
              disabled={isTestLoading}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {isTestLoading ? (
                <>
                  <RefreshCcw size={14} className="animate-spin" /> Menguji...
                </>
              ) : (
                <>
                  <RefreshCcw size={14} /> Sinkron Gateway
                </>
              )}
            </button>
            <button
              onClick={onClearLogs}
              className="px-3 py-2 text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-50 hover:border-transparent border border-rose-100 text-xs font-semibold rounded-xl transition"
            >
              Sapu Log
            </button>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSaveConfig} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-600">Pilih Provider WhatsApp (Sesuai Izin Sekolah):</label>
            <select
              value={selectedGateway}
              onChange={(e) => setSelectedGateway(e.target.value as any)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="Simulasi">Simulasi Web (Langsung Aktif)</option>
              <option value="Fonnte">Fonnte Gateway (fonnte.com)</option>
              <option value="Wablas">Wablas Cloud (wablas.com)</option>
              <option value="Starsender">Starsender API (starsender.co)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-600">Nomor Pengirim (Sender Number):</label>
            <input
              type="text"
              value={senderNumber}
              onChange={(e) => setSenderNumber(e.target.value)}
              placeholder="Contoh: 628123456789"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="font-bold text-slate-600">Token Keamanan / API Key Provider:</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Masukkan API Key / Secret Token WhatsApp Gateway Anda..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono bg-white"
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              id="btn_save_wa_config"
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl text-xs transition shadow"
            >
              Simpan Konfigurasi
            </button>
          </div>
        </form>

        {/* Live log list */}
        <div className="space-y-3.5 pt-4 border-t border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Outbound Message Delivery History (Log Pengiriman)</h3>
            <p className="text-xs text-slate-500">Log sinkronisasi notifikasi tagihan SPP dan kuitansi kepada nomor orang tua murid</p>
          </div>

          {/* Search box */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={14} />
            </span>
            <input 
              type="text"
              placeholder="Cari logs berdasarkan nama siswa, penerima, atau pesan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>

          {/* Table list */}
          <div className="max-h-[300px] overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100">
            {filteredLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs select-none">
                <MessageSquare size={24} className="mx-auto mb-2 opacity-50" />
                Belum ada rekaman log pesan WhatsApp yang terkirim.
              </div>
            ) : (
              filteredLogs.map(l => (
                <div key={l.id} className="p-3.5 hover:bg-slate-50/55 transition flex items-start justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5 leading-none">
                      <span className="font-bold text-slate-800">{l.parentName}</span>
                      <span className="text-[10px] text-slate-400">({l.studentName} - Kelas {l.type})</span>
                      <span className="text-[9px] font-semibold text-slate-400 font-mono">{l.timestamp}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 whitespace-pre-line leading-relaxed font-sans max-w-xl bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {l.message}
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-2">
                    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                      l.status === 'Terkirim' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : l.status === 'Mengirim'
                          ? 'bg-amber-50 text-amber-700 border-amber-100'
                          : 'bg-rose-50 text-rose-700 border-rose-100'
                    }`}>
                      {l.status === 'Terkirim' ? <CheckCheck size={10} /> : <AlertTriangle size={10} />}
                      {l.status}
                    </span>
                    
                    <button
                      onClick={() => onResendMessage(l.id)}
                      className="block text-[10px] font-semibold text-emerald-700 hover:text-emerald-800 ml-auto flex items-center gap-0.5 hover:scale-105 transition"
                    >
                      <RefreshCcw size={10} /> Kirim Ulang
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Side phone simulator viewport (Right) */}
      <div className="lg:col-span-4 sticky top-4">
        <div className="bg-slate-900 rounded-[2.5rem] border-[8px] border-slate-800 p-2.5 shadow-2xl relative w-full overflow-hidden flex flex-col justify-between max-w-[320px] mx-auto min-h-[500px]">
          
          {/* Top Notch Speaker */}
          <div className="absolute top-0 inset-x-0 h-5 flex justify-center z-40 select-none pointer-events-none">
            <div className="bg-slate-800 w-32 h-4 rounded-b-xl flex items-center justify-between px-3">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-900"></span>
              <span className="w-10 h-1 bg-slate-900 rounded-full"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500/80 animate-pulse"></span>
            </div>
          </div>

          {/* Status bar */}
          <div className="flex justify-between px-5 text-[10px] text-white font-semibold pt-1 pb-1 z-30 select-none bg-slate-950/80 border-b border-white/5">
            <span>09:41</span>
            <div className="flex items-center gap-1">
              <Wifi size={10} />
              <span>4G</span>
              <span className="w-4 h-2 bg-white rounded-xs"></span>
            </div>
          </div>

          {/* WhatsApp Inner simulated App */}
          <div className="flex-1 bg-slate-900 flex flex-col justify-between relative overflow-hidden text-[11px]">
            {/* WhatsApp App Head */}
            <div className="bg-[#075e54] text-white p-2.5 flex items-center gap-2 select-none">
              <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-[#075e54] font-bold text-xs shrink-0 select-none font-bold">SD</div>
              <div>
                <p className="font-bold text-slate-100 flex items-center gap-1">
                  SDIT Al Fatih (Wali) <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                </p>
                <p className="text-[8px] text-emerald-200">Online • Gateway terintegrasi</p>
              </div>
            </div>

            {/* Chat background wallpaper (Simulated WhatsApp style with bubbles) */}
            <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[380px] bg-[#ece5dd] bg-opacity-95 custom-scrollbar flex flex-col justify-end">
              
              <div className="text-center select-none mb-1">
                <span className="inline-block bg-white/70 text-slate-500 text-[8px] px-2 py-0.5 rounded-md font-semibold italic text-center">
                  Hari Ini
                </span>
              </div>

              {phoneMessages.length === 0 ? (
                <div className="text-center py-10 opacity-40 text-[10px] text-slate-500 select-none">
                  (Simulasi Smartphone)<br/>Lakukan bayar SPP untuk mengirim notifikasi chat push di sini secara instant.
                </div>
              ) : (
                phoneMessages.map(m => (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 15 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    key={m.id}
                    className="bg-white text-slate-800 rounded-lg p-2 max-w-[90%] shadow-sm self-end leading-relaxed border-l-4 border-emerald-500"
                  >
                    <p className="font-bold text-slate-500 text-[8px] mb-0.5 flex justify-between">
                      {m.parentName} <span className="text-[7px] text-slate-400 font-mono">+{m.recipientPhone.substring(0,8)}...</span>
                    </p>
                    <div className="text-[9.5px] whitespace-pre-wrap select-text font-sans font-normal border-b pb-1 mb-1">
                      {m.message}
                    </div>
                    <div className="flex justify-between items-center text-[7px] text-slate-400 leading-none">
                      <span>SDIT Al Fatih Gate</span>
                      <span className="flex items-center gap-0.5 text-emerald-600 font-semibold font-mono">
                        Terkirim <CheckCheck size={8} />
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Simulated Keyboard / Input rail */}
            <div className="p-2 bg-[#f4f4f4] border-t border-slate-200 flex items-center gap-2 select-none">
              <input 
                type="text" 
                placeholder="Tulis pesan uji ke wali..." 
                disabled
                className="flex-1 bg-white border border-slate-200 p-1.5 px-3 rounded-full text-[10px] outline-none cursor-not-allowed text-slate-400"
              />
              <button 
                type="button" 
                disabled 
                className="p-1 px-1.5 bg-[#075e54] text-white rounded-full cursor-not-allowed opacity-50"
              >
                <Send size={10} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Synchronization Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 w-full max-w-sm text-center"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4 text-left">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <QrCode size={18} className="text-emerald-700" /> Deteksi Sensor WhatsApp QR
              </h3>
              <button 
                onClick={() => setIsQrModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded text-slate-400"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Buka WhatsApp di ponsel sekolah Anda, masuk ke **Perangkat Tertaut** / **Linked Devices**, lalu pindai kode QR di bawah ini untuk mengautentikasi sistem:
              </p>

              {/* Mock QR Code Pattern inside cool canvas */}
              <div className="mx-auto w-48 h-48 border border-slate-200 bg-white p-3 rounded-2xl shadow flex items-center justify-center relative group">
                <img 
                  src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ALFATIH-SPP-SINKRON-KEY-2026-DISDIK" 
                  alt="Sync QR Code"
                  referrerPolicy="no-referrer"
                  className="rounded"
                />
                <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition rounded-2xl flex items-center justify-center">
                  <span className="text-[9px] bg-slate-900 text-white font-bold p-1 px-2 rounded">Scan QR</span>
                </div>
              </div>

              <div className="p-2.5 bg-amber-50 rounded-xl text-amber-700 text-[10px] leading-relaxed flex gap-1.5 text-left">
                <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                <span>Simulasi API: Klik tombol di bawah jika Anda berasumsi ponsel Anda sudah memindai kamera di dashboard.</span>
              </div>

              <button
                type="button"
                onClick={handleScanSuccess}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition flex items-center justify-center gap-1 text-[11px]"
              >
                <Check size={14} /> Berhasil Pindai (Konfirmasi)
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
