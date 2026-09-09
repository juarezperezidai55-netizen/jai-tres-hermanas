import React, { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import { UserPlus, Shield, MapPin, Mail, Lock, Trash2, Users, User, Phone } from 'lucide-react';
import './StaffView.css';

const StaffView = () => {
  const [loading, setLoading] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  
  // Estado del formulario (Sincronizado con la tabla perfiles)
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    telefono: '',
    correo: '',
    password: '',
    rol: 'vendedor', // Ajustado por defecto a vendedor
    sucursal_id: ''
  });

  useEffect(() => {
    fetchStaff();
    fetchSucursales();
  }, []);

  const fetchSucursales = async () => {
    const { data } = await supabase.from('sucursales').select('id, nombre');
    if (data) {
      setSucursales(data);
      if (data.length > 0) setFormData(prev => ({ ...prev, sucursal_id: data[0].id }));
    }
  };

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select(`
          id, 
          nombre,
          apellidos,
          telefono,
          rol, 
          sucursal_id,
          sucursales(nombre)
        `);
      if (error) throw error;
      setStaffList(data || []);
    } catch (error) {
      console.error("Error al cargar personal:", error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegisterStaff = async (e) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      alert("🌸 La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setLoading(true);

    try {
      // 1. Registrar credenciales únicamente en Supabase Auth
      // Al incluir los datos en options.data, el Trigger de tu base de datos creará el perfil automáticamente
      // de forma limpia y SIN generar errores de llaves duplicadas ("perfiles_pkey").
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.correo,
        password: formData.password,
        options: {
          data: {
            nombre: formData.nombre,
            apellidos: formData.apellidos,
            telefono: formData.telefono,
            rol: formData.rol, // 'administrador', 'gerente' o 'vendedor'
            sucursal_id: Number(formData.sucursal_id),
            correo_original: formData.correo 
          }
        }
      });

      if (authError) throw authError;

      alert(`¡Trabajador registrado con éxito! Rol: ${formData.rol.toUpperCase()} 🌸`);
      
      // Limpiar formulario y refrescar lista automáticamente
      setFormData({
        nombre: '',
        apellidos: '',
        telefono: '',
        correo: '',
        password: '',
        rol: 'vendedor',
        sucursal_id: sucursales[0]?.id || ''
      });
      fetchStaff();

    } catch (error) {
      alert("Error al registrar personal: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async (id, rol) => {
    if (rol === 'administrador') {
      alert("No puedes eliminar a un administrador global por seguridad 🌸");
      return;
    }
    const seguro = window.confirm("¿Segura que deseas quitar los permisos de acceso a este trabajador?");
    if (!seguro) return;

    try {
      const { error } = await supabase.from('perfiles').delete().eq('id', id);
      if (error) throw error;
      alert("Permisos administrativos removidos con éxito.");
      fetchStaff();
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  return (
    <div className="staff-container">
      {/* SECCIÓN 1: FORMULARIO DE REGISTRO */}
      <div className="staff-card-form">
        <div className="staff-form-header">
          <UserPlus size={20} color="#cf69d4" />
          <h4>Dar de Alta Nuevo Personal</h4>
        </div>
        
        <form onSubmit={handleRegisterStaff} className="staff-form">
          <div className="staff-form-row">
            <div className="staff-input-group">
              <label><User size={14}/> Nombre(s)</label>
              <input required name="nombre" type="text" value={formData.nombre} onChange={handleInputChange} placeholder="Ej. Ana" />
            </div>
            <div className="staff-input-group">
              <label><User size={14}/> Apellidos</label>
              <input required name="apellidos" type="text" value={formData.apellidos} onChange={handleInputChange} placeholder="Ej. Juárez" />
            </div>
          </div>

          <div className="staff-form-row">
            <div className="staff-input-group">
              <label><Mail size={14}/> Correo Institucional</label>
              <input required name="correo" type="email" value={formData.correo} onChange={handleInputChange} placeholder="ejemplo@jaitreshermanas.com" />
            </div>
            <div className="staff-input-group">
              <label><Phone size={14}/> Teléfono</label>
              <input required name="telefono" type="tel" value={formData.telefono} onChange={handleInputChange} placeholder="8331234567" />
            </div>
          </div>

          <div className="staff-input-group">
            <label><Lock size={14}/> Contraseña de Acceso</label>
            <input required name="password" type="password" value={formData.password} onChange={handleInputChange} placeholder="Mínimo 6 letras/números" />
          </div>

          <div className="staff-form-row">
            <div className="staff-input-group">
              <label><Shield size={14}/> Rol / Nivel de Acceso</label>
              <select name="rol" value={formData.rol} onChange={handleInputChange}>
                <option value="vendedor">Vendedor / Cajero</option>
                <option value="gerente">Gerente</option>
                <option value="administrador">Administrador</option>
              </select>
            </div>

            <div className="staff-input-group">
              <label><MapPin size={14}/> Sucursal Asignada</label>
              <select name="sucursal_id" value={formData.sucursal_id} onChange={handleInputChange}>
                {sucursales.map(suc => (
                  <option key={suc.id} value={suc.id}>{suc.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" className="staff-submit-btn" disabled={loading}>
            {loading ? 'Guardando en JAI...' : 'Registrar Empleado ✨'}
          </button>
        </form>
      </div>

      {/* SECCIÓN 2: TABLA DE PERSONAL ACTIVO */}
      <div className="staff-card-list">
        <div className="staff-form-header">
          <Users size={20} color="#cf69d4" />
          <h4>Personal con Acceso al Sistema ({staffList.length})</h4>
        </div>

        <div className="staff-table-wrapper">
          <table className="staff-table">
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Contacto</th>
                <th>Rol Asignado</th>
                <th>Sucursal</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="staff-name-cell">
                      <strong>{item.nombre} {item.apellidos}</strong>
                      <span className="staff-sub-email">ID de Personal Activo</span>
                    </div>
                  </td>
                  <td>
                    <span className="staff-phone-text">{item.telefono || 'N/A'}</span>
                  </td>
                  <td>
                    <span className={`staff-badge ${item.rol}`}>
                      {item.rol}
                    </span>
                  </td>
                  <td>{item.sucursales?.nombre || `Sucursal #${item.sucursal_id}`}</td>
                  <td>
                    <button className="staff-delete-btn" onClick={() => handleDeleteStaff(item.id, item.rol)} title="Remover Acceso">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffView;