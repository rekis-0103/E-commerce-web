import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useTheme, DarkModeToggle } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSignOutAlt, FaTruck, FaPlus, FaArrowLeft, FaWarehouse, FaUserTie, FaUserPlus, FaMapMarkerAlt, FaIdCard } from 'react-icons/fa';

function AdminCourierManagement() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [warehouses, setWarehouses] = useState([]);
  const [availableCouriers, setAvailableCouriers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  // Form states
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [courierName, setCourierName] = useState('');
  const [courierEmail, setCourierEmail] = useState('');
  const [courierPassword, setCourierPassword] = useState('');
  const [selectedCourierId, setSelectedCourierId] = useState('');

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchData();
  }, [role, navigate]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [whRes, courierRes] = await Promise.all([
        axios.get('http://localhost:3000/api/admin/warehouse/all', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:3000/api/admin/courier/available', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      // Filter hanya gudang bertipe pengiriman
      const shippingOnly = (whRes.data.data || []).filter(w => w.warehouse_type === 'pengiriman');
      setWarehouses(shippingOnly);
      setAvailableCouriers(courierRes.data.data || []);
      setIsLoading(false);
    } catch (error) {
      console.error("Gagal mengambil data", error);
      setIsLoading(false);
    }
  };

  const handleAddNewCourier = async (e) => {
    e.preventDefault();
    if (!courierName || !courierEmail || !courierPassword || !selectedWarehouse) {
      alert("Semua field wajib diisi!");
      return;
    }

    try {
      await axios.post('http://localhost:3000/api/admin/courier/add', {
        name: courierName,
        email: courierEmail,
        password: courierPassword,
        warehouse_id: selectedWarehouse.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("✅ Kurir baru berhasil ditambahkan!");
      setShowAddModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal menambahkan kurir");
    }
  };

  const handleAssignCourier = async (e) => {
    e.preventDefault();
    if (!selectedCourierId || !selectedWarehouse) {
      alert("Pilih kurir terlebih dahulu!");
      return;
    }

    try {
      await axios.post('http://localhost:3000/api/admin/courier/assign-warehouse', {
        courier_id: parseInt(selectedCourierId),
        warehouse_id: selectedWarehouse.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("✅ Kurir berhasil ditugaskan ke gudang!");
      setShowAssignModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal menugaskan kurir");
    }
  };

  const resetForm = () => {
    setCourierName('');
    setCourierEmail('');
    setCourierPassword('');
    setSelectedCourierId('');
    setSelectedWarehouse(null);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif", background: theme.bg, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <h2 style={{ color: theme.textSecondary }}>Memuat Data Logistik...</h2>
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
            🚚 Manajemen Kurir & Gudang
          </motion.h2>
        </div>
        <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
          <DarkModeToggle />
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleLogout} style={{ padding: '12px 24px', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaSignOutAlt /> Logout
          </motion.button>
        </div>
      </div>

      <div style={{ marginBottom: 32 }}>
        <p style={{ color: theme.textSecondary, fontSize: 18 }}>Kelola penugasan kurir pada setiap Gudang Pengiriman (Shipping Warehouse).</p>
      </div>

      {/* Warehouse Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: 24 }}>
        {warehouses.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, backgroundColor: theme.cardBg, borderRadius: 16, border: `1px dashed ${theme.border}` }}>
            <FaWarehouse size={48} color={theme.textSecondary} style={{ marginBottom: 16 }} />
            <h3 style={{ color: theme.textSecondary }}>Belum ada gudang tipe pengiriman terdaftar.</h3>
          </div>
        ) : (
          warehouses.map((warehouse) => (
            <motion.div 
              key={warehouse.id} 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ backgroundColor: theme.cardBg, borderRadius: 20, padding: 24, boxShadow: theme.shadow, border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', color: theme.text, fontSize: 22 }}>{warehouse.name}</h3>
                  <span style={{ fontSize: 13, backgroundColor: '#3B82F6', color: 'white', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{warehouse.code}</span>
                </div>
                <FaWarehouse color="#3B82F6" size={24} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: theme.textSecondary, fontSize: 14, marginBottom: 8 }}>
                <FaMapMarkerAlt /> {warehouse.address}, {warehouse.province}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: theme.textSecondary, fontSize: 14, marginBottom: 20 }}>
                <FaUserTie /> Manager: {warehouse.owner?.name || 'Tidak ada'}
              </div>

              <div style={{ flex: 1, backgroundColor: theme.bg, borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <h4 style={{ margin: '0 0 12px 0', color: theme.text, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FaTruck size={14} /> Daftar Kurir ({warehouse.staff?.filter(s => s.role === 'courier').length || 0})
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {warehouse.staff?.filter(s => s.role === 'courier').length > 0 ? (
                    warehouse.staff.filter(s => s.role === 'courier').map(courier => (
                      <div key={courier.ID} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.cardBg, padding: '10px 14px', borderRadius: 8, border: `1px solid ${theme.border}` }}>
                        <div>
                          <div style={{ fontWeight: 600, color: theme.text, fontSize: 14 }}>{courier.name}</div>
                          <div style={{ fontSize: 12, color: theme.textSecondary }}>{courier.email}</div>
                        </div>
                        <FaTruck size={12} color="#10B981" />
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: 13, color: theme.textSecondary, fontStyle: 'italic', margin: 0 }}>Belum ada kurir ditugaskan.</p>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button 
                  onClick={() => { setSelectedWarehouse(warehouse); setShowAssignModal(true); }}
                  style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', color: '#3B82F6', border: '1px solid #3B82F6', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <FaUserPlus /> Assign Kurir
                </button>
                <button 
                  onClick={() => { setSelectedWarehouse(warehouse); setShowAddModal(true); }}
                  style={{ flex: 1, padding: '10px', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <FaPlus /> Kurir Baru
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Assign Courier Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={() => setShowAssignModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} style={{ position: 'relative', backgroundColor: theme.cardBg, padding: 32, borderRadius: 20, maxWidth: 500, width: '90%', boxShadow: theme.shadow }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: 24, fontWeight: 700, color: theme.text }}>Tugaskan Kurir</h3>
              <p style={{ color: theme.textSecondary, marginBottom: 24 }}>Pilih kurir yang sudah terdaftar untuk ditugaskan ke <strong>{selectedWarehouse?.name}</strong>.</p>
              
              <form onSubmit={handleAssignCourier}>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: theme.text }}>Pilih Kurir Tersedia *</label>
                  <select value={selectedCourierId} onChange={(e) => setSelectedCourierId(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, fontSize: 15 }} required>
                    <option value="">-- Pilih Kurir --</option>
                    {availableCouriers.map(courier => (
                      <option key={courier.ID} value={courier.ID}>{courier.name} ({courier.email})</option>
                    ))}
                  </select>
                  {availableCouriers.length === 0 && (
                    <p style={{ fontSize: 12, color: '#EF4444', marginTop: 8 }}>⚠️ Tidak ada kurir yang tersedia. Silakan buat kurir baru.</p>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: 12 }}>
                  <motion.button type="submit" disabled={availableCouriers.length === 0} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ flex: 1, padding: 14, backgroundColor: availableCouriers.length === 0 ? theme.border : '#3B82F6', color: 'white', border: 'none', borderRadius: 8, cursor: availableCouriers.length === 0 ? 'not-allowed' : 'pointer', fontWeight: 600 }}>Tugaskan</motion.button>
                  <motion.button type="button" onClick={() => setShowAssignModal(false)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ flex: 1, padding: 14, backgroundColor: theme.textSecondary, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Batal</motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add New Courier Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} style={{ position: 'relative', backgroundColor: theme.cardBg, padding: 32, borderRadius: 20, maxWidth: 500, width: '90%', boxShadow: theme.shadow }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: 24, fontWeight: 700, color: theme.text }}>Tambah Kurir Baru</h3>
              <p style={{ color: theme.textSecondary, marginBottom: 24 }}>Buat akun kurir baru dan tugaskan langsung ke <strong>{selectedWarehouse?.name}</strong>.</p>
              
              <form onSubmit={handleAddNewCourier}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: theme.text }}>Nama Lengkap *</label>
                  <input type="text" value={courierName} onChange={(e) => setCourierName(e.target.value)} placeholder="Nama lengkap kurir" style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, fontSize: 15 }} required />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: theme.text }}>Email *</label>
                  <input type="email" value={courierEmail} onChange={(e) => setCourierEmail(e.target.value)} placeholder="email@kurir.com" style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, fontSize: 15 }} required />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: theme.text }}>Password *</label>
                  <input type="password" value={courierPassword} onChange={(e) => setCourierPassword(e.target.value)} placeholder="Minimal 6 karakter" style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, fontSize: 15 }} required />
                </div>
                
                <div style={{ display: 'flex', gap: 12 }}>
                  <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ flex: 1, padding: 14, backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Simpan</motion.button>
                  <motion.button type="button" onClick={() => setShowAddModal(false)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ flex: 1, padding: 14, backgroundColor: theme.textSecondary, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Batal</motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminCourierManagement;
