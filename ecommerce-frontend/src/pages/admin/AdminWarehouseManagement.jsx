import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useTheme, DarkModeToggle } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSignOutAlt, FaWarehouse, FaPlus, FaUser, FaArrowLeft, FaTruck, FaUserPlus, FaUserTie, FaMapMarkerAlt, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';
import { regionService } from '../../services/regionService';

function AdminWarehouseManagement() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [warehouses, setWarehouses] = useState([]);
  const [availableCouriers, setAvailableCouriers] = useState([]);
  const [availableStaff, setAvailableStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddCourierModal, setShowAddCourierModal] = useState(false);
  const [showAssignCourierModal, setShowAssignCourierModal] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  
  // Form states (Warehouse)
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

  // Form states (Courier)
  const [courierName, setCourierName] = useState('');
  const [courierEmail, setCourierEmail] = useState('');
  const [courierPassword, setCourierPassword] = useState('');
  const [selectedCourierId, setSelectedCourierId] = useState('');

  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);
  const [regionIds, setRegionIds] = useState({ province: '', city: '', district: '' });

  useEffect(() => {
    if (role !== 'admin') { navigate('/login'); return; }
    fetchData();
    loadProvinces();
  }, [role, navigate]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [whRes, staffRes, courierRes] = await Promise.all([
        axios.get('http://localhost:3000/api/admin/warehouse/all', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:3000/api/admin/staff/available', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:3000/api/admin/courier/available', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setWarehouses(whRes.data.data || []);
      setAvailableStaff(staffRes.data.data || []);
      setAvailableCouriers(courierRes.data.data || []);
      setIsLoading(false);
    } catch (error) { 
      console.error("Gagal mengambil data", error);
      setIsLoading(false); 
    }
  };

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

  const handleCreateWarehouse = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/admin/warehouse/create', {
        name: warehouseName, code: warehouseCode, address: warehouseAddress,
        province, city, district, village, postal_code: postalCode, warehouse_type: warehouseType, staff_id: selectedStaffId ? parseInt(selectedStaffId) : 0
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert("✅ Gudang berhasil dibuat!");
      setShowCreateModal(false); fetchData();
      resetWarehouseForm();
    } catch (error) { alert(error.response?.data?.message || "Gagal membuat gudang"); }
  };

  const handleUpdateWarehouse = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:3000/api/admin/warehouse/${selectedWarehouse.ID}`, {
        name: warehouseName, address: warehouseAddress, warehouse_type: warehouseType, staff_id: selectedStaffId ? parseInt(selectedStaffId) : 0
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert("✅ Gudang berhasil diupdate!");
      setShowEditModal(false); fetchData();
    } catch (error) { alert(error.response?.data?.message || "Gagal update gudang"); }
  };

  const handleDeleteWarehouse = async (id) => {
    if (window.confirm("Yakin ingin menghapus gudang ini? Seluruh staff & kurir akan otomatis dilepaskan (unassigned).")) {
      try {
        await axios.delete(`http://localhost:3000/api/admin/warehouse/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        alert("Gudang dihapus"); fetchData();
      } catch (error) { alert("Gagal menghapus gudang"); }
    }
  };

  const handleUnassignCourier = async (courierId) => {
    if (window.confirm("Lepaskan kurir ini dari gudang? Akun kurir tetap ada.")) {
      try {
        await axios.delete(`http://localhost:3000/api/admin/courier/unassign/${courierId}`, { headers: { Authorization: `Bearer ${token}` } });
        fetchData();
      } catch (error) { alert("Gagal melepas kurir"); }
    }
  };

  const openEditModal = (w) => {
    setSelectedWarehouse(w);
    setWarehouseName(w.name);
    setWarehouseAddress(w.address);
    setWarehouseType(w.warehouse_type);
    setSelectedStaffId(w.owner_id || '');
    setShowEditModal(true);
  };

  const resetWarehouseForm = () => {
    setWarehouseName(''); setWarehouseCode(''); setWarehouseAddress('');
    setProvince(''); setCity(''); setDistrict(''); setVillage(''); setPostalCode('');
    setSelectedStaffId('');
  };

  const handleAddNewCourier = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/admin/courier/add', {
        name: courierName, email: courierEmail, password: courierPassword, warehouse_id: selectedWarehouse.ID
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert("✅ Kurir berhasil ditambahkan!");
      setShowAddCourierModal(false); fetchData();
      setCourierName(''); setCourierEmail(''); setCourierPassword('');
    } catch (error) { alert(error.response?.data?.message || "Gagal menambah kurir"); }
  };

  const handleAssignCourier = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/admin/courier/assign-warehouse', {
        courier_id: parseInt(selectedCourierId), warehouse_id: selectedWarehouse.ID
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert("✅ Kurir berhasil ditugaskan!");
      setShowAssignCourierModal(false); fetchData();
      setSelectedCourierId('');
    } catch (error) { alert(error.response?.data?.message || "Gagal menugaskan kurir"); }
  };

  const handleLogout = () => {
    localStorage.clear(); navigate('/login');
  };

  if (isLoading) return <div style={{ background: theme.bg, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><h2 style={{ color: theme.textSecondary }}>Memuat Data Gudang & Kurir...</h2></div>;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: theme.bg, minHeight: '100vh', padding: '40px 60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link to="/admin/dashboard"><motion.button whileHover={{ scale: 1.05 }} style={{ padding: '10px 16px', backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}><FaArrowLeft /> Kembali</motion.button></Link>
          <h2 style={{ fontSize: 32, fontWeight: 800, margin: 0, color: theme.text }}>🏭 Manajemen Gudang & Kurir</h2>
        </div>
        <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
          <DarkModeToggle />
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleLogout} style={{ padding: '12px 24px', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}><FaSignOutAlt /> Logout</motion.button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <p style={{ color: theme.textSecondary, fontSize: 18, margin: 0 }}>Kelola infrastruktur gudang dan penugasan kurir di setiap lokasi.</p>
        <button onClick={() => { resetWarehouseForm(); setShowCreateModal(true); }} style={{ padding: '14px 28px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', gap: 10 }}><FaPlus /> Buat Gudang Baru</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: 24 }}>
        {warehouses.map((w) => (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} key={w.ID} style={{ backgroundColor: theme.cardBg, borderRadius: 20, padding: 24, boxShadow: theme.shadow, border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', color: theme.text, fontSize: 22 }}>{w.name}</h3>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, backgroundColor: '#3B82F6', color: 'white', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>{w.code}</span>
                  <span style={{ fontSize: 12, backgroundColor: w.warehouse_type === 'pengiriman' ? '#8B5CF6' : '#F59E0B', color: 'white', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>{w.warehouse_type.toUpperCase()}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => openEditModal(w)} style={{ padding: 8, borderRadius: 8, border: 'none', background: '#F59E0B', color: 'white', cursor: 'pointer' }}><FaEdit size={14}/></button>
                <button onClick={() => handleDeleteWarehouse(w.ID)} style={{ padding: 8, borderRadius: 8, border: 'none', background: '#EF4444', color: 'white', cursor: 'pointer' }}><FaTrash size={14}/></button>
              </div>
            </div>

            <div style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}><FaMapMarkerAlt size={12}/> {w.village}, {w.district}, {w.city}, {w.province}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FaUserTie size={12}/> Manager: {w.owner?.name || 'Tidak ada staff ditugaskan'}</div>
            </div>

            {w.warehouse_type === 'pengiriman' && (
              <div style={{ flex: 1, backgroundColor: theme.bg, borderRadius: 12, padding: 16, marginTop: 10, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ margin: 0, color: theme.text, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}><FaTruck size={14} /> Daftar Kurir ({w.staff?.filter(s => s.role === 'courier').length || 0})</h4>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {w.staff?.filter(s => s.role === 'courier').length > 0 ? (
                    w.staff.filter(s => s.role === 'courier').map(courier => (
                      <div key={courier.ID} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.cardBg, padding: '8px 12px', borderRadius: 8, border: `1px solid ${theme.border}` }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{courier.name}</div>
                        <button onClick={() => handleUnassignCourier(courier.ID)} style={{ border: 'none', background: 'none', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Lepas Kurir"><FaTimes size={14}/></button>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: 12, color: theme.textSecondary, fontStyle: 'italic', margin: 0 }}>Belum ada kurir.</p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 15 }}>
                  <button onClick={() => { setSelectedWarehouse(w); setShowAssignCourierModal(true); }} style={{ flex: 1, padding: '8px', backgroundColor: 'transparent', color: '#3B82F6', border: '1px solid #3B82F6', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}><FaUserPlus size={12}/> Assign</button>
                  <button onClick={() => { setSelectedWarehouse(w); setShowAddCourierModal(true); }} style={{ flex: 1, padding: '8px', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}><FaPlus size={10}/> Kurir Baru</button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {/* Modal Create Warehouse */}
        {showCreateModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={() => setShowCreateModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ backgroundColor: theme.cardBg, padding: 32, borderRadius: 24, maxWidth: 600, width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ color: theme.text, marginBottom: 24, fontSize: 24 }}>Buat Gudang Baru</h3>
              <form onSubmit={handleCreateWarehouse}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', color: theme.textSecondary, marginBottom: 6, fontSize: 14 }}>Nama Gudang *</label>
                    <input type="text" value={warehouseName} onChange={e => setWarehouseName(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: theme.textSecondary, marginBottom: 6, fontSize: 14 }}>Kode Gudang *</label>
                    <input type="text" value={warehouseCode} onChange={e => setWarehouseCode(e.target.value)} placeholder="Contoh: WH-JKT-01" style={{ width: '100%', padding: 12, borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text }} required />
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', color: theme.textSecondary, marginBottom: 6, fontSize: 14 }}>Provinsi *</label>
                    <select value={regionIds.province} onChange={handleProvinceChange} style={{ width: '100%', padding: 12, borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text }} required>
                      <option value="">Pilih</option>
                      {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: theme.textSecondary, marginBottom: 6, fontSize: 14 }}>Kota *</label>
                    <select value={regionIds.city} onChange={handleCityChange} disabled={!regionIds.province} style={{ width: '100%', padding: 12, borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text }} required>
                      <option value="">Pilih</option>
                      {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', color: theme.textSecondary, marginBottom: 6, fontSize: 14 }}>Kecamatan *</label>
                    <select value={regionIds.district} onChange={handleDistrictChange} disabled={!regionIds.city} style={{ width: '100%', padding: 12, borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text }} required>
                      <option value="">Pilih</option>
                      {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: theme.textSecondary, marginBottom: 6, fontSize: 14 }}>Kelurahan *</label>
                    <select value={village} onChange={e => setVillage(e.target.value)} disabled={!regionIds.district} style={{ width: '100%', padding: 12, borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text }} required>
                      <option value="">Pilih</option>
                      {villages.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: theme.textSecondary, marginBottom: 6, fontSize: 14 }}>Kode Pos *</label>
                    <input type="text" value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="12345" style={{ width: '100%', padding: 12, borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text }} required />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', color: theme.textSecondary, marginBottom: 6, fontSize: 14 }}>Alamat Lengkap *</label>
                  <textarea value={warehouseAddress} onChange={e => setWarehouseAddress(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, minHeight: 80, fontFamily: 'inherit' }} required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                  <div>
                    <label style={{ display: 'block', color: theme.textSecondary, marginBottom: 6, fontSize: 14 }}>Tipe Gudang *</label>
                    <select value={warehouseType} onChange={e => setWarehouseType(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text }} required>
                      <option value="pengiriman">Pengiriman</option>
                      <option value="sortir">Sortir</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: theme.textSecondary, marginBottom: 6, fontSize: 14 }}>Staff Manager (Opsional)</label>
                    <select value={selectedStaffId} onChange={e => setSelectedStaffId(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text }}>
                      <option value="">Pilih Staff</option>
                      {availableStaff.map(s => <option key={s.ID} value={s.ID}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="submit" style={{ flex: 1, padding: 14, backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>Simpan Gudang</button>
                  <button type="button" onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: 14, backgroundColor: theme.border, color: theme.text, border: 'none', borderRadius: 12, cursor: 'pointer' }}>Batal</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal Edit Warehouse */}
        {showEditModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={() => setShowEditModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ backgroundColor: theme.cardBg, padding: 32, borderRadius: 24, maxWidth: 600, width: '90%' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ color: theme.text, marginBottom: 24, fontSize: 24 }}>Edit Gudang</h3>
              <form onSubmit={handleUpdateWarehouse}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', color: theme.textSecondary, marginBottom: 6, fontSize: 14 }}>Nama Gudang</label>
                  <input type="text" value={warehouseName} onChange={e => setWarehouseName(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text }} required />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', color: theme.textSecondary, marginBottom: 6, fontSize: 14 }}>Alamat Lengkap</label>
                  <textarea value={warehouseAddress} onChange={e => setWarehouseAddress(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, minHeight: 80, fontFamily: 'inherit' }} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                  <div>
                    <label style={{ display: 'block', color: theme.textSecondary, marginBottom: 6, fontSize: 14 }}>Tipe Gudang</label>
                    <select value={warehouseType} onChange={e => setWarehouseType(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text }} required>
                      <option value="pengiriman">Pengiriman</option>
                      <option value="sortir">Sortir</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: theme.textSecondary, marginBottom: 6, fontSize: 14 }}>Manager</label>
                    <select value={selectedStaffId} onChange={e => setSelectedStaffId(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text }}>
                      <option value="">-- Kosongkan / Ganti Manager --</option>
                      {availableStaff.map(s => <option key={s.ID} value={s.ID}>{s.name}</option>)}
                      {selectedWarehouse?.owner && <option value={selectedWarehouse.owner.ID}>{selectedWarehouse.owner.name} (Manager Saat Ini)</option>}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="submit" style={{ flex: 1, padding: 14, backgroundColor: '#F59E0B', color: 'white', border: 'none', borderRadius: 12, fontWeight: 700 }}>Update Gudang</button>
                  <button type="button" onClick={() => setShowEditModal(false)} style={{ flex: 1, padding: 14, backgroundColor: theme.border, color: theme.text, border: 'none', borderRadius: 12 }}>Batal</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal Add Courier */}
        {showAddCourierModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={() => setShowAddCourierModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ backgroundColor: theme.cardBg, padding: 32, borderRadius: 24, maxWidth: 500, width: '90%' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ color: theme.text, marginBottom: 10, fontSize: 24 }}>Tambah Kurir Baru</h3>
              <p style={{ color: theme.textSecondary, marginBottom: 24, fontSize: 14 }}>Menambahkan kurir langsung ke <strong>{selectedWarehouse?.name}</strong></p>
              <form onSubmit={handleAddNewCourier}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', color: theme.textSecondary, marginBottom: 6, fontSize: 14 }}>Nama Lengkap</label>
                  <input type="text" value={courierName} onChange={e => setCourierName(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text }} required />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', color: theme.textSecondary, marginBottom: 6, fontSize: 14 }}>Email</label>
                  <input type="email" value={courierEmail} onChange={e => setCourierEmail(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text }} required />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', color: theme.textSecondary, marginBottom: 6, fontSize: 14 }}>Password</label>
                  <input type="password" value={courierPassword} onChange={e => setCourierPassword(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text }} required />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="submit" style={{ flex: 1, padding: 14, backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: 12, fontWeight: 700 }}>Tambah Kurir</button>
                  <button type="button" onClick={() => setShowAddCourierModal(false)} style={{ flex: 1, padding: 14, backgroundColor: theme.border, color: theme.text, border: 'none', borderRadius: 12 }}>Batal</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal Assign Courier */}
        {showAssignCourierModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={() => setShowAssignCourierModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ backgroundColor: theme.cardBg, padding: 32, borderRadius: 24, maxWidth: 500, width: '90%' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ color: theme.text, marginBottom: 10, fontSize: 24 }}>Assign Kurir</h3>
              <p style={{ color: theme.textSecondary, marginBottom: 24, fontSize: 14 }}>Tugaskan kurir yang sudah terdaftar ke <strong>{selectedWarehouse?.name}</strong></p>
              <form onSubmit={handleAssignCourier}>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', color: theme.textSecondary, marginBottom: 6, fontSize: 14 }}>Pilih Kurir</label>
                  <select value={selectedCourierId} onChange={e => setSelectedCourierId(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text }} required>
                    <option value="">-- Pilih Kurir Tersedia --</option>
                    {availableCouriers.map(c => <option key={c.ID} value={c.ID}>{c.name} ({c.email})</option>)}
                  </select>
                  {availableCouriers.length === 0 && <p style={{ color: '#EF4444', fontSize: 12, marginTop: 8 }}>Tidak ada kurir yang tersedia (belum ditugaskan Manapun).</p>}
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="submit" disabled={availableCouriers.length === 0} style={{ flex: 1, padding: 14, backgroundColor: availableCouriers.length === 0 ? theme.border : '#3B82F6', color: 'white', border: 'none', borderRadius: 12, fontWeight: 700 }}>Tugaskan</button>
                  <button type="button" onClick={() => setShowAssignCourierModal(false)} style={{ flex: 1, padding: 14, backgroundColor: theme.border, color: theme.text, border: 'none', borderRadius: 12 }}>Batal</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminWarehouseManagement;
