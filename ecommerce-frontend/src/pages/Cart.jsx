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
      console.error("Gagal mengambil data", error);
      setIsLoading(false);
    }
  };

  // Fungsi menambah/mengurangi quantity
  const updateQuantity = async (cartId, currentQty, change) => {
    const newQty = currentQty + change;
    if (newQty < 1) return; // Tidak boleh kurang dari 1

    try {
      await axios.put(`http://localhost:3000/api/user/cart/${cartId}`, 
        { quantity: newQty },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchCartItems(); // Refresh data setelah update
    } catch (error) {
      alert("Gagal memperbarui jumlah");
    }
  };

  // Fungsi menghapus item
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

  if (isLoading) return <h2 style={{ textAlign: 'center', marginTop: '50px' }}>Memuat...</h2>;

  return (
    <div style={{ fontFamily: 'Arial', backgroundColor: '#f4f4f9', minHeight: '100vh', padding: '50px' }}>
      <Link to="/home" style={{ textDecoration: 'none', color: '#007bff', fontWeight: 'bold' }}>← Kembali Belanja</Link>
      <h2 style={{ marginTop: '20px' }}>🛒 Keranjang Belanja</h2>

      {cartItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', backgroundColor: 'white', borderRadius: '8px' }}>
          <h3>Keranjang Anda kosong.</h3>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '30px', marginTop: '20px' }}>
          {/* Daftar Item */}
          <div style={{ flex: '2', backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
            {cartItems.map((item) => (
              <div key={item.cart_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 0', borderBottom: '1px solid #eee' }}>
                <div>
                  <h4 style={{ margin: 0 }}>{item.name}</h4>
                  <p style={{ color: '#6c757d' }}>Rp {item.price.toLocaleString('id-ID')}</p>
                  <button onClick={() => removeItem(item.cart_id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>Hapus</button>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <button onClick={() => updateQuantity(item.cart_id, item.quantity, -1)} style={{ padding: '5px 10px' }}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.cart_id, item.quantity, 1)} style={{ padding: '5px 10px' }}>+</button>
                  </div>
                  <h4 style={{ margin: 0, color: '#28a745' }}>Rp {item.total.toLocaleString('id-ID')}</h4>
                </div>
              </div>
            ))}
          </div>

          {/* Ringkasan */}
          <div style={{ flex: '1', backgroundColor: 'white', padding: '20px', borderRadius: '8px', height: 'fit-content' }}>
            <h3>Total Tagihan</h3>
            <h2 style={{ color: '#dc3545' }}>Rp {grandTotal.toLocaleString('id-ID')}</h2>
            <button style={{ width: '100%', padding: '15px', backgroundColor: '#ffc107', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
              BAYAR SEKARANG
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;