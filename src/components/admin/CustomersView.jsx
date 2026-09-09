import React, { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import { Search, User, Phone, Mail, MapPin, Calendar, ShoppingBag, X, Eye, Users } from 'lucide-react';
import './CustomersView.css';

const CustomersView = () => {
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Estados para el Modal de Historial
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*, ordenes(id)')
        .order('nombre', { ascending: true });

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error("Error cargando clientes:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = async (cliente) => {
    setSelectedCustomer(cliente);
    setLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from('ordenes')
        .select(`
          id,
          created_at,
          total,
          estado,
          detalles_orden (
            cantidad,
            precio_unitario,
            productos ( nombre )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomerOrders(data || []);
    } catch (error) {
      console.error("Error:", error.message);
    } finally {
      setLoadingOrders(false);
    }
  };

  const clientesFiltrados = clientes.filter(c => {
    const nombreCompleto = `${c.nombre} ${c.apellidos}`.toLowerCase();
    return nombreCompleto.includes(searchTerm.toLowerCase()) || 
           c.correo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           c.telefono?.includes(searchTerm);
  });

  return (
    <div className="customers-view-pro animate-fade">
      <div className="customers-header-pro">
        <div className="header-title-section">
          <Users size={28} color="#FFC5D3" />
          <div>
            <h2>Comunidad JAI 🌸</h2>
            <p>Directorio inteligente y fidelización de clientes</p>
          </div>
        </div>
        <div className="stats-badge-jai">
          <strong>{clientes.length}</strong> Clientes Activos
        </div>
      </div>
 
      <div className="customers-toolbar-pro">
        <div className="search-box-luxury">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, correo o teléfono..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loader-container-jai">
            <div className="loader-spinner"></div>
            <p>Sincronizando base de clientes...</p>
        </div>
      ) : (
        <div className="jai-table-wrapper">
          <table className="customers-table-luxury">
            <thead>
              <tr>
                <th>CLIENTE</th>
                <th>CONTACTO</th>
                <th>UBICACIÓN</th>
                <th>COMPRAS</th>
                <th>REGISTRO</th>
                <th className="text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="customer-main-cell">
                      <div className="customer-avatar-pro">{c.nombre.charAt(0)}</div>
                      <div className="customer-id-box">
                        <span className="customer-full-name">{c.nombre} {c.apellidos}</span>
                        <span className="customer-uuid"># {c.id.slice(0, 8)}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="customer-contact-cell">
                      <span className="contact-item"><Mail size={12}/> {c.correo}</span>
                      <span className="contact-item"><Phone size={12}/> {c.telefono || 'Sin teléfono'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="customer-location-cell">
                      <MapPin size={12} className="text-pink"/> 
                      {c.ciudad || 'N/A'}, {c.estado || 'N/A'}
                    </div>
                  </td>
                  <td>
                    <div className="customer-orders-badge">
                      <ShoppingBag size={14}/> 
                      <strong>{c.ordenes?.length || 0}</strong> pedidos
                    </div>
                  </td>
                  <td>
                    <div className="customer-date-cell">
                      <Calendar size={12}/> {new Date(c.fecha_registro).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="text-center">
                    <button className="btn-view-history" onClick={() => handleViewHistory(c)}>
                      <Eye size={16}/> Historial
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedCustomer && (
        <div className="jai-modal-overlay">
          <div className="jai-modal-container history-pro-modal animate-pop">
            <div className="jai-modal-header">
              <div className="header-info">
                  <ShoppingBag color="#FFC5D3" size={24} />
                  <div>
                      <h4>Historial de Compras</h4>
                      <p>{selectedCustomer.nombre} {selectedCustomer.apellidos}</p>
                  </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="close-x-btn"><X size={20}/></button>
            </div>
            
            <div className="jai-modal-body">
              {loadingOrders ? (
                <div className="modal-loader">
                    <div className="mini-spinner"></div>
                    <p>Consultando pedidos...</p>
                </div>
              ) : customerOrders.length > 0 ? (
                <>
                  <div className="orders-timeline-pro">
                    {customerOrders.map(order => (
                      <div key={order.id} className="luxury-history-card">
                        <div className="card-top-bar">
                          <span className="folio-tag">ORD-{order.id.toString().slice(-5).toUpperCase()}</span>
                          <span className={`status-tag ${order.estado?.toLowerCase()}`}>{order.estado}</span>
                        </div>
                        <div className="card-items-list">
                          {order.detalles_orden.map((det, idx) => (
                            <div key={idx} className="item-mini-row">
                              <span className="qty">{det.cantidad}x</span>
                              <span className="p-name">{det.productos?.nombre}</span>
                              <span className="p-price">${(det.cantidad * det.precio_unitario).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="card-bottom-bar">
                          <span className="order-date">{new Date(order.created_at).toLocaleDateString()}</span>
                          <div className="order-total-box">
                            Total: <strong>${order.total.toFixed(2)}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="modal-footer-pro">
                    <button onClick={() => setSelectedCustomer(null)} className="btn-close-pro">
                      Cerrar Historial
                    </button>
                  </div>
                </>
              ) : (
                <div className="empty-history-state">
                  <ShoppingBag size={48} color="#eee" />
                  <p>Este cliente aún no ha realizado compras.</p>
                  <button onClick={() => setSelectedCustomer(null)} className="btn-close-pro">Regresar</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersView;