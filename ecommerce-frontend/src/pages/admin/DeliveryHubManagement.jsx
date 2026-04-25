import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme, DarkModeToggle } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaWarehouse, FaBox, FaSignOutAlt, FaCheck, FaTruck, FaHistory, FaMapMarkerAlt, FaSyncAlt, FaTimesCircle, FaExclamationTriangle } from 'react-icons/fa';

const API = 'http://localhost:3000/api';

const STATUS_OPTIONS = [
  { value: 'Dalam Perjalanan', label: '🚚 Dalam Perjalanan', apiStatus: 'dikirim' },
  { value: 'Tiba di Kota Tujuan', label: '🏙️ Tiba di Kota Tujuan', apiStatus: 'dikirim' },
  { value: 'Sedang Diantarkan', label: '🛵 Sedang Diantarkan ke Alamat', apiStatus: 'dikirim' },
  { value: 'Sampai di Tujuan', label: '✅ Sampai di Tujuan (Selesai)', apiStatus: 'selesai' },
  { value: 'Gagal Diantarkan', label: '❌ Gagal Diantarkan (Penerima Tidak Ada)', apiStatus: 'dikirim' },
  { value: 'Dikembalikan ke Hub', label: '↩️ Dikembalikan ke Hub', apiStatus: 'dikirim' },
];

function DeliveryHubManagement() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [activeTab, setActiveTab] = useState('active');
  const [hub, setHub] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(null); // assignment object
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [proofPhoto, setProofPhoto] = useState(null);
  const [proofNotes, setProofNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchAssignments = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const res = await axios.get(`${API}/courier/hub/assignments`, { headers });
      setHub(res.data.hub || null);
      setAssignments(res.data.data || []);
    } catch (err) {
      console.error('Gagal mengambil data assignment', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token]);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/courier/hub/history`, { headers });
      setHistory(res.data.data || []);
    } catch {}
  }, [token]);

  useEffect(() => {
    if (role !== 'courier') { navigate('/login'); return; }
    fetchAssignments();
  }, [role, navigate, fetchAssignments]);

  useEffect(() => {
    if (activeTab === 'history') fetchHistory();
  }, [activeTab, fetchHistory]);

  const handlePickup = async (assignmentId) => {
    if (!window.confirm('Apakah Anda yakin ingin mengambil paket ini dari hub?')) return;
    try {
      await axios.put(`${API}/courier/hub/pickup/${assignmentId}`, {}, { headers });
      alert('✅ Paket berhasil diambil dari hub!');
      fetchAssignments(true);
    } catch (err) { alert(err.response?.data?.message || 'Gagal mengambil paket'); }
  };

  const handleUpdateDelivery = async () => {
    if (!selectedAssignment || !deliveryLocation) { alert('Pilih status pengiriman!'); return; }
    const option = STATUS_OPTIONS.find(o => o.value === deliveryLocation);
    if (!option) return;
    setIsSubmitting(true);
    try {
      await axios.put(`${API}/courier/hub/delivery/${selectedAssignment.ID}`, {
        status: option.apiStatus,
        location: deliveryLocation,
        notes: deliveryNotes
      }, { headers });
      alert('✅ Status pengiriman berhasil diperbarui!');
      setShowActionModal(false);
      setDeliveryLocation('');
      setDeliveryNotes('');
      fetchAssignments(true);
    } catch (err) { alert(err.response?.data?.message || 'Gagal update status pengiriman'); }
    finally { setIsSubmitting(false); }
  };

  const handleUploadProof = async () => {
    if (!showProofModal) return;
    if (!proofPhoto) { alert('Pilih foto bukti pengiriman!'); return; }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('photo', proofPhoto);
      formData.append('notes', proofNotes);
      await axios.post(`${API}/courier/hub/proof/${showProofModal.ID}`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      alert('✅ Bukti pengiriman berhasil diunggah! Menunggu konfirmasi pembeli.');
      setShowProofModal(null);
      setProofPhoto(null);
      setProofNotes('');
      fetchAssignments(true);
    } catch (err) { alert(err.response?.data?.message || 'Gagal upload foto'); }
    finally { setIsSubmitting(false); }
  };

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };

  // Stats
  const stats = {
    menunggu: assignments.filter(a => a.status === 'menunggu').length,
    diambil: assignments.filter(a => a.status === 'diambil').length,
    dikirim: assignments.filter(a => a.status === 'dikirim').length,
    selesai: history.filter(a => a.status === 'selesai').length,
  };

  const getStatusBadge = (status) => {
    const map = {
      menunggu: { color: '#F59E0B', label: 'Menunggu Diambil' },
      diambil: { color: '#3B82F6', label: 'Sudah Diambil' },
      dikirim: { color: '#8B5CF6', label: 'Sedang Dikirim' },
      menunggu_konfirmasi: { color: '#F97316', label: 'Menunggu Konfirmasi Pembeli' },
      selesai: { color: '#10B981', label: 'Selesai' },
    };
    return map[status] || { color: '#6B7280', label: status };
  };

  const cardStyle = { backgroundColor: theme.cardBg, borderRadius: 16, border: `1px solid ${theme.border}`, boxShadow: theme.shadow };
  const btnBase = { border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 };
  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, fontSize: 14, boxSizing: 'border-box' };

  if (isLoading) return (
    <div style={{ background: theme.bg, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <h2 style={{ color: theme.textSecondary }}>Memuat Data Delivery Hub...</h2>
    </div>
  );

  if (!hub) return (
    <div style={{ background: theme.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
      <FaWarehouse style={{ fontSize: 64, color: theme.textSecondary }} />
      <h2 style={{ color: theme.text }}>Anda belum ditugaskan ke Delivery Hub</h2>
      <p style={{ color: theme.textSecondary }}>Hubungi admin untuk mendapatkan penugasan.</p>
      <button onClick={handleLogout} style={{ ...btnBase, padding: '12px 24px', background: '#EF4444', color: 'white' }}>
        <FaSignOutAlt /> Logout
      </button>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: theme.bg, minHeight: '100vh', padding: '32px 48px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: theme.text, margin: 0 }}>🚚 Delivery Hub Management</h2>
          <p style={{ color: theme.textSecondary, margin: '4px 0 0' }}>
            <FaWarehouse style={{ marginRight: 6, color: '#3B82F6' }} />
            {hub.name} · <span style={{ color: theme.textSecondary, fontSize: 13 }}>{hub.code}</span>
            {hub.address && <span style={{ marginLeft: 8 }}>· {hub.address}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <DarkModeToggle />
          <motion.button whileHover={{ scale: 1.05 }} onClick={() => fetchAssignments(true)}
            style={{ ...btnBase, padding: '10px 16px', background: '#3B82F6', color: 'white' }}>
            <FaSyncAlt style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} /> Refresh
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} onClick={handleLogout}
            style={{ ...btnBase, padding: '10px 20px', background: '#EF4444', color: 'white' }}>
            <FaSignOutAlt /> Logout
          </motion.button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Menunggu Diambil', value: stats.menunggu, color: '#F59E0B', icon: <FaBox /> },
          { label: 'Sudah Diambil', value: stats.diambil, color: '#3B82F6', icon: <FaWarehouse /> },
          { label: 'Sedang Dikirim', value: stats.dikirim, color: '#8B5CF6', icon: <FaTruck /> },
          { label: 'Selesai (Riwayat)', value: history.filter(a => a.status === 'selesai').length, color: '#10B981', icon: <FaCheck /> },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            style={{ ...cardStyle, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: s.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, fontSize: 20 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: theme.text }}>{s.value}</div>
              <div style={{ fontSize: 12, color: theme.textSecondary }}>{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[
          { key: 'active', label: `📦 Paket Aktif (${assignments.length})` },
          { key: 'history', label: `📋 Riwayat (${history.length})` },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{ ...btnBase, padding: '10px 24px', fontSize: 14,
              background: activeTab === tab.key ? '#6366F1' : theme.cardBg,
              color: activeTab === tab.key ? 'white' : theme.textSecondary,
              border: `1px solid ${activeTab === tab.key ? '#6366F1' : theme.border}` }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Packages */}
      {activeTab === 'active' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {assignments.length === 0 ? (
            <div style={{ ...cardStyle, padding: 60, textAlign: 'center' }}>
              <FaBox style={{ fontSize: 48, color: theme.textSecondary, marginBottom: 16 }} />
              <h3 style={{ color: theme.textSecondary }}>Tidak ada paket aktif</h3>
              <p style={{ color: theme.textSecondary, fontSize: 14 }}>Paket akan muncul saat seller menugaskan ke hub Anda.</p>
            </div>
          ) : assignments.map((a, i) => {
            const badge = getStatusBadge(a.status);
            return (
              <motion.div key={a.ID || i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                style={{ ...cardStyle, padding: '20px 24px', marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <span style={{ fontWeight: 800, color: theme.text, fontSize: 16 }}>#{a.tracking_number}</span>
                      <span style={{ padding: '4px 12px', borderRadius: 20, background: badge.color + '22', color: badge.color, fontWeight: 700, fontSize: 12 }}>
                        {badge.label}
                      </span>
                    </div>
                    <div style={{ color: theme.textSecondary, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FaMapMarkerAlt /> {a.Shipment?.shipping_address || 'Alamat tidak tersedia'}
                    </div>
                    {a.notes && (
                      <div style={{ color: theme.textSecondary, fontSize: 12, marginTop: 6 }}>
                        📝 {a.notes}
                      </div>
                    )}
                    <div style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>
                      Ditugaskan: {new Date(a.assigned_at || a.AssignedAt || a.CreatedAt).toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {a.status === 'menunggu' && (
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => handlePickup(a.ID)}
                        style={{ ...btnBase, padding: '10px 18px', background: '#10B981', color: 'white', fontSize: 14 }}>
                        <FaCheck /> Ambil Paket
                      </motion.button>
                    )}
                    {(a.status === 'diambil' || a.status === 'dikirim') && (
                      <>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => { setSelectedAssignment(a); setShowActionModal(true); }}
                          style={{ ...btnBase, padding: '10px 18px', background: '#6366F1', color: 'white', fontSize: 14 }}>
                          <FaTruck /> Update Status
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => setShowProofModal(a)}
                          style={{ ...btnBase, padding: '10px 18px', background: '#10B981', color: 'white', fontSize: 14 }}>
                          📷 Sudah Terkirim
                        </motion.button>
                      </>
                    )}
                    {a.status === 'menunggu_konfirmasi' && (
                      <span style={{ padding: '10px 18px', background: '#F9731622', color: '#F97316', borderRadius: 8, fontWeight: 700, fontSize: 13 }}>
                        ⏳ Menunggu Konfirmasi Pembeli
                      </span>
                    )}
                    {a.status === 'selesai' && (
                      <span style={{ padding: '10px 18px', background: '#10B98122', color: '#10B981', borderRadius: 8, fontWeight: 700, fontSize: 14 }}>
                        <FaCheck style={{ marginRight: 6 }} /> Selesai
                      </span>
                    )}

                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {history.length === 0 ? (
            <div style={{ ...cardStyle, padding: 60, textAlign: 'center' }}>
              <FaHistory style={{ fontSize: 48, color: theme.textSecondary, marginBottom: 16 }} />
              <h3 style={{ color: theme.textSecondary }}>Belum ada riwayat pengiriman</h3>
            </div>
          ) : history.map((item, i) => {
            const badge = getStatusBadge(item.status);
            return (
              <motion.div key={item.ID || i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                style={{ ...cardStyle, padding: '16px 24px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, color: theme.text, fontSize: 15, marginBottom: 4 }}>#{item.tracking_number}</div>
                  <div style={{ color: theme.textSecondary, fontSize: 13 }}>
                    <FaMapMarkerAlt style={{ marginRight: 4 }} />{item.Shipment?.shipping_address || '-'}
                  </div>
                  {item.delivered_at && (
                    <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>
                      ✅ Selesai: {new Date(item.delivered_at).toLocaleString('id-ID')}
                    </div>
                  )}
                </div>
                <span style={{ padding: '6px 14px', borderRadius: 20, background: badge.color + '22', color: badge.color, fontWeight: 700, fontSize: 12 }}>
                  {badge.label}
                </span>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Update Delivery Modal */}
      <AnimatePresence>
        {showActionModal && selectedAssignment && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}
            onClick={() => setShowActionModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              style={{ ...cardStyle, padding: 32, width: 480, maxWidth: '92%' }}
              onClick={e => e.stopPropagation()}>
              <h3 style={{ color: theme.text, marginTop: 0, fontSize: 20 }}>
                <FaTruck style={{ marginRight: 10, color: '#6366F1' }} /> Update Status Pengiriman
              </h3>

              {/* Paket Info */}
              <div style={{ background: theme.bg, padding: '14px 18px', borderRadius: 12, marginBottom: 24 }}>
                <div style={{ fontWeight: 700, color: theme.text, marginBottom: 4 }}>#{selectedAssignment.tracking_number}</div>
                <div style={{ color: theme.textSecondary, fontSize: 13 }}>
                  <FaMapMarkerAlt style={{ marginRight: 4 }} /> {selectedAssignment.Shipment?.shipping_address || '-'}
                </div>
              </div>

              {/* Status Selection */}
              <label style={{ display: 'block', fontWeight: 600, color: theme.text, marginBottom: 10 }}>
                Status Pengiriman *
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {STATUS_OPTIONS.map(opt => (
                  <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    borderRadius: 10, border: `2px solid ${deliveryLocation === opt.value ? '#6366F1' : theme.border}`,
                    background: deliveryLocation === opt.value ? '#6366F111' : theme.cardBg,
                    cursor: 'pointer', transition: 'all 0.2s' }}>
                    <input type="radio" name="deliveryStatus" value={opt.value}
                      checked={deliveryLocation === opt.value}
                      onChange={() => setDeliveryLocation(opt.value)}
                      style={{ accentColor: '#6366F1' }} />
                    <span style={{ color: theme.text, fontSize: 14, fontWeight: deliveryLocation === opt.value ? 700 : 400 }}>
                      {opt.label}
                    </span>
                    {opt.apiStatus === 'selesai' && (
                      <span style={{ marginLeft: 'auto', fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#10B98122', color: '#10B981', fontWeight: 700 }}>
                        FINAL
                      </span>
                    )}
                  </label>
                ))}
              </div>

              {/* Warning for failed delivery */}
              {(deliveryLocation === 'Gagal Diantarkan' || deliveryLocation === 'Dikembalikan ke Hub') && (
                <div style={{ padding: '10px 14px', borderRadius: 8, background: '#F59E0B22', border: '1px solid #F59E0B', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <FaExclamationTriangle style={{ color: '#F59E0B', flexShrink: 0 }} />
                  <span style={{ color: '#F59E0B', fontSize: 13 }}>Harap isi catatan alasan di bawah.</span>
                </div>
              )}

              <label style={{ display: 'block', fontWeight: 600, color: theme.text, marginBottom: 8 }}>Catatan (Opsional)</label>
              <textarea value={deliveryNotes} onChange={e => setDeliveryNotes(e.target.value)}
                placeholder="Catatan pengiriman, misal: penerima tidak ada di tempat..."
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical', fontFamily: 'inherit', marginBottom: 20 }} />

              <div style={{ display: 'flex', gap: 12 }}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleUpdateDelivery}
                  disabled={isSubmitting || !deliveryLocation}
                  style={{ ...btnBase, flex: 1, padding: 13, background: deliveryLocation ? '#10B981' : '#ccc', color: 'white', justifyContent: 'center', opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting ? 'Menyimpan...' : '✅ Simpan Update'}
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowActionModal(false)}
                  style={{ ...btnBase, flex: 1, padding: 13, background: '#EF4444', color: 'white', justifyContent: 'center' }}>
                  <FaTimesCircle /> Batal
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Proof Upload Modal */}
      <AnimatePresence>
        {showProofModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1001 }}
            onClick={() => setShowProofModal(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              style={{ backgroundColor: theme.cardBg, borderRadius: 20, padding: 32, width: 460, maxWidth: '92%', boxShadow: theme.shadow }}
              onClick={e => e.stopPropagation()}>
              <h3 style={{ color: theme.text, marginTop: 0, fontSize: 20 }}>📷 Upload Bukti Pengiriman</h3>
              <div style={{ background: theme.bg, padding: '12px 16px', borderRadius: 10, marginBottom: 20 }}>
                <div style={{ fontWeight: 700, color: theme.text }}>#{showProofModal.tracking_number}</div>
                <div style={{ color: theme.textSecondary, fontSize: 13, marginTop: 4 }}>
                  📍 {showProofModal.Shipment?.shipping_address || '-'}
                </div>
              </div>
              <label style={{ display: 'block', fontWeight: 600, color: theme.text, marginBottom: 8, fontSize: 14 }}>
                Foto Bukti Pengiriman *
              </label>
              <div style={{ border: `2px dashed ${theme.border}`, borderRadius: 12, padding: 20, textAlign: 'center', marginBottom: 16, background: theme.bg }}>
                <input type="file" accept="image/*" id="proof-upload" style={{ display: 'none' }}
                  onChange={e => setProofPhoto(e.target.files[0])} />
                <label htmlFor="proof-upload" style={{ cursor: 'pointer' }}>
                  {proofPhoto ? (
                    <div>
                      <img src={URL.createObjectURL(proofPhoto)} alt="preview"
                        style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, objectFit: 'cover' }} />
                      <p style={{ color: '#10B981', fontSize: 13, marginTop: 8 }}>✅ {proofPhoto.name}</p>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 36, marginBottom: 8 }}>📷</div>
                      <p style={{ color: theme.textSecondary, fontSize: 14 }}>Klik untuk pilih foto</p>
                    </div>
                  )}
                </label>
              </div>
              <label style={{ display: 'block', fontWeight: 600, color: theme.text, marginBottom: 8, fontSize: 14 }}>Catatan (Opsional)</label>
              <textarea value={proofNotes} onChange={e => setProofNotes(e.target.value)}
                placeholder="Misal: paket diterima oleh pihak keluarga..."
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, fontSize: 14, minHeight: 70, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', marginBottom: 20 }} />
              <div style={{ display: 'flex', gap: 12 }}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleUploadProof}
                  disabled={isSubmitting || !proofPhoto}
                  style={{ flex: 1, padding: 13, background: proofPhoto ? '#10B981' : '#ccc', color: 'white', border: 'none', borderRadius: 8, cursor: proofPhoto ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: 15, opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting ? 'Mengunggah...' : '✅ Kirim Bukti'}
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setShowProofModal(null); setProofPhoto(null); }}
                  style={{ flex: 1, padding: 13, background: '#EF4444', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 15 }}>
                  Batal
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}


export default DeliveryHubManagement;
