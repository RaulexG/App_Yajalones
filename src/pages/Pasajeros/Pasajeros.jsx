import { useEffect, useState } from 'react';
import {
  CrearViaje,
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
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);
  const [asientosOcupados, setAsientosOcupados] = useState([]);
  const [idPasajeroEditando, setIdPasajeroEditando] = useState(null);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState('');
  

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

  const [pasajeroTicket, setPasajeroTicket] = useState(null);
  const [choferes, setChoferes] = useState([]);
  const [sobreEquipaje, setSobreEquipaje] = useState('');


const viajesFiltrados = turnoSeleccionado
  ? viajes.filter((viaje) => viaje.unidad.turno?.idTurno === Number(turnoSeleccionado))
  : [];


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

  const manejarCambio = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const manejarCambioAsiento = (numero) => {
    setFormulario({ ...formulario, asiento: numero });
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
      viaje: null,
    });
    setIdPasajeroEditando(null);
    return;
  }

  const fechaObj = new Date(viajeSeleccionado.fechaSalida);
  const fechaFormateada = `${fechaObj.getDate().toString().padStart(2, '0')}/${(fechaObj.getMonth() + 1).toString().padStart(2, '0')}/${fechaObj.getFullYear()}`;
  const horaFormateada = `${fechaObj.getHours().toString().padStart(2, '0')}:${fechaObj.getMinutes().toString().padStart(2, '0')}`;

  setFormulario({
    nombre: '',
    apellido: '',
    origen: viajeSeleccionado.origen,
    destino: viajeSeleccionado.destino,
    fechaSalida: fechaFormateada,
    hora: horaFormateada,
    tipo: 'ADULTO',
    tipoPago: 'PAGADO',
    asiento: null,
    viaje: viajeSeleccionado,
  });
  setIdPasajeroEditando(null);
};


  const manejarEnvio = async (e) => {
    e.preventDefault();

    if (!formulario.nombre.trim()) {
      alert('Debes ingresar el nombre');
      return;
    }
    if (!formulario.origen || !formulario.destino) {
      alert('Selecciona origen y destino');
      return;
    }
    if (!formulario.fechaSalida || !formulario.hora) {
      alert('Selecciona fecha y hora');
      return;
    }
    if (!formulario.asiento) {
      alert('Selecciona un asiento');
      return;
    }

    try {
      let viajeId = formulario.viaje?.idViaje;

      
      const pasajeroFinal = {
        nombre: formulario.nombre,
        apellido: formulario.apellido,
        tipo: formulario.tipo,
        tipoPago: formulario.tipoPago,
        asiento: formulario.asiento,
        idViaje: viajeId,
      };
      
      
      
      if (idPasajeroEditando) {
        await ActualizarPasajero(idPasajeroEditando, pasajeroFinal);
        alert('Pasajero actualizado correctamente');
      } else {
        await CrearPasajeros(pasajeroFinal);
        alert('Pasajero agregado correctamente');
      }

      
      const viajeActualizado = await ObtenerViajePorId(viajeId);
      setViajeSeleccionado({ ...viajeActualizado });
      setAsientosOcupados(viajeActualizado.pasajeros.map((p) => p.asiento));
      const pasajeroConImporte = viajeActualizado.pasajeros.find(
  (p) => p.asiento === formulario.asiento && p.nombre === formulario.nombre && p.apellido === formulario.apellido
);

      setPasajeroTicket(pasajeroConImporte);
      limpiarFormulario();
    } catch (error) {
      console.error(error);
      alert('Error al guardar pasajero');
    }
  };

  const eliminarPasajero = async (idPasajero) => {
    try {
      await EliminarPasajero(idPasajero);
      alert('Pasajero eliminado');
      if (formulario.viaje?.idViaje) {
        const viajeActualizado = await ObtenerViajePorId(formulario.viaje.idViaje);
        setViajeSeleccionado(viajeActualizado);
        setAsientosOcupados(viajeActualizado.pasajeros.map((p) => p.asiento));
      }
    } catch (error) {
      console.error(error);
      alert('Error al eliminar pasajero');
    }
  };



  const manejarSeleccionViaje = (viaje) => {
  setViajeSeleccionado(viaje);
    const fechaHoraISO = viaje.fechaSalida;
const fechaObj = new Date(fechaHoraISO);
const fechaFormateada = `${fechaObj.getDate().toString().padStart(2, '0')}/${(fechaObj.getMonth() + 1).toString().padStart(2, '0')}/${fechaObj.getFullYear()}`;


const horaFormateada = `${fechaObj.getHours().toString().padStart(2, '0')}:${fechaObj.getMinutes().toString().padStart(2, '0')}`;

  setFormulario({
    ...formulario,
    viaje: viaje,
    origen: viaje.origen,
    destino: viaje.destino,
    fechaSalida: fechaFormateada, 
    hora: horaFormateada,
    asiento: null 
  });

  
  setAsientosOcupados(viaje.pasajeros ? viaje.pasajeros.map(p => p.asiento) : []);
};

  const imprimirTicket = (pasajero) => {
    
    const textoSobreEquipaje = prompt("Ingrese el texto de Sobre Equipaje (opcional):") || '';
    const ventana = window.open('', '', 'width=400,height=600');
    ventana.document.write('<html><head><title>Ticket Pasajero</title></head><body>');
    ventana.document.write('<h2>Los Yajalones</h2>');
    ventana.document.write(`<p><strong>Folio:</strong> ${pasajero.folio}</p>`);
    ventana.document.write(`<p><strong>Nombre:</strong> ${pasajero.nombre} ${pasajero.apellido}</p>`);
    ventana.document.write(`<p><strong>Tipo:</strong> ${pasajero.tipo}</p>`);
    ventana.document.write(`<p><strong>Tipo de Pago:</strong> ${pasajero.tipoPago}</p>`);
    ventana.document.write(`<p><strong>Asiento:</strong> ${pasajero.asiento}</p>`);
    ventana.document.write(`<p><strong>Importe:</strong> ${parseFloat(pasajero.importe || 0).toFixed(2)}</p>`);
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
    ? choferes.find((c) => c.unidad?.idUnidad === viajeSeleccionado.unidad?.idUnidad)
    : null;

  return (
    <div className="p-4">
      {/* Contenedor en 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 max-w-[1400px] mx-auto">

        {/* Columna izquierda: Formulario + asientos + botones */}
        <div>
          <form
            onSubmit={manejarEnvio}
            className="bg-white p-4 rounded-md shadow-md w-full max-w-[500px] space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-orange-700 font-semibold mb-1">Nombre</label>
              <input
                type="text"
                name="nombre"
                value={formulario.nombre}
                onChange={manejarCambio}
                placeholder=""
                className="w-full p-3 rounded-md bg-orange-100 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            {/* Apellido */}
            <div>
              <label className="block text-orange-700 font-semibold mb-1">Apellido</label>
              <input
                type="text"
                name="apellido"
                value={formulario.apellido}
                onChange={manejarCambio}
                placeholder=""
                className="w-full p-3 rounded-md bg-orange-100 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            {/* Origen y Destino */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-orange-700 font-semibold mb-1">Origen</label>
                <select
                  name="origen"
                  value={formulario.origen}
                  onChange={manejarCambio}
                  disabled
                  className="w-full p-3 rounded-md bg-orange-100 text-gray-800"
                  required
                >
                  <option value="" disabled>Selecciona origen</option>
                  <option value="Tuxtla Gutierrez">Tuxtla Gutiérrez</option>
                  <option value="Yajalon">Yajalón</option>
                </select>
              </div>

              <div>
                <label className="block text-orange-700 font-semibold mb-1">Destino</label>
                <select
                  name="destino"
                  value={formulario.destino}
                  onChange={manejarCambio}
                  className="w-full p-3 rounded-md bg-orange-100 text-gray-800"
                  disabled
                  required
                >
                  <option value="" disabled>Selecciona destino</option>
                  <option value="Tuxtla Gutierrez">Tuxtla Gutiérrez</option>
                  <option value="Yajalon">Yajalón</option>
                </select>
              </div>
            </div>

            {/* Fecha y Hora */}
            <div>
              <label className="block text-orange-700 font-semibold mb-1">Fecha y hora de salida</label>
              <div className="grid grid-cols-2 gap-2">
                {/* Fecha */}
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={formulario.fechaSalida || "Selecciona fecha"}
                    className="w-full p-3 rounded-md bg-orange-100 text-gray-800"
                  />
                  <input
                    type="date"
                    id="fecha"
                    className="hidden"
                    onChange={(e) => {
                      const [year, month, day] = e.target.value.split("-");
                      const fechaFormateada = `${day}/${month}/${year}`;
                      setFormulario({ ...formulario, fechaSalida: fechaFormateada });
                    }}
                  />
                  <span
                    className="absolute right-3 top-3 text-orange-600 cursor-pointer"
                    onClick={() => {}}
                  >
                    {/* Ícono calendario SVG */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="1.5em"
                      height="1.5em"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="M19 19H5V8h14m-3-7v2H8V1H6v2H5c-1.11 0-2 .89-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-1V1m-1 11h-5v5h5z"
                      />
                    </svg>
                  </span>
                </div>

                {/* Hora */}
                <div className="relative">
                  {/* Input visible */}
                  <input
                    type="text"
                    readOnly
                    value={formulario.hora || "Selecciona hora"}
                    className="w-full p-3 rounded-md bg-orange-100 text-gray-800"
                  />
                  {/* Input oculto tipo time */}
                  <input
                    type="time"
                    id="hora"
                    step="2400" // 40 minutos = 2400 segundos
                    className="hidden"
                    onChange={(e) => setFormulario({ ...formulario, hora: e.target.value })}
                  />
                  <span
                    className="absolute right-3 top-3 text-orange-600 cursor-pointer"
                    onClick={() => {}}
                  >
                    {/* Icono Reloj */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" viewBox="0 0 24 24">
                      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0m9 0l-3 2m3-7v5" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>

            {/* Tipo de boleto */}
            <div>
              <label className="block text-orange-700 font-semibold mb-1">Tipo de boleto</label>
              <select
                name="tipo"
                value={formulario.tipo}
                onChange={manejarCambio}
                className="w-full p-3 rounded-md bg-orange-100 text-gray-800"
              >
                <option value="ADULTO">Adulto</option>
                <option value="NIÑO">Niño</option>
                <option value="INCENT_INAPAM">INAPAM</option>
              </select>
            </div>


            {/* Tipo de pago */}
            <div>
              <label className="block text-orange-700 font-semibold mb-1">Tipo de pago</label>
              <select
                name="tipoPago"
                value={formulario.tipoPago}
                onChange={manejarCambio}
                className="w-full p-3 rounded-md bg-orange-100 text-gray-800"
              >
                <option value="PAGADO">Pagado</option>
                <option value="DESTINO">Paga al llegar</option>
                <option value="SCLC">Sube en San Cristóbal</option>
              </select>
            </div>


            {/* Selección de Asientos */}
            <div className="bg-orange-50 p-3 rounded-md">
              <p className="text-orange-700 font-semibold mb-3">Seleccionar asiento</p>
              <div className="grid grid-cols-4 gap-4 justify-items-center">
                {[...Array(18)].map((_, i) => {
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
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="3em"
                        height="3em"
                        viewBox="0 0 24 24"
                        className={ocupado ? "text-orange-900" : seleccionado ? "text-orange-700" : "text-orange-500"}
                      >
                        <path fill="currentColor" d="M5.35 5.64c-.9-.64-1.12-1.88-.49-2.79c.63-.9 1.88-1.12 2.79-.49c.9.64 1.12 1.88.49 2.79c-.64.9-1.88 1.12-2.79.49M16 20c0-.55-.45-1-1-1H8.93c-1.48 0-2.74-1.08-2.96-2.54L4.16 7.78A.976.976 0 0 0 3.2 7c-.62 0-1.08.57-.96 1.18l1.75 8.58A5.01 5.01 0 0 0 8.94 21H15c.55 0 1-.45 1-1m-.46-5h-4.19l-1.03-4.1c1.28.72 2.63 1.28 4.1 1.3c.58.01 1.05-.49 1.05-1.07c0-.59-.49-1.04-1.08-1.06c-1.31-.04-2.63-.56-3.61-1.33L9.14 7.47c-.23-.18-.49-.3-.76-.38a2.2 2.2 0 0 0-.99-.06h-.02a2.27 2.27 0 0 0-1.84 2.61l1.35 5.92A3.01 3.01 0 0 0 9.83 18h6.85l3.09 2.42c.42.33 1.02.29 1.39-.08c.45-.45.4-1.18-.1-1.57l-4.29-3.35a2 2 0 0 0-1.23-.42" />
                      </svg>
                      <span className={`text-sm font-bold ${ocupado ? "text-orange-900" : seleccionado ? "text-orange-700" : "text-orange-500"}`}>
                        {numero.toString().padStart(2, "0")}
                      </span>
                    </button>
                  );
                })}
              </div>
              {/* Leyenda */}
              <div className="flex justify-center gap-6 mt-4 text-xs">
                <span className="flex items-center gap-1 text-orange-900 font-semibold">
                  <span className="w-4 h-4 bg-orange-900 rounded-full inline-block"></span> Ocupado
                </span>
                <span className="flex items-center gap-1 text-orange-500 font-semibold">
                  <span className="w-4 h-4 bg-orange-500 rounded-full inline-block"></span> Disponible
                </span>
              </div>
            </div>

            {/* Unidad */}
            <div className="text-center mt-4 text-orange-700 font-semibold">
              Unidad {viajeSeleccionado?.unidad?.nombre || "N/A"}: {choferAsignado ? `${choferAsignado.nombre} ${choferAsignado.apellido}` : "No asignado"}
            </div>

            {/* Botones */}
            <div className="flex justify-center gap-4 mt-4">
              {/* Botón Guardar */}
              <button
                type="submit"
                className="bg-[#C44706] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-800 transition"
              >
                Guardar
              </button>

              
            </div>

            
            

          </form>
        </div>

        {/* Columna derecha: Tabla */}
        <div className="bg-white p-4 rounded-md shadow-md w-full max-w-[900px] mx-auto">
          <h3 className="text-lg font-bold text-orange-700 mb-3">Lista de pasajeros</h3>
          <div className="overflow-y-auto max-h-[500px] custom-scroll">
            <table className="w-full border-collapse text-sm">
              {/* Encabezado */}
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
                </tr>
              </thead>

              {/* Cuerpo */}
              <tbody>
                {viajeSeleccionado?.pasajeros?.length > 0 ? (
                  viajeSeleccionado.pasajeros.map((p, index) => (
                    <tr
                      key={p.folio}
                      className={`hover:bg-orange-50 ${index % 2 === 0 ? "bg-orange-50/40" : "bg-white"}`}
                    >
                      <td className="p-3">{p.folio}</td>
                      
                      <td className="p-3">{viajeSeleccionado.unidad?.nombre || "N/A"}</td>
                      <td className="p-3">{p.asiento}</td>
                      <td className="p-3">{new Date(viajeSeleccionado.fechaSalida).toLocaleDateString("es-MX")}</td>
                      <td className="p-3">{p.nombre} {p.apellido}</td>
                      <td className="p-3">{p.tipoPago}</td>
                      <td className="p-3">{p.tipo}</td>
                      <td className="p-3 font-semibold">${parseFloat(p.importe || 0).toFixed(2)}</td>
                      <td className="p-3 text-center">
                        {/* Botón Ticket */}
          <button
            onClick={() => imprimirTicket(p)}
            className="bg-orange-700 text-white px-3 py-1 rounded hover:bg-orange-800 transition"
            title="Imprimir ticket"
          >
            Ticket
          </button>
                        
                        <button
                          onClick={() => eliminarPasajero(p.idPasajero)}
                          className="text-orange-700 hover:text-red-600 transition"
                        >
                          {/* Icono eliminar */}
                          <svg xmlns="http://www.w3.org/2000/svg" width="1.8em" height="1.8em" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center text-gray-500 p-4">
                      No hay pasajeros registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabla de cambio de turno */}
        <div className="bg-[#FDF7F0] p-4 rounded-md shadow-md mt-6">
          {/* Select Cambio de turno */}
          <div className="mb-4">
            <label className="block text-orange-700 font-semibold mb-2">Cambio de turno</label>
            <select
  className="w-48 p-2 rounded-md bg-orange-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
  value={turnoSeleccionado}
  onChange={(e) => setTurnoSeleccionado(e.target.value)}
>
  <option value="">Seleccionar turno</option>
  {turnos.map((t) => (
    <option key={t.idTurno} value={t.idTurno}>
      {t.horario}
    </option>
  ))}
</select>

          </div>

          {/* Tabla de Viajes */}
          <div>
            <h4 className="text-orange-700 font-semibold mb-2">Viajes</h4>
            <div className="overflow-y-auto max-h-[250px] custom-scroll">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-[#FECF9D] text-orange-700 sticky top-0">
                  <tr>
                    <th className="p-2 text-center font-bold text-[#452B1C]">Fecha de salida</th>
                    <th className="p-2 text-center font-bold text-[#452B1C]">Unidad</th>
                    <th className="p-2 text-center font-bold text-[#452B1C]">Destino</th>
                  </tr>
                </thead>
                <tbody>
                  {viajesFiltrados.length > 0 ? (
                    viajesFiltrados.map((v) => (
                      <tr key={v.idViaje} className="hover:bg-orange-50 border-b">
                        <td className="p-2">{new Date(v.fechaSalida).toLocaleDateString('es-MX')}</td>
                        <td className="p-2">{v.unidad?.nombre || "N/A"}</td>
                        <td className="p-2">{v.destino || "N/A"}</td>
                        <td className="p-2 text-center">
                          <button
  onClick={() => manejarSeleccionViaje(v)}
  className="text-orange-700 hover:text-blue-600 transition"
>
  Seleccionar
</button>

                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center text-gray-500 p-4">
                        No hay viajes disponibles
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