import { useState } from 'react';
import axios from 'axios';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault(); // Mencegah halaman reload saat tombol ditekan
    setMessage('Proses login...');

    try {
      // Mengirim request POST ke API Go kita
      const response = await axios.post('http://localhost:3000/api/login', {
        email: email,
        password: password
      });

      // Simpan KTP (Token) dan Role ke memori browser
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.role);

      setMessage(`Berhasil! Anda login sebagai: ${response.data.role}`);
      
      // Catatan: Nanti kita akan tambahkan kode untuk pindah ke halaman Dashboard otomatis di sini

    } catch (error) {
      // Menangkap pesan error dari backend (misal: Password salah)
      if (error.response) {
        setMessage(error.response.data.message);
      } else {
        setMessage('Tidak dapat terhubung ke server');
      }
    }
  };

  return (
    <div style={{ padding: '50px', fontFamily: 'Arial' }}>
      <h2>Masuk ke E-Commerce</h2>
      
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', width: '300px', gap: '15px' }}>
        <input 
          type="email" 
          placeholder="Masukkan Email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: '10px' }}
        />
        
        <input 
          type="password" 
          placeholder="Masukkan Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: '10px' }}
        />
        
        <button type="submit" style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
          Login
        </button>
      </form>

      {/* Menampilkan pesan sukses / error */}
      {message && <p style={{ marginTop: '20px', fontWeight: 'bold' }}>{message}</p>}
    </div>
  );
}

export default Login;