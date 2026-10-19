import { useState, useMemo } from 'react';
import { 
  Users, UserPlus, UserCheck, UserX, 
  Edit3, Trash2, CheckCircle2, AlertTriangle, 
  Info, Search
} from 'lucide-react';
import { ROLES, USER_STATUS } from '../config/auth';
import { useToast } from '../context/ToastContext';

export function StaffManagement({ users = [], onUpdateUsers, currentUser }) {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    phone: '',
    roleTitle: 'Karyawan / Kasir Shift',
    notes: ''
  });
  const [formError, setFormError] = useState('');

  const isOwner = currentUser?.role === ROLES.OWNER;

  // Filtered staff list
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (u.phone || '').includes(searchTerm);
      const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [users, searchTerm, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.status === USER_STATUS.ACTIVE).length;
    const inactive = users.filter(u => u.status === USER_STATUS.INACTIVE).length;
    return { total, active, inactive };
  }, [users]);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      username: '',
      password: '',
      phone: '',
      roleTitle: 'Karyawan / Kasir Shift',
      notes: ''
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      password: user.password,
      phone: user.phone || '',
      roleTitle: user.roleTitle || 'Karyawan / Kasir Shift',
      notes: user.notes || ''
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleSaveNewStaff = (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) return setFormError('Nama lengkap wajib diisi.');
    if (!formData.username.trim()) return setFormError('Username wajib diisi.');
    if (!formData.password.trim()) return setFormError('Password wajib diisi.');

    const cleanUsername = formData.username.trim().toLowerCase();
    const exists = users.find(u => u.username.toLowerCase() === cleanUsername);
    if (exists) {
      return setFormError('Username sudah digunakan oleh karyawan lain. Pilih username unik.');
    }

    const initials = formData.name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');

    const newStaff = {
      id: `usr-${Date.now()}`,
      username: cleanUsername,
      password: formData.password.trim(),
      name: formData.name.trim(),
      role: ROLES.STAFF,
      roleTitle: formData.roleTitle,
      email: `${cleanUsername}@apoteksehat.id`,
      phone: formData.phone.trim() || '08xxxxxxxx',
      avatar: initials || 'KA',
      status: USER_STATUS.ACTIVE,
      joinDate: new Date().toISOString().split('T')[0],
      notes: formData.notes
    };

    const updated = [...users, newStaff];
    onUpdateUsers(updated);
    setIsAddModalOpen(false);
    toast.success(`Karyawan baru ${newStaff.name} berhasil ditambahkan!`);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) return setFormError('Nama lengkap wajib diisi.');
    if (!formData.password.trim()) return setFormError('Password tidak boleh kosong.');

    const updated = users.map(u => {
      if (u.id === selectedUser.id) {
        return {
          ...u,
          name: formData.name.trim(),
          password: formData.password.trim(),
          phone: formData.phone.trim(),
          roleTitle: formData.roleTitle,
          notes: formData.notes
        };
      }
      return u;
    });

    onUpdateUsers(updated);
    setIsEditModalOpen(false);
    toast.success(`Data karyawan ${selectedUser.name} berhasil diperbarui.`);
  };

  // Toggle Active / Inactive (Resign)
  const handleToggleStatus = (user) => {
    if (user.role === ROLES.OWNER) {
      toast.warning('Akun Owner utama tidak dapat dinonaktifkan.');
      return;
    }

    const nextStatus = user.status === USER_STATUS.ACTIVE ? USER_STATUS.INACTIVE : USER_STATUS.ACTIVE;
    const updated = users.map(u => u.id === user.id ? { ...u, status: nextStatus } : u);

    onUpdateUsers(updated);

    if (nextStatus === USER_STATUS.INACTIVE) {
      toast.warning(`Akun ${user.name} dinonaktifkan (Karyawan Resign / Keluar).`);
    } else {
      toast.success(`Akun ${user.name} diaktifkan kembali.`);
    }
  };

  const handleDeleteUser = (user) => {
    if (user.role === ROLES.OWNER) {
      toast.warning('Akun Owner utama tidak dapat dihapus.');
      return;
    }

    if (window.confirm(`Yakin ingin menghapus permanen akun ${user.name}? Tindakan ini tidak dapat dibatalkan.`)) {
      const updated = users.filter(u => u.id !== user.id);
      onUpdateUsers(updated);
      toast.info(`Akun ${user.name} telah dihapus.`);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 36 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 className="section-title">Manajemen Karyawan & Kasir</h2>
          <p className="section-subtitle">
            Kelola akses staf apotek, tambahkan kasir baru, dan nonaktifkan akun karyawan yang keluar (resign)
          </p>
        </div>

        {isOwner && (
          <button 
            className="btn btn-primary"
            onClick={handleOpenAdd}
            style={{ gap: 8, borderRadius: 10 }}
          >
            <UserPlus size={16} />
            <span>Tambah Karyawan Baru</span>
          </button>
        )}
      </div>

      {/* Info SOP Pergantian Karyawan */}
      <div style={{
        background: '#f8fafc',
        border: '1.5px solid #e2e8f0',
        borderRadius: 14,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14
      }}>
        <div className="icon-box-sm" style={{ background: '#e0e7ff', flexShrink: 0 }}>
          <Info size={18} color="#4f46e5" />
        </div>
        <div style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.5 }}>
          <strong style={{ color: '#0f172a' }}>SOP Pergantian Karyawan Keluar & Karyawan Baru:</strong>
          <ul style={{ margin: '4px 0 0', paddingLeft: 18, listStyleType: 'disc' }}>
            <li><strong>Ketika Karyawan Keluar (Resign):</strong> Pastikan shift terakhir kasir sudah ditutup di menu POS/Shift. Kemudian klik tombol <strong>"Nonaktifkan"</strong>. Karyawan yang keluar otomatis tidak bisa lagi login atau mengakses data apotek.</li>
            <li><strong>Ketika Ada Karyawan Baru Masuk:</strong> Klik tombol <strong>"Tambah Karyawan Baru"</strong> di atas. Berikan username & password yang Anda buat kepada karyawan baru tersebut.</li>
          </ul>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Pengguna</span>
            <div className="icon-box-sm" style={{ background: '#eef2ff' }}>
              <Users size={16} color="#4f46e5" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e2432' }}>
              {stats.total} Akun
            </div>
            <p style={{ fontSize: 11.5, color: '#64748b', margin: '4px 0 0' }}>
              1 Owner & {stats.total - 1} Karyawan
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Karyawan Aktif Bekerja</span>
            <div className="icon-box-sm" style={{ background: '#f0fdf4' }}>
              <UserCheck size={16} color="#16a34a" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16a34a' }}>
              {stats.active} Aktif
            </div>
            <p style={{ fontSize: 11.5, color: '#64748b', margin: '4px 0 0' }}>
              Dapat login & menjalankan shift kasir
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Karyawan Resign / Keluar</span>
            <div className="icon-box-sm" style={{ background: stats.inactive > 0 ? '#fff1f2' : '#f8fafc' }}>
              <UserX size={16} color={stats.inactive > 0 ? '#dc2626' : '#94a3b8'} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: stats.inactive > 0 ? '#dc2626' : '#64748b' }}>
              {stats.inactive} Nonaktif
            </div>
            <p style={{ fontSize: 11.5, color: '#64748b', margin: '4px 0 0' }}>
              Akses login terblokir secara aman
            </p>
          </div>
        </div>
      </div>

      {/* Staff Table & Search */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #f0f1f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          flexWrap: 'wrap'
        }}>
          <div style={{ position: 'relative', width: 280 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              className="form-input"
              placeholder="Cari nama atau username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: 34, height: 38, fontSize: 13 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { id: 'ALL', label: 'Semua Status' },
              { id: USER_STATUS.ACTIVE, label: 'Aktif Saja' },
              { id: USER_STATUS.INACTIVE, label: 'Resign / Nonaktif' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`btn btn-sm ${statusFilter === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 8, fontSize: 12 }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 700, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '12px 20px' }}>Karyawan / Akun</th>
                <th style={{ padding: '12px 18px' }}>Username Login</th>
                <th style={{ padding: '12px 18px' }}>Role & Tanggung Jawab</th>
                <th style={{ padding: '12px 18px' }}>Kontak / No. HP</th>
                <th style={{ padding: '12px 18px' }}>Tanggal Bergabung</th>
                <th style={{ padding: '12px 18px' }}>Status Akses</th>
                <th style={{ padding: '12px 20px', textAlign: 'right' }}>Aksi Owner</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => {
                const isSuper = user.role === ROLES.OWNER;
                const isActive = user.status === USER_STATUS.ACTIVE;

                return (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: !isActive ? '#fffaf5' : 'transparent',
                      transition: 'background 0.12s ease'
                    }}
                  >
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: isSuper ? '#4f46e5' : isActive ? '#16a34a' : '#94a3b8',
                          color: '#ffffff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: 13, flexShrink: 0
                        }}>
                          {user.avatar || user.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: '#1e293b' }}>
                            {user.name}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>
                            {user.email || `${user.username}@apoteksehat.id`}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <code style={{
                        background: '#f1f5f9',
                        padding: '3px 8px',
                        borderRadius: 6,
                        color: '#0f172a',
                        fontWeight: 700,
                        fontSize: 12
                      }}>
                        {user.username}
                      </code>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className={`badge ${isSuper ? 'badge-indigo' : 'badge-green'}`} style={{ fontSize: 10 }}>
                          {isSuper ? 'OWNER' : 'KARYAWAN'}
                        </span>
                        <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
                          {user.roleTitle || (isSuper ? 'Pemilik Apotek' : 'Kasir Shift')}
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px', color: '#475569' }}>
                      {user.phone || '—'}
                    </td>

                    <td style={{ padding: '14px 18px', color: '#64748b' }}>
                      {user.joinDate || '2024-01-01'}
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      {isActive ? (
                        <span className="badge badge-green" style={{ gap: 4 }}>
                          <CheckCircle2 size={11} /> Aktif Bekerja
                        </span>
                      ) : (
                        <span className="badge badge-red" style={{ gap: 4 }}>
                          <UserX size={11} /> Resign / Nonaktif
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      {isSuper ? (
                        <span style={{ fontSize: 11.5, color: '#94a3b8', fontStyle: 'italic' }}>
                          Akun Utama (Super Admin)
                        </span>
                      ) : (
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ borderRadius: 7, fontSize: 11.5, gap: 4 }}
                            onClick={() => handleOpenEdit(user)}
                            title="Edit data / ganti password"
                          >
                            <Edit3 size={13} /> Edit
                          </button>

                          <button
                            className={`btn btn-sm ${isActive ? 'btn-danger' : 'btn-success'}`}
                            style={{ borderRadius: 7, fontSize: 11.5 }}
                            onClick={() => handleToggleStatus(user)}
                            title={isActive ? 'Nonaktifkan akun karyawan yang keluar' : 'Aktifkan kembali akun'}
                          >
                            {isActive ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>

                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ borderRadius: 7, color: '#dc2626' }}
                            onClick={() => handleDeleteUser(user)}
                            title="Hapus akun permanen"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Tambah Karyawan Baru */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="icon-box-sm" style={{ background: '#eef2ff' }}>
                  <UserPlus size={16} color="#4f46e5" />
                </div>
                <div>
                  <h3 className="modal-title" style={{ fontSize: '1.05rem', margin: 0 }}>
                    Tambah Karyawan / Kasir Baru
                  </h3>
                  <p style={{ fontSize: 11.5, color: '#64748b', margin: 0 }}>
                    Buat akun login resmi untuk staf pengganti atau kasir baru
                  </p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setIsAddModalOpen(false)}>&times;</button>
            </div>

            <form onSubmit={handleSaveNewStaff} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {formError && (
                <div className="alert-error" style={{ fontSize: 12 }}>
                  <AlertTriangle size={14} />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="form-label">Nama Lengkap Karyawan *</label>
                <input
                  className="form-input"
                  placeholder="Contoh: Rina Melati, A.Md.Farm"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">Username Login *</label>
                  <input
                    className="form-input"
                    placeholder="Contoh: rina"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                    required
                  />
                  <p className="form-hint">Huruf kecil tanpa spasi</p>
                </div>

                <div>
                  <label className="form-label">Kata Sandi (Password) *</label>
                  <input
                    className="form-input"
                    type="password"
                    placeholder="Contoh: rina123"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Posisi / Tanggung Jawab</label>
                <select
                  className="form-input form-select"
                  value={formData.roleTitle}
                  onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
                >
                  <option value="Karyawan / Kasir Shift">Karyawan / Kasir Shift (Operasional POS)</option>
                  <option value="Karyawan / Asisten Apoteker">Asisten Apoteker (Pelayanan Obat & Rak)</option>
                  <option value="Karyawan / Staf Gudang">Staf Gudang (Penerimaan Barang PT)</option>
                </select>
              </div>

              <div>
                <label className="form-label">Nomor WhatsApp / HP</label>
                <input
                  className="form-input"
                  placeholder="Contoh: 0812-9876-5432"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsAddModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 2, borderRadius: 10 }}>
                  <CheckCircle2 size={16} /> Daftarkan Karyawan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Karyawan */}
      {isEditModalOpen && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="icon-box-sm" style={{ background: '#eef2ff' }}>
                  <Edit3 size={16} color="#4f46e5" />
                </div>
                <div>
                  <h3 className="modal-title" style={{ fontSize: '1.05rem', margin: 0 }}>
                    Edit Karyawan: {selectedUser.name}
                  </h3>
                  <p style={{ fontSize: 11.5, color: '#64748b', margin: 0 }}>
                    Username: @{selectedUser.username}
                  </p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setIsEditModalOpen(false)}>&times;</button>
            </div>

            <form onSubmit={handleSaveEdit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {formError && (
                <div className="alert-error" style={{ fontSize: 12 }}>
                  <AlertTriangle size={14} />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="form-label">Nama Lengkap</label>
                <input
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label">Ubah Kata Sandi (Password Baru)</label>
                <input
                  className="form-input"
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Ketik password baru jika ingin mereset"
                  required
                />
                <p className="form-hint">Jika kasir lupa password, Owner dapat langsung menggantinya di sini.</p>
              </div>

              <div>
                <label className="form-label">Posisi / Role Title</label>
                <input
                  className="form-input"
                  value={formData.roleTitle}
                  onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Nomor WhatsApp / HP</label>
                <input
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsEditModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 2, borderRadius: 10 }}>
                  <CheckCircle2 size={16} /> Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
