import React, { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import { useCart } from '../../context/CartContext';
import ProductCard from './ProductCard';
import Header from './Header';
import { HeartOff, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ProductDetailView.css'; // Reutilizamos estilos de grid

const FavoritesView = () => {
  const [favs, setFavs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { session } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) fetchFavorites();
  }, [session]);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('favoritos')
        .select(`
          producto_id,
          productos (
            *,
            inventario_sucursal ( cantidad, sucursales ( nombre ) )
          )
        `)
        .eq('cliente_id', session.user.id);

      if (error) throw error;
      // Extraemos solo los objetos de producto
      const productosFav = data.map(f => f.productos).filter(p => p !== null);
      setFavs(productosFav);
    } catch (error) {
      console.error("Error cargando favoritos:", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!session) return (
    <div style={{ textAlign: 'center', padding: '100px' }}>
      <Header />
      <p>🌸 Por favor inicia sesión para ver tus favoritos.</p>
      <button onClick={() => navigate('/login-cliente')} className="add-all-btn" style={{ width: '200px', margin: '20px auto' }}>Iniciar Sesión</button>
    </div>
  );

  return (
    <div className="product-detail-page">
      <Header />
      <div className="detail-view-container animate-fade">
        <header className="detail-header">
           <button className="back-btn-detail" onClick={() => navigate(-1)}>
             <ArrowLeft size={18} /> Volver a la tienda
           </button>
           <h2 style={{ marginTop: '10px' }}>Mis Favoritos JAI ♥</h2>
        </header>

        {loading ? (
          <p className="loader">Buscando tus favoritos... 🌸</p>
        ) : (
          <div className="product-grid" style={{ marginTop: '20px' }}>
            {favs.length > 0 ? (
              favs.map(p => (
                <ProductCard key={p.id} producto={p} />
              ))
            ) : (
              <div style={{ textAlign: 'center', gridColumn: '1/-1', padding: '100px' }}>
                <HeartOff size={60} color="#ddd" />
                <p style={{ color: '#888', marginTop: '15px' }}>Aún no tienes productos guardados.</p>
                <button onClick={() => navigate('/')} className="add-all-btn" style={{ width: '250px', margin: '20px auto' }}>Ir a explorar 🌸</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesView;