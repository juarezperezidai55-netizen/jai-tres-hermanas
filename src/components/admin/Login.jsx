import React, { useState } from 'react';
import { supabase } from '../../api/supabaseClient';
import { Lock, Mail, Loader } from 'lucide-react';
import './Login.css';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); 
    
    try {
      // 1. Autenticación perimetral de Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (authError) throw authError;

      const user = authData?.user;

      if (user) {
        // 2. Consulta de Control de Acceso Basado en Roles (RBAC)
        // Buscamos en tu tabla de perfiles/roles el rol asignado por el admin a este id
        const { data: perfil, error: perfilError } = await supabase
          .from('perfiles') // Cambia 'perfiles' por el nombre exacto de tu tabla de roles si se llama diferente
          .select('rol, sucursal_id')
          .eq('id', user.id)
          .maybeSingle();

        if (perfilError) throw perfilError;

        // Fallback seguro si el admin no le ha asignado un rol específico en la tabla pública
        const rolAsignado = perfil?.rol || 'cajero'; 
        const sucursalAsignada = perfil?.sucursal_id || null;

        // 3. Enviamos los privilegios al estado global de la aplicación
        onLoginSuccess({
  uid: user.id,
  email: user.email,
  rol: rolAsignado, // <-- Aquí mandas el rol exacto de la base de datos
  sucursal_id: sucursalAsignada
});
      }

    } catch (error) {
      alert("Error de Autenticación: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-card" onSubmit={handleLogin}>
        <div className="login-logo">JAI <span>Admin</span></div>
        <h2>Bienvenida Administradora</h2>
        <div className="input-group">
          <label><Mail size={16}/> Correo</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="input-group">
          <label><Lock size={16}/> Contraseña</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? <Loader className="spin" /> : 'Entrar al Panel'}
        </button>
      </form>
    </div>
  );
};

export default Login;