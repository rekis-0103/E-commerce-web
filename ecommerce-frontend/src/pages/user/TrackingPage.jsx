import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useTheme, DarkModeToggle } from '../../context/ThemeContext';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaSearch, FaTruck, FaBox, FaCheckCircle, FaMapMarkerAlt, FaClock, FaShippingFast } from 'react-icons/fa';
import { MdOutlineDeliveryDining } from 'react-icons/md';

function TrackingPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [shipments, setShipments] = useState([]);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [trackingResult, setTrackingResult] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchShipments();
  }, [token, navigate]);

  const fetchShipments = async () => {
    try {
      let url = '';
      if (role === 'buyer') {
        url = 'http://localhost:3000/api/buyer/shipments';
      } else if (role === 'seller') {
        url = 'http://localhost:3000/api/seller/shipments';
      } else {
        setIsLoading(false);
        return;
      }

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

  const searchTracking = async () => {
    if (!trackingInput.trim()) {
      setSearchError('Masukkan nomor resi!');
      return;
    }
    setSearchError('');
    try {
      const response = await axios.get(`http://localhost:3000/api/tracking/${trackingInput}`);
      setTrackingResult(response.data.data);
      setSelectedShipment(null);
    } catch (error) {
      setTrackingResult(null);
      setSearchError(error.response?.data?.message || 'Nomor resi tidak ditemukan');
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

  if (isLoading) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif", background: theme.bg, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <h2 style={{ color: theme.textSecondary }}>Memuat Data Pengiriman...</h2>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: theme.bg, minHeight: '100vh', padding: '40px 20px', transition: 'all 0.3s ease' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
          <Link to={role === 'seller' ? '/dashboard' : '/home'} style={{ textDecoration: 'none', color: theme.primary, fontWeight: 600, fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <FaArrowLeft /> Kembali
          </Link>
          <DarkModeToggle />
        </div>

        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: 36, fontWeight: 800, marginBottom: 30, color: theme.text, fontFamily: "'Poppins', sans-serif" }}
        >
          📦 Tracking Pengiriman
        </motion.h2>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: theme.cardBg,
            borderRadius: 16,
            padding: 24,
            marginBottom: 30,
            boxShadow: theme.shadow,
            border: `1px solid ${theme.border}`
          }}
        >
          <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 700, color: theme.text }}>
            Cari Berdasarkan Nomor Resi
          </h3>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <FaSearch style={{
                position: 'absolute',
                top: '50%',
                left: 16,
                transform: 'translateY(-50%)',
                color: theme.textSecondary,
                fontSize: 16
              }} />
              <input
                type="text"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchTracking()}
                placeholder="Masukkan nomor resi (contoh: TRX-20260414-0001)"
                style={{
                  width: '100%',
                  padding: '14px 14px 14px 48px',
                  borderRadius: 12,
                  border: `2px solid ${theme.inputBorder}`,
                  background: theme.inputBg,
                  color: theme.text,
                  fontSize: 15,
                  outline: 'none'
                }}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={searchTracking}
              style={{
                padding: '14px 24px',
                backgroundColor: theme.primary,
                color: 'white',
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 15
              }}
            >
              Cari
            </motion.button>
          </div>
          {searchError && (
            <p style={{ marginTop: 12, color: '#EF4444', fontSize: 14, fontWeight: 600 }}>
              {searchError}
            </p>
          )}
        </motion.div>

        {/* Tracking Result */}
        {trackingResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: theme.cardBg,
              borderRadius: 16,
              padding: 24,
              marginBottom: 30,
              boxShadow: theme.shadow,
              border: `1px solid ${theme.border}`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: 20, fontWeight: 700, color: theme.text }}>
                  Hasil Tracking
                </h3>
                <p style={{ margin: 0, fontSize: 14, color: theme.textSecondary }}>
                  Resi: <strong style={{ color: theme.primary }}>{trackingResult.tracking_number}</strong>
                </p>
              </div>
              <div style={{
                padding: '8px 16px',
                borderRadius: 20,
                backgroundColor: getStatusColor(trackingResult.current_status),
                color: 'white',
                fontWeight: 700,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                {getStatusIcon(trackingResult.current_status)}
                {trackingResult.current_status}
              </div>
            </div>

            {/* Info Pengiriman */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
              marginBottom: 24
            }}>
              <div style={{
                background: theme.bg,
                padding: 16,
                borderRadius: 12,
                border: `1px solid ${theme.border}`
              }}>
                <p style={{ margin: '0 0 4px 0', fontSize: 12, color: theme.textSecondary, fontWeight: 600 }}>KURIR</p>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: theme.text }}>{trackingResult.courier_name}</p>
              </div>
              <div style={{
                background: theme.bg,
                padding: 16,
                borderRadius: 12,
                border: `1px solid ${theme.border}`
              }}>
                <p style={{ margin: '0 0 4px 0', fontSize: 12, color: theme.textSecondary, fontWeight: 600 }}>LOKASI TERAKHIR</p>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: theme.text }}>{trackingResult.current_location}</p>
              </div>
              <div style={{
                background: theme.bg,
                padding: 16,
                borderRadius: 12,
                border: `1px solid ${theme.border}`
              }}>
                <p style={{ margin: '0 0 4px 0', fontSize: 12, color: theme.textSecondary, fontWeight: 600 }}>ESTIMASI</p>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: theme.text }}>{trackingResult.estimated_days} hari</p>
              </div>
            </div>

            {/* Timeline Logs */}
            <h4 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 700, color: theme.text }}>
              Riwayat Perjalanan Paket
            </h4>
            <div style={{ position: 'relative', paddingLeft: 30 }}>
              {/* Garis vertikal timeline */}
              <div style={{
                position: 'absolute',
                left: 11,
                top: 0,
                bottom: 0,
                width: 2,
                background: theme.border
              }} />

              {trackingResult.logs.map((log, idx) => (
                <motion.div
                  key={log.ID}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  style={{ position: 'relative', marginBottom: 20 }}
                >
                  {/* Dot */}
                  <div style={{
                    position: 'absolute',
                    left: -30,
                    top: 4,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: idx === 0 ? getStatusColor(log.status) : theme.border,
                    border: `3px solid ${theme.cardBg}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: idx === 0 ? 'white' : theme.textSecondary,
                    fontSize: 10,
                    zIndex: 1
                  }}>
                    {idx === 0 ? getStatusIcon(log.status) : <FaClock size={10} />}
                  </div>

                  {/* Content */}
                  <div style={{
                    background: idx === 0 ? theme.bg : 'transparent',
                    padding: idx === 0 ? 16 : 12,
                    borderRadius: idx === 0 ? 12 : 0,
                    border: idx === 0 ? `1px solid ${theme.border}` : 'none'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <strong style={{ fontSize: 15, color: theme.text }}>{log.status}</strong>
                      {idx === 0 && (
                        <span style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 10,
                          backgroundColor: getStatusColor(log.status),
                          color: 'white',
                          fontWeight: 600
                        }}>
                          TERKINI
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '4px 0', fontSize: 13, color: theme.textSecondary, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FaMapMarkerAlt size={12} /> {log.location}
                    </p>
                    {log.notes && (
                      <p style={{ margin: '4px 0 0 0', fontSize: 13, color: theme.textSecondary, fontStyle: 'italic' }}>
                        {log.notes}
                      </p>
                    )}
                    <p style={{ margin: '4px 0 0 0', fontSize: 12, color: theme.textSecondary }}>
                      {new Date(log.created_at).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Daftar Shipment Saya */}
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: 24, fontWeight: 700, marginBottom: 20, color: theme.text }}
        >
          {role === 'seller' ? 'Pengiriman dari Toko Anda' : 'Pengiriman Saya'}
        </motion.h3>

        {shipments.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 60,
            backgroundColor: theme.cardBg,
            borderRadius: 16,
            boxShadow: theme.shadow,
            border: `1px solid ${theme.border}`
          }}>
            <MdOutlineDeliveryDining style={{ fontSize: 60, color: theme.textSecondary, marginBottom: 20 }} />
            <h3 style={{ color: theme.textSecondary, marginBottom: 10 }}>Belum ada pengiriman</h3>
            <p style={{ color: theme.textSecondary, fontSize: 14 }}>Pesanan yang sudah dikirim akan muncul di sini</p>
          </div>
        ) : (
          <div>
            {shipments.map((shipment, idx) => (
              <motion.div
                key={shipment.ID}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                style={{
                  background: theme.cardBg,
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 16,
                  boxShadow: theme.shadow,
                  border: `1px solid ${theme.border}`,
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setTrackingInput(shipment.tracking_number);
                  setTrackingResult({
                    tracking_number: shipment.tracking_number,
                    courier_name: shipment.courier_name,
                    current_status: shipment.current_status,
                    current_location: shipment.current_location,
                    estimated_days: shipment.estimated_days,
                    logs: shipment.logs || []
                  });
                  setSelectedShipment(shipment.ID);
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: 16, fontWeight: 700, color: theme.text }}>
                      #{shipment.tracking_number}
                    </h4>
                    <p style={{ margin: 0, fontSize: 14, color: theme.textSecondary }}>
                      Order ID: #{shipment.order_id}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: 12, color: theme.textSecondary }}>Lokasi Terakhir</p>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: theme.text }}>
                        <FaMapMarkerAlt size={12} style={{ marginRight: 4 }} />
                        {shipment.current_location}
                      </p>
                    </div>

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
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TrackingPage;
