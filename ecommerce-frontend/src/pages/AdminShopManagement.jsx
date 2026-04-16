import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useTheme, DarkModeToggle } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { FaSignOutAlt, FaStore, FaEdit, FaTrash, FaArrowLeft, FaCheck, FaTimes } from 'react-icons/fa';

function AdminShopManagement() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [shops, setShops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newBadge, setNewBadge] = useState('');

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchShops();
  }, [role, navigate]);

  const fetchShops = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/admin/shops/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShops(response.data.data || []);
      setIsLoading(false);
    } catch (error) {
      console.error("Gagal mengambil data toko", error);
      setIsLoading(false);
    }
  };

  const handleBadgeUpdate = (shop) => {
    setSelectedShop(shop);
    setNewBadge(shop.badge);
    setShowBadgeModal(true);
  };

  const handleDelete = (shop) => {
    setSelectedShop(shop);
    setShowDeleteModal(true);
  };

  const confirmBadgeUpdate = async () => {
    if (!selectedShop || !newBadge) return;

    try {
      await axios.put(`http://localhost:3000/api/admin/shops/badge/${selectedShop.id}`, {
        badge: newBadge
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("✅ Badge toko berhasil diupdate!");
      setShowBadgeModal(false);
      fetchShops();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal mengupdate badge");
    }
  };

  const confirmDelete = async () => {
    if (!selectedShop) return;

    try {
      await axios.delete(`http://localhost:3000/api/admin/shops/${selectedShop.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("✅ Toko berhasil dihapus!");
      setShowDeleteModal(false);
      fetchShops();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal menghapus toko");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'rejected': return '#EF4444';
      default: return theme.textSecondary;
    }
  };

  const getBadgeColor = (badge) => {
    switch (badge) {
      case 'Reguler': return '#3B82F6';
      case 'Terpercaya': return '#10B981';
      case 'Resmi': return '#8B5CF6';
      default: return theme.textSecondary;
    }
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
        <h2 style={{ color: theme.textSecondary }}>Memuat Data Toko...</h2>
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
            🏪 Manajemen Toko
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

      {/* Shops List */}
      {shops.length === 0 ? (
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
          <h3 style={{ color: theme.textSecondary }}>Belum ada toko</h3>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {shops.map((shop, idx) => (
            <motion.div
              key={shop.id}
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
                      <strong>Pemilik:</strong> {shop.owner?.name || 'N/A'} ({shop.owner?.email || `ID: ${shop.user_id}`})
                    </p>
                    <p style={{ margin: '8px 0 0 0', fontSize: 14, color: theme.textSecondary }}>
                      <strong>Deskripsi:</strong> {shop.description}
                    </p>
                    <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: 20,
                        backgroundColor: getStatusColor(shop.status),
                        color: 'white',
                        fontWeight: 700,
                        fontSize: 12,
                        display: 'inline-block'
                      }}>
                        {shop.status.toUpperCase()}
                      </span>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: 20,
                        backgroundColor: getBadgeColor(shop.badge),
                        color: 'white',
                        fontWeight: 700,
                        fontSize: 12,
                        display: 'inline-block'
                      }}>
                        Badge: {shop.badge}
                      </span>
                    </div>
                  </div>
                </div>

                {shop.status === 'approved' && (
                  <div style={{ display: 'flex', gap: 12 }}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleBadgeUpdate(shop)}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#3B82F6',
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
                      <FaEdit /> Edit Badge
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDelete(shop)}
                      style={{
                        padding: '10px 20px',
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
                      <FaTrash /> Hapus
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Badge Update Modal */}
      {showBadgeModal && selectedShop && (
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
          onClick={() => setShowBadgeModal(false)}
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
              <FaEdit style={{ marginRight: 10 }} />
              Edit Badge Toko
            </h3>

            <p style={{ marginBottom: 20, fontSize: 16, color: theme.text }}>
              <strong>Toko:</strong> {selectedShop.shop_name}
            </p>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 12, fontWeight: 600, fontSize: 14, color: theme.text }}>
                Pilih Badge:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Reguler', 'Terpercaya', 'Resmi'].map((badge) => (
                  <motion.div
                    key={badge}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setNewBadge(badge)}
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      border: `2px solid ${newBadge === badge ? getBadgeColor(badge) : theme.border}`,
                      backgroundColor: newBadge === badge ? `${getBadgeColor(badge)}20` : theme.bg,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12
                    }}
                  >
                    {newBadge === badge && <FaCheck style={{ color: getBadgeColor(badge) }} />}
                    <span style={{ 
                      fontSize: 16, 
                      fontWeight: 600, 
                      color: getBadgeColor(badge) 
                    }}>
                      {badge}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={confirmBadgeUpdate}
                style={{
                  flex: 1,
                  padding: 14,
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 15
                }}
              >
                Simpan
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowBadgeModal(false)}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedShop && (
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
          onClick={() => setShowDeleteModal(false)}
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
              color: '#EF4444' 
            }}>
              <FaTimes style={{ marginRight: 10 }} />
              Hapus Toko?
            </h3>

            <div style={{ marginBottom: 24 }}>
              <p style={{ margin: '0 0 8px 0', fontSize: 16, color: theme.text }}>
                <strong>Toko:</strong> {selectedShop.shop_name}
              </p>
              <p style={{ margin: 0, fontSize: 14, color: theme.textSecondary }}>
                <strong>Pemilik:</strong> {selectedShop.Owner?.name || 'N/A'}
              </p>
            </div>

            <div style={{
              padding: 16,
              backgroundColor: '#FEF2F2',
              border: '1px solid #EF4444',
              borderRadius: 8,
              marginBottom: 24
            }}>
              <p style={{ margin: 0, fontSize: 14, color: '#991B1B', fontWeight: 600 }}>
                ⚠️ Tindakan ini akan:
              </p>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: 20, fontSize: 14, color: '#991B1B' }}>
                <li>Menghapus semua produk di toko ini</li>
                <li>Mengembalikan role pemilik menjadi pembeli</li>
                <li>Tidak bisa dikembalikan</li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={confirmDelete}
                style={{
                  flex: 1,
                  padding: 14,
                  backgroundColor: '#EF4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 15
                }}
              >
                Ya, Hapus Toko
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowDeleteModal(false)}
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

export default AdminShopManagement;
