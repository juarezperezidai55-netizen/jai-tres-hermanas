import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { Trash2, Minus, Plus, ShieldCheck, Truck, ShoppingBag, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import { supabase } from '../../api/supabaseClient';
import './CartView.css';

const CartView = () => {
  const {
    cart,
    updateQuantity,
    removeFromCart,  
    cartTotal,
    toggleSelect,
    selectAll,
    formatPrice,
    currency,
    session,
    sucursalFilter
  } = useCart();
 
  const navigate = useNavigate();
  const [sucursalUsuarioId, setSucursalUsuarioId] = useState(1);
  const [esFueraDeZona, setEsFueraDeZona] = useState(false);

  // Solución al refresco: Leer de una variable persistente o del estado global de sucursales
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('jai_current_active_tab');
    return savedTab ? Number(savedTab) : (sucursalFilter || 1);
  });

  useEffect(() => {
    localStorage.setItem('jai_current_active_tab', activeTab);
  }, [activeTab]);



  // NUEVA ADAPTACIÓN DINÁMICA: Trae la ciudad del perfil del cliente en tiempo real para evitar contagios
  useEffect(() => {
    const obtenerUbicacionEstricta = async () => {
      if (session?.user?.id) {
        const { data } = await supabase.from('clientes').select('ciudad').eq('id', session.user.id).maybeSingle();
        if (data?.ciudad) {
          const c = data.ciudad.toLowerCase().trim();
          if (c.includes('tampico') || c.includes('madero')) {
            setSucursalUsuarioId(1);
            setEsFueraDeZona(false);
          } else if (c.includes('panuco') || c.includes('pánuco')) {
            setSucursalUsuarioId(2);
            setEsFueraDeZona(false);
          } else if (c.includes('higo')) {
            setSucursalUsuarioId(3);
            setEsFueraDeZona(false);
          } else {
            setEsFueraDeZona(true); // Requiere paquetería
          }
        }
      }
    };
    obtenerUbicacionEstricta();
  }, [session]);

  const sucursalesNombres = {
    1: 'Tampico',
    2: 'Pánuco',
    3: 'El Higo'
  };

  const handleCheckout = () => {
    if (!session) {
      alert("🌸 ¡Hola! Por favor, inicia sesión para completar tu pedido.");
      navigate('/login-cliente');
      return;
    }
    if (cart.some(item => item.selected)) {
      navigate('/checkout');
    } else {
      alert("Por favor, selecciona al menos un producto para continuar. ✨");
    }
  };

  const itemsPorSucursal = (idSuc) => {
    if (!cart) return [];
    return cart.filter(item => Number(item.sucursal_id) === Number(idSuc));
  };

  const ahorroTotal = cart
    .filter(i => i.selected)
    .reduce((acc, item) => {
      const base = item.precio_original || item.precio;
      if (base > item.precio) {
        return acc + ((base - item.precio) * item.quantity);
      }
      return acc;
    }, 0);

  return (
    <div className="cart-view-page">
      <Header />
      
      <div className="cart-top-nav">
        <div className="nav-left">
          <ShieldCheck size={20} color="#D4AF37" />
          <span>SECURE CHECKOUT</span>
        </div>
        <button className="continue-shopping-link" onClick={() => navigate('/')}>
          SEGUIR COMPRANDO &gt;&gt;
        </button>
      </div>

      <div className="cart-view-container animate-fade-in">
        <div className="cart-main-content">
          
          <div className="sucursal-tabs-container">
            {[1, 2, 3].map(idSuc => (
              <button
                key={idSuc}
                className={`sucursal-tab ${activeTab === idSuc ? 'active' : ''}`}
                onClick={() => setActiveTab(idSuc)}
              >
                Almacén {sucursalesNombres[idSuc]} ({itemsPorSucursal(idSuc).length})
              </button>
            ))}
          </div>

          <div className="cart-items-section">
            <div className="select-all-header">
              <input
                type="checkbox"
                checked={itemsPorSucursal(activeTab).length > 0 && itemsPorSucursal(activeTab).every(i => i.selected)}
                onChange={(e) => selectAll(e.target.checked, activeTab)}
                className="jai-checkbox"
              />
              <span>Seleccionar todo (Items {itemsPorSucursal(activeTab).length} total)</span>
            </div>

            {itemsPorSucursal(activeTab).length === 0 ? (
              <div className="empty-tab-notice" style={{ textAlign: 'center', padding: '60px' }}>
                <ShoppingBag size={48} color="#ddd" />
                <p>No hay productos en el almacén de {sucursalesNombres[activeTab]}. 🌸</p>
              </div>
            ) : (
              itemsPorSucursal(activeTab).map(item => {
                // REGLA DE NEGOCIO PERFECTA:
                const esDeOtraSucursal = Number(item.sucursal_id) !== Number(sucursalUsuarioId);
                const esRamoArtesanal = item.categoria_id === 10 || (item.sku && item.sku.toUpperCase().startsWith('RAM'));
                const precioBase = item.precio_original || item.precio;
                const tieneDescuento = precioBase > item.precio;

                return (
                  <div key={`${item.id}-${item.sucursal_id}`} className={`cart-item-pro-card ${!item.selected ? 'unselected' : ''}`}>
                    <div className="item-check">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => toggleSelect(item.id)}
                        className="jai-checkbox"
                      />
                    </div>
                    
                    <div className="item-image-wrapper">
                      <img src={item.imagen_url} alt={item.nombre} className="img-cart-aesthetic" />
                    </div>

                    <div className="item-info-pro">
                      <h4>{item.nombre}</h4>
                      <p className="item-variant-text">{item.nombre_variante || 'Estándar'}</p>
                      <p className="item-sku">SKU: {item.sku}</p>
                      
                      {esFueraDeZona ? (
                        <div className="delivery-warning" style={{ background: '#f0f4ff', color: '#2b6cb0', border: '1px solid #bee3f8' }}>
                          <img src="" alt="" style={{display: 'none'}} />
                          <Truck size={14} />
                          <span>Envío Nacional: Tu pedido irá empaquetado vía Paquetería 📦</span>
                        </div>
                      ) : esRamoArtesanal ? (
                        <div className="delivery-warning" style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fef3c7' }}>
                          <Clock size={14} />
                          <span>Producto Artesanal: Retardo de 3 a 5 días hábiles ✨</span>
                        </div>
                      ) : esDeOtraSucursal ? (
                        <div className="delivery-warning">
                          <Clock size={14} />
                          <span>Retardo por traslado: Se traerá desde la sucursal de {sucursalesNombres[item.sucursal_id]} ⏳</span>
                        </div>
                      ) : (
                        <div className="delivery-instant">
                          <Truck size={14} />
                          <span>⚡ Disponible para entrega inmediata</span>
                        </div>
                      )}
                    </div>

                    <div className="item-pricing-actions">
                      <div className="price-unit-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        {tieneDescuento && (
                          <span className="cart-old-price" style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.85rem' }}>
                            {currency === 'MXN' ? 'MX$' : '$'}{formatPrice(precioBase)}
                          </span>
                        )}
                        <div className="price-unit" style={{ color: tieneDescuento ? '#cf69d4' : 'inherit', fontWeight: tieneDescuento ? '700' : 'normal' }}>
                          {currency === 'MXN' ? 'MX$' : '$'}{formatPrice(item.precio)}
                        </div>
                      </div>
                      
                      <div className="qty-controls-pro">
                        <button onClick={() => updateQuantity(item.id, -1)}><Minus size={12}/></button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)}><Plus size={12}/></button>
                      </div>

                      <div className="item-total-price">
                        {currency === 'MXN' ? 'MX$' : '$'}{formatPrice(item.precio * item.quantity)}
                      </div>

                      <button className="remove-item" onClick={() => removeFromCart(item.id)}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <aside className="cart-summary-sidebar">
          <div className="summary-card-fixed">
            <h3>Resumen de Compra</h3>
            <div className="summary-body">
              <div className="summary-line">
                <span>Cantidad:</span>
                <span>{cart.filter(i => i.selected).length}</span>
              </div>
              
              {ahorroTotal > 0 && (
                <>
                  <div className="summary-line">
                    <span>Subtotal:</span>
                    <span>{currency === 'MXN' ? 'MX$' : '$'}{formatPrice(cartTotal + ahorroTotal)}</span>
                  </div>
                  <div className="summary-line" style={{ color: '#e74c3c', fontWeight: 'bold' }}>
                    <span>Descuento JAI:</span>
                    <span>-{currency === 'MXN' ? 'MX$' : '$'}{formatPrice(ahorroTotal)}</span>
                  </div>
                </>
              )}

              {ahorroTotal === 0 && (
                <div className="summary-line">
                  <span>Subtotal:</span>
                  <span>{currency === 'MXN' ? 'MX$' : '$'}{formatPrice(cartTotal)}</span>
                </div>
              )}
              
              <div className="total-main-line">
                <span>Total:</span>
                <span className="total-amount">{currency === 'MXN' ? 'MX$' : '$'}{formatPrice(cartTotal)}</span>
              </div>

              <button
                className="btn-checkout-pro"
                onClick={handleCheckout}
                disabled={cart.filter(i => i.selected).length === 0}
              >
                Terminar ahora ({cart.filter(i => i.selected).length})
              </button>
            </div>

            <div className="shipping-estimate-box">
              <h4>Envío estimado</h4>
              <p><Truck size={14} /> Se calculará en el siguiente paso según tu localidad regional.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CartView;