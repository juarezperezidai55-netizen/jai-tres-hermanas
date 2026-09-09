import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, MessageCircle, Clock, MapPin, Sparkles } from 'lucide-react';
import './SuccessView.css';

const SuccessView = () => {
  const navigate = useNavigate();

  return (
    <div className="success-page-container">
      <div className="success-card animate-pop-in">
        <div className="success-icon-wrapper">
          <CheckCircle size={80} className="icon-main" />
          <Sparkles className="sparkle-1" size={24} />
          <Sparkles className="sparkle-2" size={20} />
        </div>

        <h1 className="success-title">¡Gracias por tu confianza!</h1>
        <p className="success-subtitle">Hemos registrado tu solicitud en el sistema JAI Market.</p>

        <div className="next-steps-section">
          <h3>¿Qué sigue ahora?</h3>
          
          <div className="step-item">
            <div className="step-number">1</div>
            <div className="step-text">
              <strong>Confirmación en WhatsApp</strong>
              <p>Si ya enviaste tu mensaje, uno de nuestros asesores revisará la disponibilidad de tus productos en breve.</p>
            </div>
          </div>

          <div className="step-item">
            <div className="step-number">2</div>
            <div className="step-text">
              <strong>Verificación de Pago</strong>
              <p>Una vez que envíes tu captura de pantalla (SPEI o Oxxo), validaremos tu pago para pasar el pedido a preparación.</p>
            </div>
          </div>

          <div className="step-item">
            <div className="step-number">3</div>
            <div className="step-text">
              <strong>Logística y Entrega</strong>
              <p>Te contactaremos para coordinar el punto de entrega (Tampico, alguna de nuestras sucursales) o confirmar el envío de tu paquete.</p>
            </div>
          </div>
        </div>

        <div className="info-box-luxury">
          <Clock size={18} />
          <span>Nuestro horario de atención personal es de 9:00 AM a 8:00 PM.</span>
        </div>

        <div className="success-actions">
          <button className="btn-return-shop" onClick={() => navigate('/')}>
            VOLVER AL CATÁLOGO
          </button>
          <a 
            href="https://wa.me/528331376553" 
            className="btn-support-wa"
            target="_blank" 
            rel="noopener noreferrer"
          >
            <MessageCircle size={18} /> ¿NECESITAS AYUDA?
          </a>
        </div>
      </div>
    </div>
  );
};

export default SuccessView;