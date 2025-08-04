import { useEffect, useState } from 'react';
import {
  CrearTurno,
  CrearUnidad,
  CrearViaje,
  ListarTurnos,
  ListarUnidades,
  ListarViajes,
  ActualizarTurno,
  ActualizarUnidad,
  ActualizarViaje
} from '../../services/Admin/adminService';

export default function Ajustes() {
  const [nombreCuenta, setNombreCuenta] = useState('Administrador'); // temporal

  const [turnoForm, setTurnoForm] = useState({ horario: '', idTurno: null });
  const [unidadForm, setUnidadForm] = useState({ nombre: '', descripcion: '', idTurno: '', idUnidad: null });
  const [viajeForm, setViajeForm] = useState({ origen: '', destino: '', fechaSalida: '', idUnidad: '', idViaje: null });

  const [turnos, setTurnos] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [viajes, setViajes] = useState([]);

  const [mostrarTabla, setMostrarTabla] = useState(null);

  const cargarDatos = async () => {
    const t = await ListarTurnos();
    const u = await ListarUnidades();
    const v = await ListarViajes();
    setTurnos(t);
    setUnidades(u);
    setViajes(v);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleGuardarTurno = async () => {
    if (turnoForm.idTurno) {
      await ActualizarTurno(turnoForm.idTurno, { horario: turnoForm.horario });
    } else {
      await CrearTurno({ horario: turnoForm.horario });
    }
    setTurnoForm({ horario: '', idTurno: null });
    cargarDatos();
  };

  const handleGuardarUnidad = async () => {
    const datos = {
      nombre: unidadForm.nombre,
      descripcion: unidadForm.descripcion,
      activo: true,
      turno: { idTurno: parseInt(unidadForm.idTurno) }
    };
    if (unidadForm.idUnidad) {
      await ActualizarUnidad(unidadForm.idUnidad, datos);
    } else {
      await CrearUnidad(datos);
    }
    setUnidadForm({ nombre: '', descripcion: '', idTurno: '', idUnidad: null });
    cargarDatos();
  };

  const handleGuardarViaje = async () => {
    const datos = {
      origen: viajeForm.origen,
      destino: viajeForm.destino,
      fechaSalida: viajeForm.fechaSalida,
      unidad: { idUnidad: parseInt(viajeForm.idUnidad) }
    };
    if (viajeForm.idViaje) {
      await ActualizarViaje(viajeForm.idViaje, datos);
    } else {
      await CrearViaje(datos);
    }
    setViajeForm({ origen: '', destino: '', fechaSalida: '', idUnidad: '', idViaje: null });
    cargarDatos();
  };

  const cerrarTabla = () => setMostrarTabla(null);

  const TablaDatos = () => {
    const columnas = {
      turnos: ['ID', 'Horario', 'Acciones'],
      unidades: ['ID', 'Nombre', 'Descripción', 'Turno', 'Acciones'],
      viajes: ['ID', 'Origen', 'Destino', 'Unidad', 'Acciones']
    };

    const datos = { turnos, unidades, viajes };

    const editar = (tipo, item) => {
      if (tipo === 'turnos') {
        setTurnoForm({ horario: item.horario, idTurno: item.idTurno });
      }
      if (tipo === 'unidades') {
        setUnidadForm({ nombre: item.nombre, descripcion: item.descripcion, idTurno: item.turno?.idTurno || '', idUnidad: item.idUnidad });
      }
      if (tipo === 'viajes') {
        const origen = item.origen;
        const destino = item.destino;
        setViajeForm({
          origen,
          destino,
          fechaSalida: item.fechaSalida,
          idUnidad: item.unidad?.idUnidad || '',
          idViaje: item.idViaje
        });
      }
      cerrarTabla();
    };

    const filas = {
      turnos: turnos.map(t => [t.idTurno, t.horario, t]),
      unidades: unidades.map(u => [u.idUnidad, u.nombre, u.descripcion, u.turno?.horario || '', u]),
      viajes: viajes.map(v => [v.idViaje, v.origen, v.destino, v.unidad?.nombre || '', v])
    };

    if (!mostrarTabla) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-4 rounded w-full max-w-4xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold capitalize">Lista de {mostrarTabla}</h3>
            <button onClick={cerrarTabla} className="text-red-500 font-bold">X</button>
          </div>
          <table className="w-full border">
            <thead>
              <tr>
                {columnas[mostrarTabla].map(col => (
                  <th key={col} className="border p-2 bg-gray-100">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas[mostrarTabla].map((fila, idx) => (
  <tr key={idx}>
    {fila.map((cell, i) => {
      if (i === fila.length - 1 && mostrarTabla !== 'viajes') {
        return (
          <td key={i} className="border p-2">
            <button className="text-blue-600 underline" onClick={() => editar(mostrarTabla, cell)}>Editar</button>
          </td>
        );
      }
      if (i === fila.length - 1 && mostrarTabla === 'viajes') {
        return <td key={i} className="border p-2"></td>;
      }
      return <td key={i} className="border p-2">{cell}</td>;
    })}
  </tr>
))}

            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">Ajustes del sistema</h1>
      <p className="text-gray-600">Bienvenido, {nombreCuenta}</p>

      <section>
        <h2 className="font-bold mb-2 mt-6">Registrar turno</h2>
        <div className="flex items-center gap-2">
          <input value={turnoForm.horario} onChange={e => setTurnoForm({ ...turnoForm, horario: e.target.value })} className="border p-1" placeholder="Horario" />
          <button onClick={handleGuardarTurno} className="bg-green-500 text-white px-3 py-1 rounded">Guardar</button>
          <button onClick={() => setMostrarTabla('turnos')} className="bg-blue-500 text-white px-3 py-1 rounded">Mostrar turnos</button>
        </div>
      </section>

      <section>
        <h2 className="font-bold mb-2 mt-6">Registrar unidad</h2>
        <div className="grid grid-cols-2 gap-2">
          <input value={unidadForm.nombre} onChange={e => setUnidadForm({ ...unidadForm, nombre: e.target.value })} className="border p-1" placeholder="Nombre" />
          <input value={unidadForm.descripcion} onChange={e => setUnidadForm({ ...unidadForm, descripcion: e.target.value })} className="border p-1" placeholder="Descripción" />
          <select value={unidadForm.idTurno} onChange={e => setUnidadForm({ ...unidadForm, idTurno: e.target.value })} className="border p-1">
            <option value="">Seleccionar turno</option>
            {turnos.map(t => (
              <option key={t.idTurno} value={t.idTurno}>{t.horario}</option>
            ))}
          </select>
          <button onClick={handleGuardarUnidad} className="bg-green-500 text-white px-3 py-1 rounded">Guardar</button>
        </div>
        <button onClick={() => setMostrarTabla('unidades')} className="mt-2 bg-blue-500 text-white px-3 py-1 rounded">Mostrar unidades</button>
      </section>

      <section>
        <h2 className="font-bold mb-2 mt-6">Registrar viaje</h2>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={viajeForm.origen}
            onChange={(e) => {
              const origenSeleccionado = e.target.value;
              const destinoAutomatico = origenSeleccionado === 'Tuxtla Gutierrez' ? 'Yajalon' : 'Tuxtla Gutierrez';
              setViajeForm({
                ...viajeForm,
                origen: origenSeleccionado,
                destino: destinoAutomatico
              });
            }}
            className="border p-1"
          >
            <option value="">Seleccionar origen</option>
            <option value="Tuxtla Gutierrez">Tuxtla Gtz</option>
            <option value="Yajalon">Yajalón</option>
          </select>

          <input
            value={viajeForm.destino}
            readOnly
            className="border p-1 bg-gray-100 text-gray-700"
            placeholder="Destino automático"
          />

          <input
            type="datetime-local"
            value={viajeForm.fechaSalida}
            onChange={(e) => setViajeForm({ ...viajeForm, fechaSalida: e.target.value })}
            className="border p-1"
          />

          <select
            value={viajeForm.idUnidad}
            onChange={(e) => setViajeForm({ ...viajeForm, idUnidad: e.target.value })}
            className="border p-1"
          >
            <option value="">Seleccionar unidad</option>
            {unidades.map((u) => (
              <option key={u.idUnidad} value={u.idUnidad}>
                {u.nombre}
              </option>
            ))}
          </select>

          <button
            onClick={handleGuardarViaje}
            className="bg-green-500 text-white px-3 py-1 rounded"
          >
            Guardar
          </button>
        </div>
        <button
          onClick={() => setMostrarTabla('viajes')}
          className="mt-2 bg-blue-500 text-white px-3 py-1 rounded"
        >
          Mostrar viajes
        </button>
      </section>

      <TablaDatos />
    </div>
  );
}
