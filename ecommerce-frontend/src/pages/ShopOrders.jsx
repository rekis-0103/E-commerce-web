import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function ShopOrders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // STATE BARU: Untuk melacak gambar mana yang sedang diperbesar di pop-up
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
      case 'Menunggu Pembayaran': return { bg: '#fff3cd', text: '#856404' };
      case 'Menunggu Konfirmasi': return { bg: '#cce5ff', text: '#004085' };
      case 'Diproses': return { bg: '#d1ecf1', text: '#0c5460' };
      case 'Dikirim': return { bg: '#d4edda', text: '#155724' };
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
    statusBadge: { padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' },
    actionArea: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #eee', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' },
    btnProcess: { padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginRight: '10px' },
    btnShip: { padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    
    // Perubahan cursor saat di-hover jadi kaca pembesar (zoom-in)
    proofImage: { width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd', cursor: 'zoom-in', transition: 'transform 0.2s' },
    
    // STYLE BARU: Untuk Layar Pop-Up (Modal)
    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { position: 'relative', backgroundColor: 'white', padding: '20px', borderRadius: '12px', maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
    closeBtn: { position: 'absolute', top: '10px', right: '15px', fontSize: '28px', fontWeight: 'bold', color: '#333', cursor: 'pointer', lineHeight: '1' },
    modalImageLarge: { maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '8px' }
  };

  if (isLoading) return <div style={styles.pageBackground}><h2>Memuat...</h2></div>;

  return (
    <div style={styles.pageBackground}>
      <div style={styles.header}>
        <h2 style={styles.title}>📋 Daftar Pesanan Masuk</h2>
        <Link to="/dashboard" style={styles.navLink}>Kembali ke Produk</Link>
      </div>

      {/* RENDER MODAL POP-UP (Hanya muncul jika selectedImage tidak null) */}
      {selectedImage && (
        <div style={styles.modalOverlay} onClick={() => setSelectedImage(null)}>
          {/* stopPropagation agar saat gambar diklik, modal tidak tertutup */}
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <span style={styles.closeBtn} onClick={() => setSelectedImage(null)}>&times;</span>
            <img src={`http://localhost:3000${selectedImage}`} alt="Bukti Pembayaran Besar" style={styles.modalImageLarge} />
            <p style={{ marginTop: '15px', fontWeight: 'bold', color: '#555' }}>Bukti Pembayaran</p>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', backgroundColor: 'white', borderRadius: '16px' }}><h3>Belum ada pesanan masuk.</h3></div>
      ) : (
        orders.map((order) => {
          const statusStyle = getStatusColor(order.status);
          
          return (
            <div key={order.id} style={styles.orderCard}>
              <div style={styles.cardHeader}>
                <div>
                  <h3 style={{ margin: 0 }}>ID Pesanan: #{order.id}</h3>
                  <p style={{ margin: '5px 0 0 0', color: '#6c757d' }}>{order.created_at}</p>
                </div>
                <div style={{...styles.statusBadge, backgroundColor: statusStyle.bg, color: statusStyle.text}}>
                  {order.status}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '40px' }}>
                <div style={{ flex: '1' }}>
                  <h4 style={{ marginBottom: '10px' }}>Rincian:</h4>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {order.items.map((item, idx) => (
                      <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                        <span>{item.quantity}x {item.product_name}</span>
                        <strong>Rp {(item.quantity * item.price).toLocaleString('id-ID')}</strong>
                      </li>
                    ))}
                  </ul>
                  <h3 style={{ color: '#dc3545', textAlign: 'right' }}>Total: Rp {order.total_amount.toLocaleString('id-ID')}</h3>
                </div>

                <div style={{ flex: '1', borderLeft: '1px solid #eee', paddingLeft: '40px' }}>
                  <h4 style={{ marginBottom: '10px' }}>Bukti Bayar & Tujuan:</h4>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    {order.payment_proof ? (
                      // REVISI: Dulu <a>, sekarang hanya <img> yang jika diklik akan memicu Pop-Up
                      <img 
                        src={`http://localhost:3000${order.payment_proof}`} 
                        alt="Bukti" 
                        style={styles.proofImage} 
                        onClick={() => setSelectedImage(order.payment_proof)}
                        title="Klik untuk perbesar"
                      />
                    ) : (
                      <div style={{...styles.proofImage, backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#aaa', textAlign: 'center', cursor: 'default' }}>Belum Dibayar</div>
                    )}
                    <p style={{ lineHeight: '1.5', color: '#555', margin: 0, flex: 1 }}>{order.shipping_address}</p>
                  </div>
                </div>
              </div>

              <div style={styles.actionArea}>
                <span style={{ fontWeight: 'bold', color: '#555' }}>Tindakan:</span>
                <div>
                  {order.status === 'Menunggu Pembayaran' && (
                    <span style={{ color: '#856404' }}>⏳ Menunggu pembeli transfer...</span>
                  )}
                  {order.status === 'Menunggu Konfirmasi' && (
                    <button onClick={() => updateStatus(order.id, 'Diproses')} style={styles.btnProcess}>
                      Bukti Valid! Proses Pesanan
                    </button>
                  )}
                  {order.status === 'Diproses' && (
                    <button onClick={() => updateStatus(order.id, 'Dikirim')} style={styles.btnShip}>
                      Kirim Barang (Input Resi)
                    </button>
                  )}
                  {order.status === 'Dikirim' && (
                    <span style={{ color: '#28a745', fontWeight: 'bold' }}>Barang dalam perjalanan 🚚</span>
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