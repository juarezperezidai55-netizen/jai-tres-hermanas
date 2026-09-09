import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './api/supabaseClient';

// --- IMPORTACIÓN DEL CONTEXTO ---
import { CartProvider, useCart } from './context/CartContext'; 

// --- IMPORTACIÓN DE VISTAS ---
import Header from './components/client/Header';
import MainSlider from './components/client/MainSlider';
import ProductGrid from './components/client/ProductGrid';
import AdminDashboard from './components/admin/AdminDashboard';
import Login from './components/admin/Login';
import AuthCustomer from './components/auth/AuthCustomer';
import CheckoutView from './components/client/CheckoutView';
import ProductDetailView from './components/client/ProductDetailView'; 
import FavoritesView from './components/client/FavoritesView';
import UserProfile from './components/client/UserProfile'; 
import CartView from './components/client/CartView'; 
import Footer from './components/client/Footer'; 
import SuccessView from './components/client/SuccessView'; 

const AppContent = ({ session, userRole, loadingRole }) => {
  const { searchQuery, categoryFilter, sucursalFilter } = useCart(); 

  // Control estricto de los 3 puestos oficiales permitidos para entrar al Panel
  const rolesPermitidos = ['administrador', 'gerente', 'vendedor'];

  if (loadingRole) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <h2 style={{ color: '#cf69d4' }}>🌸 Verificando credenciales en JAI...</h2>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={
        <div className="App">
          <Header />
          {!searchQuery && !categoryFilter && !sucursalFilter && <MainSlider />}
          <main style={{ minHeight: '60vh' }}>
            <ProductGrid />
          </main>
          <Footer /> 
        </div>
      } />

      <Route path="/checkout" element={<CheckoutView />} />
      <Route path="/pedido-exitoso" element={<SuccessView />} /> 
      <Route path="/carrito" element={<CartView />} /> 
      <Route path="/producto/:id" element={<ProductDetailView />} /> 

      <Route 
        path="/login-cliente" 
        element={session ? <Navigate to="/" /> : <AuthCustomer onLoginSuccess={() => window.location.href = '/'} />} 
      />

      <Route 
        path="/mi-perfil" 
        element={session ? <UserProfile /> : <Navigate to="/login-cliente" />} 
      />

      {/* --- CONTROL DE LOGIN ADMNISTRATIVO CON FILTRADO DE PUESTO --- */}
      <Route 
        path="/jai-admin-login" 
        element={session && rolesPermitidos.includes(userRole) ? <Navigate to="/jai-dashboard" /> : <Login onLoginSuccess={() => window.location.href = '/jai-dashboard'} />} 
      />
      
      <Route 
        path="/jai-dashboard" 
        element={
          session && rolesPermitidos.includes(userRole) ? (
            <AdminDashboard onBack={() => {
              supabase.auth.signOut().then(() => { window.location.href = '/jai-admin-login'; });
            }} userRole={userRole} />
          ) : (
            <Navigate to="/jai-admin-login" />
          )
        } 
      />
      
      <Route path="/mis-favoritos" element={<FavoritesView />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true);

  const fetchUserRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('id', userId)
        .single();

      if (error || !data) {
        setUserRole(null);
      } else {
        setUserRole(data.rol?.toLowerCase());
      }
    } catch (err) {
      console.error("Error consultando rol:", err);
      setUserRole(null);
    } finally {
      setLoadingRole(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setLoadingRole(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setLoadingRole(true);
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
        setLoadingRole(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <CartProvider>
      <Router>
        <AppContent session={session} userRole={userRole} loadingRole={loadingRole} />
      </Router>
    </CartProvider>
  );
}

export default App;