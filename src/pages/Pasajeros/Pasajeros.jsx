import { useEffect, useState } from 'react';
import {
  CrearPasajeros,
  ListarTurnos,
  ListarViajes,
  ObtenerViajePorId,
  ActualizarPasajero,
  EliminarPasajero,
  ListarChoferes
} from '../../services/Admin/adminService';

export default function Pasajeros() {
  const [turnos, setTurnos] = useState([]);
  const [viajes, setViajes] = useState([]);
  const [viajesFiltrados, setViajesFiltrados] = useState([]);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);
  const [asientosOcupados, setAsientosOcupados] = useState([]);
  const [idPasajeroEditando, setIdPasajeroEditando] = useState(null);
  const [formulario, setFormulario] = useState({
    nombre: '',
    apellido: '',
    tipo: 'ADULTO',
    asiento: null,
    tipoPago: 'PAGADO',
    viaje: null,
  });

  // Para controlar el pasajero seleccionado para generar ticket
  const [pasajeroTicket, setPasajeroTicket] = useState(null);
  const [choferes, setChoferes] = useState([]);

  // Estado para sobre equipaje en el modal
  const [sobreEquipaje, setSobreEquipaje] = useState('');

  useEffect(() => {
    const cargarDatos = async () => {
      const dataTurnos = await ListarTurnos();
      setTurnos(dataTurnos);
      const dataViajes = await ListarViajes();
      setViajes(dataViajes);
      const dataChoferes = await ListarChoferes();
      setChoferes(dataChoferes);
    };
    cargarDatos();
  }, []);

  useEffect(() => {
    if (turnoSeleccionado) {
      const filtrados = viajes.filter(v => v.unidad?.turno?.idTurno === parseInt(turnoSeleccionado));
      setViajesFiltrados(filtrados);
      setViajeSeleccionado(null);
      setFormulario({
        nombre: '',
        apellido: '',
        tipo: 'ADULTO',
        asiento: null,
        tipoPago: 'PAGADO',
        viaje: null,
      });
      setAsientosOcupados([]);
      setIdPasajeroEditando(null);
    } else {
      setViajesFiltrados([]);
      setViajeSeleccionado(null);
    }
  }, [turnoSeleccionado, viajes]);

  const manejarCambio = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const manejarCambioAsiento = (numero) => {
    setFormulario({ ...formulario, asiento: numero });
  };

  const manejarSeleccionTurno = (e) => {
    setTurnoSeleccionado(e.target.value);
  };

  const manejarSeleccionViaje = async (e) => {
    const idViaje = parseInt(e.target.value);
    setFormulario({ ...formulario, viaje: { idViaje } });
    const viaje = await ObtenerViajePorId(idViaje);
    setViajeSeleccionado(viaje);
    const ocupados = viaje.pasajeros.map(p => p.asiento);
    setAsientosOcupados(ocupados);
  };

  const seleccionarPasajero = (pasajero) => {
    setFormulario({
      nombre: pasajero.nombre,
      apellido: pasajero.apellido,
      tipo: pasajero.tipo,
      asiento: pasajero.asiento,
      tipoPago: pasajero.tipoPago,
      viaje: { idViaje: formulario.viaje.idViaje },
    });
    setIdPasajeroEditando(pasajero.idPasajero);
  };

  const eliminarPasajero = async (idPasajero) => {
    try {
      await EliminarPasajero(idPasajero);
      alert("Pasajero eliminado");
      if (formulario.viaje?.idViaje) {
        const viajeActualizado = await ObtenerViajePorId(formulario.viaje.idViaje);
        setViajeSeleccionado(viajeActualizado);
        setAsientosOcupados(viajeActualizado.pasajeros.map(p => p.asiento));
      }
    } catch (error) {
      console.error(error);
      alert("Error al eliminar pasajero");
    }
  };

  const limpiarFormulario = () => {
    setFormulario({ nombre: '', apellido: '', tipo: 'ADULTO', asiento: null, tipoPago: 'PAGADO', viaje: formulario.viaje });
    setIdPasajeroEditando(null);
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();

    const pasajeroFinal = { ...formulario };

    if (!pasajeroFinal.viaje || !pasajeroFinal.viaje.idViaje) {
      alert('Seleccione un viaje');
      return;
    }

    if (idPasajeroEditando) {
      const pasajeroOriginal = viajeSeleccionado.pasajeros.find(p => p.idPasajero === idPasajeroEditando);
      const pasajeroConFolio = {
        ...pasajeroFinal,
        folio: pasajeroOriginal ? pasajeroOriginal.folio : undefined,
      };

      await ActualizarPasajero(idPasajeroEditando, pasajeroConFolio);
    } else {
      await CrearPasajeros(pasajeroFinal);
    }

    const viajeActualizado = await ObtenerViajePorId(formulario.viaje.idViaje);
    setViajeSeleccionado(viajeActualizado);
    setAsientosOcupados(viajeActualizado.pasajeros.map(p => p.asiento));
    limpiarFormulario();
  };

  const imprimirTicket = (pasajero, textoSobreEquipaje = '') => {
    const ventana = window.open('', '', 'width=400,height=600');
    ventana.document.write('<html><head><title>Ticket Pasajero</title></head><body>');
    ventana.document.write('<h2>Ticket Pasajero</h2>');
    ventana.document.write(`<p><strong>Folio:</strong> ${pasajero.folio}</p>`);
    ventana.document.write(`<p><strong>Nombre:</strong> ${pasajero.nombre} ${pasajero.apellido}</p>`);
    ventana.document.write(`<p><strong>Tipo:</strong> ${pasajero.tipo}</p>`);
    ventana.document.write(`<p><strong>Tipo de Pago:</strong> ${pasajero.tipoPago}</p>`);
    ventana.document.write(`<p><strong>Asiento:</strong> ${pasajero.asiento}</p>`);
    ventana.document.write(`<p><strong>Importe a Pagar:</strong> $${parseFloat(pasajero.importe || 0).toFixed(2)}</p>`);
    if (textoSobreEquipaje.trim()) {
      ventana.document.write('<hr/>');
      ventana.document.write(`<p><strong>Sobre Equipaje:</strong> ${textoSobreEquipaje}</p>`);
    }
    ventana.document.write('<hr/><p>Gracias por su preferencia.</p>');
    ventana.document.write('</body></html>');
    ventana.document.close();
    ventana.focus();
    ventana.print();
    ventana.close();
  };

  const choferAsignado = viajeSeleccionado
    ? choferes.find(c => c.unidad?.idUnidad === viajeSeleccionado.unidad?.idUnidad)
    : null;

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Registro de Pasajeros</h2>

      <div className="flex gap-4">
        <select
          onChange={manejarSeleccionTurno}
          className="border p-2 rounded"
          value={turnoSeleccionado || ''}
        >
          <option value="">Seleccione Turno</option>
          {turnos.map(turno => (
            <option key={turno.idTurno} value={turno.idTurno}>{turno.horario}</option>
          ))}
        </select>

        <select
          onChange={manejarSeleccionViaje}
          className="border p-2 rounded"
          value={viajeSeleccionado?.idViaje || ''}
          disabled={!turnoSeleccionado}
        >
          <option value="">Seleccione Viaje</option>
          {viajesFiltrados.map(v => (
            <option key={v.idViaje} value={v.idViaje}>
              {v.origen} → {v.destino} - {new Date(v.fechaSalida).toLocaleString('es-MX', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}
            </option>
          ))}
        </select>
      </div>

      {viajeSeleccionado && (
        <div className="mt-2 text-sm text-gray-700">
          <p><strong>Unidad:</strong> {viajeSeleccionado.unidad?.nombre || 'N/A'}</p>
          <p><strong>Chofer:</strong> {choferAsignado ? `${choferAsignado.nombre} ${choferAsignado.apellido}` : 'No asignado'}</p>
          <p><strong>Fecha y Hora de Salida:</strong> {new Date(viajeSeleccionado.fechaSalida).toLocaleString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })}</p>
        </div>
      )}

      {viajeSeleccionado && (
        <form onSubmit={manejarEnvio} className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              name="nombre"
              value={formulario.nombre}
              onChange={manejarCambio}
              placeholder="Nombre"
              className="border p-2 rounded"
              required
            />
            <input
              type="text"
              name="apellido"
              value={formulario.apellido}
              onChange={manejarCambio}
              placeholder="Apellido"
              className="border p-2 rounded"
              required
            />
          </div>

          <div className="flex gap-2">
            <select
              name="tipo"
              value={formulario.tipo}
              onChange={manejarCambio}
              className="border p-2 rounded"
            >
              <option value="ADULTO">Adulto</option>
              <option value="NIÑO">Niño</option>
              <option value="INCENT_INAPAM">INCENT_INAPAM</option>
            </select>

            <select
              name="tipoPago"
              value={formulario.tipoPago}
              onChange={manejarCambio}
              className="border p-2 rounded"
            >
              <option value="PAGADO">Pagado</option>
              <option value="DESTINO">Paga al llegar</option>
              <option value="SAN_CRISTOBAL">Sube en San Cristóbal</option>
            </select>
          </div>

          <div>
            <p className="font-semibold">Seleccione Asiento:</p>
            <div className="grid grid-cols-6 gap-2">
              {[...Array(18)].map((_, i) => {
                const numero = i + 1;
                const ocupado = asientosOcupados.includes(numero);
                return (
                  <button
                    type="button"
                    key={numero}
                    disabled={ocupado}
                    onClick={() => manejarCambioAsiento(numero)}
                    className={`p-2 rounded text-sm border ${
                      ocupado
                        ? 'bg-gray-300'
                        : formulario.asiento === numero
                        ? 'bg-green-400'
                        : 'bg-white'
                    }`}
                  >
                    {numero}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              {idPasajeroEditando ? 'Actualizar' : 'Registrar'} Pasajero
            </button>
            {idPasajeroEditando && (
              <button
                type="button"
                onClick={limpiarFormulario}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      {viajeSeleccionado && viajeSeleccionado.pasajeros.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-2">Pasajeros Registrados</h3>
          <table className="w-full border">
            <thead>
              <tr>
                <th className="border px-2">Folio</th>
                <th className="border px-2">Nombre</th>
                <th className="border px-2">Apellido</th>
                <th className="border px-2">Asiento</th>
                <th className="border px-2">Tipo</th>
                <th className="border px-2">Pago</th>
                <th className="border px-2">Monto</th>
                <th className="p-2 border">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {viajeSeleccionado.pasajeros.map(p => (
                <tr key={p.folio}>
                  <td className="border px-2">{p.folio}</td>
                  <td className="border px-2">{p.nombre}</td>
                  <td className="border px-2">{p.apellido}</td>
                  <td className="border px-2">{p.asiento}</td>
                  <td className="border px-2">{p.tipo}</td>
                  <td className="border px-2">{p.tipoPago}</td>
                  <td className="border px-2">${parseFloat(p.importe).toFixed(2)}</td>
                  <td className="p-2 border flex gap-1">
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-sm"
                      onClick={() => seleccionarPasajero(p)}
                    >
                      Editar
                    </button>
                    <button
                      className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-sm"
                      onClick={() => setPasajeroTicket(p)}
                    >
                      Generar Ticket
                    </button>
                    <button
                      onClick={() => eliminarPasajero(p.idPasajero)}
                      className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Ticket con Sobre Equipaje */}
      {pasajeroTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow max-w-sm w-full">
            <h3 className="text-xl font-bold mb-4">Ticket Pasajero</h3>
            <p><strong>Folio:</strong> {pasajeroTicket.folio}</p>
            <p><strong>Nombre:</strong> {pasajeroTicket.nombre} {pasajeroTicket.apellido}</p>
            <p><strong>Tipo:</strong> {pasajeroTicket.tipo}</p>
            <p><strong>Tipo de Pago:</strong> {pasajeroTicket.tipoPago}</p>
            <p><strong>Asiento:</strong> {pasajeroTicket.asiento}</p>
            <p><strong>Importe a Pagar:</strong> ${parseFloat(pasajeroTicket.importe || 0).toFixed(2)}</p>

            <div className="mt-4">
              <label className="block font-medium mb-1">Sobre Equipaje (opcional):</label>
              <textarea
                value={sobreEquipaje}
                onChange={(e) => setSobreEquipaje(e.target.value)}
                placeholder="Observaciones sobre equipaje..."
                className="w-full border rounded p-2"
              />
            </div>

            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => {
                  imprimirTicket(pasajeroTicket, sobreEquipaje);
                  setPasajeroTicket(null);
                  setSobreEquipaje('');
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                Imprimir
              </button>
              <button
                onClick={() => {
                  setPasajeroTicket(null);
                  setSobreEquipaje('');
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
