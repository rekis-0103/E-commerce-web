import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme, DarkModeToggle } from '../context/ThemeContext';
import { motion } from 'framer-motion';

// IMPORT IKON PROFESIONAL
import { FaArrowLeft, FaBoxOpen, FaCreditCard, FaCloudUploadAlt, FaCheckCircle, FaTruck, FaClock } from 'react-icons/fa';
import { MdOutlinePayment } from 'react-icons/md';

function OrderHistory() {
  const { theme } = useTheme();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [paymentMethods, setPaymentMethods] = useState({});

  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) navigate('/login');
    else fetchOrders();
  }, [navigate, token]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/user/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data.data || []);
      setIsLoading(false);
    } catch (error) {
      console.error("Gagal mengambil histori pesanan");
      setIsLoading(false);
    }
  };

  const handleMethodChange = (orderId, method) => {
    setPaymentMethods({ ...paymentMethods, [orderId]: method });
  };

  const handleFileChange = (orderId, e) => {
    setSelectedFiles({ ...selectedFiles, [orderId]: e.target.files[0] });
  };

  const handleUploadProof = async (orderId) => {
    const file = selectedFiles[orderId];
    if (!file) {
      alert("Pilih file gambar bukti transfer terlebih dahulu!");
      return;
    }
    const formData = new FormData();
    formData.append('payment_proof', file);
    try {
      await axios.post(`http://localhost:3000/api/user/orders/${orderId}/pay`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert("✅ Bukti pembayaran berhasil dikirim!");
      fetchOrders();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal mengunggah bukti");
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Menunggu Pembayaran': return { bg: '#FEF3C7', text: '#D97706', icon: <FaClock /> };
      case 'Menunggu Konfirmasi': return { bg: '#DBEAFE', text: '#2563EB', icon: <MdOutlinePayment /> };
      case 'Diproses': return { bg: '#E0E7FF', text: '#4F46E5', icon: <FaBoxOpen /> };
      case 'Dikirim': return { bg: '#D1FAE5', text: '#059669', icon: <FaTruck /> };
      case 'Selesai': return { bg: '#DCFCE7', text: '#16A34A', icon: <FaCheckCircle /> };
      default: return { bg: theme.bg, text: theme.textSecondary, icon: null };
    }
  };

  if (isLoading) return (
    <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: theme.bg, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <h2 style={{ color: theme.textSecondary }}>Memuat Pesanan...</h2>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: theme.bg, minHeight: '100vh', padding: '40px 20px', transition: 'all 0.3s ease' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 30 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
            <Link to="/home" style={{ textDecoration: 'none', color: theme.primary, fontWeight: 600, fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <FaArrowLeft /> Kembali Berbelanja
            </Link>
            <DarkModeToggle />
          </div>
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ fontSize: 36, fontWeight: 800, margin: 0, color: theme.text, fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.5px' }}
          >
            Histori Belanja Saya
          </motion.h2>
        </div>

        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              textAlign: 'center',
              padding: 60,
              backgroundColor: theme.cardBg,
              borderRadius: 24,
              boxShadow: theme.shadow,
              border: `1px solid ${theme.border}`
            }}
          >
            <FaBoxOpen style={{ fontSize: 60, color: theme.textSecondary, marginBottom: 20 }} />
            <h3 style={{ margin: '0 0 20px 0', color: theme.textSecondary }}>Belum ada pesanan saat ini.</h3>
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
                display: 'inline-flex',
                gap: 8
              }}
            >
              Mulai Belanja Sekarang
            </motion.button>
          </motion.div>
        ) : (
          <div>
            {orders.map((order, orderIdx) => {
              const statusData = getStatusStyle(order.status);
              const selectedMethod = paymentMethods[order.id];

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: orderIdx * 0.1 }}
                  style={{
                    backgroundColor: theme.cardBg,
                    borderRadius: 20,
                    marginBottom: 24,
                    boxShadow: theme.shadow,
                    overflow: 'hidden',
                    border: `1px solid ${theme.border}`
                  }}
                >
                  {/* Card Header */}
                  <div style={{
                    backgroundColor: theme.bg,
                    padding: '20px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: `1px solid ${theme.border}`
                  }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: theme.text }}>
                        Pesanan #{order.id}
                      </h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: 13, color: theme.textSecondary, fontWeight: 500 }}>
                        {order.created_at}
                      </p>
                    </div>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 14px',
                      borderRadius: 9999,
                      fontSize: 13,
                      fontWeight: 700,
                      backgroundColor: statusData.bg,
                      color: statusData.text
                    }}>
                      {statusData.icon} {order.status}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: 24 }}>
                    {order.items.map((item, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingBottom: index === order.items.length - 1 ? 0 : 16,
                        marginBottom: index === order.items.length - 1 ? 0 : 16,
                        borderBottom: index === order.items.length - 1 ? 'none' : `1px dashed ${theme.border}`
                      }}>
                        <div>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: 16, fontWeight: 600, color: theme.text }}>
                            {item.product_name}
                          </h4>
                          <p style={{ margin: 0, fontSize: 14, color: theme.textSecondary }}>
                            {item.quantity} barang x Rp {item.price.toLocaleString('id-ID')}
                          </p>
                        </div>
                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: theme.text }}>
                          Rp {(item.quantity * item.price).toLocaleString('id-ID')}
                        </h4>
                      </div>
                    ))}
                  </div>

                  {/* Card Footer */}
                  <div style={{
                    backgroundColor: theme.bg,
                    padding: 24,
                    borderTop: `1px solid ${theme.border}`,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 20,
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ flex: '1 1 300px' }}>
                      <p style={{ margin: '0 0 6px 0', fontSize: 12, fontWeight: 700, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Dikirim Ke:
                      </p>
                      <p style={{ margin: 0, fontSize: 14, color: theme.text, lineHeight: 1.6 }}>
                        {order.shipping_address}
                      </p>
                    </div>

                    <div style={{ flex: '1 1 300px', textAlign: 'right' }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: 14, color: theme.textSecondary }}>
                        Total Tagihan
                      </p>
                      <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#E11D48' }}>
                        Rp {order.total_amount.toLocaleString('id-ID')}
                      </h2>

                      {order.status === 'Menunggu Pembayaran' && (
                        <div style={{
                          marginTop: 16,
                          backgroundColor: theme.cardBg,
                          padding: 16,
                          borderRadius: 12,
                          border: `1px solid ${theme.border}`,
                          textAlign: 'left'
                        }}>
                          <p style={{ margin: '0 0 8px 0', fontSize: 13, fontWeight: 700, color: theme.text }}>
                            Metode Pembayaran
                          </p>
                          <select
                            value={selectedMethod || ''}
                            onChange={(e) => handleMethodChange(order.id, e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px 14px',
                              borderRadius: 8,
                              border: `1px solid ${theme.border}`,
                              fontSize: 14,
                              fontWeight: 600,
                              color: theme.text,
                              backgroundColor: theme.inputBg,
                              marginBottom: 12,
                              outline: 'none'
                            }}
                          >
                            <option value="" disabled>-- Pilih Metode --</option>
                            <option value="manual_transfer">💳 Transfer Bank (Manual)</option>
                          </select>

                          {selectedMethod === 'manual_transfer' && (
                            <div style={{
                              borderTop: `1px solid ${theme.border}`,
                              paddingTop: 12,
                              marginTop: 4
                            }}>
                              <p style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 8 }}>
                                Silakan Upload Bukti Transfer:
                              </p>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(order.id, e)}
                                style={{ display: 'block', width: '100%', fontSize: 13, color: theme.textSecondary, marginBottom: 12 }}
                              />
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleUploadProof(order.id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 8,
                                  width: '100%',
                                  padding: 12,
                                  backgroundColor: '#10B981',
                                  color: '#FFF',
                                  border: 'none',
                                  borderRadius: 8,
                                  fontSize: 15,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                                }}
                              >
                                <FaCloudUploadAlt style={{ fontSize: 18 }} /> Kirim Bukti Pembayaran
                              </motion.button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderHistory;
