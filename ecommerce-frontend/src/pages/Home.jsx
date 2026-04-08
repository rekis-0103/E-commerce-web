import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Home() {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();
  
  // Mengambil data dari memori browser
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
    localStorage.clear(); // Hapus sesi
    navigate('/login'); // Arahkan ke login
  };

  return (
    <div style={{ fontFamily: 'Arial', backgroundColor: '#f4f4f9', minHeight: '100vh' }}>
      
      {/* Navbar Pintar */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 50px', backgroundColor: '#343a40', color: 'white', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>E-Commerce Kita</h2>
        
        <div>
          {/* LOGIKA CONDITIONAL RENDERING */}
          {token ? (
            // JIKA SUDAH LOGIN (Ada Token)
            <>
              <span style={{ marginRight: '20px' }}>Halo, {role === 'buyer' ? 'Pembeli' : role}</span>
              <button onClick={handleLogout} style={{ padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                Logout
              </button>
            </>
          ) : (
            // JIKA BELUM LOGIN (Tidak Ada Token)
            <button onClick={() => navigate('/login')} style={{ padding: '8px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              Login ke Akun
            </button>
          )}
        </div>
      </nav>

      <div style={{ padding: '50px' }}>
        <h2>Belanja Sekarang</h2>
        <p>Temukan produk terbaik dari berbagai toko terpercaya.</p>

        {/* Grid Produk */}
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
              
              <button 
                onClick={() => {
                  if (!token) {
                    alert('Akses Ditolak! Anda harus Login untuk memasukkan barang ke keranjang.');
                    navigate('/login');
                  } else {
                    alert(`Produk ${product.name} siap dimasukkan ke keranjang!`);
                  }
                }}
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