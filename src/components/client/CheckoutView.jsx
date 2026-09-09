import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { supabase } from '../../api/supabaseClient';
import { MapPin, Truck, MessageCircle, ArrowLeft, ShieldCheck, Ticket, Check, CreditCard, Landmark, Banknote, Store, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './CheckoutView.css';

const CheckoutView = () => {
  const { cart, cartTotal, clearCart, sucursalFilter } = useCart();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const sucursalesNombres = {
    1: 'Tampico / Ciudad Madero',
    2: 'Sucursal Pánuco',
    3: 'Sucursal El Higo'
  };

  const [envioData, setEnvioData] = useState({ calle: '', ciudad: '', cp: '', estado: '', notas: '' });
  const [metodoEntrega, setMetodoEntrega] = useState('recogida');
  const [metodoPago, setMetodoPago] = useState('transferencia');
 
  // NUEVO ESTADO: Guardamos la zona geográfica del cliente de forma explícita
  const [zonaGeografica, setZonaGeografica] = useState('tampico');
  const [sucursalRecogida, setSucursalRecogida] = useState(sucursalFilter || 1);

  const [codigoCupon, setCodigoCupon] = useState('');
  const [cuponAplicado, setCuponAplicado] = useState(null);
  const [errorCupon, setErrorCupon] = useState('');

  // --- NUEVA LÓGICA: Costo de envío dinámico recuperado de Supabase ---
  const [costoEnvio, setCostoEnvio] = useState(0);

  useEffect(() => {
    const consultarCostoEnvio = async () => {
      try {
        const { data, error } = await supabase
          .from('ajustes_sistema')
          .select('valor')
          .eq('clave', 'COSTO_ENVIO_ESTANDAR')
          .maybeSingle(); // Usamos maybeSingle para evitar excepciones duras si tarda en responder
        
        if (data && data.valor && !error) {
          const precioConvertido = Number(data.valor.toString().trim());
          if (!isNaN(precioConvertido)) {
            setCostoEnvio(precioConvertido);
          } else {
            setCostoEnvio(120); // Fallback secundario razonable
          }
        } else {
          setCostoEnvio(120); // Fallback si no encuentra la clave o está restringido por RLS
        }
      } catch (err) {
        setCostoEnvio(120);
      }
    };

    // NUEVO REFUERZO: Detectar la ciudad nativa del cliente desde la base de datos para asignar los tiempos de forma estricta
    const detectarCiudadCliente = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession?.user?.id) {
          const { data: clienteDb } = await supabase
            .from('clientes')
            .select('ciudad')
            .eq('id', currentSession.user.id)
            .maybeSingle();
          
          if (clienteDb?.ciudad) {
            const ciudadLimpa = clienteDb.ciudad.toLowerCase().trim();
            if (ciudadLimpa.includes('tampico')) setZonaGeografica('tampico');
            else if (ciudadLimpa.includes('madero')) setZonaGeografica('madero');
            else if (ciudadLimpa.includes('panuco') || ciudadLimpa.includes('pánuco')) setZonaGeografica('panuco');
            else if (ciudadLimpa.includes('higo')) setZonaGeografica('elhigo');
            else setZonaGeografica('paqueteria');
          }
        }
      } catch (err) {
        console.log("Error detectando ciudad base:", err);
      }
    };

    consultarCostoEnvio();
    detectarCiudadCliente();
  }, []);

  // Sincronizar automáticamente la sucursal de base logística según la zona declarada por el cliente
  useEffect(() => {
    if (zonaGeografica === 'tampico' || zonaGeografica === 'madero') {
      setSucursalRecogida(1);
    } else if (zonaGeografica === 'panuco') {
      setSucursalRecogida(2);
    } else if (zonaGeografica === 'elhigo') {
      setSucursalRecogida(3);
    }
  }, [zonaGeografica]);

  // Si no pertenece a los tres lugares indicados, se envía por paquetería externa automáticamente
  const esPorPaqueteria = zonaGeografica === 'paqueteria';
 
  // Determinación estricta de la aplicación del costo de envío
  const costoEnvioAplicado = (metodoEntrega === 'envio' || esPorPaqueteria) ? costoEnvio : 0;
 
  const calcularDescuento = () => {
    if (!cuponAplicado) return 0;
    return cuponAplicado.tipo === 'porcentaje'
      ? cartTotal * (cuponAplicado.valor / 100)
      : cuponAplicado.valor;
  };

  const descuentoTotal = calcularDescuento();
 
  // Suma dinámica basada en el estado obtenido de Supabase
  const totalFinal = cartTotal + costoEnvioAplicado - descuentoTotal;

  // --- NUEVA LÓGICA AGREGADA: Detectar descuento interno de productos ---
  const ahorroInternoProductos = cart.reduce((acc, item) => {
    const precioBase = item.precio_original || item.precio;
    return acc + (precioBase > item.precio ? (precioBase - item.precio) * item.quantity : 0);
  }, 0);

  const handleValidarCupon = async () => {
    if (!codigoCupon) return;
    setErrorCupon('');
    try {
      const { data, error } = await supabase
        .from('cupones').select('*')
        .eq('codigo', codigoCupon.toUpperCase()).eq('activo', true).single();

      if (error || !data) {
        setErrorCupon('🌸 Cupón no válido');
        setCuponAplicado(null);
        return;
      }

      // VALIDACIÓN CON TUS COLUMNAS REALES: 'usos_actuales' y 'uso_maximo'
      const actuales = data.usos_actuales || 0;
      const maximo = data.uso_maximo || null;

      if (maximo !== null && actuales >= maximo) {
        setErrorCupon('🌸 Ya alcanzó el límite de usar este cupón');
        setCuponAplicado(null);
        return;
      }

      setCuponAplicado(data);
      setCodigoCupon(''); // Limpiar el input tras aplicar con éxito
    } catch (err) { setErrorCupon('Error al validar'); }
  };

  // --- NUEVA FUNCIÓN: Eliminar cupón ---
  const handleEliminarCupon = () => {
    setCuponAplicado(null);
    setErrorCupon('');
    setCodigoCupon('');
  };

  const descontarStockDB = async () => {
    for (const item of cart) {
      if (item.es_variante) {
        const { data: vData } = await supabase.from('producto_variantes').select('stock').eq('id', item.id).single();
        if (vData) await supabase.from('producto_variantes').update({ stock: vData.stock - item.quantity }).eq('id', item.id);
      } else {
        const { data: pData } = await supabase.from('productos').select('stock').eq('id', item.id).single();
        if (pData) await supabase.from('productos').update({ stock: pData.stock - item.quantity }).eq('id', item.id);
        
        // Descontar del almacén físico exacto amarrado al producto
        const almacenaDescontar = item.sucursal_id || sucursalRecogida;
        const { data: invData } = await supabase.from('inventario_sucursal').select('cantidad').eq('producto_id', item.id).eq('sucursal_id', almacenaDescontar).maybeSingle();
        if (invData) await supabase.from('inventario_sucursal').update({ cantidad: invData.cantidad - item.quantity }).eq('producto_id', item.id).eq('sucursal_id', almacenaDescontar);
      }
    }

    // SI HAY UN CUPÓN APLICADO, INCREMENTAMOS EN +1 LA COLUMNA 'usos_actuales' EN TU TABLA DE SUPABASE
    if (cuponAplicado) {
      const nuevosUsos = (cuponAplicado.usos_actuales || 0) + 1;
      await supabase
        .from('cupones')
        .update({ usos_actuales: nuevosUsos })
        .eq('id', cuponAplicado.id);
    }
  };

  const handleFinishOrder = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession) { alert("🌸 Inicia sesión de nuevo."); return; }
    
    if ((metodoEntrega === 'envio' || esPorPaqueteria) && (!envioData.calle || !envioData.ciudad || !envioData.cp)) {
      alert("🌸 Completa tu dirección de envío.");
      return;
    }

    setIsProcessing(true);
    try {
      await descontarStockDB();
      const { data: clienteDb } = await supabase.from('clientes').select('*').eq('id', currentSession.user.id).single();
      const nombreCliente = clienteDb ? `${clienteDb.nombre} ${clienteDb.apellidos}` : "Estimado Cliente";
      const ciudadOrigenCliente = clienteDb?.ciudad || zonaGeografica.toUpperCase();

      // CORRECCIÓN DE COLUMNAS EXACTAS SEGÚN TU TABLA DE ORDENES DE SUPABASE:
      const { data: nuevaOrden, error: errorOrden } = await supabase
        .from('ordenes')
        .insert([{
          cliente_id: currentSession.user.id,
          total: totalFinal,
          tipo_entrega: esPorPaqueteria ? 'paqueteria' : metodoEntrega,
          metodo_pago: metodoPago,
          sucursal_id: sucursalRecogida,
          direccion_completa: (metodoEntrega === 'envio' || esPorPaqueteria)
            ? `${envioData.calle}, ${envioData.ciudad}`
            : `Punto/Sucursal: ${sucursalesNombres[sucursalRecogida]}`,
          codigo_postal: (metodoEntrega === 'envio' || esPorPaqueteria) ? envioData.cp : null, // <- CAMBIADO DE code_postal A codigo_postal
          notas_envio: envioData.notas || null, // <- CORREGIDO PARA QUE CAPTURE envioData.notas CORRECTAMENTE
          estado: 'Pendiente',
          cupon_id: cuponAplicado ? cuponAplicado.id : null,
          descuento_applied: descuentoTotal + ahorroInternoProductos,
          monto_descuento: descuentoTotal + ahorroInternoProductos,
          cliente_email: currentSession.user.email || null
        }])
        .select().single();
        
      if (errorOrden) throw errorOrden;

      const detalles = cart.map(item => ({
        orden_id: nuevaOrden.id,
        producto_id: item.es_variante ? null : item.id,
        variante_id: item.es_variante ? item.id : null,
        cantidad: item.quantity,
        precio_unitario: item.precio
      }));
      await supabase.from('detalles_orden').insert(detalles);

      const folio = nuevaOrden.id.toString().slice(-5).toUpperCase();
      
      // LÓGICA DE DETECCIÓN INDIVIDUALIZADA CORREGIDA SIN CONTAGIOS LOGÍSTICOS
      let productosLista = "";

      cart.forEach(item => {
        const esRamo = item.categoria_id === 10 || (item.sku && item.sku.toUpperCase().startsWith('RAM'));
        let avisoTiempoItem = " [⚡ Entrega Inmediata]";

        if (esPorPaqueteria) {
          avisoTiempoItem = " [📦 Mando a Domicilio - Envío Nacional por Paquetería]";
        } else if (esRamo) {
          avisoTiempoItem = " [⏳ Retardo 3-5 días - Producto Artesanal]";
        } else {
          const deOtraTienda = Number(item.sucursal_id) !== Number(sucursalRecogida);
          if (deOtraTienda) {
            const tiendaNombre = item.sucursal_id === 2 ? 'Pánuco' : item.sucursal_id === 3 ? 'El Higo' : 'Tampico';
            avisoTiempoItem = ` [⏳ Retardo por traslado - Se traerá desde Almacén de ${tiendaNombre}]`;
          }
        }

        const tagOferta = (item.precio_original || item.precio) > item.precio ? " [🏷️ Oferta]" : "";
        productosLista += `• ${item.quantity}x ${item.nombre}${tagOferta}${avisoTiempoItem}\n`;
      });

      let textoModalidad = "";
      if (esPorPaqueteria) {
        textoModalidad = "📦 Envío Nacional por Paquetería";
      } else if (metodoEntrega === 'envio') {
        textoModalidad = "🚚 Envío Local a Domicilio";
      } else {
        textoModalidad = sucursalRecogida === 1 ? "🏠 Recoger en punto (Tampico/Madero)" : `🏢 Recoger en ${sucursalesNombres[sucursalRecogida]}`;
      }

      // CADENA GLOBAL PARA WHATSAPP
      let msg = "🌸 *CONFIRMACIÓN DE PEDIDO - JAI TRES HERMANAS* 🌸\n\n" +
                "Hola, gracias por elegirnos. Hemos recibido tu solicitud con éxito.\n\n" +
                "*DETALLES DEL CLIENTE:*\n" +
                "━━━━━━━━━━━━━━━━━━━━\n" +
                `*Folio:* #${folio}\n` +
                `*Nombre:* ${nombreCliente}\n` +
                `*Origen:* ${ciudadOrigenCliente}\n` +
                "━━━━━━━━━━━━━━━━━━━━\n\n" +
                "*LOGÍSTICA DE ENTREGA:*\n" +
                "━━━━━━━━━━━━━━━━━━━━\n" +
                `*Destino:* ${(metodoEntrega === 'envio' || esPorPaqueteria) ? envioData.ciudad : sucursalesNombres[sucursalRecogida]}\n` +
                `*Modalidad:* ${textoModalidad}\n` +
                `*Pago:* ${metodoPago.toUpperCase()}\n` +
                "━━━━━━━━━━━━━━━━━━━━\n\n" +
                `*PRODUCTOS Y TIEMPOS ESTIMADOS:*\n${productosLista}\n` +
                "*RESUMEN FINANCIERO:*\n" +
                `Subtotal: $${(cartTotal + ahorroInternoProductos).toFixed(2)}\n`;

      if (ahorroInternoProductos > 0) msg += `Ahorro Productos: -$${ahorroInternoProductos.toFixed(2)}\n`;
      if (cuponAplicado) msg += `Cupón (${cuponAplicado.codigo}): -$${descuentoTotal.toFixed(2)}\n`;
      if (descuentoTotal + ahorroInternoProductos > 0) {
        msg += `*Ahorro Total: -$${(descuentoTotal + ahorroInternoProductos).toFixed(2)}*\n`;
      }
      if (costoEnvioAplicado > 0) msg += `Envío: $${costoEnvioAplicado.toFixed(2)}\n`;
      msg += `*TOTAL FINAL: $${totalFinal.toFixed(2)}*\n\n` +
             "*DATOS PARA PAGO:*\n";
      
      if(metodoPago === 'transferencia') {
        msg += "🏦 *CLABE:* 728969000073514250 (Spin by Oxxo)\n";
      } else if (metodoPago === 'oxxo') {
        msg += "💳 *Tarjeta:* 4217470268483332 (Depósito Oxxo)\n";
      } else {
        msg += "💵 *Efectivo:* Pago al recoger en sucursal o punto de entrega.\n";
      }

      msg += "\n━━━━━━━━━━━━━━━━━━━━\n" +
             "*PASO FINAL:* Por favor, envía captura de tu pago o confirma tu asistencia por este chat. En breve, un asesor confirmará tu pedido personalmente. ¡Gracias por tu confianza! 🌸";

      // DETONANTE DE WHATSAPP IMPECABLE
      window.open(`https://wa.me/528331376553?text=${encodeURIComponent(msg)}`, '_blank');
      
      clearCart();
      navigate('/pedido-exitoso');
      
    } catch (error) { alert("Error: " + error.message); } finally { setIsProcessing(false); }
  };

  return (
    <div className="checkout-page-pro">
      <div className="checkout-nav">
        <button onClick={() => navigate(-1)} className="btn-back"><ArrowLeft size={18}/> REGRESAR</button>
        <div className="secure-title">JAI TRES HERMANAS | <ShieldCheck size={16}/> SECURE CHECKOUT</div>
      </div>

      <div className="checkout-grid">
        <div className="checkout-main">
          <section className="checkout-section">
            <h3 className="section-header"><MapPin size={20}/> 1. Ubicación y Modalidad de entrega</h3>
            
            <p className="label-sm" style={{ marginBottom: '8px' }}>Selecciona tu localidad geográfica:</p>
            <select
              value={zonaGeografica}
              onChange={(e) => setZonaGeografica(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', marginBottom: '20px', fontSize: '0.95rem' }}
            >
              <option value="tampico">Tampico</option>
              <option value="madero">Ciudad Madero</option>
              <option value="panuco">Pánuco</option>
              <option value="elhigo">El Higo</option>
              <option value="paqueteria">Otro Lugar (Envío por Paquetería)</option>
            </select>

            {!esPorPaqueteria ? (
              <div className="delivery-luxury-selector">
                 <div
                    className={`luxury-option ${metodoEntrega === 'recogida' ? 'active' : ''}`}
                    onClick={() => setMetodoEntrega('recogida')}
                 >
                   <Store size={24} />
                   <div className="luxury-text">
                     <strong>Recoger en Sucursal</strong>
                     <span>Tampico, Pánuco o El Higo</span>
                   </div>
                   {metodoEntrega === 'recogida' && <Check size={18} className="check-badge" />}
                 </div>

                 <div
                    className={`luxury-option ${metodoEntrega === 'envio' ? 'active' : ''}`}
                    onClick={() => setMetodoEntrega('envio')}
                 >
                   <Truck size={24} />
                   <div className="luxury-text">
                     <strong>Envío a Domicilio Local</strong>
                     <span>Entrega segura en tu hogar</span>
                   </div>
                   {metodoEntrega === 'envio' && <Check size={18} className="check-badge" />}
                 </div>
              </div>
            ) : (
              <p style={{ color: '#cf69d4', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '15px' }}>
                📦 Al no residir en zona de sucursales directas, tu pedido se procesará automáticamente vía Paquetería Nacional.
              </p>
            )}

            {metodoEntrega === 'recogida' && !esPorPaqueteria && (
              <div className="sucursal-picker animate-in" style={{ marginTop: '10px' }}>
                <p className="label-sm">Punto de entrega asignado automáticamente:</p>
                <div style={{ padding: '12px', background: '#fff7fd', border: '1px solid #cf69d4', borderRadius: '6px', fontWeight: 'bold' }}>
                  {sucursalesNombres[sucursalRecogida]}
                </div>
                {(zonaGeografica === 'tampico' || zonaGeografica === 'madero') && (
                  <p className="hint-text">✨ En Tampico/Madero nos pondremos en contacto contigo para acordar el punto de entrega de mutuo acuerdo.</p>
                )}
              </div>
            )}
             
            {(metodoEntrega === 'envio' || esPorPaqueteria) && (
              <div className="address-fields animate-in" style={{ marginTop: '15px' }}>
                <input type="text" placeholder="Calle, Colonia y Número" className="full-w" onChange={e => setEnvioData({...envioData, calle: e.target.value})} />
                <input type="text" placeholder="Ciudad" onChange={e => setEnvioData({...envioData, ciudad: e.target.value})} />
                <input type="text" placeholder="Estado" onChange={e => setEnvioData({...envioData, estado: e.target.value})} />
                <input type="text" placeholder="CP" onChange={e => setEnvioData({...envioData, cp: e.target.value})} />
              </div>
            )}
          </section>

          <section className="checkout-section">
            <h3 className="section-header"><Banknote size={20}/> 2. Método de pago</h3>
            <div className="payment-options-list">
              <div className={`pay-item ${metodoPago === 'transferencia' ? 'selected' : ''}`} onClick={() => setMetodoPago('transferencia')}>
                <div className="pay-top"><Landmark size={22}/> <strong>Transferencia (SPEI)</strong></div>
                {metodoPago === 'transferencia' && (
                  <div className="pay-info-box">
                    <p>CLABE: <span>728969000073514250</span></p>
                    <p>Banco: Spin Oxxo</p>
                  </div>
                )}
              </div>
              <div className={`pay-item ${metodoPago === 'oxxo' ? 'selected' : ''}`} onClick={() => setMetodoPago('oxxo')}>
                <div className="pay-top"><CreditCard size={22}/> <strong>Depósito Oxxo / Tarjeta</strong></div>
                {metodoPago === 'oxxo' && (
                  <div className="pay-info-box">
                    <p>Tarjeta: <span>4217470268483332</span></p>
                    <p>Pago directo en caja Oxxo</p>
                  </div>
                )}
              </div>
              {!esPorPaqueteria && (
                <div className={`pay-item ${metodoPago === 'efectivo' ? 'selected' : ''}`} onClick={() => setMetodoPago('efectivo')}>
                  <div className="pay-top"><Banknote size={22}/> <strong>Efectivo</strong></div>
                  {metodoPago === 'efectivo' && (
                    <div className="pay-info-box">
                      <p>Pago directo al momento de la entrega o en sucursal.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="checkout-section">
            <h3 className="section-header"><MessageCircle size={20}/> 3. Instrucciones especiales</h3>
            <textarea placeholder="Ej: Es para un regalo, por favor no incluir ticket de precio..." onChange={e => setEnvioData({...envioData, notas: e.target.value})}></textarea>
          </section>
        </div>

        <aside className="checkout-aside">
          <div className="order-summary-card">
            <h3>Tu Pedido</h3>
            
            {!cuponAplicado ? (
              <div className="coupon-inline">
                <input
                  type="text"
                  placeholder="Código Cupón"
                  value={codigoCupon}
                  onChange={e => setCodigoCupon(e.target.value)}
                />
                <button onClick={handleValidarCupon}>APLICAR</button>
              </div>
            ) : (
              <div className="applied-coupon-badge animate-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fdf0ff', padding: '10px', borderRadius: '8px', marginBottom: '15px', border: '1px dashed #cf69d4' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cf69d4' }}>
                  <Ticket size={16} />
                  <span>CUPÓN: <strong>{cuponAplicado.codigo}</strong></span>
                </div>
                <button onClick={handleEliminarCupon} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>
            )}
            
            {errorCupon && <p style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>{errorCupon}</p>}

            <div className="summary-breakdown">
              <div className="line"><span>Subtotal:</span><span>${(cartTotal + ahorroInternoProductos).toFixed(2)}</span></div>
              
              {ahorroInternoProductos > 0 && (
                <div className="line disc" style={{ color: '#999' }}>
                  <span>Ahorro Productos:</span>
                  <span>-${ahorroInternoProductos.toFixed(2)}</span>
                </div>
              )}
              
              {descuentoTotal > 0 && (
                <div className="line disc" style={{ color: '#999' }}>
                  <span>Descuento Cupón:</span>
                  <span>-${descuentoTotal.toFixed(2)}</span>
                </div>
              )}

              {(descuentoTotal + ahorroInternoProductos > 0) && (
                <div className="line total-savings" style={{ color: '#cf69d4', fontWeight: 'bold', borderTop: '1px solid #eee', paddingTop: '5px' }}>
                  <span>Ahorro Total:</span>
                  <span>-${(descuentoTotal + ahorroInternoProductos).toFixed(2)}</span>
                </div>
              )}
              
              <div className="line"><span>Envío:</span><span>{costoEnvioAplicado > 0 ? `$${costoEnvioAplicado.toFixed(2)}` : 'Gratis'}</span></div>
              
              <div className="line total" style={{ borderTop: '2px solid #333', marginTop: '10px', paddingTop: '10px' }}>
                <span>Total:</span>
                <span>${totalFinal.toFixed(2)}</span>
              </div>
            </div>

            <button className="btn-finish-luxury" onClick={handleFinishOrder} disabled={isProcessing}>
              {isProcessing ? "PROCESANDO..." : `REALIZAR PEDIDO ($${totalFinal.toFixed(2)})`}
            </button>
            <p className="footer-note">Al confirmar, serás redirigido a WhatsApp para finalizar los detalles. 🌸</p>
          </div>
        </aside>
      </div>
    </div> 
  );
};

export default CheckoutView;