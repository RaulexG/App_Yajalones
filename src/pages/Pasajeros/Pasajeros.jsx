import { useEffect, useState, useMemo } from 'react';
import {
  CrearPasajeros,
  ListarTurnos,
  ListarViajes,
  ObtenerViajePorId,
  ActualizarPasajero,
  EliminarPasajero,
  ListarChoferes
} from '../../services/Admin/adminService';
import Swal from 'sweetalert2';

/* -------------------- Helpers -------------------- */
const formatFecha = (dLike) => {
  const d = new Date(dLike);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
};
const formatHora = (dLike) => {
  const d = new Date(dLike);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const startOfYesterday = () => {
  const d = startOfToday();
  d.setDate(d.getDate() - 1);
  return d;
};

/* -------------------- Componente -------------------- */
export default function Pasajeros() {
  const [turnos, setTurnos] = useState([]);
  const [viajes, setViajes] = useState([]);
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);
  const [asientosOcupados, setAsientosOcupados] = useState([]);
  const [idPasajeroEditando, setIdPasajeroEditando] = useState(null);

  const [turnoSeleccionado, setTurnoSeleccionado] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('HOY'); // HOY | TODOS

  const [choferes, setChoferes] = useState([]);

  const [formulario, setFormulario] = useState({
    nombre: '',
    apellido: '',
    origen: '',
    destino: '',
    fechaSalida: '',
    hora: '',
    tipo: 'ADULTO',
    tipoPago: 'PAGADO',
    asiento: null,
    viaje: null
  });

  /* Carga inicial */
  useEffect(() => {
    (async () => {
      try {
        const [dataTurnos, dataViajes, dataChoferes] = await Promise.all([
          ListarTurnos(),
          ListarViajes(),
          ListarChoferes()
        ]);
        setTurnos(Array.isArray(dataTurnos) ? dataTurnos : []);
        setViajes(Array.isArray(dataViajes) ? dataViajes : []);
        setChoferes(Array.isArray(dataChoferes) ? dataChoferes : []);
      } catch {
        Swal.fire({
          icon: 'error',
          title: 'No se pudieron cargar datos',
          text: 'Verifica tu conexión.'
        });
      }
    })();
  }, []);

  /* Viajes filtrados por turno + fecha */
  const viajesFiltrados = useMemo(() => {
    const hoy0 = startOfToday();
    const mañana0 = new Date(hoy0.getTime() + 24 * 60 * 60 * 1000);
    const desdeAyer = startOfYesterday(); // para evitar saturación en "Todos"

    const pasaFiltroFecha = (fecha) => {
      const f = new Date(fecha);
      if (Number.isNaN(f.getTime())) return false;
      if (filtroFecha === 'HOY') return f >= hoy0 && f < mañana0;
      // "TODOS": mostramos desde ayer en adelante para no saturar
      return f >= desdeAyer;
    };

    const porTurno = (v) =>
      !turnoSeleccionado ||
      (v?.unidad?.turno?.idTurno ?? null) === Number(turnoSeleccionado);

    return (viajes || [])
      .filter((v) => porTurno(v) && pasaFiltroFecha(v.fechaSalida))
      .sort((a, b) => new Date(a.fechaSalida) - new Date(b.fechaSalida));
  }, [viajes, turnoSeleccionado, filtroFecha]);

  const manejarCambio = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const manejarCambioAsiento = (numero) => {
    setFormulario({ ...formulario, asiento: numero });
    setIdPasajeroEditando(null);
  };

  const limpiarFormulario = () => {
    if (!viajeSeleccionado) {
      setFormulario({
        nombre: '',
        apellido: '',
        origen: '',
        destino: '',
        fechaSalida: '',
        hora: '',
        tipo: 'ADULTO',
        tipoPago: 'PAGADO',
        asiento: null,
        viaje: null
      });
      setIdPasajeroEditando(null);
      return;
    }

    setFormulario({
      nombre: '',
      apellido: '',
      origen: viajeSeleccionado.origen,
      destino: viajeSeleccionado.destino,
      fechaSalida: formatFecha(viajeSeleccionado.fechaSalida),
      hora: formatHora(viajeSeleccionado.fechaSalida),
      tipo: 'ADULTO',
      tipoPago: 'PAGADO',
      asiento: null,
      viaje: viajeSeleccionado
    });
    setIdPasajeroEditando(null);
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();

    if (!formulario.nombre.trim()) {
      Swal.fire({ icon: 'warning', title: 'Falta nombre' });
      return;
    }
    if (!formulario.viaje?.idViaje) {
      Swal.fire({ icon: 'warning', title: 'Selecciona un viaje' });
      return;
    }
    if (!formulario.asiento) {
      Swal.fire({ icon: 'warning', title: 'Selecciona un asiento' });
      return;
    }

    try {
      const viajeId = formulario.viaje.idViaje;
      const payload = {
        nombre: formulario.nombre.trim(),
        apellido: formulario.apellido.trim(),
        tipo: formulario.tipo,
        tipoPago: formulario.tipoPago,
        asiento: formulario.asiento,
        idViaje: viajeId
      };

      if (idPasajeroEditando) {
        await ActualizarPasajero(idPasajeroEditando, payload);
        Swal.fire({ icon: 'success', title: 'Pasajero actualizado', timer: 1200, showConfirmButton: false });
      } else {
        await CrearPasajeros(payload);
        Swal.fire({ icon: 'success', title: 'Pasajero agregado', timer: 1200, showConfirmButton: false });
      }

      const viajeActualizado = await ObtenerViajePorId(viajeId);
      setViajeSeleccionado({ ...viajeActualizado });
      setAsientosOcupados((viajeActualizado.pasajeros || []).map((p) => p.asiento));

      limpiarFormulario();
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: 'error', title: 'Error al guardar pasajero' });
    }
  };

  const eliminarPasajero = async (idPasajero) => {
    try {
      const result = await Swal.fire({
        icon: 'question',
        title: '¿Eliminar pasajero?',
        showCancelButton: true,
        confirmButtonText: 'Sí',
        cancelButtonText: 'No',
        reverseButtons: true
      });

      if (!result.isConfirmed) return;

      await EliminarPasajero(idPasajero);
      Swal.fire({ icon: 'success', title: 'Pasajero eliminado', timer: 1100, showConfirmButton: false });

      if (formulario.viaje?.idViaje) {
        const v = await ObtenerViajePorId(formulario.viaje.idViaje);
        setViajeSeleccionado(v);
        setAsientosOcupados((v.pasajeros || []).map((p) => p.asiento));
      }
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: 'error', title: 'Error al eliminar pasajero' });
    }
  };

  const ObtenerAsientos = (unidad) => parseInt(unidad?.numeroPasajeros || 20, 10);

  const manejarSeleccionViaje = (viaje) => {
    setViajeSeleccionado(viaje);
    setFormulario((prev) => ({
      ...prev,
      viaje,
      origen: viaje.origen,
      destino: viaje.destino,
      fechaSalida: formatFecha(viaje.fechaSalida),
      hora: formatHora(viaje.fechaSalida),
      asiento: null
    }));
    setAsientosOcupados((viaje.pasajeros || []).map((p) => p.asiento));
    setIdPasajeroEditando(null);
  };

  const choferAsignado = viajeSeleccionado
    ? choferes.find((c) => c.unidad?.idUnidad === viajeSeleccionado.unidad?.idUnidad)
    : null;

  /* -------------------- UI -------------------- */
  return (
    <div className="p-3 h-[calc(100vh-100px)] overflow-hidden">
      {/* Layout: izquierda (form) + derecha (filtros / lista) */}
      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5 h-full max-w-[1600px] mx-auto">
        {/* Izquierda */}
        <div className="flex flex-col gap-4 ">
          <form onSubmit={manejarEnvio} className="bg-white p-4 rounded-md shadow-md w-full space-y-3 overflow-auto text-sm">
            {/* Nombre */}
            <div>
              <label className="block text-orange-700 font-semibold mb-1 text-[13px]">Nombre</label>
              <input
                type="text"
                name="nombre"
                value={formulario.nombre}
                onChange={manejarCambio}
                className="w-full p-2.5 rounded-md bg-orange-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            {/* Apellido */}
            <div>
              <label className="block text-orange-700 font-semibold mb-1 text-[13px]">Apellido</label>
              <input
                type="text"
                name="apellido"
                value={formulario.apellido}
                onChange={manejarCambio}
                className="w-full p-2.5 rounded-md bg-orange-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            {/* Tipo de boleto y Tipo de pago */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-orange-700 font-semibold mb-1 text-[13px]">Tipo de boleto</label>
                <select
                  name="tipo"
                  value={formulario.tipo}
                  onChange={manejarCambio}
                  className="w-full p-2 rounded-md bg-orange-100 text-gray-800"
                >
                  <option value="ADULTO">Adulto</option>
                  <option value="NIÑO">Niño</option>
                  <option value="INCENT_INAPAM">INAPAM</option>
                </select>
              </div>

              <div>
                <label className="block text-orange-700 font-semibold mb-1 text-[13px]">Tipo de pago</label>
                <select
                  name="tipoPago"
                  value={formulario.tipoPago}
                  onChange={manejarCambio}
                  className="w-full p-2 rounded-md bg-orange-100 text-gray-800"
                >
                  <option value="PAGADO">Pagado</option>
                  <option value="DESTINO">Paga al llegar</option>
                  <option value="SCLC">San Cristóbal</option>
                </select>
              </div>
            </div>

            {/* Asientos */}
            <div className="bg-orange-50 p-3 rounded-md">
              <p className="text-orange-700 font-semibold mb-2 text-[13px]">Seleccionar asiento</p>
              <div className="grid grid-cols-4 gap-3 justify-items-center">
                {[...Array(ObtenerAsientos(viajeSeleccionado?.unidad))].map((_, i) => {
                  const numero = i + 1;
                  const ocupado = asientosOcupados.includes(numero);
                  const seleccionado = formulario.asiento === numero;

                  return (
                    <button
                      key={numero}
                      type="button"
                      onClick={() => !ocupado && manejarCambioAsiento(numero)}
                      disabled={ocupado}
                      className="flex flex-col items-center"
                      title={ocupado ? 'Asiento ocupado' : 'Seleccionar asiento'}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="2.4em"
                        height="2.4em"
                        viewBox="0 0 24 24"
                        className={ocupado ? 'text-orange-900' : seleccionado ? 'text-orange-700' : 'text-orange-500'}
                      >
                        <path
                          fill="currentColor"
                          d="M5.35 5.64c-.9-.64-1.12-1.88-.49-2.79c.63-.9 1.88-1.12 2.79-.49c.9.64 1.12 1.88.49 2.79c-.64.9-1.88 1.12-2.79.49M16 20c0-.55-.45-1-1-1H8.93c-1.48 0-2.74-1.08-2.96-2.54L4.16 7.78A.976.976 0 0 0 3.2 7c-.62 0-1.08.57-.96 1.18l1.75 8.58A5.01 5.01 0 0 0 8.94 21H15c.55 0 1-.45 1-1m-.46-5h-4.19l-1.03-4.1c1.28.72 2.63 1.28 4.1 1.3c.58.01 1.05-.49 1.05-1.07c0-.59-.49-1.04-1.08-1.06c-1.31-.04-2.63-.56-3.61-1.33L9.14 7.47c-.23-.18-.49-.3-.76-.38a2.2 2.2 0 0 0-.99-.06h-.02a2.27 2.27 0 0 0-1.84 2.61l1.35 5.92A3.01 3.01 0 0 0 9.83 18h6.85l3.09 2.42c.42.33 1.02.29 1.39-.08c.45-.45.4-1.18-.1-1.57l-4.29-3.35a2 2 0 0 0-1.23-.42"
                        />
                      </svg>
                      <span
                        className={`text-xs font-bold ${
                          ocupado ? 'text-orange-900' : seleccionado ? 'text-orange-700' : 'text-orange-500'
                        }`}
                      >
                        {numero.toString().padStart(2, '0')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Unidad / Chofer */}
            <div className="text-center mt-1 text-orange-700 font-semibold text-[13px]">
              Unidad {viajeSeleccionado?.unidad?.nombre || 'N/A'}:{' '}
              {choferAsignado ? `${choferAsignado.nombre} ${choferAsignado.apellido}` : 'No asignado'}
            </div>

            {/* Botones */}
            <div className="flex justify-center gap-3 mt-1">
              <button
                type="submit"
                className="bg-[#C44706] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-800 transition text-sm"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>

        {/* Derecha */}
        <div className="flex flex-col gap-4 min-h-0">
          {/* Derecha */}
          <div className="flex flex-col gap-4 min-h-0">
            {/* Filtros + Viaje en UNA sola línea */}
            <div className="bg-[#FDF7F0] p-3 rounded-md shadow-md flex flex-col gap-2 min-h-0 text-sm">
              {/* 🔧 Turno | Mostrar | Viaje en la MISMA fila */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_2fr] gap-3 items-end">
                {/* Turno */}
                <div>
                  <label className="block text-orange-700 font-semibold mb-1 text-[13px]">Turno</label>
                  <select
                    className="w-full p-2.5 rounded-md bg-orange-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    value={turnoSeleccionado}
                    onChange={(e) => setTurnoSeleccionado(e.target.value)}
                  >
                    <option value="">Todos</option>
                    {turnos.map((t) => (
                      <option key={t.idTurno} value={t.idTurno}>
                        {t.horario}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mostrar (HOY/TODOS) */}
                <div className="shrink-0">
                  <label className="block text-orange-700 font-semibold mb-1 text-[13px]">Mostrar</label>
                  <div className="inline-flex rounded-lg overflow-hidden ring-1 ring-orange-200">
                    {[
                      { key: 'HOY', label: 'Hoy' },
                      { key: 'TODOS', label: 'Todos' }
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setFiltroFecha(opt.key)}
                        className={`px-4 py-2 text-sm font-semibold ${
                          filtroFecha === opt.key
                            ? 'bg-orange-600 text-white'
                            : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                        }`}
                        aria-pressed={filtroFecha === opt.key}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Viaje */}
                <div>
                  <label className="block text-orange-700 font-semibold mb-1 text-[13px]">Viaje</label>
                  <select
                    className="w-full p-2.5 rounded-md bg-orange-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    value={String(viajeSeleccionado?.idViaje ?? '')}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      const v = viajesFiltrados.find((x) => x.idViaje === id) || null;

                      if (v) {
                        manejarSeleccionViaje(v);
                      } else {
                        setViajeSeleccionado(null);
                        setAsientosOcupados([]);
                        setFormulario((prev) => ({
                          ...prev,
                          viaje: null,
                          origen: '',
                          destino: '',
                          fechaSalida: '',
                          hora: '',
                          asiento: null
                        }));
                      }
                    }}
                  >
                    <option value="">Selecciona un viaje</option>
                    {viajesFiltrados.map((v) => (
                      <option key={v.idViaje} value={String(v.idViaje)}>
                        {formatFecha(v.fechaSalida)} • {formatHora(v.fechaSalida)} — {v.unidad?.nombre || 'N/A'} → {v.destino || 'N/A'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          {/* Lista de pasajeros */}
          <div className="bg-white p-4 rounded-md shadow-md w-full mx-auto min-h-0 flex flex-col">
            <h3 className="text-base font-bold text-orange-700 mb-2">Lista de pasajeros</h3>
            <div className="overflow-auto max-h-[calc(100%-2rem)]">
              <table className="min-w-[900px] w-full border-collapse text-[13px]">
                <thead className="bg-[#FECF9D] text-orange-700 sticky top-0">
                  <tr>
                    <th className="p-2 text-center font-bold text-[#452B1C]">Folio</th>
                    <th className="p-2 text-center font-bold text-[#452B1C]">Unidad</th>
                    <th className="p-2 text-center font-bold text-[#452B1C]">Asiento</th>
                    <th className="p-2 text-center font-bold text-[#452B1C]">Fecha de salida</th>
                    <th className="p-2 text-center font-bold text-[#452B1C]">Nombre</th>
                    <th className="p-2 text-center font-bold text-[#452B1C]">Pago</th>
                    <th className="p-2 text-center font-bold text-[#452B1C]">Tipo</th>
                    <th className="p-2 text-center font-bold text-[#452B1C]">Importe</th>
                    <th className="p-2 text-center font-bold text-[#452B1C]">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {viajeSeleccionado?.pasajeros?.length > 0 ? (
                    viajeSeleccionado.pasajeros.map((p, index) => (
                      <tr
                        key={p.folio ?? `${p.idPasajero}-${index}`}
                        className={`hover:bg-orange-50 ${index % 2 === 0 ? 'bg-orange-50/40' : 'bg-white'}`}
                      >
                        <td className="p-2 text-center">{p.folio ?? '-'}</td>
                        <td className="p-2 text-center">{viajeSeleccionado.unidad?.nombre || 'N/A'}</td>
                        <td className="p-2 text-center">{p.asiento}</td>
                        <td className="p-2 text-center">
                          {formatFecha(viajeSeleccionado.fechaSalida)} {formatHora(viajeSeleccionado.fechaSalida)}
                        </td>
                        <td className="p-2 text-center">
                          {`${p.nombre ?? ''} ${p.apellido ?? ''}`.trim()}
                        </td>
                        <td className="p-2 text-center">{p.tipoPago}</td>
                        <td className="p-2 text-center">{p.tipo}</td>
                        <td className="p-2 text-center font-semibold">
                          ${parseFloat(p.importe || 0).toFixed(2)}
                        </td>

                        <td className="p-2 text-center whitespace-nowrap">
                          {/* Imprimir Ticket */}
                          <button
                            onClick={async () => {
                              try {
                                if (!window?.ticket?.imprimirPasajero) {
                                  Swal.fire({
                                    icon: 'error',
                                    title: 'Impresión no disponible',
                                    text: 'No se encontró el módulo de impresión.'
                                  });
                                  return;
                                }
                                const res = await window.ticket.imprimirPasajero(p, viajeSeleccionado);
                                if (!res || !res.ok) {
                                  Swal.fire({
                                    icon: 'error',
                                    title: 'Error al imprimir ticket',
                                    text: res?.error || 'No se pudo imprimir el ticket'
                                  });
                                  return;
                                }
                                Swal.fire({ icon: 'success', title: 'Ticket impreso', timer: 1100, showConfirmButton: false });
                              } catch (err) {
                                console.error(err);
                                Swal.fire({
                                  icon: 'error',
                                  title: 'Error inesperado al imprimir',
                                  text: err?.message || 'Intenta de nuevo'
                                });
                              }
                            }}
                            className="p-1.5 text-[#C14600] hover:text-orange-800 transition"
                            title="Imprimir ticket"
                            aria-label="Imprimir ticket"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="1.6em" height="1.6em" viewBox="0 0 24 24">
                              <g fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18.353 14H19c.943 0 1.414 0 1.707-.293S21 12.943 21 12v-1c0-1.886 0-2.828-.586-3.414S18.886 7 17 7H7c-1.886 0-2.828 0-3.414.586S3 9.114 3 11v2c0 .471 0 .707.146.854C3.293 14 3.53 14 4 14h1.647" />
                                <path d="M6 20.306V12c0-.943 0-1.414.293-1.707S7.057 10 8 10h8c.943 0 1.414 0 1.707.293S18 11.057 18 12v8.306c0 .317 0 .475-.104.55s-.254.025-.554-.075l-2.184-.728c-.078-.026-.117-.04-.158-.04s-.08.014-.158.04l-2.684.894c-.078.026-.117.04-.158.04s-.08-.014-.158-.04l-2.684-.894c-.078-.026-.117-.04-.158-.04s-.08.014-.158.04l-2.184.728c-.3.1-.45.15-.554.075S6 20.623 6 20.306ZM18 7V5.88c0-1.008 0-1.512-.196-1.897a1.8 1.8 0 0 0-.787-.787C16.632 3 16.128 3 15.12 3H8.88c-1.008 0-1.512 0-1.897.196a1.8 1.8 0 0 0-.787.787C6 4.368 6 4.872 6 5.88V7" />
                                <path strokeLinecap="round" d="M10 14h3m-3 3h4.5" />
                              </g>
                            </svg>
                          </button>

                          {/* Eliminar */}
                          <button
                            onClick={() => eliminarPasajero(p.idPasajero)}
                            className="p-1.5 text-[#C14600] hover:text-orange-800 transition"
                            title="Eliminar"
                            aria-label="Eliminar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="1.6em" height="1.6em" viewBox="0 0 24 24">
                              <path fill="currentColor" d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="text-center text-gray-500 p-4">
                        No hay pasajeros registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

