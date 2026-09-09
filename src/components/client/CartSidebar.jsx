import React from 'react';

import { useCart } from '../../context/CartContext';

import { X, ShoppingBag, Trash2 } from 'lucide-react';

import { useNavigate } from 'react-router-dom';

import './CartSidebar.css';



const CartSidebar = () => {

  const {

    cart,

    isCartOpen,

    setIsCartOpen,

    cartTotal,  

    formatPrice,

    currency,

    t,

    removeFromCart

  } = useCart();

 

  const navigate = useNavigate();



  if (!isCartOpen) return null;



  const goToFullCart = () => {

    navigate('/carrito');

    setIsCartOpen(false);

  };



  return (

    <div className="cart-dropdown-wrapper" onMouseLeave={() => setIsCartOpen(false)}>

      <div className="cart-dropdown-arrow"></div>



      <div className="cart-dropdown-content">

        <div className="cart-dropdown-header" onClick={goToFullCart} style={{ cursor: 'pointer' }}>

          <span>{t('cart')} ({cart.length})</span>

          <button className="close-dropdown-btn" onClick={(e) => {

            e.stopPropagation();

            setIsCartOpen(false);

          }}>

            <X size={18} />

          </button>

        </div>



        <div className="cart-dropdown-body">

          {cart.length === 0 ? (

            <div className="cart-empty-state" onClick={goToFullCart} style={{ cursor: 'pointer' }}>

              <ShoppingBag size={40} color="#eee" />

              <p>Tu carrito JAI está vacío 🌸</p>

            </div>

          ) : (

            cart.map(item => {

              const precioBase = item.precio_original || item.precio;

              const tieneDescuento = precioBase > item.precio;



              return (

                <div key={`${item.id}-${item.sucursal_id}`} className="cart-dropdown-item">

                  <img src={item.imagen_url} alt={item.nombre} />

                  <div className="item-info-mini">

                    <h6>{item.nombre}</h6>

                    <div className="item-price-qty">

                      <div className="mini-price-wrapper" style={{ display: 'flex', flexDirection: 'column' }}>

                        {tieneDescuento && (

                          <span className="old-price-mini" style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.7rem' }}>

                            {currency === 'MXN' ? 'MX$' : '$'}{formatPrice(precioBase)}

                          </span>

                        )}

                        <span style={{ color: tieneDescuento ? '#cf69d4' : 'inherit', fontWeight: tieneDescuento ? 'bold' : 'normal' }}>

                          {currency === 'MXN' ? 'MX$' : '$'}{formatPrice(item.precio)}

                        </span>

                      </div>

                      <span className="qty-badge">x{item.quantity}</span>

                    </div>

                  </div>

                  <button

                    className="delete-mini-btn"

                    onClick={(e) => {

                      e.stopPropagation();

                      removeFromCart(item.id);

                    }}

                  >

                    <Trash2 size={14} />

                  </button>

                </div>

              );

            })

          )}

        </div>



        {cart.length > 0 && (

          <div className="cart-dropdown-footer">

            <div className="subtotal-row">

              <span>Subtotal:</span>

              <span className="total-amount">

                {currency === 'MXN' ? 'MX$' : '$'}{formatPrice(cartTotal)}

              </span>

            </div>

           

            <button

              className="view-cart-full-btn"

              onClick={goToFullCart}

            >

              Ir al carrito

            </button>

          </div>

        )}

      </div>

    </div>

  );

};



export default CartSidebar; 