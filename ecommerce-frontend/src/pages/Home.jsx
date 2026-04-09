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

  const styles = {
    pageBackground: { fontFamily: "'Segoe UI', Roboto, sans-serif", backgroundColor: '#F8F9FA', minHeight: '100vh' },
    navbar: { display: 'flex', justifyContent: 'space-between', padding: '15px 60px', backgroundColor: '#FFFFFF', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 1000 },
    logo: { margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#007bff' },
    navRight: { display: 'flex', alignItems: 'center', gap: '15px' },
    cartBtn: { padding: '10px 20px', backgroundColor: '#FFFFFF', border: '1px solid #ddd', borderRadius: '25px', cursor: 'pointer', fontWeight: '600' },
    logoutBtn: { padding: '10px 20px', backgroundColor: '#f8d7da', color: '#721c24', border: 'none', borderRadius: '25px', cursor: 'pointer', fontWeight: '600' },
    loginBtn: { padding: '10px 25px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold' },
    container: { padding: '60px' },
    productGrid: { display: 'flex', flexWrap: 'wrap', gap: '30px' },
    // PERUBAHAN UTAMA ADA DI SINI: Kartu diberi efek pointer agar terlihat bisa diklik
    productCard: { width: '250px', backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: 'transform 0.2s', border: '1px solid #f0f0f0', cursor: 'pointer' },
    productImage: { height: '200px', backgroundColor: '#F1F3F5', marginBottom: '15px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#adb5bd' },
    productName: { margin: '0 0 5px 0', fontSize: '18px', fontWeight: '700', color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    productPrice: { color: '#28a745', margin: '0', fontSize: '20px', fontWeight: '800' }
  };

  return (
    <div style={styles.pageBackground}>
      <nav style={styles.navbar}>
        <h2 style={styles.logo}>Kita E-Commerce</h2>
        <div style={styles.navRight}>
          {token ? (
            <>
              <span style={{ fontSize: '15px', color: '#555' }}>Halo, {role === 'buyer' ? 'Pembeli' : role}</span>
              <button onClick={() => navigate('/cart')} style={styles.cartBtn}>🛒 Keranjang</button>
              <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
            </>
          ) : (
            <button onClick={() => navigate('/login')} style={styles.loginBtn}>Login ke Akun</button>
          )}
        </div>
      </nav>

      <div style={styles.container}>
        <h2 style={{ fontSize: '32px', marginBottom: '10px' }}>Pilihan Terbaik</h2>
        <p style={{ color: '#6c757d', marginBottom: '40px' }}>Klik produk untuk melihat detail dan membeli.</p>

        <div style={styles.productGrid}>
          {products.map((product) => (
            /* KARTU SEKARANG BISA DIKLIK MENGARAH KE /product/id */
            <div 
              key={product.ID} 
              style={styles.productCard} 
              onClick={() => navigate(`/product/${product.ID}`)}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={styles.productImage}>[Gambar]</div>
              <h3 style={styles.productName}>{product.name}</h3>
              <h4 style={styles.productPrice}>Rp {product.price.toLocaleString('id-ID')}</h4>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;