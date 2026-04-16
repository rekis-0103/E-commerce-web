import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useTheme, DarkModeToggle } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { FaSignOutAlt, FaCheck, FaTimes, FaStore, FaUser, FaArrowLeft } from 'react-icons/fa';

function AdminShopApproval() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [pendingShops, setPendingShops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState(''); // 'approve' or 'reject'

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchPendingShops();
  }, [role, navigate]);

  const fetchPendingShops = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/admin/shops/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingShops(response.data.data || []);
      setIsLoading(false);
    } catch (error) {
      console.error("Gagal mengambil data pengajuan", error);
      setIsLoading(false);
    }
  };

  const handleAction = (shop, type) => {
    setSelectedShop(shop);
    setActionType(type);
    setShowModal(true);
  };

  const confirmAction = async () => {
    if (!selectedShop) return;

    try {
      const endpoint = actionType === 'approve' 
        ? `http://localhost:3000/api/admin/shops/approve/${selectedShop.ID}`
        : `http://localhost:3000/api/admin/shops/reject/${selectedShop.ID}`;
      
      const method = actionType === 'approve' ? 'put' : 'put';

      await axios[method](endpoint, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`✅ Toko berhasil ${actionType === 'approve' ? 'disetujui' : 'ditolak'}!`);
      setShowModal(false);
      fetchPendingShops();
    } catch (error) {
      alert(error.response?.data?.message || `Gagal ${actionType === 'approve' ? 'menyetujui' : 'menolak'} toko`);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div style={{ 
        fontFamily: "'Inter', sans-serif", 
        background: theme.bg, 
        minHeight: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <h2 style={{ color: theme.textSecondary }}>Memuat Data Pengajuan...</h2>
      </div>
    );
  }

  return (
    <div style={{ 
      fontFamily: "'Inter', sans-serif", 
      background: theme.bg, 
      minHeight: '100vh', 
      padding: '40px 60px', 
      transition: 'all 0.3s ease' 
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 40 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link to="/admin/dashboard">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '10px 16px',
                backgroundColor: theme.cardBg,
                border: `1px solid ${theme.border}`,
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: theme.text,
                fontWeight: 600
              }}
            >
              <FaArrowLeft /> Kembali
            </motion.button>
          </Link>
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ 
              fontSize: 32, 
              fontWeight: 800, 
              margin: 0, 
              color: theme.text, 
              fontFamily: "'Poppins', sans-serif" 
            }}
          >
            ⏰ Approval Toko
          </motion.h2>
        </div>

        <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
          <DarkModeToggle />
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
        </div>
      </div>

      {/* Pending Shops List */}
      {pendingShops.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            textAlign: 'center',
            padding: 80,
            backgroundColor: theme.cardBg,
            borderRadius: 16,
            boxShadow: theme.shadow,
            border: `1px solid ${theme.border}`
          }}
        >
          <FaStore style={{ fontSize: 80, color: theme.textSecondary, marginBottom: 20 }} />
          <h3 style={{ color: theme.textSecondary, marginBottom: 8 }}>Tidak ada pengajuan pending</h3>
          <p style={{ color: theme.textSecondary, fontSize: 14 }}>Semua pengajuan sudah diproses</p>
        </motion.div>
      ) : (
        <div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              fontSize: 16,
              color: theme.textSecondary,
              marginBottom: 24
            }}
          >
            {pendingShops.length} pengajuan toko menunggu review Anda
          </motion.p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {pendingShops.map((shop, idx) => (
              <motion.div
                key={shop.ID}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                style={{
                  backgroundColor: theme.cardBg,
                  borderRadius: 16,
                  padding: 24,
                  boxShadow: theme.shadow,
                  border: `1px solid ${theme.border}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: 22, fontWeight: 700, color: theme.text }}>
                      <FaStore style={{ marginRight: 10, color: '#3B82F6' }} />
                      {shop.shop_name}
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <p style={{ margin: 0, fontSize: 14, color: theme.textSecondary }}>
                        <FaUser style={{ marginRight: 8, width: 16 }} />
                        <strong>Pemilik:</strong> {shop.Owner?.name || 'N/A'} ({shop.Owner?.email || shop.user_id})
                      </p>
                      <p style={{ margin: '8px 0 0 0', fontSize: 14, color: theme.textSecondary }}>
                        <strong>Deskripsi:</strong> {shop.description}
                      </p>
                      <p style={{ margin: '8px 0 0 0', fontSize: 13, color: theme.textSecondary }}>
                        <strong>Diajukan:</strong> {new Date(shop.created_at).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAction(shop, 'approve')}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: '#10B981',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: 14,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}
                    >
                      <FaCheck /> Setujui
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAction(shop, 'reject')}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: '#EF4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: 14,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}
                    >
                      <FaTimes /> Tolak
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showModal && selectedShop && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            style={{
              position: 'relative',
              backgroundColor: theme.cardBg,
              padding: 32,
              borderRadius: 20,
              maxWidth: 500,
              width: '90%',
              boxShadow: theme.shadow
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ 
              margin: '0 0 24px 0', 
              fontSize: 24, 
              fontWeight: 700, 
              color: theme.text 
            }}>
              {actionType === 'approve' ? '✅ Setujui Toko?' : '❌ Tolak Toko?'}
            </h3>

            <div style={{ marginBottom: 24 }}>
              <p style={{ margin: '0 0 8px 0', fontSize: 16, color: theme.text }}>
                <strong>Toko:</strong> {selectedShop.shop_name}
              </p>
              <p style={{ margin: 0, fontSize: 14, color: theme.textSecondary }}>
                <strong>Pemilik:</strong> {selectedShop.Owner?.name || 'N/A'}
              </p>
            </div>

            {actionType === 'reject' && (
              <div style={{
                padding: 16,
                backgroundColor: '#FEF3C7',
                border: '1px solid #F59E0B',
                borderRadius: 8,
                marginBottom: 24
              }}>
                <p style={{ margin: 0, fontSize: 14, color: '#92400E', fontWeight: 600 }}>
                  ⚠️ Pengguna tidak bisa mengajukan toko baru selama 1 bulan setelah penolakan.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={confirmAction}
                style={{
                  flex: 1,
                  padding: 14,
                  backgroundColor: actionType === 'approve' ? '#10B981' : '#EF4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 15
                }}
              >
                {actionType === 'approve' ? 'Ya, Setujui' : 'Ya, Tolak'}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1,
                  padding: 14,
                  backgroundColor: theme.textSecondary,
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 15
                }}
              >
                Batal
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default AdminShopApproval;
