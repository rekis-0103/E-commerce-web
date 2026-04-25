import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme, DarkModeToggle } from '../../context/ThemeContext';
import { motion } from 'framer-motion';
import { FaTruck, FaMapMarkerAlt, FaBox, FaCheckCircle, FaShippingFast, FaSignOutAlt } from 'react-icons/fa';

function ShipmentManagement() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [shipments, setShipments] = useState([]);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [locationInput, setLocationInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [statusInput, setStatusInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (role !== 'courier' && role !== 'warehouse_staff') {
      navigate('/login');
      return;
    }
    fetchShipments();
  }, [role, navigate]);

  const fetchShipments = async () => {
    try {
      const url = role === 'courier'
        ? 'http://localhost:3000/api/courier/shipments'
        : 'http://localhost:3000/api/warehouse/shipments';

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShipments(response.data.data || []);
      setIsLoading(false);
    } catch (error) {
      console.error("Gagal mengambil data pengiriman", error);
      setIsLoading(false);
    }
  };

  const handleUpdateLocation = async () => {
    if (!locationInput.trim()) {
      alert("Lokasi harus diisi!");
      return;
    }

    try {
      await axios.put('http://localhost:3000/api/warehouse/shipments/location', {
        tracking_number: selectedShipment.tracking_number,
        location: locationInput,
        notes: notesInput
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("✅ Lokasi paket berhasil diperbarui!");
      setShowModal(false);
      setLocationInput('');
      setNotesInput('');
      fetchShipments();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal update lokasi");
    }
  };

  const handleUpdateStatus = async () => {
    if (!statusInput) {
      alert("Status harus dipilih!");
      return;
    }

    try {
      await axios.put('http://localhost:3000/api/courier/shipments/status', {
        tracking_number: selectedShipment.tracking_number,
        status: statusInput,
        location: locationInput || selectedShipment.current_location,
        notes: notesInput
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("✅ Status pengiriman berhasil diperbarui!");
      setShowModal(false);
      setLocationInput('');
      setNotesInput('');
      setStatusInput('');
      fetchShipments();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal update status");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Dikirim': return <FaShippingFast />;
      case 'Dalam Perjalanan': return <FaTruck />;
      case 'Sampai': return <FaCheckCircle />;
      case 'Selesai': return <FaCheckCircle />;
      default: return <FaBox />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Dikirim': return '#3B82F6';
      case 'Dalam Perjalanan': return '#F59E0B';
      case 'Sampai': return '#10B981';
      case 'Selesai': return '#059669';
      default: return theme.textSecondary;
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif", background: theme.bg, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <h2 style={{ color: theme.textSecondary }}>Memuat Data Pengiriman...</h2>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: theme.bg, minHeight: '100vh', padding: '40px 60px', transition: 'all 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: 32, fontWeight: 800, margin: 0, color: theme.text, fontFamily: "'Poppins', sans-serif" }}
        >
          {role === 'courier' ? '📦 Manajemen Pengiriman (Kurir)' : '📦 Manajemen Gudang'}
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

      {/* Shipment List */}
      <div>
        {shipments.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 60,
            backgroundColor: theme.cardBg,
            borderRadius: 16,
            boxShadow: theme.shadow,
            border: `1px solid ${theme.border}`
          }}>
            <FaBox style={{ fontSize: 60, color: theme.textSecondary, marginBottom: 20 }} />
            <h3 style={{ color: theme.textSecondary }}>Belum ada pengiriman</h3>
          </div>
        ) : (
          <div>
            {shipments.map((shipment, idx) => (
              <motion.div
                key={shipment.ID}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                style={{
                  background: theme.cardBg,
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 16,
                  boxShadow: theme.shadow,
                  border: `1px solid ${theme.border}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: 16, fontWeight: 700, color: theme.text }}>
                      #{shipment.tracking_number}
                    </h4>
                    <p style={{ margin: '0 0 4px 0', fontSize: 14, color: theme.textSecondary }}>
                      Order ID: #{shipment.order_id} | Kurir: {shipment.courier_name}
                    </p>
                    <p style={{ margin: 0, fontSize: 13, color: theme.textSecondary }}>
                      <FaMapMarkerAlt size={12} style={{ marginRight: 4 }} />
                      {shipment.current_location}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      padding: '8px 16px',
                      borderRadius: 20,
                      backgroundColor: getStatusColor(shipment.current_status),
                      color: 'white',
                      fontWeight: 700,
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      {getStatusIcon(shipment.current_status)}
                      {shipment.current_status}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedShipment(shipment);
                        setLocationInput(shipment.current_location);
                        setNotesInput('');
                        setStatusInput('');
                        setShowModal(true);
                      }}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: theme.primary,
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: 14
                      }}
                    >
                      Update
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Update */}
      {showModal && selectedShipment && (
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
          onClick={() => setShowModal(false)}
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
            <h3 style={{ margin: '0 0 24px 0', fontSize: 24, fontWeight: 700, color: theme.text }}>
              Update Pengiriman
            </h3>

            <div style={{ marginBottom: 20 }}>
              <p style={{ margin: '0 0 4px 0', fontSize: 14, color: theme.textSecondary }}>Nomor Resi</p>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: theme.primary }}>
                {selectedShipment.tracking_number}
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: theme.text }}>
                Lokasi
              </label>
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder="Contoh: Sorting Center Bandung"
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 8,
                  border: `1px solid ${theme.border}`,
                  background: theme.inputBg,
                  color: theme.text,
                  fontSize: 15
                }}
              />
            </div>

            {role === 'courier' && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: theme.text }}>
                  Status
                </label>
                <select
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value)}
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
                  <option value="">-- Pilih Status --</option>
                  <option value="Dalam Perjalanan">Dalam Perjalanan</option>
                  <option value="Sampai">Sampai</option>
                </select>
              </div>
            )}

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: theme.text }}>
                Catatan (Opsional)
              </label>
              <textarea
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="Catatan tambahan..."
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
                onClick={role === 'courier' ? handleUpdateStatus : handleUpdateLocation}
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
                {role === 'courier' ? 'Update Status' : 'Update Lokasi'}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowModal(false)}
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

export default ShipmentManagement;
