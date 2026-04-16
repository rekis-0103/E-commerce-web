import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme, DarkModeToggle } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { FaShoppingCart, FaUser, FaSignOutAlt, FaBox, FaHome, FaTruck } from 'react-icons/fa';

function Home() {
  const { theme, darkMode } = useTheme();
  const [products, setProducts] = useState([]);
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  const role = localStorage.getItem('role');
  const token = localStorage.getItem('token');

  useEffect(() => {
    // Redirect admin ke dashboard admin
    if (role === 'admin') {
      navigate('/admin/dashboard');
      return;
    }
    
    // Redirect courier ke delivery hub management
    if (role === 'courier') {
      navigate('/delivery-hub');
      return;
    }
    
    // Redirect warehouse staff ke warehouse management
    if (role === 'warehouse_staff') {
      navigate('/warehouse-management');
      return;
    }

    const fetchAllProducts = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/products');
        setProducts(response.data.data || []);
      } catch (error) {
        console.error("Gagal memuat produk", error);
      }
    };
    fetchAllProducts();

    // Ambil nama user dari profil
    if (token) {
      axios.get('http://localhost:3000/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        const fullName = res.data.data.name || '';
        // Ambil kata pertama saja
        setUserName(fullName.split(' ')[0]);
      }).catch(() => {});
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const getParsedImages = (imageString) => {
    try {
      return JSON.parse(imageString || "[]");
    } catch {
      return [];
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: theme.bg, minHeight: '100vh', transition: 'all 0.3s ease' }}>
      {/* Navbar */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '15px 60px',
        backgroundColor: theme.cardBg,
        alignItems: 'center',
        boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        borderBottom: `1px solid ${theme.border}`
      }}>
        <h2 style={{
          margin: 0,
          fontSize: 28,
          fontWeight: 800,
          fontFamily: "'Poppins', sans-serif",
          background: 'linear-gradient(135deg, #2563EB, #1E40AF)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          cursor: 'pointer'
        }} onClick={() => navigate('/home')}>
          E-Commerce
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <DarkModeToggle />

          {token ? (
            <>
              <span style={{ fontSize: 15, color: theme.textSecondary, fontWeight: 500 }}>
                Halo, {userName || (role === 'buyer' ? 'Pembeli' : role === 'seller' ? 'Penjual' : 'Admin')}
              </span>

              {role === 'seller' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/dashboard')}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: theme.cardBg,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 25,
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 14,
                    color: theme.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.3s ease'
                  }}
                >
                  <FaBox /> Dashboard
                </motion.button>
              )}

              {role === 'buyer' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/seller-registration')}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#10B981',
                    border: 'none',
                    borderRadius: 25,
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 14,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.3s ease'
                  }}
                >
                  <FaBox /> Jadi Penjual
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/profile')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: theme.cardBg,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 25,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                  color: theme.text,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.3s ease'
                }}
              >
                <FaUser /> Profil
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/orders')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: theme.cardBg,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 25,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                  color: theme.text,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.3s ease'
                }}
              >
                📦 Pesanan
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/tracking')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: theme.cardBg,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 25,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                  color: theme.text,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.3s ease'
                }}
              >
                <FaTruck /> Tracking
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/cart')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: theme.primary,
                  border: 'none',
                  borderRadius: 25,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.3s ease'
                }}
              >
                <FaShoppingCart /> Keranjang
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#EF4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: 25,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.3s ease'
                }}
              >
                <FaSignOutAlt /> Logout
              </motion.button>
            </>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/login')}
              style={{
                padding: '10px 25px',
                backgroundColor: theme.primary,
                color: 'white',
                border: 'none',
                borderRadius: 25,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14,
                transition: 'all 0.3s ease'
              }}
            >
              Login
            </motion.button>
          )}
        </div>
      </nav>

      {/* Content */}
      <div style={{ padding: '60px' }}>
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            fontSize: 36,
            marginBottom: 10,
            fontWeight: 800,
            fontFamily: "'Poppins', sans-serif",
            color: theme.text
          }}
        >
          Pilihan Terbaik
        </motion.h2>
        <p style={{
          color: theme.textSecondary,
          marginBottom: 40,
          fontSize: 16
        }}>
          Klik produk untuk melihat detail dan membeli.
        </p>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 30
        }}>
          {products.length === 0 ? (
            <p style={{ color: theme.textSecondary, fontSize: 16 }}>Belum ada produk.</p>
          ) : null}

          {products.map((product) => {
            const images = getParsedImages(product.image);
            const mainImage = images.length > 0 ? `http://localhost:3000${images[0]}` : null;

            return (
              <motion.div
                key={product.ID}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -5 }}
                onClick={() => navigate(`/product/${product.ID}`)}
                style={{
                  width: 280,
                  backgroundColor: theme.cardBg,
                  padding: 20,
                  borderRadius: 16,
                  boxShadow: theme.shadow,
                  border: `1px solid ${theme.border}`,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{
                  width: '100%',
                  height: 210,
                  backgroundColor: theme.bg,
                  marginBottom: 15,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  {mainImage ? (
                    <img
                      src={mainImage}
                      alt={product.name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <span style={{ color: theme.textSecondary }}>No Image</span>
                  )}
                </div>
                <h3 style={{
                  margin: '0 0 5px 0',
                  fontSize: 18,
                  fontWeight: 700,
                  color: theme.text,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {product.name}
                </h3>
                <h4 style={{
                  margin: 'auto 0 0 0',
                  fontSize: 20,
                  fontWeight: 800,
                  color: '#10B981'
                }}>
                  Rp {product.price.toLocaleString('id-ID')}
                </h4>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Home;
