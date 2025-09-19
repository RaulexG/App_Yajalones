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
  EliminarViaje,
  EliminarTurno,
  EliminarUnidad,
} from '../../services/Admin/adminService';
import Swal from 'sweetalert2';

/* -------------------- Helpers -------------------- */
/** Ayer 00:00:00 (hora local) */
const getAyerInicio = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  return d;
};

/** Viajes desde ayer 00:00, ordenados por fechaSalida asc */
const filtrarViajesDesdeAyer = (lista) => {
  const min = getAyerInicio().getTime();
  return (lista || [])
    .filter((v) => {
      const t = new Date(v.fechaSalida).getTime();
      return Number.isFinite(t) && t >= min;
    })
    .sort((a, b) => new Date(a.fechaSalida) - new Date(b.fechaSalida));
};


/** Normaliza a 'YYYY-MM-DDTHH:mm:ss' para <input type="datetime-local"> */
const toDatetimeLocal = (dLike) => {
  if (!dLike) return '';
  const d = dLike instanceof Date ? dLike : new Date(dLike);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

/** Asegura que un valor 'YYYY-MM-DDTHH:mm' tenga segundos */
const ensureSeconds = (val) => {
  if (!val) return '';
  // 'YYYY-MM-DDTHH:mm' => length 16
  if (val.length === 16) return `${val}:00`;
  return val;
};

/** SweetAlert loader con timeout seguro (evita doble modal) */
const createSwalLoader = (ms = 10000) => {
  let timeoutId;
  let closedByTimeout = false;
  return {
    start: (title = 'Guardando...', text = 'Conectando al servidor') => {
      Swal.fire({
        title,
        text,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      timeoutId = setTimeout(() => {
        closedByTimeout = true;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo conectar al servidor. Inténtalo de nuevo.',
        });
      }, ms); // ⏱ 10s por defecto
    },
    success: (title = 'Guardado', text = 'Operación realizada correctamente') => {
      clearTimeout(timeoutId);
      if (closedByTimeout) return; // evita doble modal
      Swal.fire({ icon: 'success', title, text });
    },
    failure: (title = 'Error', text = 'Ocurrió un error al procesar la solicitud') => {
      clearTimeout(timeoutId);
      if (closedByTimeout) return;
      Swal.fire({ icon: 'error', title, text });
    },
  };
};

/** Valida HH:mm:ss */
const isHHMMSS = (val) => /^\d{2}:\d{2}:\d{2}$/.test(val);

/* -------------------- Componente -------------------- */

export default function Ajustes() {
  const [nombreCuenta] = useState('Administrador'); // temporal

  const [turnoForm, setTurnoForm] = useState({ horario: '', idTurno: null });
  const [unidadForm, setUnidadForm] = useState({
    nombre: '',
    numeroPasajeros: '',
    descripcion: '',
    idTurno: '',
    idUnidad: null,
  });
  const [viajeForm, setViajeForm] = useState({
    origen: '',
    destino: '',
    fechaSalida: '',
    idUnidad: '',
    idViaje: null,
  });

  const [turnos, setTurnos] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [viajes, setViajes] = useState([]);
  const [mostrarTabla, setMostrarTabla] = useState(null);

  const cargarDatos = async () => {
    try {
      const [t, u, v] = await Promise.all([ListarTurnos(), ListarUnidades(), ListarViajes()]);
      setTurnos(t || []);
      setUnidades(u || []);
      // 👇 solo ayer en adelante
      setViajes(filtrarViajesDesdeAyer(v));
    } catch (e) {
      Swal.fire({
        icon: 'error',
        title: 'Error al cargar datos',
        text: 'Revisa tu conexión o intenta de nuevo.',
      });
    }
  };
  

  useEffect(() => {
    cargarDatos();
  }, []);

  /* --------------- Guardar / Actualizar Turno --------------- */
  const handleGuardarTurno = async () => {
    // Validación simple
    if (!turnoForm.horario) {
      Swal.fire({ icon: 'warning', title: 'Falta horario', text: 'Completa el horario.' });
      return;
    }
    if (!isHHMMSS(turnoForm.horario)) {
      Swal.fire({
        icon: 'error',
        title: 'Formato inválido',
        text: 'Formato esperado HH:MM:SS',
      });
      return;
    }

    const loader = createSwalLoader(10000);
    loader.start();

    try {
      if (turnoForm.idTurno) {
        await ActualizarTurno(turnoForm.idTurno, { horario: turnoForm.horario });
        loader.success('Guardado', 'El turno se editó correctamente');
      } else {
        await CrearTurno({ horario: turnoForm.horario });
        loader.success('Guardado', 'El turno se creó correctamente');
      }
      setTurnoForm({ horario: '', idTurno: null });
      await cargarDatos();
    } catch (err) {
      loader.failure('Error al guardar turno', 'Inténtalo nuevamente.');
    }
  };

  /* --------------- Guardar / Actualizar Unidad --------------- */
  const handleGuardarUnidad = async () => {
    // Validaciones
    if (!unidadForm.nombre?.trim()) {
      Swal.fire({ icon: 'warning', title: 'Falta nombre', text: 'Ingresa el nombre de la unidad.' });
      return;
    }
    if (!unidadForm.numeroPasajeros) {
      Swal.fire({
        icon: 'warning',
        title: 'Faltan asientos',
        text: 'Ingresa el número de asientos.',
      });
      return;
    }

    const numeroPasajerosNum = parseInt(unidadForm.numeroPasajeros, 10);
    if (Number.isNaN(numeroPasajerosNum) || numeroPasajerosNum <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Asientos inválidos',
        text: 'El número de asientos debe ser un entero mayor a 0.',
      });
      return;
    }

    const idTurnoNum = parseInt(unidadForm.idTurno, 10);
    if (Number.isNaN(idTurnoNum)) {
      Swal.fire({
        icon: 'warning',
        title: 'Falta turno',
        text: 'Selecciona un turno.',
      });
      return;
    }

    const datos = {
      nombre: unidadForm.nombre,
      numeroPasajeros: numeroPasajerosNum,
      descripcion: unidadForm.descripcion,
      activo: true,
      turno: { idTurno: idTurnoNum },
    };

    const loader = createSwalLoader(10000);
    loader.start();

    try {
      if (unidadForm.idUnidad) {
        await ActualizarUnidad(unidadForm.idUnidad, datos);
        loader.success('Guardado', 'La unidad se editó correctamente');
      } else {
        await CrearUnidad(datos);
        loader.success('Guardado', 'La unidad se creó correctamente');
      }
      setUnidadForm({
        nombre: '',
        numeroPasajeros: '',
        descripcion: '',
        idTurno: '',
        idUnidad: null,
      });
      await cargarDatos();
    } catch (err) {
      loader.failure('Error al guardar unidad', 'Inténtalo nuevamente.');
    }
  };

  /* --------------- Guardar / Actualizar Viaje --------------- */
  const handleGuardarViaje = async () => {
    // Validaciones
    if (!viajeForm.origen) {
      Swal.fire({ icon: 'warning', title: 'Falta origen', text: 'Selecciona el origen.' });
      return;
    }
    if (!viajeForm.destino) {
      Swal.fire({ icon: 'warning', title: 'Falta destino', text: 'El destino es requerido.' });
      return;
    }
    if (!viajeForm.fechaSalida) {
      Swal.fire({
        icon: 'warning',
        title: 'Falta fecha de salida',
        text: 'Selecciona la fecha y hora.',
      });
      return;
    }
    const idUniNum = parseInt(viajeForm.idUnidad, 10);
    if (Number.isNaN(idUniNum)) {
      Swal.fire({
        icon: 'warning',
        title: 'Falta unidad',
        text: 'Selecciona una unidad.',
      });
      return;
    }

    const fechaSalida = ensureSeconds(viajeForm.fechaSalida);

    const datos = {
      origen: viajeForm.origen,
      destino: viajeForm.destino,
      fechaSalida,
      idUnidad: idUniNum,
    };

    const loader = createSwalLoader(10000);
    loader.start();

    try {
      if (viajeForm.idViaje) {
        await ActualizarViaje(viajeForm.idViaje, datos);
        loader.success('Guardado', 'El viaje se editó correctamente');
      } else {
        await CrearViaje(datos);
        loader.success('Guardado', 'El viaje se creó correctamente');
      }
      setViajeForm({ origen: '', destino: '', fechaSalida: '', idUnidad: '', idViaje: null });
      await cargarDatos();
    } catch (err) {
      loader.failure('Error al guardar viaje', 'Inténtalo nuevamente.');
    }
  };

  const cerrarTabla = () => setMostrarTabla(null);

  /* -------------------- Tabla Modal -------------------- */
  const TablaDatos = () => {
    const columnas = {
      turnos: ['ID', 'Horario', ''],
      unidades: ['ID', 'Nombre', 'Asientos', 'Descripción', 'Turno', ''],
      viajes: ['ID', 'Origen', 'Destino', 'Unidad', 'Fecha de Salida', ''],
    };

    const editar = (tipo, item) => {
      if (tipo === 'turnos') {
        setTurnoForm({ horario: item.horario ?? '', idTurno: item.idTurno });
      }
      if (tipo === 'unidades') {
        setUnidadForm({
          nombre: item.nombre ?? '',
          numeroPasajeros: String(item.numeroPasajeros ?? ''),
          descripcion: item.descripcion ?? '',
          idTurno: String(item.turno?.idTurno ?? ''),
          idUnidad: item.idUnidad,
        });
      }
      if (tipo === 'viajes') {
        setViajeForm({
          origen: item.origen ?? '',
          destino: item.destino ?? '',
          fechaSalida: toDatetimeLocal(item.fechaSalida),
          idUnidad: String(item.unidad?.idUnidad ?? ''),
          idViaje: item.idViaje,
        });
      }
      cerrarTabla();
    };

    const filas = {
      turnos: (turnos || []).map((t) => [t.idTurno, t.horario ?? '', t]),
      unidades: (unidades || []).map((u) => [
        u.idUnidad,
        u.nombre ?? '',
        u.numeroPasajeros ?? '',
        u.descripcion ?? '',
        u.turno?.horario ?? '',
        u,
      ]),
      viajes: (viajes || []).map((v) => [
        v.idViaje,
        v.origen ?? '',
        v.destino ?? '',
        v.unidad?.nombre ?? '',
        v.fechaSalida ? new Date(v.fechaSalida).toLocaleString() : '',
        v,
      ]),
    };

    if (!mostrarTabla) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        {/* Card */}
        <div className="bg-white rounded-2xl w-[92vw] max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
          {/* Encabezado */}
          <div className="flex items-center justify-between px-6 py-4 shrink-0">
            <h2 className="text-xl font-bold text-orange-800 capitalize">Lista de {mostrarTabla}</h2>
            <button
              onClick={cerrarTabla}
              aria-label="Cerrar"
              className="p-2 rounded-md text-orange-700 hover:bg-orange-100 focus:outline-none focus:ring-0"
            >
              {/* ícono X */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
                <path
                  fill="currentColor"
                  d="m12 13.4l-4.9 4.9q-.275.275-.7.275t-.7-.275t-.275-.7t.275-.7l4.9-4.9l-4.9-4.9q-.275-.275-.275-.7t.275-.7t.7-.275t.7.275l4.9 4.9l4.9-4.9q.275-.275.7-.275t.7.275t.275.7t-.275.7L13.4 12l4.9 4.9q.275.275.275.7t-.275.7t-.7.275t-.7-.275z"
                />
              </svg>
            </button>
          </div>
    
          {/* Contenido: tabla */}
          <div className="flex-1 min-h-0 px-6 pb-6">
            {/* Scroll vertical; tope = thead(3rem) + 8 filas(8*2.5rem) */}
            <div
              className="overflow-auto rounded-xl ring-1 ring-orange-200"
              style={{ maxHeight: 'calc(3rem + 8 * 2.5rem)' }}
            >
              <table className="w-full table-auto border-collapse">
                {/* encabezado fijo con altura estable */}
                <thead className="sticky top-0 z-10 bg-orange-100 text-orange-900">
                  <tr className="h-12">
                    {columnas[mostrarTabla].map((col) => (
                      <th key={col} className="px-4 text-left font-semibold">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
    
                {/* filas */}
                <tbody className="divide-y divide-orange-100">
                  {filas[mostrarTabla].map((fila, idx) => (
                    <tr
                      key={idx}
                      className="h-10 odd:bg-white even:bg-orange-50/40 hover:bg-orange-100 transition-colors"
                    >
                      {fila.map((cell, i) => {
                        const esUltima = i === fila.length - 1;
    
                        // Turnos/Unidades: última celda = Editar/Eliminar
                        if (esUltima && mostrarTabla !== 'viajes') {
                          return (
                            <td key={i} className="px-4 py-2 text-left">
                              <button
                                onClick={() => editar(mostrarTabla, cell)}
                                aria-label="Editar"
                                title="Editar"
                                className="inline-flex items-center justify-center w-9 h-9 rounded-md text-[#C14600] hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-1 cursor-pointer hover:scale-120 transition-transform"
                              >
                                {/* Ícono editar */}
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
                                  <g
                                    fill="none"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                  >
                                    <path d="m16.475 5.408 2.117 2.117m-.756-3.982L12.109 9.27a2.1 2.1 0 0 0-.58 1.082L11 13l2.648-.53c.41-.082.786-.283 1.082-.579l5.727-5.727a1.853 1.853 0 1 0-2.621-2.621" />
                                    <path d="M19 15v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3" />
                                  </g>
                                </svg>
                              </button>
    
                              <button
                                onClick={async () => {
                                  if (mostrarTabla === 'turnos') {
                                    const result = await Swal.fire({
                                      icon: 'question',
                                      title: '¿Seguro que quieres eliminar este turno?',
                                      showCancelButton: true,
                                      confirmButtonText: 'Sí',
                                      cancelButtonText: 'No',
                                      reverseButtons: true,
                                    });
                                    if (result.isConfirmed) {
                                      try {
                                        const turno = cell;
                                        await EliminarTurno(turno.idTurno);
                                        await cargarDatos();
                                        Swal.fire({
                                          icon: 'success',
                                          title: 'Turno eliminado',
                                          timer: 1500,
                                          showConfirmButton: false,
                                        });
                                      } catch (err) {
                                        Swal.fire({
                                          icon: 'error',
                                          title: 'Error al eliminar el turno',
                                          timer: 1500,
                                          showConfirmButton: false,
                                        });
                                      }
                                    }
                                  }
                                  if (mostrarTabla === 'unidades') {
                                    const result = await Swal.fire({
                                      icon: 'question',
                                      title: '¿Seguro que quieres eliminar esta unidad?',
                                      showCancelButton: true,
                                      confirmButtonText: 'Sí',
                                      cancelButtonText: 'No',
                                      reverseButtons: true,
                                    });
                                    if (result.isConfirmed) {
                                      try {
                                        const unidad = cell;
                                        await EliminarUnidad(unidad.idUnidad);
                                        await cargarDatos();
                                        Swal.fire({
                                          icon: 'success',
                                          title: 'Unidad eliminada',
                                          timer: 1500,
                                          showConfirmButton: false,
                                        });
                                      } catch (err) {
                                        Swal.fire({
                                          icon: 'error',
                                          title: 'Error al eliminar la unidad',
                                          timer: 1500,
                                          showConfirmButton: false,
                                        });
                                      }
                                    }
                                  }
                                }}
                                aria-label="Eliminar"
                                title="Eliminar"
                                className="text-red-600 hover:text-red-800 ml-2"
                              >
                                {/* Ícono eliminar */}
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  className="w-6 h-6 cursor-pointer hover:scale-120 transition-transform"
                                  style={{ color: '#C14600' }}
                                >
                                  <path
                                    fill="currentColor"
                                    d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6z"
                                  />
                                </svg>
                              </button>
                            </td>
                          );
                        }
    
                        // Viajes: última celda con acciones Editar / Eliminar
                        if (esUltima && mostrarTabla === 'viajes') {
                          const viaje = cell;
                          return (
                            <td key={i} className="px-4 py-2 text-right">
                              {/* Botón Eliminar */}
                              <button
                                onClick={async () => {
                                  const result = await Swal.fire({
                                    icon: 'question',
                                    title: '¿Seguro que quieres eliminar el viaje?',
                                    showCancelButton: true,
                                    confirmButtonText: 'Sí',
                                    cancelButtonText: 'No',
                                    reverseButtons: true,
                                  });
                                  if (result.isConfirmed) {
                                    try {
                                      await EliminarViaje(viaje.idViaje);
                                      await cargarDatos();
                                      Swal.fire({
                                        icon: 'success',
                                        title: 'Viaje eliminado',
                                        timer: 1500,
                                        showConfirmButton: false,
                                      });
                                    } catch (err) {
                                      Swal.fire({
                                        icon: 'error',
                                        title: 'Error al eliminar el viaje',
                                        timer: 1500,
                                        showConfirmButton: false,
                                      });
                                    }
                                  }
                                }}
                                aria-label="Eliminar viaje"
                                title="Eliminar"
                                className="inline-flex items-center justify-center px-3 py-1.5 text-sm rounded-md text-[#C14600] hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-1 ml-2 cursor-pointer hover:scale-120 transition-transform"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
                                  <path
                                    fill="currentColor"
                                    d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6z"
                                  />
                                </svg>
                              </button>
                            </td>
                          );
                        }
    
                        // Celdas normales
                        return (
                          <td key={i} className="px-4 py-2 text-left text-gray-800">
                            {cell ?? ''}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };    

  /* -------------------- Render -------------------- */
  return (
    <div className="p-6 space-y-6 w-full">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-orange-800">Ajustes del sistema</h1>
        <p className="text-gray-600">Bienvenido, {nombreCuenta}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Registrar Turno */}
        <section className="bg-[#fff7ec] p-6 rounded-lg shadow-md w-full">
          <h2 className="text-orange-700 font-bold text-lg mb-4">Registrar turno</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-orange-700 font-semibold mb-1">Horario</label>
              <div className="flex items-center bg-[#ffe0b2] rounded-md px-2 w-full">
              <input
                  value={turnoForm.horario}
                  onChange={(e) => setTurnoForm({ ...turnoForm, horario: e.target.value })}
                  className="w-full p-2 bg-transparent outline-none"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="1.5em"
                  height="1.5em"
                  viewBox="0 0 24 24"
                  className="ml-2 shrink-0 text-[#C14600]"
                >
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0m9 0l-3 2m3-7v5"
                  />
                </svg>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
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

        {/* Registrar Unidad */}
        <section className="bg-[#fff7ec] p-6 rounded-lg shadow-md w-full">
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
              <label className="block text-orange-700 font-semibold mb-1">No. de Asientos</label>
              <input
                type="number"
                min="1"
                step="1"
                value={unidadForm.numeroPasajeros}
                onChange={(e) => setUnidadForm({ ...unidadForm, numeroPasajeros: e.target.value })}
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
                value={String(unidadForm.idTurno)}
                onChange={(e) => setUnidadForm({ ...unidadForm, idTurno: e.target.value })}
                className="w-full p-2 rounded-md bg-[#ffe0b2] outline-none"
                required
              >
                <option value="" disabled>
                  Seleccionar turno
                </option>
                {turnos.map((t) => (
                  <option key={t.idTurno} value={String(t.idTurno)}>
                    {t.horario}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-4 justify-center mt-4">
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

        {/* Registrar Viaje */}
        <section className="bg-[#fff7ec] p-6 rounded-lg shadow-md w-full">
          <h2 className="text-orange-700 font-bold text-lg mb-4">Registrar viaje</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-orange-700 font-semibold mb-1">Origen</label>
              <select
                value={viajeForm.origen}
                onChange={(e) => {
                  const origenSeleccionado = e.target.value;
                  const destinoAutomatico = origenSeleccionado === 'Tuxtla' ? 'Yajalon' : 'Tuxtla';
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
                <option value="Tuxtla">Tuxtla Gtz</option>
                <option value="Yajalon">Yajalón</option>
              </select>
            </div>
            <div>
              <label className="block text-orange-700 font-semibold mb-1">Destino</label>
              <input
                value={viajeForm.destino}
                readOnly
                className="w-full p-2 rounded-md bg-[#ffe0b2] outline-none"
              />
            </div>
            <div>
              <label className="block text-orange-700 font-semibold mb-1">Fecha de salida</label>
              <input
                type="datetime-local"
                step="1"
                value={viajeForm.fechaSalida}
                onChange={(e) => {
                  const valor = ensureSeconds(e.target.value);
                  setViajeForm({ ...viajeForm, fechaSalida: valor });
                }}
                className="
                  w-full p-2 rounded-md bg-[#ffe0b2] outline-none
                  pr-16
                  [&::-webkit-calendar-picker-indicator]:opacity-100
                  [&::-webkit-calendar-picker-indicator]:cursor-pointer
                  [&::-webkit-calendar-picker-indicator]:filter-[invert(21%)_sepia(85%)_saturate(2989%)_hue-rotate(9deg)_brightness(96%)_contrast(104%)]
                  [&::-webkit-calendar-picker-indicator]:[transform:translateX(55px)]
                "
              />
            </div>
            <div>
              <label className="block text-orange-700 font-semibold mb-1">Unidad</label>
              <select
                value={String(viajeForm.idUnidad)}
                onChange={(e) => setViajeForm({ ...viajeForm, idUnidad: e.target.value })}
                className="w-full p-2 rounded-md bg-[#ffe0b2] outline-none"
                required
              >
                <option value="" disabled>
                  Seleccione unidad
                </option>
                {unidades.map((u) => (
                  <option key={u.idUnidad} value={String(u.idUnidad)}>
                    {u.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-4 justify-center">
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

        {/* Modal Tabla */}
        <TablaDatos />
      </div>
    </div>
  );
}
