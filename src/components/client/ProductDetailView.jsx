import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../api/supabaseClient';
import { useCart } from '../../context/CartContext';
import { ArrowLeft, ShoppingCart, Info, Tag, Sparkles, Heart, Truck, MapPin, Clock } from 'lucide-react';
import Header from './Header';
import './ProductDetailView.css';

const ProductDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { 
    addToCart, 
    setIsCartOpen, 
    session, 
    searchQuery, 
    categoryFilter, 
    sucursalFilter, 
    currency, 
    formatPrice, 
    t 
  } = useCart();

  const [loading, setLoading] = useState(true);
  const [producto, setProducto] = useState(null);
  const [categoriaInfo, setCategoriaInfo] = useState(null); 
  const [variantes, setVariantes] = useState([]);
  const [cantidades, setCantidades] = useState({});
  const [recomendados, setRecomendados] = useState([]);
  const [promoActiva, setPromoActiva] = useState(null);
  const [esFavorito, setEsFavorito] = useState(false);
  const [imagenPrincipal, setImagenPrincipal] = useState(""); 
  const [ciudadCliente, setCiudadCliente] = useState(null);

  const initialSearch = useRef(searchQuery);
  const initialCat = useRef(categoryFilter);
  const initialSuc = useRef(sucursalFilter);

  // --- FUNCIÓN DE STOCK CORREGIDA PARA QUE CUADRE CON LA PRINCIPAL ---
  const getStockReal = (item) => {
    if (!item.inventario_sucursal) return 0;
    
    if (sucursalFilter) {
      // Si hay sucursal, buscamos solo esa
      const invSucursal = item.inventario_sucursal?.find(
        inv => inv.sucursal_id === sucursalFilter || inv.sucursales?.id === sucursalFilter
      );
      return invSucursal ? invSucursal.cantidad : 0;
    }
    // SI NO HAY SUCURSAL SELECCIONADA, SUMAMOS TODAS (Igual que en ProductCard)
    return item.inventario_sucursal.reduce((acc, inv) => acc + inv.cantidad, 0);
  };

  useEffect(() => {
    if (searchQuery !== initialSearch.current || categoryFilter !== initialCat.current || sucursalFilter !== initialSuc.current) {
      navigate('/');
    }
  }, [searchQuery, categoryFilter, sucursalFilter, navigate]);

  useEffect(() => {
    fetchProductoDetalle();
    checkSiEsFavorito();
    fetchCiudadCliente(); 
    window.scrollTo(0, 0);
  }, [id, session]);

  const fetchCiudadCliente = async () => {
    if (session?.user?.id) {
      const { data } = await supabase.from('clientes').select('ciudad').eq('id', session.user.id).single();
      if (data) setCiudadCliente(data.ciudad);
    }
  };

  const fetchProductoDetalle = async () => {
    setLoading(true);
    try {
      const { data: prodData, error: prodError } = await supabase
        .from('productos')
        .select('*, inventario_sucursal(cantidad, sucursal_id, sucursales(id, nombre))')
        .eq('id', id)
        .single();
      
      if (prodError) throw prodError;
      setProducto(prodData);
      setImagenPrincipal(prodData.imagen_url);

      if (prodData.categoria_id) {
        const { data: catData } = await supabase
          .from('categorias')
          .select('id, parent_id')
          .eq('id', prodData.categoria_id)
          .single();
        if (catData) setCategoriaInfo(catData);
      }

      const hoy = new Date();
      hoy.setHours(0,0,0,0);
      const { data: promoData } = await supabase
        .from('promociones')
        .select('*')
        .eq('activa', true)
        .or(`categoria_id.eq.${prodData.categoria_id},categoria_id.is.null`); 
      
      if (promoData?.length > 0) {
        const promosVigentes = promoData.filter(promo => {
          if (!promo.fecha_fin) return true;
          const fFin = new Date(promo.fecha_fin);
          fFin.setHours(23, 59, 59, 999);
          return hoy <= fFin;
        });
        if (promosVigentes.length > 0) {
          const promoFinal = promosVigentes.find(p => p.categoria_id === prodData.categoria_id) || promosVigentes[0];
          setPromoActiva(promoFinal);
        }
      }

      const { data: listaVariantes } = await supabase
        .from('producto_variantes')
        .select('*')
        .eq('producto_maestro_id', id);
      setVariantes(listaVariantes || []);
      
      const { data: dataRec } = await supabase
        .from('productos')
        .select('*')
        .eq('categoria_id', prodData.categoria_id)
        .neq('id', id)
        .limit(4);
      setRecomendados(dataRec || []);

      const initCant = {};
      if (listaVariantes && listaVariantes.length > 0) {
        listaVariantes.forEach(v => initCant[v.id] = 0);
      } else {
        initCant[id] = 0;
      }
      setCantidades(initCant);

    } catch (error) {
      console.error("Error en detalle:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderMensajeLogistica = () => {
    if (!producto) return null;
    const catId = producto.categoria_id ? parseInt(producto.categoria_id) : 0;
    const parentId = categoriaInfo?.parent_id ? parseInt(categoriaInfo.parent_id) : null;
    
    if (catId === 10 || parentId === 10) {
      return (
        <div className="logistics-badge-jai special-order">
          <Clock size={16} color="#d81b60" /> 
          <span><b>{currency === 'MXN' ? 'Producto Artesanal:' : 'Handmade Product:'}</b> {t('preOrder')} ✨</span>
        </div>
      );
    }

    if (!ciudadCliente) return <p className="logistics-info-jai">📍 {currency === 'MXN' ? 'Inicia sesión para ver tiempos de entrega.' : 'Login to see delivery times.'}</p>;

    const clienteNorm = ciudadCliente.trim().toLowerCase();
    const hayEnMiCiudad = producto.inventario_sucursal?.some(inv => 
      inv.sucursales?.nombre?.trim().toLowerCase() === clienteNorm && inv.cantidad > 0
    );

    if (hayEnMiCiudad) {
      return (
        <div className="logistics-badge-jai local">
          <Sparkles size={16} /> <span>{currency === 'MXN' ? `¡Disponible en ${ciudadCliente}! Entrega inmediata.` : `Available in ${ciudadCliente}! Instant delivery.`} 🌸</span>
        </div>
      );
    } else {
      const sucursalStock = producto.inventario_sucursal?.find(inv => inv.cantidad > 0)?.sucursales?.nombre || "sucursal";
      return (
        <div className="logistics-badge-jai regional">
          <Truck size={16} /> <span>{currency === 'MXN' ? `Envío desde ${sucursalStock} (2-3 días hábiles).` : `Shipping from ${sucursalStock} (2-3 business days).`} 🚚</span>
        </div>
      );
    }
  };

  const toggleFavorito = async () => {
    if (!session) return alert("🌸 Inicia sesión para guardar tus favoritos");
    try {
      if (esFavorito) {
        await supabase.from('favoritos').delete().eq('cliente_id', session.user.id).eq('producto_id', id);
        setEsFavorito(false);
      } else {
        await supabase.from('favoritos').insert([{ cliente_id: session.user.id, producto_id: id }]);
        setEsFavorito(true);
      }
    } catch (error) { console.error(error); }
  };

  const checkSiEsFavorito = async () => {
    if (!session) return;
    const { data } = await supabase.from('favoritos').select('*').eq('cliente_id', session.user.id).eq('producto_id', id).single();
    if (data) setEsFavorito(true);
  };

  const handleUpdateQty = (vId, delta, maxStock, imgVariante) => {
    if (imgVariante && delta > 0) setImagenPrincipal(imgVariante);
    setCantidades(prev => {
      const current = prev[vId] || 0;
      const next = current + delta;
      if (next < 0 || next > maxStock) return prev;
      return { ...prev, [vId]: next };
    });
  };

  const getPrecioFinal = (precioOriginal) => {
    if (!promoActiva) return precioOriginal;
    const descuento = (precioOriginal * promoActiva.descuento_porcentaje) / 100;
    return precioOriginal - descuento;
  };

  const agregarAlCarrito = () => {
    let huboCambio = false;
    if (variantes.length > 0) {
      variantes.forEach(v => {
        const qtySeleccionada = cantidades[v.id] || 0;
        if (qtySeleccionada > 0) {
          addToCart({
            id: v.id,
            nombre: `${producto.nombre} (${v.nombre_variante})`,
            precio: getPrecioFinal(v.precio || producto.precio),
            precio_original: v.precio || producto.precio, 
            imagen_url: v.imagen_variante_url || producto.imagen_url,
            quantity: qtySeleccionada,
            stock: v.stock, 
            es_variante: true
          });
          huboCambio = true;
        }
      });
    } else {
      const qtyUnica = cantidades[id] || 0;
      const stockFiltrado = getStockReal(producto);
      if (qtyUnica > 0) {
        addToCart({ 
          ...producto, 
          precio: getPrecioFinal(producto.precio), 
          precio_original: producto.precio, 
          quantity: qtyUnica,
          stock: stockFiltrado,
          es_variante: false
        });
        huboCambio = true;
      }
    }
    if (huboCambio) setIsCartOpen(true);
  };

  if (loading) return <div className="loader">Abriendo catálogo JAI... 🌸</div>;
  if (!producto) return <div className="error">Producto no encontrado</div>;

  const totalArticulos = Object.values(cantidades).reduce((acc, val) => acc + val, 0);
  const precioTotalAcumulado = variantes.length > 0 
    ? variantes.reduce((acc, v) => acc + (cantidades[v.id] || 0) * getPrecioFinal(v.precio || producto.precio), 0)
    : (cantidades[id] || 0) * getPrecioFinal(producto.precio);

  const stockParaProductoUnico = getStockReal(producto);

  return (
    <div className="product-detail-page">
      <Header /> 
      <div className="detail-view-container animate-fade">
        <header className="detail-header">
          <button className="back-btn-detail" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} /> {currency === 'MXN' ? 'Volver' : 'Back'}
          </button>
        </header>

        <div className="product-detail-grid">
          <div className="detail-image-section">
            <div className="main-img-wrapper">
              {promoActiva && <div className="detail-badge">{promoActiva.descuento_porcentaje}% OFF</div>}
              <img src={imagenPrincipal} alt={producto.nombre} className="main-detail-img" />
            </div>
            <div className="product-description-box">
              <h4><Info size={18}/> {currency === 'MXN' ? 'Descripción' : 'Description'}</h4>
              <p>{producto.descripcion || (currency === 'MXN' ? "Sin descripción." : "No description available.")}</p>
            </div>
          </div>

          <div className="detail-info-section">
            <h2 className="maestro-title">{producto.nombre}</h2>
            {renderMensajeLogistica()}
            <p className="product-sku"><Tag size={14}/> SKU: {producto.sku}</p>

            <div className="price-section-detail">
              {promoActiva && (
                <span className="old-price-detail" style={{ textDecoration: 'line-through', color: '#999', marginRight: '10px', fontSize: '18px' }}>
                  {currency === 'MXN' ? 'MX$ ' : '$ '}{formatPrice(producto.precio)}
                </span>
              )}
              <span className="new-price-detail" style={{ fontSize: '28px', fontWeight: 'bold', color: '#cf69d4' }}>
                {currency === 'MXN' ? 'MX$ ' : '$ '}{formatPrice(getPrecioFinal(producto.precio))}
              </span>
            </div>

            {variantes.length > 0 ? (
              <div className="variantes-list">
                {variantes.map(v => {
                  const pOriginal = v.precio || producto.precio;
                  const pFinal = getPrecioFinal(pOriginal);
                  return (
                    <div key={v.id} className="variante-row-nihao">
                      <img src={v.imagen_variante_url || producto.imagen_url} className="v-thumb" alt="v" />
                      <div className="v-details">
                        <strong>{v.nombre_variante}</strong>
                        <div className="v-pricing">
                          {promoActiva && (
                            <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '12px', marginRight: '5px' }}>
                              ${formatPrice(pOriginal)}
                            </span>
                          )}
                          <span style={{ color: '#cf69d4', fontWeight: 'bold' }}>${formatPrice(pFinal)}</span>
                        </div>
                        <small>{currency === 'MXN' ? 'Stock' : 'Inventory'}: {v.stock} pzs</small>
                      </div>
                      <div className="v-qty-selector">
                        <button onClick={() => handleUpdateQty(v.id, -1, v.stock, v.imagen_variante_url)}>-</button>
                        <span>{cantidades[v.id]}</span>
                        <button onClick={() => handleUpdateQty(v.id, 1, v.stock, v.imagen_variante_url)}>+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="v-qty-selector-container">
                {stockParaProductoUnico > 0 ? (
                  <>
                    <p style={{ fontSize: '14px', marginBottom: '8px', color: '#666' }}>
                      {currency === 'MXN' ? 'Disponibles' : 'Available'}: <b>{stockParaProductoUnico} pzs</b>
                    </p>
                    <div className="v-qty-selector large">
                      <button onClick={() => handleUpdateQty(id, -1, stockParaProductoUnico)}>-</button>
                      <span>{cantidades[id] || 0}</span>
                      <button 
                        onClick={() => handleUpdateQty(id, 1, stockParaProductoUnico)}
                        disabled={(cantidades[id] || 0) >= stockParaProductoUnico}
                      >+</button>
                    </div>
                  </>
                ) : (
                  <div className="out-of-stock-notice" style={{ padding: '15px', backgroundColor: '#fff5f7', borderRadius: '10px', border: '1px solid #ffa0b6', marginTop: '10px' }}>
                     <p style={{ color: '#d81b60', fontWeight: 'bold', margin: 0 }}>❌ {currency === 'MXN' ? 'Producto Agotado' : 'Out of Stock'}</p>
                     <p style={{ color: '#666', fontSize: '13px', margin: '5px 0 0 0' }}>
                       {currency === 'MXN' ? '¡Pero no te preocupes! Próximamente estará de nuevo disponible. ✨' : 'Don\'t worry! It will be back in stock soon. ✨'}
                     </p>
                  </div>
                )}
              </div>
            )}

            <div className="total-summary-row" style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
              <span>{currency === 'MXN' ? 'Total' : 'Total Summary'}: <strong>{totalArticulos}</strong> {currency === 'MXN' ? 'artículos' : 'items'}</span>
              <h3 style={{ margin: 0 }}>
                {currency === 'MXN' ? 'MX$ ' : '$ '}{formatPrice(precioTotalAcumulado)}
              </h3>
            </div>

            <div className="detail-actions-row" style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
              <button className="add-all-btn" style={{ flex: 1 }} onClick={agregarAlCarrito} disabled={totalArticulos === 0}>
                {t('addToCart')}
              </button>
              <button className={`heart-btn ${esFavorito ? 'active' : ''}`} onClick={toggleFavorito}>
                <Heart size={24} fill={esFavorito ? "#981ee9" : "none"} color="#981ee9" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div> 
  ); 
};

export default ProductDetailView;