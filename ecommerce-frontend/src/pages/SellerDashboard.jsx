import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function SellerDashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const token = localStorage.getItem('token');

  // State untuk menyimpan daftar produk dan form input
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', stock: '' });
  const [message, setMessage] = useState('');

  // Saat halaman dibuka, langsung ambil daftar produk dari backend
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/seller/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data.data);
    } catch (error) {
      console.error("Gagal mengambil data produk", error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setMessage('Menyimpan produk...');

    try {
      // Pastikan harga dan stok dikirim sebagai angka (Number)
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock)
      };

      await axios.post('http://localhost:3000/api/seller/products', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage('Produk berhasil ditambahkan!');
      setShowForm(false); // Tutup form
      setFormData({ name: '', description: '', price: '', stock: '' }); // Kosongkan form
      fetchProducts(); // Refresh daftar produk

    } catch (error) {
      setMessage('Gagal menyimpan produk.');
    }
  };

  if (role !== 'seller') {
    return <div style={{ padding: '50px' }}><h2>Akses Ditolak 🛑</h2></div>;
  }

  return (
    <div style={{ padding: '50px', fontFamily: 'Arial' }}>
      <h2>Dashboard Toko</h2>
      
      <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>📦 Daftar Produk Saya</h3>
          <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }}>
            {showForm ? 'Batal' : '+ Tambah Produk'}
          </button>
        </div>

        {message && <p style={{ color: 'green', fontWeight: 'bold' }}>{message}</p>}

        {/* Form Tambah Produk */}
        {showForm && (
          <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px', padding: '15px', backgroundColor: '#f9f9f9' }}>
            <input type="text" placeholder="Nama Produk" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ padding: '8px' }} />
            <input type="text" placeholder="Deskripsi" required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} style={{ padding: '8px' }} />
            <input type="number" placeholder="Harga (Rp)" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} style={{ padding: '8px' }} />
            <input type="number" placeholder="Stok" required value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} style={{ padding: '8px' }} />
            <button type="submit" style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>Simpan Produk</button>
          </form>
        )}

        {/* Tabel Daftar Produk */}
        <ul style={{ marginTop: '20px', paddingLeft: '0', listStyle: 'none' }}>
          {products.length === 0 ? <p>Belum ada produk di etalase Anda.</p> : null}
          {products.map((product) => (
            <li key={product.ID} style={{ padding: '15px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <strong>{product.name}</strong> - Rp {product.price} <br/>
                <small>{product.description}</small>
              </div>
              <div>Stok: {product.stock}</div>
            </li>
          ))}
        </ul>
      </div>

      <button onClick={handleLogout} style={{ marginTop: '30px', padding: '10px', backgroundColor: '#dc3545', color: 'white', border: 'none', cursor: 'pointer' }}>Logout</button>
    </div>
  );
}

export default SellerDashboard;