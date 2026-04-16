import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useTheme, DarkModeToggle } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { FaSignOutAlt, FaWarehouse, FaPlus, FaUser, FaArrowLeft } from 'react-icons/fa';

function AdminWarehouseManagement() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [warehouses, setWarehouses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  
  // Form states
  const [warehouseName, setWarehouseName] = useState('');
  const [warehouseCode, setWarehouseCode] = useState('');
  const [warehouseAddress, setWarehouseAddress] = useState('');
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchWarehouses();
  }, [role, navigate]);

  const fetchWarehouses = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/admin/warehouse/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWarehouses(response.data.data || []);
      setIsLoading(false);
    } catch (error) {
      console.error("Gagal mengambil data gudang", error);
      setIsLoading(false);
    }
  };

  const handleCreateWarehouse = async (e) => {
    e.preventDefault();
    if (!warehouseName || !warehouseCode) {
      alert("Nama dan kode gudang wajib diisi!");
      return;
    }

    try {
      await axios.post('http://localhost:3000/api/admin/warehouse/create', {
        name: warehouseName,
        code: warehouseCode,
        address: warehouseAddress
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("✅ Gudang berhasil dibuat!");
      setShowCreateModal(false);
      setWarehouseName('');
      setWarehouseCode('');
      setWarehouseAddress('');
      fetchWarehouses();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal membuat gudang");
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!staffName || !staffEmail || !staffPassword) {
      alert("Semua field wajib diisi!");
      return;
    }

    try {
      await axios.post('http://localhost:3000/api/admin/warehouse/add-staff', {
        name: staffName,
        email: staffEmail,
        password: staffPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("✅ Warehouse staff berhasil ditambahkan!");
      setShowStaffModal(false);
      setStaffName('');
      setStaffEmail('');
      setStaffPassword('');
      fetchWarehouses();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal menambahkan staff");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif", background: theme.bg, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <h2 style={{ color: theme.textSecondary }}>Memuat Data Gudang...</h2>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: theme.bg, minHeight: '100vh', padding: '40px 60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link to="/admin/dashboard">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ padding: '10px 16px', backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: theme.text, fontWeight: 600 }}>
              <FaArrowLeft /> Kembali
            </motion.button>
          </Link>
          <motion.h2 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ fontSize: 32, fontWeight: 800, margin: 0, color: theme.text }}>
            🏭 Manajemen Gudang
          </motion.h2>
        </div>
        <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
          <DarkModeToggle />
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleLogout} style={{ padding: '12px 24px', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaSignOutAlt /> Logout
          </motion.button>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowCreateModal(true)} style={{ padding: '12px 24px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FaPlus /> Buat Gudang Baru
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowStaffModal(true)} style={{ padding: '12px 24px', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FaUser /> Tambah Warehouse Staff
        </motion.button>
      </div>

      {/* Warehouses List */}
      {warehouses.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', padding: 80, backgroundColor: theme.cardBg, borderRadius: 16, boxShadow: theme.shadow, border: `1px solid ${theme.border}` }}>
          <FaWarehouse style={{ fontSize: 80, color: theme.textSecondary, marginBottom: 20 }} />
          <h3 style={{ color: theme.textSecondary }}>Belum ada gudang</h3>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {warehouses.map((warehouse, idx) => (
            <motion.div key={warehouse.ID} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} style={{ backgroundColor: theme.cardBg, borderRadius: 16, padding: 24, boxShadow: theme.shadow, border: `1px solid ${theme.border}` }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: 22, fontWeight: 700, color: theme.text }}>
                <FaWarehouse style={{ marginRight: 10, color: '#10B981' }} />
                {warehouse.name}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ margin: 0, fontSize: 14, color: theme.textSecondary }}><strong>Kode:</strong> {warehouse.code}</p>
                {warehouse.address && <p style={{ margin: '8px 0 0 0', fontSize: 14, color: theme.textSecondary }}><strong>Alamat:</strong> {warehouse.address}</p>}
                <p style={{ margin: '8px 0 0 0', fontSize: 14, color: theme.textSecondary }}><strong>Staff ID:</strong> {warehouse.owner_id || 'Belum ditugaskan'}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Warehouse Modal */}
      {showCreateModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={() => setShowCreateModal(false)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ position: 'relative', backgroundColor: theme.cardBg, padding: 32, borderRadius: 20, maxWidth: 500, width: '90%', boxShadow: theme.shadow }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: 24, fontWeight: 700, color: theme.text }}>Buat Gudang Baru</h3>
            <form onSubmit={handleCreateWarehouse}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: theme.text }}>Nama Gudang *</label>
                <input type="text" value={warehouseName} onChange={(e) => setWarehouseName(e.target.value)} placeholder="Contoh: Gudang Jakarta Utara" style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, fontSize: 15 }} required />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: theme.text }}>Kode Gudang *</label>
                <input type="text" value={warehouseCode} onChange={(e) => setWarehouseCode(e.target.value.toUpperCase())} placeholder="Contoh: JKT-001" style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, fontSize: 15 }} required />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: theme.text }}>Alamat</label>
                <textarea value={warehouseAddress} onChange={(e) => setWarehouseAddress(e.target.value)} placeholder="Alamat lengkap gudang..." style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, fontSize: 15, minHeight: 80, fontFamily: 'inherit', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ flex: 1, padding: 14, backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Simpan</motion.button>
                <motion.button type="button" onClick={() => setShowCreateModal(false)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ flex: 1, padding: 14, backgroundColor: theme.textSecondary, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Batal</motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Add Staff Modal */}
      {showStaffModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={() => setShowStaffModal(false)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ position: 'relative', backgroundColor: theme.cardBg, padding: 32, borderRadius: 20, maxWidth: 500, width: '90%', boxShadow: theme.shadow }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: 24, fontWeight: 700, color: theme.text }}>Tambah Warehouse Staff</h3>
            <form onSubmit={handleAddStaff}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: theme.text }}>Nama Lengkap *</label>
                <input type="text" value={staffName} onChange={(e) => setStaffName(e.target.value)} placeholder="Nama staff" style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, fontSize: 15 }} required />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: theme.text }}>Email *</label>
                <input type="email" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} placeholder="email@example.com" style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, fontSize: 15 }} required />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: theme.text }}>Password *</label>
                <input type="password" value={staffPassword} onChange={(e) => setStaffPassword(e.target.value)} placeholder="Password" style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, fontSize: 15 }} required />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ flex: 1, padding: 14, backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Simpan</motion.button>
                <motion.button type="button" onClick={() => setShowStaffModal(false)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ flex: 1, padding: 14, backgroundColor: theme.textSecondary, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Batal</motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default AdminWarehouseManagement;
