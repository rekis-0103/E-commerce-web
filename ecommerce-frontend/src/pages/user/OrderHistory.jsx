import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme, DarkModeToggle } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

// IMPORT IKON PROFESIONAL
import { FaArrowLeft, FaBoxOpen, FaCreditCard, FaCloudUploadAlt, FaCheckCircle, FaTruck, FaClock, FaShippingFast, FaWallet, FaShieldAlt, FaTimes } from 'react-icons/fa';
import { MdOutlinePayment } from 'react-icons/md';

const API = 'http://localhost:3000/api';

function OrderHistory() {
  const { theme } = useTheme();
  const [orders, setOrders] = useState([]);
  const [shipments, setShipments] = useState({});
  const [wallet, setWallet] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [paymentMethods, setPaymentMethods] = useState({});
  
  // State PIN Modal
  const [payOrder, setPayOrder] = useState(null);
  const [pin, setPin] = useState('');
  const [isPaying, setIsPaying] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) navigate('/login');
    else {
      fetchOrders();
      fetchShipments();
      fetchWallet();
    }
  }, [navigate, token]);

  const fetchWallet = async () => {
    try {
      const res = await axios.get(`${API}/user/wallet`, { headers });
      setWallet(res.data.wallet);
    } catch (err) {}
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/user/orders`, { headers });
      setOrders(response.data.data || []);
      setIsLoading(false);
    } catch (error) {
      console.error("Gagal mengambil histori pesanan");
      setIsLoading(false);
    }
  };

  const fetchShipments = async () => {
    try {
      const response = await axios.get(`${API}/buyer/shipments`, { headers });
      const shipmentMap = {};
      (response.data.data || []).forEach(s => {
        shipmentMap[s.order_id] = s;
      });
      setShipments(shipmentMap);
    } catch (error) {
      console.error("Gagal mengambil data pengiriman");
    }
  };

  const handleConfirmReceived = async (trackingNumber) => {
    if (!window.confirm('Konfirmasi bahwa paket sudah Anda terima?')) return;
    try {
      await axios.post(`${API}/buyer/shipments/confirm/${trackingNumber}`, {}, { headers });
      alert('✅ Terima kasih! Pesanan telah dikonfirmasi diterima.');
      fetchOrders();
      fetchShipments();
      fetchWallet(); // Update saldo barangkali ada pengembalian
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal konfirmasi penerimaan');
    }
  };

  const handleAkanePay = async (e) => {
    e.preventDefault();
    if (pin.length !== 6) return;
    setIsPaying(true);
    try {
      await axios.post(`${API}/user/wallet/pay`, {
        order_id: payOrder.id,
        pin: pin
      }, { headers });
      alert("✅ Pembayaran Akane Pay Berhasil!");
      setPayOrder(null);
      setPin('');
      fetchOrders();
      fetchWallet();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal melakukan pembayaran");
    } finally {
      setIsPaying(false);
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
      await axios.post(`${API}/user/orders/${orderId}/pay`, formData, {
        headers: {
          ...headers,
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
      case 'Menunggu Konfirmasi Diterima': return { bg: '#FFF7ED', text: '#EA580C', icon: <FaTruck /> };
      case 'Diterima': return { bg: '#D1FAE5', text: '#059669', icon: <FaCheckCircle /> };
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
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: 60, backgroundColor: theme.cardBg, borderRadius: 24, boxShadow: theme.shadow, border: `1px solid ${theme.border}` }}>
            <FaBoxOpen style={{ fontSize: 60, color: theme.textSecondary, marginBottom: 20 }} />
            <h3 style={{ margin: '0 0 20px 0', color: theme.textSecondary }}>Belum ada pesanan saat ini.</h3>
            <button onClick={() => navigate('/home')} style={{ padding: '12px 30px', backgroundColor: theme.primary, color: 'white', border: 'none', borderRadius: 25, cursor: 'pointer', fontWeight: 600 }}>Mulai Belanja Sekarang</button>
          </motion.div>
        ) : (
          <div>
            {orders.map((order, orderIdx) => {
              const statusData = getStatusStyle(order.status);
              const selectedMethod = paymentMethods[order.id];

              return (
                <motion.div key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: orderIdx * 0.1 }} style={{ backgroundColor: theme.cardBg, borderRadius: 20, marginBottom: 24, boxShadow: theme.shadow, overflow: 'hidden', border: `1px solid ${theme.border}` }}>
                  {/* Card Header */}
                  <div style={{ backgroundColor: theme.bg, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.border}` }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: theme.text }}>Pesanan #{order.id}</h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: 13, color: theme.textSecondary }}>{new Date(order.created_at).toLocaleString('id-ID')}</p>
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 9999, fontSize: 13, fontWeight: 700, backgroundColor: statusData.bg, color: statusData.text }}>{statusData.icon} {order.status}</div>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: 24 }}>
                    {order.items.map((item, index) => (
                      <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: index === order.items.length - 1 ? 0 : 16, marginBottom: index === order.items.length - 1 ? 0 : 16, borderBottom: index === order.items.length - 1 ? 'none' : `1px dashed ${theme.border}` }}>
                        <div><h4 style={{ margin: '0 0 4px 0', fontSize: 16, color: theme.text }}>{item.product_name}</h4><p style={{ margin: 0, fontSize: 14, color: theme.textSecondary }}>{item.quantity} barang x Rp {item.price.toLocaleString('id-ID')}</p></div>
                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: theme.text }}>Rp {(item.quantity * item.price).toLocaleString('id-ID')}</h4>
                      </div>
                    ))}
                  </div>

                  {/* Card Footer */}
                  <div style={{ backgroundColor: theme.bg, padding: 24, borderTop: `1px solid ${theme.border}`, display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'space-between' }}>
                    <div style={{ flex: '1 1 300px' }}><p style={{ margin: '0 0 6px 0', fontSize: 12, fontWeight: 700, color: theme.textSecondary }}>DIKIRIM KE:</p><p style={{ margin: 0, fontSize: 14, color: theme.text }}>{order.shipping_address}</p></div>
                    <div style={{ flex: '1 1 300px', textAlign: 'right' }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: 14, color: theme.textSecondary }}>Total Tagihan</p>
                      <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#E11D48' }}>Rp {order.total_amount.toLocaleString('id-ID')}</h2>

                      {/* Payment Options */}
                      {order.status === 'Menunggu Pembayaran' && (
                        <div style={{ marginTop: 16, backgroundColor: theme.cardBg, padding: 16, borderRadius: 12, border: `1px solid ${theme.border}`, textAlign: 'left' }}>
                          <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: theme.text }}>Metode Pembayaran</p>
                          <select value={selectedMethod || ''} onChange={(e) => handleMethodChange(order.id, e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, marginBottom: 12 }}>
                            <option value="" disabled>-- Pilih Metode --</option>
                            <option value="akane_pay">✨ Akane Pay (Saldo: Rp {wallet?.balance.toLocaleString('id-ID')})</option>
                            <option value="manual_transfer">💳 Transfer Bank (Manual)</option>
                          </select>

                          {selectedMethod === 'akane_pay' && (
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                if (wallet.balance < order.total_amount) { alert("Saldo Akane Pay tidak cukup!"); return; }
                                if (!wallet.is_active) { alert("Aktifkan Akane Pay dulu di menu dompet!"); navigate('/akanepay'); return; }
                                setPayOrder(order);
                              }}
                              style={{ width: '100%', padding: 12, background: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                              <FaWallet /> Bayar Sekarang
                            </motion.button>
                          )}

                          {selectedMethod === 'manual_transfer' && (
                            <div>
                              <input type="file" accept="image/*" onChange={(e) => handleFileChange(order.id, e)} style={{ width: '100%', fontSize: 13, marginBottom: 12 }} />
                              <button onClick={() => handleUploadProof(order.id)} style={{ width: '100%', padding: 12, background: '#10B981', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700 }}><FaCloudUploadAlt /> Kirim Bukti</button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Info Resi */}
                      {(order.status === 'Dikirim' || order.status === 'Selesai' || order.status === 'Menunggu Konfirmasi Diterima' || order.status === 'Diterima') && shipments[order.id] && (
                        <div style={{ marginTop: 12 }}>
                          <p style={{ fontSize: 12, color: theme.textSecondary }}>No. Resi: <strong style={{ color: theme.primary }}>{shipments[order.id].tracking_number}</strong></p>
                          <Link to="/tracking" style={{ fontSize: 12, color: '#3B82F6', fontWeight: 700 }}>Lacak Paket</Link>
                        </div>
                      )}

                      {/* Konfirmasi Terima */}
                      {shipments[order.id]?.current_status === 'Menunggu Konfirmasi Diterima' && (
                        <button onClick={() => handleConfirmReceived(shipments[order.id].tracking_number)} style={{ marginTop: 16, width: '100%', padding: '12px', background: '#10B981', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700 }}>Konfirmasi Terima Paket</button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL PIN AKANE PAY */}
      <AnimatePresence>
        {payOrder && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: 20 }}>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ backgroundColor: theme.cardBg, padding: 32, borderRadius: 24, width: '100%', maxWidth: 400, textAlign: 'center' }}>
               <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: -10 }}>
                  <button onClick={() => setPayOrder(null)} style={{ background: 'none', border: 'none', color: theme.textSecondary }}><FaTimes /></button>
               </div>
               <FaShieldAlt style={{ fontSize: 48, color: '#6366F1', marginBottom: 16 }} />
               <h3 style={{ color: theme.text, margin: 0 }}>Konfirmasi Pembayaran</h3>
               <p style={{ color: theme.textSecondary, fontSize: 14 }}>Membayar Pesanan #{payOrder.id} sebesar <strong>Rp {payOrder.total_amount.toLocaleString('id-ID')}</strong></p>
               <form onSubmit={handleAkanePay} style={{ marginTop: 24 }}>
                  <input type="password" maxLength="6" value={pin} onChange={e => setPin(e.target.value.replace(/[^0-9]/g, ''))} placeholder="PIN 6 Digit" style={{ width: '100%', padding: 16, borderRadius: 12, border: `2px solid ${theme.border}`, background: theme.inputBg, color: theme.text, textAlign: 'center', fontSize: 24, letterSpacing: 8, marginBottom: 24 }} required />
                  <button type="submit" disabled={isPaying} style={{ width: '100%', padding: 16, background: theme.gradient, color: 'white', border: 'none', borderRadius: 12, fontWeight: 700 }}>{isPaying ? "Memproses..." : "Konfirmasi & Bayar"}</button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default OrderHistory;
