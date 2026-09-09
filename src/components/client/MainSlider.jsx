import React, { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext'; 
import './MainSlider.css';

const MainSlider = () => {
  const [banners, setBanners] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const { setCategoryFilter, setSearchQuery, setSucursalFilter } = useCart();

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('activo', true)
        .order('orden', { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error("Error cargando banners:", error.message);
    } finally {
      setLoading(false);
    }
  }; 

  useEffect(() => {
    if (banners.length > 0) {
      const timer = setInterval(() => {
        setCurrent(prev => (prev === banners.length - 1 ? 0 : prev + 1));
      }, 6000);
      return () => clearInterval(timer);
    }
  }, [current, banners]);

  const handleBannerClick = (enlace) => {
    if (!enlace) return;
    if (!isNaN(enlace)) {
      setCategoryFilter(parseInt(enlace));
      setSearchQuery('');
      setSucursalFilter(null);
      navigate('/');
    } else {
      navigate(enlace);
    }
    window.scrollTo({ top: 600, behavior: 'smooth' });
  };

  if (loading || banners.length === 0) return null;

  return (
    <section className="main-slider-luxury">
      {banners.map((slide, index) => (
        <div 
          className={index === current ? 'slide-jai active' : 'slide-jai'} 
          key={slide.id}
        >
          {/* NUEVA CAPA: Imagen de fondo desenfocada para eliminar el blanco */}
          <div 
            className="slide-background-blur" 
            style={{ backgroundImage: `url(${slide.imagen_url})` }}
          />
          
<img
  src={slide.imagen_url}
  alt={slide.titulo}
  className="slide-image-pro"
  loading="lazy"
/>          
          <div className="slide-overlay-luxury">
            <div className="slide-content-jai">
              <span className="slide-badge"><Sparkles size={14}/> EXCLUSIVO JAI</span>
              <h2>{slide.titulo}</h2>
              <p>{slide.subtitulo}</p>
              <button className="btn-slide-luxury" onClick={() => handleBannerClick(slide.enlace)}>
                {slide.boton_texto || 'Comprar ahora'}
              </button>
            </div>
          </div>
        </div>
      ))}

      <button className="slider-arrow left" onClick={() => setCurrent(current === 0 ? banners.length - 1 : current - 1)}>
        <ChevronLeft />
      </button>
      <button className="slider-arrow right" onClick={() => setCurrent(current === banners.length - 1 ? 0 : current + 1)}>
        <ChevronRight />
      </button>

      <div className="slider-dots">
        {banners.map((_, i) => (
          <div key={i} className={i === current ? 'dot active' : 'dot'} onClick={() => setCurrent(i)} />
        ))}
      </div>
    </section>
  );
};

export default MainSlider;