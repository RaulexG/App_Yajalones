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
  ActualizarViaje,
  EliminarViaje
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
      idUnidad:parseInt(viajeForm.idUnidad)
    };
    console.log('Datos del viaje:', datos);
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
      viajes: ['ID', 'Origen', 'Destino', 'Unidad', 'Fecha de Salida']
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
      viajes: viajes.map(v => [v.idViaje, v.origen, v.destino, v.unidad?.nombre,v.fechaSalida.toLocaleString() || '', v])
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
  const viaje = cell;
  return (
    <td key={i} className="border p-2">
      <button
        className="text-red-600 underline mr-2"
        onClick={async () => {
          if (window.confirm('¿Estás seguro de eliminar este viaje?')) {
            await EliminarViaje(viaje.idViaje);
            cargarDatos();
          }
        }}
      >
        Eliminar
      </button>
    </td>
  );
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
      <h1 className="text-2xl font-bold text-orange-800">Ajustes del sistema</h1>
      <p className="text-gray-600">Bienvenido, {nombreCuenta}</p>

      
      {/* Sección Cuenta */}
      {/*<section className="bg-[#fff7ec] p-6 rounded-lg shadow-md">
        <h2 className="text-orange-700 font-bold text-lg mb-4">Cuenta</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <label className="block text-orange-700 font-semibold mb-1">Nombre</label>
              <input
                type="text"
                value={cuentaForm.nombre}
                onChange={(e) => setCuentaForm({ ...cuentaForm, nombre: e.target.value })}
                className="w-full p-3 rounded-md bg-[#ffe0b2] outline-none"
              />
            </div>
            <div>
              <label className="block text-orange-700 font-semibold mb-1">Contraseña</label>
              <input
                type="password"
                value={cuentaForm.contrasena}
                onChange={(e) => setCuentaForm({ ...cuentaForm, contrasena: e.target.value })}
                className="w-full p-3 rounded-md bg-[#ffe0b2] outline-none"
              />
            </div>
          </div>
          <div className="flex flex-col gap-4 justify-center">
            <button
              onClick={handleGuardarCuenta}
              className="bg-[#cc4500] text-white font-semibold px-6 py-2 rounded-md hover:bg-orange-800"
            >
              Guardar
            </button>
            <button
              onClick={handleEliminarCuenta}
              className="bg-[#cc4500] text-white font-semibold px-6 py-2 rounded-md hover:bg-orange-800"
            >
              Eliminar cuenta
            </button>
          </div>
        </div>
      </section>*/}

      {/* Sección Tarifas */}
      {/*<section className="bg-[#fff7ec] p-6 rounded-lg shadow-md">
        <h2 className="text-orange-700 font-bold text-lg mb-4">Tarifas</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <label className="block text-orange-700 font-semibold mb-1">Adulto</label>
              <input
                type="number"
                value={tarifas.adulto}
                onChange={(e) => setTarifas({ ...tarifas, adulto: e.target.value })}
                className="w-full p-3 rounded-md bg-[#ffe0b2] outline-none"
              />
            </div>
            <div>
              <label className="block text-orange-700 font-semibold mb-1">Niño</label>
              <input
                type="number"
                value={tarifas.nino}
                onChange={(e) => setTarifas({ ...tarifas, nino: e.target.value })}
                className="w-full p-3 rounded-md bg-[#ffe0b2] outline-none"
              />
            </div>
            <div>
              <label className="block text-orange-700 font-semibold mb-1">Incent/Inapam</label>
              <input
                type="number"
                value={tarifas.inapam}
                onChange={(e) => setTarifas({ ...tarifas, inapam: e.target.value })}
                className="w-full p-3 rounded-md bg-[#ffe0b2] outline-none"
              />
            </div>
          </div>
          <div className="flex flex-col gap-4 justify-center">
            <button
              onClick={handleGuardarTarifas}
              className="bg-[#cc4500] text-white font-semibold px-6 py-2 rounded-md hover:bg-orange-800"
            >
              Guardar
            </button>
            <button
              onClick={handleActualizarTarifas}
              className="bg-[#cc4500] text-white font-semibold px-6 py-2 rounded-md hover:bg-orange-800"
            >
              Actualizar
            </button>
          </div>
        </div>
      </section>*/}

      {/* Sección Registrar Turno */}
      <section className="bg-[#fff7ec] p-6 rounded-lg shadow-md">
        <h2 className="text-orange-700 font-bold text-lg mb-4">Registrar turno</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-orange-700 font-semibold mb-1">Horario</label>
            <input
              value={turnoForm.horario}
              onChange={(e) => setTurnoForm({ ...turnoForm, horario: e.target.value })}
              className="w-full p-2 rounded-md bg-[#ffe0b2] outline-none"
            />
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleGuardarTurno}
              className="bg-[#cc4500] text-white font-semibold px-6 py-2 rounded-md hover:bg-orange-800"
            >
              Guardar
            </button>
            <button
              onClick={() => setMostrarTabla('turnos')}
              className="bg-[#cc4500] text-white font-semibold px-6 py-2 rounded-md hover:bg-orange-800"
            >
              Mostrar turnos
            </button>
          </div>
        </div>
      </section>

      {/* Sección Registrar Unidad */}
      <section className="bg-[#fff7ec] p-6 rounded-lg shadow-md">
        <h2 className="text-orange-700 font-bold text-lg mb-4">Registrar unidad</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-orange-700 font-semibold mb-1">Nombre</label>
            <input
              value={unidadForm.nombre}
              onChange={(e) => setUnidadForm({ ...unidadForm, nombre: e.target.value })}
              className="w-full p-2 rounded-md bg-[#ffe0b2] outline-none"
            />
          </div>
          <div>
            <label className="block text-orange-700 font-semibold mb-1">Descripción</label>
            <input
              value={unidadForm.descripcion}
              onChange={(e) => setUnidadForm({ ...unidadForm, descripcion: e.target.value })}
              className="w-full p-2 rounded-md bg-[#ffe0b2] outline-none"
            />
          </div>
          <div>
            <label className="block text-orange-700 font-semibold mb-1">Turno</label>
            <select
              value={unidadForm.idTurno}
              onChange={(e) => setUnidadForm({ ...unidadForm, idTurno: e.target.value })}
              className="w-full p-2 rounded-md bg-[#ffe0b2] outline-none"
              required
            >
              <option value="" disabled>
                Seleccionar turno
              </option>
              {turnos.map((t) => (
                <option key={t.idTurno} value={t.idTurno}>
                  {t.horario}
                </option>
              ))}
            </select>
          </div>


          <div className="flex gap-4">
            <button
              onClick={handleGuardarUnidad}
              className="bg-[#cc4500] text-white font-semibold px-6 py-2 rounded-md hover:bg-orange-800"
            >
              Guardar
            </button>
            <button
              onClick={() => setMostrarTabla('unidades')}
              className="bg-[#cc4500] text-white font-semibold px-6 py-2 rounded-md hover:bg-orange-800"
            >
              Mostrar unidades
            </button>
          </div>
        </div>
      </section>

      {/* Sección Registrar Viaje */}
      <section className="bg-[#fff7ec] p-6 rounded-lg shadow-md">
        <h2 className="text-orange-700 font-bold text-lg mb-4">Registrar viaje</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-orange-700 font-semibold mb-1">Origen</label>
            <select
              value={viajeForm.origen}
              onChange={(e) => {
                const origenSeleccionado = e.target.value;
                const destinoAutomatico =
                  origenSeleccionado === 'Tuxtla Gutierrez' ? 'Yajalon' : 'Tuxtla Gutierrez';
                setViajeForm({
                  ...viajeForm,
                  origen: origenSeleccionado,
                  destino: destinoAutomatico,
                });
              }}
              className="w-full p-2 rounded-md bg-[#ffe0b2] outline-none"
            >
              <option value="" disabled>
                Selecciona origen
              </option>
              <option value="Tuxtla Gutierrez">Tuxtla Gtz</option>
              <option value="Yajalon">Yajalón</option>
              
            </select>
          </div>
          <div>
            <label className="block text-orange-700 font-semibold mb-1">Destino</label>
            <input
              value={viajeForm.destino}
              readOnly
              className="w-full p-2 rounded-md bg-[#ffe0b2] outline-none"
              placeholder="Destino automático"
            />
          </div>
          <div>
            <label className="block text-orange-700 font-semibold mb-1">Fecha de salida</label>
            <input
              type="datetime-local"
              value={viajeForm.fechaSalida}
              onChange={(e) => {
    let valor = e.target.value;
    // Si no tiene segundos, se los agregamos
    if (valor && valor.length === 16) { // formato YYYY-MM-DDTHH:mm → 16 caracteres
      valor = valor + ":00";
    }
    setViajeForm({ ...viajeForm, fechaSalida: valor });
  }}
              className="w-full p-2 rounded-md bg-[#ffe0b2] outline-none"
            />
          </div>
          <div>
            <label className="block text-orange-700 font-semibold mb-1">Unidad</label>
            <select
              value={viajeForm.idUnidad}
              onChange={(e) => setViajeForm({ ...viajeForm, idUnidad: e.target.value })}
              className="w-full p-2 rounded-md bg-[#ffe0b2] outline-none"
              required
            >
              <option value="" disabled>
                Seleccione unidad
              </option>
              {unidades.map((u) => (
                <option key={u.idUnidad} value={u.idUnidad}>
                  {u.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleGuardarViaje}
              className="bg-[#cc4500] text-white font-semibold px-6 py-2 rounded-md hover:bg-orange-800"
            >
              Guardar
            </button>
            <button
              onClick={() => setMostrarTabla('viajes')}
              className="bg-[#cc4500] text-white font-semibold px-6 py-2 rounded-md hover:bg-orange-800"
            >
              Mostrar viajes
            </button>
          </div>
        </div>
      </section>

      {/* Tabla */}
      <TablaDatos />
    </div>

  );
}
