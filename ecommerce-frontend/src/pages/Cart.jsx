import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchCartItems();
  }, [navigate, token]);

  const fetchCartItems = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/user/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCartItems(response.data.data || []);
      setIsLoading(false);
    } catch (error) {
      console.error("Gagal mengambil data keranjang", error);
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
      fetchCartItems();
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
        fetchCartItems();
      } catch (error) {
        alert("Gagal menghapus item");
      }
    }
  };

  const grandTotal = cartItems.reduce((sum, item) => sum + item.total, 0);

  const styles = {
    pageBackground: {
      fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      backgroundColor: '#F8F9FA', // Latar belakang abu-abu sangat muda
      minHeight: '100vh',
      padding: '60px',
    },
    backLink: {
      textDecoration: 'none',
      color: '#007bff',
      fontWeight: '600',
      fontSize: '16px',
      display: 'inline-block',
      marginBottom: '30px',
    },
    pageTitle: {
      fontSize: '32px',
      fontWeight: '800',
      marginBottom: '40px',
      color: '#333',
    },
    emptyCart: {
      textAlign: 'center',
      padding: '80px',
      backgroundColor: '#FFFFFF',
      borderRadius: '24px',
      boxShadow: '0 8px 16px rgba(0,0,0,0.04)',
    },
    cartLayout: {
      display: 'flex',
      gap: '40px',
    },
    itemList: {
      flex: '2',
      backgroundColor: '#FFFFFF',
      padding: '30px',
      borderRadius: '24px',
      boxShadow: '0 8px 16px rgba(0,0,0,0.04)',
    },
    itemCard: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '25px 0',
      borderBottom: '1px solid #f0f0f0',
      alignItems: 'center',
    },
    itemName: {
      margin: '0 0 5px 0',
      fontSize: '19px',
      fontWeight: '700',
      color: '#333',
    },
    itemPrice: {
      margin: 0,
      color: '#6c757d',
      fontSize: '15px',
    },
    removeBtn: {
      color: '#dc3545',
      border: 'none',
      background: 'none',
      cursor: 'pointer',
      padding: 0,
      marginTop: '10px',
      fontSize: '14px',
      fontWeight: '600',
    },
    quantityControl: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '10px',
      backgroundColor: '#F1F3F5',
      padding: '5px 15px',
      borderRadius: '20px',
    },
    qtyBtn: {
      padding: '4px 10px',
      backgroundColor: 'white',
      border: '1px solid #ddd',
      borderRadius: '50%',
      cursor: 'pointer',
      fontSize: '16px',
      color: '#333',
    },
    qtyTotal: {
      margin: 0,
      color: '#28a745',
      fontSize: '20px',
      fontWeight: '800',
    },
    summaryCard: {
      flex: '1',
      backgroundColor: '#FFFFFF',
      padding: '30px',
      borderRadius: '24px',
      height: 'fit-content',
      boxShadow: '0 12px 24px rgba(0,0,0,0.06)',
      position: 'sticky',
      top: '100px',
    },
    summaryTitle: {
      margin: '0 0 25px 0',
      paddingBottom: '15px',
      borderBottom: '1px solid #f0f0f0',
      fontSize: '22px',
      fontWeight: '700',
    },
    grandTotal: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '30px',
      fontSize: '19px',
      fontWeight: '600',
    },
    grandTotalPrice: {
      color: '#dc3545',
      fontWeight: '800',
    },
    checkoutBtn: {
      width: '100%',
      padding: '18px',
      backgroundColor: '#ffc107',
      color: '#333',
      border: 'none',
      borderRadius: '16px',
      fontWeight: 'bold',
      fontSize: '17px',
      cursor: 'pointer',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      transition: 'all 0.2s',
    },
  };

  if (isLoading) return <div style={styles.pageBackground}><h2 style={{ textAlign: 'center' }}>Memuat Keranjang...</h2></div>;

  return (
    <div style={styles.pageBackground}>
      <Link to="/home" style={styles.backLink}>← Kembali Berbelanja</Link>
      <h2 style={styles.pageTitle}>Keranjang Belanja</h2>

      {cartItems.length === 0 ? (
        <div style={styles.emptyCart}>
          <h3 style={{ color: '#6c757d', marginBottom: '20px' }}>Keranjang Anda masih kosong.</h3>
          <button onClick={() => navigate('/home')} style={{ padding: '12px 30px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold' }}>
            Mulai Belanja
          </button>
        </div>
      ) : (
        <div style={styles.cartLayout}>
          
          {/* Daftar Item Modern */}
          <div style={styles.itemList}>
            {cartItems.map((item, index) => (
              <div key={item.cart_id} style={{...styles.itemCard, borderBottom: index !== cartItems.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                <div>
                  <h4 style={styles.itemName}>{item.name}</h4>
                  <p style={styles.itemPrice}>Rp {item.price.toLocaleString('id-ID')}</p>
                  <button onClick={() => removeItem(item.cart_id)} style={styles.removeBtn}>
                    Hapus Item
                  </button>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={styles.quantityControl}>
                    <button onClick={() => updateQuantity(item.cart_id, item.quantity, -1)} style={styles.qtyBtn}>-</button>
                    <span style={{ fontWeight: 'bold', fontSize: '16px', minWidth: '20px', textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <button onClick={() => updateQuantity(item.cart_id, item.quantity, 1)} style={styles.qtyBtn}>+</button>
                  </div>
                  <h4 style={styles.qtyTotal}>Rp {item.total.toLocaleString('id-ID')}</h4>
                </div>
              </div>
            ))}
          </div>

          {/* Ringkasan Belanja yang Menjol */}
          <div style={styles.summaryCard}>
            <h3 style={styles.summaryTitle}>Ringkasan</h3>
            <div style={styles.grandTotal}>
              <span>Total Tagihan:</span>
              <span style={styles.grandTotalPrice}>Rp {grandTotal.toLocaleString('id-ID')}</span>
            </div>
            <button style={styles.checkoutBtn}>
              LANJUT KE PEMBAYARAN
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

export default Cart;