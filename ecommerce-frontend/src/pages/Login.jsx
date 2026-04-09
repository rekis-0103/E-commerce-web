import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

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

      setMessage(`Berhasil! Mengalihkan...`);
      
      setTimeout(() => {
        if (response.data.role === 'seller') {
          navigate('/dashboard');
        } else if (response.data.role === 'admin') {
          navigate('/admin'); 
        } else {
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

  const styles = {
    pageBackground: {
      fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      backgroundColor: '#F8F9FA', // Latar belakang abu-abu sangat muda
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    loginCard: {
      backgroundColor: '#FFFFFF', // Kotak Putih
      padding: '50px',
      borderRadius: '24px', // Kotak tumpul
      boxShadow: '0 12px 24px rgba(0,0,0,0.06)', // Bayangan lembut
      width: '400px',
      textAlign: 'center',
    },
    title: {
      fontSize: '28px',
      fontWeight: '800',
      marginBottom: '40px',
      color: '#333',
    },
    input: {
      width: '100%',
      padding: '15px',
      marginBottom: '20px',
      borderRadius: '12px', // Input tumpul
      border: '1px solid #ddd',
      fontSize: '16px',
      boxSizing: 'border-box', // Penting agar padding tidak melebarkan input
    },
    button: {
      width: '100%',
      padding: '15px',
      backgroundColor: '#007bff', // Warna primer modern
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: '17px',
      transition: 'background-color 0.2s',
    },
    message: {
      marginTop: '25px',
      fontWeight: 'bold',
      fontSize: '15px',
    },
    linkP: {
      marginTop: '30px',
      fontSize: '15px',
      color: '#6c757d',
    },
    link: {
      color: '#007bff',
      textDecoration: 'none',
      fontWeight: '600',
    }
  };

  return (
    <div style={styles.pageBackground}>
      <div style={styles.loginCard}>
        <h2 style={styles.title}>Masuk ke Akun</h2>
        <form onSubmit={handleLogin}>
          <input 
            type="email" 
            placeholder="Alamat Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            style={styles.input} 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            style={styles.input} 
          />
          <button type="submit" style={styles.button}>Masuk</button>
        </form>
        
        {message && <p style={{...styles.message, color: message.includes('Berhasil') ? 'green' : 'red'}}>{message}</p>}
        
        <p style={styles.linkP}>
          Belum punya akun? <Link to="/register" style={styles.link}>Daftar sekarang</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;