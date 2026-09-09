import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../api/supabaseClient';
import { translations } from '../translations';

const CartContext = createContext();

export const CartProvider = ({ children }) => {

  // --- CARGA INICIAL DESDE LOCALSTORAGE ---

  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('jai_cart');
    return savedCart ? JSON.parse(savedCart) : [];

  });


  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(null);

 

  // Configuración original: Iniciamos con la sucursal por defecto

  const [sucursalFilter, setSucursalFilter] = useState(null);

  const [session, setSession] = useState(null);
  const [language, setLanguage] = useState('es');
  const [currency, setCurrency] = useState('MXN');
  const exchangeRate = 18.50;



  // Banderas de control de estado ultra precisas para proteger la base de datos

  const isInitialLoading = useRef(true);
  const isLoadedFromDB = useRef(false); // CANDADO CRÍTICO



  // --- PERSISTENCIA AUTOMÁTICA EN LA NUEVA TABLA ---

  useEffect(() => {

    localStorage.setItem('jai_cart', JSON.stringify(cart));

   

    const guardarCarritoEnBD = async () => {

      // BLINDAJE DE SEGURIDAD: Si no se han cargado los datos iniciales o no hay sesión, frenamos el proceso.

      // Esto evita que al cerrar sesión el arreglo vacío [] pise lo guardado en la nube.

      if (!isLoadedFromDB.current || !session?.user?.id) {

        return;

      }



      try {

        // Apunta a tu nueva tabla 'clientes_carrito'

        await supabase

          .from('clientes_carrito')

          .upsert({

            id: session.user.id,

            contenido: cart,

            updated_at: new Date()

          }, { onConflict: 'id' });

      } catch (error) {

        console.error("Error al guardar carrito automáticamente:", error);

      }

    };



    const timeoutId = setTimeout(guardarCarritoEnBD, 500);

    return () => clearTimeout(timeoutId);

  }, [cart, session]);



  // --- CONTROL DE FLUJO DE USUARIOS (LOGIN / LOGOUT) ---

  useEffect(() => {

    const cargarCarritoDeBD = async (userId) => {

      isInitialLoading.current = true;

      isLoadedFromDB.current = false; // Cerramos candado mientras descargamos de la nube

     

      const { data, error } = await supabase

        .from('clientes_carrito')

        .select('contenido')

        .eq('id', userId)

        .maybeSingle();



      if (!error && data && data.contenido) {

        setCart(data.contenido);

      } else {

        // AJUSTE DE SEGURIDAD: Si el nuevo cliente no tiene carrito en BD, aseguramos limpiar la pantalla

        setCart([]);

        localStorage.removeItem('jai_cart');

      }

     

      isLoadedFromDB.current = true; // Abrimos candado: ya se puede sincronizar de forma segura

      isInitialLoading.current = false;

    };



    supabase.auth.getSession().then(({ data: { session } }) => {

      setSession(session);

      if (session?.user?.id) {

        cargarCarritoDeBD(session.user.id);

      } else {

        isLoadedFromDB.current = true;

        isInitialLoading.current = false;

      }

    });



    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {

      if (_event === 'SIGNED_IN' && session?.user?.id) {

        // CORRECCIÓN PARA EVITAR MEZCLAS AL INICIAR SESIÓN CON OTRO CLIENTE:

        isLoadedFromDB.current = false; // Bloqueamos el guardado automático de inmediato

        isInitialLoading.current = true;

        setCart([]); // Limpiamos la pantalla antes de descargar los artículos reales del nuevo cliente

        localStorage.removeItem('jai_cart');

       

        setSession(session);

        cargarCarritoDeBD(session.user.id);

      } else if (_event === 'SIGNED_OUT') {

        // CORRECCIÓN LOGOUT SEGURO:

        // 1. Cerramos el candado inmediatamente para ignorar cualquier cambio posterior del estado

        isLoadedFromDB.current = false;

        isInitialLoading.current = true;

       

        // 2. Destruimos la sesión en memoria local

        setSession(null);

       

        // 3. Limpiamos visualmente la pantalla del cliente sin afectar a Supabase

        setCart([]);

        localStorage.removeItem('jai_cart');

       

        console.log("🌸 [JAI CONTROL]: Sesión terminada. Los datos permanecen a salvo en clientes_carrito.");

      }

    });



    return () => subscription.unsubscribe();

  }, []);



  // --- LAS FUNCIONALIDADES ORIGINALES DE TU TIENDA (TOTALMENTE INTACTAS) ---

  const t = (key) => {

    if (!translations[language]) return key;

    return translations[language][key] || translations['es'][key] || key;

  };



  const formatPrice = (price) => {

    const numericPrice = parseFloat(price) || 0;

    if (currency === 'USD') {

      return (numericPrice / exchangeRate).toFixed(2);

    }

    return numericPrice.toFixed(2);

  };



  const toggleSelect = (id) => {

    setCart(prevCart => prevCart.map(item =>

      item.id === id ? { ...item, selected: !item.selected } : item

    ));

  };



  const selectAll = (isSelected, sucursalId = null) => {

    setCart(prevCart => prevCart.map(item => {

      if (sucursalId && item.sucursal_id !== sucursalId) return item;

      return { ...item, selected: isSelected };

    }));

  };

  const addToCart = (product) => {
    if (!session) {
      alert("🌸 ¡Hola! Para agregar productos al carrito es obligatorio iniciar sesión o registrar tu cuenta JAI.");
      return;

    }



    let sucursalAsignada = product.sucursal_id || sucursalFilter || 1;



    if (product.inventario_sucursal && product.inventario_sucursal.length > 0) {

      const sucursalRealConStock = product.inventario_sucursal.find(inv => inv.cantidad > 0);

      if (sucursalRealConStock) {

        sucursalAsignada = sucursalRealConStock.sucursal_id;

      }

    }



    const itemToAdd = {

      ...product,

      sucursal_id: Number(sucursalAsignada),

    };

    const stockDisponible = itemToAdd.es_variante

      ? itemToAdd.stock

      : (itemToAdd.inventario_sucursal?.reduce((acc, inv) => acc + inv.cantidad, 0) || itemToAdd.stock || 0);

    setCart(prevCart => {

      const existing = prevCart.find(item => item.id === itemToAdd.id && item.sucursal_id === itemToAdd.sucursal_id);

      if (existing) {

        if (existing.quantity >= stockDisponible) {

          alert(`Solo tenemos ${stockDisponible} unidades disponibles. ✨`);

          return prevCart;

        }

        return prevCart.map(item =>

          (item.id === itemToAdd.id && item.sucursal_id === itemToAdd.sucursal_id) ? { ...item, quantity: item.quantity + (itemToAdd.quantity || 1) } : item

        );

      }

      return [...prevCart, {

        ...itemToAdd,

        quantity: itemToAdd.quantity || 1,

        selected: true,

        stockMax: stockDisponible,

        precio: itemToAdd.precio

      }];

    });

    setIsCartOpen(true);

  };

  const updateQuantity = (id, delta) => {

    setCart(prevCart => prevCart.map(item => {

      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        if (delta > 0 && newQty > (item.stockMax || 999)) {
          alert("Límite de stock alcanzado 🌸");
          return item;

        }

        return { ...item, quantity: newQty };

      }

      return item;

    }));

  };


  const removeFromCart = (id) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  const clearCart = () => {

    setCart([]);

    localStorage.removeItem('jai_cart');

  };



  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);



  // --- SECCIÓN TOTALES OPTIMIZADA CON EL FILTRO DE LIQUIDACIÓN SEGURO ---

  const cartTotal = cart.reduce((acc, item) => {

    if (!item.selected) return acc;



    let precioArticulo = Number(item.precio) || 0;



    // VALIDACIÓN DE OUTLET LOGÍSTICO: Validamos si este item tiene una promoción de liquidación activa

    if (item.promocion_nombre && item.promocion_nombre.includes('[LIQUIDACION_MIN_')) {

      try {

        // Extraemos inteligentemente la antigüedad límite en meses definida en el panel administrativo

        const mesesExtraidos = parseInt(item.promocion_nombre.split('_MESES]')[0].split('MIN_')[1]);

       

        if (!isNaN(mesesExtraidos)) {

          // Tomamos la fecha en que diste de alta el collar/accesorio en la tabla productos

          const fechaRegistroProducto = item.created_at ? new Date(item.created_at) : new Date();

          const limiteFechaOutlet = new Date();

          const limiteFechaOutletCalculada = new Date(limiteFechaOutlet.setMonth(limiteFechaOutlet.getMonth() - mesesExtraidos));



          // BLINDAJE DE COLECCIÓN NUEVA: Si el artículo es más nuevo que el límite estipulado,

          // se cancela la oferta y vuelve a su precio original base.

          if (fechaRegistroProducto > limiteFechaOutletCalculada) {

            precioArticulo = Number(item.precio_original_base) || Number(item.precio) || 0;

          }

        }

      } catch (err) {

        // Modificación segura para evitar caídas

        console.error("Validación de Outlet omitida para evitar caídas:", err);

      }

    }



    return acc + (precioArticulo * item.quantity);

  }, 0);



  return (

    <CartContext.Provider value={{

      cart, cartCount, cartTotal, isCartOpen, setIsCartOpen,

      addToCart, updateQuantity, removeFromCart, clearCart,

      toggleSelect, selectAll,

      searchQuery, setSearchQuery,

      categoryFilter, setCategoryFilter,

      sucursalFilter, setSucursalFilter,

      session,

      language, setLanguage, currency, setCurrency, t, formatPrice

    }}>

      {children}

    </CartContext.Provider>

  );

};



export const useCart = () => useContext(CartContext);