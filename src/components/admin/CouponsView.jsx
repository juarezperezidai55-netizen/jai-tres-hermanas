import React, { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import { Ticket, Plus, X, Tag, Calendar, BarChart3, Percent, CheckCircle, XCircle, Clock } from 'lucide-react';
import './CouponsView.css';

const CouponsView = () => {
  const [activeTab, setActiveTab] = useState('cupones'); 
  const [cupones, setCupones] = useState([]);
  const [promociones, setPromociones] = useState([]);
  const [categoriasLista, setCategoriasLista] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const [nuevoCupon, setNuevoCupon] = useState({
    codigo: '', tipo: 'porcentaje', valor: '', uso_maximo: 10, activo: true
  });

  // Mantenemos tu objeto original e incorporamos 'solo_antiguos' y 'meses_antiguedad' para liquidación
  const [nuevaPromo, setNuevaPromo] = useState({
    nombre: '', descuento_porcentaje: '', fecha_inicio: '', fecha_fin: '', activa: true, categoria_id: 'all',
    solo_antiguos: false,
    meses_antiguedad: '3'
  });

  useEffect(() => {
    fetchDatos();
    fetchCategorias();
  }, [activeTab]);

  const fetchCategorias = async () => {
    const { data } = await supabase.from('categorias').select('*');
    setCategoriasLista(data || []);
  };

  const fetchDatos = async () => {
    setLoading(true);
    try {
      if (activeTab === 'cupones') {
        const { data } = await supabase.from('cupones').select('*').order('created_at', { ascending: false });
        setCupones(data || []);
      } else {
        const { data } = await supabase.from('promociones').select('*').order('fecha_fin', { ascending: false });
        setPromociones(data || []);
      }
    } catch (err) {
      console.error("Error al obtener datos:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearCupon = async () => {
    if(!nuevoCupon.codigo || !nuevoCupon.valor) return alert("Llena los campos obligatorios 🌸");
    try {
      const { error } = await supabase.from('cupones').insert([nuevoCupon]);
      if(error) throw error;
      alert("¡Cupón creado con éxito! ✨");
      setShowModal(false);
      setNuevoCupon({ codigo: '', tipo: 'porcentaje', valor: '', uso_maximo: 10, activo: true }); 
      fetchDatos();
    } catch (err) { alert("Error: " + err.message); }
  };

  const handleCrearPromo = async () => {
    if(!nuevaPromo.nombre || !nuevaPromo.descuento_porcentaje || !nuevaPromo.fecha_fin) return alert("Llena los datos de la oferta 🌸");
    try {
      // INGENIERÍA DE BASE DE DATOS: Si es liquidación, guardamos una etiqueta especial en el nombre que tus otras pantallas puedan leer fácilmente sin añadir nuevas columnas a la DB
      let nombreFinalCampaña = nuevaPromo.nombre;
      if (nuevaPromo.solo_antiguos) {
        nombreFinalCampaña = `${nuevaPromo.nombre} [LIQUIDACION_MIN_${nuevaPromo.meses_antiguedad}_MESES]`;
      }

      const promoData = {
        nombre: nombreFinalCampaña,
        descuento_porcentaje: parseFloat(nuevaPromo.descuento_porcentaje),
        fecha_inicio: nuevaPromo.fecha_inicio || new Date().toISOString().split('T')[0],
        fecha_fin: nuevaPromo.fecha_fin,
        activa: true,
        categoria_id: nuevaPromo.categoria_id === 'all' ? null : parseInt(nuevaPromo.categoria_id)
      };

      const { error } = await supabase.from('promociones').insert([promoData]);
      if(error) throw error;
      alert("¡Promoción activada! 🚀");
      setShowModal(false);
      setNuevaPromo({ nombre: '', descuento_porcentaje: '', fecha_inicio: '', fecha_fin: '', activa: true, categoria_id: 'all', solo_antiguos: false, meses_antiguedad: '3' });
      fetchDatos();
    } catch (err) { alert("Error: " + err.message); }
  };

  const toggleStatusCupon = async (id, currentStatus) => {
    const { error } = await supabase.from('cupones').update({ activo: !currentStatus }).eq('id', id);
    if (!error) fetchDatos();
  };

  const toggleStatusPromo = async (id, currentStatus) => {
    try {
      const nuevoEstado = !currentStatus;
      const { error } = await supabase
        .from('promociones')
        .update({ activa: nuevoEstado })
        .eq('id', id);
      
      if (error) throw error;
      setPromociones(prev => prev.map(p => p.id === id ? { ...p, activa: nuevoEstado } : p));
    } catch (err) {
      alert("Error al cambiar estado: " + err.message);
    }
  };

  return (
    <div className="marketing-pro-container animate-fade">
      <header className="marketing-header-pro">
        <div className="header-info-jai">
          <h1>Estrategia de Ventas JAI 🌸</h1>
          <p>Potencia tu negocio con descuentos inteligentes y control de rentabilidad.</p>
        </div>
        <div className="marketing-tabs-pro">
          <button className={activeTab === 'cupones' ? 'tab-pro active' : 'tab-pro'} onClick={() => setActiveTab('cupones')}>
            <Ticket size={18} /> <span>Cupones de Fidelidad</span>
          </button>
          <button className={activeTab === 'promociones' ? 'tab-pro active' : 'tab-pro'} onClick={() => setActiveTab('promociones')}>
            <BarChart3 size={18} /> <span>Historial y Ofertas</span>
          </button>
        </div>
      </header>

      <main className="marketing-main-content">
        <div className="actions-bar-pro">
          <h2>{activeTab === 'cupones' ? 'Gestión de Cupones' : 'Registro de Campañas'}</h2>
          <button className="jai-btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={20} /> {activeTab === 'cupones' ? 'Crear Nuevo Cupón' : 'Lanzar Nueva Oferta'}
          </button>
        </div>

        {loading ? (
          <div className="jai-loader-container">
            <div className="jai-spinner"></div>
          </div>
        ) : (
          <div className="marketing-grid-pro">
            {activeTab === 'cupones' ? (
              cupones.map(c => (
                <div key={c.id} className={`jai-card-pro coupon-type ${!c.activo ? 'is-paused' : ''}`}>
                  <div className="card-top-jai">
                    <div className="icon-wrapper-jai pink"><Tag size={20} /></div>
                    <span className="jai-status-tag">{c.activo ? 'ACTIVO' : 'PAUSADO'}</span>
                  </div>
                  <div className="card-body-jai">
                    <h3 className="coupon-code">{c.codigo.toUpperCase()}</h3>
                    <div className="discount-value-jai">
                      {c.tipo === 'porcentaje' ? `${c.valor}%` : `$${c.valor}`} <span>OFF</span>
                    </div>
                    <div className="usage-meter">
                      <div className="meter-label">Usos: {c.usos_actuales || 0}/{c.uso_maximo}</div>
                      <div className="meter-bar"><div className="meter-fill" style={{width: `${((c.usos_actuales || 0) / c.uso_maximo) * 100}%`}}></div></div>
                    </div>
                  </div>
                  <div className="card-footer-jai">
                    <button className={`jai-toggle-btn ${c.activo ? 'pause' : 'activate'}`} onClick={() => toggleStatusCupon(c.id, c.activo)}>
                      {c.activo ? <><XCircle size={14}/> Pausar</> : <><CheckCircle size={14}/> Activar</>}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              promociones.map(p => {
                const hoy = new Date(); hoy.setHours(0,0,0,0);
                const fFin = p.fecha_fin ? new Date(p.fecha_fin) : null;
                if(fFin) fFin.setHours(23,59,59,999);
                const estaVencida = fFin ? fFin < hoy : false;

                // Detectamos visualmente si es una promoción exclusiva de liquidación por antigüedad
                const esLiquidacion = p.nombre.includes('[LIQUIDACION_MIN_');
                const nombreLimpio = p.nombre.split(' [LIQUIDACION_MIN_')[0];

                return (
                  <div key={p.id} className={`jai-card-pro promo-type ${estaVencida ? 'is-expired' : !p.activa ? 'is-paused' : ''}`}>
                    <div className="card-top-jai">
                      <div className={`icon-wrapper-jai ${estaVencida ? 'gray' : 'blue'}`}><Calendar size={20} /></div>
                      <span className={`jai-status-tag ${estaVencida ? 'expired' : p.activa ? 'active' : 'paused'}`}>
                        {estaVencida ? 'FINALIZADA' : p.activa ? 'EN CURSO' : 'PAUSADA'}
                      </span>
                    </div>
                    <div className="card-body-jai">
                      <h3 className="promo-name">{nombreLimpio}</h3>
                      
                      {/* Badge indicador de Liquidación Exclusiva */}
                      {esLiquidacion && (
                        <span className="badge-outlet-exclusive">
                          🍂 Exclusivo Outlet / Liquidación
                        </span>
                      )}

                      <div className="discount-value-jai blue">
                        {p.descuento_porcentaje}% <span>OFF</span>
                      </div>
                      <div className="promo-details-jai">
                        <p><Clock size={12}/> Vence: <strong>{p.fecha_fin ? new Date(p.fecha_fin).toLocaleDateString() : 'Sin fecha'}</strong></p>
                        <p><Percent size={12}/> {categoriasLista.find(c => c.id === p.categoria_id)?.nombre || 'Tienda General'}</p>
                      </div>
                    </div>
                    <div className="card-footer-jai">
                      <button 
                        className={`jai-toggle-btn ${p.activa ? 'pause' : 'activate'}`} 
                        onClick={() => toggleStatusPromo(p.id, p.activa)}
                      >
                        {p.activa ? <><XCircle size={14}/> Pausar</> : <><CheckCircle size={14}/> Activar</>}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      {showModal && (
        <div className="jai-modal-overlay">
          <div className="jai-modal-box">
            <div className="jai-modal-header">
              <h3>{activeTab === 'cupones' ? 'Nuevo Cupón' : 'Nueva Promoción'}</h3>
              <button onClick={() => setShowModal(false)} className="jai-close-modal"><X size={24}/></button>
            </div>
            <div className="jai-modal-body">
              {activeTab === 'cupones' ? (
                <div className="jai-form-grid">
                  <div className="jai-input-group">
                    <label>Código</label>
                    <input type="text" value={nuevoCupon.codigo} onChange={e => setNuevoCupon({...nuevoCupon, codigo: e.target.value.toUpperCase()})} placeholder="JAI20" />
                  </div>
                  <div className="jai-input-row">
                    <div className="jai-input-group">
                      <label>Tipo</label>
                      <select value={nuevoCupon.tipo} onChange={e => setNuevoCupon({...nuevoCupon, tipo: e.target.value})}>
                        <option value="porcentaje">Porcentaje %</option>
                        <option value="fijo">Monto Fijo $</option>
                      </select>
                    </div>
                    <div className="jai-input-group">
                      <label>Valor</label>
                      <input type="number" value={nuevoCupon.valor} onChange={e => setNuevoCupon({...nuevoCupon, valor: e.target.value})} />
                    </div>
                  </div>
                  <button className="jai-btn-save" onClick={handleCrearCupon}>Guardar Cupón ✨</button>
                </div>
              ) : (
                <div className="jai-form-grid">
                  <div className="jai-input-group">
                    <label>Nombre de la Oferta</label>
                    <input type="text" placeholder="Ej. Remate de Temporada" value={nuevaPromo.nombre} onChange={e => setNuevaPromo({...nuevaPromo, nombre: e.target.value})} />
                  </div>
                  <div className="jai-input-group">
                    <label>Categoría Objetivo</label>
                    <select value={nuevaPromo.categoria_id} onChange={e => setNuevaPromo({...nuevaPromo, categoria_id: e.target.value})}>
                      <option value="all">Toda la tienda 🛒</option>
                      {categoriasLista.filter(cat => !cat.parent_id).map(parent => (
                        <optgroup key={parent.id} label={parent.nombre}>
                          <option value={parent.id}>Todo {parent.nombre}</option>
                          {categoriasLista.filter(sub => sub.parent_id === parent.id).map(child => (
                            <option key={child.id} value={child.id}>-- {child.nombre}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {/* NUEVA SECCIÓN DE SEGMENTACIÓN LOGICA PARA OUTLET / LIQUIDACIÓN */}
                  <div className="jai-liquidation-panel">
                    <div className="jai-checkbox-container">
                      <input 
                        type="checkbox" 
                        id="solo_antiguos"
                        checked={nuevaPromo.solo_antiguos} 
                        onChange={e => setNuevaPromo({...nuevaPromo, solo_antiguos: e.target.checked})}
                      />
                      <label htmlFor="solo_antiguos">🎯 Aplicar solo como Liquidación (Outlet)</label>
                    </div>
                    
                    {nuevaPromo.solo_antiguos && (
                      <div className="jai-input-group sub-panel-animated">
                        <label>Antigüedad mínima del stock en aparador:</label>
                        <select 
                          value={nuevaPromo.meses_antiguedad} 
                          onChange={e => setNuevaPromo({...nuevaPromo, meses_antiguedad: e.target.value})}
                        >
                          <option value="1">Más de 1 mes en tienda</option>
                          <option value="2">Más de 2 meses en tienda</option>
                          <option value="3">Más de 3 meses (Recomendado) 🍂</option>
                          <option value="6">Más de 6 meses (Mercancía rezagada)</option>
                        </select>
                        <small className="panel-helper-text">Los collares o pulseras agregados recientemente no recibirán el descuento.</small>
                      </div>
                    )}
                  </div>

                  <div className="jai-input-group">
                    <label>% Descuento</label>
                    <input type="number" placeholder="Ej. 15" value={nuevaPromo.descuento_porcentaje} onChange={e => setNuevaPromo({...nuevaPromo, descuento_porcentaje: e.target.value})} />
                  </div>
                  <div className="jai-input-row">
                    <div className="jai-input-group">
                      <label>Inicio</label>
                      <input type="date" value={nuevaPromo.fecha_inicio} onChange={e => setNuevaPromo({...nuevaPromo, fecha_inicio: e.target.value})} />
                    </div>
                    <div className="jai-input-group">
                      <label>Fin</label>
                      <input type="date" value={nuevaPromo.fecha_fin} onChange={e => setNuevaPromo({...nuevaPromo, fecha_fin: e.target.value})} />
                    </div>
                  </div>
                  <button className="jai-btn-save" onClick={handleCrearPromo}>Activar Oferta 🚀</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  ); 
};

export default CouponsView;