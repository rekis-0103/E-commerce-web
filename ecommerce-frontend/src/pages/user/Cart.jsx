import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme, DarkModeToggle } from '../../context/ThemeContext';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaShoppingCart, FaTrash, FaMinus, FaPlus } from 'react-icons/fa';

function Cart() {
  const { theme } = useTheme();
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userAddress, setUserAddress] = useState('');

  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchProfileAndCart();
  }, [navigate, token]);

  const fetchProfileAndCart = async () => {
    try {
      const profileRes = await axios.get('http://localhost:3000/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const address = profileRes.data.data.address || '';
      setUserAddress(address);

      const cartRes = await axios.get('http://localhost:3000/api/user/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCartItems(cartRes.data.data || []);
      setIsLoading(false);
    } catch (error) {
      console.error("Gagal mengambil data", error);
      setIsLoading(false);
    }
  };

  const updateQuantity = async (cartId, currentQty, change) => {
    const newQty = currentQty + change;
    if (newQty < 1) return;

    try {
      await axios.put(`http://localhost:3000/api/user/cart/${cartId}`,
        { quantity: newQty },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchProfileAndCart();
    } catch (error) {
      alert("Gagal memperbarui jumlah");
    }
  };

  const removeItem = async (cartId) => {
    if (window.confirm("Hapus item ini dari keranjang?")) {
      try {
        await axios.delete(`http://localhost:3000/api/user/cart/${cartId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchProfileAndCart();
      } catch (error) {
        alert("Gagal menghapus item");
      }
    }
  };

  const handleCheckout = async () => {
    if (!userAddress.trim()) {
      if (window.confirm("Alamat pengiriman belum diisi. Isi alamat di halaman profil sekarang?")) {
        navigate('/profile');
      }
      return;
    }

    try {
      const response = await axios.post('http://localhost:3000/api/user/checkout',
        { shipping_address: userAddress },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('🎉 ' + response.data.message);
      navigate('/orders');
    } catch (error) {
      if (error.response) {
        alert(error.response.data.message);
      } else {
        alert('Terjadi kesalahan saat memproses pesanan.');
      }
    }
  };

  const grandTotal = cartItems.reduce((sum, item) => sum + item.total, 0);

  if (isLoading) return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: theme.bg, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <h2 style={{ color: theme.textSecondary }}>Memuat Keranjang...</h2>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: theme.bg, minHeight: '100vh', padding: '40px 60px', transition: 'all 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <Link to="/home" style={{ textDecoration: 'none', color: theme.primary, fontWeight: 600, fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <FaArrowLeft /> Kembali Berbelanja
        </Link>
        <DarkModeToggle />
      </div>

      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ fontSize: 36, fontWeight: 800, marginBottom: 40, color: theme.text, fontFamily: "'Poppins', sans-serif" }}
      >
        Keranjang Belanja
      </motion.h2>

      {cartItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            textAlign: 'center',
            padding: 80,
            backgroundColor: theme.cardBg,
            borderRadius: 24,
            boxShadow: theme.shadow,
            border: `1px solid ${theme.border}`
          }}
        >
          <FaShoppingCart style={{ fontSize: 60, color: theme.textSecondary, marginBottom: 20 }} />
          <h3 style={{ color: theme.textSecondary, marginBottom: 20 }}>Keranjang Anda masih kosong.</h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/home')}
            style={{
              padding: '12px 30px',
              backgroundColor: theme.primary,
              color: 'white',
              border: 'none',
              borderRadius: 25,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 16
            }}
          >
            Mulai Belanja
          </motion.button>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', gap: 40 }}>
          {/* Item List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              flex: 2,
              backgroundColor: theme.cardBg,
              padding: 30,
              borderRadius: 24,
              boxShadow: theme.shadow,
              border: `1px solid ${theme.border}`
            }}
          >
            {cartItems.map((item, index) => (
              <div key={item.cart_id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '25px 0',
                alignItems: 'center',
                borderBottom: index !== cartItems.length - 1 ? `1px solid ${theme.border}` : 'none'
              }}>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', fontSize: 19, fontWeight: 700, color: theme.text }}>
                    {item.name}
                  </h4>
                  <p style={{ margin: 0, color: theme.textSecondary, fontSize: 15 }}>
                    Rp {item.price.toLocaleString('id-ID')}
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => removeItem(item.cart_id)}
                    style={{
                      color: '#EF4444',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      marginTop: 10,
                      fontSize: 14,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <FaTrash /> Hapus Item
                  </motion.button>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 10,
                    backgroundColor: theme.bg,
                    padding: '5px 15px',
                    borderRadius: 20
                  }}>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => updateQuantity(item.cart_id, item.quantity, -1)}
                      style={{
                        padding: '4px 10px',
                        backgroundColor: theme.cardBg,
                        border: `1px solid ${theme.border}`,
                        borderRadius: '50%',
                        cursor: 'pointer',
                        fontSize: 16,
                        color: theme.text,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <FaMinus size={12} />
                    </motion.button>
                    <span style={{ fontWeight: 'bold', fontSize: 16, minWidth: 20, textAlign: 'center', color: theme.text }}>
                      {item.quantity}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => updateQuantity(item.cart_id, item.quantity, 1)}
                      style={{
                        padding: '4px 10px',
                        backgroundColor: theme.cardBg,
                        border: `1px solid ${theme.border}`,
                        borderRadius: '50%',
                        cursor: 'pointer',
                        fontSize: 16,
                        color: theme.text,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <FaPlus size={12} />
                    </motion.button>
                  </div>
                  <h4 style={{ margin: 0, color: '#10B981', fontSize: 20, fontWeight: 800 }}>
                    Rp {item.total.toLocaleString('id-ID')}
                  </h4>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Summary Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              flex: 1,
              backgroundColor: theme.cardBg,
              padding: 30,
              borderRadius: 24,
              height: 'fit-content',
              boxShadow: theme.shadow,
              border: `1px solid ${theme.border}`,
              position: 'sticky',
              top: 100
            }}
          >
            <h3 style={{
              margin: '0 0 25px 0',
              paddingBottom: 15,
              borderBottom: `1px solid ${theme.border}`,
              fontSize: 22,
              fontWeight: 700,
              color: theme.text
            }}>
              Ringkasan
            </h3>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 30,
              fontSize: 19,
              fontWeight: 600,
              color: theme.text
            }}>
              <span>Total Tagihan:</span>
              <span style={{ color: '#EF4444', fontWeight: 800, fontSize: 24 }}>
                Rp {grandTotal.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Address Block */}
            <div style={{
              backgroundColor: theme.bg,
              padding: 20,
              borderRadius: 12,
              marginBottom: 25
            }}>
              <label style={{
                display: 'block',
                marginBottom: 8,
                fontWeight: 'bold',
                fontSize: 13,
                color: theme.textSecondary,
                textTransform: 'uppercase'
              }}>
                Alamat Pengiriman
              </label>
              {userAddress ? (
                <>
                  <p style={{ margin: 0, fontSize: 15, color: theme.text, lineHeight: 1.6 }}>
                    {userAddress}
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => navigate('/profile')}
                    style={{
                      marginTop: 10,
                      background: 'none',
                      border: 'none',
                      color: theme.primary,
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 14,
                      padding: 0
                    }}
                  >
                    ✏️ Ubah Alamat
                  </motion.button>
                </>
              ) : (
                <>
                  <p style={{ margin: 0, fontSize: 15, color: '#EF4444', fontStyle: 'italic' }}>
                    Belum diisi. Silakan isi di halaman profil.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/profile')}
                    style={{
                      marginTop: 15,
                      width: '100%',
                      padding: 12,
                      backgroundColor: '#EF4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: 16,
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: 'pointer'
                    }}
                  >
                    📍 Isi Alamat di Profil
                  </motion.button>
                </>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCheckout}
              disabled={!userAddress}
              style={{
                width: '100%',
                padding: 18,
                backgroundColor: userAddress ? theme.primary : theme.textSecondary,
                color: 'white',
                border: 'none',
                borderRadius: 16,
                fontWeight: 'bold',
                fontSize: 17,
                cursor: userAddress ? 'pointer' : 'not-allowed',
                boxShadow: userAddress ? '0 4px 6px rgba(37, 99, 235, 0.3)' : 'none'
              }}
            >
              {userAddress ? '🛒 Beli Sekarang' : 'Isi Alamat Terlebih Dahulu'}
            </motion.button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default Cart;
