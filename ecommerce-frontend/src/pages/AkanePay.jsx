import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme, DarkModeToggle } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaWallet, FaPlus, FaArrowUp, FaHistory, FaShieldAlt, FaArrowLeft, FaCheckCircle, FaTimes } from 'react-icons/fa';

const API = 'http://localhost:3000/api';

function AkanePay() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchWalletData();
  }, [token]);

  const fetchWalletData = async () => {
    try {
      const res = await axios.get(`${API}/user/wallet`, { headers });
      setWallet(res.data.wallet);
      setTransactions(res.data.transactions || []);
      if (!res.data.wallet.is_active) setShowPinModal(true);
    } catch (err) {
      console.error("Gagal mengambil data wallet", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupPin = async (e) => {
    e.preventDefault();
    if (pin.length !== 6) { alert("PIN harus 6 digit"); return; }
    setIsSubmitting(true);
    try {
      await axios.post(`${API}/user/wallet/setup-pin`, { pin }, { headers });
      alert("✅ Akane Pay berhasil diaktifkan!");
      setShowPinModal(false);
      fetchWalletData();
    } catch (err) { alert(err.response?.data?.message || "Gagal setup PIN"); }
    finally { setIsSubmitting(false); }
  };

  const handleTopUp = async (e) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (val < 10000) { alert("Minimal Top Up Rp 10.000"); return; }
    setIsSubmitting(true);
    try {
      await axios.post(`${API}/user/wallet/topup`, { amount: val }, { headers });
      alert("✅ Saldo berhasil ditambahkan!");
      setShowTopUpModal(false);
      setAmount('');
      fetchWalletData();
    } catch (err) { alert("Gagal Top Up"); }
    finally { setIsSubmitting(false); }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (val < 50000) { alert("Minimal Penarikan Rp 50.000"); return; }
    setIsSubmitting(true);
    try {
      await axios.post(`${API}/user/wallet/withdraw`, { amount: val, pin }, { headers });
      alert("✅ Permintaan penarikan berhasil!");
      setShowWithdrawModal(false);
      setAmount(''); setPin('');
      fetchWalletData();
    } catch (err) { alert(err.response?.data?.message || "Gagal Penarikan"); }
    finally { setIsSubmitting(false); }
  };

  if (isLoading) return <div style={{ background: theme.bg, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><h2 style={{color: theme.text}}>Memuat Akane Pay...</h2></div>;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: theme.bg, minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: theme.primary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
            <FaArrowLeft /> Kembali
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
             <FaShieldAlt style={{ color: '#10B981' }} />
             <span style={{ color: theme.textSecondary, fontSize: 13, fontWeight: 600 }}>Secure Payment</span>
          </div>
        </div>

        {/* Wallet Card */}
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)', borderRadius: 24, padding: 32, color: 'white', boxShadow: '0 20px 40px rgba(99, 102, 241, 0.3)', marginBottom: 32, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
              <div>
                <p style={{ opacity: 0.8, fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Total Saldo Akane Pay</p>
                <h1 style={{ fontSize: 36, fontWeight: 800, margin: 0 }}>Rp {wallet?.balance.toLocaleString('id-ID')}</h1>
              </div>
              <FaWallet style={{ fontSize: 40, opacity: 0.5 }} />
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowTopUpModal(true)} style={{ flex: 1, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', padding: '12px', borderRadius: 12, color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <FaPlus /> Top Up
              </button>
              {role === 'seller' && (
                <button onClick={() => setShowWithdrawModal(true)} style={{ flex: 1, background: 'white', border: 'none', padding: '12px', borderRadius: 12, color: '#6366F1', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <FaArrowUp /> Tarik Dana
                </button>
              )}
            </div>
          </div>
          {/* Decorative Circles */}
          <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        </motion.div>

        {/* History */}
        <div style={{ background: theme.cardBg, borderRadius: 24, padding: 24, boxShadow: theme.shadow, border: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <FaHistory style={{ color: theme.textSecondary }} />
            <h3 style={{ color: theme.text, margin: 0 }}>Riwayat Transaksi</h3>
          </div>

          {transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: theme.textSecondary }}>Belum ada transaksi</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {transactions.map((t) => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: `1px solid ${theme.border}` }}>
                  <div>
                    <div style={{ fontWeight: 700, color: theme.text, fontSize: 14 }}>{t.description}</div>
                    <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>{new Date(t.created_at).toLocaleString('id-ID')}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: t.type === 'topup' || t.type === 'income' ? '#10B981' : '#EF4444' }}>
                      {t.type === 'topup' || t.type === 'income' ? '+' : '-'} Rp {t.amount.toLocaleString('id-ID')}
                    </div>
                    {t.fee > 0 && <div style={{ fontSize: 10, color: theme.textSecondary }}>Biaya: Rp {t.fee.toLocaleString('id-ID')}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal PIN Setup */}
      {showPinModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: 20 }}>
          <motion.div initial={{ y: 50 }} animate={{ y: 0 }} style={{ background: theme.cardBg, padding: 32, borderRadius: 24, width: '100%', maxWidth: 400, textAlign: 'center' }}>
            <FaShieldAlt style={{ fontSize: 48, color: '#6366F1', marginBottom: 16 }} />
            <h2 style={{ color: theme.text, margin: '0 0 8px 0' }}>Aktifkan Akane Pay</h2>
            <p style={{ color: theme.textSecondary, marginBottom: 24 }}>Buat 6 digit PIN keamanan untuk bertransaksi.</p>
            <form onSubmit={handleSetupPin}>
              <input type="password" maxLength="6" value={pin} onChange={e => setPin(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Masukkan 6 Digit PIN" style={{ width: '100%', padding: 16, borderRadius: 12, border: `2px solid ${theme.border}`, background: theme.inputBg, color: theme.text, textAlign: 'center', fontSize: 24, letterSpacing: 8, marginBottom: 24, outline: 'none' }} required />
              <button type="submit" disabled={isSubmitting} style={{ width: '100%', padding: 16, background: theme.gradient, color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>{isSubmitting ? "Memproses..." : "Aktifkan Sekarang"}</button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal Top Up */}
      {showTopUpModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: 20 }}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ background: theme.cardBg, padding: 32, borderRadius: 24, width: '100%', maxWidth: 400 }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <h3 style={{ color: theme.text, margin: 0 }}>Top Up Saldo</h3>
                <button onClick={() => setShowTopUpModal(false)} style={{ background: 'none', border: 'none', color: theme.textSecondary }}><FaTimes /></button>
             </div>
             <p style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 16 }}>💰 Pajak admin Rp 1.500 akan ditambahkan otomatis.</p>
             <form onSubmit={handleTopUp}>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Nominal (Min. 10.000)" style={{ width: '100%', padding: 14, borderRadius: 12, border: `2px solid ${theme.border}`, background: theme.inputBg, color: theme.text, marginBottom: 24, fontSize: 16 }} required />
                <button type="submit" disabled={isSubmitting} style={{ width: '100%', padding: 16, background: '#10B981', color: 'white', border: 'none', borderRadius: 12, fontWeight: 700 }}>{isSubmitting ? "Memproses..." : "Konfirmasi Pembayaran"}</button>
             </form>
          </motion.div>
        </div>
      )}

      {/* Modal Withdraw */}
      {showWithdrawModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: 20 }}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ background: theme.cardBg, padding: 32, borderRadius: 24, width: '100%', maxWidth: 400 }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <h3 style={{ color: theme.text, margin: 0 }}>Tarik Dana</h3>
                <button onClick={() => setShowWithdrawModal(false)} style={{ background: 'none', border: 'none', color: theme.textSecondary }}><FaTimes /></button>
             </div>
             <p style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 16 }}>🏦 Biaya penarikan Rp 5.000 akan dipotong dari saldo.</p>
             <form onSubmit={handleWithdraw}>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Nominal (Min. 50.000)" style={{ width: '100%', padding: 14, borderRadius: 12, border: `2px solid ${theme.border}`, background: theme.inputBg, color: theme.text, marginBottom: 16 }} required />
                <input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="PIN 6 Digit" style={{ width: '100%', padding: 14, borderRadius: 12, border: `2px solid ${theme.border}`, background: theme.inputBg, color: theme.text, marginBottom: 24, textAlign: 'center', letterSpacing: 4 }} required />
                <button type="submit" disabled={isSubmitting} style={{ width: '100%', padding: 16, background: '#6366F1', color: 'white', border: 'none', borderRadius: 12, fontWeight: 700 }}>{isSubmitting ? "Memproses..." : "Tarik Sekarang"}</button>
             </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}

export default AkanePay;
