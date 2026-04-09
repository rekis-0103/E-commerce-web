import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function ProductDetail() {
  const { id } = useParams(); // Mengambil ID dari URL (contoh: /product/1)
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/products/${id}`);
        setProduct(response.data.data);
        setIsLoading(false);
      } catch (error) {
        console.error("Gagal mengambil produk", error);
        setIsLoading(false);
      }
    };
    fetchProductDetail();
  }, [id]);

  const handleAddToCart = async () => {
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
      alert(`Sukses! ${product.name} telah ditambahkan ke keranjang.`);
    } catch (error) {
      alert('Gagal memasukkan ke keranjang.');
    }
  };

  if (isLoading) return <div style={{ padding: '50px', textAlign: 'center' }}><h2>Memuat...</h2></div>;
  if (!product) return <div style={{ padding: '50px', textAlign: 'center' }}><h2>Produk tidak ditemukan.</h2></div>;

  const styles = {
    pageBackground: { fontFamily: "'Segoe UI', Roboto, sans-serif", backgroundColor: '#F8F9FA', minHeight: '100vh', padding: '60px' },
    backLink: { textDecoration: 'none', color: '#007bff', fontWeight: '600', marginBottom: '30px', display: 'inline-block' },
    layout: { display: 'flex', gap: '40px', backgroundColor: '#FFFFFF', padding: '40px', borderRadius: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.05)' },
    imageSection: { flex: '1', backgroundColor: '#F1F3F5', height: '400px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#adb5bd', fontSize: '20px' },
    detailSection: { flex: '1', display: 'flex', flexDirection: 'column' },
    title: { fontSize: '32px', fontWeight: '800', margin: '0 0 10px 0', color: '#333' },
    price: { fontSize: '28px', fontWeight: '800', color: '#28a745', margin: '0 0 20px 0' },
    stock: { fontSize: '15px', color: '#6c757d', marginBottom: '30px', padding: '8px 12px', backgroundColor: '#f8f9fa', borderRadius: '8px', width: 'fit-content' },
    descTitle: { fontSize: '18px', fontWeight: '700', marginBottom: '10px' },
    description: { fontSize: '16px', color: '#555', lineHeight: '1.6', marginBottom: '40px' },
    cartBtn: { padding: '18px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px', transition: 'transform 0.1s' }
  };

  return (
    <div style={styles.pageBackground}>
      <Link to="/home" style={styles.backLink}>← Kembali Berbelanja</Link>
      
      <div style={styles.layout}>
        {/* Sisi Kiri: Gambar Besar */}
        <div style={styles.imageSection}>
          [Gambar Produk Resolusi Tinggi]
        </div>

        {/* Sisi Kanan: Informasi & Tombol */}
        <div style={styles.detailSection}>
          <h1 style={styles.title}>{product.name}</h1>
          <h2 style={styles.price}>Rp {product.price.toLocaleString('id-ID')}</h2>
          <div style={styles.stock}>Sisa Stok: <strong>{product.stock}</strong> pcs</div>
          
          <h3 style={styles.descTitle}>Deskripsi Produk</h3>
          <p style={styles.description}>{product.description}</p>
          
          <div style={{ marginTop: 'auto' }}>
            <button 
              onClick={handleAddToCart} 
              style={styles.cartBtn}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.98)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            >
              + Masukkan Keranjang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;