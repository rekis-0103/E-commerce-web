import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme, DarkModeToggle } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaWarehouse, FaBoxOpen, FaSignOutAlt, FaPlus, FaHistory, FaArrowRight, FaArrowLeft, FaUsers, FaBox, FaCheckCircle, FaTruck, FaSyncAlt } from 'react-icons/fa';

const API = 'http://localhost:3000/api';

function WarehouseManagement() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [activeTab, setActiveTab] = useState('incoming');
  const [warehouse, setWarehouse] = useState(null);
  const [movements, setMovements] = useState([]);
  const [incomingShipments, setIncomingShipments] = useState([]);
  const [warehouseStock, setWarehouseStock] = useState([]);
  const [availableStaff, setAvailableStaff] = useState([]);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(null); // { resi, type, status }
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [movementNotes, setMovementNotes] = useState('');

  const [warehouseName, setWarehouseName] = useState('');
  const [warehouseCode, setWarehouseCode] = useState('');
  const [warehouseAddress, setWarehouseAddress] = useState('');
  const [warehouseProvince, setWarehouseProvince] = useState('');
  const [warehouseType, setWarehouseType] = useState('pengiriman');

  const provinces = ["Aceh","Sumatera Utara","Sumatera Barat","Riau","Kepulauan Riau","Jambi","Sumatera Selatan","Bangka Belitung","Bengkulu","Lampung","DKI Jakarta","Jawa Barat","Banten","Jawa Tengah","DI Yogyakarta","Jawa Timur","Bali","Nusa Tenggara Barat","Nusa Tenggara Timur","Kalimantan Barat","Kalimantan Tengah","Kalimantan Selatan","Kalimantan Timur","Kalimantan Utara","Sulawesi Utara","Sulawesi Tengah","Sulawesi Selatan","Sulawesi Tenggara","Gorontalo","Sulawesi Barat","Maluku","Maluku Utara","Papua","Papua Barat","Papua Selatan","Papua Tengah","Papua Pegunungan","Papua Barat Daya"];

  const headers = { Authorization: `Bearer ${token}` };

  const fetchAll = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const [wRes, inRes, stRes, mvRes] = await Promise.all([
        axios.get(`${API}/warehouse/my-warehouse`, { headers }),
        axios.get(`${API}/warehouse/incoming`, { headers }),
        axios.get(`${API}/warehouse/stock`, { headers }),
        axios.get(`${API}/warehouse/movements`, { headers }),
      ]);
      setWarehouse(wRes.data.data);
      setIncomingShipments(inRes.data.data || []);
      setWarehouseStock(stRes.data.data || []);
      setMovements(mvRes.data.data || []);
    } catch (err) {
      if (err.response?.status === 404) setShowRegisterForm(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token]);

  const fetchStaff = async () => {
    try {
      const res = await axios.get(`${API}/warehouse/staff/available`, { headers });
      setAvailableStaff(res.data.data || []);
    } catch {}
  };

  useEffect(() => {
    if (role !== 'warehouse_staff') { navigate('/login'); return; }
    fetchAll();
  }, [role, navigate, fetchAll]);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/warehouse/register`, {
        name: warehouseName, code: warehouseCode,
        address: warehouseAddress, province: warehouseProvince,
        warehouse_type: warehouseType
      }, { headers });
      alert('✅ Gudang berhasil didaftarkan!');
      setShowRegisterForm(false);
      fetchAll();
    } catch (err) { alert(err.response?.data?.message || 'Gagal mendaftarkan gudang'); }
  };

  const handleMovement = async () => {
    if (!showMovementModal) return;
    try {
      await axios.post(`${API}/warehouse/movement`, {
        tracking_number: showMovementModal.resi,
        movement_type: showMovementModal.type,
        status: showMovementModal.status,
        notes: movementNotes
      }, { headers });
      alert(`✅ Berhasil mencatat barang ${showMovementModal.type}!`);
      setShowMovementModal(null);
      setMovementNotes('');
      fetchAll(true);
    } catch (err) { alert(err.response?.data?.message || 'Gagal mencatat pergerakan'); }
  };

  const handleAddStaff = async (staffId) => {
    try {
      await axios.post(`${API}/warehouse/staff/add`, { staff_id: staffId }, { headers });
      alert('✅ Staf berhasil ditambahkan!');
      fetchStaff();
      fetchAll();
    } catch (err) { alert(err.response?.data?.message || 'Gagal menambahkan staf'); }
  };

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };

  const cardStyle = { backgroundColor: theme.cardBg, borderRadius: 16, border: `1px solid ${theme.border}`, boxShadow: theme.shadow };
  const btnBase = { border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 };
  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, fontSize: 14, boxSizing: 'border-box' };

  if (isLoading) return (
    <div style={{ background: theme.bg, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <h2 style={{ color: theme.textSecondary }}>Memuat Data Gudang...</h2>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: theme.bg, minHeight: '100vh', padding: '32px 48px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: theme.text, margin: 0 }}>🏭 Manajemen Gudang</h2>
          {warehouse && <p style={{ color: theme.textSecondary, margin: '4px 0 0' }}>{warehouse.name} ({warehouse.code}) · {warehouse.province}</p>}
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <DarkModeToggle />
          <motion.button whileHover={{ scale: 1.05 }} onClick={() => fetchAll(true)}
            style={{ ...btnBase, padding: '10px 16px', background: '#3B82F6', color: 'white' }}>
            <FaSyncAlt style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} /> Refresh
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} onClick={handleLogout}
            style={{ ...btnBase, padding: '10px 20px', background: '#EF4444', color: 'white' }}>
            <FaSignOutAlt /> Logout
          </motion.button>
        </div>
      </div>

      {/* Register Form */}
      {showRegisterForm && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ ...cardStyle, padding: 32, marginBottom: 32 }}>
          <h3 style={{ color: theme.text, marginTop: 0 }}>📋 Daftarkan Gudang Baru</h3>
          <form onSubmit={handleRegister}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <input style={inputStyle} placeholder="Nama Gudang" value={warehouseName} onChange={e => setWarehouseName(e.target.value)} required />
              <input style={inputStyle} placeholder="Kode Gudang (ex: GDG-JKT-01)" value={warehouseCode} onChange={e => setWarehouseCode(e.target.value.toUpperCase())} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <select style={inputStyle} value={warehouseProvince} onChange={e => setWarehouseProvince(e.target.value)} required>
                <option value="">-- Pilih Provinsi --</option>
                {provinces.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select style={inputStyle} value={warehouseType} onChange={e => setWarehouseType(e.target.value)} required>
                <option value="pengiriman">Gudang Pengiriman</option>
                <option value="sortir">Tempat Sortir</option>
              </select>
            </div>
            <input style={{ ...inputStyle, marginBottom: 20 }} placeholder="Alamat Lengkap" value={warehouseAddress} onChange={e => setWarehouseAddress(e.target.value)} />
            <button type="submit" style={{ ...btnBase, padding: '12px 32px', background: '#10B981', color: 'white', justifyContent: 'center', width: '100%' }}>
              Daftarkan Gudang
            </button>
          </form>
        </motion.div>
      )}

      {warehouse && !showRegisterForm && (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
            {[
              { label: 'Barang Akan Masuk', value: incomingShipments.length, color: '#F59E0B', icon: <FaBoxOpen /> },
              { label: 'Stok di Gudang', value: warehouseStock.length, color: '#3B82F6', icon: <FaBox /> },
              { label: 'Total Pergerakan', value: movements.length, color: '#8B5CF6', icon: <FaHistory /> },
              { label: 'Tipe Gudang', value: warehouse.warehouse_type === 'pengiriman' ? 'Pengiriman' : 'Sortir', color: '#10B981', icon: <FaWarehouse /> },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                style={{ ...cardStyle, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: s.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, fontSize: 20 }}>
                  {s.icon}
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: theme.text }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: theme.textSecondary }}>{s.label}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {[
              { key: 'incoming', label: `📥 Akan Masuk (${incomingShipments.length})` },
              { key: 'stock', label: `📦 Stok Gudang (${warehouseStock.length})` },
              { key: 'history', label: `📋 Riwayat (${movements.length})` },
              { key: 'staff', label: `👥 Staf` },
            ].map(tab => (
              <button key={tab.key} onClick={() => { setActiveTab(tab.key); if (tab.key === 'staff') fetchStaff(); }}
                style={{ ...btnBase, padding: '10px 20px', fontSize: 14,
                  background: activeTab === tab.key ? '#6366F1' : theme.cardBg,
                  color: activeTab === tab.key ? 'white' : theme.textSecondary,
                  border: `1px solid ${activeTab === tab.key ? '#6366F1' : theme.border}` }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab: Incoming */}
          {activeTab === 'incoming' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {incomingShipments.length === 0 ? (
                <div style={{ ...cardStyle, padding: 60, textAlign: 'center' }}>
                  <FaBoxOpen style={{ fontSize: 48, color: theme.textSecondary, marginBottom: 16 }} />
                  <p style={{ color: theme.textSecondary }}>Tidak ada barang yang akan masuk</p>
                </div>
              ) : incomingShipments.map((s, i) => (
                <motion.div key={s.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  style={{ ...cardStyle, padding: '16px 24px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: theme.text, fontSize: 15 }}>#{s.tracking_number}</div>
                    <div style={{ color: theme.textSecondary, fontSize: 13, marginTop: 2 }}>📍 {s.shipping_address || '-'}</div>
                    <div style={{ color: '#F59E0B', fontSize: 12, marginTop: 2 }}>Status: {s.current_status}</div>
                  </div>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setShowMovementModal({ resi: s.tracking_number, type: 'masuk', status: 'Diterima di Gudang' })}
                    style={{ ...btnBase, padding: '9px 18px', background: '#10B981', color: 'white' }}>
                    <FaCheckCircle /> Terima Barang
                  </motion.button>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Tab: Stock */}
          {activeTab === 'stock' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {warehouseStock.length === 0 ? (
                <div style={{ ...cardStyle, padding: 60, textAlign: 'center' }}>
                  <FaBox style={{ fontSize: 48, color: theme.textSecondary, marginBottom: 16 }} />
                  <p style={{ color: theme.textSecondary }}>Gudang kosong</p>
                </div>
              ) : warehouseStock.map((s, i) => (
                <motion.div key={s.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  style={{ ...cardStyle, padding: '16px 24px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: theme.text, fontSize: 15 }}>#{s.tracking_number}</div>
                    <div style={{ color: theme.textSecondary, fontSize: 13, marginTop: 2 }}>📍 {s.shipping_address || '-'}</div>
                    <div style={{ color: '#3B82F6', fontSize: 12, marginTop: 2 }}>Lokasi: {s.current_location}</div>
                  </div>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setShowMovementModal({
                      resi: s.tracking_number,
                      type: 'keluar',
                      status: warehouse.warehouse_type === 'pengiriman' ? 'Diserahkan ke Kurir' : 'Keluar untuk Sortir'
                    })}
                    style={{ ...btnBase, padding: '9px 18px',
                      background: warehouse.warehouse_type === 'pengiriman' ? '#8B5CF6' : '#F59E0B',
                      color: 'white' }}>
                    <FaTruck /> {warehouse.warehouse_type === 'pengiriman' ? 'Kirim ke Kurir' : 'Kirim ke Sortir'}
                  </motion.button>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Tab: History */}
          {activeTab === 'history' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {movements.length === 0 ? (
                <div style={{ ...cardStyle, padding: 60, textAlign: 'center' }}>
                  <FaHistory style={{ fontSize: 48, color: theme.textSecondary, marginBottom: 16 }} />
                  <p style={{ color: theme.textSecondary }}>Belum ada riwayat pergerakan</p>
                </div>
              ) : movements.map((m, i) => (
                <motion.div key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  style={{ ...cardStyle, padding: '14px 24px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: m.movement_type === 'masuk' ? '#10B98122' : '#EF444422', display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.movement_type === 'masuk' ? '#10B981' : '#EF4444', fontSize: 16 }}>
                      {m.movement_type === 'masuk' ? <FaArrowLeft /> : <FaArrowRight />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: theme.text, fontSize: 14 }}>
                        {m.movement_type === 'masuk' ? 'MASUK' : 'KELUAR'} · #{m.tracking_number}
                      </div>
                      <div style={{ color: theme.textSecondary, fontSize: 12 }}>{m.status}</div>
                    </div>
                  </div>
                  <div style={{ color: theme.textSecondary, fontSize: 12 }}>
                    {new Date(m.processed_at).toLocaleString('id-ID')}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Tab: Staff */}
          {activeTab === 'staff' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ ...cardStyle, padding: 24, marginBottom: 16 }}>
                <h4 style={{ color: theme.text, margin: '0 0 16px' }}>Staf Saat Ini di Gudang</h4>
                {(warehouse.staff || []).length === 0 ? (
                  <p style={{ color: theme.textSecondary }}>Belum ada staf yang ditugaskan.</p>
                ) : (warehouse.staff || []).map(s => (
                  <div key={s.id} style={{ padding: '10px 16px', background: theme.bg, borderRadius: 8, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>
                      {s.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: theme.text }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: theme.textSecondary }}>{s.email}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ ...cardStyle, padding: 24 }}>
                <h4 style={{ color: theme.text, margin: '0 0 16px' }}>Tambah Staf Baru</h4>
                {availableStaff.length === 0 ? (
                  <p style={{ color: theme.textSecondary }}>Tidak ada staf yang tersedia.</p>
                ) : availableStaff.map(s => (
                  <div key={s.id} style={{ padding: '10px 16px', background: theme.bg, borderRadius: 8, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: theme.text }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: theme.textSecondary }}>{s.email}</div>
                    </div>
                    <button onClick={() => handleAddStaff(s.id)}
                      style={{ ...btnBase, padding: '7px 16px', background: '#10B981', color: 'white' }}>
                      <FaUsers /> Tambahkan
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Movement Confirmation Modal */}
      <AnimatePresence>
        {showMovementModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}
            onClick={() => setShowMovementModal(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              style={{ ...cardStyle, padding: 32, width: 420, maxWidth: '90%' }}
              onClick={e => e.stopPropagation()}>
              <h3 style={{ color: theme.text, marginTop: 0 }}>
                {showMovementModal.type === 'masuk' ? '📥 Terima Barang' : '📤 Kirim Barang Keluar'}
              </h3>
              <div style={{ background: theme.bg, padding: '12px 16px', borderRadius: 10, marginBottom: 20 }}>
                <div style={{ fontWeight: 700, color: theme.text }}>#{showMovementModal.resi}</div>
                <div style={{ fontSize: 13, color: '#6366F1', marginTop: 4 }}>Status: {showMovementModal.status}</div>
              </div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: theme.textSecondary, marginBottom: 8 }}>Catatan (Opsional)</label>
              <textarea value={movementNotes} onChange={e => setMovementNotes(e.target.value)}
                placeholder="Tambahkan catatan..."
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical', fontFamily: 'inherit', marginBottom: 20 }} />
              <div style={{ display: 'flex', gap: 12 }}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleMovement}
                  style={{ ...btnBase, flex: 1, padding: 12, background: '#10B981', color: 'white', justifyContent: 'center' }}>
                  ✅ Konfirmasi
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowMovementModal(null)}
                  style={{ ...btnBase, flex: 1, padding: 12, background: '#EF4444', color: 'white', justifyContent: 'center' }}>
                  Batal
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default WarehouseManagement;