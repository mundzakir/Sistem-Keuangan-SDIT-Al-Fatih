import React, { useState } from 'react';
// @ts-ignore
import LogoAlFatih from '../assets/images/logo_al_fatih_1781782889083.jpg';
import { 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { motion } from 'motion/react';

interface LoginFormProps {
  onLoginAttempt: (username: string, password: string) => { success: boolean; error?: string };
}

export default function LoginForm({ onLoginAttempt }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loginTab, setLoginTab] = useState<'parent' | 'staff'>('parent');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Short simulated delay for smooth transition response
    setTimeout(() => {
      const res = onLoginAttempt(username, password);
      if (res.success) {
        // Success handled parent-side
      } else {
        if (loginTab === 'parent') {
          setError(res.error || 'Identitas NIS atau Sandi wali ( tanggal lahir 8 digit ) tidak cocok. Periksa kembali tanggal lahir putra/putri Anda.');
        } else {
          setError(res.error || 'Username atau kata sandi petugas salah.');
        }
        setIsLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-4 relative overflow-hidden font-sans antialiased text-[#1E293B]">
      
      {/* Dynamic Background Gradients / Islamic geometry feeling */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none select-none opacity-20 z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#064E3B] filter blur-3xl opacity-15"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#B45309] filter blur-3xl opacity-15"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-sm bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-2xl relative z-10"
      >
        {/* Decorative Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#064E3B] via-[#0D9488] to-[#B45309] rounded-t-lg"></div>

        {/* Institution Brand */}
        <div className="text-center space-y-3 mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 shadow-lg select-none mx-auto rounded-full overflow-hidden border border-[#B45309]">
            <img 
              src={LogoAlFatih} 
              alt="SDIT Al Fatih Baturaja Logo" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="space-y-1">
            <span className="inline-block px-3 py-0.5 text-[8px] bg-[#B45309] font-bold text-white uppercase tracking-[0.25em] leading-none rounded-sm">
              SISTEM PORTAL KEUANGAN
            </span>
            <h1 className="font-serif font-black text-slate-900 text-lg sm:text-xl tracking-tight mt-1.5">
              SDIT Al Fatih Baturaja
            </h1>
            <p className="text-[9px] uppercase tracking-widest text-[#064E3B] font-bold">
              YAYASAN KHALIFAH GENERASI CEMERLANG
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-1.5 text-[9px] text-[#064E3B] bg-[#ECFDF5] border border-emerald-100 py-1 px-3 rounded-full w-fit mx-auto select-none font-bold">
            <Sparkles size={11} className="text-[#B45309] animate-pulse" />
            <span>Rabbani • Cendekia • Akhlak Mulia</span>
          </div>
        </div>

        {/* TAB SWITCHER */}
        <div className="flex bg-slate-100 rounded-sm p-1 gap-1 mb-5 border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setLoginTab('parent');
              setError(null);
              setUsername('');
              setPassword('');
            }}
            className={`flex-1 py-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition rounded-sm cursor-pointer ${
              loginTab === 'parent' 
                ? 'bg-[#064E3B] text-white shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            👨‍👩‍👦 Wali Murid
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginTab('staff');
              setError(null);
              setUsername('');
              setPassword('');
            }}
            className={`flex-1 py-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition rounded-sm cursor-pointer ${
              loginTab === 'staff' 
                ? 'bg-[#064E3B] text-white shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            💼 Staff / Petugas
          </button>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 bg-red-50 border border-red-200 rounded-sm text-[11px] text-red-950 flex gap-2 items-start leading-relaxed"
            >
              <ShieldAlert size={15} className="text-red-700 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          <div className="space-y-1">
            <label className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block">
              {loginTab === 'parent' ? 'Nomor Induk Siswa (Username / NIS)' : 'Nama Pengguna (Username)'}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                <UserIcon size={13} />
              </span>
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={loginTab === 'parent' ? 'Masukkan NIS Murid (Contoh: 20261001)' : 'Masukkan username petugas...'}
                required
                disabled={isLoading}
                autoFocus
                className="w-full pl-9 pr-4 py-2.5 bg-[#FDFCFB] border border-slate-250 rounded-sm text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#064E3B] transition placeholder:text-slate-400 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block">
              {loginTab === 'parent' ? 'Sandi Tanggal Lahir Murid (Password)' : 'Kata Sandi (Password)'}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                <Lock size={13} />
              </span>
              <input 
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={loginTab === 'parent' ? 'Format 8 digit: DDMMYYYY' : 'Masukkan password petugas...'}
                required
                disabled={isLoading}
                className="w-full pl-9 pr-10 py-2.5 bg-[#FDFCFB] border border-slate-250 rounded-sm text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#064E3B] transition placeholder:text-slate-400 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-[#064E3B] transition focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>

          {loginTab === 'parent' && (
            <div className="p-3 bg-teal-50 border border-teal-150 rounded-sm text-[10px] text-teal-950 leading-relaxed space-y-1">
              <p className="font-bold text-[#064E3B]">🔑 Panduan Masuk Wali Murid:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-650">
                <li>Username: <span className="font-bold font-mono text-[#064E3B]">NIS Murid 8-Digit</span> (Contoh: <code className="bg-emerald-50 px-0.5 font-bold">20261001</code>)</li>
                <li>Password: <span className="font-bold font-mono text-[#064E3B]">Tanggal Lahir 8-Digit</span> (Contoh jika lahir <span className="font-bold font-mono">12 Mei 2015</span> ketik: <code className="bg-emerald-50 px-1 font-bold">12052015</code>)</li>
              </ul>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-[#064E3B] hover:bg-[#053d2f] text-white text-[9px] font-bold uppercase tracking-widest rounded-sm transition flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer border border-[#064E3B]"
          >
            {isLoading ? (
              <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : null}
            <span>{isLoading ? 'MEMVALIDASI...' : (loginTab === 'parent' ? 'MASUK PORTAL WALi' : 'MASUK OTORISASI STAFF')}</span>
          </button>
        </form>

        {/* Document security seal note */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[9px] text-slate-400 leading-relaxed font-sans select-none">
          <p>SDIT Al Fatih Baturaja menerapkan perlindungan berlapis syariah.</p>
        </div>
      </motion.div>
    </div>
  );
}
