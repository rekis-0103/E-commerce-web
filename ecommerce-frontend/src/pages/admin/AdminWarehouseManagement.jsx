import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useTheme, DarkModeToggle } from '../../context/ThemeContext';
import { motion } from 'framer-motion';
import { FaSignOutAlt, FaWarehouse, FaPlus, FaUser, FaArrowLeft } from 'react-icons/fa';
import { regionService } from '../../services/regionService';

function AdminWarehouseManagement() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [warehouses, setWarehouses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Form states
  const [warehouseName, setWarehouseName] = useState('');
  const [warehouseCode, setWarehouseCode] = useState('');
  const [warehouseAddress, setWarehouseAddress] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [village, setVillage] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [warehouseType, setWarehouseType] = useState('pengiriman');
  const [selectedStaffId, setSelectedStaffId] = useState('');

  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);
  const [regionIds, setRegionIds] = useState({ province: '', city: '', district: '' });
  const [availableStaff, setAvailableStaff] = useState([]);

  useEffect(() => {
    if (role !== 'admin') { navigate('/login'); return; }
    fetchWarehouses(); fetchAvailableStaff(); loadProvinces();
  }, [role, navigate]);

  const loadProvinces = async () => {
    try { const data = await regionService.getProvinces(); setProvinces(data); } catch (err) {}
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

  const fetchWarehouses = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/admin/warehouse/all', { headers: { Authorization: `Bearer ${token}` } });
      setWarehouses(response.data.data || []);
      setIsLoading(false);
    } catch (error) { setIsLoading(false); }
  };

  const fetchAvailableStaff = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/admin/staff/available', { headers: { Authorization: `Bearer ${token}` } });
      setAvailableStaff(response.data.data || []);
    } catch (error) {}
  };

  const handleCreateWarehouse = async (e) => {
    e.preventDefault();
    if (!warehouseName || !warehouseCode || !province || !city || !district || !village || !postalCode || !selectedStaffId) {
      alert("Semua field bertanda * wajib diisi!"); return;
    }
    try {
      await axios.post('http://localhost:3000/api/admin/warehouse/create', {
        name: warehouseName, code: warehouseCode, address: warehouseAddress,
        province, city, district, village, postal_code: postalCode, warehouse_type: warehouseType, staff_id: parseInt(selectedStaffId)
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert("✅ Gudang berhasil dibuat!");
      setShowCreateModal(false); fetchWarehouses();
    } catch (error) { alert(error.response?.data?.message || "Gagal membuat gudang"); }
  };

  if (isLoading) return <div style={{ background: theme.bg, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><h2>Memuat...</h2></div>;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: theme.bg, minHeight: '100vh', padding: '40px 60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link to="/admin/dashboard"><motion.button whileHover={{ scale: 1.05 }} style={{ padding: '10px 16px', backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text }}><FaArrowLeft /> Kembali</motion.button></Link>
          <h2 style={{ fontSize: 32, fontWeight: 800, margin: 0, color: theme.text }}>🏭 Manajemen Gudang</h2>
        </div>
        <DarkModeToggle />
      </div>

      <button onClick={() => setShowCreateModal(true)} style={{ padding: '12px 24px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, marginBottom: 32 }}><FaPlus /> Buat Gudang Baru</button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {warehouses.map((w) => (
          <div key={w.ID} style={{ backgroundColor: theme.cardBg, borderRadius: 16, padding: 24, boxShadow: theme.shadow, border: `1px solid ${theme.border}` }}>
            <h3 style={{ color: theme.text }}>{w.name} <span style={{ fontSize: 12, backgroundColor: '#3B82F6', color: 'white', padding: '2px 8px', borderRadius: 10 }}>{w.warehouse_type}</span></h3>
            <p style={{ color: theme.textSecondary, fontSize: 14 }}>
              📍 {w.village}, {w.district}, {w.city}, {w.province}<br/>
              🏠 {w.address || '-'}
            </p>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={() => setShowCreateModal(false)}>
          <div style={{ backgroundColor: theme.cardBg, padding: 32, borderRadius: 20, maxWidth: 600, width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: theme.text, marginBottom: 24 }}>Buat Gudang Baru</h3>
            <form onSubmit={handleCreateWarehouse}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', color: theme.text, marginBottom: 4 }}>Nama Gudang *</label>
                  <input type="text" value={warehouseName} onChange={e => setWarehouseName(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text }} required />
                </div>
                <div>
                  <label style={{ display: 'block', color: theme.text, marginBottom: 4 }}>Kode Gudang *</label>
                  <input type="text" value={warehouseCode} onChange={e => setWarehouseCode(e.target.value)} placeholder="Contoh: WH-JKT-01" style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text }} required />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', color: theme.text, marginBottom: 4 }}>Provinsi *</label>
                  <select value={regionIds.province} onChange={handleProvinceChange} style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text }} required>
                    <option value="">Pilih</option>
                    {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: theme.text, marginBottom: 4 }}>Kota *</label>
                  <select value={regionIds.city} onChange={handleCityChange} disabled={!regionIds.province} style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text }} required>
                    <option value="">Pilih</option>
                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', color: theme.text, marginBottom: 4 }}>Kecamatan *</label>
                  <select value={regionIds.district} onChange={handleDistrictChange} disabled={!regionIds.city} style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text }} required>
                    <option value="">Pilih</option>
                    {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: theme.text, marginBottom: 4 }}>Kelurahan *</label>
                  <select value={village} onChange={e => setVillage(e.target.value)} disabled={!regionIds.district} style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text }} required>
                    <option value="">Pilih</option>
                    {villages.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: theme.text, marginBottom: 4 }}>Kode Pos *</label>
                  <input type="text" value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="Kode Pos" style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text }} required />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', color: theme.text, marginBottom: 4 }}>Alamat Lengkap *</label>
                <textarea value={warehouseAddress} onChange={e => setWarehouseAddress(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, minHeight: 80 }} required />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', color: theme.text, marginBottom: 4 }}>Staff Manager *</label>
                <select value={selectedStaffId} onChange={e => setSelectedStaffId(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text }} required>
                  <option value="">Pilih Staff</option>
                  {availableStaff.map(s => <option key={s.ID} value={s.ID}>{s.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" style={{ flex: 1, padding: 12, backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600 }}>Simpan</button>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: 12, backgroundColor: theme.textSecondary, color: 'white', border: 'none', borderRadius: 8 }}>Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminWarehouseManagement;
