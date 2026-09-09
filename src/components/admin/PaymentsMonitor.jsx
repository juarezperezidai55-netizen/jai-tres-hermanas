import React, { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import {  
  Wallet, ArrowDownRight, Banknote, TrendingUp, Tag, X, PackageCheck, AlertCircle 
} from 'lucide-react';
import './PaymentsMonitor.css';

const PaymentsMonitor = ({ userRole }) => {
  const [loading, setLoading] = useState(false);
  const [gastos, setGastos] = useState([]);
  const [ordenesHoy, setOrdenesHoy] = useState([]);
  const [showGastoModal, setShowGastoModal] = useState(false);
  const [nuevoGasto, setNuevoGasto] = useState({ descripcion: '', monto: '' });
  const [sessionUser, setSessionUser] = useState(null);
  const [costoEnvioEstandar, setCostoEnvioEstandar] = useState(0);

  // --- ARQUEO COMPLETO ---
  const [billetes, setBilletes] = useState({ 
    500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 2: 0, 1: 0 
  });

  const [fondoInicial, setFondoInicial] = useState(0);
  const [showAperturaModal, setShowAperturaModal] = useState(false);
  const [cajaExistenteDB, setCajaExistenteDB] = useState(null);

  useEffect(() => {
    const obtenerSesion = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setSessionUser(session.user);
      }
    };

    obtenerSesion();
    consultarCostoEnvioDB();
    verificarCajaGlobalActiva();
  }, []);

  // --- LÓGICA SIMPLIFICADA: Una sola Caja Global para monitorear el E-commerce ---
  const verificarCajaGlobalActiva = async () => {
    try {
      // Buscamos si ya hay un turno abierto de forma contable en Supabase
      const { data, error } = await supabase
        .from('cierres_caja')
        .select('*')
        .eq('estado', 'abierto') 
        .maybeSingle();

      if (data && !error) {
        setCajaExistenteDB(data);
        setFondoInicial(data.fondo_inicial || 0);
        fetchDatosCaja();
      } else {
        // Si no hay registro en la DB, revisamos el LocalStorage global
        const salvo = localStorage.getItem('jai_fondo_inicial_global');
        if (salvo) {
          setFondoInicial(parseFloat(salvo));
          fetchDatosCaja();
        } else {
          setShowAperturaModal(true);
        }
      }
    } catch (err) {
      console.error(err);
      fetchDatosCaja();
    }
  };

  const consultarCostoEnvioDB = async () => {
    try {
      const { data, error } = await supabase
        .from('ajustes_sistema')
        .select('valor')
        .eq('clave', 'COSTO_ENVIO_ESTANDAR')
        .maybeSingle();
      
      if (data && data.valor && !error) {
        const precioNumerico = Number(data.valor.toString().trim());
        if (!isNaN(precioNumerico)) {
          setCostoEnvioEstandar(precioNumerico);
        } else {
          setCostoEnvioEstandar(50);
        }
      } else {
        setCostoEnvioEstandar(50);
      }
    } catch (err) {
      setCostoEnvioEstandar(50);
    }
  };

  const fetchDatosCaja = async () => {
    // Traemos absolutamente TODAS las órdenes de la página en este turno que no se han cortado
    const { data: ords } = await supabase
      .from('ordenes')
      .select(`
        *,
        detalles_orden (
          cantidad,
          productos (
            costo,
            costo_base
          )
        )
      `)
      .is('cierre_id', null);
    
    const { data: gts } = await supabase
      .from('gastos_caja')
      .select('*')
      .is('cierre_id', null);

    setOrdenesHoy(ords || []);
    setGastos(gts || []);
  };

  const handleRegistrarGasto = async () => {
    if(!nuevoGasto.monto || !nuevoGasto.descripcion) return alert("Llena todos los campos 🌸");
    const { error } = await supabase.from('gastos_caja').insert([
      { 
        descripcion: nuevoGasto.descripcion, 
        monto: parseFloat(nuevoGasto.monto),
        fecha: new Date().toISOString()
      }
    ]);
    if(!error) {
      setShowGastoModal(false);
      setNuevoGasto({ descripcion: '', monto: '' });
      fetchDatosCaja();
    }
  };

  const ventasHoy = ordenesHoy.filter(o => o.estado === 'Pagado' || o.estado === 'Enviado');
  
  const efectivoHoy = ventasHoy
    .filter(o => o.metodo_pago === 'Efectivo' || !o.metodo_pago || o.metodo_pago === 'efectivo')
    .reduce((acc, curr) => acc + (curr.total || 0), 0);
    
  const transferenciaHoy = ventasHoy
    .filter(o => o.metodo_pago === 'Transferencia' || o.metodo_pago === 'transferencia' || o.metodo_pago === 'oxxo')
    .reduce((acc, curr) => acc + (curr.total || 0), 0);

  const totalGastosHoy = gastos.reduce((acc, curr) => acc + (curr.monto || 0), 0);
  const totalDescuentosHoy = ventasHoy.reduce((acc, curr) => acc + (curr.monto_descuento || curr.descuento_applied || 0), 0);
  
  const totalEnviosHoy = ventasHoy
    .filter(o => o.tipo_entrega && o.tipo_entrega.toLowerCase() !== 'recogida' && o.tipo_entrega.toLowerCase() !== 'sucursal')
    .length * costoEnvioEstandar;

  const totalInversionCalculada = ventasHoy.reduce((accOrden, orden) => {
    const costoDetalles = (orden.detalles_orden || []).reduce((accDetalle, detalle) => {
      const costoProducto = detalle.productos?.costo_base || detalle.productos?.costo || 0;
      return accDetalle + (costoProducto * (detalle.cantidad || 0));
    }, 0);
    return accOrden + costoDetalles;
  }, 0);
  
  const balanceCajaFisica = (Number(fondoInicial) + efectivoHoy) - totalGastosHoy;
  const totalContado = Object.values(billetes).reduce((a, b) => a + b, 0);

  const totalVentasTurno = efectivoHoy + transferenciaHoy;
  const totalGananciaCalculada = totalVentasTurno - totalInversionCalculada - totalGastosHoy - totalEnviosHoy;

 const handleCierreCaja = async () => {
    if(window.confirm(`🌸 ¿Corte de Caja?\nEfectivo esperado: $${balanceCajaFisica.toFixed(2)}\nEfectivo contado: $${totalContado.toFixed(2)}`)) {
        try {
          setLoading(true);
          
          // 1. Insertamos el cierre contable
          const { data: cierre, error: errCierre } = await supabase.from('cierres_caja').insert([{
            total_ventas: totalVentasTurno,
            total_gastos: totalGastosHoy,
            total_efectivo: totalContado,
            total_transferencia: transferenciaHoy,
            total_inversion: totalInversionCalculada,
            total_ganancia: totalGananciaCalculada,
            total_envios: totalEnviosHoy,
            fondo_inicial: Number(fondoInicial),
            desglose_billetes: billetes,
            perfil_id: sessionUser ? sessionUser.id : null,
            fecha: new Date().toISOString().split('T')[0]
          }]).select().single();

          if (errCierre) throw errCierre; 

          // 2. Extraemos los IDs exactos de los arrays que el monitor ya calculó
          const idsOrdenes = ventasHoy.map(o => o.id);
          const idsGastos = gastos.map(g => g.id);

          // 3. Actualizamos las órdenes usando sus IDs específicos (Método Infallible)
          if (idsOrdenes.length > 0) {
            const { error: errOrd } = await supabase
              .from('ordenes')
              .update({ cierre_id: cierre.id })
              .in('id', idsOrdenes);
            if (errOrd) throw new Error("Error al amarrar las órdenes: " + errOrd.message);
          }

          // 4. Actualizamos los gastos usando sus IDs específicos
          if (idsGastos.length > 0) {
            const { error: errGts } = await supabase
              .from('gastos_caja')
              .update({ cierre_id: cierre.id })
              .in('id', idsGastos);
            if (errGts) throw new Error("Error al amarrar los gastos: " + errGts.message);
          }

          localStorage.removeItem('jai_fondo_inicial');
          alert("Cierre sincronizado con Finanzas ✨");
          window.location.reload();
          
        } catch (error) { 
          // Si algo falla, ahora sí te avisará el motivo exacto y no simulará éxito
          alert("Fallo en el corte: " + error.message); 
        } finally { 
          setLoading(false); 
        }
    }
};

  return (
    <div className="payments-pro-view">
      <div className="pay-header-pro">
        <div className="header-brand">
            <h2>Monitor de Pagos JAI 🌸</h2>
            <p>Sincronizado con Reportes Financieros e Integridad de Descuentos</p>
        </div>
        <div className="header-actions">
          {userRole !== 'vendedor' && (
            <button className="btn-action-luxury sec" onClick={() => setShowAperturaModal(true)}>
              <Wallet size={18} /> Fondo Inicial
            </button>
          )}
          <button className="btn-action-luxury pri" onClick={() => setShowGastoModal(true)}>
            <ArrowDownRight size={18} /> Registrar Gasto
          </button>
        </div>
      </div>

      <div className="pro-stats-grid">
        <div className="pro-card gray">
          <div className="card-icon-wrapper"><Wallet size={24} /></div>
          <div className="card-content">
            <span className="card-label">Fondo Inicial</span>
            <h3 className="card-value">${Number(fondoInicial).toFixed(2)}</h3>
          </div>
        </div>

        <div className="pro-card cash">
          <div className="card-icon-wrapper"><Banknote size={24} /></div>
          <div className="card-content">
            <span className="card-label">Efectivo Esperado</span>
            <h3 className="card-value">${balanceCajaFisica.toFixed(2)}</h3>
          </div>
        </div>

        <div className="pro-card physical">
          <div className="card-icon-wrapper"><PackageCheck size={24} /></div>
          <div className="card-content">
            <span className="card-label">Efectivo Físico</span>
            <h3 className={`card-value ${totalContado !== balanceCajaFisica ? "text-warning" : "text-success"}`}>
                ${totalContado.toFixed(2)}
            </h3>
          </div>
        </div>
        
        <div className="pro-card blue">
          <div className="card-icon-wrapper"><TrendingUp size={24} /></div>
          <div className="card-content">
            <span className="card-label">Transferencias</span>
            <h3 className="card-value">${transferenciaHoy.toFixed(2)}</h3>
          </div>
        </div>

        <div className="pro-card discount-card-jai">
          <div className="card-icon-wrapper"><Tag size={24} /></div>
          <div className="card-content">
            <span className="card-label">Descuentos Aplicados</span>
            <h3 className="card-value text-discount-pink">-${totalDescuentosHoy.toFixed(2)}</h3>
          </div>
        </div>
      </div>

      <div className="arqueo-grid-main">
        <div className="arqueo-section-card">
          <div className="section-title"><h4>Arqueo de Caja (Efectivo)</h4></div>
          <div className="billetes-flex">
            {[500, 200, 100, 50, 20, 10, 5, 2, 1].map(val => (
              <div key={val} className="denom-input-group">
                <label>{val >= 20 ? `Bill. $${val}` : `Mon. $${val}`}</label>
                <input 
                  type="number" 
                  placeholder="0" 
                  min="0"
                  onChange={e => setBilletes({...billetes, [val]: Number(e.target.value) * val})} 
                />
              </div>
            ))}
          </div>
          <div className="arqueo-summary">
            <div className="summary-row">
              <span>Total Contado:</span>
              <strong>${totalContado.toFixed(2)}</strong>
            </div>
            {totalContado !== balanceCajaFisica && (
              <div className="diff-badge"><AlertCircle size={14}/> Diferencia: ${(totalContado - balanceCajaFisica).toFixed(2)}</div>
            )}
          </div>

          {userRole === 'vendedor' ? (
            <div style={{ background: '#fff3cd', color: '#856404', padding: '12px', borderRadius: '8px', marginTop: '15px', fontSize: '13px', textAlign: 'center', fontWeight: '500' }}>
              📢 El botón de Cierre definitivo se encuentra deshabilitado para tu rol (Cajero/Vendedor). Solicítalo a tu Gerente.
            </div>
          ) : (
            <button onClick={handleCierreCaja} className="btn-cierre-final" disabled={loading}>
              {loading ? "Sincronizando..." : "Realizar Corte de Caja"}
            </button>
          )}
        </div>

        <div className="arqueo-right-container">
          <div className="gastos-section-card">
            <div className="section-title"><h4>Egresos de hoy</h4></div>
            <div className="gastos-list-container">
              {gastos.length > 0 ? (
                <table className="pro-mini-table">
                  <thead><tr><th>Concepto</th><th className="text-right">Monto</th></tr></thead>
                  <tbody>
                    {gastos.map((g, i) => (
                      <tr key={i}><td>{g.descripcion}</td><td className="text-right text-red">-${g.monto.toFixed(2)}</td></tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="empty-txt">No hay gastos registrados hoy.</p>}
            </div>
          </div>

          <div className="auditoria-preview-card">
            <div className="section-title"><h4>Previsualización de Cierre Contable</h4></div>
            <div className="auditoria-details">
              <div className="auditoria-row">
                <span>Ventas Totales del Turno:</span>
                <strong>${totalVentasTurno.toFixed(2)}</strong>
              </div>
              <div className="auditoria-row">
                <span>Inversión de Mercancía:</span>
                <span className="text-warning">-${totalInversionCalculada.toFixed(2)}</span>
              </div>
              <div className="auditoria-row">
                <span>Costos de Envío / Domicilio:</span>
                <span className="text-red">-${totalEnviosHoy.toFixed(2)}</span>
              </div>
              <div className="auditoria-divider"></div>
              <div className="auditoria-row total-ganancia">
                <span>Ganancia Real Neta:</span>
                <strong className={totalGananciaCalculada >= 0 ? "text-success" : "text-red"}>
                  ${totalGananciaCalculada.toFixed(2)}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL APERTURA */}
      {showAperturaModal && (
        <div className="jai-modal-overlay">
          <div className="jai-modal mini animate-pop">
            <h4>Apertura de Caja 🌸</h4>
            <div className="luxury-input-group">
              <span className="currency-symbol">$</span>
              <input type="number" value={fondoInicial} onChange={(e) => setFondoInicial(e.target.value)} />
            </div>
            <button className="btn-modal-confirm" onClick={async () => { 
              try {
                const { data } = await supabase.from('cierres_caja').insert([{
                  fondo_inicial: Number(fondoInicial),
                  perfil_id: sessionUser ? sessionUser.id : null,
                  estado: 'abierto',
                  total_ventas: 0,
                  total_gastos: 0,
                  total_efectivo: 0,
                  total_transferencia: 0,
                  total_inversion: 0,
                  total_ganancia: 0,
                  total_envios: 0
                }]).select().single();
                
                setCajaExistenteDB(data);
                localStorage.setItem('jai_fondo_inicial_global', fondoInicial);
                setShowAperturaModal(false); 
                fetchDatosCaja();
              } catch (e) {
                alert("Error al iniciar el turno global: " + e.message);
              }
            }}>Iniciar Día</button>
          </div>
        </div>
      )}

      {/* MODAL GASTOS */}
      {showGastoModal && (
        <div className="jai-modal-overlay">
          <div className="jai-modal mini animate-pop">
            <div className="modal-header-luxury">
                <h4>Nuevo Gasto</h4>
                <button className="close-x" onClick={() => setShowGastoModal(false)}><X/></button>
            </div>
            <div className="luxury-field">
                <label>Concepto</label>
                <input placeholder="Ej. Insumos" onChange={e => setNuevoGasto({...nuevoGasto, descripcion: e.target.value})} />
            </div>
           <div className="luxury-field">
                <label>Monto</label>
                <input type="number" placeholder="0.00" onChange={e => setNuevoGasto({...nuevoGasto, monto: e.target.value})} />
            </div>
            <button className="btn-modal-confirm red" onClick={handleRegistrarGasto}>Guardar Gasto</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsMonitor;