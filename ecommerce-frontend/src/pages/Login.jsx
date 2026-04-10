import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { FaEnvelope, FaLock, FaUser, FaKey } from 'react-icons/fa';

function Login() {
  const [isLoginView, setIsLoginView] = useState(true); // True = Layar Login, False = Layar Register
  
  // State Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();

  // 1. FUNGSI LOGIN (HANYA EMAIL & PASSWORD)
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:3000/api/login', { email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.role);
      
      if (response.data.role === 'seller') navigate('/dashboard');
      else navigate('/home');
    } catch (error) {
      alert(error.response?.data?.message || "Email atau Password salah!");
    }
    setIsLoading(false);
  };

  // 2. FUNGSI MINTA OTP (KHUSUS SAAT REGISTER)
  const handleRequestOTP = async () => {
    if (!email) return alert("Isi alamat email terlebih dahulu agar kami bisa mengirim OTP!");
    
    setIsLoading(true);
    try {
      await axios.post('http://localhost:3000/api/auth/request-otp', { email });
      setOtpSent(true);
      alert("✅ OTP berhasil dikirim ke " + email);
    } catch (error) {
      alert(error.response?.data?.message || "Gagal mengirim OTP.");
    }
    setIsLoading(false);
  };

  // 3. FUNGSI REGISTER (NAMA, EMAIL, PASSWORD, OTP)
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!otpSent) return alert("Silakan klik 'Minta OTP' dan masukkan kodenya terlebih dahulu!");
    if (!otp) return alert("Masukkan 6 digit kode OTP!");
    
    setIsLoading(true);
    try {
      await axios.post('http://localhost:3000/api/register', { name, email, password, otp });
      alert("🎉 Pendaftaran Berhasil! Silakan masuk dengan email dan password Anda.");
      
      // Bersihkan form & pindah ke mode Login
      setIsLoginView(true); 
      setPassword('');
      setOtp('');
      setOtpSent(false);
    } catch (error) {
      alert(error.response?.data?.message || "Gagal mendaftar. OTP mungkin salah.");
    }
    setIsLoading(false);
  };

  // 4. FUNGSI LOGIN / REGISTER VIA GOOGLE (BISA KAPAN SAJA)
  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:3000/api/auth/google', { 
        token: credentialResponse.credential 
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.role);
      
      if (response.data.role === 'seller') navigate('/dashboard');
      else navigate('/home');
    } catch (error) {
      alert("Gagal terhubung dengan Google.");
    }
    setIsLoading(false);
  };

  // ----- DESAIN UI -----
  const styles = {
    wrapper: { minHeight: '100vh', display: 'flex', backgroundColor: '#F3F4F6', fontFamily: "'Inter', sans-serif" },
    leftPanel: { flex: 1, background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px', color: 'white' },
    rightPanel: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' },
    formBox: { width: '100%', maxWidth: '420px', backgroundColor: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' },
    title: { margin: '0 0 8px 0', fontSize: '28px', fontWeight: '800', color: '#111827' },
    subtitle: { margin: '0 0 25px 0', fontSize: '15px', color: '#6B7280' },
    
    inputGroup: { position: 'relative', marginBottom: '16px' },
    inputIcon: { position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: '#9CA3AF', fontSize: '16px' },
    input: { width: '100%', padding: '14px 16px 14px 45px', borderRadius: '12px', border: '1px solid #D1D5DB', fontSize: '14px', boxSizing: 'border-box', outline: 'none' },
    
    // Ini style khusus untuk membungkus Input OTP dan Tombol OTP bersebelahan
    otpWrapper: { display: 'flex', gap: '10px', marginBottom: '16px' },
    btnOtp: { padding: '0 16px', backgroundColor: '#E0E7FF', color: '#4F46E5', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap', transition: '0.2s' },
    
    btnPrimary: { width: '100%', padding: '14px', backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
    divider: { display: 'flex', alignItems: 'center', textAlign: 'center', margin: '24px 0', color: '#9CA3AF', fontSize: '13px' },
    line: { flex: 1, borderBottom: '1px solid #E5E7EB' },
    
    toggleText: { textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#4B5563' },
    link: { color: '#3B82F6', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline', background: 'none', border: 'none', padding: 0, marginLeft: '5px' }
  };

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <div style={styles.wrapper}>
        
        {/* Panel Kiri (Hanya muncul di Desktop) */}
        <div style={{...styles.leftPanel, display: window.innerWidth < 768 ? 'none' : 'flex'}}>
          <h1 style={{ fontSize: '48px', fontWeight: '900', margin: '0 0 20px 0', lineHeight: '1.2' }}>Mulai<br/>Belanja<br/>Sekarang.</h1>
          <p style={{ fontSize: '18px', opacity: '0.9', maxWidth: '350px' }}>Keamanan akun Anda adalah prioritas kami dengan teknologi verifikasi ganda.</p>
        </div>

        {/* Panel Kanan (Formulir) */}
        <div style={styles.rightPanel}>
          <div style={styles.formBox}>
            
            <h2 style={styles.title}>{isLoginView ? 'Selamat Datang' : 'Buat Akun Baru'}</h2>
            <p style={styles.subtitle}>{isLoginView ? 'Masuk dengan email dan password Anda.' : 'Daftar sekarang, gratis dan aman.'}</p>

            <form onSubmit={isLoginView ? handleLogin : handleRegister}>
              
              {/* === HANYA MUNCUL SAAT REGISTER === */}
              {!isLoginView && (
                <div style={styles.inputGroup}>
                  <FaUser style={styles.inputIcon} />
                  <input type="text" placeholder="Nama Lengkap" value={name} onChange={(e) => setName(e.target.value)} style={styles.input} required />
                </div>
              )}

              {/* === EMAIL & PASSWORD (MUNCUL DI LOGIN & REGISTER) === */}
              <div style={styles.inputGroup}>
                <FaEnvelope style={styles.inputIcon} />
                <input type="email" placeholder="Alamat Email" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} required />
              </div>

              <div style={styles.inputGroup}>
                <FaLock style={styles.inputIcon} />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} required />
              </div>

              {/* === HANYA MUNCUL SAAT REGISTER (OTP BERSAMPINGAN) === */}
              {!isLoginView && (
                <div style={styles.otpWrapper}>
                  {/* Kotak Input OTP */}
                  <div style={{ position: 'relative', flex: 1 }}>
                    <FaKey style={styles.inputIcon} />
                    <input type="text" placeholder="Kode OTP (6 Digit)" value={otp} onChange={(e) => setOtp(e.target.value)} style={styles.input} maxLength="6" required />
                  </div>
                  
                  {/* Tombol Kirim OTP di samping kotak */}
                  <button type="button" onClick={handleRequestOTP} style={styles.btnOtp} disabled={isLoading}>
                    {isLoading ? '...' : (otpSent ? 'Kirim Ulang' : 'Minta OTP')}
                  </button>
                </div>
              )}

              {/* Tombol Aksi Utama */}
              <button type="submit" style={styles.btnPrimary} disabled={isLoading}>
                {isLoading ? 'Memproses...' : (isLoginView ? 'Masuk Sekarang' : 'Daftar & Verifikasi')}
              </button>
            </form>

            {/* === TOMBOL GOOGLE (SELALU MUNCUL) === */}
            <div style={styles.divider}>
              <div style={styles.line}></div><span style={{ padding: '0 15px' }}>Atau gunakan</span><div style={styles.line}></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <GoogleLogin 
                onSuccess={handleGoogleSuccess} 
                onError={() => alert('Gagal terhubung dengan Google')}
                shape="rectangular"
                size="large"
                width="100%"
                text={isLoginView ? "signin_with" : "signup_with"}
              />
            </div>

            {/* === TOMBOL PINDAH MODE LOGIN / REGISTER === */}
            <div style={styles.toggleText}>
              {isLoginView ? (
                <>Belum punya akun? <button onClick={() => setIsLoginView(false)} style={styles.link}>Daftar di sini</button></>
              ) : (
                <>Sudah punya akun? <button onClick={() => setIsLoginView(true)} style={styles.link}>Masuk di sini</button></>
              )}
            </div>

          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}

export default Login;