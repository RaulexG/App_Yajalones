import React, { useState } from 'react';
import './Login.css';
import combiImage from '../assets/combi.png'; 

function Login() {
  const [nombre, setNombre] = useState('');
  const [contrasena, setContrasena] = useState('');

  const handleLogin = () => {
    alert(`Iniciando sesión como: ${nombre}`);
    
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <img src={combiImage} alt="Combi Yajalones" className="combi-image" />
        <label>Nombre</label>
        <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <label>Contraseña</label>
        <input type="password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} />
        <button onClick={handleLogin}>Iniciar sesión</button>
      </div>
    </div>
  );
}

export default Login;
