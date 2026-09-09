import React, { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import { useCart } from '../../context/CartContext'; // <--- MANTENIDO
import { X, Send, MessageSquare, User, Mail, Bookmark } from 'lucide-react';
import './ContactModal.css';

const ContactModal = ({ isOpen, onClose }) => {
  const { session } = useCart(); // <--- MANTENIDO
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    asunto: 'Consulta General',
    mensaje: ''
  });

  // AUTOCOMPLETADO AL ABRIR EL MODAL (MANTENIDO INTACTO)
  useEffect(() => {
    if (session?.user && isOpen) {
      setFormData(prev => ({
        ...prev,
        nombre: session.user.user_metadata?.nombre || '',
        correo: session.user.email || ''
      }));
    }
  }, [session, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.mensaje || !formData.nombre) return alert("Por favor, llena los campos básicos 🌸");

    setLoading(true);
    try {
      const { error } = await supabase
        .from('soporte_mensajes')
        .insert([
          { 
            nombre: formData.nombre,
            correo: formData.correo.toLowerCase().trim(), 
            asunto: formData.asunto,
            mensaje: formData.mensaje,
            estado: 'Pendiente'
          }
        ]);

      if (error) throw error;

      alert("¡Mensaje enviado con éxito! ✨ Te contactaremos pronto.");
      setFormData({ nombre: '', correo: '', asunto: 'Consulta General', mensaje: '' });
      onClose();
    } catch (error) {
      alert("Error al enviar: " + error.message);
    } finally {
      loading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-contact">
      <div className="contact-modal-container animate-fade">
        <div className="contact-modal-header">
          <div className="header-title-jai">
            <div className="icon-wrapper-jai">
              <MessageSquare size={18} color="#cf69d4" />
            </div>
            <h3>Atención al Cliente JAI 🌸</h3>
          </div>
          <button className="close-contact-btn" onClick={onClose} aria-label="Cerrar modal">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="contact-form-body">
          <p className="contact-intro">¿Tienes alguna duda sobre tu pedido o un producto? ¡Escríbenos!</p>
          
          <div className="input-group-contact">
            <label><User size={13} /> Nombre Completo</label>
            <input 
              type="text" 
              placeholder="Ej. Aylin Gallardo"
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              required
            />
          </div>

          <div className="input-group-contact">
            <label><Mail size={13} /> Correo Electrónico</label>
            <input 
              type="email" 
              placeholder="tu@correo.com"
              value={formData.correo}
              readOnly={!!session} 
              onChange={(e) => setFormData({...formData, correo: e.target.value})}
              required
            />
          </div>

          <div className="input-group-contact">
            <label><Bookmark size={13} /> Asunto</label>
            <div className="select-wrapper-jai">
              <select 
                value={formData.asunto}
                onChange={(e) => setFormData({...formData, asunto: e.target.value})}
              >
                <option value="Consulta General">Consulta General</option>
                <option value="Duda sobre Pedido">Duda sobre Pedido</option>
                <option value="Reporte de Pago">Reporte de Pago</option>
                <option value="Sugerencia">Sugerencia</option>
              </select>
            </div>
          </div>

          <div className="input-group-contact">
            <label>Mensaje</label>
            <textarea 
              placeholder="Cuéntanos en qué podemos ayudarte..."
              value={formData.mensaje}
              onChange={(e) => setFormData({...formData, mensaje: e.target.value})}
              required
            ></textarea>
          </div>

          <button type="submit" className="submit-contact-btn" disabled={loading}>
            {loading ? (
              <span className="loading-text-jai">Enviando...</span>
            ) : (
              <><Send size={16} /> Enviar Mensaje</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContactModal;