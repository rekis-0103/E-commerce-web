import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register'; // 1. Import halamannya
import SellerDashboard from './pages/SellerDashboard';
import Home from './pages/Home';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/home" />} /> {/* Ubah default ke home saja agar lebih natural */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} /> {/* 2. Tambahkan rutenya */}
        <Route path="/dashboard" element={<SellerDashboard />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;