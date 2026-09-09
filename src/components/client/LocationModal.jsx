import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import './LocationModal.css';

const LocationModal = ({ isOpen, onClose }) => {
  const { language, setLanguage, currency, setCurrency } = useCart();
  
  // Estados temporales para que no cambie hasta darle "Confirmar"
  const [tempLang, setTempLang] = useState(language);
  const [tempCurr, setTempCurr] = useState(currency);

  if (!isOpen) return null;

  const handleConfirm = () => {
  // .toLowerCase() asegura que coincida con tu archivo translations.js
  setLanguage(tempLang.toLowerCase()); 
  setCurrency(tempCurr);
  onClose();
};

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-premium" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={24} />
        </button>
        
        <div className="modal-header-jai">
          <h2>📍 {tempLang === 'es' ? 'Ubicación' : 'Location'}</h2>
        </div>

        <div className="form-group-jai">
          <label>{tempLang === 'es' ? 'Idioma:' : 'Language:'}</label>
          <select 
            className="input-premium" 
            value={tempLang.toUpperCase()} 
            onChange={(e) => setTempLang(e.target.value.toLowerCase())}
          >
            <option value="ES">Español</option>
            <option value="EN">English</option>
          </select>
        </div>

        <div className="form-group-jai">
          <label>{tempLang === 'es' ? 'Moneda:' : 'Currency:'}</label>
          <select 
            className="input-premium" 
            value={tempCurr} 
            onChange={(e) => setTempCurr(e.target.value)}
          >
            <option value="MXN">MXN (MX$)</option>
            <option value="USD">USD ($)</option>
          </select>
        </div>

        <button className="confirm-btn-luxury" onClick={handleConfirm}>
          {tempLang === 'es' ? 'CONFIRMAR CAMBIOS' : 'CONFIRM CHANGES'}
        </button>
      </div>
    </div>
  );
};

export default LocationModal;