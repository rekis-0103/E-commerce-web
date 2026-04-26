import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import SellerRegistration from './pages/auth/SellerRegistration';
import SellerDashboard from './pages/seller/SellerDashboard';
import ShopOrders from './pages/seller/ShopOrders';
import ShipmentManagement from './pages/seller/ShipmentManagement';
import WarehouseManagement from './pages/seller/WarehouseManagement';
import Home from './pages/user/Home';
import Cart from './pages/user/Cart';
import ProductDetail from './pages/user/ProductDetail';
import OrderHistory from './pages/user/OrderHistory';
import Profile from './pages/user/Profile';
import TrackingPage from './pages/user/TrackingPage';
import AkanePay from './pages/user/AkanePay';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUserManagement from './pages/admin/AdminUserManagement';
import AdminShopApproval from './pages/admin/AdminShopApproval';
import AdminShopManagement from './pages/admin/AdminShopManagement';
import AdminWarehouseManagement from './pages/admin/AdminWarehouseManagement';
import DeliveryHubManagement from './pages/admin/DeliveryHubManagement';

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
          <Route path="/akanepay" element={<AkanePay />} />
          
          {/* Seller Registration for Buyers */}
          <Route path="/seller-registration" element={<SellerRegistration />} />
          
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/user-management" element={<AdminUserManagement />} />
          <Route path="/admin/shop-approval" element={<AdminShopApproval />} />
          <Route path="/admin/shop-management" element={<AdminShopManagement />} />
          <Route path="/admin/warehouse-management" element={<AdminWarehouseManagement />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;