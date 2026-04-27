import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useTheme, DarkModeToggle } from '../../context/ThemeContext';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendarAlt, FaLock, FaSave, FaArrowLeft, FaEye, FaEyeSlash, FaCity, FaMap, FaBuilding, FaHome } from 'react-icons/fa';
import { regionService } from '../../services/regionService';

function Profile() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const isGoogleLogin = localStorage.getItem('loginMethod') === 'google';

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    province: '',
    city: '',
    district: '',
    village: '',
    postal_code: '',
    date_of_birth: '',
  });

  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);

  // State untuk menyimpan ID dari API wilayah untuk fetching level selanjutnya
  const [regionIds, setRegionIds] = useState({
    province: '',
    city: '',
    district: ''
  });

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
    
    const initializeData = async () => {
      setIsLoading(true);
      try {
        const provincesData = await loadProvinces();
        const profileData = await fetchProfile();
        
        if (profileData && provincesData) {
          // Cari ID Provinsi berdasarkan nama
          const foundProv = provincesData.find(p => p.name === profileData.province);
          if (foundProv) {
            setRegionIds(prev => ({ ...prev, province: foundProv.id }));
            
            // Load Kota
            const citiesData = await regionService.getRegencies(foundProv.id);
            setCities(citiesData);
            
            // Cari ID Kota berdasarkan nama
            const foundCity = citiesData.find(c => c.name === profileData.city);
            if (foundCity) {
              setRegionIds(prev => ({ ...prev, city: foundCity.id }));
              
              // Load Kecamatan
              const districtsData = await regionService.getDistricts(foundCity.id);
              setDistricts(districtsData);
              
              // Cari ID Kecamatan berdasarkan nama
              const foundDist = districtsData.find(d => d.name === profileData.district);
              if (foundDist) {
                setRegionIds(prev => ({ ...prev, district: foundDist.id }));
                
                // Load Kelurahan
                const villagesData = await regionService.getVillages(foundDist.id);
                setVillages(villagesData);
              }
            }
          }
        }
      } catch (err) {
        console.error("Inisialisasi data gagal", err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [token, navigate]);

  const loadProvinces = async () => {
    try {
      const data = await regionService.getProvinces();
      setProvinces(data);
      return data;
    } catch (err) { 
      console.error("Gagal memuat provinsi", err); 
      return null;
    }
  };

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
        province: data.province || '',
        city: data.city || '',
        district: data.district || '',
        village: data.village || '',
        postal_code: data.postal_code || '',
        date_of_birth: data.date_of_birth || '',
      });
      return data;
    } catch (error) {
      console.error("Gagal mengambil data profil", error);
      if (error.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      }
      return null;
    }
  };

  const handleProvinceChange = async (e) => {
    const provinceId = e.target.value;
    const provinceName = provinces.find(p => p.id === provinceId)?.name || '';
    
    setProfile({ ...profile, province: provinceName, city: '', district: '', village: '' });
    setRegionIds({ ...regionIds, province: provinceId, city: '', district: '' });
    setCities([]); setDistricts([]); setVillages([]);
    
    if (provinceId) {
      const data = await regionService.getRegencies(provinceId);
      setCities(data);
    }
  };

  const handleCityChange = async (e) => {
    const cityId = e.target.value;
    const cityName = cities.find(c => c.id === cityId)?.name || '';
    
    setProfile({ ...profile, city: cityName, district: '', village: '' });
    setRegionIds({ ...regionIds, city: cityId, district: '' });
    setDistricts([]); setVillages([]);
    
    if (cityId) {
      const data = await regionService.getDistricts(cityId);
      setDistricts(data);
    }
  };

  const handleDistrictChange = async (e) => {
    const districtId = e.target.value;
    const districtName = districts.find(d => d.id === districtId)?.name || '';
    
    setProfile({ ...profile, district: districtName, village: '' });
    setRegionIds({ ...regionIds, district: districtId });
    setVillages([]);
    
    if (districtId) {
      const data = await regionService.getVillages(districtId);
      setVillages(data);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = { ...profile };
      if (password && !isGoogleLogin) payload.password = password;

      await axios.put('http://localhost:3000/api/user/profile', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("✅ Profil berhasil diperbarui!");
      setPassword(''); setConfirmPassword('');
    } catch (error) {
      alert(error.response?.data?.message || "Gagal memperbarui profil");
    }
    setIsSaving(false);
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
          <Link to="/home" style={{ textDecoration: 'none', color: theme.primary, fontWeight: 600, fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <FaArrowLeft /> Kembali Berbelanja
          </Link>
          <DarkModeToggle />
        </div>

        {/* Form Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ background: theme.cardBg, borderRadius: 24, padding: '48px 40px', boxShadow: theme.shadow, border: `1px solid ${theme.border}` }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, color: theme.text, marginBottom: 8 }}>Profil Saya</h2>
            <p style={{ fontSize: 15, color: theme.textSecondary }}>Kelola informasi pribadi Anda. Email tidak dapat diubah.</p>
          </div>

          <form onSubmit={handleSave}>
            <InputWithIcon icon={<FaUser />} label="Nama Lengkap" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Masukkan nama lengkap" theme={theme} />
            
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <FaEnvelope style={{ position: 'absolute', top: '50%', left: 16, transform: 'translateY(-50%)', color: theme.textSecondary, fontSize: 16 }} />
              <input type="email" value={profile.email} readOnly style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: 12, border: `2px solid ${theme.border}`, background: theme.bg, color: theme.textSecondary, fontSize: 15, outline: 'none', cursor: 'not-allowed' }} />
            </div>

            <InputWithIcon icon={<FaPhone />} label="Nomor Telepon" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="Contoh: 081234567890" theme={theme} />
            <InputWithIcon icon={<FaCalendarAlt />} label="Tanggal Lahir" type="date" value={profile.date_of_birth} onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })} theme={theme} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={{ position: 'relative' }}>
                <FaMap style={{ position: 'absolute', top: '50%', left: 16, transform: 'translateY(-50%)', color: theme.textSecondary, fontSize: 16, zIndex: 1 }} />
                <select value={regionIds.province} onChange={handleProvinceChange} style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: 12, border: `2px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.text, fontSize: 15, outline: 'none', appearance: 'none', cursor: 'pointer' }}>
                  <option value="">{profile.province || 'Pilih Provinsi'}</option>
                  {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div style={{ position: 'relative' }}>
                <FaCity style={{ position: 'absolute', top: '50%', left: 16, transform: 'translateY(-50%)', color: theme.textSecondary, fontSize: 16, zIndex: 1 }} />
                <select value={regionIds.city} onChange={handleCityChange} disabled={!regionIds.province} style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: 12, border: `2px solid ${theme.inputBorder}`, background: regionIds.province ? theme.inputBg : theme.bg, color: theme.text, fontSize: 15, outline: 'none', appearance: 'none', cursor: regionIds.province ? 'pointer' : 'not-allowed' }}>
                  <option value="">{profile.city || 'Pilih Kota'}</option>
                  {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={{ position: 'relative' }}>
                <FaBuilding style={{ position: 'absolute', top: '50%', left: 16, transform: 'translateY(-50%)', color: theme.textSecondary, fontSize: 16, zIndex: 1 }} />
                <select value={regionIds.district} onChange={handleDistrictChange} disabled={!regionIds.city} style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: 12, border: `2px solid ${theme.inputBorder}`, background: regionIds.city ? theme.inputBg : theme.bg, color: theme.text, fontSize: 15, outline: 'none', appearance: 'none', cursor: regionIds.city ? 'pointer' : 'not-allowed' }}>
                  <option value="">{profile.district || 'Pilih Kecamatan'}</option>
                  {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div style={{ position: 'relative' }}>
                <FaHome style={{ position: 'absolute', top: '50%', left: 16, transform: 'translateY(-50%)', color: theme.textSecondary, fontSize: 16, zIndex: 1 }} />
                <select value={profile.village} onChange={(e) => setProfile({ ...profile, village: e.target.value })} disabled={!regionIds.district} style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: 12, border: `2px solid ${theme.inputBorder}`, background: regionIds.district ? theme.inputBg : theme.bg, color: theme.text, fontSize: 15, outline: 'none', appearance: 'none', cursor: regionIds.district ? 'pointer' : 'not-allowed' }}>
                  <option value="">{profile.village || 'Pilih Kelurahan'}</option>
                  {villages.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ position: 'relative', marginBottom: 20 }}>
              <FaMapMarkerAlt style={{ position: 'absolute', top: '50%', left: 16, transform: 'translateY(-50%)', color: theme.textSecondary, fontSize: 16, zIndex: 1 }} />
              <input type="text" value={profile.postal_code} onChange={(e) => setProfile({ ...profile, postal_code: e.target.value })} placeholder="Kode Pos" style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: 12, border: `2px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.text, fontSize: 15, outline: 'none' }} />
            </div>

            <div style={{ position: 'relative', marginBottom: 20 }}>
              <FaMapMarkerAlt style={{ position: 'absolute', top: 20, left: 16, color: theme.textSecondary, fontSize: 16 }} />
              <textarea value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} placeholder="Alamat lengkap (Jalan, No. Rumah, RT/RW)..." style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: 12, border: `2px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.text, fontSize: 15, outline: 'none', minHeight: 100, fontFamily: 'inherit', resize: 'vertical' }} />
            </div>

            {!isGoogleLogin && (
              <>
                <div style={{ margin: '30px 0', display: 'flex', alignItems: 'center', gap: 16 }}><div style={{ flex: 1, height: 1, background: theme.border }} /><span style={{ fontSize: 14, color: theme.textSecondary, fontWeight: 600 }}>Ubah Password</span><div style={{ flex: 1, height: 1, background: theme.border }} /></div>
                <PasswordInput icon={<FaLock />} label="Password Baru" value={password} onChange={setPassword} showPassword={showPassword} setShowPassword={setShowPassword} placeholder="Kosongkan jika tidak ingin diubah" theme={theme} />
                <PasswordInput icon={<FaLock />} label="Konfirmasi Password" value={confirmPassword} onChange={setConfirmPassword} showPassword={showConfirmPassword} setShowPassword={setConfirmShowPassword} placeholder="Ulangi password baru" theme={theme} />
              </>
            )}

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={isSaving} style={{ width: '100%', padding: 18, borderRadius: 12, border: 'none', background: theme.gradient, color: 'white', fontSize: 16, fontWeight: 600, cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {isSaving ? "Menyimpan..." : <><FaSave /> Simpan Perubahan</>}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

const InputWithIcon = ({ icon, label, type = 'text', value, onChange, placeholder, theme }) => (
  <div style={{ position: 'relative', marginBottom: 20 }}>
    <span style={{ position: 'absolute', top: '50%', left: 16, transform: 'translateY(-50%)', color: theme.textSecondary, fontSize: 16, pointerEvents: 'none', zIndex: 1 }}>{icon}</span>
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: 12, border: `2px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.text, fontSize: 15, outline: 'none' }} />
  </div>
);

const PasswordInput = ({ icon, label, value, onChange, showPassword, setShowPassword, placeholder, theme }) => (
  <div style={{ position: 'relative', marginBottom: 20 }}>
    <span style={{ position: 'absolute', top: '50%', left: 16, transform: 'translateY(-50%)', color: theme.textSecondary, fontSize: 16, pointerEvents: 'none', zIndex: 1 }}>{icon}</span>
    <input type={showPassword ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ width: '100%', padding: '16px 48px 16px 48px', borderRadius: 12, border: `2px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.text, fontSize: 15, outline: 'none' }} />
    {value && <span onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: theme.textSecondary, fontSize: 16, zIndex: 1 }}>{showPassword ? <FaEyeSlash /> : <FaEye />}</span>}
  </div>
);

export default Profile;
