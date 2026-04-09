import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchOrders();
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

  // Fungsi untuk memberi warna berbeda pada setiap status
  const getStatusColor = (status) => {
    switch (status) {
      case 'Menunggu Pembayaran': return { bg: '#fff3cd', text: '#856404' }; // Kuning
      case 'Diproses': return { bg: '#cce5ff', text: '#004085' }; // Biru
      case 'Dikirim': return { bg: '#d4edda', text: '#155724' }; // Hijau
      default: return { bg: '#e2e3e5', text: '#383d41' }; // Abu-abu
    }
  };

  const styles = {
    pageBackground: { fontFamily: "'Segoe UI', Roboto, sans-serif", backgroundColor: '#F8F9FA', minHeight: '100vh', padding: '60px' },
    backLink: { textDecoration: 'none', color: '#007bff', fontWeight: '600', fontSize: '16px', display: 'inline-block', marginBottom: '30px' },
    pageTitle: { fontSize: '32px', fontWeight: '800', marginBottom: '40px', color: '#333' },
    emptyState: { textAlign: 'center', padding: '80px', backgroundColor: '#FFFFFF', borderRadius: '24px', boxShadow: '0 8px 16px rgba(0,0,0,0.04)' },
    orderCard: { backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '25px', marginBottom: '25px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' },
    orderId: { margin: 0, fontSize: '18px', fontWeight: '700' },
    orderDate: { margin: '5px 0 0 0', color: '#6c757d', fontSize: '14px' },
    statusBadge: { padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' },
    itemList: { listStyle: 'none', padding: 0, margin: 0 },
    itemRow: { display: 'flex', justifyContent: 'space-between', padding: '10px 0' },
    itemName: { margin: 0, fontWeight: '600', color: '#333' },
    itemDetail: { margin: 0, color: '#6c757d', fontSize: '14px' },
    itemPrice: { margin: 0, fontWeight: 'bold' },
    cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #eee' },
    addressWrap: { flex: '2', marginRight: '20px' },
    addressTitle: { margin: '0 0 5px 0', fontSize: '14px', color: '#6c757d', fontWeight: 'bold' },
    addressText: { margin: 0, fontSize: '14px', lineHeight: '1.5', color: '#555' },
    totalWrap: { flex: '1', textAlign: 'right' },
    totalTitle: { margin: '0 0 5px 0', fontSize: '14px', color: '#6c757d' },
    totalAmount: { margin: 0, fontSize: '22px', fontWeight: '800', color: '#dc3545' },
    payBtn: { marginTop: '10px', padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }
  };

  if (isLoading) return <div style={styles.pageBackground}><h2 style={{ textAlign: 'center' }}>Memuat Pesanan...</h2></div>;

  return (
    <div style={styles.pageBackground}>
      <Link to="/home" style={styles.backLink}>← Kembali Berbelanja</Link>
      <h2 style={styles.pageTitle}>Histori Belanja Saya</h2>

      {orders.length === 0 ? (
        <div style={styles.emptyState}>
          <h3 style={{ color: '#6c757d', marginBottom: '20px' }}>Anda belum pernah melakukan pesanan.</h3>
          <button onClick={() => navigate('/home')} style={{ padding: '12px 30px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold' }}>
            Mulai Belanja Sekarang
          </button>
        </div>
      ) : (
        <div>
          {orders.map((order) => {
            const statusStyle = getStatusColor(order.status);
            
            return (
              <div key={order.id} style={styles.orderCard}>
                
                {/* Header: ID, Tanggal, dan Status */}
                <div style={styles.cardHeader}>
                  <div>
                    <h3 style={styles.orderId}>Pesanan #{order.id}</h3>
                    <p style={styles.orderDate}>{order.created_at}</p>
                  </div>
                  <div style={{...styles.statusBadge, backgroundColor: statusStyle.bg, color: statusStyle.text}}>
                    {order.status}
                  </div>
                </div>

                {/* Body: Daftar Barang */}
                <ul style={styles.itemList}>
                  {order.items.map((item, index) => (
                    <li key={index} style={styles.itemRow}>
                      <div>
                        <p style={styles.itemName}>{item.product_name}</p>
                        <p style={styles.itemDetail}>{item.quantity} barang x Rp {item.price.toLocaleString('id-ID')}</p>
                      </div>
                      <div>
                        <p style={styles.itemPrice}>Rp {(item.quantity * item.price).toLocaleString('id-ID')}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Footer: Alamat & Total */}
                <div style={styles.cardFooter}>
                  <div style={styles.addressWrap}>
                    <p style={styles.addressTitle}>Alamat Pengiriman:</p>
                    <p style={styles.addressText}>{order.shipping_address}</p>
                  </div>
                  
                  <div style={styles.totalWrap}>
                    <p style={styles.totalTitle}>Total Belanja</p>
                    <p style={styles.totalAmount}>Rp {order.total_amount.toLocaleString('id-ID')}</p>
                    
                    {/* Jika masih nunggu pembayaran, beri tombol aksi */}
                    {order.status === 'Menunggu Pembayaran' && (
                      <button style={styles.payBtn} onClick={() => alert("Fitur Upload Bukti Bayar akan segera hadir!")}>
                        Cara Bayar
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default OrderHistory;