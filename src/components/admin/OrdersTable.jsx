import React, { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import {
  Search, X, Eye, Phone, ShoppingBag, Tag, Calendar, Truck, MapPin, MessageCircle, CreditCard, Banknote, Package, ChevronRight, Gift, CheckCircle
} from 'lucide-react';
import './OrdersTable.css';

const OrdersTable = () => {
  const [loading, setLoading] = useState(false);
  const [ordenes, setOrdenes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);
  const [listaClientes, setListaClientes] = useState([]);
  const [listaSucursales, setListaSucursales] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: ords } = await supabase.from('ordenes').select('*').is('cierre_id', null).order('created_at', { ascending: false });
      const { data: clis } = await supabase.from('clientes').select('*');
      const { data: sucs } = await supabase.from('sucursales').select('*');

      setListaClientes(clis || []);
      setListaSucursales(sucs || []);
      setOrdenes(ords || []);
    } catch (error) {
      console.error("Error cargando datos:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const getClienteFullInfo = (id) => {
    const cliente = listaClientes.find(c => c.id === id);
    if (!cliente) return { nombre: 'Invitado', telefono: '' };
    return {
      nombre: `${cliente.nombre} ${cliente.apellidos}`,
      telefono: cliente.telefono
    };
  };

  const getEntregaDetalle = (id, tipo) => {
    const sucursal = listaSucursales.find(s => String(s.id) === String(id));
    const nombreSuc = sucursal ? sucursal.nombre : "Matriz";
    
    if (tipo === 'Envío' || tipo === 'Domicilio' || tipo === 'envio') {
      return { texto: `🚚 Domicilio (${nombreSuc})`, clase: 'domicilio' };
    } else if (tipo === 'paqueteria' || tipo === 'Paquetería') {
      return { texto: `📦 Paquetería Nal.`, clase: 'paqueteria' };
    } else {
      return { texto: `🏠 Recoge en ${nombreSuc}`, clase: 'recogida' };
    }
  };

  // --- SOLUCIÓN MAESTRA: UNE LOS DATOS MANUALMENTE (A PRUEBA DE FALLOS) ---
  const handleViewDetails = async (orden) => {
    setSelectedOrder(orden);
    setOrderDetails([]); // Limpiamos el modal

    try {
      // Paso 1: Traemos los detalles de la orden (donde están producto_id y variante_id)
      const { data: detalles, error: errDetalles } = await supabase
        .from('detalles_orden')
        .select('*')
        .eq('orden_id', orden.id);

      if (errDetalles) throw errDetalles;

      if (detalles && detalles.length > 0) {
        // Paso 2: Traemos la lista de productos y variantes para cruzar la info
        const { data: prods } = await supabase.from('productos').select('id, nombre');
        const { data: vars } = await supabase.from('producto_variantes').select('id, nombre_variante');

        // Paso 3: Mapeamos los detalles y buscamos el nombre en las listas
        const detallesProcesados = detalles.map(d => {
          // Buscamos primero en variantes (si d.variante_id tiene dato)
          const varianteFound = vars?.find(v => v.id === d.variante_id);
          // Buscamos en productos base
          const productoFound = prods?.find(p => p.id === d.producto_id);

          return {
            ...d,
            // Guardamos el nombre final en esta variable
            nombre_final: varianteFound?.nombre_variante || productoFound?.nombre || 'Producto no identificado'
          };
        });

        setOrderDetails(detallesProcesados);
      }
    } catch (error) {
      console.error("Error crítico cargando artículos:", error.message);
    }
  };

  const enviarWhatsApp = (orden, cliente) => {
    if (!cliente.telefono) {
      alert("Este cliente no tiene un teléfono registrado.");
      return;
    }
    const numeroLimpio = cliente.telefono.replace(/\D/g, '');
    const folio = orden.id.toString().slice(-5).toUpperCase();
    const mensaje = `Hola ${cliente.nombre}, te contactamos de JAI Tres Hermanas sobre tu pedido #${folio}. El estado de tu pedido es: ${orden.estado}.`;
    const url = `https://wa.me/52${numeroLimpio}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  const enviarWhatsAppMarketing = (cliente) => {
    if (!cliente.telefono) {
      alert("Este cliente no tiene un teléfono registrado.");
      return;
    }
    const numeroLimpio = cliente.telefono.replace(/\D/g, '');
    const mensaje = `¡Hola ${cliente.nombre}! ✨ Tenemos nuevas promociones en JAI Tres Hermanas que te encantarán. ¡Visítanos pronto y aprovecha nuestras ofertas! 🌸`;
    const url = `https://wa.me/52${numeroLimpio}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  // --- NUEVA FUNCIÓN: Enviar mensaje de WhatsApp confirmando la dirección de entrega ---
  const enviarConfirmacionDireccionWA = (orden, cliente) => {
    if (!cliente.telefono) {
      alert("Este cliente no tiene un teléfono registrado.");
      return;
    }
    const numeroLimpio = cliente.telefono.replace(/\D/g, '');
    const folio = orden.id.toString().slice(-5).toUpperCase();
    
    let mensaje = `¡Hola ${cliente.nombre}! 🌸 Te contactamos de JAI Tres Hermanas para confirmar los detalles de entrega de tu pedido #${folio}.\n\n`;
    mensaje += `📍 *Dirección registrada:* ${orden.direccion_completa || 'No especificada'}\n`;
    if (orden.codigo_postal) mensaje += `📮 *Código Postal:* ${orden.codigo_postal}\n`;
    if (orden.notas_envio) mensaje += `📝 *Instrucciones especiales:* ${orden.notas_envio}\n\n`;
    mensaje += `Por favor, confírmanos si estos datos son correctos para proceder con tu envío. ¡Muchas gracias! ✨`;

    const url = `https://wa.me/52${numeroLimpio}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  const handleStatusChange = async (id, nuevoEstado) => {
    const { error } = await supabase.from('ordenes').update({ estado: nuevoEstado }).eq('id', id);
    if (!error) {
      fetchData();
      if(selectedOrder) setSelectedOrder({...selectedOrder, estado: nuevoEstado});
    }
  };

  const agruparPorFecha = (lista) => {
    return lista.reduce((acc, orden) => {
      const fecha = new Date(orden.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
      if (!acc[fecha]) acc[fecha] = [];
      acc[fecha].push(orden);
      return acc;
    }, {});
  };

  const ordenesFiltradas = ordenes.filter(o => {
    const info = getClienteFullInfo(o.cliente_id);
    return info.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
           o.id.toString().includes(searchTerm);
  });

  const grupos = agruparPorFecha(ordenesFiltradas);

  return (
    <div className="orders-container-pro">
      <div className="orders-header-pro">
        <div className="title-section">
          <h2>Gestión de Pedidos JAI 🌸</h2>
          <p>Control de entregas, estados y finanzas</p>
        </div>
        <div className="search-box-jai">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por folio o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="orders-timeline">
        {Object.keys(grupos).map(fecha => (
          <div key={fecha} className="date-group">
            <h4 className="date-title"><Calendar size={16}/> {fecha}</h4>
            <div className="table-card-jai">
              <table className="jai-table-pro">
                <thead>
                  <tr>
                    <th>Folio</th>
                    <th>Cliente / Contacto</th>
                    <th>Entrega</th>
                    <th>Pago</th>
                    <th>Total</th>
                    <th>Desc.</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {grupos[fecha].map(o => {
                    const cliente = getClienteFullInfo(o.cliente_id);
                    const entrega = getEntregaDetalle(o.sucursal_id, o.tipo_entrega);
                    return (
                      <tr key={o.id}>
                        <td className="folio-txt">#{o.id.toString().slice(-5).toUpperCase()}</td>
                        <td>
                          <div className="client-info-cell">
                            <span className="client-name">{cliente.nombre}</span>
                            <span className="client-phone"><Phone size={12}/> {cliente.telefono}</span>
                          </div>
                        </td>
                        <td><span className={`delivery-tag ${entrega.clase}`}>{entrega.texto}</span></td>
                        <td>
                          <div className="payment-info-cell">
                            {o.metodo_pago === 'transferencia' || o.metodo_pago === 'oxxo' ?
                              <CreditCard size={16} className="card-icon" /> :
                              <Banknote size={16} className="cash-icon" />
                            }
                            <span className="pay-method-txt">{o.metodo_pago}</span>
                          </div>
                        </td>
                        <td className="price-txt">${o.total}</td>
                        <td className="discount-txt">-${o.descuento_applied || 0}</td>
                        <td><span className={`status-pill-pro ${o.estado?.toLowerCase()}`}>{o.estado}</span></td>
                        <td>
                          <button className="view-btn-jai" onClick={() => handleViewDetails(o)}>
                            Ver <ChevronRight size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {selectedOrder && (
        <div className="modal-jai-overlay">
          <div className="modal-jai-content">
            <div className="modal-jai-header">
              <div className="header-folio">
                <Package color="#cf69d4" size={32} />
                <div>
                    <h3>Pedido #{selectedOrder.id.toString().slice(-5).toUpperCase()}</h3>
                    <span className="modal-subtitle">📅 {new Date(selectedOrder.created_at).toLocaleString()}</span>
                </div>
              </div>
              <button className="close-modal-btn" onClick={() => setSelectedOrder(null)}><X /></button>
            </div>
            
            <div className="modal-jai-body">
              <div className="info-section-grid">
                <div className="info-block card-style">
                  <label>Información del Cliente</label>
                  <div className="client-data">
                    <p><strong>{getClienteFullInfo(selectedOrder.cliente_id).nombre}</strong></p>
                    <p className="phone-txt">{getClienteFullInfo(selectedOrder.cliente_id).telefono}</p>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                    <button 
                      className="wa-btn-jai" 
                      onClick={() => enviarWhatsApp(selectedOrder, getClienteFullInfo(selectedOrder.cliente_id))}
                    >
                      <MessageCircle size={18} /> Estado Pedido (Gestión)
                    </button>
                    <button 
                      className="wa-btn-jai promo" 
                      style={{ backgroundColor: '#cf69d4' }}
                      onClick={() => enviarWhatsAppMarketing(getClienteFullInfo(selectedOrder.cliente_id))}
                    >
                      <Gift size={18} /> Enviar Promo / Ofertas
                    </button>
                  </div>
                </div>

                <div className="info-block card-style">
                  <label>Estado y Logística</label>
                  <div className="status-selector-jai">
                    <select value={selectedOrder.estado} onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}>
                      <option value="Pendiente">⏳ Pendiente</option>
                      <option value="Pagado">✅ Pagado</option>
                      <option value="Enviado">🚚 Enviado</option>
                      <option value="Cancelado">❌ Cancelado</option>
                    </select>
                  </div>
                  <div className="mini-tags" style={{ marginBottom: '12px' }}>
                    <span>💳 {selectedOrder.metodo_pago?.toUpperCase()}</span>
                    <span>📍 {selectedOrder.tipo_entrega?.toUpperCase()}</span>
                  </div>
 
                  {/* --- NUEVA SECCIÓN DINÁMICA: Muestra la dirección guardada en la base de datos --- */}
                  {(selectedOrder.tipo_entrega === 'envio' || selectedOrder.tipo_entrega === 'paqueteria' || selectedOrder.tipo_entrega === 'Envío') && (
                    <div className="address-delivery-info-box animate-in" style={{ padding: '12px', background: '#fff9fe', border: '1px dashed #cf69d4', borderRadius: '8px', marginTop: '10px' }}>
                      <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#475569' }}>
                        <MapPin size={14} style={{ inlineSize: '14px', verticalAlign: 'middle', marginRight: '4px', color: '#cf69d4' }} /> 
                        <strong>Dirección de Envío:</strong>
                      </p>
                      <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#1e293b', fontWeight: '500' }}>{selectedOrder.direccion_completa}</p>
                      {selectedOrder.codigo_postal && (
                        <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#64748b' }}><strong>C.P.:</strong> {selectedOrder.codigo_postal}</p>
                      )}
                      {selectedOrder.notas_envio && (
                        <p style={{ margin: '6px 0 0 0', paddingGlobal: '6px 0 0 0', borderTop: '1px solid #f1f5f9', fontSize: '12px', color: '#db2777', fontStyle: 'italic' }}>
                          <strong>Notas:</strong> "{selectedOrder.notas_envio}"
                        </p>
                      )}
                      
                      {/* Botón de validación directa por WhatsApp */}
                      <button 
                        className="wa-btn-jai direction-confirm-btn"
                        style={{ marginTop: '10px', width: '100%', background: '#25D366', color: '#fff', fontSize: '12px', padding: '6px', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontWeight: '600' }}
                        onClick={() => enviarConfirmacionDireccionWA(selectedOrder, getClienteFullInfo(selectedOrder.cliente_id))}
                      >
                        <CheckCircle size={14} /> Confirmar Dirección por Chat
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* LISTA DE ARTÍCULOS ACTUALIZADA */}
              <div className="products-list-pro">
                <h4 className="section-title-modal"><ShoppingBag size={18}/> Artículos en el Pedido</h4>
                <div className="items-container-luxury">
                  {orderDetails.length > 0 ? orderDetails.map(d => (
                    <div key={d.id} className="item-luxury-row">
                      <div className="item-main-info">
                        <span className="luxury-qty">{d.cantidad}</span>
                        <div className="name-box">
                            <span className="luxury-name">{d.nombre_final}</span>
                            <span className="luxury-sku">Ref ID: {d.producto_id || 'Var'}</span>
                        </div>
                      </div>
                      <span className="luxury-price">${(d.cantidad * d.precio_unitario).toFixed(2)}</span>
                    </div>
                  )) : (
                    <div className="no-items-box">
                      <p style={{ padding: '20px', textAlign: 'center', color: '#b2bec3' }}>
                        Cargando detalles del pedido...
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="totals-luxury-card">
                 <div className="total-row">
                    <span>Subtotal</span>
                    <span>${(selectedOrder.total + (selectedOrder.descuento_applied || 0)).toFixed(2)}</span>
                 </div>
                 <div className="total-row discount">
                    <span>Descuento aplicado</span>
                    <span>-${selectedOrder.descuento_applied || 0}</span>
                 </div>
                 <div className="total-row final">
                    <span>Total a Pagar</span>
                    <span className="grand-total-txt">${selectedOrder.total.toFixed(2)}</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersTable;