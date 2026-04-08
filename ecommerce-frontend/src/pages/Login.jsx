import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate(); // 2. Inisialisasi navigate

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('Proses login...');

    try {
      const response = await axios.post('http://localhost:3000/api/login', {
        email: email,
        password: password
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.role);

      setMessage(`Berhasil! Anda login sebagai: ${response.data.role}`);
      
      // 3. Arahkan ke dashboard otomatis setelah 1 detik
      setTimeout(() => {
        if (response.data.role === 'seller') {
          navigate('/dashboard');
        } else if (response.data.role === 'admin') {
          // Nanti kita buat halaman admin
          navigate('/admin'); 
        } else {
          // Nanti kita buat halaman beranda untuk pembeli
          navigate('/home'); 
        }
      }, 1000); 

    } catch (error) {
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
        <input type="email" placeholder="Masukkan Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '10px' }} />
        <input type="password" placeholder="Masukkan Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '10px' }} />
        <button type="submit" style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>Login</button>
      </form>
      {message && <p style={{ marginTop: '20px', fontWeight: 'bold' }}>{message}</p>}
    </div>
  );
}

export default Login;