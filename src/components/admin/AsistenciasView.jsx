import React, { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import { Clock, LogIn, LogOut, Calendar, CheckCircle, Users, MessageSquare, DollarSign, Search } from 'lucide-react';
import './AsistenciasView.css';

const AsistenciasView = ({ userRole }) => {
  const [loading, setLoading] = useState(false);
  const [sessionUser, setSessionUser] = useState(null);
  const [asistenciaHoy, setAsistenciaHoy] = useState(null);
  const [historialGlobal, setHistorialGlobal] = useState([]);
  
  // --- ESTADOS DEL MÓDULO ---
  const [horaActual, setHoraActual] = useState(new Date().toLocaleTimeString('es-MX'));
  const [vistaAdmin, setVistaAdmin] = useState('asistencias'); // 'asistencias' o 'cierres'
  const [historialCierres, setHistorialCierres] = useState([]);
  const [filtroFechaCierre, setFiltroFechaCierre] = useState('');

  useEffect(() => {
    inicializarModulo();

    // RELOJ EN TIEMPO REAL
    const timer = setInterval(() => {
      setHoraActual(new Date().toLocaleTimeString('es-MX'));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const inicializarModulo = async () => {
    // 1. Obtener la sesión del usuario logueado en ese momento
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setSessionUser(session.user);
      await verificarEstadoHoy(session.user.id);
    }
    
    // 2. Si es Administrador, cargar el historial general y los cierres de caja estructurados
    if (userRole === 'administrador') {
      await fetchHistorialGlobal();
      await fetchHistorialCierres();
    }
  };

  // Verifica si el trabajador ya checó entrada o salida el día de hoy
  const verificarEstadoHoy = async (userId) => {
    try {
      const hoyStr = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
      const { data, error } = await supabase
        .from('asistencias')
        .select('*')
        .eq('perfil_id', userId)
        .eq('fecha', hoyStr)
        .maybeSingle();

      if (error) throw error;
      setAsistenciaHoy(data); 
    } catch (error) {
      console.error("Error al verificar asistencia diaria:", error.message);
    }
  };

  const fetchHistorialGlobal = async () => {
    try {
      const { data, error } = await supabase
        .from('asistencias')
        .select(`
          id,
          fecha,
          hora_entrada,
          hora_salida,
          perfiles (
            nombre,
            apellidos,
            rol,
            telefono,
            sucursales (nombre)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistorialGlobal(data || []);
    } catch (error) {
      console.error("Error al cargar historial general:", error.message);
    }
  };

  // --- TRIPLE JOIN OPTIMIZADO CON TU TABLA DE SUCURSALES REAL ---
  const fetchHistorialCierres = async () => {
    try {
      const { data, error } = await supabase
        .from('cierres_caja')
        .select(`
          id,
          fecha,
          total_ventas,
          total_inversion,
          total_ganancia,
          total_envios,
          total_efectivo,
          total_transferencia,
          total_gastos,
          fondo_inicial,
          perfiles (
            nombre,
            apellidos,
            sucursales (
              nombre
            )
          )
        `)
        .order('fecha', { ascending: false });

      if (error) throw error;
      setHistorialCierres(data || []);
    } catch (error) {
      console.error("Error al cargar auditoría de cierres de caja:", error.message);
    }
  };

  // --- ACCIÓN 1: REGISTRAR ENTRADA EN BASE A HORA LOCAL REAL ---
  const handleRegistrarEntrada = async () => {
    if (!sessionUser) return;
    setLoading(true);
    try {
      // Forzamos el formato de 24 horas local de México (HH:MM:SS) para evitar desfases de servidor
      const horaLocalExacta = new Date().toLocaleTimeString('en-US', { hour12: false });

      const { error } = await supabase
        .from('asistencias')
        .insert([{ 
          perfil_id: sessionUser.id,
          hora_entrada: horaLocalExacta // Inyección explícita de hora real
        }]);

      if (error) throw error;

      alert("🌸 ¡Entrada registrada con éxito! Excelente jornada en JAI Tres Hermanas. ✨");
      await verificarEstadoHoy(sessionUser.id);
      if (userRole === 'administrador') {
        fetchHistorialGlobal();
        fetchHistorialCierres();
      }
    } catch (error) {
      alert("Error al registrar entrada: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- ACCIÓN 2: REGISTRAR SALIDA EN BASE A HORA LOCAL REAL ---
  const handleRegistrarSalida = async () => {
    if (!sessionUser || !asistenciaHoy) return;
    setLoading(true);
    try {
      // Forzamos el formato de 24 horas local de México (HH:MM:SS) para evitar desfases de servidor
      const horaActualStr = new Date().toLocaleTimeString('en-US', { hour12: false }); 

      const { error } = await supabase
        .from('asistencias')
        .update({ hora_salida: horaActualStr }) // Actualización explícita de hora real
        .eq('id', asistenciaHoy.id);

      if (error) throw error;

      alert("🌸 ¡Salida registrada con éxito! Buen descanso, gracias por tu esfuerzo diario. 💕");
      await verificarEstadoHoy(sessionUser.id);
      if (userRole === 'administrador') {
        fetchHistorialGlobal();
        fetchHistorialCierres();
      }
    } catch (error) {
      alert("Error al registrar salida: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Corrección inteligente e internacional con lada automática para el chat de WhatsApp
  const handleEnviarWhatsApp = (telefono, nombreEmpleado) => {
    if (!telefono) {
      alert("⚠️ Este colaborador no cuenta con un número de teléfono en su perfil.");
      return;
    }
    
    let numeroLimpio = telephone ? telefono.replace(/\s+/g, '').replace('+', '') : '';
    if (numeroLimpio.length === 10) {
      numeroLimpio = '52' + numeroLimpio; // Prefijo para México
    }

    const mensaje = encodeURIComponent(`Hola ${nombreEmpleado}, te contacto desde la administración central de JAI Tres Hermanas. 🌸`);
    window.open(`https://wa.me/${numeroLimpio}?text=${mensaje}`, '_blank');
  };

  const formatTimeDisplay = (timeString) => {
    if (!timeString) return '--:--';
    return timeString.split('+')[0].substring(0, 5);
  };

  const cierresFiltrados = historialCierres.filter(cierre => {
    if (!filtroFechaCierre) return true;
    return cierre.fecha?.includes(filtroFechaCierre);
  });

  return (
    <div className="attendance-container">
      
      {/* SECCIÓN 1: PANEL DE CONTROL PERSONAL */}
      <div className="attendance-card-checador">
        <div className="attendance-header">
          <Clock size={22} color="#cf69d4" />
          <h4>Reloj Checador Digital</h4>
        </div>
        
        <div className="attendance-body-status">
          <div className="date-badge">
            <Calendar size={16} />
            <span>{new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>

          <div className="live-clock-display">
            <span>{horaActual}</span>
            <p className="clock-pulse-text">Hora Oficial Sincronizada</p>
          </div>

          {!asistenciaHoy ? (
            <div className="status-box waiting">
              <p>🌸 No has registrado tu inicio de actividades el día de hoy.</p>
              <button onClick={handleRegistrarEntrada} disabled={loading} className="btn-attendance check-in">
                <LogIn size={18} /> {loading ? 'Procesando...' : 'Registrar Entrada JAI ✨'}
              </button>
            </div>
          ) : !asistenciaHoy.hora_salida ? (
            <div className="status-box active-work">
              <p>🟢 Jornada activa. Registraste tu entrada a las: <strong>{formatTimeDisplay(asistenciaHoy.hora_entrada)} hrs</strong></p>
              <button onClick={handleRegistrarSalida} disabled={loading} className="btn-attendance check-out">
                <LogOut size={18} /> {loading ? 'Procesando...' : 'Registrar Salida de Labores 🌸'}
              </button>
            </div>
          ) : (
            <div className="status-box completed">
              <CheckCircle size={40} color="#4caf50" />
              <h5>¡Excelente!</h5>
              <p>Completaste tu ciclo de asistencia de hoy correctamente.</p>
              <div className="summary-hours">
                <span>🚪 Entrada: {formatTimeDisplay(asistenciaHoy.hora_entrada)} hrs</span>
                <span>🏡 Salida: {formatTimeDisplay(asistenciaHoy.hora_salida)} hrs</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN 2: VISTAS DEL ADMINISTRADOR GLOBAL */}
      {userRole === 'administrador' && (
        <div className="attendance-card-history">
          
          <div className="admin-attendance-tabs">
            <button 
              className={`tab-btn-nav ${vistaAdmin === 'asistencias' ? 'active' : ''}`}
              onClick={() => setVistaAdmin('asistencias')}
            >
              <Users size={16} /> Bitácora de Asistencias
            </button>
            <button 
              className={`tab-btn-nav ${vistaAdmin === 'cierres' ? 'active' : ''}`}
              onClick={() => setVistaAdmin('cierres')}
            >
              <DollarSign size={16} /> Auditoría Financiera de Cierres
            </button>
          </div>

          {vistaAdmin === 'asistencias' ? (
            <>
              <div className="attendance-header">
                <Users size={22} color="#cf69d4" />
                <h4>Bitácora y Reporte de Asistencias Personal JAI</h4>
              </div>

              <div className="attendance-table-wrapper">
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Colaborador</th>
                      <th>Puesto</th>
                      <th>Sucursal</th>
                      <th>Entrada</th>
                      <th>Salida</th>
                      <th>Contacto Directo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialGlobal.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                          No hay registros de asistencias capturados aún.
                        </td>
                      </tr>
                    ) : (
                      historialGlobal.map((item) => (
                        <tr key={item.id}>
                          <td className="date-cell"><strong>{item.fecha}</strong></td>
                          <td>{item.perfiles?.nombre} {item.perfiles?.apellidos}</td>
                          <td>
                            <span className={`role-tag-mini ${item.perfiles?.rol}`}>
                              {item.perfiles?.rol}
                            </span>
                          </td>
                          <td>{item.perfiles?.sucursales?.nombre || 'General'}</td>
                          <td className="time-in-text">{formatTimeDisplay(item.hora_entrada)}</td>
                          <td className="time-out-text">
                            {item.hora_salida ? (
                              <span className="status-out-done">{formatTimeDisplay(item.hora_salida)}</span>
                            ) : (
                              <span className="status-out-pending">En sucursal...</span>
                            )}
                          </td>
                          <td>
                            <button 
                              className="btn-whatsapp-chat"
                              onClick={() => handleEnviarWhatsApp(item.perfiles?.telefono, item.perfiles?.nombre)}
                            >
                              <MessageSquare size={13} /> WhatsApp
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              {/* AUDITORÍA DE CIERRES VINCULANDO DINÁMICAMENTE SUCURSALES Y RESPONSABLES */}
              <div className="attendance-header header-with-filter">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <DollarSign size={22} color="#cf69d4" />
                  <h4>Historial Diario de Cierres de Caja</h4>
                </div>
                
                <div className="filter-box-cierre">
                  <Search size={16} color="#aaa" />
                  <input 
                    type="date" 
                    value={filtroFechaCierre} 
                    onChange={(e) => setFiltroFechaCierre(e.target.value)}
                    className="input-date-cierre"
                  />
                  {filtroFechaCierre && <button onClick={() => setFiltroFechaCierre('')} className="btn-clear-filter">X</button>}
                </div>
              </div>

              <div className="attendance-table-wrapper">
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Responsable del Cierre</th>
                      <th>Sucursal Emisión</th>
                      <th>Fondo Inicial</th>
                      <th>Ventas Totales</th>
                      <th>Efectivo / Transferencia</th>
                      <th>Gastos</th>
                      <th>Ganancia Neta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cierresFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                          No se encontraron registros de cierres consolidados.
                        </td>
                      </tr>
                    ) : (
                      cierresFiltrados.map((cierre) => (
                        <tr key={cierre.id}>
                          <td className="date-cell">
                            <strong>{cierre.fecha}</strong>
                          </td>
                          <td style={{ fontWeight: '500', color: '#4a4a4a' }}>
                            {cierre.perfiles ? `${cierre.perfiles.nombre} ${cierre.perfiles.apellidos || ''}` : 'Turno Contable'}
                          </td>
                          <td style={{ fontWeight: '600', color: '#6c757d' }}>
                            {cierre.perfiles?.sucursales?.nombre || 'Administración Central'}
                          </td>
                          <td>${cierre.fondo_inicial ?? '0.00'}</td>
                          <td style={{ fontWeight: '600', color: '#1565c0' }}>${cierre.total_ventas ?? '0.00'}</td>
                          <td style={{ fontSize: '0.85rem', color: '#555' }}>
                            💵 ${cierre.total_efectivo ?? '0'} / 💳 ${cierre.total_transferencia ?? '0'}
                          </td>
                          <td style={{ color: '#c62828' }}>${cierre.total_gastos ?? '0.00'}</td>
                          <td style={{ color: '#cf69d4', fontWeight: 'bold', background: '#fdf2f8' }}>
                            ${cierre.total_ganancia ?? '0.00'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

        </div>
      )}

    </div>
  );
};

export default AsistenciasView;