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
    // Altura = 100dvh menos la barra superior (ajusta 88px si tu header mide distinto)
    <div className="min-h-[calc(100vh-88px)] w-full overflow-y-auto">
      <div className="mx-auto h-full max-w-[1360px] px-3 md:px-4 py-2 box-border">
  
        {/* Grid maestro: izquierda fija + derecha con tabla scrolleable */}
        <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[minmax(300px,320px)_1fr] gap-4">
  
          {/* IZQUIERDA (no hace scroll; compacta para 1024×768) */}
          <div className="min-w-0">
            <form
              onSubmit={manejarEnvio}
              className="bg-white p-4 rounded-md shadow-md text-[13px] md:text-sm"
            >
              {/* Nombre */}
              <div>
                <label className="block text-orange-700 font-semibold mb-1">Nombre</label>
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
              <div className="mt-2.5">
                <label className="block text-orange-700 font-semibold mb-1">Apellido</label>
                <input
                  type="text"
                  name="apellido"
                  value={formulario.apellido}
                  onChange={manejarCambio}
                  className="w-full p-2.5 rounded-md bg-orange-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
  
              {/* Tipo de boleto / pago */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2.5">
                <div>
                  <label className="block text-orange-700 font-semibold mb-1">Tipo de boleto</label>
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
                  <label className="block text-orange-700 font-semibold mb-1">Tipo de pago</label>
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
  
              {/* Asientos (compacto para 1024×768) */}
              <div className="bg-orange-50 p-3 rounded-md mt-3">
                <p className="text-orange-700 font-semibold mb-2">Seleccionar asiento</p>
                <div className="grid grid-cols-4 gap-2.5 justify-items-center">
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
                          viewBox="0 0 24 24"
                          className={`w-6 h-6 md:w-7 md:h-7 ${ocupado ? 'text-orange-900' : seleccionado ? 'text-orange-700' : 'text-orange-500'}`}
                        >
                          <path fill="currentColor" d="M5.35 5.64c-.9-.64-1.12-1.88-.49-2.79c.63-.9 1.88-1.12 2.79-.49c.9.64 1.12 1.88.49 2.79c-.64.9-1.88 1.12-2.79.49M16 20c0-.55-.45-1-1-1H8.93c-1.48 0-2.74-1.08-2.96-2.54L4.16 7.78A.976.976 0 0 0 3.2 7c-.62 0-1.08.57-.96 1.18l1.75 8.58A5.01 5.01 0 0 0 8.94 21H15c.55 0 1-.45 1-1m-.46-5h-4.19l-1.03-4.1c1.28.72 2.63 1.28 4.1 1.3c.58.01 1.05-.49 1.05-1.07c0-.59-.49-1.04-1.08-1.06c-1.31-.04-2.63-.56-3.61-1.33L9.14 7.47c-.23-.18-.49-.3-.76-.38a2.2 2.2 0 0 0-.99-.06h-.02a2.27 2.27 0 0 0-1.84 2.61l1.35 5.92A3.01 3.01 0 0 0 9.83 18h6.85l3.09 2.42c.42.33 1.02.29 1.39-.08c.45-.45.4-1.18-.1-1.57l-4.29-3.35a2 2 0 0 0-1.23-.42"/>
                        </svg>
                        <span className={`text-[10px] md:text-[11px] font-bold ${ocupado ? 'text-orange-900' : seleccionado ? 'text-orange-700' : 'text-orange-500'}`}>
                          {numero.toString().padStart(2, '0')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
  
              {/* Unidad / Chofer */}
              <div className="text-center mt-2 text-orange-700 font-semibold text-[12px]">
                Unidad {viajeSeleccionado?.unidad?.nombre || 'N/A'} — {choferAsignado ? `${choferAsignado.nombre} ${choferAsignado.apellido}` : 'No asignado'}
              </div>
  
              {/* Botón */}
              <div className="flex justify-center mt-3">
                <button
                  type="submit"
                  className="bg-[#C44706] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-800 transition"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
  
          {/* DERECHA (solo la tabla scrollea) */}
          <div className="min-w-0 min-h-0 flex flex-col">
            {/* Filtros */}
            <div className="bg-[#FDF7F0] p-3 rounded-md shadow-md text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_auto_2fr] gap-3 items-end">
                {/* Turno */}
                <div className="min-w-0">
                  <label className="block text-orange-700 font-semibold mb-1">Turno</label>
                  <select
                    className="w-full p-2.5 rounded-md bg-orange-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    value={turnoSeleccionado}
                    onChange={(e) => setTurnoSeleccionado(e.target.value)}
                  >
                    <option value="">Todos</option>
                    {turnos.map((t) => (
                      <option key={t.idTurno} value={t.idTurno}>{t.horario}</option>
                    ))}
                  </select>
                </div>
  
                {/* Mostrar */}
                <div className="shrink-0">
                  <label className="block text-orange-700 font-semibold mb-1">Mostrar</label>
                  <div className="inline-flex rounded-lg overflow-hidden ring-1 ring-orange-200">
                    {[
                      { key: 'HOY', label: 'Hoy' },
                      { key: 'TODOS', label: 'Todos' }
                    ].map(opt => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setFiltroFecha(opt.key)}
                        className={`px-4 py-2 text-sm font-semibold ${
                          filtroFecha === opt.key ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                        }`}
                        aria-pressed={filtroFecha === opt.key}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
  
                {/* Viaje */}
                <div className="min-w-0">
                  <label className="block text-orange-700 font-semibold mb-1">Viaje</label>
                  <select
                    className="w-full p-2.5 rounded-md bg-orange-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    value={String(viajeSeleccionado?.idViaje ?? '')}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      const v = viajesFiltrados.find(x => x.idViaje === id) || null;
                      if (v) manejarSeleccionViaje(v);
                      else {
                        setViajeSeleccionado(null);
                        setAsientosOcupados([]);
                        setFormulario(prev => ({ ...prev, viaje: null, origen: '', destino: '', fechaSalida: '', hora: '', asiento: null }));
                      }
                    }}
                  >
                    <option value="">Selecciona un viaje</option>
                    {viajesFiltrados.map(v => (
                      <option key={v.idViaje} value={String(v.idViaje)}>
                        {formatFecha(v.fechaSalida)} • {formatHora(v.fechaSalida)} — {v.unidad?.nombre || 'N/A'} → {v.destino || 'N/A'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
  
            {/* Tabla (rellena resto y scrollea) */}
            <div className="bg-white p-4 rounded-md shadow-md flex-1 min-h-0 mt-3 flex flex-col">  {/* <-- agrega flex flex-col */}
                <h3 className="text-base font-bold text-orange-700 mb-2">Lista de pasajeros</h3>
                <div className="flex-1 min-h-0 overflow-auto">                                  {/* <-- cambia h-full por flex-1 min-h-0 */}
                <table className="min-w-[980px] w-full border-collapse text-[13px]">
                  <thead className="bg-[#FECF9D] text-orange-700 sticky top-0 z-10">
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
                        <tr key={p.folio ?? `${p.idPasajero}-${index}`} className={`hover:bg-orange-50 ${index % 2 === 0 ? 'bg-orange-50/40' : 'bg-white'}`}>
                          <td className="p-2 text-center">{p.folio ?? '-'}</td>
                          <td className="p-2 text-center">{viajeSeleccionado.unidad?.nombre || 'N/A'}</td>
                          <td className="p-2 text-center">{p.asiento}</td>
                          <td className="p-2 text-center">{formatFecha(viajeSeleccionado.fechaSalida)} {formatHora(viajeSeleccionado.fechaSalida)}</td>
                          <td className="p-2 text-center">{`${p.nombre ?? ''} ${p.apellido ?? ''}`.trim()}</td>
                          <td className="p-2 text-center">{p.tipoPago}</td>
                          <td className="p-2 text-center">{p.tipo}</td>
                          <td className="p-2 text-center font-semibold">${parseFloat(p.importe || 0).toFixed(2)}</td>
                          <td className="p-2 text-center whitespace-nowrap">{/* acciones */}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={9} className="text-center text-gray-500 p-4">No hay pasajeros registrados</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
  
          </div>
        </div>
      </div>
    </div>
  );
}


