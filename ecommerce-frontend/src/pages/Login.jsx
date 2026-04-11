import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';
import { FaEnvelope, FaLock, FaUser, FaKey, FaEye, FaEyeSlash, FaSun, FaMoon, FaShoppingCart, FaTruck, FaShieldAlt, FaPercent } from 'react-icons/fa';
import bgImage from '../assets/background.jpg';

function Login() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const navigate = useNavigate();

  // 🔤 Typing animation
  const texts = [
    "Belanja Mudah & Aman",
    "Diskon Setiap Hari 🔥",
    "Login Cepat Dengan Google",
    "Platform Marketplace Modern"
  ];

  const [displayText, setDisplayText] = useState('');
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    const current = texts[textIndex];

    if (charIndex < current.length) {
      const t = setTimeout(() => {
        setDisplayText(prev => prev + current[charIndex]);
        setCharIndex(charIndex + 1);
      }, 40);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setDisplayText('');
        setCharIndex(0);
        setTextIndex((textIndex + 1) % texts.length);
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [charIndex, textIndex]);

  // Load dark mode preference
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    if (darkMode) {
      document.body.style.backgroundColor = '#0F172A';
      document.body.style.color = '#F9FAFB';
    } else {
      document.body.style.backgroundColor = '#F9FAFB';
      document.body.style.color = '#111827';
    }
  }, [darkMode]);

  // LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await axios.post('http://localhost:3000/api/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      res.data.role === 'seller' ? navigate('/dashboard') : navigate('/home');
    } catch {
      alert("Email atau password salah!");
    }
    setIsLoading(false);
  };

  // OTP
  const handleRequestOTP = async () => {
    if (!email) return alert("Isi email dulu!");
    setIsLoading(true);
    try {
      await axios.post('http://localhost:3000/api/auth/request-otp', { email });
      setOtpSent(true);
      alert("OTP dikirim!");
    } catch {
      alert("Gagal kirim OTP");
    }
    setIsLoading(false);
  };

  // REGISTER
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!otpSent) return alert("Minta OTP dulu!");
    if (!otp) return alert("Isi OTP!");

    setIsLoading(true);
    try {
      await axios.post('http://localhost:3000/api/register', { name, email, password, otp });
      alert("Berhasil daftar!");
      setIsLoginView(true);
    } catch {
      alert("Gagal daftar");
    }
    setIsLoading(false);
  };

  // GOOGLE
  const handleGoogleSuccess = async (res) => {
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:3000/api/auth/google', {
        token: res.credential
      });
      localStorage.setItem('token', response.data.token);
      navigate('/home');
    } catch {
      alert("Google gagal");
    }
    setIsLoading(false);
  };

  // 🎨 THEME
  const theme = {
    bg: darkMode ? '#0F172A' : '#F9FAFB',
    cardBg: darkMode ? '#1E293B' : '#FFFFFF',
    text: darkMode ? '#F9FAFB' : '#111827',
    textSecondary: darkMode ? '#9CA3AF' : '#6B7280',
    border: darkMode ? '#374151' : '#E5E7EB',
    inputBg: darkMode ? '#1E293B' : '#FFFFFF',
    inputBorder: darkMode ? '#374151' : '#E5E7EB',
    primary: '#2563EB',
    primaryHover: '#1D4ED8',
    gradient: darkMode 
      ? 'linear-gradient(135deg, #1E3A8A, #1E40AF)' 
      : 'linear-gradient(135deg, #111827, #374151)',
    shadow: darkMode 
      ? '0 20px 60px rgba(0, 0, 0, 0.4)' 
      : '0 20px 60px rgba(0, 0, 0, 0.1)',
  };

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
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
              {displayText}<span style={{ 
                display: 'inline-block', 
                width: 3, 
                height: '1em', 
                background: 'white', 
                marginLeft: 4,
                animation: 'blink 1s infinite' 
              }} />
            </h1>
            <p style={{ 
              fontSize: 18, 
              opacity: 0.95, 
              lineHeight: 1.6,
              color: '#F3F4F6'
            }}>
              Marketplace terpercaya dengan ribuan produk terbaik.
            </p>

            {/* Features */}
            <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { icon: <FaShoppingCart />, text: 'Belanja Mudah & Cepat' },
                { icon: <FaTruck />, text: 'Gratis Ongkir Setiap Hari' },
                { icon: <FaShieldAlt />, text: 'Pembayaran Aman & Terjamin' },
                { icon: <FaPercent />, text: 'Diskon Hingga 70%' }
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 12,
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <span style={{ fontSize: 24, color: '#60A5FA' }}>{item.icon}</span>
                  <span style={{ fontSize: 15, fontWeight: 500 }}>{item.text}</span>
                </motion.div>
              ))}
            </div>
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
            onClick={() => setDarkMode(!darkMode)}
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
            {darkMode ? <FaSun /> : <FaMoon />}
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
                {isLoginView ? 'Masuk Akun' : 'Daftar Akun'}
              </h2>
              <p style={{ fontSize: 15, color: theme.textSecondary }}>
                {isLoginView ? 'Selamat datang kembali! Silakan masuk' : 'Buat akun baru untuk mulai berbelanja'}
              </p>
            </div>

            <form onSubmit={isLoginView ? handleLogin : handleRegister}>

              {!isLoginView && (
                <Input 
                  icon={<FaUser />} 
                  value={name} 
                  setValue={setName} 
                  placeholder="Nama Lengkap" 
                  theme={theme} 
                />
              )}

              <Input 
                icon={<FaEnvelope />} 
                value={email} 
                setValue={setEmail} 
                placeholder="Email" 
                theme={theme} 
              />

              {/* PASSWORD */}
              <div style={{ position: 'relative', marginBottom: 20 }}>
                <FaLock style={{
                  position: 'absolute',
                  top: '50%',
                  left: 16,
                  transform: 'translateY(-50%)',
                  color: theme.textSecondary,
                  fontSize: 16
                }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  style={{
                    width: '100%',
                    padding: '16px 48px',
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

              {!isLoginView && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <FaKey style={{
                      position: 'absolute',
                      top: '50%',
                      left: 16,
                      transform: 'translateY(-50%)',
                      color: theme.textSecondary,
                      fontSize: 16,
                      pointerEvents: 'none'
                    }} />
                    <input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Kode OTP"
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
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button" 
                    onClick={handleRequestOTP}
                    disabled={isLoading}
                    style={{
                      padding: '0 24px',
                      borderRadius: 12,
                      border: 'none',
                      background: theme.gradient,
                      color: 'white',
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      opacity: isLoading ? 0.6 : 1,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {otpSent ? 'Ulang OTP' : 'Kirim OTP'}
                  </motion.button>
                </div>
              )}

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
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
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
                ) : (isLoginView ? 'Masuk' : 'Daftar')}
              </motion.button>
            </form>

            <div style={{ 
              margin: '24px 0', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 16 
            }}>
              <div style={{ flex: 1, height: 1, background: theme.border }} />
              <span style={{ fontSize: 14, color: theme.textSecondary, fontWeight: 500 }}>atau</span>
              <div style={{ flex: 1, height: 1, background: theme.border }} />
            </div>

            <div style={{
              borderRadius: 12,
              overflow: 'hidden',
              border: `2px solid ${theme.border}`,
              transition: 'all 0.3s ease'
            }}>
              <GoogleLogin 
                onSuccess={handleGoogleSuccess}
                width="100%"
              />
            </div>

            <p style={{ 
              marginTop: 24, 
              textAlign: 'center',
              fontSize: 15,
              color: theme.textSecondary
            }}>
              {isLoginView ? 'Belum punya akun?' : 'Sudah punya akun?'}
              <span
                onClick={() => setIsLoginView(!isLoginView)}
                style={{ 
                  color: theme.primary, 
                  cursor: 'pointer', 
                  marginLeft: 5,
                  fontWeight: 600,
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = theme.primaryHover}
                onMouseLeave={(e) => e.target.style.color = theme.primary}
              >
                {isLoginView ? 'Daftar Sekarang' : 'Masuk'}
              </span>
            </p>

          </motion.div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}

// 🔧 COMPONENT INPUT
const Input = ({ icon, value, setValue, placeholder, theme }) => (
  <div style={{ position: 'relative', marginBottom: 20 }}>
    <span style={{
      position: 'absolute',
      top: '50%',
      left: 16,
      transform: 'translateY(-50%)',
      color: theme.textSecondary,
      fontSize: 16,
      pointerEvents: 'none'
    }}>
      {icon}
    </span>
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
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
);

export default Login;