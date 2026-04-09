import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function ShopOrders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  useEffect(() => {
    if (role !== 'seller') {
      navigate('/login');
      return;
    }
    fetchOrders();
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

  // Fungsi menembak API Update Status
  const updateStatus = async (orderId, newStatus) => {
    if (window.confirm(`Ubah status pesanan menjadi "${newStatus}"?`)) {
      try {
        await axios.put(`http://localhost:3000/api/seller/orders/${orderId}/status`, 
          { status: newStatus },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        fetchOrders(); // Refresh data setelah sukses
      } catch (error) {
        alert("Gagal memperbarui status");
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Menunggu Pembayaran': return { bg: '#fff3cd', text: '#856404' };
      case 'Diproses': return { bg: '#cce5ff', text: '#004085' };
      case 'Dikirim': return { bg: '#d4edda', text: '#155724' };
      case 'Selesai': return { bg: '#d1ecf1', text: '#0c5460' };
      default: return { bg: '#e2e3e5', text: '#383d41' };
    }
  };

  const styles = {
    pageBackground: { fontFamily: "'Segoe UI', Roboto, sans-serif", backgroundColor: '#F8F9FA', minHeight: '100vh', padding: '40px 60px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
    title: { fontSize: '28px', fontWeight: '800', color: '#333', margin: 0 },
    navLink: { padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' },
    orderCard: { backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '25px', marginBottom: '25px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' },
    orderId: { margin: 0, fontSize: '18px', fontWeight: '700' },
    statusBadge: { padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' },
    itemList: { listStyle: 'none', padding: 0, margin: 0, marginBottom: '20px' },
    itemRow: { display: 'flex', justifyContent: 'space-between', padding: '5px 0' },
    actionArea: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #eee', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' },
    btnProcess: { padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginRight: '10px' },
    btnShip: { padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  };

  if (isLoading) return <div style={styles.pageBackground}><h2>Memuat...</h2></div>;

  return (
    <div style={styles.pageBackground}>
      <div style={styles.header}>
        <h2 style={styles.title}>📋 Daftar Pesanan Masuk</h2>
        <Link to="/dashboard" style={styles.navLink}>Kembali ke Produk</Link>
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', backgroundColor: 'white', borderRadius: '16px' }}>
          <h3>Belum ada pesanan masuk.</h3>
        </div>
      ) : (
        orders.map((order) => {
          const statusStyle = getStatusColor(order.status);
          
          return (
            <div key={order.id} style={styles.orderCard}>
              <div style={styles.cardHeader}>
                <div>
                  <h3 style={styles.orderId}>ID Pesanan: #{order.id}</h3>
                  <p style={{ margin: '5px 0 0 0', color: '#6c757d', fontSize: '14px' }}>Waktu Order: {order.created_at}</p>
                </div>
                <div style={{...styles.statusBadge, backgroundColor: statusStyle.bg, color: statusStyle.text}}>
                  {order.status}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '40px' }}>
                <div style={{ flex: '1' }}>
                  <h4 style={{ marginBottom: '10px' }}>Rincian Barang:</h4>
                  <ul style={styles.itemList}>
                    {order.items.map((item, idx) => (
                      <li key={idx} style={styles.itemRow}>
                        <span>{item.quantity}x {item.product_name}</span>
                        <strong>Rp {(item.quantity * item.price).toLocaleString('id-ID')}</strong>
                      </li>
                    ))}
                  </ul>
                  <h3 style={{ color: '#dc3545', margin: 0, textAlign: 'right' }}>Total: Rp {order.total_amount.toLocaleString('id-ID')}</h3>
                </div>

                <div style={{ flex: '1', borderLeft: '1px solid #eee', paddingLeft: '40px' }}>
                  <h4 style={{ marginBottom: '10px' }}>Kirim Ke:</h4>
                  <p style={{ lineHeight: '1.5', color: '#555', margin: 0 }}>{order.shipping_address}</p>
                </div>
              </div>

              {/* AREA AKSI PENJUAL */}
              <div style={styles.actionArea}>
                <span style={{ fontWeight: 'bold', color: '#555' }}>Tindakan:</span>
                <div>
                  {order.status === 'Menunggu Pembayaran' && (
                    <button onClick={() => updateStatus(order.id, 'Diproses')} style={styles.btnProcess}>
                      Terima & Proses Pesanan
                    </button>
                  )}
                  {order.status === 'Diproses' && (
                    <button onClick={() => updateStatus(order.id, 'Dikirim')} style={styles.btnShip}>
                      Kirim Barang (Tandai Dikirim)
                    </button>
                  )}
                  {order.status === 'Dikirim' && (
                    <span style={{ color: '#28a745', fontWeight: 'bold' }}>Barang sedang dalam perjalanan 🚚</span>
                  )}
                  {order.status === 'Selesai' && (
                    <span style={{ color: '#007bff', fontWeight: 'bold' }}>Pesanan Telah Selesai ✅</span>
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

export default ShopOrders;