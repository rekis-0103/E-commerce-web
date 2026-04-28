import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme, DarkModeToggle } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaWarehouse, FaArrowRight, FaSignInAlt, FaSignOutAlt, FaTruck, FaBox, FaHistory, FaMapMarkerAlt, FaHome } from 'react-icons/fa';

function WarehouseManagement() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [myWarehouse, setMyWarehouse] = useState(null);
  const [incomingPackages, setIncomingPackages] = useState([]);
  const [currentStock, setCurrentStock] = useState([]);
  const [activeTab, setActiveTab] = useState('incoming'); // 'incoming', 'stock', 'history'
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWarehouseData();
  }, []);

  const fetchWarehouseData = async () => {
    setIsLoading(true);
    try {
      const [whRes, incomingRes, stockRes] = await Promise.all([
        axios.get('http://localhost:3000/api/warehouse/my-warehouse', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:3000/api/warehouse/incoming', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:3000/api/warehouse/stock', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setMyWarehouse(whRes.data.data);
      setIncomingPackages(incomingRes.data.data || []);
      setCurrentStock(stockRes.data.data || []);
      setIsLoading(false);
    } catch (error) {
      console.error("Gagal mengambil data gudang", error);
      setIsLoading(false);
    }
  };

  const handleProcessPackage = async (trackingNumber, action) => {
    const confirmMsg = action === 'masuk' ? "Konfirmasi barang telah diterima di gudang?" : "Konfirmasi barang keluar menuju tujuan berikutnya?";
    if (window.confirm(confirmMsg)) {
      try {
        await axios.put('http://localhost:3000/api/warehouse/shipments/location', {
          tracking_number: trackingNumber,
          action: action,
          notes: action === 'masuk' ? `Diterima oleh staff di ${myWarehouse.name}` : `Diproses keluar dari ${myWarehouse.name}`
        }, { headers: { Authorization: `Bearer ${token}` } });
        
        alert("Berhasil memperbarui status paket!");
        fetchWarehouseData();
      } catch (error) {
        alert("Gagal memproses paket");
      }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (isLoading) return <div style={{ background: theme.bg, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><h2 style={{ color: theme.textSecondary }}>Memuat Panel Gudang...</h2></div>;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: theme.bg, minHeight: '100vh', padding: '40px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 60, height: 60, borderRadius: 15, background: theme.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <FaWarehouse size={30} />
            </div>
            <div>
              <h2 style={{ margin: 0, color: theme.text, fontSize: 28, fontWeight: 800 }}>{myWarehouse?.name}</h2>
              <p style={{ margin: 0, color: theme.textSecondary }}>Panel Manajemen Operasional Gudang ({myWarehouse?.warehouse_type?.toUpperCase()})</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/home')}
              style={{
                padding: '12px 24px',
                backgroundColor: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <FaHome /> Home
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              style={{
                padding: '12px 24px',
                backgroundColor: '#EF4444',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <FaSignOutAlt /> Logout
            </motion.button>
            <DarkModeToggle />
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 30, background: theme.cardBg, padding: 8, borderRadius: 12, border: `1px solid ${theme.border}`, width: 'fit-content' }}>
          <button onClick={() => setActiveTab('incoming')} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, background: activeTab === 'incoming' ? theme.primary : 'transparent', color: activeTab === 'incoming' ? 'white' : theme.textSecondary }}>
            📦 Akan Masuk ({incomingPackages.length})
          </button>
          <button onClick={() => setActiveTab('stock')} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, background: activeTab === 'stock' ? theme.primary : 'transparent', color: activeTab === 'stock' ? 'white' : theme.textSecondary }}>
            🏠 Stok Saat Ini ({currentStock.length})
          </button>
        </div>

        {/* Main Content */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
          {activeTab === 'incoming' && (
            <AnimatePresence>
              {incomingPackages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 100, color: theme.textSecondary }}>Tidak ada paket yang menuju ke gudang ini.</div>
              ) : (
                incomingPackages.map((pkg) => (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={pkg.id} style={{ background: theme.cardBg, borderRadius: 16, padding: 24, border: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontWeight: 800, color: theme.text, fontSize: 18 }}>#{pkg.tracking_number}</span>
                        <span style={{ fontSize: 12, background: '#DBEAFE', color: '#1E40AF', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>DALAM PERJALANAN</span>
                      </div>
                      <p style={{ margin: 0, color: theme.textSecondary, fontSize: 14 }}><FaMapMarkerAlt size={12}/> {pkg.current_location}</p>
                    </div>
                    <button onClick={() => handleProcessPackage(pkg.tracking_number, 'masuk')} style={{ padding: '12px 24px', background: '#10B981', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FaSignInAlt /> Terima Barang
                    </button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          )}

          {activeTab === 'stock' && (
            <AnimatePresence>
              {currentStock.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 100, color: theme.textSecondary }}>Gudang sedang kosong.</div>
              ) : (
                currentStock.map((pkg) => (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={pkg.id} style={{ background: theme.cardBg, borderRadius: 16, padding: 24, border: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontWeight: 800, color: theme.text, fontSize: 18 }}>#{pkg.tracking_number}</span>
                        <span style={{ fontSize: 12, background: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>DI GUDANG</span>
                      </div>
                      <p style={{ margin: 0, color: theme.textSecondary, fontSize: 14 }}>Tujuan Akhir: {pkg.shipping_address}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => handleProcessPackage(pkg.tracking_number, 'keluar')} style={{ padding: '12px 24px', background: theme.primary, color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FaSignOutAlt /> Barang Keluar
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}

export default WarehouseManagement;
