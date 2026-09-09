import React, { useState, useEffect } from 'react';
import { ShoppingCart, Heart, Sparkles, MapPin } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../api/supabaseClient';
import './ProductCard.css';

const ProductCard = ({ producto, listaPromociones = [] }) => {
  // EXTRAEMOS sucursalFilter DEL CONTEXTO PARA QUE CUADRE EL STOCK
  const { session, currency, formatPrice, t, sucursalFilter } = useCart();
  const navigate = useNavigate();
  const [esFavorito, setEsFavorito] = useState(false);
  const [esNuevo, setEsNuevo] = useState(false);
  const [ciudadCliente, setCiudadCliente] = useState(null);

  useEffect(() => {
    if (producto.created_at) {
      const fechaC = new Date(producto.created_at);
      const hoy = new Date();
      const diffMs = hoy - fechaC;
      const diffDias = diffMs / (1000 * 60 * 60 * 24);
      if (diffDias >= 0 && diffDias <= 7) setEsNuevo(true);
    }
  }, [producto.created_at]);

  useEffect(() => {
    const fetchCiudad = async () => {
      if (session?.user?.id) {
        const { data } = await supabase.from('clientes').select('ciudad').eq('id', session.user.id).single();
        if (data) setCiudadCliente(data.ciudad);
      }
    };
    fetchCiudad();
  }, [session]);

  const promoActiva = listaPromociones.find(p => p.categoria_id === producto.categoria_id && p.activa);
  const precioDescuento = promoActiva 
    ? producto.precio * (1 - promoActiva.descuento_porcentaje / 100) 
    : null;

  // --- LÓGICA DE STOCK CORREGIDA ---
  // Si hay una sucursal seleccionada, filtramos solo esa. Si no (null), sumamos todas.
  const inventarioFiltrado = sucursalFilter 
    ? producto.inventario_sucursal?.filter(inv => inv.sucursal_id === sucursalFilter)
    : producto.inventario_sucursal;

  const stockTotal = inventarioFiltrado?.reduce((acc, inv) => acc + inv.cantidad, 0) || 0;
  
  // Las sucursales a mostrar también deben filtrarse si hay una seleccionada
  const sucursales = inventarioFiltrado?.map(inv => inv.sucursales?.nombre).filter(Boolean) || [];
  // --------------------------------

  useEffect(() => {
    if (session) {
      const checkSiEsFavorito = async () => {
        const { data } = await supabase.from('favoritos').select('*').eq('cliente_id', session.user.id).eq('producto_id', producto.id).single();
        if (data) setEsFavorito(true);
      };
      checkSiEsFavorito();
    }
  }, [producto.id, session]);

  const toggleFavorito = async (e) => {
    e.preventDefault(); 
    if (!session) return alert("🌸 Inicia sesión para guardar tus favoritos");
    try {
      if (esFavorito) {
        await supabase.from('favoritos').delete().eq('cliente_id', session.user.id).eq('producto_id', producto.id);
        setEsFavorito(false);
      } else {
        await supabase.from('favoritos').insert([{ cliente_id: session.user.id, producto_id: producto.id }]);
        setEsFavorito(true);
      }
    } catch (error) { console.error(error); }
  };

  return (
    <div className={`product-card ${stockTotal <= 0 ? 'out-of-stock' : ''}`}>
      <div className="product-image">
        <Link to={`/producto/${producto.id}`} className="product-link-wrapper">
          {promoActiva && <div className="promo-badge-jai">{promoActiva.descuento_porcentaje}% OFF 🌸</div>}
          <img src={producto.imagen_url || 'https://via.placeholder.com/200'} alt={producto.nombre} />
        </Link>
      </div>
      
      <div className="product-info">
        <Link to={`/producto/${producto.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3 className="product-name">
            {producto.nombre}
            {esNuevo && <span className="badge-nuevo-inline"><Sparkles size={10} /> {currency === 'MXN' ? 'NUEVO' : 'NEW'}</span>}
          </h3>
        </Link>
        <p className="product-sku">SKU: {producto.sku}</p>

        <div className="stock-display">
          {stockTotal > 0 ? (
            <span className="stock-count">
              {sucursalFilter ? (currency === 'MXN' ? 'En esta sucursal' : 'In this store') : (currency === 'MXN' ? 'Stock Total' : 'Total Stock')}: <strong>{stockTotal} pzs</strong>
            </span>
          ) : (
            <span className="stock-none">{currency === 'MXN' ? 'Agotado' : 'Out of Stock'}</span>
          )}
        </div>

        <div className="availability-wrapper" style={{ marginTop: 'auto', paddingTop: '10px' }}>
          <div className="location-chips">
            {parseInt(producto.categoria_id) === 10 ? (
              <span className="loc-chip special" style={{
                background: '#FCE4EC', 
                color: '#C2185B', 
                fontWeight: '700',
                width: '100%',
                display: 'block',
                textAlign: 'center',
                border: '1px solid #F8BBD0',
                fontSize: '11px'
              }}>
                🎀 {t('preOrder')}
              </span>
            ) : (
              sucursales.map((loc, index) => {
                const esLocal = ciudadCliente?.trim().toLowerCase() === loc?.trim().toLowerCase();
                return (
                  <span key={index} className={`loc-chip ${esLocal ? 'delivery' : 'store'}`} 
                    style={esLocal ? {
                      background: '#E3D5B8', 
                      color: '#5D4037', 
                      fontWeight: '700',
                      width: '100%',
                      display: 'block',
                      textAlign: 'center',
                      marginBottom: '5px',
                      border: '1px solid #D4C4A1'
                    } : { fontSize: '11px', opacity: 0.8 }}>
                     {esLocal 
                        ? `📍 ${currency === 'MXN' ? 'Entrega inmediata en' : 'Instant delivery in'} ${loc}` 
                        : `🏠 ${loc}`}
                  </span>
                );
              })
            )}
          </div> 
        </div>

        <div className="product-footer" style={{ borderTop: '1px solid #f1f1f1', paddingTop: '10px' }}>
          <div className="price-container">
            {precioDescuento ? (
              <>
                <span className="old-price">{currency === 'MXN' ? 'MX$' : '$'}{formatPrice(producto.precio)}</span>
                <span className="product-price">{currency === 'MXN' ? 'MX$' : '$'}{formatPrice(precioDescuento)}</span>
              </>
            ) : (
              <span className="product-price">{currency === 'MXN' ? 'MX$' : '$'}{formatPrice(producto.precio)}</span>
            )}
          </div>
          
          <div className="action-buttons-jai">
            <button className={`heart-btn-footer ${esFavorito ? 'active' : ''}`} onClick={toggleFavorito}>
              <Heart size={18} fill={esFavorito ? "#e91e63" : "none"} color="#e91e63" />
            </button>
            <button className="add-cart-btn-circular" onClick={() => navigate(`/producto/${producto.id}`)}>
              <ShoppingCart size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;