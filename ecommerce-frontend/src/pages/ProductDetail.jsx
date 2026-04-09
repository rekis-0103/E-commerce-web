import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [images, setImages] = useState([]);
  
  // STATE BARU: Untuk mengontrol teks deskripsi (Tutup/Buka)
  const [isExpanded, setIsExpanded] = useState(false);
  // Batas maksimal huruf sebelum dipotong
  const MAX_DESC_LENGTH = 400; 

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/products/${id}`);
        const data = response.data.data;
        setProduct(data);
        
        try {
          setImages(JSON.parse(data.image || "[]"));
        } catch (e) {
          setImages([]);
        }

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

  const nextImage = () => setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  const prevImage = () => setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));

  if (isLoading) return <div style={{ padding: '50px', textAlign: 'center' }}><h2>Memuat...</h2></div>;
  if (!product) return <div style={{ padding: '50px', textAlign: 'center' }}><h2>Produk tidak ditemukan.</h2></div>;

  // LOGIKA POTONG TEKS DESKRIPSI
  const isLongDescription = product.description && product.description.length > MAX_DESC_LENGTH;
  const displayDescription = isExpanded || !isLongDescription 
    ? product.description 
    : product.description.slice(0, MAX_DESC_LENGTH) + '...';

  const styles = {
    pageBackground: { fontFamily: "'Segoe UI', Roboto, sans-serif", backgroundColor: '#F8F9FA', minHeight: '100vh', padding: '60px' },
    backLink: { textDecoration: 'none', color: '#007bff', fontWeight: '600', marginBottom: '30px', display: 'inline-block' },
    layout: { display: 'flex', gap: '40px', backgroundColor: '#FFFFFF', padding: '40px', borderRadius: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.05)' },
    
    gallerySection: { flex: '1', display: 'flex', flexDirection: 'column', gap: '15px' },
    mainImageWrap: { position: 'relative', width: '100%', height: '450px', backgroundColor: '#F1F3F5', borderRadius: '16px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    mainImageActual: { width: '100%', height: '100%', objectFit: 'cover' },
    navArrowLeft: { position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', backgroundColor: 'rgba(255,255,255,0.8)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' },
    navArrowRight: { position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', backgroundColor: 'rgba(255,255,255,0.8)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' },
    thumbnailList: { display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' },
    thumbnail: { width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: '2px solid transparent', transition: 'border 0.2s' },
    
    detailSection: { flex: '1.2', display: 'flex', flexDirection: 'column' },
    title: { fontSize: '32px', fontWeight: '800', margin: '0 0 10px 0', color: '#333' },
    price: { fontSize: '28px', fontWeight: '800', color: '#28a745', margin: '0 0 20px 0' },
    stock: { fontSize: '15px', color: '#6c757d', marginBottom: '30px', padding: '8px 12px', backgroundColor: '#f8f9fa', borderRadius: '8px', width: 'fit-content' },
    descTitle: { fontSize: '18px', fontWeight: '700', marginBottom: '10px' },
    description: { fontSize: '16px', color: '#555', lineHeight: '1.6', marginBottom: '15px', whiteSpace: 'pre-line', transition: 'all 0.3s' },
    
    // Style tombol read more
    readMoreBtn: { color: '#007bff', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', marginBottom: '40px', display: 'inline-block' },
    
    cartBtn: { padding: '18px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px', transition: 'transform 0.1s', width: '100%' }
  };

  return (
    <div style={styles.pageBackground}>
      <Link to="/home" style={styles.backLink}>← Kembali Berbelanja</Link>
      
      <div style={styles.layout}>
        <div style={styles.gallerySection}>
          <div style={styles.mainImageWrap}>
            {images.length > 0 ? (
              <>
                <img src={`http://localhost:3000${images[currentImageIndex]}`} alt={product.name} style={styles.mainImageActual} />
                {images.length > 1 && (
                  <>
                    <button onClick={prevImage} style={styles.navArrowLeft}>◀</button>
                    <button onClick={nextImage} style={styles.navArrowRight}>▶</button>
                  </>
                )}
              </>
            ) : (
              <span style={{ color: '#adb5bd' }}>Tidak Ada Gambar</span>
            )}
          </div>

          {images.length > 1 && (
            <div style={styles.thumbnailList}>
              {images.map((img, index) => (
                <img 
                  key={index} 
                  src={`http://localhost:3000${img}`} 
                  alt="thumbnail"
                  onClick={() => setCurrentImageIndex(index)}
                  style={{
                    ...styles.thumbnail,
                    borderColor: currentImageIndex === index ? '#007bff' : 'transparent',
                    opacity: currentImageIndex === index ? 1 : 0.6
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div style={styles.detailSection}>
          <h1 style={styles.title}>{product.name}</h1>
          <h2 style={styles.price}>Rp {product.price.toLocaleString('id-ID')}</h2>
          <div style={styles.stock}>Sisa Stok: <strong>{product.stock}</strong> pcs</div>
          
          <h3 style={styles.descTitle}>Deskripsi Produk</h3>
          
          {/* Paragraf Deskripsi yang sudah dilindungi filter */}
          <p style={styles.description}>
            {displayDescription}
          </p>

          {/* Tombol Baca Selengkapnya (Hanya muncul jika teks panjang) */}
          {isLongDescription && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)} 
              style={styles.readMoreBtn}
            >
              {isExpanded ? 'Tampilkan Lebih Sedikit' : 'Baca Selengkapnya'}
            </button>
          )}
          
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