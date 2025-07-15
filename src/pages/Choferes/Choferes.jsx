import { useEffect, useState } from 'react';
import { CrearChofer, ListarChoferes, ActualizarChofer } from '../../services/Admin/adminService';

export default function Choferes() {
  const [formulario, setFormulario] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    unidad: { idUnidad: '' },
    activo: true
  });

  const [choferes, setChoferes] = useState([]);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [idChoferEditando, setIdChoferEditando] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'idUnidad') {
      setFormulario({ ...formulario, unidad: { idUnidad: parseInt(value) } });
    } else {
      setFormulario({ ...formulario, [name]: value });
    }
  };

  const cargarChoferes = async () => {
    try {
      const data = await ListarChoferes();
      setChoferes(data);
    } catch (err) {
      console.error('Error al obtener choferes:', err);
      setError('No se pudieron cargar los choferes');
    }
  };

  
  const seleccionarChofer = (chofer) => {
    setFormulario({
      nombre: chofer.nombre,
      apellido: chofer.apellido,
      telefono: chofer.telefono,
      unidad: { idUnidad: chofer.unidad?.idUnidad || '' },
      activo: chofer.activo
    });
    setIdChoferEditando(chofer.idChofer);
    setMensaje('');
    setError('');
  };

  const guardarChofer = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');

    const { nombre, apellido, telefono, unidad } = formulario;
    if (!nombre || !apellido || !telefono || !unidad.idUnidad) {
      setError('Todos los campos son obligatorios');
      return;
    }

    try {
      if (idChoferEditando) {
  console.log('Actualizando chofer:', idChoferEditando, formulario);
  await ActualizarChofer(idChoferEditando, {
    nombre: formulario.nombre,
    apellido: formulario.apellido,
    telefono: formulario.telefono,
    activo: formulario.activo,
    unidad: { idUnidad: formulario.unidad.idUnidad }
  });
  setMensaje('Unidad del chofer actualizada');
}
 else {
        
        await CrearChofer(formulario);
        setMensaje('Chofer registrado correctamente');
      }

      setFormulario({
        nombre: '',
        apellido: '',
        telefono: '',
        unidad: { idUnidad: '' },
        activo: true
      });
      setIdChoferEditando(null);
      cargarChoferes();
    } catch (err) {
      console.error('Error al guardar chofer:', err);
      setError('Error al guardar chofer');
    }
  };

  useEffect(() => {
    cargarChoferes();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Registrar Chofer</h2>

      {mensaje && <p className="text-green-600">{mensaje}</p>}
      {error && <p className="text-red-600">{error}</p>}

      <form onSubmit={guardarChofer} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <input
          type="text"
          name="nombre"
          value={formulario.nombre}
          onChange={handleChange}
          placeholder="Nombre"
          className="border px-3 py-2 rounded"
          disabled={!!idChoferEditando}
        />
        <input
          type="text"
          name="apellido"
          value={formulario.apellido}
          onChange={handleChange}
          placeholder="Apellido"
          className="border px-3 py-2 rounded"
          disabled={!!idChoferEditando}
        />
        <input
          type="text"
          name="telefono"
          value={formulario.telefono}
          onChange={handleChange}
          placeholder="Teléfono"
          className="border px-3 py-2 rounded"
          disabled={!!idChoferEditando}
        />
        <input
          type="number"
          name="idUnidad"
          value={formulario.unidad.idUnidad}
          onChange={handleChange}
          placeholder="ID de la unidad"
          className="border px-3 py-2 rounded"
        />
        <div className="md:col-span-2">
          <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
            {idChoferEditando ? 'Actualizar Unidad' : 'Guardar Chofer'}
          </button>
        </div>
      </form>

      <h2 className="text-xl font-semibold mb-2">Choferes Registrados</h2>

      <table className="w-full text-sm border shadow">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">#</th>
            <th className="p-2 border">Nombre</th>
            <th className="p-2 border">Apellido</th>
            <th className="p-2 border">Teléfono</th>
            <th className="p-2 border">Unidad</th>
            <th className="p-2 border">Activo</th>
            <th className="p-2 border">Acción</th>
          </tr>
        </thead>
        <tbody>
          {choferes.map((c, i) => (
            <tr key={i} className="text-center">
              <td className="p-2 border">{i + 1}</td>
              <td className="p-2 border">{c.nombre}</td>
              <td className="p-2 border">{c.apellido}</td>
              <td className="p-2 border">{c.telefono}</td>
              <td className="p-2 border">{c.unidad?.idUnidad || '—'}</td>
              <td className="p-2 border">{c.activo ? 'Sí' : 'No'}</td>
              <td className="p-2 border">
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-sm"
                  onClick={() => seleccionarChofer(c)}
                >
                  Editar
                </button>
              </td>
            </tr>
          ))}
          {choferes.length === 0 && (
            <tr>
              <td colSpan="7" className="text-center text-gray-500 py-4">
                No hay choferes registrados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
