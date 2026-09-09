import React, { useState, useEffect } from 'react';
import { Search, MapPin, UserCircle, ShoppingCart, Menu, ChevronDown, LogOut, Heart, MessageSquare, Globe } from 'lucide-react'; 
import { useCart } from '../../context/CartContext'; 
import { supabase } from '../../api/supabaseClient';
import { useNavigate } from 'react-router-dom'; 
import LocationModal from './LocationModal';
import ContactModal from './ContactModal'; 
import CartSidebar from './CartSidebar'; // <--- IMPORTANTE: Asegúrate de que esta ruta sea correcta
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isCatMenuOpen, setIsCatMenuOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  
  const [localSearch, setLocalSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]); 
  const [showSuggestions, setShowSuggestions] = useState(false);

  // EXTRAEMOS LAS FUNCIONES DEL CONTEXTO
  const { 
    cartCount, 
    setIsCartOpen, 
    setSearchQuery, 
    setSucursalFilter, 
    setCategoryFilter, 
    session,
    language, 
    currency, 
    t 
  } = useCart(); 

  useEffect(() => {
    const getSuggestions = async () => {
      if (localSearch.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      const { data } = await supabase
        .from('productos')
        .select('id, nombre, imagen_url')
        .ilike('nombre', `%${localSearch}%`)
        .limit(5); 

      setSuggestions(data || []);
    };
    const timeoutId = setTimeout(() => getSuggestions(), 300); 
    return () => clearTimeout(timeoutId);
  }, [localSearch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(localSearch);
    setShowSuggestions(false);
    navigate('/'); 
  };

  const handleSelectSuggestion = (id) => {
    setShowSuggestions(false);
    setLocalSearch("");
    navigate(`/producto/${id}`); 
  };

  const handleSucursalClick = (id) => {
    setSucursalFilter(id);
    setCategoryFilter(null);
    setSearchQuery('');
    setLocalSearch('');
    setIsMenuOpen(false); 
    setIsCatMenuOpen(false);
    navigate('/');
  };

  const handleResetAll = () => {
    setSucursalFilter(null);
    setCategoryFilter(null);
    setSearchQuery('');
    setLocalSearch('');
    setIsCatMenuOpen(false);
    navigate('/');
    window.scrollTo(0, 0); 
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleUserClick = () => {
    if (session) {
      navigate('/mi-perfil');
    } else {
      navigate('/login-cliente');
    }
  };

  return (
    <header className="header-container-premium">
      {/* Banner Superior */}
      <div className="top-banner-luxury">
        <span>✨ {t('welcome').toUpperCase()} | {currency === 'MXN' ? '' : ''} | JAI TRES HERMANAS ✨</span>
      </div>

      {/* Header Principal */}
      <div className="main-header-content">
        <div className="logo-section">
          <Menu className="mobile-menu-icon" onClick={() => setIsMenuOpen(!isMenuOpen)} />
          <div className="brand-logo" onClick={handleResetAll} style={{ cursor: 'pointer' }}>
            <h1 className="logo-main">JAI</h1>
            <span className="logo-sub">TRES HERMANAS</span>
          </div>
        </div>

        {/* Buscador */}
        <div className="search-container-modern">
          <form className="search-bar-modern" onSubmit={handleSearchSubmit}>
            <input 
              type="text" 
              placeholder={currency === 'MXN' ? "Encuentra el regalo perfecto..." : "Find the perfect gift..."} 
              value={localSearch}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                setShowSuggestions(true);
              }}
            />
            <button type="submit" className="search-btn-luxury"><Search size={18} /></button>
          </form>

          {showSuggestions && suggestions.length > 0 && (
            <div className="search-suggestions-premium">
              {suggestions.map((item) => (
                <div 
                  key={item.id} 
                  className="suggestion-item-modern"
                  onClick={() => handleSelectSuggestion(item.id)}
                >
                  <img src={item.imagen_url} alt={item.nombre} />
                  <span>{item.nombre}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Acciones de Usuario */}
        <div className="user-nav-actions">
          <div className="nav-action-btn hide-mobile" onClick={() => setIsLocationOpen(true)}>
            <Globe size={20} color="#D4AF37" />
            <span style={{ fontWeight: 'bold' }}>{language.toUpperCase()} | {currency}</span>
          </div>

          <div className="nav-action-btn hide-mobile" onClick={() => setIsContactOpen(true)}>
            <MessageSquare size={20} color="#cf69d4" />
            <span>{currency === 'MXN' ? 'Contacto' : 'Contact'}</span>
          </div>

          <div className="nav-action-btn hide-mobile" onClick={() => navigate('/mis-favoritos')}>
            <Heart size={20} color="#cf69d4" />
            <span>{currency === 'MXN' ? 'Deseos' : 'Wishlist'}</span>
          </div>

          <div className="nav-action-btn profile-btn" onClick={handleUserClick}>
            <UserCircle size={22} color={session ? "#cf69d4" : "#666"} />
            <span>{session ? (currency === 'MXN' ? 'Cuenta' : 'Account') : (currency === 'MXN' ? 'Entrar' : 'Login')}</span>
          </div>

          {session && (
            <button className="logout-icon-btn-luxury" onClick={handleLogout} title="Cerrar Sesión">
              <LogOut size={18} />
            </button>
          )}

          {/* INTEGRACIÓN DEL CARRITO CON HOVER ESTABLE */}
          <div 
            className="cart-icon-container"
            onMouseEnter={() => setIsCartOpen(true)}
            onMouseLeave={() => setIsCartOpen(false)}
          >
            <div className="nav-action-btn cart-btn-modern">
              <ShoppingCart size={22} />
              {cartCount > 0 && <span className="cart-badge-luxury">{cartCount}</span>}
            </div>

            {/* Al estar aquí adentro, el mouse sigue "dentro" del padre aunque bajes al sidebar */}
            <CartSidebar />
          </div>
        </div>
      </div>

      {/* Navegación y Mega Menú */}
      <nav className="sub-nav-luxury">
        <div className="nav-links-modern">
          <div 
            className="categories-menu-wrapper"
            onMouseEnter={() => setIsCatMenuOpen(true)}
            onMouseLeave={() => setIsCatMenuOpen(false)}
          >
            <div className="categories-trigger-btn">
              <Menu size={16} /> {t('category').toUpperCase()} <ChevronDown size={14} />
            </div>
            
            {isCatMenuOpen && (
              <div className="custom-dropdown-menu mega-layout-premium">
                {/* COLUMNA 1 */}
                <div className="dropdown-column">
                  <div className="dropdown-section">
                    <h5 onClick={() => { setCategoryFilter([11, 12, 13, 14]); setIsCatMenuOpen(false); navigate('/'); }}>💍 {currency === 'MXN' ? 'Bisutería Fina' : 'Fine Jewelry'}</h5>
                    <ul>
                      <li onClick={() => { setCategoryFilter(11); setIsCatMenuOpen(false); navigate('/'); }}>{currency === 'MXN' ? 'Aretes' : 'Earrings'}</li>
                      <li onClick={() => { setCategoryFilter(12); setIsCatMenuOpen(false); navigate('/'); }}>{currency === 'MXN' ? 'Pulseras' : 'Bracelets'}</li>
                      <li onClick={() => { setCategoryFilter(13); setIsCatMenuOpen(false); navigate('/'); }}>{currency === 'MXN' ? 'Anillos' : 'Rings'}</li>
                      <li onClick={() => { setCategoryFilter(14); setIsCatMenuOpen(false); navigate('/'); }}>{currency === 'MXN' ? 'Collares' : 'Necklaces'}</li>
                      <li onClick={() => { setCategoryFilter(47); setIsCatMenuOpen(false); navigate('/'); }}>{currency === 'MXN' ? 'Tobilleras' : 'Necklaces'}</li>
                    </ul>
                  </div>
                  <div className="dropdown-section">
                    <h5 onClick={() => { setCategoryFilter([15, 16, 17, 18]); setIsCatMenuOpen(false); navigate('/'); }}>✨ {currency === 'MXN' ? 'Fantasía' : 'Fashion Jewelry'}</h5>
                    <ul>
                      <li onClick={() => { setCategoryFilter(15); setIsCatMenuOpen(false); navigate('/'); }}>{currency === 'MXN' ? 'Collares' : 'Necklaces'}</li>
                      <li onClick={() => { setCategoryFilter(16); setIsCatMenuOpen(false); navigate('/'); }}>{currency === 'MXN' ? 'Pulseras' : 'Bracelets'}</li>
                      <li onClick={() => { setCategoryFilter(17); setIsCatMenuOpen(false); navigate('/'); }}>{currency === 'MXN' ? 'Cadena Cintura' : 'Waist Chain'}</li>
                      <li onClick={() => { setCategoryFilter(18); setIsCatMenuOpen(false); navigate('/'); }}>{currency === 'MXN' ? 'Aretes' : 'Earrings'}</li>
                    </ul>
                  </div>
                </div>

                {/* COLUMNA 2 */}
                <div className="dropdown-column">
                  <div className="dropdown-section">
                    <h5 onClick={() => { setCategoryFilter([19, 20, 21]); setIsCatMenuOpen(false); navigate('/'); }}>👗 {currency === 'MXN' ? 'Ropa Mujer' : 'Womens Clothing'}</h5>
                    <ul>
                      <li onClick={() => { setCategoryFilter(19); setIsCatMenuOpen(false); navigate('/'); }}>{currency === 'MXN' ? 'Blusas' : 'Blouses'}</li>
                      <li onClick={() => { setCategoryFilter(20); setIsCatMenuOpen(false); navigate('/'); }}>{currency === 'MXN' ? 'Pantalones' : 'Pants'}</li>
                      <li onClick={() => { setCategoryFilter(21); setIsCatMenuOpen(false); navigate('/'); }}>{currency === 'MXN' ? 'Vestidos' : 'Dresses'}</li>
                    </ul>
                  </div>
                  <div className="dropdown-section">
                    <h5 onClick={() => { setCategoryFilter([22, 23, 24, 25, 26]); setIsCatMenuOpen(false); navigate('/'); }}>🎒 {currency === 'MXN' ? 'Accesorios' : 'Accessories'}</h5>
                    <ul>
                      <li onClick={() => { setCategoryFilter(22); setIsCatMenuOpen(false); navigate('/'); }}>{currency === 'MXN' ? 'Lentes' : 'Sunglasses'}</li>
                      <li onClick={() => { setCategoryFilter(23); setIsCatMenuOpen(false); navigate('/'); }}>Pines</li>
                      <li onClick={() => { setCategoryFilter(24); setIsCatMenuOpen(false); navigate('/'); }}>{currency === 'MXN' ? 'Llaveros' : 'Keychains'}</li>
                      <li onClick={() => { setCategoryFilter(25); setIsCatMenuOpen(false); navigate('/'); }}>{currency === 'MXN' ? 'Fundas Celular' : 'Phone Cases'}</li>
                      <li onClick={() => { setCategoryFilter(26); setIsCatMenuOpen(false); navigate('/'); }}>{currency === 'MXN' ? 'Calcetines' : 'Socks'}</li>
                    </ul>
                  </div>
                </div>

                {/* COLUMNA 3 */}
                <div className="dropdown-column">
                  <div className="dropdown-section">
                    <h5 onClick={() => { setCategoryFilter([27, 28, 29, 30]); setIsCatMenuOpen(false); navigate('/'); }}>👔 {currency === 'MXN' ? 'Bisuteria de Caballero' : 'Men Jewelry'}</h5>
                    <ul>
                      <li onClick={() => { setCategoryFilter(27); setIsCatMenuOpen(false); navigate('/'); }}>{currency === 'MXN' ? 'Collares' : 'Necklaces'}</li>
                      <li onClick={() => { setCategoryFilter(28); setIsCatMenuOpen(false); navigate('/'); }}>{currency === 'MXN' ? 'Pulseras' : 'Bracelets'}</li>
                      <li onClick={() => { setCategoryFilter(29); setIsCatMenuOpen(false); navigate('/'); }}>{currency === 'MXN' ? 'Anillos' : 'Rings'}</li>
                      <li onClick={() => { setCategoryFilter(30); setIsCatMenuOpen(false); navigate('/'); }}>{currency === 'MXN' ? 'Pendientes' : 'Earrings'}</li>
                    </ul>
                  </div>
                  <div className="dropdown-section">
                    <div onClick={() => { setCategoryFilter([31, 32, 33]); setIsCatMenuOpen(false); navigate('/'); }}>👕 {currency === 'MXN' ? 'Ropa Hombre' : 'Mens Clothing'}</div>
                    <ul>
                      <li onClick={() => { setCategoryFilter(31); setIsCatMenuOpen(false); navigate('/'); }}>{currency === 'MXN' ? 'Playeras' : 'T-shirts'}</li>
                      <li onClick={() => { setCategoryFilter(32); setIsCatMenuOpen(false); navigate('/'); }}>{currency === 'MXN' ? 'Camisas' : 'Shirts'}</li>
                      <li onClick={() => { setCategoryFilter(33); setIsCatMenuOpen(false); navigate('/'); }}>{currency === 'MXN' ? 'Pantalones' : 'Pants'}</li>
                    </ul>
                  </div>
                  <div className="dropdown-section">
                    <h5 onClick={() => { setCategoryFilter([34, 35]); setIsCatMenuOpen(false); navigate('/'); }}>⌚ {currency === 'MXN' ? 'Relojes' : 'Watches'}</h5>
                    <ul>
                      <li onClick={() => { setCategoryFilter(34); setIsCatMenuOpen(false); navigate('/'); }}>{currency === 'MXN' ? 'Caballero' : 'Men'}</li>
                      <li onClick={() => { setCategoryFilter(35); setIsCatMenuOpen(false); navigate('/'); }}>{currency === 'MXN' ? 'Dama' : 'Women'}</li>
                    </ul>
                  </div>
                </div>

                {/* COLUMNA 4 */}
                <div className="dropdown-column">
                  <div className="dropdown-section">
                    <h5 onClick={() => { setCategoryFilter([36, 37, 38, 39, 40, 41]); setIsCatMenuOpen(false); navigate('/'); }}>🎀 {currency === 'MXN' ? 'Cabello' : 'Hair'}</h5>
                    <ul>
                      <li onClick={() => { setCategoryFilter(36); setIsCatMenuOpen(false); navigate('/'); }}>Scrunchies</li>
                      <li onClick={() => { setCategoryFilter(37); setIsCatMenuOpen(false); navigate('/'); }}>{currency === 'MXN' ? 'Pinzas' : 'Clips'}</li>
                      <li onClick={() => { setCategoryFilter(38); setIsCatMenuOpen(false); navigate('/'); }}>{currency === 'MXN' ? 'Moños' : 'Bows'}</li>
                      <li onClick={() => { setCategoryFilter(41); setIsCatMenuOpen(false); navigate('/'); }}>{currency === 'MXN' ? 'Prendedores' : 'Pins'}</li>
                    </ul>
                  </div>
                  <div className="dropdown-section">
                    <h5 onClick={() => { setCategoryFilter([41, 42, 43]); setIsCatMenuOpen(false); navigate('/'); }}>💄 {currency === 'MXN' ? 'Cosméticos' : 'Cosmetics'}</h5>
                    <ul>
                      <li onClick={() => { setCategoryFilter(41); setIsCatMenuOpen(false); navigate('/'); }}>{currency === 'MXN' ? 'Maquillaje' : 'Makeup'}</li>
                      <li onClick={() => { setCategoryFilter(42); setIsCatMenuOpen(false); navigate('/'); }}>SkinCare</li>
                    </ul>
                  </div>
                  <div className="dropdown-section">
                    <h5 onClick={() => { setCategoryFilter([44, 45, 46]); setIsCatMenuOpen(false); navigate('/'); }}>🌹 {currency === 'MXN' ? 'Ramos' : 'Bouquets'}</h5>
                    <ul>
                      <li onClick={() => { setCategoryFilter(44); setIsCatMenuOpen(false); navigate('/'); }}>{currency === 'MXN' ? 'Aniversario' : 'Anniversary'}</li>
                      <li onClick={() => { setCategoryFilter(45); setIsCatMenuOpen(false); navigate('/'); }}>{currency === 'MXN' ? 'Cumpleaños' : 'Birthday'}</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="nav-divider" />

          <div className="location-nav-premium">
              <span className="label-sucursal">{currency === 'MXN' ? 'SUCURSALES:' : 'STORES:'}</span>
              <button onClick={() => handleSucursalClick(3)}>EL HIGO</button>
              <button onClick={() => handleSucursalClick(2)}>PÁNUCO</button>
              <div className="nav-separator-luxury">|</div>
              <button className="tampico-highlight-luxury" onClick={() => handleSucursalClick(1)}>TAMPICO (Entregas)</button>
              <button className="reset-btn-luxury" onClick={handleResetAll}>{currency === 'MXN' ? 'VER TODO ✨' : 'SEE ALL ✨'}</button>
          </div>
        </div>
      </nav> 

      <LocationModal isOpen={isLocationOpen} onClose={() => setIsLocationOpen(false)} />
      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </header>
  );
};

export default Header;