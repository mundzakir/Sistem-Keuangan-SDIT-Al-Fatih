import React, { useState } from 'react';
import { UserAccount, MidtransConfig } from '../types';
import { 
  UserPlus, 
  Key, 
  Trash2, 
  ShieldCheck, 
  ShieldAlert, 
  User as UserIcon, 
  Lock, 
  UserCheck, 
  Plus, 
  CheckCircle,
  Eye,
  EyeOff,
  Clock,
  UserX,
  CreditCard,
  Settings2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserManagementProps {
  users: UserAccount[];
  currentUser: UserAccount | null;
  onAddUser: (user: Omit<UserAccount, 'id' | 'createdAt'>) => { success: boolean; error?: string };
  onUpdatePassword: (userId: string, newPass: string) => boolean;
  onDeleteUser: (userId: string) => boolean;
  midtransConfig?: MidtransConfig;
  onUpdateMidtransConfig?: (newConfig: MidtransConfig) => void;
}

export default function UserManagement({
  users,
  currentUser,
  onAddUser,
  onUpdatePassword,
  onDeleteUser,
  midtransConfig,
  onUpdateMidtransConfig
}: UserManagementProps) {
  // Add User states
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newNamaLengkap, setNewNamaLengkap] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'petugas' | 'bendahara_tabungan'>('petugas');
  const [showAddForm, setShowAddForm] = useState(false);
  const [errorAdd, setErrorAdd] = useState<string | null>(null);
  const [successAdd, setSuccessAdd] = useState<string | null>(null);

  // Change Password states
  const [selectedUserIdForPass, setSelectedUserIdForPass] = useState<string | null>(null);
  const [changePasswordVal, setChangePasswordVal] = useState('');
  const [showPassField, setShowPassField] = useState(false);
  const [errorChangePass, setErrorChangePass] = useState<string | null>(null);
  const [successChangePass, setSuccessChangePass] = useState<string | null>(null);

  // Midtrans Key states & update trigger
  const [midtransServerKey, setMidtransServerKey] = useState(midtransConfig?.serverKey || '');
  const [midtransClientKey, setMidtransClientKey] = useState(midtransConfig?.clientKey || '');
  const [showKeys, setShowKeys] = useState(false);

  React.useEffect(() => {
    if (midtransConfig) {
      setMidtransServerKey(midtransConfig.serverKey);
      setMidtransClientKey(midtransConfig.clientKey);
    }
  }, [midtransConfig]);

  const handleSaveMidtransKeys = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateMidtransConfig) {
      onUpdateMidtransConfig({
        serverKey: midtransServerKey.trim(),
        clientKey: midtransClientKey.trim()
      });
      alert('🔒 Konfigurasi API Midtrans berhasil diperbarui di sistem! Sesi pembayaran online kini terintegrasi secara dinamis dengan kredensial kunci Anda.');
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorAdd(null);
    setSuccessAdd(null);

    if (!newUsername.trim() || !newPassword.trim() || !newNamaLengkap.trim()) {
      setErrorAdd('Seluruh kolom formulir wajib diisi.');
      return;
    }

    const { success, error } = onAddUser({
      username: newUsername.toLowerCase().trim(),
      password: newPassword,
      namaLengkap: newNamaLengkap.trim(),
      role: newRole
    });

    if (success) {
      setSuccessAdd(`Akses baru untuk "${newNamaLengkap}" berhasil ditambahkan ke database!`);
      // reset form
      setNewUsername('');
      setNewPassword('');
      setNewNamaLengkap('');
      setNewRole('petugas');
      setTimeout(() => setSuccessAdd(null), 3000);
    } else {
      setErrorAdd(error || 'Gagal menambahkan user baru.');
    }
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorChangePass(null);
    setSuccessChangePass(null);

    if (!selectedUserIdForPass) return;
    if (changePasswordVal.length < 4) {
      setErrorChangePass('Kata sandi baru minimal harus terdiri dari 4 karakter.');
      return;
    }

    const success = onUpdatePassword(selectedUserIdForPass, changePasswordVal);
    if (success) {
      setSuccessChangePass('Kata sandi berhasil dienkripsi dan diperbarui!');
      setChangePasswordVal('');
      setTimeout(() => {
        setSuccessChangePass(null);
        setSelectedUserIdForPass(null);
      }, 2000);
    } else {
      setErrorChangePass('Sistem sibuk, gagal mengganti password saat ini.');
    }
  };

  const handleDeleteClick = (userToDelete: UserAccount) => {
    if (currentUser && userToDelete.id === currentUser.id) {
      alert('Anda tidak bisa menghapus akun yang sedang Anda gunakan untuk login!');
      return;
    }

    const confirmDel = confirm(
      `Apakah Anda benar-benar yakin ingin mencabut seluruh hak akses untuk user "${userToDelete.namaLengkap}" (${userToDelete.username})?\n\nTindakan ini tidak bisa dibatalkan!`
    );

    if (confirmDel) {
      const success = onDeleteUser(userToDelete.id);
      if (success) {
        alert(`Hak akses untuk "${userToDelete.namaLengkap}" berhasil dihapus.`);
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none text-[#064E3B] select-none">
          <UserIcon size={120} />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-block px-2.5 py-0.5 text-[8.5px] bg-[#064E3B] font-bold text-white uppercase tracking-[0.2em] leading-none rounded-none">
              OTORITAS KEAMANAN PORTAL
            </span>
            <h2 className="text-xl font-serif font-bold text-slate-900 tracking-tight">
              Manajemen Hak Akses & Kredensial User
            </h2>
            <p className="text-slate-500 text-xs max-w-xl leading-relaxed">
              Daftarkan petugas tata usaha barumu, atur peran akses sistem (Admin / Petugas Kasir), dan terapkan penggantian kata sandi berjangka demi keamanan pembukuan finansial syariah.
            </p>
          </div>
          
          {currentUser?.role === 'admin' ? (
            <button
              id="btn_toggle_add_user"
              onClick={() => {
                setShowAddForm(!showAddForm);
                setErrorAdd(null);
                setSuccessAdd(null);
              }}
              className="px-4 py-2.5 bg-[#064E3B] hover:bg-[#053d2f] text-white text-[10px] font-bold uppercase tracking-wider rounded-sm transition flex items-center gap-1.5 shadow-sm border border-[#064E3B] self-start md:self-center cursor-pointer"
            >
              {showAddForm ? (
                <>Tutup Formulir</>
              ) : (
                <>
                  <Plus size={12} /> Tambah User Baru
                </>
              )}
            </button>
          ) : (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 font-sans px-3.5 py-2 text-[10px] font-semibold max-w-xs rounded-sm">
              Level akses Anda adalah <strong className="text-[#B45309]">Petugas</strong>. Anda hanya berhak mengubah sandi Anda sendiri.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left 2 Columns: User Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <div className="px-5 py-4 bg-slate-50/50 border-b border-slate-200 flex justify-between items-center">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold flex items-center gap-1.5">
              <UserCheck size={12} className="text-[#064E3B]" />
              Daftar Petugas & Pengguna Aktif
            </span>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-100 text-slate-600 rounded-full border border-slate-200">
              {users.length} Akun
            </span>
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[9px]">
                  <th className="py-3 px-4">Nama Pengenal / Peran</th>
                  <th className="py-3 px-4">Nama Pengguna</th>
                  <th className="py-3 px-4">Terdaftar</th>
                  <th className="py-3 px-4 text-right">Opsi Pengaturan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {users.map((user) => {
                  const isSelf = currentUser && user.id === currentUser.id;
                  return (
                    <tr 
                      key={user.id} 
                      className={`hover:bg-slate-50/35 transition-colors ${isSelf ? 'bg-emerald-50/30' : ''}`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold uppercase select-none ${
                            user.role === 'admin' 
                              ? 'bg-amber-100 text-amber-900 border border-amber-250' 
                              : user.role === 'bendahara_tabungan'
                              ? 'bg-sky-100 text-sky-950 border border-sky-250'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-250'
                          }`}>
                            {user.namaLengkap.substring(0, 2)}
                          </div>
                          <div className="space-y-0.5 text-left">
                            <span className="font-bold text-slate-800 flex items-center gap-1">
                              {user.namaLengkap}
                              {isSelf ? (
                                <span className="text-[8px] bg-[#064E3B] text-white font-serif px-1.5 py-0.5 rounded-sm uppercase tracking-wider select-none shrink-0 border border-amber-500 leading-none">Anda</span>
                              ) : null}
                            </span>
                            <span className="flex items-center gap-1 text-[9px] text-slate-400 capitalize">
                              {user.role === 'admin' ? (
                                <ShieldCheck size={11} className="text-amber-600" />
                              ) : user.role === 'bendahara_tabungan' ? (
                                <UserCheck size={11} className="text-sky-600" />
                              ) : (
                                <UserIcon size={11} className="text-emerald-600" />
                              )}
                              {user.role === 'admin' 
                                ? 'Administrator' 
                                : user.role === 'bendahara_tabungan' 
                                ? 'Bendahara Tabungan (Staff)' 
                                : 'Petugas Keuangan (Staff)'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 text-[11px]">
                        @{user.username}
                      </td>
                      <td className="py-3.5 px-4 text-[10px] text-slate-400 flex items-center gap-1 mt-1.5 border-none">
                        <Clock size={11} />
                        {user.createdAt}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(currentUser?.role === 'admin' || isSelf) ? (
                            <button
                              title="Ganti Password"
                              onClick={() => {
                                setSelectedUserIdForPass(user.id);
                                setChangePasswordVal('');
                                setErrorChangePass(null);
                                setSuccessChangePass(null);
                              }}
                              className={`p-1.5 rounded-sm border transition flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
                                selectedUserIdForPass === user.id
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-250'
                              }`}
                            >
                              <Key size={11} />
                              <span>Ganti Pass</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Terkunci</span>
                          )}

                          {currentUser?.role === 'admin' && (
                            <button
                              title="Hapus Hak Akses"
                              onClick={() => handleDeleteClick(user)}
                              disabled={isSelf}
                              className={`p-1.5 rounded-sm border transition flex items-center gap-1 text-[10px] cursor-pointer ${
                                isSelf
                                  ? 'bg-slate-100 text-slate-350 border-slate-200 cursor-not-allowed'
                                  : 'bg-white hover:bg-rose-50 text-rose-600 border-slate-250 hover:border-rose-200'
                              }`}
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Column: Form Panel (Add / Edit Password) */}
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            
            {/* Form Ganti Password */}
            {selectedUserIdForPass && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border-2 border-emerald-600 rounded-lg shadow-lg relative p-5 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[8px] font-serif font-black bg-amber-500 text-white px-2 py-0.5 rounded-sm uppercase tracking-wider">
                      Ubah Enkripsi
                    </span>
                    <h3 className="font-serif font-bold text-slate-900 text-sm">
                      Kunci Sandi Baru
                    </h3>
                  </div>
                  <button 
                    onClick={() => setSelectedUserIdForPass(null)}
                    className="text-xs font-bold text-slate-400 hover:text-slate-800 px-1 py-0.5 border border-slate-200 hover:border-slate-300 transition shrink-0 uppercase rounded-sm cursor-pointer"
                  >
                    Batal
                  </button>
                </div>

                <div className="p-3 bg-emerald-50/50 border border-emerald-100 text-[10.5px] leading-relaxed text-slate-700">
                  <span className="font-sans">Mengubah password kualifikasi kepemilikan untuk akun: </span>
                  <strong className="block text-[#064E3B] mt-0.5 font-mono text-[11px]">
                    @{users.find(u => u.id === selectedUserIdForPass)?.username} ({users.find(u => u.id === selectedUserIdForPass)?.namaLengkap})
                  </strong>
                </div>

                <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5 pt-1">
                  {errorChangePass && (
                    <p className="p-2.5 bg-rose-50 border border-rose-200 text-rose-950 text-[10px] leading-relaxed flex gap-2">
                      <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                      <span>{errorChangePass}</span>
                    </p>
                  )}
                  {successChangePass && (
                    <p className="p-2.5 bg-emerald-50 border border-emerald-200 text-[#064E3B] text-[10px] leading-relaxed flex gap-2 font-bold">
                      <CheckCircle size={14} className="shrink-0 mt-0.5 text-[#064E3B]" />
                      <span>{successChangePass}</span>
                    </p>
                  )}

                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 uppercase tracking-widest font-bold block">
                      Kata Sandi Baru
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                        <Lock size={12} />
                      </span>
                      <input 
                        type={showPassField ? 'text' : 'password'}
                        value={changePasswordVal}
                        onChange={(e) => setChangePasswordVal(e.target.value)}
                        placeholder="Ketik password baru..."
                        required
                        className="w-full pl-8 pr-10 py-2 bg-[#FDFCFB] border border-slate-250 rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-[#064E3B] transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassField(!showPassField)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-[#064E3B] focus:outline-none"
                      >
                        {showPassField ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-sm transition flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                  >
                    <Key size={11} /> Simpan Sandi Baru
                  </button>
                </form>
              </motion.div>
            )}

            {/* Form Tambah User */}
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-slate-200 p-5 rounded-lg space-y-4 shadow-md"
              >
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="font-serif font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <UserPlus size={14} className="text-[#064E3B]" />
                    Tambah Akun Baru
                  </h3>
                  <p className="text-[10px] text-slate-400">Hubungkan personil baru ke dasbor.</p>
                </div>

                <form onSubmit={handleAddSubmit} className="space-y-3.5">
                  {errorAdd && (
                    <p className="p-2.5 bg-rose-50 border border-rose-200 text-rose-950 text-[10.5px] leading-relaxed flex gap-2">
                      <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                      <span>{errorAdd}</span>
                    </p>
                  )}
                  {successAdd && (
                    <p className="p-2.5 bg-emerald-50 border border-emerald-200 text-[#064E3B] text-[10.5px] leading-relaxed flex gap-2 font-bold">
                      <CheckCircle size={14} className="shrink-0 mt-0.5 text-[#064E3B]" />
                      <span>{successAdd}</span>
                    </p>
                  )}

                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block">
                      Nama Lengkap (Gelar)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                        <UserIcon size={12} />
                      </span>
                      <input 
                        type="text"
                        value={newNamaLengkap}
                        onChange={(e) => setNewNamaLengkap(e.target.value)}
                        placeholder="Contoh: Ustazah Halimah, S.Pd"
                        required
                        className="w-full pl-8 pr-3 py-2 bg-[#FDFCFB] border border-slate-250 rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-[#064E3B] transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block">
                      Nama Pengguna (Username)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none font-mono text-[11px] font-bold">
                        @
                      </span>
                      <input 
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="ustazah_halimah"
                        required
                        className="w-full pl-8 pr-3 py-2 bg-[#FDFCFB] border border-slate-250 rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-[#064E3B] transition font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block">
                      Kata Sandi Awal (Password)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                        <Lock size={12} />
                      </span>
                      <input 
                        type="text"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Contoh: AlFatih99!"
                        required
                        className="w-full pl-8 pr-3 py-2 bg-[#FDFCFB] border border-slate-250 rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-[#064E3B] transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block">
                      Level Otoritas Hak Akses
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as 'admin' | 'petugas' | 'bendahara_tabungan')}
                      className="w-full p-2 bg-[#FDFCFB] border border-slate-250 rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-[#064E3B] font-bold"
                    >
                      <option value="petugas">Petugas Keuangan (Hanya Input & Pembukuan)</option>
                      <option value="bendahara_tabungan">Bendahara Tabungan (Pembukuan Tabungan)</option>
                      <option value="admin">Administrator Sekolah (Akses Penuh)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#064E3B] hover:bg-[#053d2f] text-white text-[10px] font-bold uppercase tracking-wider rounded-sm transition flex items-center justify-center gap-1 shadow-sm mt-3.5 cursor-pointer"
                  >
                    <UserPlus size={11} /> Simpan Akun Baru
                  </button>
                </form>
              </motion.div>
            )}

            {!selectedUserIdForPass && !showAddForm && (
              <div className="p-5 border border-dashed border-slate-250 text-center rounded-lg text-slate-400 py-10 space-y-2 select-none">
                <UserIcon size={24} className="mx-auto text-slate-300 block" />
                <p className="text-[11px] leading-relaxed">
                  Pilih aksi di sebelah kiri untuk mengubah kata sandi personil atau klik tombol di kanan atas untuk merekrut database petugas baru.
                </p>
              </div>
            )}

          </AnimatePresence>
        </div>

      </div>

      {/* SECTION: INTEGRASI GATEWAY PEMBAYARAN MIDTRANS */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm p-6 text-left">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-[#064E3B] border border-emerald-100 rounded-sm">
              <Settings2 size={22} className="text-[#064E3B]" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-slate-900">
                Pintu Gerbang Pembayaran Online (Midtrans API)
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Hubungkan loket tagihan sekolah dengan gateway pembayaran resmi Midtrans untuk memproses setoran SPP secara otomatis.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#ECFDF5] border border-emerald-100 text-[#064E3B] text-[10px] font-bold font-mono rounded-sm">
            <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-ping"></span>
            <span>SIMULASI & REAL-TIME LINK</span>
          </div>
        </div>

        {currentUser?.role === 'admin' ? (
          <form onSubmit={handleSaveMidtransKeys} className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Server Key Column */}
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold flex items-center justify-between">
                <span>Midtrans Server Key (Kunci Rahasia)</span>
                <span className="text-[9px] text-[#B45309] font-mono normal-case">(Sisi Server)</span>
              </label>
              
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                  <Lock size={13} />
                </span>
                <input
                  type={showKeys ? "text" : "password"}
                  value={midtransServerKey}
                  onChange={(e) => setMidtransServerKey(e.target.value)}
                  placeholder="Contoh: SB-Mid-server-XXXXXXXXXXXXX"
                  className="w-full pl-8 pr-10 py-2.5 bg-[#FDFCFB] border border-slate-250 rounded-sm font-mono placeholder:text-slate-350"
                />
                <button
                  type="button"
                  onClick={() => setShowKeys(!showKeys)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-650 cursor-pointer"
                >
                  {showKeys ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed italic">
                Gunakan kunci Sandbox (awalan <code className="bg-slate-100 px-1 font-bold font-mono text-[9px]">SB-</code>) untuk simulasi transaksi loket tanpa memotong uang sungguhan.
              </p>
            </div>

            {/* Client Key Column */}
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold flex items-center justify-between">
                <span>Midtrans Client Key (Kunci Pengunjung)</span>
                <span className="text-[9px] text-sky-600 font-mono normal-case">(Sisi Client)</span>
              </label>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                  <Key size={13} />
                </span>
                <input
                  type={showKeys ? "text" : "password"}
                  value={midtransClientKey}
                  onChange={(e) => setMidtransClientKey(e.target.value)}
                  placeholder="Contoh: SB-Mid-client-XXXXXXXXXXXXX"
                  className="w-full pl-8 pr-10 py-2.5 bg-[#FDFCFB] border border-slate-250 rounded-sm font-mono placeholder:text-slate-350"
                />
                <button
                  type="button"
                  onClick={() => setShowKeys(!showKeys)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-650 cursor-pointer"
                >
                  {showKeys ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed italic">
                Kunci publik yang aman diekspos di peramban guna meluncurkan modal pop-up Snap secara visual.
              </p>
            </div>

            {/* Actions & Settings Information Panel */}
            <div className="col-span-1 md:col-span-2 pt-3 border-t border-slate-150 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="bg-amber-50 text-[#B45309] border border-amber-201 rounded-sm p-3 text-[10px] leading-relaxed font-sans max-w-xl flex gap-2">
                <ShieldCheck size={14} className="shrink-0 mt-0.5 text-[#B45309]" />
                <span>
                  Jika dikosongkan, sistem tetap akan berjalan secara default menggunakan model simulator sandbox sekolah yang dirancang di front-end untuk mendemonstrasikan kelancaran bayar online dan cetak kuitansi.
                </span>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 bg-[#064E3B] hover:bg-[#053d2f] text-white text-[10px] font-bold uppercase tracking-wider rounded-sm transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer border border-[#064E3B]"
              >
                <CheckCircle size={13} /> Simpan Sandi Kunci Midtrans
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-5 p-5 border border-dashed border-slate-250 text-center rounded-lg bg-slate-50 text-slate-500 py-8 space-y-2 select-none">
            <Lock size={20} className="mx-auto text-slate-400 font-bold" />
            <p className="text-xs font-bold text-slate-700">Akses Terbatas Terkunci</p>
            <p className="text-[11px] leading-relaxed max-w-sm mx-auto text-slate-400">
              Maaf, konfigurasi Midtrans Merchant & API Key hanya boleh diatur oleh user dengan wewenang level <strong className="text-[#064E3B] uppercase">Administrator Sekolah</strong> demi perlindungan kebocoran kunci finansial.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
