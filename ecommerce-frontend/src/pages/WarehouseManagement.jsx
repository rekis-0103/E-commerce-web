import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme, DarkModeToggle } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { FaWarehouse, FaBoxOpen, FaSignOutAlt, FaPlus, FaHistory, FaArrowRight, FaArrowLeft } from 'react-icons/fa';

function WarehouseManagement() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [warehouse, setWarehouse] = useState(null);
  const [movements, setMovements] = useState([]);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form states untuk register gudang
  const [warehouseName, setWarehouseName] = useState('');
  const [warehouseCode, setWarehouseCode] = useState('');
  const [warehouseAddress, setWarehouseAddress] = useState('');

  // Form states untuk input pergerakan barang
  const [trackingNumber, setTrackingNumber] = useState('');
  const [movementType, setMovementType] = useState('');
  const [movementStatus, setMovementStatus] = useState('');
  const [movementNotes, setMovementNotes] = useState('');

  useEffect(() => {
    if (role !== 'warehouse_staff') {
      navigate('/login');
      return;
    }
    fetchWarehouseData();
  }, [role, navigate]);

  const fetchWarehouseData = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/warehouse/my-warehouse', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWarehouse(response.data.data);
      setIsLoading(false);
    } catch (error) {
      if (error.response?.status === 404) {
        // Gudang belum ada, tampilkan form register
        setShowRegisterForm(true);
      }
      setIsLoading(false);
    }
  };

  const fetchMovements = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/warehouse/movements', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMovements(response.data.data || []);
      setShowHistory(true);
    } catch (error) {
      console.error("Gagal mengambil riwayat pergerakan", error);
      alert("Gagal mengambil riwayat pergerakan");
    }
  };

  const handleRegisterWarehouse = async (e) => {
    e.preventDefault();

    if (!warehouseName || !warehouseCode) {
      alert("Nama dan kode gudang wajib diisi!");
      return;
    }

    try {
      await axios.post('http://localhost:3000/api/warehouse/register', {
        name: warehouseName,
        code: warehouseCode,
        address: warehouseAddress
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("✅ Gudang berhasil didaftarkan!");
      setShowRegisterForm(false);
      setWarehouseName('');
      setWarehouseCode('');
      setWarehouseAddress('');
      fetchWarehouseData();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal mendaftarkan gudang");
    }
  };

  const handleRecordMovement = async (e) => {
    e.preventDefault();

    if (!trackingNumber || !movementType) {
      alert("Nomor resi dan tipe pergerakan wajib diisi!");
      return;
    }

    try {
      await axios.post('http://localhost:3000/api/warehouse/movement', {
        tracking_number: trackingNumber,
        movement_type: movementType,
        status: movementStatus,
        notes: movementNotes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`✅ Berhasil mencatat barang ${movementType}!`);
      setShowMovementForm(false);
      setTrackingNumber('');
      setMovementType('');
      setMovementStatus('');
      setMovementNotes('');
      fetchWarehouseData();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal mencatat pergerakan");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const getMovementIcon = (type) => {
    return type === 'masuk' ? <FaArrowLeft /> : <FaArrowRight />;
  };

  const getMovementColor = (type) => {
    return type === 'masuk' ? '#10B981' : '#EF4444';
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
        <h2 style={{ color: theme.textSecondary }}>Memuat Data Gudang...</h2>
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
          🏭 Manajemen Gudang
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

      {/* Register Warehouse Form */}
      {showRegisterForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            backgroundColor: theme.cardBg,
            padding: 32,
            borderRadius: 16,
            marginBottom: 32,
            boxShadow: theme.shadow,
            border: `1px solid ${theme.border}`
          }}
        >
          <h3 style={{ 
            margin: '0 0 24px 0', 
            fontSize: 24, 
            fontWeight: 700, 
            color: theme.text 
          }}>
            <FaWarehouse style={{ marginRight: 10 }} />
            Daftarkan Gudang Baru
          </h3>

          <form onSubmit={handleRegisterWarehouse}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ 
                display: 'block', 
                marginBottom: 8, 
                fontWeight: 600, 
                fontSize: 14, 
                color: theme.text 
              }}>
                Nama Gudang *
              </label>
              <input
                type="text"
                value={warehouseName}
                onChange={(e) => setWarehouseName(e.target.value)}
                placeholder="Contoh: Gudang Jakarta Utara"
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 8,
                  border: `1px solid ${theme.border}`,
                  background: theme.inputBg,
                  color: theme.text,
                  fontSize: 15
                }}
                required
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ 
                display: 'block', 
                marginBottom: 8, 
                fontWeight: 600, 
                fontSize: 14, 
                color: theme.text 
              }}>
                Kode Gudang *
              </label>
              <input
                type="text"
                value={warehouseCode}
                onChange={(e) => setWarehouseCode(e.target.value.toUpperCase())}
                placeholder="Contoh: JKT-001"
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 8,
                  border: `1px solid ${theme.border}`,
                  background: theme.inputBg,
                  color: theme.text,
                  fontSize: 15
                }}
                required
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ 
                display: 'block', 
                marginBottom: 8, 
                fontWeight: 600, 
                fontSize: 14, 
                color: theme.text 
              }}>
                Alamat Gudang
              </label>
              <textarea
                value={warehouseAddress}
                onChange={(e) => setWarehouseAddress(e.target.value)}
                placeholder="Alamat lengkap gudang..."
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

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              style={{
                width: '100%',
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
              <FaPlus style={{ marginRight: 8 }} />
              Daftarkan Gudang
            </motion.button>
          </form>
        </motion.div>
      )}

      {/* Warehouse Info */}
      {warehouse && !showRegisterForm && (
        <>
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
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16
            }}>
              <div>
                <h3 style={{ 
                  margin: '0 0 8px 0', 
                  fontSize: 22, 
                  fontWeight: 700, 
                  color: theme.text 
                }}>
                  <FaWarehouse style={{ marginRight: 10, color: '#3B82F6' }} />
                  {warehouse.name}
                </h3>
                <p style={{ 
                  margin: '0 0 4px 0', 
                  fontSize: 14, 
                  color: theme.textSecondary 
                }}>
                  <strong>Kode:</strong> {warehouse.code}
                </p>
                {warehouse.address && (
                  <p style={{ 
                    margin: 0, 
                    fontSize: 14, 
                    color: theme.textSecondary 
                  }}>
                    <strong>Alamat:</strong> {warehouse.address}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowMovementForm(true)}
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
                  <FaPlus /> Input Pergerakan
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={fetchMovements}
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
                  <FaHistory /> Riwayat
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Movement Form Modal */}
          {showMovementForm && (
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
              onClick={() => setShowMovementForm(false)}
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
                  <FaBoxOpen style={{ marginRight: 10 }} />
                  Input Pergerakan Barang
                </h3>

                <form onSubmit={handleRecordMovement}>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: 8, 
                      fontWeight: 600, 
                      fontSize: 14, 
                      color: theme.text 
                    }}>
                      Nomor Resi *
                    </label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Contoh: TRX-20260415-0001-123"
                      style={{
                        width: '100%',
                        padding: 12,
                        borderRadius: 8,
                        border: `1px solid ${theme.border}`,
                        background: theme.inputBg,
                        color: theme.text,
                        fontSize: 15
                      }}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: 8, 
                      fontWeight: 600, 
                      fontSize: 14, 
                      color: theme.text 
                    }}>
                      Tipe Pergerakan *
                    </label>
                    <select
                      value={movementType}
                      onChange={(e) => setMovementType(e.target.value)}
                      style={{
                        width: '100%',
                        padding: 12,
                        borderRadius: 8,
                        border: `1px solid ${theme.border}`,
                        background: theme.inputBg,
                        color: theme.text,
                        fontSize: 15
                      }}
                      required
                    >
                      <option value="">-- Pilih Tipe --</option>
                      <option value="masuk">Barang Masuk</option>
                      <option value="keluar">Barang Keluar</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: 8, 
                      fontWeight: 600, 
                      fontSize: 14, 
                      color: theme.text 
                    }}>
                      Status (Opsional)
                    </label>
                    <input
                      type="text"
                      value={movementStatus}
                      onChange={(e) => setMovementStatus(e.target.value)}
                      placeholder="Contoh: Diterima di gudang"
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

                  <div style={{ marginBottom: 24 }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: 8, 
                      fontWeight: 600, 
                      fontSize: 14, 
                      color: theme.text 
                    }}>
                      Catatan (Opsional)
                    </label>
                    <textarea
                      value={movementNotes}
                      onChange={(e) => setMovementNotes(e.target.value)}
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
                      type="submit"
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
                      onClick={() => setShowMovementForm(false)}
                      type="button"
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
                </form>
              </motion.div>
            </motion.div>
          )}

          {/* Movement History */}
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                backgroundColor: theme.cardBg,
                padding: 24,
                borderRadius: 16,
                boxShadow: theme.shadow,
                border: `1px solid ${theme.border}`
              }}
            >
              <h3 style={{ 
                margin: '0 0 24px 0', 
                fontSize: 22, 
                fontWeight: 700, 
                color: theme.text 
              }}>
                <FaHistory style={{ marginRight: 10, color: '#3B82F6' }} />
                Riwayat Pergerakan Gudang
              </h3>

              {movements.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: 40,
                  color: theme.textSecondary 
                }}>
                  <FaBoxOpen style={{ fontSize: 48, marginBottom: 16 }} />
                  <p>Belum ada pergerakan barang</p>
                </div>
              ) : (
                <div>
                  {movements.map((movement, idx) => (
                    <motion.div
                      key={movement.ID || idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      style={{
                        backgroundColor: theme.bg,
                        padding: 16,
                        borderRadius: 12,
                        marginBottom: 12,
                        border: `1px solid ${theme.border}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 16
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 8,
                          marginBottom: 8
                        }}>
                          <span style={{
                            padding: '6px 12px',
                            borderRadius: 20,
                            backgroundColor: getMovementColor(movement.movement_type),
                            color: 'white',
                            fontWeight: 700,
                            fontSize: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            {getMovementIcon(movement.movement_type)}
                            {movement.movement_type === 'masuk' ? 'MASUK' : 'KELUAR'}
                          </span>
                          <strong style={{ 
                            fontSize: 14, 
                            color: theme.text 
                          }}>
                            {movement.tracking_number}
                          </strong>
                        </div>

                        {movement.status && (
                          <p style={{ 
                            margin: '0 0 4px 0', 
                            fontSize: 13, 
                            color: theme.textSecondary 
                          }}>
                            <strong>Status:</strong> {movement.status}
                          </p>
                        )}

                        {movement.notes && (
                          <p style={{ 
                            margin: 0, 
                            fontSize: 13, 
                            color: theme.textSecondary 
                          }}>
                            <strong>Catatan:</strong> {movement.notes}
                          </p>
                        )}
                      </div>

                      <div style={{ 
                        textAlign: 'right',
                        fontSize: 12,
                        color: theme.textSecondary
                      }}>
                        <p style={{ margin: '0 0 4px 0' }}>
                          {new Date(movement.processed_at).toLocaleString('id-ID')}
                        </p>
                        <p style={{ margin: 0 }}>
                          Oleh: User #{movement.processed_by}
                        </p>
                      </div>
                    </motion.div>
                  ))}
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
                Tutup Riwayat
              </motion.button>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

export default WarehouseManagement;
