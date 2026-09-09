import React, { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import { 
  MessageCircle, Clock, CheckCircle2, AlertCircle, 
  User, Mail, Calendar, Send, Trash2, X, ChevronLeft
} from 'lucide-react';
import './SupportView.css';

const SupportView = () => {
  const [loading, setLoading] = useState(false);
  const [mensajes, setMensajes] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [respuesta, setRespuesta] = useState("");

  useEffect(() => {
    fetchMensajes();
  }, []);

  const fetchMensajes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('soporte_mensajes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMensajes(data || []);
    } catch (error) {
      console.error("Error cargando soporte:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, nuevoEstado) => {
    const { error } = await supabase
      .from('soporte_mensajes')
      .update({ estado: nuevoEstado })
      .eq('id', id);
    
    if (!error) {
      alert("Estado actualizado ✨");
      fetchMensajes();
      setSelectedTicket(null);
    }
  };

  const handleRespuestaSubmit = async () => {
    if (!respuesta.trim()) return alert("Por favor escribe una respuesta 🌸");

    try {
      const { error } = await supabase
        .from('soporte_mensajes')
        .update({ 
          respuesta_seguimiento: respuesta,
          estado: 'Resuelto' 
        })
        .eq('id', selectedTicket.id);

      if (error) throw error;

      alert("Seguimiento registrado y ticket resuelto ✨");
      setRespuesta("");
      setSelectedTicket(null);
      fetchMensajes();
    } catch (error) {
      alert("Error al guardar: " + error.message);
    }
  };

  return (
    <div className="support-view-wrapper animate-fade">
      <div className="support-header-pro">
        <div className="header-text">
          <h2>Atención al Cliente 🌸</h2>
          <p>Soporte técnico y consultas de la comunidad JAI</p>
        </div>
      </div>

      {/* Contenedor Principal Adaptable */}
      <div className={`support-main-layout ${selectedTicket ? 'ticket-selected' : ''}`}>
        
        {/* COLUMNA IZQUIERDA: LISTADO */}
        <aside className="tickets-sidebar">
          <div className="sidebar-header">
            <span>Mensajes Recientes</span>
            <span className="count-badge">{mensajes.length}</span>
          </div>
          
          <div className="tickets-scroll-area">
            {loading ? (
              <div className="loading-box"><div className="spinner"></div></div>
            ) : mensajes.length === 0 ? (
              <div className="empty-support">
                <CheckCircle2 size={40} color="#cf69d4" />
                <p>¡Todo al día!</p>
              </div>
            ) : (
              mensajes.map(msg => (
                <div 
                  key={msg.id} 
                  className={`ticket-card-pro ${selectedTicket?.id === msg.id ? 'active' : ''} ${msg.estado === 'Pendiente' ? 'unread' : ''}`}
                  onClick={() => {
                    setSelectedTicket(msg);
                    setRespuesta(msg.respuesta_seguimiento || "");
                  }}
                >
                  <div className="card-top">
                    <span className={`status-dot ${msg.estado?.toLowerCase()}`}></span>
                    <span className="msg-date">{new Date(msg.created_at).toLocaleDateString()}</span>
                  </div>
                  <h4>{msg.asunto || "Consulta General"}</h4>
                  <p className="excerpt">{msg.mensaje.substring(0, 45)}...</p>
                  <div className="card-user">
                    <User size={12}/> {msg.nombre}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* COLUMNA DERECHA: DETALLE */}
        <main className="ticket-detail-pane">
          {selectedTicket ? (
            <div className="detail-content animate-pop">
              <header className="detail-header-pro">
                <button className="back-btn-mobile" onClick={() => setSelectedTicket(null)}>
                  <ChevronLeft size={24} />
                </button>
                <div className="user-profile">
                  <div className="avatar-circle">{selectedTicket.nombre.charAt(0)}</div>
                  <div className="user-info">
                    <h3>{selectedTicket.nombre}</h3>
                    <span>{selectedTicket.correo}</span>
                  </div>
                </div>
                <div className="detail-header-actions">
                    <button className="btn-resolve-top" onClick={() => updateStatus(selectedTicket.id, 'Resuelto')}>
                      <CheckCircle2 size={16}/> Resuelto
                    </button>
                    <button className="btn-close-pane" onClick={() => setSelectedTicket(null)}><X size={20}/></button>
                </div>
              </header>

              <div className="detail-body-scroll">
                <div className="asunto-tag-box">
                  <small>Asunto de consulta:</small>
                  <p>{selectedTicket.asunto}</p>
                </div>
                
                <div className="client-message-bubble">
                  {selectedTicket.mensaje}
                  <span className="bubble-time">{new Date(selectedTicket.created_at).toLocaleTimeString()}</span>
                </div>

                <div className="admin-reply-area">
                  <label>Seguimiento Administrativo</label>
                  <textarea 
                    placeholder="Escribe aquí las notas de resolución o seguimiento..."
                    value={respuesta}
                    onChange={(e) => setRespuesta(e.target.value)}
                  ></textarea>
                  <button className="btn-save-reply" onClick={handleRespuestaSubmit}>
                    <Send size={18} /> Registrar y Cerrar Ticket
                  </button>
                  <p className="reply-hint">Esta nota es interna para control de JAI.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-selection-state">
              <div className="empty-illustration">
                <MessageCircle size={60} />
              </div>
              <h3>Buzón de Entrada</h3>
              <p>Selecciona un mensaje de la lista para gestionar la atención.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SupportView;