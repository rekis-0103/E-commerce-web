import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme, DarkModeToggle } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaEye } from 'react-icons/fa';

function ShopOrders() {
  const { theme } = useTheme();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  useEffect(() => {
    if (role !== 'seller') navigate('/login');
    else fetchOrders();
  }, [role, navigate]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/seller/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data.data || []);
      setIsLoading(false);
    } catch (error) {
      console.error("Gagal mengambil pesanan masuk");
      setIsLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    if (window.confirm(`Ubah status pesanan menjadi "${newStatus}"?`)) {
      try {
        await axios.put(`http://localhost:3000/api/seller/orders/${orderId}/status`,
          { status: newStatus },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        fetchOrders();
      } catch (error) {
        alert("Gagal memperbarui status");
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Menunggu Pembayaran': return { bg: '#FEF3C7', text: '#856404' };
      case 'Menunggu Konfirmasi': return { bg: '#DBEAFE', text: '#004085' };
      case 'Diproses': return { bg: '#D1ECF1', text: '#0c5460' };
      case 'Dikirim': return { bg: '#D4EDDA', text: '#155724' };
      default: return { bg: theme.bg, text: theme.textSecondary };
    }
  };

  if (isLoading) return (
    <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: theme.bg, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <h2 style={{ color: theme.textSecondary }}>Memuat...</h2>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: theme.bg, minHeight: '100vh', padding: '40px 60px', transition: 'all 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: 32, fontWeight: 800, color: theme.text, margin: 0, fontFamily: "'Poppins', sans-serif" }}
        >
          📋 Daftar Pesanan Masuk
        </motion.h2>
        <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
          <Link to="/dashboard" style={{
            padding: '10px 20px',
            backgroundColor: theme.cardBg,
            color: theme.text,
            textDecoration: 'none',
            borderRadius: 8,
            fontWeight: 600,
            border: `1px solid ${theme.border}`,
            transition: 'all 0.3s ease'
          }}>
            Kembali ke Produk
          </Link>
          <DarkModeToggle />
        </div>
      </div>

      {/* Modal Pop-Up */}
      {selectedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
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
          onClick={() => setSelectedImage(null)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            style={{
              position: 'relative',
              backgroundColor: theme.cardBg,
              padding: 20,
              borderRadius: 12,
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <span
              onClick={() => setSelectedImage(null)}
              style={{
                position: 'absolute',
                top: 10,
                right: 15,
                fontSize: 28,
                fontWeight: 'bold',
                color: theme.text,
                cursor: 'pointer',
                lineHeight: 1
              }}
            >
              &times;
            </span>
            <img
              src={`http://localhost:3000${selectedImage}`}
              alt="Bukti Pembayaran Besar"
              style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 8 }}
            />
            <p style={{ marginTop: 15, fontWeight: 600, color: theme.textSecondary }}>
              Bukti Pembayaran
            </p>
          </motion.div>
        </motion.div>
      )}

      {orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            textAlign: 'center',
            padding: 50,
            backgroundColor: theme.cardBg,
            borderRadius: 16,
            boxShadow: theme.shadow,
            border: `1px solid ${theme.border}`
          }}
        >
          <h3 style={{ color: theme.textSecondary }}>Belum ada pesanan masuk.</h3>
        </motion.div>
      ) : (
        <div>
          {orders.map((order, idx) => {
            const statusStyle = getStatusColor(order.status);

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                style={{
                  backgroundColor: theme.cardBg,
                  borderRadius: 16,
                  padding: 25,
                  marginBottom: 25,
                  boxShadow: theme.shadow,
                  border: `1px solid ${theme.border}`
                }}
              >
                {/* Card Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: `1px solid ${theme.border}`,
                  paddingBottom: 15,
                  marginBottom: 15
                }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: theme.text }}>
                      ID Pesanan: #{order.id}
                    </h3>
                    <p style={{ margin: '5px 0 0 0', color: theme.textSecondary }}>
                      {order.created_at}
                    </p>
                  </div>
                  <div style={{
                    padding: '6px 12px',
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 'bold',
                    backgroundColor: statusStyle.bg,
                    color: statusStyle.text
                  }}>
                    {order.status}
                  </div>
                </div>

                {/* Content */}
                <div style={{ display: 'flex', gap: 40 }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ marginBottom: 10, color: theme.text }}>Rincian:</h4>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      {order.items.map((item, idx) => (
                        <li key={idx} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '5px 0',
                          color: theme.text
                        }}>
                          <span>{item.quantity}x {item.product_name}</span>
                          <strong>Rp {(item.quantity * item.price).toLocaleString('id-ID')}</strong>
                        </li>
                      ))}
                    </ul>
                    <h3 style={{ color: '#EF4444', textAlign: 'right', marginTop: 10 }}>
                      Total: Rp {order.total_amount.toLocaleString('id-ID')}
                    </h3>
                  </div>

                  <div style={{ flex: 1, borderLeft: `1px solid ${theme.border}`, paddingLeft: 40 }}>
                    <h4 style={{ marginBottom: 10, color: theme.text }}>Bukti Bayar & Tujuan:</h4>
                    <div style={{ display: 'flex', gap: 20 }}>
                      {order.payment_proof ? (
                        <motion.img
                          whileHover={{ scale: 1.05 }}
                          src={`http://localhost:3000${order.payment_proof}`}
                          alt="Bukti"
                          style={{
                            width: 100,
                            height: 100,
                            objectFit: 'cover',
                            borderRadius: 8,
                            border: `1px solid ${theme.border}`,
                            cursor: 'zoom-in'
                          }}
                          onClick={() => setSelectedImage(order.payment_proof)}
                          title="Klik untuk perbesar"
                        />
                      ) : (
                        <div style={{
                          width: 100,
                          height: 100,
                          backgroundColor: theme.bg,
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          color: theme.textSecondary,
                          textAlign: 'center',
                          border: `1px solid ${theme.border}`
                        }}>
                          Belum Dibayar
                        </div>
                      )}
                      <p style={{ lineHeight: 1.5, color: theme.textSecondary, margin: 0, flex: 1 }}>
                        {order.shipping_address}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 20,
                  paddingTop: 15,
                  borderTop: `1px solid ${theme.border}`,
                  backgroundColor: theme.bg,
                  padding: 15,
                  borderRadius: 8
                }}>
                  <span style={{ fontWeight: 600, color: theme.textSecondary }}>Tindakan:</span>
                  <div>
                    {order.status === 'Menunggu Pembayaran' && (
                      <span style={{ color: '#D97706', fontWeight: 600 }}>
                        ⏳ Menunggu pembeli transfer...
                      </span>
                    )}
                    {order.status === 'Menunggu Konfirmasi' && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => updateStatus(order.id, 'Diproses')}
                        style={{
                          padding: '10px 20px',
                          backgroundColor: '#2563EB',
                          color: 'white',
                          border: 'none',
                          borderRadius: 8,
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        Bukti Valid! Proses Pesanan
                      </motion.button>
                    )}
                    {order.status === 'Diproses' && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => updateStatus(order.id, 'Dikirim')}
                        style={{
                          padding: '10px 20px',
                          backgroundColor: '#10B981',
                          color: 'white',
                          border: 'none',
                          borderRadius: 8,
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        Kirim Barang (Input Resi)
                      </motion.button>
                    )}
                    {order.status === 'Dikirim' && (
                      <span style={{ color: '#10B981', fontWeight: 600 }}>
                        Barang dalam perjalanan 🚚
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ShopOrders;
