import React, { useState } from 'react';
import { supabase } from '../../api/supabaseClient';
import { Mail, Lock, User, Phone, MapPin, ArrowRight, Heart } from 'lucide-react';
import './AuthCustomer.css';

const AuthCustomer = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true); // Cambia entre Login y Registro
  const [loading, setLoading] = useState(false);
  
  // NUEVO ESTADO: Controlador visual para el menú desplegable de la ciudad
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState("");
  
  // Datos del formulario
  const [formData, setFormData] = useState({
    nombre: '', apellidos: '', correo: '', telefono: '', password: '', ciudad: ''
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // --- LÓGICA DE INICIO DE SESIÓN ---
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.correo,
          password: formData.password,
        });
        if (error) throw error;
        alert("¡Bienvenida de nuevo a JAI! 🌸");
        onLoginSuccess(data.user);
      } else {
        // --- LÓGICA DE REGISTRO ---
        // 1. Crear usuario en Auth de Supabase
        const { data: { user }, error: authError } = await supabase.auth.signUp({
          email: formData.correo,
          password: formData.password,
        });
        if (authError) throw authError;

        if (user) {
          // 2. Insertar datos en tu nueva tabla de 'clientes'
          const { error: dbError } = await supabase
            .from('clientes')
            .insert([{
              id: user.id,
              nombre: formData.nombre,
              apellidos: formData.apellidos,
              correo: formData.correo,
              telefono: formData.telefono,
              ciudad: formData.ciudad
            }]);
          if (dbError) throw dbError;
          alert("¡Cuenta creada con éxito! Ya puedes iniciar sesión. ✨");
          setIsLogin(true);
        }
      }
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-customer-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">JAI <span>TRES HERMANAS</span></div>
          <h2>{isLogin ? '¡Hola de nuevo!' : 'Únete a nuestra familia'}</h2>
          <p>{isLogin ? 'Ingresa para gestionar tus pedidos.' : 'Regístrate para una compra más rápida.'}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-row">
              <div className="input-group">
                <label><User size={14}/> Nombre</label>
                <input required name="nombre" type="text" onChange={handleInputChange} />
              </div>
              <div className="input-group">
                <label>Apellidos</label>
                <input required name="apellidos" type="text" onChange={handleInputChange} />
              </div>
            </div>
          )}

          <div className="input-group">
            <label><Mail size={14}/> Correo Electrónico</label>
            <input required name="correo" type="email" onChange={handleInputChange} />
          </div>

          {!isLogin && (
            <div className="form-row">
              <div className="input-group">
                <label><Phone size={14}/> Teléfono</label>
                <input required name="telefono" type="text" placeholder="10 dígitos" onChange={handleInputChange} />
              </div>
              
              {/* --- INICIO DE ZONA MODIFICADA (CIUDAD ESTRICTA) --- */}
              <div className="input-group">
                <label><MapPin size={14}/> Ciudad</label>
                
                <select 
                  name="ciudad" 
                  value={ciudadSeleccionada}
                  onChange={(e) => {
                    setCiudadSeleccionada(e.target.value);
                    if (e.target.value !== 'Otra') {
                      // Si selecciona una ciudad de la lista, la guardamos directamente
                      handleInputChange(e); 
                    } else {
                      // Si elige "Otra", limpiamos el estado de ciudad para que escriba la suya
                      handleInputChange({ target: { name: 'ciudad', value: '' } });
                    }
                  }}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    borderRadius: '6px', 
                    border: '1px solid #ccc', 
                    marginBottom: ciudadSeleccionada === 'Otra' ? '10px' : '0' 
                  }}
                >
                  <option value="" disabled>Selecciona tu ciudad...</option>
                  <option value="Tampico">Tampico</option>
                  <option value="Ciudad Madero">Ciudad Madero</option>
                  <option value="Pánuco">Pánuco</option>
                  <option value="El Higo">El Higo</option>
                  <option value="Otra">Otro lugar (Paquetería)...</option>
                </select>

                {ciudadSeleccionada === 'Otra' && (
                  <input 
                    required 
                    name="ciudad" 
                    type="text" 
                    placeholder="Escribe el nombre exacto de tu ciudad" 
                    onChange={handleInputChange} 
                    className="animate-in"
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cf69d4' }}
                  />
                )}
              </div>
              {/* --- FIN DE ZONA MODIFICADA --- */}
              
            </div>
          )}

          <div className="input-group">
            <label><Lock size={14}/> Contraseña</label>
            <input required name="password" type="password" onChange={handleInputChange} />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Procesando...' : isLogin ? 'Entrar a JAI' : 'Crear mi Cuenta 🌸'}
          </button>
        </form>

        <div className="auth-footer">
          {isLogin ? (
            <p>¿No tienes cuenta? <button onClick={() => setIsLogin(false)}>Regístrate aquí</button></p>
          ) : (
            <p>¿Ya tienes cuenta? <button onClick={() => setIsLogin(true)}>Inicia Sesión</button></p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthCustomer;