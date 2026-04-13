import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ImageCropModal from '../components/ImageCropModal';
import { FaEdit, FaTimes } from 'react-icons/fa';

function SellerDashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const token = localStorage.getItem('token');

  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [formData, setFormData] = useState({ name: '', description: '', price: '', stock: '' });

  // State khusus untuk menampung array gambar
  const [imageFiles, setImageFiles] = useState([]); // { id, file, url, isOld }

  // State untuk ukuran kotak gambar (default 800x800)
  const [imageSize, setImageSize] = useState(800);

  const fileInputRef = useRef(null);

  // State untuk crop modal
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null); // { index, url }

  useEffect(() => {
    if (role !== 'seller') navigate('/login');
    else fetchProducts();
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

      // If token is missing/invalid, force re-login to refresh token
      if (status === 401) {
        localStorage.clear();
        navigate('/login');
      }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // --- LOGIKA MULTI GAMBAR ---

  // Fungsi untuk crop dan resize gambar menjadi kotak
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

          // Hitung dimensi untuk crop center
          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;

          // Draw image cropped to center square and resized
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);

          // Convert to blob
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
      // Crop dan resize gambar menjadi kotak
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

    // Reset input file agar bisa pilih file yang sama lagi jika dihapus
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

  // Fungsi untuk membuka crop modal
  const openCropModal = (index) => {
    setImageToCrop({ index, url: imageFiles[index].url });
    setShowCropModal(true);
  };

  // Fungsi ketika crop selesai
  const handleCropComplete = async (croppedFile) => {
    if (imageToCrop === null) return;

    console.log('Crop complete dipanggil dengan file:', croppedFile);

    const newImages = [...imageFiles];
    const oldImage = newImages[imageToCrop.index];

    // Hapus URL lama jika ada
    if (oldImage.url && oldImage.url.startsWith('blob:')) {
      URL.revokeObjectURL(oldImage.url);
    }

    // Ganti dengan gambar yang sudah di-crop
    newImages[imageToCrop.index] = {
      id: oldImage.id,
      file: croppedFile,
      url: URL.createObjectURL(croppedFile),
      isOld: false // Karena sudah di-edit, anggap sebagai gambar baru
    };

    console.log('Image files setelah crop:', newImages);
    setImageFiles(newImages);
    setImageToCrop(null);
  };

  // Membantu mengubah string JSON dari database menjadi array asli
  const parseImages = (imageString) => {
    try {
      return JSON.parse(imageString || "[]");
    } catch {
      return []; // Jika gagal parse, kembalikan array kosong
    }
  };

  // --- LOGIKA FORM ---

  const openCreateForm = () => {
    setFormData({ name: '', description: '', price: '', stock: '' });
    setImageFiles([]); // Kosongkan daftar gambar
    setImageSize(800); // Reset ke ukuran default
    setIsEditing(false);
    setShowForm(true);
  };

  const openEditForm = (product) => {
    setFormData({ name: product.name, description: product.description, price: product.price, stock: product.stock });
    setImageSize(800); // Reset ke ukuran default untuk edit
    
    // Tarik gambar lama dari database
    const oldImages = parseImages(product.image).map(url => ({
      id: Math.random().toString(36).substr(2, 9),
      file: null,
      url: `http://localhost:3000${url}`,
      originalPath: url, // Path asli untuk dikirim balik ke backend
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

    // Pisahkan gambar lama (yang masih dipertahankan) dan gambar baru
    const existingImages = imageFiles.filter(img => img.isOld).map(img => img.originalPath);
    dataToSend.append('existing_images', JSON.stringify(existingImages));

    // Masukkan file gambar baru
    imageFiles.filter(img => !img.isOld).forEach(img => {
      dataToSend.append('images', img.file); // Nama field "images"
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

  const styles = {
    // ... (Styles dasar sama)
    pageBackground: { fontFamily: "'Segoe UI', Roboto, sans-serif", backgroundColor: '#F8F9FA', minHeight: '100vh', padding: '40px 60px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
    panel: { backgroundColor: '#FFFFFF', padding: '30px', borderRadius: '20px', boxShadow: '0 8px 16px rgba(0,0,0,0.04)' },
    formContainer: { backgroundColor: '#F1F3F5', padding: '25px', borderRadius: '16px', marginBottom: '30px' },
    input: { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', width: '100%', marginBottom: '15px', boxSizing: 'border-box' },
    btnPrimary: { padding: '12px 24px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    btnSuccess: { padding: '12px 24px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginRight: '10px' },
    btnDanger: { padding: '12px 24px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    
    // Styles khusus galeri gambar
    galleryWrap: { display: 'flex', gap: '15px', flexWrap: 'wrap', marginTop: '15px' },
    imgCard: { position: 'relative', width: '120px', height: '120px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #ddd' },
    imgPreview: { width: '100%', height: '100%', objectFit: 'cover' },
    imgControls: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'space-between', padding: '5px' },
    ctrlBtn: { background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' },
    removeBtn: { position: 'absolute', top: '5px', right: '5px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '50%', width: '25px', height: '25px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    editBtn: { position: 'absolute', top: '5px', left: '5px', backgroundColor: '#ffc107', color: '#333', border: 'none', borderRadius: '50%', width: '25px', height: '25px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }
  };

  return (
    <div style={styles.pageBackground}>
      <div style={styles.header}>
        <h2 style={{ fontSize: '28px', margin: 0 }}>Dashboard Penjual</h2>
        
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => navigate('/shop-orders')} style={{ padding: '12px 24px', backgroundColor: '#ffc107', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            📦 Cek Pesanan Masuk
          </button>
          <button onClick={handleLogout} style={styles.btnDanger}>Logout</button>
        </div>
      </div>
      
      <div style={styles.panel}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
          <h3 style={{ margin: 0 }}>📦 Daftar Produk</h3>
          <button onClick={showForm ? () => setShowForm(false) : openCreateForm} style={styles.btnPrimary}>
            {showForm ? 'Batal' : '+ Tambah Produk'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} style={styles.formContainer}>
            <h4>{isEditing ? 'Edit Produk' : 'Tambah Produk Baru'}</h4>
            
            <input type="text" placeholder="Nama Produk" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={styles.input} />
            <textarea placeholder="Deskripsi produk..." required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} style={{...styles.input, minHeight: '80px'}} />
            <div style={{ display: 'flex', gap: '15px' }}>
              <input type="number" placeholder="Harga (Rp)" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} style={styles.input} />
              <input type="number" placeholder="Stok" required value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} style={styles.input} />
            </div>

            {/* AREA UPLOAD MULTI GAMBAR */}
            <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>Foto Produk (Bisa pilih banyak)</label>

              {/* Input Ukuran Gambar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                <span style={{ fontSize: '14px', color: '#666' }}>📐 Ukuran Gambar (kotak):</span>
                <input 
                  type="number" 
                  value={imageSize} 
                  onChange={(e) => setImageSize(parseInt(e.target.value) || 800)}
                  min="100"
                  max="2000"
                  step="100"
                  style={{ width: '80px', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', textAlign: 'center' }}
                />
                <span style={{ fontSize: '14px', color: '#666' }}>x {imageSize} px</span>
                <span style={{ fontSize: '12px', color: '#999', marginLeft: 'auto' }}>Gambar otomatis di-crop jadi kotak dari tengah</span>
              </div>

              <input
                type="file"
                accept="image/*"
                multiple
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              
              {/* Galeri Preview yang bisa di-reorder */}
              <div style={styles.galleryWrap}>
                {imageFiles.map((img, index) => (
                  <div key={img.id} style={styles.imgCard}>
                    <img src={img.url} alt="preview" style={styles.imgPreview} />

                    <button
                      type="button"
                      onClick={() => openCropModal(index)}
                      style={styles.editBtn}
                      title="Edit/Crop Gambar"
                    >
                      <FaEdit size={12} />
                    </button>

                    <button type="button" onClick={() => removeImage(index)} style={styles.removeBtn}>
                      <FaTimes size={12} />
                    </button>

                    <div style={styles.imgControls}>
                      <button type="button" onClick={() => moveImage(index, 'left')} style={styles.ctrlBtn} disabled={index === 0}>◀</button>
                      <span style={{color: 'white', fontSize: '12px'}}>{index === 0 ? 'Utama' : index+1}</span>
                      <button type="button" onClick={() => moveImage(index, 'right')} style={styles.ctrlBtn} disabled={index === imageFiles.length - 1}>▶</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" style={styles.btnSuccess}>Simpan Produk</button>
          </form>
        )}

        {/* Tabel List Produk */}
        <div>
          {products.map((product) => {
            const parsedImages = parseImages(product.image);
            const mainImage = parsedImages.length > 0 ? `http://localhost:3000${parsedImages[0]}` : null;

            return (
              <div key={product.ID} style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 0', borderBottom: '1px solid #eee' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  {mainImage ? (
                    <img src={mainImage} alt={product.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                  ) : (
                    <div style={{ width: '80px', height: '80px', backgroundColor: '#eee', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>No Image</div>
                  )}
                  <div>
                    <h4 style={{ margin: '0 0 5px 0' }}>{product.name}</h4>
                    <p style={{ margin: 0, color: '#28a745', fontWeight: 'bold' }}>Rp {product.price.toLocaleString('id-ID')}</p>
                    <p style={{ margin: '5px 0 0 0', color: '#6c757d', fontSize: '12px' }}>{parsedImages.length} Foto Tersimpan</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button onClick={() => openEditForm(product)} style={{ padding: '8px 16px', backgroundColor: '#ffc107', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => handleDelete(product.ID)} style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Hapus</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
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