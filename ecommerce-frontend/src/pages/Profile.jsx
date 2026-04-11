import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendarAlt, FaLock, FaSave, FaArrowLeft, FaEye, FaEyeSlash } from 'react-icons/fa';
import { motion } from 'framer-motion';

function Profile() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  // State profil
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
  });

  // State untuk password
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setConfirmShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchProfile();
  }, [token, navigate]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data.data;
      setProfile({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        date_of_birth: data.date_of_birth || '',
      });
      setIsLoading(false);
    } catch (error) {
      console.error("Gagal mengambil data profil", error);
      if (error.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      }
      setIsLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // Validasi password jika diisi
    if (password || confirmPassword) {
      if (password !== confirmPassword) {
        alert("Password dan konfirmasi password tidak cocok!");
        return;
      }
      if (password.length < 6) {
        alert("Password minimal 6 karakter!");
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload = {
        name: profile.name,
        phone: profile.phone,
        address: profile.address,
        date_of_birth: profile.date_of_birth,
      };

      // Hanya kirim password jika diisi
      if (password) {
        payload.password = password;
      }

      await axios.put('http://localhost:3000/api/user/profile', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("✅ Profil berhasil diperbarui!");
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error("Gagal memperbarui profil", error);
      alert(error.response?.data?.message || "Gagal memperbarui profil");
    }
    setIsSaving(false);
  };

  // Tema desain yang konsisten dengan Login.jsx
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

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
  };

  if (isLoading) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif", background: theme.bg, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <h2 style={{ color: theme.textSecondary }}>Memuat Profil...</h2>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: theme.bg, minHeight: '100vh', padding: '40px 20px', transition: 'all 0.3s ease' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <Link to="/home" style={{ textDecoration: 'none', color: theme.primary, fontWeight: 600, fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <FaArrowLeft /> Kembali Berbelanja
          </Link>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setDarkMode(!darkMode);
              localStorage.setItem('darkMode', !darkMode);
            }}
            style={{
              background: theme.cardBg,
              border: `1px solid ${theme.border}`,
              borderRadius: '50%',
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 20,
              color: theme.text,
              transition: 'all 0.3s ease',
            }}
          >
            {darkMode ? '☀️' : '🌙'}
          </motion.button>
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: theme.cardBg,
            borderRadius: 24,
            padding: '48px 40px',
            boxShadow: darkMode
              ? '0 20px 60px rgba(0, 0, 0, 0.4)'
              : '0 20px 60px rgba(0, 0, 0, 0.1)',
            border: `1px solid ${theme.border}`,
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, color: theme.text, marginBottom: 8 }}>
              Profil Saya
            </h2>
            <p style={{ fontSize: 15, color: theme.textSecondary }}>
              Kelola informasi pribadi Anda. Email tidak dapat diubah.
            </p>
          </div>

          <form onSubmit={handleSave}>

            {/* Nama */}
            <InputWithIcon
              icon={<FaUser />}
              label="Nama Lengkap"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="Masukkan nama lengkap"
              theme={theme}
            />

            {/* Email (readonly) */}
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <FaEnvelope style={{
                position: 'absolute',
                top: '50%',
                left: 16,
                transform: 'translateY(-50%)',
                color: theme.textSecondary,
                fontSize: 16,
              }} />
              <input
                type="email"
                value={profile.email}
                readOnly
                style={{
                  width: '100%',
                  padding: '16px 16px 16px 48px',
                  borderRadius: 12,
                  border: `2px solid ${theme.border}`,
                  background: darkMode ? '#0F172A' : '#F3F4F6',
                  color: theme.textSecondary,
                  fontSize: 15,
                  outline: 'none',
                  cursor: 'not-allowed',
                }}
              />
              <span style={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 12,
                color: theme.textSecondary,
                fontWeight: 600,
              }}>
                Tidak dapat diubah
              </span>
            </div>

            {/* Telepon */}
            <InputWithIcon
              icon={<FaPhone />}
              label="Nomor Telepon"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="Contoh: 081234567890"
              theme={theme}
            />

            {/* Tanggal Lahir */}
            <InputWithIcon
              icon={<FaCalendarAlt />}
              label="Tanggal Lahir"
              type="date"
              value={profile.date_of_birth}
              onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
              theme={theme}
            />

            {/* Alamat */}
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <FaMapMarkerAlt style={{
                position: 'absolute',
                top: 20,
                left: 16,
                color: theme.textSecondary,
                fontSize: 16,
              }} />
              <textarea
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                placeholder="Alamat lengkap Anda..."
                style={{
                  width: '100%',
                  padding: '16px 16px 16px 48px',
                  borderRadius: 12,
                  border: `2px solid ${theme.inputBorder}`,
                  background: theme.inputBg,
                  color: theme.text,
                  fontSize: 15,
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  minHeight: 100,
                  fontFamily: 'inherit',
                  resize: 'vertical',
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

            {/* Pembatas */}
            <div style={{
              margin: '30px 0',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}>
              <div style={{ flex: 1, height: 1, background: theme.border }} />
              <span style={{ fontSize: 14, color: theme.textSecondary, fontWeight: 600 }}>Ubah Password</span>
              <div style={{ flex: 1, height: 1, background: theme.border }} />
            </div>

            {/* Password Baru */}
            <PasswordInput
              icon={<FaLock />}
              label="Password Baru"
              value={password}
              onChange={setPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              placeholder="Kosongkan jika tidak ingin diubah"
              theme={theme}
            />

            {/* Konfirmasi Password */}
            <PasswordInput
              icon={<FaLock />}
              label="Konfirmasi Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              showPassword={showConfirmPassword}
              setShowPassword={setConfirmShowPassword}
              placeholder="Ulangi password baru"
              theme={theme}
            />

            {/* Tombol Simpan */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSaving}
              style={{
                width: '100%',
                padding: 18,
                borderRadius: 12,
                border: 'none',
                background: theme.gradient,
                color: 'white',
                fontSize: 16,
                fontWeight: 600,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.7 : 1,
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {isSaving ? (
                <>
                  <span style={{
                    display: 'inline-block',
                    width: 20,
                    height: 20,
                    border: '3px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '50%',
                    borderTopColor: 'white',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  Menyimpan...
                </>
              ) : (
                <>
                  <FaSave /> Simpan Perubahan
                </>
              )}
            </motion.button>

          </form>
        </motion.div>
      </div>
    </div>
  );
}

// Komponen Input dengan Ikon
const InputWithIcon = ({ icon, label, type = 'text', value, onChange, placeholder, theme }) => (
  <div style={{ position: 'relative', marginBottom: 20 }}>
    <span style={{
      position: 'absolute',
      top: '50%',
      left: 16,
      transform: 'translateY(-50%)',
      color: theme.textSecondary,
      fontSize: 16,
      pointerEvents: 'none',
      zIndex: 1,
    }}>
      {icon}
    </span>
    <input
      type={type}
      value={value}
      onChange={onChange}
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
        transition: 'all 0.3s ease',
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

// Komponen Password Input dengan Toggle
const PasswordInput = ({ icon, label, value, onChange, showPassword, setShowPassword, placeholder, theme }) => (
  <div style={{ position: 'relative', marginBottom: 20 }}>
    <span style={{
      position: 'absolute',
      top: '50%',
      left: 16,
      transform: 'translateY(-50%)',
      color: theme.textSecondary,
      fontSize: 16,
      pointerEvents: 'none',
      zIndex: 1,
    }}>
      {icon}
    </span>
    <input
      type={showPassword ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '16px 48px 16px 48px',
        borderRadius: 12,
        border: `2px solid ${theme.inputBorder}`,
        background: theme.inputBg,
        color: theme.text,
        fontSize: 15,
        outline: 'none',
        transition: 'all 0.3s ease',
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
    {value && (
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
          fontSize: 16,
          zIndex: 1,
        }}
      >
        {showPassword ? <FaEyeSlash /> : <FaEye />}
      </span>
    )}
  </div>
);

export default Profile;
