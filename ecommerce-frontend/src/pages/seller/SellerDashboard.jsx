import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ImageCropModal from '../../components/ImageCropModal';
import { useTheme, DarkModeToggle } from '../../context/ThemeContext';
import { motion } from 'framer-motion';
import { FaEdit, FaTimes, FaSignOutAlt, FaBox, FaPlus, FaCheck, FaArrowLeft, FaTruck, FaHome } from 'react-icons/fa';

function SellerDashboard() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const token = localStorage.getItem('token');

  const [products, setProducts] = useState([]);
  const [userName, setUserName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'profile'
  const [shopProfile, setShopProfile] = useState({ shop_name: '', description: '', province: '', address: '' });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const provinces = [
    "Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Kepulauan Riau", "Jambi", 
    "Sumatera Selatan", "Bangka Belitung", "Bengkulu", "Lampung", "DKI Jakarta", 
    "Jawa Barat", "Banten", "Jawa Tengah", "DI Yogyakarta", "Jawa Timur", 
    "Bali", "Nusa Tenggara Barat", "Nusa Tenggara Timur", "Kalimantan Barat", 
    "Kalimantan Tengah", "Kalimantan Selatan", "Kalimantan Timur", "Kalimantan Utara", 
    "Sulawesi Utara", "Sulawesi Tengah", "Sulawesi Selatan", "Sulawesi Tenggara", 
    "Gorontalo", "Sulawesi Barat", "Maluku", "Maluku Utara", "Papua", 
    "Papua Barat", "Papua Selatan", "Papua Tengah", "Papua Pegunungan", "Papua Barat Daya"
  ];

  const [formData, setFormData] = useState({ name: '', description: '', price: '', stock: '' });
  const [imageFiles, setImageFiles] = useState([]);
  const [imageSize, setImageSize] = useState(800);

  const fileInputRef = useRef(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);

  useEffect(() => {
    if (role !== 'seller') navigate('/login');
    else {
      fetchProducts();
      fetchShopProfile();
      // Ambil nama user dari profil
      axios.get('http://localhost:3000/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        const fullName = res.data.data.name || '';
        setUserName(fullName.split(' ')[0]);
      }).catch(() => {});
    }
  }, [role, navigate]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/seller/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data.data || []);
    } catch (error) {
      const status = error?.response?.status;
      const message = error?.response?.data?.message || error?.message || "Unknown error";
      console.error("Gagal mengambil data produk", { status, message });

      if (status === 401) {
        localStorage.clear();
        navigate('/login');
      }
    }
  };

  const fetchShopProfile = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/seller/shop/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.data) {
        setShopProfile({
          shop_name: response.data.data.shop_name || '',
          description: response.data.data.description || '',
          province: response.data.data.province || '',
          address: response.data.data.address || ''
        });
      }
    } catch (error) {
      console.error("Gagal mengambil profil toko", error);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (shopProfile.province && !provinces.includes(shopProfile.province)) {
      alert("Provinsi tidak valid. Silakan pilih dari daftar yang tersedia.");
      return;
    }
    setSavingProfile(true);
    try {
      await axios.put('http://localhost:3000/api/seller/shop/profile', shopProfile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Profil toko berhasil disimpan!');
      setIsEditingProfile(false);
      fetchShopProfile();
    } catch (error) {
      alert('Gagal menyimpan profil toko');
      console.error(error);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const cropToSquare = (file, size = 800) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');

          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;

          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);

          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/jpeg', 0.9);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    const newImages = [];

    for (const file of files) {
      const croppedBlob = await cropToSquare(file, imageSize);
      const croppedFile = new File([croppedBlob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' });

      newImages.push({
        id: Math.random().toString(36).substr(2, 9),
        file: croppedFile,
        url: URL.createObjectURL(croppedFile),
        isOld: false
      });
    }

    setImageFiles([...imageFiles, ...newImages]);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const moveImage = (index, direction) => {
    const newArray = [...imageFiles];
    if (direction === 'left' && index > 0) {
      [newArray[index - 1], newArray[index]] = [newArray[index], newArray[index - 1]];
    } else if (direction === 'right' && index < newArray.length - 1) {
      [newArray[index + 1], newArray[index]] = [newArray[index], newArray[index + 1]];
    }
    setImageFiles(newArray);
  };

  const removeImage = (index) => {
    setImageFiles(imageFiles.filter((_, i) => i !== index));
  };

  const openCropModal = (index) => {
    setImageToCrop({ index, url: imageFiles[index].url });
    setShowCropModal(true);
  };

  const handleCropComplete = async (croppedFile) => {
    if (imageToCrop === null) return;

    const newImages = [...imageFiles];
    const oldImage = newImages[imageToCrop.index];

    if (oldImage.url && oldImage.url.startsWith('blob:')) {
      URL.revokeObjectURL(oldImage.url);
    }

    newImages[imageToCrop.index] = {
      id: oldImage.id,
      file: croppedFile,
      url: URL.createObjectURL(croppedFile),
      isOld: false
    };

    setImageFiles(newImages);
    setImageToCrop(null);
  };

  const parseImages = (imageString) => {
    try {
      return JSON.parse(imageString || "[]");
    } catch {
      return [];
    }
  };

  const openCreateForm = () => {
    setFormData({ name: '', description: '', price: '', stock: '' });
    setImageFiles([]);
    setImageSize(800);
    setIsEditing(false);
    setShowForm(true);
  };

  const openEditForm = (product) => {
    setFormData({ name: product.name, description: product.description, price: product.price, stock: product.stock });
    setImageSize(800);

    const oldImages = parseImages(product.image).map(url => ({
      id: Math.random().toString(36).substr(2, 9),
      file: null,
      url: `http://localhost:3000${url}`,
      originalPath: url,
      isOld: true
    }));

    setImageFiles(oldImages);
    setEditId(product.ID);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSend = new FormData();
    dataToSend.append('name', formData.name);
    dataToSend.append('description', formData.description);
    dataToSend.append('price', formData.price);
    dataToSend.append('stock', formData.stock);

    const existingImages = imageFiles.filter(img => img.isOld).map(img => img.originalPath);
    dataToSend.append('existing_images', JSON.stringify(existingImages));

    imageFiles.filter(img => !img.isOld).forEach(img => {
      dataToSend.append('images', img.file);
    });

    try {
      if (isEditing) {
        await axios.put(`http://localhost:3000/api/seller/products/${editId}`, dataToSend, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post('http://localhost:3000/api/seller/products', dataToSend, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
      }
      alert(`Produk berhasil ${isEditing ? 'diupdate' : 'ditambahkan'}!`);
      setShowForm(false);
      fetchProducts();
    } catch (error) {
      alert('Gagal menyimpan produk.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Yakin ingin menghapus produk ini?")) {
      try {
        await axios.delete(`http://localhost:3000/api/seller/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchProducts();
      } catch (error) {
        alert("Gagal menghapus produk");
      }
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: theme.bg, minHeight: '100vh', padding: '40px 60px', transition: 'all 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: 32, fontWeight: 800, margin: 0, color: theme.text, fontFamily: "'Poppins', sans-serif" }}
        >
          Halo, {userName || 'Penjual'}
        </motion.h2>

        <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/home')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#10B981',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <FaHome /> Halaman Buyer
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/shop-orders')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#F59E0B',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <FaBox /> 📦 Cek Pesanan Masuk
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/tracking')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <FaTruck /> Tracking
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            style={{
              padding: '12px 24px',
              backgroundColor: '#EF4444',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <FaSignOutAlt /> Logout
          </motion.button>

          <DarkModeToggle />
        </div>
      </div>

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          backgroundColor: theme.cardBg,
          padding: 30,
          borderRadius: 20,
          boxShadow: theme.shadow,
          border: `1px solid ${theme.border}`
        }}
      >
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 20, borderBottom: `1px solid ${theme.border}`, marginBottom: 25, paddingBottom: 10 }}>
          <button
            onClick={() => setActiveTab('products')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 18,
              fontWeight: 700,
              color: activeTab === 'products' ? theme.primary : theme.textSecondary,
              cursor: 'pointer',
              borderBottom: activeTab === 'products' ? `2px solid ${theme.primary}` : 'none',
              paddingBottom: 5
            }}
          >
            📦 Daftar Produk
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 18,
              fontWeight: 700,
              color: activeTab === 'profile' ? theme.primary : theme.textSecondary,
              cursor: 'pointer',
              borderBottom: activeTab === 'profile' ? `2px solid ${theme.primary}` : 'none',
              paddingBottom: 5
            }}
          >
            🏪 Profil Toko
          </button>
        </div>

        {activeTab === 'products' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 25 }}>
              <h3 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: theme.text }}>
                Produk Anda
              </h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={showForm ? () => setShowForm(false) : openCreateForm}
                style={{
                  padding: '12px 24px',
                  backgroundColor: theme.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                {showForm ? <><FaArrowLeft /> Batal</> : <><FaPlus /> Tambah Produk</>}
              </motion.button>
            </div>

        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            onSubmit={handleSubmit}
            style={{
              backgroundColor: theme.bg,
              padding: 25,
              borderRadius: 16,
              marginBottom: 30
            }}
          >
            <h4 style={{ marginBottom: 20, color: theme.text }}>{isEditing ? 'Edit Produk' : 'Tambah Produk Baru'}</h4>

            <input
              type="text"
              placeholder="Nama Produk"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{
                padding: 12,
                borderRadius: 8,
                border: `1px solid ${theme.border}`,
                width: '100%',
                marginBottom: 15,
                boxSizing: 'border-box',
                backgroundColor: theme.inputBg,
                color: theme.text,
                fontSize: 15
              }}
            />
            <textarea
              placeholder="Deskripsi produk..."
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{
                padding: 12,
                borderRadius: 8,
                border: `1px solid ${theme.border}`,
                width: '100%',
                minHeight: 80,
                marginBottom: 15,
                boxSizing: 'border-box',
                backgroundColor: theme.inputBg,
                color: theme.text,
                fontSize: 15,
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
            <div style={{ display: 'flex', gap: 15 }}>
              <input
                type="number"
                placeholder="Harga (Rp)"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  border: `1px solid ${theme.border}`,
                  width: '50%',
                  marginBottom: 15,
                  boxSizing: 'border-box',
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                  fontSize: 15
                }}
              />
              <input
                type="number"
                placeholder="Stok"
                required
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  border: `1px solid ${theme.border}`,
                  width: '50%',
                  marginBottom: 15,
                  boxSizing: 'border-box',
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                  fontSize: 15
                }}
              />
            </div>

            {/* Upload Area */}
            <div style={{
              backgroundColor: theme.cardBg,
              padding: 15,
              borderRadius: 8,
              border: `1px solid ${theme.border}`,
              marginBottom: 20
            }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 10, color: theme.text }}>
                Foto Produk (Bisa pilih banyak)
              </label>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 15,
                padding: 10,
                backgroundColor: theme.bg,
                borderRadius: 6
              }}>
                <span style={{ fontSize: 14, color: theme.textSecondary }}>📐 Ukuran Gambar (kotak):</span>
                <input
                  type="number"
                  value={imageSize}
                  onChange={(e) => setImageSize(parseInt(e.target.value) || 800)}
                  min="100"
                  max="2000"
                  step="100"
                  style={{
                    width: 80,
                    padding: 8,
                    borderRadius: 6,
                    border: `1px solid ${theme.border}`,
                    textAlign: 'center',
                    backgroundColor: theme.inputBg,
                    color: theme.text
                  }}
                />
                <span style={{ fontSize: 14, color: theme.textSecondary }}>x {imageSize} px</span>
                <span style={{ fontSize: 12, color: theme.textSecondary, marginLeft: 'auto' }}>
                  Gambar otomatis di-crop jadi kotak dari tengah
                </span>
              </div>

              <input
                type="file"
                accept="image/*"
                multiple
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ marginBottom: 15 }}
              />

              {/* Gallery */}
              <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap', marginTop: 15 }}>
                {imageFiles.map((img, index) => (
                  <div key={img.id} style={{
                    position: 'relative',
                    width: 120,
                    height: 120,
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: `2px solid ${theme.border}`
                  }}>
                    <img src={img.url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      type="button"
                      onClick={() => openCropModal(index)}
                      style={{
                        position: 'absolute',
                        top: 5,
                        left: 5,
                        backgroundColor: '#F59E0B',
                        color: '#333',
                        border: 'none',
                        borderRadius: '50%',
                        width: 25,
                        height: 25,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <FaEdit size={12} />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      type="button"
                      onClick={() => removeImage(index)}
                      style={{
                        position: 'absolute',
                        top: 5,
                        right: 5,
                        backgroundColor: '#EF4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: 25,
                        height: 25,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <FaTimes size={12} />
                    </motion.button>

                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: 5
                    }}>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        type="button"
                        onClick={() => moveImage(index, 'left')}
                        disabled={index === 0}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'white',
                          cursor: index === 0 ? 'not-allowed' : 'pointer',
                          fontSize: 14,
                          fontWeight: 'bold',
                          opacity: index === 0 ? 0.5 : 1
                        }}
                      >
                        ◀
                      </motion.button>
                      <span style={{ color: 'white', fontSize: 12 }}>{index === 0 ? 'Utama' : index + 1}</span>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        type="button"
                        onClick={() => moveImage(index, 'right')}
                        disabled={index === imageFiles.length - 1}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'white',
                          cursor: index === imageFiles.length - 1 ? 'not-allowed' : 'pointer',
                          fontSize: 14,
                          fontWeight: 'bold',
                          opacity: index === imageFiles.length - 1 ? 0.5 : 1
                        }}
                      >
                        ▶
                      </motion.button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              style={{
                padding: '12px 24px',
                backgroundColor: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <FaCheck /> Simpan Produk
            </motion.button>
          </motion.form>
        )}

        {/* Product List */}
        <div>
          {products.map((product, idx) => {
            const parsedImages = parseImages(product.image);
            const mainImage = parsedImages.length > 0 ? `http://localhost:3000${parsedImages[0]}` : null;

            return (
              <motion.div
                key={product.ID}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: 20,
                  borderBottom: `1px solid ${theme.border}`
                }}
              >
                <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                  {mainImage ? (
                    <img
                      src={mainImage}
                      alt={product.name}
                      style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }}
                    />
                  ) : (
                    <div style={{
                      width: 80,
                      height: 80,
                      backgroundColor: theme.bg,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      color: theme.textSecondary,
                      border: `1px solid ${theme.border}`
                    }}>
                      No Image
                    </div>
                  )}
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', color: theme.text }}>{product.name}</h4>
                    <p style={{ margin: 0, color: '#10B981', fontWeight: 600 }}>
                      Rp {product.price.toLocaleString('id-ID')}
                    </p>
                    <p style={{ margin: '5px 0 0 0', color: theme.textSecondary, fontSize: 12 }}>
                      {parsedImages.length} Foto Tersimpan
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => openEditForm(product)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#F59E0B',
                      border: 'none',
                      borderRadius: 8,
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: 'white'
                    }}
                  >
                    Edit
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => handleDelete(product.ID)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#EF4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Hapus
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>
          </>
        )}

        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 25 }}>
              <h3 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: theme.text }}>
                Informasi Toko
              </h3>
              {!isEditingProfile && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setIsEditingProfile(true)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#F59E0B',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <FaEdit /> Edit Profil
                </motion.button>
              )}
            </div>

            {isEditingProfile ? (
              <form onSubmit={handleSaveProfile}>
                <div style={{ marginBottom: 15 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: theme.text }}>Nama Toko</label>
                  <input
                    type="text"
                    required
                    value={shopProfile.shop_name}
                    onChange={(e) => setShopProfile({ ...shopProfile, shop_name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: 12,
                      borderRadius: 8,
                      border: `1px solid ${theme.border}`,
                      backgroundColor: theme.inputBg,
                      color: theme.text,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: 15 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: theme.text }}>Deskripsi Toko</label>
                  <textarea
                    rows="4"
                    value={shopProfile.description}
                    onChange={(e) => setShopProfile({ ...shopProfile, description: e.target.value })}
                    style={{
                      width: '100%',
                      padding: 12,
                      borderRadius: 8,
                      border: `1px solid ${theme.border}`,
                      backgroundColor: theme.inputBg,
                      color: theme.text,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: 15 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: theme.text }}>Lokasi Toko (Provinsi)</label>
                  <input
                    list="provinces-list"
                    required
                    placeholder="Ketik atau pilih provinsi..."
                    value={shopProfile.province}
                    onChange={(e) => setShopProfile({ ...shopProfile, province: e.target.value })}
                    style={{
                      width: '100%',
                      padding: 12,
                      borderRadius: 8,
                      border: `1px solid ${theme.border}`,
                      backgroundColor: theme.inputBg,
                      color: theme.text,
                      boxSizing: 'border-box'
                    }}
                  />
                  <datalist id="provinces-list">
                    {provinces.map((prov, index) => (
                      <option key={index} value={prov} />
                    ))}
                  </datalist>
                </div>

                <div style={{ marginBottom: 25 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: theme.text }}>Alamat Lengkap Toko</label>
                  <textarea
                    rows="3"
                    required
                    value={shopProfile.address}
                    onChange={(e) => setShopProfile({ ...shopProfile, address: e.target.value })}
                    placeholder="Masukkan alamat lengkap dengan kecamatan, kelurahan, jalan, no rumah..."
                    style={{
                      width: '100%',
                      padding: 12,
                      borderRadius: 8,
                      border: `1px solid ${theme.border}`,
                      backgroundColor: theme.inputBg,
                      color: theme.text,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 15 }}>
                  <motion.button
                    type="submit"
                    disabled={savingProfile}
                    whileHover={{ scale: 1.05 }}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#10B981',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      fontWeight: 600,
                      cursor: savingProfile ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      opacity: savingProfile ? 0.7 : 1
                    }}
                  >
                    <FaCheck /> {savingProfile ? 'Menyimpan...' : 'Simpan Profil'}
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => {
                      setIsEditingProfile(false);
                      fetchShopProfile(); // reset changes
                    }}
                    whileHover={{ scale: 1.05 }}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#6B7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Batal
                  </motion.button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <p style={{ color: theme.textSecondary, marginBottom: 5 }}>Nama Toko</p>
                  <p style={{ color: theme.text, fontWeight: 600, fontSize: 16 }}>{shopProfile.shop_name || '-'}</p>
                </div>
                <div>
                  <p style={{ color: theme.textSecondary, marginBottom: 5 }}>Provinsi</p>
                  <p style={{ color: theme.text, fontWeight: 600, fontSize: 16 }}>{shopProfile.province || '-'}</p>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <p style={{ color: theme.textSecondary, marginBottom: 5 }}>Deskripsi Toko</p>
                  <p style={{ color: theme.text, fontSize: 16 }}>{shopProfile.description || '-'}</p>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <p style={{ color: theme.textSecondary, marginBottom: 5 }}>Alamat Lengkap</p>
                  <p style={{ color: theme.text, fontSize: 16 }}>{shopProfile.address || '-'}</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Crop Modal */}
      <ImageCropModal
        isOpen={showCropModal}
        onClose={() => {
          setShowCropModal(false);
          setImageToCrop(null);
        }}
        imageSrc={imageToCrop?.url}
        imageSize={imageSize}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}

export default SellerDashboard;
