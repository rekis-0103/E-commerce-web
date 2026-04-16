import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useTheme, DarkModeToggle } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { FaSignOutAlt, FaTruck, FaPlus, FaArrowLeft, FaWarehouse } from 'react-icons/fa';

function AdminCourierManagement() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [couriers, setCouriers] = useState([]);
  const [hubs, setHubs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHubModal, setShowHubModal] = useState(false);
  
  // Form states
  const [courierName, setCourierName] = useState('');
  const [courierEmail, setCourierEmail] = useState('');
  const [courierPassword, setCourierPassword] = useState('');
  const [hubName, setHubName] = useState('');
  const [hubCode, setHubCode] = useState('');
  const [hubAddress, setHubAddress] = useState('');

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchData();
  }, [role, navigate]);

  const fetchData = async () => {
    try {
      const [couriersRes, hubsRes] = await Promise.all([
        axios.get('http://localhost:3000/api/admin/courier/all', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:3000/api/delivery-hub/all', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setCouriers(couriersRes.data.data || []);
      setHubs(hubsRes.data.data || []);
      setIsLoading(false);
    } catch (error) {
      console.error("Gagal mengambil data", error);
      setIsLoading(false);
    }
  };

  const handleAddCourier = async (e) => {
    e.preventDefault();
    if (!courierName || !courierEmail || !courierPassword) {
      alert("Semua field wajib diisi!");
      return;
    }

    try {
      await axios.post('http://localhost:3000/api/admin/courier/add', {
        name: courierName,
        email: courierEmail,
        password: courierPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("✅ Kurir berhasil ditambahkan!");
      setShowAddModal(false);
      setCourierName('');
      setCourierEmail('');
      setCourierPassword('');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal menambahkan kurir");
    }
  };

  const handleCreateHub = async (e) => {
    e.preventDefault();
    if (!hubName || !hubCode) {
      alert("Nama dan kode hub wajib diisi!");
      return;
    }

    try {
      await axios.post('http://localhost:3000/api/admin/delivery-hub/create', {
        name: hubName,
        code: hubCode,
        address: hubAddress
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("✅ Delivery hub berhasil dibuat!");
      setShowHubModal(false);
      setHubName('');
      setHubCode('');
      setHubAddress('');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal membuat hub");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif", background: theme.bg, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <h2 style={{ color: theme.textSecondary }}>Memuat Data Kurir...</h2>
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
            🚚 Manajemen Kurir & Hub
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
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowAddModal(true)} style={{ padding: '12px 24px', backgroundColor: '#8B5CF6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FaPlus /> Tambah Kurir
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowHubModal(true)} style={{ padding: '12px 24px', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FaWarehouse /> Buat Delivery Hub
        </motion.button>
      </div>

      {/* Couriers List */}
      <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, color: theme.text }}>Daftar Kurir</h3>
      {couriers.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', padding: 60, backgroundColor: theme.cardBg, borderRadius: 16, boxShadow: theme.shadow, border: `1px solid ${theme.border}` }}>
          <FaTruck style={{ fontSize: 60, color: theme.textSecondary, marginBottom: 20 }} />
          <h3 style={{ color: theme.textSecondary }}>Belum ada kurir</h3>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {couriers.map((courier, idx) => (
            <motion.div key={courier.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} style={{ backgroundColor: theme.cardBg, borderRadius: 12, padding: 20, boxShadow: theme.shadow, border: `1px solid ${theme.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 700, color: theme.text }}>{courier.name}</h4>
                  <p style={{ margin: 0, fontSize: 14, color: theme.textSecondary }}>Email: {courier.email}</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: 14, color: theme.textSecondary }}>
                    <strong>Hub:</strong> {courier.hub_name || 'Belum ditugaskan'}
                  </p>
                </div>
                <span style={{ padding: '8px 16px', borderRadius: 20, backgroundColor: courier.hub_name ? '#10B981' : '#F59E0B', color: 'white', fontWeight: 700, fontSize: 12 }}>
                  {courier.hub_name ? 'ASSIGNED' : 'PENDING'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Hubs List */}
      {hubs.length > 0 && (
        <>
          <h3 style={{ fontSize: 22, fontWeight: 700, marginTop: 40, marginBottom: 20, color: theme.text }}>Delivery Hub</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {hubs.map((hub, idx) => (
              <motion.div key={hub.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} style={{ backgroundColor: theme.cardBg, borderRadius: 12, padding: 20, boxShadow: theme.shadow, border: `1px solid ${theme.border}` }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 700, color: theme.text }}>
                  <FaWarehouse style={{ marginRight: 8, color: '#3B82F6' }} />
                  {hub.name}
                </h4>
                <p style={{ margin: 0, fontSize: 14, color: theme.textSecondary }}><strong>Kode:</strong> {hub.code}</p>
                {hub.address && <p style={{ margin: '4px 0 0 0', fontSize: 14, color: theme.textSecondary }}><strong>Alamat:</strong> {hub.address}</p>}
                <p style={{ margin: '4px 0 0 0', fontSize: 14, color: theme.textSecondary }}>
                  <strong>Kurir:</strong> {hub.assigned_courier?.name || 'Belum ditugaskan'}
                </p>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Add Courier Modal */}
      {showAddModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={() => setShowAddModal(false)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ position: 'relative', backgroundColor: theme.cardBg, padding: 32, borderRadius: 20, maxWidth: 500, width: '90%', boxShadow: theme.shadow }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: 24, fontWeight: 700, color: theme.text }}>Tambah Kurir Baru</h3>
            <form onSubmit={handleAddCourier}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: theme.text }}>Nama Lengkap *</label>
                <input type="text" value={courierName} onChange={(e) => setCourierName(e.target.value)} placeholder="Nama kurir" style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, fontSize: 15 }} required />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: theme.text }}>Email *</label>
                <input type="email" value={courierEmail} onChange={(e) => setCourierEmail(e.target.value)} placeholder="email@example.com" style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, fontSize: 15 }} required />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: theme.text }}>Password *</label>
                <input type="password" value={courierPassword} onChange={(e) => setCourierPassword(e.target.value)} placeholder="Password" style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, fontSize: 15 }} required />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ flex: 1, padding: 14, backgroundColor: '#8B5CF6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Simpan</motion.button>
                <motion.button type="button" onClick={() => setShowAddModal(false)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ flex: 1, padding: 14, backgroundColor: theme.textSecondary, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Batal</motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Create Hub Modal */}
      {showHubModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={() => setShowHubModal(false)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ position: 'relative', backgroundColor: theme.cardBg, padding: 32, borderRadius: 20, maxWidth: 500, width: '90%', boxShadow: theme.shadow }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: 24, fontWeight: 700, color: theme.text }}>Buat Delivery Hub</h3>
            <form onSubmit={handleCreateHub}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: theme.text }}>Nama Hub *</label>
                <input type="text" value={hubName} onChange={(e) => setHubName(e.target.value)} placeholder="Contoh: Hub Jakarta Selatan" style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, fontSize: 15 }} required />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: theme.text }}>Kode Hub *</label>
                <input type="text" value={hubCode} onChange={(e) => setHubCode(e.target.value.toUpperCase())} placeholder="Contoh: HUB-JS-001" style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, fontSize: 15 }} required />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: theme.text }}>Alamat</label>
                <textarea value={hubAddress} onChange={(e) => setHubAddress(e.target.value)} placeholder="Alamat lengkap hub..." style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, fontSize: 15, minHeight: 80, fontFamily: 'inherit', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ flex: 1, padding: 14, backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Simpan</motion.button>
                <motion.button type="button" onClick={() => setShowHubModal(false)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ flex: 1, padding: 14, backgroundColor: theme.textSecondary, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Batal</motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default AdminCourierManagement;
