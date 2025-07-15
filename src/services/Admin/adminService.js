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