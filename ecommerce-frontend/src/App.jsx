import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Register from './pages/Register';
import SellerDashboard from './pages/SellerDashboard';
import Home from './pages/Home';
import Cart from './pages/Cart';
import ProductDetail from './pages/ProductDetail';
import OrderHistory from './pages/OrderHistory';
import ShopOrders from './pages/ShopOrders';
import Profile from './pages/Profile';
import TrackingPage from './pages/TrackingPage';
import ShipmentManagement from './pages/ShipmentManagement';
import WarehouseManagement from './pages/WarehouseManagement';
import DeliveryHubManagement from './pages/DeliveryHubManagement';
import AdminDashboard from './pages/AdminDashboard';
import AdminShopApproval from './pages/AdminShopApproval';
import AdminShopManagement from './pages/AdminShopManagement';
import AdminWarehouseManagement from './pages/AdminWarehouseManagement';
import AdminCourierManagement from './pages/AdminCourierManagement';
import SellerRegistration from './pages/SellerRegistration';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/home" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<SellerDashboard />} />
          <Route path="/home" element={<Home />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/shop-orders" element={<ShopOrders />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/tracking" element={<TrackingPage />} />
          <Route path="/shipment-management" element={<ShipmentManagement />} />
          <Route path="/warehouse-management" element={<WarehouseManagement />} />
          <Route path="/delivery-hub" element={<DeliveryHubManagement />} />
          
          {/* Seller Registration for Buyers */}
          <Route path="/seller-registration" element={<SellerRegistration />} />
          
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/shop-approval" element={<AdminShopApproval />} />
          <Route path="/admin/shop-management" element={<AdminShopManagement />} />
          <Route path="/admin/warehouse-management" element={<AdminWarehouseManagement />} />
          <Route path="/admin/courier-management" element={<AdminCourierManagement />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;