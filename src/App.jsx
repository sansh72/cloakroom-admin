import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import AdminLayout from './pages/AdminLayout';
import UsersPage from './pages/UsersPage';
import OrdersPage from './pages/OrdersPage';
import ProductsPage from './pages/ProductsPage';
import AllowedUsersPage from './pages/AllowedUsersPage';
import ReviewsPage from './pages/ReviewsPage';
import CustomizationPage from './pages/CustomizationPage';
import HeroImagesPage from './pages/HeroImagesPage';

function LoginRoute() {
  const { currentUser, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (currentUser && isAdmin) return <Navigate to="/" replace />;
  return <Login />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route element={<AdminLayout />}>
            <Route index element={<UsersPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="allowed-users" element={<AllowedUsersPage />} />
            <Route path="reviews" element={<ReviewsPage />} />
            <Route path="customization" element={<CustomizationPage />} />
            <Route path="hero-images" element={<HeroImagesPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
