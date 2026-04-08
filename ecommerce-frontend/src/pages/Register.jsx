import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('Memproses pendaftaran...');

    try {
      // Mengirim data pendaftaran ke backend Go
      await axios.post('http://localhost:3000/api/register', {
        name: name,
        email: email,
        password: password
      });

      setMessage('Pendaftaran Berhasil! Mengalihkan ke halaman login...');
      
      // Jika sukses, lempar pengguna ke halaman login setelah 2 detik
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error) {
      if (error.response) {
        setMessage(error.response.data.message);
      } else {
        setMessage('Tidak dapat terhubung ke server');
      }
    }
  };

  return (
    <div style={{ padding: '50px', fontFamily: 'Arial', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '350px', padding: '30px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Daftar Akun Baru</h2>
        
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="text" placeholder="Nama Lengkap" required
            value={name} onChange={(e) => setName(e.target.value)}
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <input 
            type="email" placeholder="Alamat Email" required
            value={email} onChange={(e) => setEmail(e.target.value)}
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <input 
            type="password" placeholder="Buat Password" required
            value={password} onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          
          <button type="submit" style={{ padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            Daftar Sekarang
          </button>
        </form>

        {message && <p style={{ marginTop: '15px', textAlign: 'center', color: message.includes('Berhasil') ? 'green' : 'red', fontWeight: 'bold' }}>{message}</p>}

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
          Sudah punya akun? <Link to="/login" style={{ color: '#007bff', textDecoration: 'none' }}>Login di sini</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;