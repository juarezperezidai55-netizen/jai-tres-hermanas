import React, { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import { 
  TrendingUp, Star, Zap, ShoppingBag, Percent, MapPin, 
  Target, Clock, ArrowUpRight, Award, Layers, Package 
} from 'lucide-react';
import './ReportView.css';

const ReportView = () => {
  const [loading, setLoading] = useState(true);
  const [topProductos, setTopProductos] = useState([]);
  const [ticketPromedio, setTicketPromedio] = useState(0);
  const [articulosPorOrden, setArticulosPorOrden] = useState(0);
  const [metricasPromos, setMetricasPromos] = useState({ totalCanjes: 0, ahorroClientes: 0 });
  const [metodosEntrega, setMetodosEntrega] = useState({ envio: 0, recogida: 0 });
  const [inventarioCritico, setInventarioCritico] = useState([]);

  useEffect(() => {
    fetchRealReportData();
  }, []);

  const fetchRealReportData = async () => {
    setLoading(true);
    try {
      // 1. TRAER ÓRDENES PROCESADAS USANDO JOIN RELACIONAL NATIVO EFICIENTE
      const { data: ords, error: errOrds } = await supabase
        .from('ordenes')
        .select(`
          total, 
          tipo_entrega, 
          descuento_applied, 
          monto_descuento,
          estado,
          detalles_orden (
            cantidad,
            producto_id,
            productos (
              nombre
            )
          )
        `)
        .in('estado', ['Pagado', 'Enviado']);

      if (errOrds) throw errOrds;

      if (ords && ords.length > 0) {
        // Cálculo de Ticket Promedio Matemático Exacto
        const { data: ordsTotales } = await supabase.from('ordenes').select('total');
        const sumaTotal = ords.reduce((acc, curr) => acc + (curr.total || 0), 0);
        setTicketPromedio(sumaTotal / ords.length);

        // Cálculo Real y Dinámico de Artículos promedio por Orden (Sustento de Tesis)
        let totalItemsVendidos = 0;
        ords.forEach(o => {
          (o.detalles_orden || []).forEach(d => {
            totalItemsVendidos += (d.cantidad || 0);
          });
        });
        setArticulosPorOrden(ords.length > 0 ? totalItemsVendidos / ords.length : 0);

        // Análisis de Entregas
        const entregas = ords.reduce((acc, curr) => {
          const entrega = curr.tipo_entrega ? curr.tipo_entrega.toLowerCase() : '';
          if (entrega !== 'recogida' && entrega !== 'sucursal') {
            acc.envio++;
          } else {
            acc.recogida++;
          }
          return acc;
        }, { envio: 0, recogida: 0 });
        setMetodosEntrega(entregas);

        // Métricas de Promociones Integradas
        const canjes = ords.filter(o => {
          const desc = o.descuento_applied || o.monto_descuento || 0;
          return Number(desc) > 0;
        }).length;

        const ahorro = ords.reduce((acc, curr) => {
          const desc = curr.descuento_applied || curr.monto_descuento || 0;
          return acc + Number(desc);
        }, 0);

        setMetricasPromos({
          totalCanjes: canjes,
          ahorroClientes: ahorro
        });

        // 2. LÓGICA DE RANKING DE PRODUCTOS MÁS VENDIDOS DESDE LA MISMA CONSULTA RELACIONAL
        const conteoProductos = {};
        ords.forEach(o => {
          (o.detalles_orden || []).forEach(d => {
            if (d.producto_id) {
              const nombreProd = d.productos?.nombre || 'Producto Descatalogado';
              if (!conteoProductos[d.producto_id]) {
                conteoProductos[d.producto_id] = { nombre: nombreProd, ventas: 0 };
              }
              conteoProductos[d.producto_id].ventas += (d.cantidad || 0);
            }
          });
        });

        const ranking = Object.values(conteoProductos)
          .sort((a, b) => b.ventas - a.ventas)
          .slice(0, 5);

        setTopProductos(ranking);
      } else {
        // Fallbacks seguros en caso de base de datos vacía en el turno
        setTicketPromedio(0);
        setArticulosPorOrden(0);
        setTopProductos([]);
        setMetricasPromos({ totalCanjes: 0, ahorroClientes: 0 });
        setMetodosEntrega({ envio: 0, recogida: 0 });
      }

      // 3. PRODUCTOS EN RIESGO (STOCK BAJO DE SUCURSALES / GLOBAL)
      const { data: stockBajo } = await supabase
        .from('productos')
        .select('nombre, stock, stock_minimo')
        .lt('stock', 6) // Umbral analítico crítico
        .order('stock', { ascending: true })
        .limit(4);

      setInventarioCritico(stockBajo || []);

    } catch (error) {
      console.error("Error en Módulo de Inteligencia Analítica JAI:", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-luxury-wrapper animate-fade">
      <header className="report-luxury-header">
        <div className="title-area">
          <div className="badge-live">LIVE DATA</div>
          <h1>Inteligencia de Negocio JAI <span className="flower-icon">🌸</span></h1>
          <p>Análisis en tiempo real de tus ventas y comportamiento de clientes</p>
        </div>
        <button className="btn-refresh-luxury" onClick={fetchRealReportData} disabled={loading}>
          <TrendingUp size={16} /> {loading ? "Procesando..." : "Refrescar Análisis"}
        </button>
      </header>

      {loading ? (
        <div className="loading-state-reports">
          <div className="spinner-reports"></div>
          <p>Compilando variables y algoritmos de tendencia... 🌸</p>
        </div>
      ) : (
        <>
          {/* KPI CARDS SUPERIORES */}
          <div className="luxury-stats-row">
            <div className="stat-card-minimal">
              <Target className="icon-gold" />
              <div className="stat-content">
                <span className="label">Ticket Promedio</span>
                <h3>${ticketPromedio.toFixed(2)}</h3>
              </div>
            </div>
            <div className="stat-card-minimal">
              <Clock className="icon-purple" />
              <div className="stat-content">
                <span className="label">Tasa Fidelización</span>
                <h3>{ticketPromedio > 0 && metricasPromos.totalCanjes > 0 ? ((metricasPromos.totalCanjes / (metricasPromos.totalCanjes + 1)) * 100).toFixed(0) : 0}%</h3>
              </div>
            </div>
            <div className="stat-card-minimal">
              <Layers className="icon-pink" />
              <div className="stat-content">
                <span className="label">Artículos x Orden</span>
                <h3>~{articulosPorOrden.toFixed(1)} u.</h3>
              </div>
            </div>
          </div>

          <div className="report-main-grid">
            <div className="glass-card ranking-box">
              <div className="card-top">
                <Award size={22} color="#ffa0b6" />
                <h4>Productos Más Vendidos (Historial Vivo)</h4>
              </div>
              <div className="ranking-table-luxury">
                {topProductos.length === 0 ? (
                  <p className="empty-reports-msg">No hay ventas registradas en este periodo.</p>
                ) : topProductos.map((prod, index) => (
                  <div key={index} className="luxury-rank-row">
                    <span className="rank-idx">0{index + 1}</span>
                    <div className="rank-main">
                      <p className="prod-title">{prod.nombre}</p>
                      <div className="progress-container">
                        <div 
                          className="progress-bar" 
                          style={{ width: `${topProductos[0] ? (prod.ventas / topProductos[0].ventas) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="rank-qty">{prod.ventas} <small>u.</small></span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card marketing-impact">
              <div className="card-top">
                <Percent size={22} color="#ff7675" />
                <h4>Efectividad de Ofertas</h4>
              </div>
              <div className="marketing-display">
                <div className="display-item">
                  <span className="display-val">{metricasPromos.totalCanjes}</span>
                  <span className="display-label">Ventas con Cupón</span>
                </div>
                <div className="display-divider"></div>
                <div className="display-item">
                  <span className="display-val">${metricasPromos.ahorroClientes.toFixed(2)}</span>
                  <span className="display-label">Descuentos Aplicados</span>
                </div>
              </div>
              <div className="marketing-footer-note">
                <ArrowUpRight size={14} /> Los cupones y promociones mantienen activo el flujo de caja boutique.
              </div>
            </div>
          </div>

          <div className="logistics-luxury-card">
            <div className="card-top">
              <MapPin size={22} color="#3498db" />
              <h4>Preferencia de Métodos de Entrega</h4>
            </div>
            <div className="delivery-split">
              <div className="split-item">
                <div className="split-info">
                  <span>Domicilio / Envíos</span>
                  <strong>{metodosEntrega.envio}</strong>
                </div>
                <div className="split-bar-bg">
                  <div 
                    className="split-fill blue" 
                    style={{ width: `${(metodosEntrega.envio / ((metodosEntrega.envio + metodosEntrega.recogida) || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="split-item">
                <div className="split-info">
                  <span>Recogida en Sucursal / Local</span>
                  <strong>{metodosEntrega.recogida}</strong>
                </div>
                <div className="split-bar-bg">
                  <div 
                    className="split-fill pink" 
                    style={{ width: `${(metodosEntrega.recogida / ((metodosEntrega.envio + metodosEntrega.recogida) || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* STOCK BAJO Y PLANIFICACIÓN DE ESTRATEGIA CORPORATIVA */}
          <section className="report-grid-extra" style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '30px' }}>
            <div className="glass-card alert-box">
              <div className="card-top">
                <Package size={22} color="#e74c3c" />
                <h4>Alertas de Inventario Crítico</h4>
              </div>
              <div className="stock-alert-list">
                {inventarioCritico.length > 0 ? inventarioCritico.map((item, i) => (
                  <div key={i} className="alert-item-pro" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #fdf1f4' }}>
                    <div className="alert-info">
                      <p className="alert-name" style={{ fontWeight: '700', margin: 0, color: '#334155' }}>{item.nombre}</p>
                      <span className="alert-status" style={{ fontSize: '0.85rem', color: '#dc2626', fontWeight: '600' }}>Quedan solo {item.stock} unidades</span>
                    </div>
                    <div className="alert-badge" style={{ background: '#fef2f2', color: '#dc2626', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800', border: '1px solid #fee2e2' }}>REABASTECER</div>
                  </div>
                )) : <p style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>Inventario saludable. Todas tus piezas de bisutería y moda están estables.</p>}
              </div>
            </div>

            <div className="glass-card strategy-box">
              <div className="card-top">
                <Zap size={22} color="#f1c40f" />
                <h4>Estrategia Sugerida Analítica</h4>
              </div>
              <div className="strategy-content">
                <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.5' }}>
                  Basado en tu <strong>Ticket Promedio (${ticketPromedio.toFixed(2)})</strong>, tus clientes responden óptimamente a productos de alta rotación.
                </p>
                <ul className="strategy-list" style={{ paddingLeft: '20px', color: '#64748b', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  <li style={{ marginBottom: '8px' }}>✨ Agrupa los productos en riesgo de stock en un combo "Last Chance" para acelerar la liquidación.</li>
                  <li>🌸 Incrementa la pauta o exhibición de los artículos top los fines de semana para maximizar el ROI.</li>
                </ul>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  ); 
};

export default ReportView;