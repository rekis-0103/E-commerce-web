import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useTheme, DarkModeToggle } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { FaStore, FaArrowLeft, FaSignOutAlt, FaClock, FaCheckCircle, FaMapMarkerAlt, FaMap, FaCity, FaBuilding, FaHome } from 'react-icons/fa';
import { regionService } from '../services/regionService';

function SellerRegistration() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [shopName, setShopName] = useState('');
  const [description, setDescription] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [village, setVillage] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [address, setAddress] = useState('');
  
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);

  const [regionIds, setRegionIds] = useState({ province: '', city: '', district: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (role !== 'buyer') { navigate('/home'); return; }
    loadProvinces();
  }, [role, navigate]);

  const loadProvinces = async () => {
    try { const data = await regionService.getProvinces(); setProvinces(data); } 
    catch (err) { console.error(err); }
  };

  const handleProvinceChange = async (e) => {
    const id = e.target.value;
    const name = provinces.find(p => p.id === id)?.name || '';
    setProvince(name); setRegionIds({ province: id, city: '', district: '' });
    setCity(''); setDistrict(''); setVillage('');
    setCities([]); setDistricts([]); setVillages([]);
    if (id) { const data = await regionService.getRegencies(id); setCities(data); }
  };

  const handleCityChange = async (e) => {
    const id = e.target.value;
    const name = cities.find(c => c.id === id)?.name || '';
    setCity(name); setRegionIds({ ...regionIds, city: id, district: '' });
    setDistrict(''); setVillage('');
    setDistricts([]); setVillages([]);
    if (id) { const data = await regionService.getDistricts(id); setDistricts(data); }
  };

  const handleDistrictChange = async (e) => {
    const id = e.target.value;
    const name = districts.find(d => d.id === id)?.name || '';
    setDistrict(name); setRegionIds({ ...regionIds, district: id });
    setVillage(''); setVillages([]);
    if (id) { const data = await regionService.getVillages(id); setVillages(data); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!shopName || !description || !province || !city || !district || !village || !postalCode || !address) {
      alert("Semua field wajib diisi!"); return;
    }
    setIsLoading(true);
    try {
      await axios.post('http://localhost:3000/api/user/shop/register', {
        shop_name: shopName, description, province, city, district, village, postal_code: postalCode, address
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert("✅ Pengajuan toko berhasil! Menunggu persetujuan Admin.");
      navigate('/home');
    } catch (error) {
      alert(error.response?.data?.message || "Gagal mendaftar");
    }
    setIsLoading(false);
  };

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: theme.bg, minHeight: '100vh', padding: '40px 60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link to="/home">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ padding: '10px 16px', backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: theme.text, fontWeight: 600 }}>
              <FaArrowLeft /> Kembali
            </motion.button>
          </Link>
          <h2 style={{ fontSize: 32, fontWeight: 800, margin: 0, color: theme.text }}><FaStore style={{ marginRight: 10, color: '#10B981' }} /> Daftar Jadi Penjual</h2>
        </div>
        <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
          <DarkModeToggle />
          <button onClick={handleLogout} style={{ padding: '12px 24px', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Logout</button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ backgroundColor: theme.cardBg, padding: 40, borderRadius: 20, boxShadow: theme.shadow, border: `1px solid ${theme.border}`, maxWidth: 800, margin: '0 auto' }}>
        <h3 style={{ marginBottom: 32, textAlign: 'center', color: theme.text }}>Formulir Pendaftaran Toko</h3>
        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, color: theme.text, fontWeight: 600 }}>Nama Toko *</label>
            <input type="text" value={shopName} onChange={(e) => setShopName(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, border: `2px solid ${theme.border}`, background: theme.inputBg, color: theme.text }} required />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, color: theme.text, fontWeight: 600 }}>Deskripsi Toko *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, border: `2px solid ${theme.border}`, background: theme.inputBg, color: theme.text, minHeight: 100 }} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: theme.text, fontWeight: 600 }}>Provinsi *</label>
              <select value={regionIds.province} onChange={handleProvinceChange} style={{ width: '100%', padding: 12, borderRadius: 10, border: `2px solid ${theme.border}`, background: theme.inputBg, color: theme.text }} required>
                <option value="">Pilih Provinsi</option>
                {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: theme.text, fontWeight: 600 }}>Kota *</label>
              <select value={regionIds.city} onChange={handleCityChange} disabled={!regionIds.province} style={{ width: '100%', padding: 12, borderRadius: 10, border: `2px solid ${theme.border}`, background: theme.inputBg, color: theme.text }} required>
                <option value="">Pilih Kota</option>
                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: theme.text, fontWeight: 600 }}>Kecamatan *</label>
              <select value={regionIds.district} onChange={handleDistrictChange} disabled={!regionIds.city} style={{ width: '100%', padding: 12, borderRadius: 10, border: `2px solid ${theme.border}`, background: theme.inputBg, color: theme.text }} required>
                <option value="">Pilih Kecamatan</option>
                {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: theme.text, fontWeight: 600 }}>Kelurahan *</label>
              <select value={village} onChange={(e) => setVillage(e.target.value)} disabled={!regionIds.district} style={{ width: '100%', padding: 12, borderRadius: 10, border: `2px solid ${theme.border}`, background: theme.inputBg, color: theme.text }} required>
                <option value="">Pilih Kelurahan</option>
                {villages.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, color: theme.text, fontWeight: 600 }}>Kode Pos *</label>
            <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="Contoh: 12345" style={{ width: '100%', padding: 12, borderRadius: 10, border: `2px solid ${theme.border}`, background: theme.inputBg, color: theme.text }} required />
          </div>

          <div style={{ marginBottom: 32 }}>
            <label style={{ display: 'block', marginBottom: 8, color: theme.text, fontWeight: 600 }}>Alamat Lengkap *</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Nama Jalan, RT/RW, No. Rumah" style={{ width: '100%', padding: 12, borderRadius: 10, border: `2px solid ${theme.border}`, background: theme.inputBg, color: theme.text, minHeight: 80 }} required />
          </div>

          <button type="submit" disabled={isLoading} style={{ width: '100%', padding: 16, backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer' }}>
            {isLoading ? "Memproses..." : "Ajukan Pendaftaran Toko"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default SellerRegistration;
