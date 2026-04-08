import { useNavigate } from 'react-router-dom';

function SellerDashboard() {
  const navigate = useNavigate();
  // Mengambil role dari memori browser yang disimpan saat login
  const role = localStorage.getItem('role');

  const handleLogout = () => {
    // Hapus token dan role, lalu kembalikan ke halaman login
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  // Keamanan ekstra di sisi frontend
  if (role !== 'seller') {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <h2>Akses Ditolak 🛑</h2>
        <p>Halaman ini khusus untuk Penjual.</p>
        <button onClick={() => navigate('/login')}>Kembali ke Login</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '50px', fontFamily: 'Arial' }}>
      <h2>Dashboard Toko</h2>
      <p>Selamat datang di panel manajemen toko Anda.</p>
      
      <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h3>📦 Daftar Produk</h3>
        <p>Belum ada produk di etalase Anda.</p>
        <button style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          + Tambah Produk
        </button>
      </div>

      <button onClick={handleLogout} style={{ marginTop: '30px', padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
        Logout
      </button>
    </div>
  );
}

export default SellerDashboard;