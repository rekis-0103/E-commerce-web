import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useTheme, DarkModeToggle } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { FaStore, FaArrowLeft, FaSignOutAlt, FaClock, FaCheckCircle } from 'react-icons/fa';

function SellerRegistration() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [shopName, setShopName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [existingShop, setExistingShop] = useState(null);
  const [canReapply, setCanReapply] = useState(false);

  useEffect(() => {
    if (role !== 'buyer') {
      navigate('/home');
      return;
    }
    checkExistingShop();
  }, [role, navigate]);

  const checkExistingShop = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Cek apakah user sudah punya shop
      const shopResponse = await axios.get('http://localhost:3000/api/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error("Error checking shop", error);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!shopName || !description) {
      alert("Nama toko dan deskripsi wajib diisi!");
      return;
    }

    setIsLoading(true);
    try {
      await axios.post('http://localhost:3000/api/user/shop/register', {
        shop_name: shopName,
        description: description
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("✅ Pengajuan toko berhasil! Menunggu persetujuan Admin.");
      navigate('/home');
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Gagal mengajukan pendaftaran toko";
      const daysLeft = error.response?.data?.can_reapply_after_days;
      const reapplyAt = error.response?.data?.can_reapply_at;

      if (daysLeft) {
        alert(`⏰ ${errorMsg}\n\n⏳ Bisa mendaftar lagi dalam ${daysLeft} hari\n📅 Tanggal: ${reapplyAt}`);
      } else {
        alert(errorMsg);
      }
    }
    setIsLoading(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

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
          <Link to="/home">
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
            <FaStore style={{ marginRight: 10, color: '#10B981' }} />
            Daftar Jadi Penjual
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

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          backgroundColor: theme.cardBg,
          padding: 24,
          borderRadius: 16,
          marginBottom: 32,
          boxShadow: theme.shadow,
          border: `1px solid ${theme.border}`,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 16
        }}
      >
        <FaClock style={{ fontSize: 32, color: '#F59E0B', flexShrink: 0, marginTop: 4 }} />
        <div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 700, color: theme.text }}>
            Informasi Penting
          </h3>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: theme.textSecondary, lineHeight: 1.8 }}>
            <li>Pengajuan toko Anda akan direview oleh Admin</li>
            <li>Proses approval biasanya memakan waktu 1-3 hari kerja</li>
            <li>Jika ditolak, Anda bisa mengajukan lagi setelah <strong>1 bulan</strong></li>
            <li>Setelah disetujui, Anda akan mendapat role <strong>Seller</strong></li>
            <li>Anda bisa mulai menjual produk setelah toko disetujui</li>
          </ul>
        </div>
      </motion.div>

      {/* Registration Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          backgroundColor: theme.cardBg,
          padding: 40,
          borderRadius: 20,
          boxShadow: theme.shadow,
          border: `1px solid ${theme.border}`,
          maxWidth: 600
        }}
      >
        <h3 style={{ margin: '0 0 32px 0', fontSize: 24, fontWeight: 700, color: theme.text, textAlign: 'center' }}>
          <FaCheckCircle style={{ marginRight: 10, color: '#10B981' }} />
          Formulir Pendaftaran Toko
        </h3>

        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: theme.text }}>
              Nama Toko *
            </label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Contoh: Toko Elektronik Jakarta"
              style={{
                width: '100%',
                padding: 14,
                borderRadius: 10,
                border: `2px solid ${theme.border}`,
                background: theme.inputBg,
                color: theme.text,
                fontSize: 15,
                transition: 'all 0.3s ease'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: 32 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: theme.text }}>
              Deskripsi Toko *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ceritakan tentang toko Anda dan produk yang dijual..."
              style={{
                width: '100%',
                padding: 14,
                borderRadius: 10,
                border: `2px solid ${theme.border}`,
                background: theme.inputBg,
                color: theme.text,
                fontSize: 15,
                minHeight: 150,
                fontFamily: 'inherit',
                resize: 'vertical',
                transition: 'all 0.3s ease'
              }}
              required
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: 16,
              backgroundColor: '#10B981',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              fontSize: 16,
              opacity: isLoading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10
            }}
          >
            {isLoading ? (
              <>
                <span style={{
                  display: 'inline-block',
                  width: 20,
                  height: 20,
                  border: '3px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '50%',
                  borderTopColor: 'white',
                  animation: 'spin 0.8s linear infinite'
                }} />
                Memproses...
              </>
            ) : (
              <>
                <FaStore /> Ajukan Pendaftaran Toko
              </>
            )}
          </motion.button>
        </form>

        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: theme.textSecondary }}>
          Dengan mendaftar, Anda menyetujui syarat dan ketentuan platform kami
        </p>
      </motion.div>
    </div>
  );
}

export default SellerRegistration;
