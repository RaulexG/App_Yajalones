import axios from './api';

//CHOFERES-------------------------------------------------

// Listar choferes
export const ListarChoferes = async () => {
  try {
    const response = await axios.get('/choferes');
    return response.data;
  } catch (error) {
    console.error('Error obteniendo choferes:', error);
    throw error;
  }
};

// Crear chofer
export const CrearChofer = async (chofer) => {
  try {
    const response = await axios.post('/choferes', chofer);
    return response.data;
  } catch (error) {
    console.error('Error creando chofer:', error);
    throw error;
  }
};

// Obtener chofer por ID
export const ObtenerChoferPorId = async (id) => {
  try {
    const response = await axios.get(`/choferes/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo chofer por ID:', error);
    throw error;
  }
};

// Actualizar chofer
export const ActualizarChofer = async (id, chofer) => {
  try {
    const response = await axios.put(`/choferes/${id}`, chofer);
    return response.data;
  } catch (error) {
    console.error('Error actualizando chofer:', error);
    throw error;
  }
};
// Eliminar chofer
export const EliminarChofer = async (id) => {
  try {
    const response = await axios.delete(`/choferes/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error eliminando chofer:', error);
    throw error;
  }
};

//UNIDADES------------------------------------------

// Listar unidades
export const ListarUnidades = async () => {
  try {
    const response = await axios.get('/unidades');
    return response.data;
  } catch (error) {
    console.error('Error obteniendo unidades:', error);
    throw error;
  }
};

// Crear unidad
export const CrearUnidad = async (unidad) => {
  try {
    const response = await axios.post('/unidades', unidad);
    return response.data;
  } catch (error) {
    console.error('Error creando unidad:', error);
    throw error;
  }
};

// Obtener unidad por ID
export const ObtenerUnidadPorId = async (id) => {
  try {
    const response = await axios.get(`/unidades/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo unidad por ID:', error);
    throw error;
  }
};


// Actualizar unidad
export const ActualizarUnidad = async (id, unidad) => {
  try {
    const response = await axios.put(`/unidades/${id}`, unidad);
    return response.data;
  } catch (error) {
    console.error('Error actualizando unidad:', error);
    throw error;
  }
};

// VIAJES------------------------------------------

// Listar viajes
export const ListarViajes = async () => {
  try {
    const response = await axios.get('/viajes');
    return response.data;
  } catch (error) {
    console.error('Error obteniendo viajes:', error);
    throw error;
  }
}

// Crear viaje
export const CrearViaje = async (viaje) => {
  try {
    const response = await axios.post('/viajes', viaje);
    return response.data;
  } catch (error) {
    console.error('Error creando viaje:', error);
    throw error;
  }
}

// Actualizar viaje
export const ActualizarViaje = async (id, viaje) => {
  try {
    const response = await axios.put(`/viajes/${id}`, viaje);
    return response.data;
  } catch (error) {
    console.error('Error actualizando viaje:', error);
    throw error;
  }
}

// Eliminar viaje
export const EliminarViaje = async (id) => {
  try {
    const response = await axios.delete(`/viajes/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error eliminando viaje:', error);
    throw error;
  }
}

// Obtener viaje por ID
export const ObtenerViajePorId = async (id) => {
  try {
    const response = await axios.get(`/viajes/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo viaje por ID:', error);
    throw error;
  }
}

//Paquetes------------------------------------------------------------
// Listar paquetes
export const ListarPaquetes = async () => {
  try {
    const response = await axios.get('/paquetes');
    return response.data;
  } catch (error) {
    console.error('Error obteniendo paquetes:', error);
    throw error;
  }
}
// Crear paquete
export const crearPaquete = async (paquete) => {   
  try {
    const response = await axios.post('/paquetes', paquete);
    return response.data;
  } catch (error) {
    console.error('Error creando paquete:', error);
    throw error;
  }
}

// Actualizar paquete
export const actualizarPaquete = async (id, paquete) => {
  try {
    const response = await axios.put(`/paquetes/${id}`, paquete);
    return response.data;
  } catch (error) {
    console.error('Error actualizando paquete:', error);
    throw error;
  }
}

// Eliminar paquete
export const eliminarPaquete = async (id) => {
  try {
    const response = await axios.delete(`/paquetes/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error eliminando paquete:', error);
    throw error;
  }
}

// paquete pendiente
export const paquetePendiente = async (data) => {
  try {
    const response = await axios.post(`/paquetes/pendiente`, data, {
      headers: { "Content-Type": "application/json" }
    });
    return response.data;
  } catch (error) {
    console.error('Error marcando paquete como pendiente:', error.response?.data || error);
    throw error;
  }
};


// Obtener paquetes pendientes
export const obtenerPaquetesPendientes = async () => {
  try {
    const response = await axios.get('/paquetes/pendientes');
    return response.data;
  } catch (error) {
    console.error('Error obteniendo paquetes pendientes:', error);
    throw error;
  }
}

// Asignar paquete a viaje
export const asignarPaqueteAViaje = async (idPaquete, idViaje) => {
  try {
    const response = await axios.put(`/paquetes/confirmar/${idPaquete}/${idViaje}`);
    return response.data;
  } catch (error) {
    console.error('Error asignando paquete a viaje:', error);
    throw error;
  }
}

// Pasajeros------------------------------------------------------------
// Listar pasajeros
export const ListarPasajeros = async () => {
  try {
    const response = await axios.get('/pasajeros');
    return response.data;
  } catch (error) {
    console.error('Error obteniendo pasajeros:', error);
    throw error;
  }
}

// Crear pasajeros
export const CrearPasajeros = async (pasajeroData) => {
  try {
    const response = await axios.post('/pasajeros', pasajeroData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error creando pasajero:', error);
    throw error;
  }
};

// Actualizar pasajero
export const ActualizarPasajero = async (id, pasajeroData) => {
  try {
    const response = await axios.put(`/pasajeros/${id}`, pasajeroData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error actualizando pasajero:', error);
    throw error;
  }
};
// Eliminar pasajero
export const EliminarPasajero = async (id) => {
  try {
    const response = await axios.delete(`/pasajeros/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error eliminando pasajero:', error);
    throw error;
  }
};


// Turnos------------------------------------------------------------
// Listar turnos
export const ListarTurnos = async () => {
  try {
    const response = await axios.get('/turnos');
    return response.data;
  } catch (error) {
    console.error('Error obteniendo turnos:', error);
    throw error;
  }
}

// turnos mejorados


// Crear turno 
export const CrearTurno = async (turno) => {
  try {
    // Acepta tanto un string "HH:mm:ss" como un objeto { horario, activo }
    const body = typeof turno === 'string'
      ? { horario: turno, activo: true }
      : {
          horario: turno?.horario,
          activo: typeof turno?.activo === 'boolean' ? turno.activo : true,
        };

    const response = await axios.post('/turnos', body);
    return response.data;
  } catch (error) {
    console.error('Error creando turno:', error);
    throw error;
  }
};

// Actualizar turno
export const ActualizarTurno = async (id, turno) => {
  try {
    const body = {
      horario: turno?.horario ?? turno, // permite pasar string
      activo: typeof turno?.activo === 'boolean' ? turno.activo : true,
    };
    const response = await axios.put(`/turnos/${id}`, body);
    return response.data;
  } catch (error) {
    console.error('Error actualizando turno:', error);
    throw error;
  }
};

//Agregar opcion

// Eliminar turno
export const EliminarTurno = async (id) => {
  try {
    const response = await axios.delete(`/turnos/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error eliminando turno:', error);
    throw error;
  }
};

//----------------login-----

// Login (POST /inicioSesion) → devuelve access_token (JWT)
export const inicioSesion = async (nombreUsuario, password) => {
  try {
    const response = await axios.post('/inicioSesion', { nombreUsuario, password });
    // La API sólo devuelve el token en "access_token"
    return response.data?.access_token || null;
  } catch (error) {
    console.error('Error iniciando sesión:', error);
    throw error;
  }
};

// Logout (POST /logout) → no devuelve nada, sólo invalida el token
export const logout = async () => {
  try {
    await axios.post('/logout');
    return true; // Logout exitoso
  } catch (error) {
    console.error('Error cerrando sesión:', error);
    throw error;
  }
};
