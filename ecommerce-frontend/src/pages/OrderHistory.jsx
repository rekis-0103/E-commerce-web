import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

// IMPORT IKON PROFESIONAL
import { FaArrowLeft, FaBoxOpen, FaCreditCard, FaCloudUploadAlt, FaCheckCircle, FaTruck, FaClock } from 'react-icons/fa';
import { MdOutlinePayment } from 'react-icons/md';

function OrderHistory() {
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

  // Fungsi untuk mendapatkan Ikon & Warna Status
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Menunggu Pembayaran': return { bg: '#FFFBEB', text: '#D97706', icon: <FaClock /> };
      case 'Menunggu Konfirmasi': return { bg: '#EFF6FF', text: '#2563EB', icon: <MdOutlinePayment /> };
      case 'Diproses': return { bg: '#EEF2FF', text: '#4F46E5', icon: <FaBoxOpen /> };
      case 'Dikirim': return { bg: '#ECFDF5', text: '#059669', icon: <FaTruck /> };
      case 'Selesai': return { bg: '#F0FDF4', text: '#16A34A', icon: <FaCheckCircle /> };
      default: return { bg: '#F3F4F6', text: '#4B5563', icon: null };
    }
  };

  // DESAIN INLINE CSS MODERN (GLOW-UP)
  const styles = {
    pageBackground: { fontFamily: "'Inter', 'Segoe UI', sans-serif", backgroundColor: '#F3F4F6', minHeight: '100vh', padding: '40px 20px', color: '#1F2937' },
    container: { maxWidth: '900px', margin: '0 auto' },
    
    headerFlex: { display: 'flex', flexDirection: 'column', marginBottom: '30px' },
    backLink: { display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: '#3B82F6', fontWeight: '600', fontSize: '15px', marginBottom: '15px' },
    pageTitle: { fontSize: '32px', fontWeight: '800', margin: 0, color: '#111827', letterSpacing: '-0.5px' },
    
    emptyCard: { textAlign: 'center', padding: '60px 20px', backgroundColor: '#FFFFFF', borderRadius: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' },
    
    orderCard: { backgroundColor: '#FFFFFF', borderRadius: '20px', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', overflow: 'hidden', border: '1px solid #E5E7EB' },
    cardHeader: { backgroundColor: '#F9FAFB', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB' },
    orderIdText: { margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827' },
    dateText: { margin: '4px 0 0 0', fontSize: '13px', color: '#6B7280', fontWeight: '500' },
    statusBadge: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '9999px', fontSize: '13px', fontWeight: '700' },
    
    cardBody: { padding: '24px' },
    itemRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', marginBottom: '16px', borderBottom: '1px dashed #E5E7EB' },
    itemName: { margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#374151' },
    itemQty: { margin: 0, fontSize: '14px', color: '#6B7280' },
    itemTotal: { margin: 0, fontSize: '16px', fontWeight: '700', color: '#1F2937' },
    
    cardFooter: { backgroundColor: '#F9FAFB', padding: '24px', borderTop: '1px solid #E5E7EB', display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between' },
    addressBlock: { flex: '1 1 300px' },
    addressLabel: { margin: '0 0 6px 0', fontSize: '12px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' },
    addressText: { margin: 0, fontSize: '14px', color: '#4B5563', lineHeight: '1.6' },
    
    paymentBlock: { flex: '1 1 300px', textAlign: 'right' },
    totalLabel: { margin: '0 0 4px 0', fontSize: '14px', color: '#6B7280' },
    totalAmount: { margin: 0, fontSize: '24px', fontWeight: '800', color: '#E11D48' },
    
    actionBox: { marginTop: '16px', backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E5E7EB', textAlign: 'left' },
    inputSelect: { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px', outline: 'none' },
    inputFile: { display: 'block', width: '100%', fontSize: '13px', color: '#6B7280', marginBottom: '12px' },
    btnPrimary: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px', backgroundColor: '#10B981', color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)' }
  };

  if (isLoading) return <div style={styles.pageBackground}><h2 style={{ textAlign: 'center', color: '#9CA3AF' }}>Memuat Pesanan...</h2></div>;

  return (
    <div style={styles.pageBackground}>
      <div style={styles.container}>
        
        <div style={styles.headerFlex}>
          <Link to="/home" style={styles.backLink}>
            <FaArrowLeft /> Kembali Berbelanja
          </Link>
          <h2 style={styles.pageTitle}>Histori Belanja Saya</h2>
        </div>

        {orders.length === 0 ? (
          <div style={styles.emptyCard}>
            <FaBoxOpen style={{ fontSize: '60px', color: '#D1D5DB', marginBottom: '20px' }} />
            <h3 style={{ margin: '0 0 20px 0', color: '#4B5563' }}>Belum ada pesanan saat ini.</h3>
            <button onClick={() => navigate('/home')} style={{...styles.btnPrimary, width: 'auto', padding: '12px 30px', display: 'inline-flex', backgroundColor: '#3B82F6'}}>
              Mulai Belanja Sekarang
            </button>
          </div>
        ) : (
          <div>
            {orders.map((order) => {
              const statusData = getStatusStyle(order.status);
              const selectedMethod = paymentMethods[order.id];

              return (
                <div key={order.id} style={styles.orderCard}>
                  
                  <div style={styles.cardHeader}>
                    <div>
                      <h3 style={styles.orderIdText}>Pesanan #{order.id}</h3>
                      <p style={styles.dateText}>{order.created_at}</p>
                    </div>
                    <div style={{...styles.statusBadge, backgroundColor: statusData.bg, color: statusData.text}}>
                      {statusData.icon} {order.status}
                    </div>
                  </div>

                  <div style={styles.cardBody}>
                    {order.items.map((item, index) => (
                      <div key={index} style={{...styles.itemRow, borderBottom: index === order.items.length - 1 ? 'none' : styles.itemRow.borderBottom, paddingBottom: index === order.items.length - 1 ? 0 : styles.itemRow.paddingBottom, marginBottom: index === order.items.length - 1 ? 0 : styles.itemRow.marginBottom}}>
                        <div>
                          <h4 style={styles.itemName}>{item.product_name}</h4>
                          <p style={styles.itemQty}>{item.quantity} barang x Rp {item.price.toLocaleString('id-ID')}</p>
                        </div>
                        <h4 style={styles.itemTotal}>Rp {(item.quantity * item.price).toLocaleString('id-ID')}</h4>
                      </div>
                    ))}
                  </div>

                  <div style={styles.cardFooter}>
                    <div style={styles.addressBlock}>
                      <p style={styles.addressLabel}>Dikirim Ke:</p>
                      <p style={styles.addressText}>{order.shipping_address}</p>
                    </div>
                    
                    <div style={styles.paymentBlock}>
                      <p style={styles.totalLabel}>Total Tagihan</p>
                      <h2 style={styles.totalAmount}>Rp {order.total_amount.toLocaleString('id-ID')}</h2>
                      
                      {order.status === 'Menunggu Pembayaran' && (
                        <div style={styles.actionBox}>
                          <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '700', color: '#4B5563' }}>Metode Pembayaran</p>
                          <select 
                            value={selectedMethod || ''} 
                            onChange={(e) => handleMethodChange(order.id, e.target.value)}
                            style={styles.inputSelect}
                          >
                            <option value="" disabled>-- Pilih Metode --</option>
                            <option value="manual_transfer">💳 Transfer Bank (Manual)</option>
                          </select>

                          {selectedMethod === 'manual_transfer' && (
                            <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '12px', marginTop: '4px' }}>
                              <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>Silakan Upload Bukti Transfer:</p>
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => handleFileChange(order.id, e)}
                                style={styles.inputFile}
                              />
                              <button onClick={() => handleUploadProof(order.id)} style={styles.btnPrimary}>
                                <FaCloudUploadAlt style={{ fontSize: '18px' }} /> Kirim Bukti Pembayaran
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderHistory;