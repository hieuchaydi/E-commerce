import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/common/Navbar';
import Home from './pages/products/Home';
import ProductList from './components/products/ProductList';
import ProductDetail from './pages/products/ProductDetail';
import Cart from './pages/cart/Cart';
import Checkout from './pages/cart/Checkout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import OrderHistory from './pages/orders/OrderHistory';
import OrderDetail from './pages/orders/OrderDetail';
import SellerDashboard from './pages/seller/SellerDashboard';
import ProductManagement from './pages/seller/ProductManagement';
import ProductForm from './pages/seller/ProductForm';
import SellerProfile from './pages/seller/SellerProfile';
import AdminDashboard from './pages/admin/AdminDashboard';
import Logout from './pages/auth/Logout';
import ResetPassword from './pages/auth/ResetPassword';
import ForgotPassword from './pages/auth/ForgotPassword';
import Profile from './pages/profile/Profile';
import SellerOrderManagement from './pages/seller/SellerOrderManagement';
import { useAuth } from './context/AuthContext';
import Messages from './pages/messages/Messages';
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    localStorage.setItem('redirectPath', window.location.pathname + window.location.search);
    return <Navigate to="/login" replace />;
  }
  return children;
};

const ProtectedSellerRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user || !['seller', 'admin'].includes(user.role)) {
    localStorage.setItem('redirectPath', window.location.pathname + window.location.search);
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/sellers/:sellerId" element={<SellerProfile />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
            <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
            <Route path="/seller" element={<ProtectedSellerRoute><SellerDashboard /></ProtectedSellerRoute>} />
            <Route path="/seller/products" element={<ProtectedSellerRoute><ProductManagement /></ProtectedSellerRoute>} />
            <Route path="/seller/products/new" element={<ProtectedSellerRoute><ProductForm /></ProtectedSellerRoute>} />
            <Route path="/seller/orders" element={<ProtectedSellerRoute><SellerOrderManagement /></ProtectedSellerRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/messages/:sellerId" element={<Messages />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;