import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme, DarkModeToggle } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { FaWarehouse, FaBox, FaSignOutAlt, FaCheck, FaTruck, FaHistory, FaMapMarkerAlt } from 'react-icons/fa';

function DeliveryHubManagement() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [hub, setHub] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  useEffect(() => {
    if (role !== 'courier') {
      navigate('/login');
      return;
    }
    fetchAssignments();
  }, [role, navigate]);

  const fetchAssignments = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/courier/hub/assignments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHub(response.data.hub || null);
      setAssignments(response.data.data || []);
      setIsLoading(false);
    } catch (error) {
      console.error("Gagal mengambil data assignment", error);
      setIsLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/courier/hub/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data.data || []);
      setShowHistory(true);
    } catch (error) {
      console.error("Gagal mengambil riwayat pengiriman", error);
      alert("Gagal mengambil riwayat pengiriman");
    }
  };

  const handlePickup = async (assignmentId) => {
    if (!window.confirm("Apakah Anda yakin ingin mengambil paket ini dari hub?")) {
      return;
    }

    try {
      await axios.put(`http://localhost:3000/api/courier/hub/pickup/${assignmentId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("✅ Paket berhasil diambil dari hub!");
      fetchAssignments();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal mengambil paket");
    }
  };

  const handleUpdateDelivery = async () => {
    if (!selectedAssignment) return;

    if (!deliveryLocation.trim()) {
      alert("Lokasi pengiriman harus diisi!");
      return;
    }

    try {
      await axios.put(`http://localhost:3000/api/courier/hub/delivery/${selectedAssignment.ID}`, {
        status: deliveryLocation === 'Sampai di Tujuan' ? 'selesai' : 'dikirim',
        location: deliveryLocation,
        notes: deliveryNotes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("✅ Status pengiriman berhasil diperbarui!");
      setShowActionModal(false);
      setDeliveryLocation('');
      setDeliveryNotes('');
      fetchAssignments();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal update status pengiriman");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const getStatusBadge = (status) => {
    const badges = {
      menunggu: { color: '#F59E0B', icon: <FaBox />, label: 'Menunggu' },
      diambil: { color: '#3B82F6', icon: <FaWarehouse />, label: 'Diambil' },
      dikirim: { color: '#8B5CF6', icon: <FaTruck />, label: 'Dikirim' },
      selesai: { color: '#10B981', icon: <FaCheck />, label: 'Selesai' }
    };
    return badges[status] || { color: theme.textSecondary, icon: <FaBox />, label: status };
  };

  if (isLoading) {
    return (
      <div style={{ 
        fontFamily: "'Inter', sans-serif", 
        background: theme.bg, 
        minHeight: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <h2 style={{ color: theme.textSecondary }}>Memuat Data Delivery Hub...</h2>
      </div>
    );
  }

  return (
    <div style={{ 
      fontFamily: "'Inter', sans-serif", 
      background: theme.bg, 
      minHeight: '100vh', 
      padding: '40px 60px', 
      transition: 'all 0.3s ease' 
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 40 
      }}>
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ 
            fontSize: 32, 
            fontWeight: 800, 
            margin: 0, 
            color: theme.text, 
            fontFamily: "'Poppins', sans-serif" 
          }}
        >
          🚚 Delivery Hub Management
        </motion.h2>

        <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
          <DarkModeToggle />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            style={{
              padding: '12px 24px',
              backgroundColor: '#EF4444',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <FaSignOutAlt /> Logout
          </motion.button>
        </div>
      </div>

      {/* Hub Info */}
      {hub && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            backgroundColor: theme.cardBg,
            padding: 24,
            borderRadius: 16,
            marginBottom: 32,
            boxShadow: theme.shadow,
            border: `1px solid ${theme.border}`
          }}
        >
          <h3 style={{ 
            margin: '0 0 8px 0', 
            fontSize: 22, 
            fontWeight: 700, 
            color: theme.text 
          }}>
            <FaWarehouse style={{ marginRight: 10, color: '#3B82F6' }} />
            {hub.name}
          </h3>
          <p style={{ 
            margin: '0 0 4px 0', 
            fontSize: 14, 
            color: theme.textSecondary 
          }}>
            <strong>Kode:</strong> {hub.code}
          </p>
          {hub.address && (
            <p style={{ 
              margin: 0, 
              fontSize: 14, 
              color: theme.textSecondary 
            }}>
              <strong>Alamat:</strong> {hub.address}
            </p>
          )}
        </motion.div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchAssignments}
          style={{
            padding: '12px 24px',
            backgroundColor: '#10B981',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          🔄 Refresh Data
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchHistory}
          style={{
            padding: '12px 24px',
            backgroundColor: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <FaHistory /> Riwayat Pengiriman
        </motion.button>
      </div>

      {/* Assignments List */}
      {!showHistory && (
        <div>
          <h3 style={{ 
            fontSize: 24, 
            fontWeight: 700, 
            marginBottom: 20, 
            color: theme.text 
          }}>
            📦 Paket di Hub Anda
          </h3>

          {assignments.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 60,
              backgroundColor: theme.cardBg,
              borderRadius: 16,
              boxShadow: theme.shadow,
              border: `1px solid ${theme.border}`
            }}>
              <FaBox style={{ fontSize: 60, color: theme.textSecondary, marginBottom: 20 }} />
              <h3 style={{ color: theme.textSecondary }}>Belum ada paket</h3>
              <p style={{ color: theme.textSecondary, fontSize: 14 }}>
                Paket akan muncul ketika seller menugaskan ke hub Anda
              </p>
            </div>
          ) : (
            <div>
              {assignments.map((assignment, idx) => {
                const badge = getStatusBadge(assignment.status);
                return (
                  <motion.div
                    key={assignment.ID || idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    style={{
                      backgroundColor: theme.cardBg,
                      borderRadius: 16,
                      padding: 20,
                      marginBottom: 16,
                      boxShadow: theme.shadow,
                      border: `1px solid ${theme.border}`
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 16
                    }}>
                      <div>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 700, color: theme.text }}>
                          #{assignment.tracking_number}
                        </h4>
                        <p style={{ margin: '0 0 4px 0', fontSize: 14, color: theme.textSecondary }}>
                          <FaMapMarkerAlt size={12} style={{ marginRight: 4 }} />
                          {assignment.Shipment?.shipping_address || 'Alamat tidak tersedia'}
                        </p>
                        {assignment.notes && (
                          <p style={{ margin: 0, fontSize: 13, color: theme.textSecondary }}>
                            <strong>Catatan:</strong> {assignment.notes}
                          </p>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          padding: '8px 16px',
                          borderRadius: 20,
                          backgroundColor: badge.color,
                          color: 'white',
                          fontWeight: 700,
                          fontSize: 13,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}>
                          {badge.icon}
                          {badge.label}
                        </div>

                        {assignment.status === 'menunggu' && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handlePickup(assignment.ID)}
                            style={{
                              padding: '10px 20px',
                              backgroundColor: '#10B981',
                              color: 'white',
                              border: 'none',
                              borderRadius: 8,
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: 14
                            }}
                          >
                            <FaCheck style={{ marginRight: 6 }} /> Ambil Paket
                          </motion.button>
                        )}

                        {assignment.status === 'diambil' || assignment.status === 'dikirim' ? (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setShowActionModal(true);
                            }}
                            style={{
                              padding: '10px 20px',
                              backgroundColor: '#3B82F6',
                              color: 'white',
                              border: 'none',
                              borderRadius: 8,
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: 14
                            }}
                          >
                            <FaTruck style={{ marginRight: 6 }} /> Update Pengiriman
                          </motion.button>
                        ) : null}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* History View */}
      {showHistory && (
        <div>
          <h3 style={{ 
            fontSize: 24, 
            fontWeight: 700, 
            marginBottom: 20, 
            color: theme.text 
          }}>
            <FaHistory style={{ marginRight: 10 }} />
            Riwayat Pengiriman Anda
          </h3>

          {history.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 60,
              backgroundColor: theme.cardBg,
              borderRadius: 16,
              boxShadow: theme.shadow,
              border: `1px solid ${theme.border}`
            }}>
              <FaHistory style={{ fontSize: 60, color: theme.textSecondary, marginBottom: 20 }} />
              <h3 style={{ color: theme.textSecondary }}>Belum ada riwayat pengiriman</h3>
            </div>
          ) : (
            <div>
              {history.map((item, idx) => {
                const badge = getStatusBadge(item.status);
                return (
                  <motion.div
                    key={item.ID || idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    style={{
                      backgroundColor: theme.cardBg,
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 12,
                      border: `1px solid ${theme.border}`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: 15, fontWeight: 700, color: theme.text }}>
                          #{item.tracking_number}
                        </h4>
                        <p style={{ margin: 0, fontSize: 13, color: theme.textSecondary }}>
                          {item.Shipment?.shipping_address || 'Alamat tidak tersedia'}
                        </p>
                      </div>
                      <div style={{
                        padding: '6px 12px',
                        borderRadius: 20,
                        backgroundColor: badge.color,
                        color: 'white',
                        fontWeight: 700,
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        {badge.icon}
                        {badge.label}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowHistory(false)}
            style={{
              marginTop: 24,
              width: '100%',
              padding: 14,
              backgroundColor: theme.textSecondary,
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 15
            }}
          >
            Kembali ke Daftar Paket
          </motion.button>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedAssignment && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowActionModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            style={{
              position: 'relative',
              backgroundColor: theme.cardBg,
              padding: 32,
              borderRadius: 20,
              maxWidth: 500,
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: theme.shadow
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ 
              margin: '0 0 24px 0', 
              fontSize: 24, 
              fontWeight: 700, 
              color: theme.text 
            }}>
              <FaTruck style={{ marginRight: 10 }} />
              Update Pengiriman
            </h3>

            <div style={{ marginBottom: 20 }}>
              <p style={{ margin: '0 0 4px 0', fontSize: 14, color: theme.textSecondary }}>Nomor Resi</p>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: theme.primary }}>
                {selectedAssignment.tracking_number}
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: theme.text }}>
                Lokasi Pengiriman *
              </label>
              <select
                value={deliveryLocation}
                onChange={(e) => setDeliveryLocation(e.target.value)}
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 8,
                  border: `1px solid ${theme.border}`,
                  background: theme.inputBg,
                  color: theme.text,
                  fontSize: 15
                }}
              >
                <option value="">-- Pilih Lokasi --</option>
                <option value="Dalam Perjalanan">Dalam Perjalanan</option>
                <option value="Sampai di Tujuan">Sampai di Tujuan</option>
              </select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: theme.text }}>
                Catatan (Opsional)
              </label>
              <textarea
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="Catatan pengiriman..."
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 8,
                  border: `1px solid ${theme.border}`,
                  background: theme.inputBg,
                  color: theme.text,
                  fontSize: 15,
                  minHeight: 80,
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUpdateDelivery}
                style={{
                  flex: 1,
                  padding: 14,
                  backgroundColor: '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 15
                }}
              >
                Simpan
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowActionModal(false)}
                style={{
                  flex: 1,
                  padding: 14,
                  backgroundColor: theme.textSecondary,
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 15
                }}
              >
                Batal
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default DeliveryHubManagement;
