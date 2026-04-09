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
      
      alert(`Sukses! ${product.name} telah masuk ke keranjang belanja Anda.`);
    } catch (error) {
      alert('Gagal memasukkan ke keranjang.');
    }
  };

  // OBJEK CSS UNTUK GAYA YANG LEBIH CERAH & MODERN
  const styles = {
    pageBackground: {
      fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      backgroundColor: '#F8F9FA', // Latar belakang abu-abu sangat muda
      minHeight: '100vh',
    },
    navbar: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '15px 60px',
      backgroundColor: '#FFFFFF', // Navbar Putih
      color: '#333',
      alignItems: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)', // Bayangan halus
      position: 'sticky', // Tetap di atas saat di-scroll
      top: 0,
      zIndex: 1000,
    },
    logo: {
      margin: 0,
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#007bff', // Warna logo primer
    },
    navRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
    },
    cartBtn: {
      padding: '10px 20px',
      backgroundColor: '#FFFFFF',
      color: '#333',
      border: '1px solid #ddd',
      borderRadius: '25px', // Tombol tumpul
      cursor: 'pointer',
      fontWeight: '600',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    logoutBtn: {
      padding: '10px 20px',
      backgroundColor: '#f8d7da',
      color: '#721c24',
      border: 'none',
      borderRadius: '25px',
      cursor: 'pointer',
      fontWeight: '600',
    },
    loginBtn: {
      padding: '10px 25px',
      backgroundColor: '#28a745',
      color: 'white',
      border: 'none',
      borderRadius: '25px',
      cursor: 'pointer',
      fontWeight: 'bold',
    },
    container: {
      padding: '60px',
    },
    pageTitle: {
      fontSize: '32px',
      fontWeight: '800',
      marginBottom: '10px',
      color: '#333',
    },
    pageSubTitle: {
      fontSize: '16px',
      color: '#6c757d',
      marginBottom: '40px',
    },
    productGrid: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '30px',
    },
    productCard: {
      width: '280px',
      backgroundColor: '#FFFFFF',
      padding: '25px',
      borderRadius: '16px', // Kotak tumpul
      boxShadow: '0 8px 16px rgba(0,0,0,0.05)', // Bayangan lembut yang 'mengangkat'
      transition: 'transform 0.2s, box-shadow 0.2s',
      border: '1px solid #f0f0f0',
      overflow: 'hidden',
    },
    productImage: {
      height: '180px',
      backgroundColor: '#F1F3F5',
      marginBottom: '20px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#adb5bd',
      fontSize: '14px',
    },
    productName: {
      margin: '0 0 10px 0',
      fontSize: '20px',
      fontWeight: '700',
      color: '#333',
    },
    productDesc: {
      color: '#6c757d',
      fontSize: '14px',
      height: '42px',
      overflow: 'hidden',
      marginBottom: '20px',
      lineHeight: '1.5',
    },
    productPrice: {
      color: '#28a745',
      margin: '0 0 20px 0',
      fontSize: '22px',
      fontWeight: '800',
    },
    addToCartBtn: {
      width: '100%',
      padding: '12px',
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: '16px',
      transition: 'background-color 0.2s',
    },
  };

  return (
    <div style={styles.pageBackground}>
      
      {/* Navbar Modern */}
      <nav style={styles.navbar}>
        <h2 style={styles.logo}>Kita E-Commerce</h2>
        
        <div style={styles.navRight}>
          {token ? (
            <>
              <span style={{ fontSize: '15px', color: '#555' }}>
                Halo, {role === 'buyer' ? 'Pembeli' : role} 👋
              </span>
              <button onClick={() => navigate('/cart')} style={styles.cartBtn}>
                🛒 Keranjang
              </button>
              <button onClick={handleLogout} style={styles.logoutBtn}>
                Logout
              </button>
            </>
          ) : (
            <button onClick={() => navigate('/login')} style={styles.loginBtn}>
              Login ke Akun
            </button>
          )}
        </div>
      </nav>

      <div style={styles.container}>
        <h2 style={styles.pageTitle}>Temukan Favoritmu</h2>
        <p style={styles.pageSubTitle}>Jelajahi berbagai produk terbaik dari toko-toko terpercaya.</p>

        {/* Grid Produk */}
        <div style={styles.productGrid}>
          {products.length === 0 ? <p style={{ textAlign: 'center', width: '100%', color: '#6c757d' }}>Belum ada produk yang dijual.</p> : null}
          
          {products.map((product) => (
            <div key={product.ID} style={styles.productCard}>
              <div style={styles.productImage}>
                [Gambar Produk]
              </div>
              <h3 style={styles.productName}>{product.name}</h3>
              <p style={styles.productDesc}>{product.description}</p>
              <h4 style={styles.productPrice}>Rp {product.price.toLocaleString('id-ID')}</h4>
              
              <button 
                onClick={() => handleAddToCart(product)}
                style={styles.addToCartBtn}
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