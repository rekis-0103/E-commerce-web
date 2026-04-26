import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useTheme, DarkModeToggle } from '../../context/ThemeContext';
import { motion } from 'framer-motion';
import { 
  FaSignOutAlt, FaUsers, FaStore, FaBox, FaTruck, FaWarehouse, 
  FaShippingFast, FaCheckCircle, FaClock, FaChartLine 
} from 'react-icons/fa';

function AdminDashboard() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchDashboardStats();
  }, [role, navigate]);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.data);
      setIsLoading(false);
    } catch (error) {
      console.error("Gagal mengambil data dashboard", error);
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const StatCard = ({ icon, label, value, color, delay }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      style={{
        backgroundColor: theme.cardBg,
        padding: 24,
        borderRadius: 16,
        boxShadow: theme.shadow,
        border: `1px solid ${theme.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 16
      }}
    >
      <div style={{
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 28,
        color: 'white'
      }}>
        {icon}
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 14, color: theme.textSecondary, fontWeight: 500 }}>{label}</p>
        <h3 style={{ margin: '4px 0 0 0', fontSize: 32, fontWeight: 800, color: theme.text }}>{value}</h3>
      </div>
    </motion.div>
  );

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
        <h2 style={{ color: theme.textSecondary }}>Memuat Dashboard Admin...</h2>
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
          🛡️ Dashboard Admin
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

      {/* Navigation Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 20,
          marginBottom: 40
        }}
      >
        <Link to="/admin/user-management" style={{ textDecoration: 'none' }}>
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            style={{
              backgroundColor: theme.cardBg,
              padding: 24,
              borderRadius: 16,
              boxShadow: theme.shadow,
              border: `1px solid ${theme.border}`,
              cursor: 'pointer',
              textAlign: 'center'
            }}
          >
            <FaUsers style={{ fontSize: 40, color: '#3B82F6', marginBottom: 12 }} />
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: theme.text }}>Manajemen User</h3>
            <p style={{ margin: '8px 0 0 0', fontSize: 14, color: theme.textSecondary }}>
              CRUD Seller, Staff, Kurir
            </p>
          </motion.div>
        </Link>

        <Link to="/admin/shop-approval" style={{ textDecoration: 'none' }}>
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            style={{
              backgroundColor: theme.cardBg,
              padding: 24,
              borderRadius: 16,
              boxShadow: theme.shadow,
              border: `1px solid ${theme.border}`,
              cursor: 'pointer',
              textAlign: 'center'
            }}
          >
            <FaClock style={{ fontSize: 40, color: '#F59E0B', marginBottom: 12 }} />
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: theme.text }}>Approval Toko</h3>
            <p style={{ margin: '8px 0 0 0', fontSize: 14, color: theme.textSecondary }}>
              {stats?.shops?.pending || 0} menuggu review
            </p>
          </motion.div>
        </Link>

        <Link to="/admin/shop-management" style={{ textDecoration: 'none' }}>
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            style={{
              backgroundColor: theme.cardBg,
              padding: 24,
              borderRadius: 16,
              boxShadow: theme.shadow,
              border: `1px solid ${theme.border}`,
              cursor: 'pointer',
              textAlign: 'center'
            }}
          >
            <FaStore style={{ fontSize: 40, color: '#3B82F6', marginBottom: 12 }} />
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: theme.text }}>Manajemen Toko</h3>
            <p style={{ margin: '8px 0 0 0', fontSize: 14, color: theme.textSecondary }}>
              Edit badge & hapus toko
            </p>
          </motion.div>
        </Link>

        <Link to="/admin/warehouse-management" style={{ textDecoration: 'none' }}>
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            style={{
              backgroundColor: theme.cardBg,
              padding: 24,
              borderRadius: 16,
              boxShadow: theme.shadow,
              border: `1px solid ${theme.border}`,
              cursor: 'pointer',
              textAlign: 'center'
            }}
          >
            <FaWarehouse style={{ fontSize: 40, color: '#10B981', marginBottom: 12 }} />
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: theme.text }}>Manajemen Gudang</h3>
            <p style={{ margin: '8px 0 0 0', fontSize: 14, color: theme.textSecondary }}>
              Buat gudang & tambah staff
            </p>
          </motion.div>
        </Link>

        <Link to="/admin/courier-management" style={{ textDecoration: 'none' }}>
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            style={{
              backgroundColor: theme.cardBg,
              padding: 24,
              borderRadius: 16,
              boxShadow: theme.shadow,
              border: `1px solid ${theme.border}`,
              cursor: 'pointer',
              textAlign: 'center'
            }}
          >
            <FaTruck style={{ fontSize: 40, color: '#8B5CF6', marginBottom: 12 }} />
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: theme.text }}>Manajemen Kurir</h3>
            <p style={{ margin: '8px 0 0 0', fontSize: 14, color: theme.textSecondary }}>
              Tambah kurir & assign ke hub
            </p>
          </motion.div>
        </Link>
      </motion.div>

      {/* Statistics */}
      <h3 style={{ 
        fontSize: 24, 
        fontWeight: 700, 
        marginBottom: 20, 
        color: theme.text,
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }}>
        <FaChartLine /> Statistik Platform
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 20,
        marginBottom: 40
      }}>
        <StatCard 
          icon={<FaUsers />} 
          label="Total Pengguna" 
          value={stats?.users?.total || 0} 
          color="#3B82F6" 
          delay={0.1} 
        />
        <StatCard 
          icon={<FaStore />} 
          label="Total Toko" 
          value={stats?.shops?.total || 0} 
          color="#10B981" 
          delay={0.2} 
        />
        <StatCard 
          icon={<FaWarehouse />} 
          label="Gudang & Hub" 
          value={(stats?.warehouses?.total_warehouses || 0) + (stats?.warehouses?.total_hubs || 0)} 
          color="#8B5CF6" 
          delay={0.3} 
        />
        <StatCard 
          icon={<FaShippingFast />} 
          label="Pengiriman Aktif" 
          value={stats?.shipments?.active || 0} 
          color="#F59E0B" 
          delay={0.4} 
        />
      </div>

      {/* Detailed Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 20,
        marginBottom: 40
      }}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{
            backgroundColor: theme.cardBg,
            padding: 24,
            borderRadius: 16,
            boxShadow: theme.shadow,
            border: `1px solid ${theme.border}`
          }}
        >
          <h4 style={{ margin: '0 0 20px 0', fontSize: 18, fontWeight: 700, color: theme.text }}>
            👥 Distribusi Pengguna
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: theme.bg, borderRadius: 8 }}>
              <span style={{ color: theme.textSecondary }}>Pembeli</span>
              <strong style={{ color: theme.text }}>{stats?.users?.buyers || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: theme.bg, borderRadius: 8 }}>
              <span style={{ color: theme.textSecondary }}>Penjual</span>
              <strong style={{ color: theme.text }}>{stats?.users?.sellers || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: theme.bg, borderRadius: 8 }}>
              <span style={{ color: theme.textSecondary }}>Kurir</span>
              <strong style={{ color: theme.text }}>{stats?.users?.couriers || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: theme.bg, borderRadius: 8 }}>
              <span style={{ color: theme.textSecondary }}>Staff Gudang</span>
              <strong style={{ color: theme.text }}>{stats?.users?.warehouse_staff || 0}</strong>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{
            backgroundColor: theme.cardBg,
            padding: 24,
            borderRadius: 16,
            boxShadow: theme.shadow,
            border: `1px solid ${theme.border}`
          }}
        >
          <h4 style={{ margin: '0 0 20px 0', fontSize: 18, fontWeight: 700, color: theme.text }}>
            📦 Status Pengiriman
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: theme.bg, borderRadius: 8 }}>
              <span style={{ color: theme.textSecondary }}>Total</span>
              <strong style={{ color: theme.text }}>{stats?.shipments?.total || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: theme.bg, borderRadius: 8 }}>
              <span style={{ color: theme.textSecondary }}>Aktif</span>
              <strong style={{ color: '#F59E0B' }}>{stats?.shipments?.active || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: theme.bg, borderRadius: 8 }}>
              <span style={{ color: theme.textSecondary }}>Terkirim</span>
              <strong style={{ color: '#10B981' }}>{stats?.shipments?.delivered || 0}</strong>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Pending Shops */}
      {stats?.recent_pending_shops?.length > 0 && (
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
          <h4 style={{ margin: '0 0 20px 0', fontSize: 18, fontWeight: 700, color: theme.text }}>
            ⏰ Pengajuan Toko Terbaru (Menunggu Approval)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stats.recent_pending_shops.slice(0, 5).map((shop, idx) => (
              <div key={shop.ID || idx} style={{
                padding: '16px',
                backgroundColor: theme.bg,
                borderRadius: 12,
                border: `1px solid ${theme.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h5 style={{ margin: '0 0 4px 0', fontSize: 16, fontWeight: 600, color: theme.text }}>
                    {shop.shop_name}
                  </h5>
                  <p style={{ margin: 0, fontSize: 13, color: theme.textSecondary }}>
                    Diajukan: {new Date(shop.created_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <Link to="/admin/shop-approval">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#3B82F6',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 13
                    }}
                  >
                    Review
                  </motion.button>
                </Link>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default AdminDashboard;
