import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Home() {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();
  
  const role = localStorage.getItem('role');
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/products');
        setProducts(response.data.data);
      } catch (error) {
        console.error("Gagal memuat produk", error);
      }
    };
    fetchAllProducts();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // FUNGSI BARU: Menembak API Backend untuk menambah keranjang
  const handleAddToCart = async (product) => {
    if (!token) {
      alert('Akses Ditolak! Anda harus Login untuk memasukkan barang ke keranjang.');
      navigate('/login');
      return;
    }

    try {
      await axios.post('http://localhost:3000/api/user/cart', 
        { product_id: product.ID, quantity: 1 }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Mengubah alert biasa menjadi lebih memuaskan!
      alert(`Sukses! ${product.name} telah masuk ke keranjang belanja Anda.`);
    } catch (error) {
      alert('Gagal memasukkan ke keranjang.');
    }
  };

  return (
    <div style={{ fontFamily: 'Arial', backgroundColor: '#f4f4f9', minHeight: '100vh' }}>
      
      <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 50px', backgroundColor: '#343a40', color: 'white', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>E-Commerce Kita</h2>
        
        <div>
          {token ? (
            <>
              <span style={{ marginRight: '20px' }}>Halo, {role === 'buyer' ? 'Pembeli' : role}</span>
              {/* TOMBOL LIHAT KERANJANG BARU */}
              <button onClick={() => navigate('/cart')} style={{ marginRight: '15px', padding: '8px 15px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                🛒 Keranjang
              </button>
              <button onClick={handleLogout} style={{ padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                Logout
              </button>
            </>
          ) : (
            <button onClick={() => navigate('/login')} style={{ padding: '8px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              Login ke Akun
            </button>
          )}
        </div>
      </nav>

      <div style={{ padding: '50px' }}>
        <h2>Belanja Sekarang</h2>
        <p>Temukan produk terbaik dari berbagai toko terpercaya.</p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '30px' }}>
          {products.length === 0 ? <p>Belum ada produk yang dijual.</p> : null}
          
          {products.map((product) => (
            <div key={product.ID} style={{ width: '250px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ height: '150px', backgroundColor: '#e9ecef', marginBottom: '15px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#adb5bd' }}>[Gambar Produk]</span>
              </div>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>{product.name}</h3>
              <p style={{ color: '#6c757d', fontSize: '14px', height: '40px', overflow: 'hidden' }}>{product.description}</p>
              <h4 style={{ color: '#28a745', margin: '15px 0' }}>Rp {product.price.toLocaleString('id-ID')}</h4>
              
              {/* TOMBOL UPDATE */}
              <button 
                onClick={() => handleAddToCart(product)}
                style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                + Keranjang
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;