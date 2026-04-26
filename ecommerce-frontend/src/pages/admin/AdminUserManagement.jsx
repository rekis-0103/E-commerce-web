import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useTheme, DarkModeToggle } from '../../context/ThemeContext';
import { motion } from 'framer-motion';
import { FaUserAlt, FaPlus, FaSearch, FaEdit, FaTrash, FaArrowLeft, FaEnvelope, FaUserTag, FaPhone } from 'react-icons/fa';

function AdminUserManagement() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState(''); // seller, courier, warehouse_staff

  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'courier',
    phone: ''
  });

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchUsers();
  }, [filterRole, search]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/admin/users?role=${filterRole}&search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error("Gagal mengambil data user", error);
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setIsEdit(false);
    setFormData({ name: '', email: '', password: '', role: 'courier', phone: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (user) => {
    setIsEdit(true);
    setSelectedUser(user);
    setFormData({ name: user.name, email: user.email, password: '', role: user.role, phone: user.phone || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await axios.put(`http://localhost:3000/api/admin/users/${selectedUser.ID}`, {
          name: formData.name,
          role: formData.role,
          phone: formData.phone
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert("User berhasil diupdate!");
      } else {
        await axios.post('http://localhost:3000/api/admin/users', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert("User berhasil dibuat!");
      }
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || "Terjadi kesalahan");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Yakin ingin menghapus user ini?")) {
      try {
        await axios.delete(`http://localhost:3000/api/admin/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchUsers();
      } catch (error) {
        alert("Gagal menghapus user");
      }
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: theme.bg, minHeight: '100vh', padding: '40px 60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link to="/admin/dashboard">
            <motion.button whileHover={{ scale: 1.05 }} style={{ padding: '10px 16px', backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text, cursor: 'pointer' }}>
              <FaArrowLeft /> Kembali
            </motion.button>
          </Link>
          <h2 style={{ fontSize: 32, fontWeight: 800, margin: 0, color: theme.text }}>👥 Manajemen User</h2>
        </div>
        <DarkModeToggle />
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 30, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
          <FaSearch style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: theme.textSecondary }} />
          <input
            type="text"
            placeholder="Cari nama atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '12px 12px 12px 45px', borderRadius: 12, border: `1px solid ${theme.border}`, background: theme.cardBg, color: theme.text, outline: 'none' }}
          />
        </div>

        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          style={{ padding: '12px 20px', borderRadius: 12, border: `1px solid ${theme.border}`, background: theme.cardBg, color: theme.text, outline: 'none', cursor: 'pointer' }}
        >
          <option value="">Semua Role</option>
          <option value="seller">Seller</option>
          <option value="courier">Courier</option>
          <option value="warehouse_staff">Warehouse Staff</option>
        </select>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleOpenAdd}
          style={{ padding: '12px 24px', background: theme.primary, color: 'white', border: 'none', borderRadius: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <FaPlus /> Tambah User
        </motion.button>
      </div>

      {/* User Table */}
      <div style={{ background: theme.cardBg, borderRadius: 20, overflow: 'hidden', boxShadow: theme.shadow, border: `1px solid ${theme.border}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: theme.bg, color: theme.textSecondary, fontSize: 14 }}>
              <th style={{ padding: '20px' }}>USER</th>
              <th style={{ padding: '20px' }}>ROLE</th>
              <th style={{ padding: '20px' }}>KONTAK</th>
              <th style={{ padding: '20px' }}>TANGGAL DAFTAR</th>
              <th style={{ padding: '20px', textAlign: 'center' }}>AKSI</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: theme.textSecondary }}>Memuat data...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: theme.textSecondary }}>Tidak ada user ditemukan.</td></tr>
            ) : users.map((u) => (
              <tr key={u.ID} style={{ borderTop: `1px solid ${theme.border}`, color: theme.text }}>
                <td style={{ padding: '20px' }}>
                  <div style={{ fontWeight: 700 }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: theme.textSecondary }}>{u.email}</div>
                </td>
                <td style={{ padding: '20px' }}>
                  <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: u.role === 'seller' ? '#FEE2E2' : u.role === 'courier' ? '#DBEAFE' : '#D1FAE5', color: u.role === 'seller' ? '#991B1B' : u.role === 'courier' ? '#1E40AF' : '#065F46' }}>
                    {u.role.replace('_', ' ').toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '20px', fontSize: 14 }}>{u.phone || '-'}</td>
                <td style={{ padding: '20px', fontSize: 14, color: theme.textSecondary }}>{new Date(u.CreatedAt).toLocaleDateString('id-ID')}</td>
                <td style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                    <button onClick={() => handleOpenEdit(u)} style={{ padding: 8, borderRadius: 8, border: 'none', background: '#F59E0B', color: 'white', cursor: 'pointer' }} title="Edit"><FaEdit /></button>
                    <button onClick={() => handleDelete(u.ID)} style={{ padding: 8, borderRadius: 8, border: 'none', background: '#EF4444', color: 'white', cursor: 'pointer' }} title="Hapus"><FaTrash /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={() => setShowModal(false)}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ background: theme.cardBg, padding: 40, borderRadius: 24, width: '90%', maxWidth: 500, boxShadow: theme.shadow }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ color: theme.text, margin: '0 0 25px 0', fontSize: 24 }}>{isEdit ? 'Edit User' : 'Tambah User Baru'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', color: theme.textSecondary, fontSize: 14, marginBottom: 8 }}>Nama Lengkap</label>
                <div style={{ position: 'relative' }}>
                  <FaUserAlt style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: theme.textSecondary }} />
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text }} />
                </div>
              </div>

              {!isEdit && (
                <>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', color: theme.textSecondary, fontSize: 14, marginBottom: 8 }}>Email</label>
                    <div style={{ position: 'relative' }}>
                      <FaEnvelope style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: theme.textSecondary }} />
                      <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text }} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', color: theme.textSecondary, fontSize: 14, marginBottom: 8 }}>Password</label>
                    <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required style={{ width: '100%', padding: '12px', borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text }} />
                  </div>
                </>
              )}

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', color: theme.textSecondary, fontSize: 14, marginBottom: 8 }}>Nomor Telepon</label>
                <div style={{ position: 'relative' }}>
                  <FaPhone style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: theme.textSecondary }} />
                  <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text }} />
                </div>
              </div>

              <div style={{ marginBottom: 30 }}>
                <label style={{ display: 'block', color: theme.textSecondary, fontSize: 14, marginBottom: 8 }}>Role</label>
                <div style={{ position: 'relative' }}>
                  <FaUserTag style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: theme.textSecondary }} />
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, outline: 'none' }}>
                    <option value="seller">Seller</option>
                    <option value="courier">Courier</option>
                    <option value="warehouse_staff">Warehouse Staff</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 15 }}>
                <button type="submit" style={{ flex: 1, padding: 14, borderRadius: 12, border: 'none', background: theme.primary, color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                  {isEdit ? 'Update User' : 'Buat User'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: 14, borderRadius: 12, border: `1px solid ${theme.border}`, background: 'none', color: theme.text, cursor: 'pointer' }}>Batal</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default AdminUserManagement;
