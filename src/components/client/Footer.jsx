import React from 'react';
import { 
  Facebook, Instagram, MessageCircle, Mail, 
  MapPin, Phone, ShieldCheck, Truck, CreditCard 
} from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer-jai">
      <div className="footer-container">
        
        {/* Columna 1: Sobre Nosotros */}
        <div className="footer-column">
          <h2 className="footer-logo">JAI <span>TRES HERMANAS</span></h2>
          <p className="footer-description">
            Tu tienda de confianza para accesorios de importación y joyería fina. 
            Calidad y elegancia en cada pieza.
          </p>
          <div className="footer-socials">
            <a href="#"><Facebook size={20} /></a>
            <a href="#"><Instagram size={20} /></a>
            <a href="#"><MessageCircle size={20} /></a>
          </div>
        </div>

        {/* Columna 2: Enlaces Rápidos */}
        <div className="footer-column">
          <h3>Explorar</h3>
          <ul>
            <li><a href="/">Inicio</a></li>
            <li><a href="/login-cliente">Mi Cuenta</a></li>
            <li><a href="/mis-favoritos">Favoritos</a></li>
            <li><a href="#">Nuevos Productos</a></li>
          </ul>
        </div>

        {/* Columna 3: Soporte */}
        <div className="footer-column">
          <h3>Atención al Cliente</h3>
          <ul>
            <li><a href="#">Preguntas Frecuentes</a></li>
            <li><a href="#">Políticas de Envío</a></li>
            <li><a href="#">Términos y Condiciones</a></li>
            <li><a href="#">Guía de Tallas</a></li>
          </ul>
        </div>

        {/* Columna 4: Contacto */}
        <div className="footer-column">
          <h3>Contacto Directo</h3>
          <div className="contact-item">
            <MapPin size={16} /> <span>El Higo / Pánuco / Tampico</span>
          </div>
          <div className="contact-item">
            <Phone size={16} /> <span>+52 8331376553</span>
          </div>
          <div className="contact-item">
            <Mail size={16} /> <span>contacto@jaimarket.com</span>
          </div>
        </div>

      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <p>© 2026 JAI Tres Hermanas. Todos los derechos reservados.</p>
          <div className="payment-methods">
            <CreditCard size={24} />
            <span className="payment-label">Pagos Seguros vía Transferencia o Efectivo</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;