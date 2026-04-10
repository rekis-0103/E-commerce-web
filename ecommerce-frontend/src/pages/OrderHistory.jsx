import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State khusus untuk menyimpan file gambar yang dipilih pembeli (per pesanan)
  const [selectedFiles, setSelectedFiles] = useState({});
  
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
      fetchOrders(); // Refresh status pesanan
    } catch (error) {
      alert(error.response?.data?.message || "Gagal mengunggah bukti");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Menunggu Pembayaran': return { bg: '#fff3cd', text: '#856404' };
      case 'Menunggu Konfirmasi': return { bg: '#cce5ff', text: '#004085' };
      case 'Diproses': return { bg: '#d1ecf1', text: '#0c5460' };
      case 'Dikirim': return { bg: '#d4edda', text: '#155724' };
      default: return { bg: '#e2e3e5', text: '#383d41' };
    }
  };

  const styles = {
    // ... (Styles dasar biarkan sama)
    pageBackground: { fontFamily: "'Segoe UI', Roboto, sans-serif", backgroundColor: '#F8F9FA', minHeight: '100vh', padding: '60px' },
    backLink: { textDecoration: 'none', color: '#007bff', fontWeight: '600', fontSize: '16px', display: 'inline-block', marginBottom: '30px' },
    pageTitle: { fontSize: '32px', fontWeight: '800', marginBottom: '40px', color: '#333' },
    orderCard: { backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '25px', marginBottom: '25px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' },
    statusBadge: { padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' },
    itemList: { listStyle: 'none', padding: 0, margin: 0 },
    itemRow: { display: 'flex', justifyContent: 'space-between', padding: '10px 0' },
    cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #eee' },
    
    // Khusus Box Pembayaran
    paymentBox: { backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px dashed #ced4da', marginTop: '10px', textAlign: 'right' },
    uploadBtn: { padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginLeft: '10px' }
  };

  if (isLoading) return <div style={styles.pageBackground}><h2 style={{ textAlign: 'center' }}>Memuat Pesanan...</h2></div>;

  return (
    <div style={styles.pageBackground}>
      <Link to="/home" style={styles.backLink}>← Kembali Berbelanja</Link>
      <h2 style={styles.pageTitle}>Histori Belanja Saya</h2>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px' }}>Belum ada pesanan.</div>
      ) : (
        orders.map((order) => {
          const statusStyle = getStatusColor(order.status);
          return (
            <div key={order.id} style={styles.orderCard}>
              <div style={styles.cardHeader}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px' }}>Pesanan #{order.id}</h3>
                  <p style={{ margin: '5px 0 0 0', color: '#6c757d', fontSize: '14px' }}>{order.created_at}</p>
                </div>
                <div style={{...styles.statusBadge, backgroundColor: statusStyle.bg, color: statusStyle.text}}>
                  {order.status}
                </div>
              </div>

              <ul style={styles.itemList}>
                {order.items.map((item, index) => (
                  <li key={index} style={styles.itemRow}>
                    <span>{item.quantity}x {item.product_name}</span>
                    <strong>Rp {(item.quantity * item.price).toLocaleString('id-ID')}</strong>
                  </li>
                ))}
              </ul>

              <div style={styles.cardFooter}>
                <div style={{ flex: '2', marginRight: '20px' }}>
                  <p style={{ fontSize: '14px', color: '#6c757d', fontWeight: 'bold' }}>Alamat Pengiriman:</p>
                  <p style={{ fontSize: '14px' }}>{order.shipping_address}</p>
                </div>
                
                <div style={{ flex: '1', textAlign: 'right' }}>
                  <p style={{ color: '#6c757d', marginBottom: '5px' }}>Total Belanja</p>
                  <p style={{ fontSize: '22px', fontWeight: '800', color: '#dc3545', margin: 0 }}>Rp {order.total_amount.toLocaleString('id-ID')}</p>
                  
                  {/* UPLOAD BUKTI PEMBAYARAN */}
                  {order.status === 'Menunggu Pembayaran' && (
                    <div style={styles.paymentBox}>
                      <p style={{ fontSize: '12px', color: '#555', marginBottom: '8px' }}>Silakan Upload Bukti Transfer (Gambar):</p>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleFileChange(order.id, e)}
                        style={{ fontSize: '13px', width: '100%', marginBottom: '10px' }}
                      />
                      <button onClick={() => handleUploadProof(order.id)} style={styles.uploadBtn}>
                        Kirim Bukti Pembayaran
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default OrderHistory;