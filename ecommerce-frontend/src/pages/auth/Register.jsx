import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';
import { FaEnvelope, FaLock, FaUser, FaEye, FaEyeSlash, FaSun } from 'react-icons/fa';
import bgImage from '../../assets/background.jpg';

function Register() {
  const { darkMode, toggleDarkMode, theme } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('Memproses pendaftaran...');

    try {
      await axios.post('http://localhost:3000/api/register', {
        name,
        email,
        password
      });

      setMessage('Pendaftaran Berhasil! Mengalihkan ke halaman login...');
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
    setIsLoading(false);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif", background: theme.bg, transition: 'all 0.3s ease' }}>

      {/* LEFT (MARKETPLACE HERO) */}
      <div style={{
        flex: 1,
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        display: window.innerWidth < 768 ? 'none' : 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        padding: '40px'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.85), rgba(55, 65, 81, 0.75))'
        }} />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ zIndex: 1, maxWidth: 500 }}
        >
          <h1 style={{
            fontSize: 48,
            fontWeight: 800,
            fontFamily: "'Poppins', sans-serif",
            marginBottom: 20,
            lineHeight: 1.2,
            background: 'linear-gradient(to right, #FFFFFF, #E5E7EB)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Bergabung Sekarang
          </h1>
          <p style={{
            fontSize: 18,
            opacity: 0.95,
            lineHeight: 1.6,
            color: '#F3F4F6'
          }}>
            Buat akun gratis dan mulai berbelanja di marketplace terpercaya.
          </p>
        </motion.div>
      </div>

      {/* RIGHT (FORM) */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: theme.bg,
        padding: '40px 20px',
        position: 'relative'
      }}>
        {/* Dark Mode Toggle */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleDarkMode}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: theme.cardBg,
            border: `1px solid ${theme.border}`,
            borderRadius: '50%',
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: `0 2px 8px ${theme.shadow}`,
            fontSize: 20,
            color: theme.text,
            transition: 'all 0.3s ease'
          }}
        >
          {darkMode ? <FaSun /> : '🌙'}
        </motion.button>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            width: '100%',
            maxWidth: 450,
            background: theme.cardBg,
            padding: '48px 40px',
            borderRadius: 24,
            boxShadow: theme.shadow,
            border: `1px solid ${theme.border}`
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{
              fontSize: 32,
              fontWeight: 700,
              fontFamily: "'Poppins', sans-serif",
              color: theme.text,
              marginBottom: 8
            }}>
              Daftar Akun Baru
            </h2>
            <p style={{ fontSize: 15, color: theme.textSecondary }}>
              Isi data diri Anda untuk membuat akun
            </p>
          </div>

          <form onSubmit={handleRegister}>
            {/* Nama */}
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <FaUser style={{
                position: 'absolute',
                top: '50%',
                left: 16,
                transform: 'translateY(-50%)',
                color: theme.textSecondary,
                fontSize: 16,
                pointerEvents: 'none'
              }} />
              <input
                type="text"
                placeholder="Nama Lengkap"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px 16px 16px 48px',
                  borderRadius: 12,
                  border: `2px solid ${theme.inputBorder}`,
                  background: theme.inputBg,
                  color: theme.text,
                  fontSize: 15,
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = theme.primary;
                  e.target.style.boxShadow = `0 0 0 4px rgba(37, 99, 235, 0.1)`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = theme.inputBorder;
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Email */}
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <FaEnvelope style={{
                position: 'absolute',
                top: '50%',
                left: 16,
                transform: 'translateY(-50%)',
                color: theme.textSecondary,
                fontSize: 16,
                pointerEvents: 'none'
              }} />
              <input
                type="email"
                placeholder="Alamat Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px 16px 16px 48px',
                  borderRadius: 12,
                  border: `2px solid ${theme.inputBorder}`,
                  background: theme.inputBg,
                  color: theme.text,
                  fontSize: 15,
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = theme.primary;
                  e.target.style.boxShadow = `0 0 0 4px rgba(37, 99, 235, 0.1)`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = theme.inputBorder;
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Password */}
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <FaLock style={{
                position: 'absolute',
                top: '50%',
                left: 16,
                transform: 'translateY(-50%)',
                color: theme.textSecondary,
                fontSize: 16,
                pointerEvents: 'none'
              }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Buat Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px 48px 16px 48px',
                  borderRadius: 12,
                  border: `2px solid ${theme.inputBorder}`,
                  background: theme.inputBg,
                  color: theme.text,
                  fontSize: 15,
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = theme.primary;
                  e.target.style.boxShadow = `0 0 0 4px rgba(37, 99, 235, 0.1)`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = theme.inputBorder;
                  e.target.style.boxShadow = 'none';
                }}
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  cursor: 'pointer',
                  color: theme.textSecondary,
                  transition: 'color 0.2s ease',
                  fontSize: 16
                }}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: 18,
                borderRadius: 12,
                border: 'none',
                background: theme.gradient,
                color: 'white',
                fontSize: 16,
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                transition: 'all 0.3s ease'
              }}
            >
              {isLoading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    display: 'inline-block',
                    width: 20,
                    height: 20,
                    border: '3px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '50%',
                    borderTopColor: 'white',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  Memproses...
                </span>
              ) : 'Daftar Sekarang'}
            </motion.button>
          </form>

          {message && (
            <p style={{
              marginTop: 20,
              textAlign: 'center',
              color: message.includes('Berhasil') ? '#10B981' : '#EF4444',
              fontWeight: 600,
              fontSize: 15
            }}>
              {message}
            </p>
          )}

          <p style={{
            marginTop: 24,
            textAlign: 'center',
            fontSize: 15,
            color: theme.textSecondary
          }}>
            Sudah punya akun?{' '}
            <Link
              to="/login"
              style={{
                color: theme.primary,
                textDecoration: 'none',
                fontWeight: 600,
                transition: 'color 0.2s ease'
              }}
            >
              Login di sini
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default Register;
