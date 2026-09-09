import React, { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import { 
  TrendingUp, Wallet, ArrowDownCircle, Truck, 
  PackageCheck, Calendar, Search, FileText, ShoppingCart, Tag, ChevronDown, ChevronUp
} from 'lucide-react';
import './FinanceView.css';

const FinanceView = () => {
  const [periodo, setPeriodo] = useState('mes'); 
  const [searchTerm, setSearchTerm] = useState("");
  const [ordenesTurno, setOrdenesTurno] = useState([]);
  const [gastos, setGastos] = useState([]); 
  const [costoEnvioDinamico, setCostoEnvioDinamico] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Estado para controlar qué orden está expandida y ver sus productos comprados
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    fetchCostoEnvio();
    fetchDatosFinancieros();
  }, [periodo]);

  const fetchCostoEnvio = async () => {
    try {
      const { data } = await supabase
        .from('ajustes_sistema')
        .select('valor')
        .eq('clave', 'COSTO_ENVIO_ESTANDAR')
        .maybeSingle();
      if (data?.valor) {
        setCostoEnvioDinamico(Number(data.valor));
      } else {
        setCostoEnvioDinamico(50); // Fallback seguro
      }
    } catch (err) {
      setCostoEnvioDinamico(50);
    }
  };

  const fetchDatosFinancieros = async () => {
    setLoading(true);
    try {
      let fechaFiltro = new Date();
      if (periodo === 'hoy') fechaFiltro.setHours(0, 0, 0, 0);
      else if (periodo === 'semana') fechaFiltro.setDate(fechaFiltro.getDate() - 7);
      else if (periodo === 'mes') fechaFiltro.setMonth(fechaFiltro.getMonth() - 1);
      else if (periodo === 'anio') fechaFiltro.setFullYear(fechaFiltro.getFullYear() - 1);

      // Traemos las órdenes reales directo de la tabla pública incluyendo nombre del producto para auditoría visual
      const { data: ords, error: errVts } = await supabase
        .from('ordenes')
        .select(`
          *,
          detalles_orden (
            cantidad,
            precio_unitario,
            productos (
              nombre,
              costo_base,
              costo
            )
          )
        `)
        .gte('created_at', fechaFiltro.toISOString())
        .order('created_at', { ascending: false });

      const { data: gts, error: errGts } = await supabase
        .from('gastos_caja')
        .select('*')
        .gte('fecha', fechaFiltro.toISOString())
        .order('fecha', { ascending: false });

      if (errVts || errGts) throw (errVts || errGts);

      setOrdenesTurno(ords || []);
      setGastos(gts || []);

    } catch (error) {
      console.error("Error en Módulo de Finanzas JAI:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Alternador de expansión de la fila de orden
  const toggleExpandirOrden = (id) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  // --- FILTRADO DE ÓRDENES PROCESADAS ---
  const ordenesValidas = ordenesTurno.filter(o => o.estado === 'Pagado' || o.estado === 'Enviado');

  // --- CÁLCULO DE TOTALES EN TIEMPO REAL (Idéntico a tu Monitor de Pagos) ---
  const totalVentasBrutas = ordenesValidas.reduce((acc, curr) => acc + (curr.total || 0), 0);
  
  const totalGastos = gastos.reduce((acc, curr) => acc + (curr.monto || 0), 0);
  
  // Solución al Bug de Descuentos: Suma de forma inteligente cualquier variante de tus columnas
  const totalDescuentos = ordenesValidas.reduce((acc, curr) => {
    const desc = curr.descuento_applied || curr.monto_descuento || 0;
    return acc + Number(desc);
  }, 0);

  // Solución al Bug de Paquetería: Detecta si es envío a domicilio y calcula dinámicamente
  const totalEnvios = ordenesValidas.filter(o => {
    const entrega = o.tipo_entrega ? o.tipo_entrega.toLowerCase() : '';
    return entrega !== 'recogida' && entrega !== 'sucursal';
  }).length * costoEnvioDinamico;

  // Inversión Real Relacional
  const totalInversion = ordenesValidas.reduce((accOrden, orden) => {
    const costoDetalles = (orden.detalles_orden || []).reduce((accDetalle, detalle) => {
      const costoProd = detalle.productos?.costo_base || detalle.productos?.costo || 0;
      return accDetalle + (costoProd * (detalle.cantidad || 0));
    }, 0);
    return accOrden + costoDetalles;
  }, 0);

  // Utilidad Neta Real amarrada con egresos
  const utilidadReal = totalVentasBrutas - totalInversion - totalGastos - totalEnvios;

  // KPIs de Auditoría Corporativa para tu Tesis
  const margenUtilidad = totalVentasBrutas > 0 ? (utilidadReal / totalVentasBrutas) * 100 : 0;
  const roiCMV = totalInversion > 0 ? (utilidadReal / totalInversion) * 100 : 0;

  const agruparPorSeccion = () => {
    return (ordenesValidas || []).reduce((acc, item) => {
      const fecha = new Date(item.created_at);
      let titulo = periodo === 'hoy' ? "Movimientos de Hoy" : 
                   periodo === 'semana' ? fecha.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' }) :
                   periodo === 'mes' ? fecha.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }) :
                   `Año ${fecha.getFullYear()}`;

      if (!acc[titulo]) acc[titulo] = { listaVentas: [], listaGastos: [], totalGananciaVentas: 0, totalGastosSeccion: 0 };
      
      // Calcular ganancia por orden individual para el desglose visual
      const inversionOrden = (item.detalles_orden || []).reduce((a, b) => {
        const c = b.productos?.costo_base || b.productos?.costo || 0;
        return a + (c * b.cantidad);
      }, 0);
      const esEnvio = item.tipo_entrega && item.tipo_entrega.toLowerCase() !== 'recogida' && item.tipo_entrega.toLowerCase() !== 'sucursal';
      const envioOrden = esEnvio ? costoEnvioDinamico : 0;
      
      item.ganancia_calculada = (item.total || 0) - inversionOrden - envioOrden;

      acc[titulo].listaVentas.push(item);
      acc[titulo].totalGananciaVentas += item.ganancia_calculada;
      return acc;
    }, {});
  };

  const secciones = agruparPorSeccion();

  const handleCierreCajaGlobal = async () => {
    const filtrarPendientesCorte = ordenesValidas.filter(o => o.cierre_id === null);
    if(filtrarPendientesCorte.length === 0) return alert("✨ No hay órdenes pendientes de corte en este turno.");

    const confirmar = window.confirm(`🌸 ¿Deseas realizar la consolidación contable de caja?\nTotal Ventas a Sincronizar: $${totalVentasBrutas.toFixed(2)}`);
    if (!confirmar) return;

    try {
      const { data: cierre, error: errorCierre } = await supabase.from('cierres_caja').insert([{
        total_ventas: totalVentasBrutas,
        total_inversion: totalInversion,
        total_ganancia: utilidadReal,
        total_envios: totalEnvios,
        total_gastos: totalGastos,
        fecha: new Date().toISOString().split('T')[0]
      }]).select().single();

      if (errorCierre) throw errorCierre;

      await supabase
        .from('ordenes')
        .update({ cierre_id: cierre.id })
        .is('cierre_id', null)
        .in('estado', ['Pagado', 'Enviado']);

      await supabase
        .from('gastos_caja')
        .update({ cierre_id: cierre.id })
        .is('cierre_id', null);

      alert("✨ Caja consolidada y turnos cerrados con éxito en la base de datos.");
      fetchDatosFinancieros();
    } catch (err) {
      alert("Error en Sincronización Contable: " + err.message);
    }
  };

  return (
    <div className="finance-pro-wrapper">
      <header className="finance-pro-header">
        <div className="header-brand-section">
          <h1>Finanzas JAI <span className="flower-icon">🌸</span></h1>
          <p className="subtitle">Reporte inteligente de rendimiento, marketing e indicadores analíticos</p>
        </div>
        
        <div className="header-controls-section">
          <div className="search-box-pro">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Buscar folio de orden..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="period-tabs-pro">
            {['hoy', 'semana', 'mes', 'anio'].map((p) => (
              <button 
                key={p} 
                className={periodo === p ? 'tab-item active' : 'tab-item'} 
                onClick={() => setPeriodo(p)}
              >
                {p === 'anio' ? 'Año' : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          <div className="action-buttons-pro">
            <button className="btn-icon-pro print-btn" onClick={() => window.print()}>
              <FileText size={18}/> <span>Reporte</span>
            </button>
            <button className="btn-icon-pro corte-btn" onClick={handleCierreCajaGlobal}>
              <PackageCheck size={18} /> <span>Consolidar Caja</span>
            </button>
          </div>
        </div>
      </header>

      {/* KPI Dashboard */}
      <section className="kpi-dashboard">
        <div className="kpi-card total-sales">
          <div className="kpi-icon"><TrendingUp size={22} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Ventas Brutas</span>
            <h3 className="kpi-value">${totalVentasBrutas.toFixed(2)}</h3>
          </div>
        </div>

        <div className="kpi-card egresos">
          <div className="kpi-icon"><ArrowDownCircle size={22} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Gastos Operativos</span>
            <h3 className="kpi-value">-${totalGastos.toFixed(2)}</h3>
          </div>
        </div>

        <div className="kpi-card marketing-kpi">
          <div className="kpi-icon"><Tag size={22} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Descuentos Absorbidos</span>
            <h3 className="kpi-value">-${totalDescuentos.toFixed(2)}</h3>
          </div>
        </div>

        <div className="kpi-card utility-kpi highlight">
          <div className="kpi-icon"><Wallet size={22} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Utilidad Real Neta</span>
            <h3 className="kpi-value">${utilidadReal.toFixed(2)}</h3>
          </div>
        </div>

        <div className="kpi-card logistic-kpi">
          <div className="kpi-icon"><Truck size={22} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Paquetería Recaudada</span>
            <h3 className="kpi-value">${totalEnvios.toFixed(2)}</h3>
          </div>
        </div>
      </section>

      {/* Módulo de Auditoría Avanzada para Sustento de Tesis */}
      <section className="corporate-health-section animate-in">
        <div className="health-card-luxury">
          <h4>Auditoría de Salud Financiera y Control de Fraudes (IMS)</h4>
          <div className="health-grid-metrics">
            <div className="metric-box">
              <span className="metric-title">Margen de Utilidad Neta</span>
              <strong className="metric-number">{margenUtilidad.toFixed(1)}%</strong>
              <p className="metric-desc">Rentabilidad líquida real de la boutique JAI después de costos e inversiones.</p>
            </div>
            <div className="metric-box">
              <span className="metric-title">Retorno de Inversión (ROI de Stock)</span>
              <strong className="metric-number">{roiCMV.toFixed(1)}%</strong>
              <p className="metric-desc">Rendimiento porcentual neto recuperado sobre el costo de base de la mercancía.</p>
            </div>
            <div className="metric-box font-pink-border">
              <span className="metric-title">Tasa de Desviación por Promociones</span>
              <strong className="metric-number score-pink">
                {totalVentasBrutas > 0 ? ((totalDescuentos / totalVentasBrutas) * 100).toFixed(1) : 0}%
              </strong>
              <p className="metric-desc">Proporción de ingresos base cedidos al cliente mediante cupones aplicados.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="finance-ledger">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Sincronizando balances contables en Supabase... 🌸</p>
          </div>
        ) : Object.keys(secciones).map((titulo) => {
          const sec = secciones[titulo];
          return (
            <div key={titulo} className="ledger-block">
              <div className="ledger-header">
                <div className="ledger-title">
                  <Calendar size={20}/> 
                  <h4>{titulo.toUpperCase()}</h4>
                </div>
                <div className="ledger-summary-tag pos">
                  Flujo Operativo: Sincronizado
                </div>
              </div>

              <div className="ledger-tables-container">
                {/* TABLA DE DETALLE DE COMPRAS */}
                <div className="ledger-table-box sales">
                  <div className="table-title">
                    <ShoppingCart size={16}/> <span>Desglose de Órdenes Liquidadas</span>
                  </div>
                  <div className="table-responsive">
                    <table className="modern-table">
                      <thead>
                        <tr>
                          <th>Folio</th>
                          <th>Estrategia Aplicada</th>
                          <th>Monto Total</th>
                          <th>Descuento</th>
                          <th>Margen</th>
                          <th style={{ textAlign: 'center' }}>Artículos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sec.listaVentas
                          .filter(v => v.id.toString().toLowerCase().includes(searchTerm.toLowerCase()))
                          .map(v => {
                            const isExpanded = expandedOrderId === v.id;
                            return (
                              <React.Fragment key={v.id}>
                                <tr 
                                  className={`clickable-row ${isExpanded ? 'active-row' : ''}`}
                                  onClick={() => toggleExpandirOrden(v.id)}
                                >
                                  <td className="folio-cell">#{v.id.toString().slice(-5).toUpperCase()}</td>
                                  <td>
                                    <div className="strategy-cell-container">
                                      {(v.cupon_id || v["cupón_id"]) && <span className="badge-finance coupon">🏷️ Cupón</span>}
                                      {v.promocion_id && <span className="badge-finance promo-tag">✨ Promo</span>}
                                      {!(v.cupon_id || v["cupón_id"]) && !v.promocion_id && <span className="badge-finance normal">Regular</span>}
                                    </div>
                                  </td>
                                  <td>${(v.total || 0).toFixed(2)}</td>
                                  <td className="discount-cell">-${(v.descuento_applied || v.monto_descuento || 0).toFixed(2)}</td>
                                  <td className="profit-cell">${v.ganancia_calculada.toFixed(2)}</td>
                                  <td style={{ textAlign: 'center', color: '#ffa0b6' }}>
                                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                  </td>
                                </tr>
                                
                                {/* DESGLOSE INTERNO EXPANSIBLE DE PRODUCTOS */}
                                {isExpanded && (
                                  <tr className="expanded-products-wrapper animate-in">
                                    <td colSpan="6">
                                      <div className="products-inner-box">
                                        <h5>Artículos Adquiridos por el Cliente:</h5>
                                        <div className="products-mini-grid">
                                          {(v.detalles_orden || []).length === 0 ? (
                                            <p className="no-products-msg">No se registraron detalles físicos para este folio.</p>
                                          ) : (
                                            <table className="mini-products-table">
                                              <thead>
                                                <tr>
                                                  <th>Producto</th>
                                                  <th>Cantidad</th>
                                                  <th>P. Unitario</th>
                                                  <th>Subtotal</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {v.detalles_orden.map((det, dIdx) => (
                                                  <tr key={dIdx}>
                                                    <td className="mini-prod-name">
                                                      {det.productos?.nombre || 'Producto Personalizado'}
                                                    </td>
                                                    <td className="mini-prod-qty">{det.cantidad} pzas</td>
                                                    <td>${(det.precio_unitario || det.productos?.precio || 0).toFixed(2)}</td>
                                                    <td className="mini-prod-subtotal">
                                                      ${((det.cantidad || 0) * (det.precio_unitario || det.productos?.precio || 0)).toFixed(2)}
                                                    </td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* TABLA DE EGRESOS FÍSICOS */}
                <div className="ledger-table-box expenses">
                  <div className="table-title">
                    <ArrowDownCircle size={16}/> <span>Egresos Registrados</span>
                  </div>
                  <div className="table-responsive">
                    <table className="modern-table">
                      <thead>
                        <tr>
                          <th>Concepto</th>
                          <th>Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gastos.length === 0 ? (
                          <tr><td colSpan="2" className="empty-row">Sin gastos reportados en caja</td></tr>
                        ) : gastos.map((g, idx) => (
                          <tr key={idx}>
                            <td>{g.descripcion}</td>
                            <td className="expense-cell">-${g.monto.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};

export default FinanceView;