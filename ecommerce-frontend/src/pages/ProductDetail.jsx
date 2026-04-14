import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useTheme, DarkModeToggle } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaShoppingCart, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

function ProductDetail() {
  const { theme } = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [images, setImages] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
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
        } catch {
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

  if (isLoading) return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: theme.bg, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <h2 style={{ color: theme.textSecondary }}>Memuat...</h2>
    </div>
  );

  if (!product) return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: theme.bg, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <h2 style={{ color: theme.textSecondary }}>Produk tidak ditemukan.</h2>
    </div>
  );

  const isLongDescription = product.description && product.description.length > MAX_DESC_LENGTH;
  const displayDescription = isExpanded || !isLongDescription
    ? product.description
    : product.description.slice(0, MAX_DESC_LENGTH) + '...';

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: theme.bg, minHeight: '100vh', padding: '40px 60px', transition: 'all 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <Link to="/home" style={{ textDecoration: 'none', color: theme.primary, fontWeight: 600, fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <FaArrowLeft /> Kembali Berbelanja
        </Link>
        <DarkModeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex',
          gap: 40,
          backgroundColor: theme.cardBg,
          padding: 40,
          borderRadius: 24,
          boxShadow: theme.shadow,
          border: `1px solid ${theme.border}`
        }}
      >
        {/* Gallery Section */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 15 }}>
          <div style={{
            position: 'relative',
            width: 450,
            height: 450,
            backgroundColor: theme.bg,
            borderRadius: 16,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {images.length > 0 ? (
              <>
                <img
                  src={`http://localhost:3000${images[currentImageIndex]}`}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
                {images.length > 1 && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={prevImage}
                      style={{
                        position: 'absolute',
                        left: 15,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: theme.cardBg,
                        border: `1px solid ${theme.border}`,
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        cursor: 'pointer',
                        fontSize: 18,
                        color: theme.text,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                      }}
                    >
                      <FaChevronLeft />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={nextImage}
                      style={{
                        position: 'absolute',
                        right: 15,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: theme.cardBg,
                        border: `1px solid ${theme.border}`,
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        cursor: 'pointer',
                        fontSize: 18,
                        color: theme.text,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                      }}
                    >
                      <FaChevronRight />
                    </motion.button>
                  </>
                )}
              </>
            ) : (
              <span style={{ color: theme.textSecondary }}>Tidak Ada Gambar</span>
            )}
          </div>

          {images.length > 1 && (
            <div style={{
              display: 'flex',
              gap: 10,
              overflowX: 'auto',
              paddingBottom: 10
            }}>
              {images.map((img, index) => (
                <motion.img
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  src={`http://localhost:3000${img}`}
                  alt="thumbnail"
                  onClick={() => setCurrentImageIndex(index)}
                  style={{
                    width: 80,
                    height: 80,
                    objectFit: 'contain',
                    borderRadius: 8,
                    cursor: 'pointer',
                    border: `2px solid ${currentImageIndex === index ? theme.primary : 'transparent'}`,
                    opacity: currentImageIndex === index ? 1 : 0.6,
                    backgroundColor: theme.bg,
                    transition: 'all 0.2s ease'
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detail Section */}
        <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column' }}>
          <h1 style={{
            fontSize: 32,
            fontWeight: 800,
            margin: '0 0 10px 0',
            color: theme.text,
            fontFamily: "'Poppins', sans-serif"
          }}>
            {product.name}
          </h1>

          <h2 style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#10B981',
            margin: '0 0 20px 0'
          }}>
            Rp {product.price.toLocaleString('id-ID')}
          </h2>

          <div style={{
            fontSize: 15,
            color: theme.textSecondary,
            marginBottom: 30,
            padding: '8px 12px',
            backgroundColor: theme.bg,
            borderRadius: 8,
            width: 'fit-content'
          }}>
            Sisa Stok: <strong style={{ color: theme.text }}>{product.stock}</strong> pcs
          </div>

          <h3 style={{
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 10,
            color: theme.text
          }}>
            Deskripsi Produk
          </h3>

          <p style={{
            fontSize: 16,
            color: theme.textSecondary,
            lineHeight: 1.6,
            marginBottom: 15,
            whiteSpace: 'pre-line',
            transition: 'all 0.3s ease'
          }}>
            {displayDescription}
          </p>

          {isLongDescription && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                color: theme.primary,
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: 15,
                marginBottom: 40,
                display: 'inline-block'
              }}
            >
              {isExpanded ? 'Tampilkan Lebih Sedikit' : 'Baca Selengkapnya'}
            </motion.button>
          )}

          <div style={{ marginTop: 'auto' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddToCart}
              style={{
                padding: 18,
                backgroundColor: theme.primary,
                color: 'white',
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: 18,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.3s ease'
              }}
            >
              <FaShoppingCart /> + Masukkan Keranjang
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default ProductDetail;
