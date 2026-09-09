import React, { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import { useCart } from '../../context/CartContext';
import { 
  User, Package, MapPin, LogOut, Settings, 
  ChevronRight, Calendar, CreditCard, ShoppingBag, 
  Clock, Truck, CheckCircle, MessageSquare, Heart, FileText, Send
} from 'lucide-react';
import './UserProfile.css';

const UserProfile = () => {
  const { session } = useCart();
  const [activeTab, setActiveTab] = useState('panel'); 
  const [userData, setUserData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [userMessages, setUserMessages] = useState([]); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchUserData();
      fetchUserOrders();
      fetchUserMessages(); 
    }
  }, [session]);

  const fetchUserData = async () => {
    try {
      const { data } = await supabase.from('clientes').select('*').eq('id', session.user.id).single();
      if (data) setUserData(data);
    } catch (e) { console.error(e); }
  };

  const fetchUserOrders = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('ordenes')
        .select(`
          *, 
          detalles_orden(
            cantidad, 
            precio_unitario, 
            productos(nombre, imagen_url)
          )
        `)
        .eq('cliente_id', session.user.id)
        .order('created_at', { ascending: false });
      if (data) setOrders(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  // --- FUNCIÓN ACTUALIZADA CON BÚSQUEDA FLEXIBLE (ILIKE) ---
  const fetchUserMessages = async () => {
    try {
      const { data } = await supabase
        .from('soporte_mensajes')
        .select('*')
        .ilike('correo', session.user.email) // <--- Cambio a ILIKE
        .order('created_at', { ascending: false });
      if (data) setUserMessages(data);
    } catch (e) { console.error("Error al traer mensajes:", e); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (!session) return <div className="profile-error">Inicia sesión para continuar. 🌸</div>;

  return (
    <div className="profile-dashboard-wrapper animate-fade">
      <div className="profile-container-main">
        
        <aside className="profile-sidebar">
          <div className="sidebar-user-card">
            <div className="avatar-large">{userData?.nombre?.charAt(0)}</div>
            <h4>{userData?.nombre} {userData?.apellidos}</h4>
            <p>{session.user.email}</p>
          </div>
          <nav className="sidebar-nav-list">
            <button className={activeTab === 'panel' ? 'active' : ''} onClick={() => setActiveTab('panel')}><FileText size={18}/> Panel de Cuenta</button>
            <button className={activeTab === 'pedidos' ? 'active' : ''} onClick={() => setActiveTab('pedidos')}><Package size={18}/> Mis Órdenes</button>
            <button className={activeTab === 'mensajes' ? 'active' : ''} onClick={() => setActiveTab('mensajes')}><MessageSquare size={18}/> Mis Mensajes</button>
            <button onClick={() => window.location.href = '/mis-favoritos'}><Heart size={18}/> Mi Lista de Deseos</button>
            <button className={activeTab === 'datos' ? 'active' : ''} onClick={() => setActiveTab('datos')}><Settings size={18}/> Gestión de Perfil</button>
            <hr />
            <button className="logout-side-btn" onClick={handleLogout}><LogOut size={18}/> Cerrar Sesión</button>
          </nav>
        </aside>

        <main className="profile-content-area">
          
          {activeTab === 'panel' && (
  <div className="account-overview">
    <div className="welcome-banner-jai">
      <div className="banner-text">
        <h3>¡Bienvenida de nuevo, {userData?.nombre}! ✨</h3>
        <p>Aquí tienes el resumen de tu actividad reciente en JAI Tres Hermanas.</p>
        
        {/* PEGA ESTA LÍNEA AQUÍ ABAJO */}
        <button className="btn-seguir-comprando" onClick={() => window.location.href = '/productos'}>
          <ShoppingBag size={18}/> Seguir Comprando
        </button>

      </div>
    </div>

              <div className="order-status-widgets">
                <div className="status-box">
                  <Clock size={28} color="#f59e0b"/>
                  <strong>{orders.filter(o => o.estado === 'Pendiente').length}</strong>
                  <span>Pendiente</span>
                </div>
                <div className="status-box">
                  <Truck size={28} color="#3b82f6"/>
                  <strong>{orders.filter(o => o.estado === 'Enviado').length}</strong>
                  <span>Enviada</span>
                </div>
                <div className="status-box">
                  <CheckCircle size={28} color="#10b981"/>
                  <strong>{orders.filter(o => o.estado === 'Pagado').length}</strong>
                  <span>Terminada</span>
                </div>
                <div className="status-box">
                  <MessageSquare size={28} color="#cf69d4"/>
                  <strong>{orders.length}</strong>
                  <span>Reseñas</span>
                </div>
              </div>

              <div className="recent-orders-card">
                <div className="card-header-flex">
                  <h4>Mis Órdenes Recientes</h4>
                  <button className="view-all-link" onClick={() => setActiveTab('pedidos')}>Ver Todo <ChevronRight size={14}/></button>
                </div>
                <div className="table-wrapper-mini">
                   <table className="dashboard-table">
                     <thead>
                       <tr>
                         <th>Orden</th>
                         <th>Fecha</th>
                         <th>Total</th>
                         <th>Estado</th>
                       </tr>
                     </thead>
                     <tbody>
                       {orders.slice(0, 5).map(order => (
                         <tr key={order.id}>
                           <td className="bold">#{order.id.toString().slice(-6).toUpperCase()}</td>
                           <td>{new Date(order.created_at).toLocaleDateString()}</td>
                           <td className="price-text">${order.total?.toFixed(2)}</td>
                           <td><span className={`badge-status ${order.estado?.toLowerCase()}`}>{order.estado}</span></td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pedidos' && (
            <div className="full-orders-view">
              <div className="view-header">
                <h3>Mis Pedidos 🛍️</h3>
                <p>Consulta el estado y detalle de todas tus compras.</p>
              </div>

              <div className="orders-list-detailed">
                {loading ? (
                  <div className="loading-state">Cargando tu historial...</div>
                ) : orders.length > 0 ? (
                  orders.map(order => (
                    <div key={order.id} className="detailed-order-card">
                      <div className="d-card-header">
                        <div className="order-main-info">
                          <span className="order-label">Folio</span>
                          <span className="order-number">#{order.id.toString().slice(-8).toUpperCase()}</span>
                        </div>
                        <span className={`badge-status ${order.estado?.toLowerCase()}`}>
                          {order.estado}
                        </span>
                      </div>

                      <div className="d-card-body">
                        <div className="items-list">
                          {order.detalles_orden?.map((det, i) => (
                            <div key={i} className="item-row">
                              <div className="item-image-container">
                                <img 
                                  src={det.productos?.imagen_url || 'https://via.placeholder.com/50'} 
                                  alt={det.productos?.nombre} 
                                  className="order-item-img"
                                />
                              </div>
                              <div className="item-info">
                                <p className="item-name"><strong>{det.cantidad}x</strong> {det.productos?.nombre}</p>
                              </div>
                              <span className="item-price">${(det.cantidad * det.precio_unitario).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="d-card-footer">
                        <div className="footer-info">
                          <Calendar size={14} />
                          <span>{new Date(order.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="footer-total">
                          <span className="total-label">Total pagado:</span>
                          <span className="total-amount">${order.total?.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">No tienes órdenes registradas todavía.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'mensajes' && (
            <div className="user-messages-view">
              <div className="view-header">
                <h3>Soporte y Ayuda 🌸</h3>
                <p>Aquí puedes ver el seguimiento de tus dudas reportadas.</p>
              </div>
              
              <div className="messages-list-customer">
                {userMessages.length > 0 ? (
                  userMessages.map(msg => (
                    <div key={msg.id} className="customer-ticket-card">
                      <div className="ticket-top">
                        <span className="ticket-asunto">{msg.asunto}</span>
                        <span className={`badge-status ${msg.estado.toLowerCase()}`}>{msg.estado}</span>
                      </div>
                      
                      <div className="ticket-user-msg">
                        <p><strong>Tu duda:</strong> {msg.mensaje}</p>
                        <small>{new Date(msg.created_at).toLocaleDateString()}</small>
                      </div>

                      {msg.respuesta_seguimiento ? (
                        <div className="ticket-admin-reply">
                          <div className="reply-header">
                            <CheckCircle size={14} color="#10b981" />
                            <strong>Respuesta de JAI Market:</strong>
                          </div>
                          <p>{msg.respuesta_seguimiento}</p>
                        </div>
                      ) : (
                        <div className="ticket-waiting">
                          <Clock size={14} />
                          <span>Esperando respuesta del equipo...</span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="no-data">No has enviado ningún mensaje de soporte aún. 🌸</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'datos' && (
            <div className="profile-settings-card">
              <h3>Gestión de Perfil</h3>
              <div className="settings-grid">
                <div className="form-group-jai"><label>Nombre</label><input type="text" value={userData?.nombre} disabled /></div>
                <div className="form-group-jai"><label>Apellidos</label><input type="text" value={userData?.apellidos} disabled /></div>
                <div className="form-group-jai"><label>Correo Electrónico</label><input type="text" value={session.user.email} disabled /></div>
                <div className="form-group-jai"><label>Teléfono</label><input type="text" value={userData?.telefono || 'No registrado'} disabled /></div>
              </div>
              <p className="footer-hint">Para modificar tus datos registrados, contacta al centro de ayuda JAI.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default UserProfile; 