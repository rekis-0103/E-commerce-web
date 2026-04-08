import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import SellerDashboard from './pages/SellerDashboard'; // Import halamannya

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<SellerDashboard />} /> {/* Rute baru */}
      </Routes>
    </Router>
  );
}

export default App;