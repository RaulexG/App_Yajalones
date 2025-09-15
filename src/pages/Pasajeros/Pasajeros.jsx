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
import Swal from "sweetalert2";

export default function Pasajeros() {
  const [turnos, setTurnos] = useState([]);
  const [viajes, setViajes] = useState([]);
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);
  const [asientosOcupados, setAsientosOcupados] = useState([]);
  const [idPasajeroEditando, setIdPasajeroEditando] = useState(null);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState('');

  useEffect(() => {
    console.log('electronAPI:', window.electronAPI);
  }, []);


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
      Swal.fire({
        icon: "warning",
        title: "No hay un viaje seleccionado",
        timer: 1500,
        showConfirmButton: false
      });
      return;
    }
    if (!formulario.fechaSalida || !formulario.hora) {
      alert('Selecciona fecha y hora');
      return;
    }
    if (!formulario.asiento) {
      Swal.fire({
        icon: "warning",
        title: "Seleccione un asiento",
        timer: 1000,
        showConfirmButton: false
      });
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
        Swal.fire({
          icon: "success",
          title: "Pasajero actualizado",
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        await CrearPasajeros(pasajeroFinal);
        Swal.fire({
          icon: "success",
          title: "Pasajero agregado",
          timer: 1500,
          showConfirmButton: false
        });
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
      Swal.fire({
        icon: "error",
        title: "Error al borrar pasajero",
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  const eliminarPasajero = async (idPasajero) => {
    try {
      const result = await Swal.fire({
        icon: 'question',
        title: '¿Seguro que quieres eliminar al pasajero?',
        showCancelButton: true,         // Botón "No"
        confirmButtonText: 'Sí',        // Botón "Sí"
        cancelButtonText: 'No',
        reverseButtons: true
      });

      if (result.isConfirmed) {
        // Solo eliminamos si el usuario confirma
        await EliminarPasajero(idPasajero);

        Swal.fire({
          icon: 'success',
          title: 'Pasajero eliminado',
          timer: 1500,
          showConfirmButton: false
        });

        if (formulario.viaje?.idViaje) {
          const viajeActualizado = await ObtenerViajePorId(formulario.viaje.idViaje);
          setViajeSeleccionado(viajeActualizado);
          setAsientosOcupados(viajeActualizado.pasajeros.map((p) => p.asiento));
        }
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error al eliminar pasajero',
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  const ObtenerAsientos = (unidad) => parseInt(unidad?.numeroPasajeros || 20);





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





  const choferAsignado = viajeSeleccionado
    ? choferes.find((c) => c.unidad?.idUnidad === viajeSeleccionado.unidad?.idUnidad)
    : null;

  return (
    <div className="p-4 ">
      {/* Contenedor en 3 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 max-w-[1600px] mx-auto">
        <div className="flex flex-col gap-6">

          {/* Formulario*/}
          <div>
            <form
              onSubmit={manejarEnvio}
              className="bg-white p-6 rounded-md shadow-md w-full space-y-4">
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
                      onClick={() => { }}
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
                      onClick={() => { }}
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
                  <option value="SCLC">San Cristóbal</option>
                </select>
              </div>


              {/* Selección de Asientos */}
              <div className="bg-orange-50 p-3 rounded-md">
                <p className="text-orange-700 font-semibold mb-3">Seleccionar asiento</p>
                <div className="grid grid-cols-4 gap-4 justify-items-center">
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
        </div>

        {/* Tabla de cambio de turno */}
        <div className="flex flex-col gap-6">
          <div className="bg-[#FDF7F0] p-4 rounded-md shadow-md ">
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

              <div className="h-[180px] overflow-y-auto custom-scroll">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-[#FECF9D] text-orange-700 sticky top-0">
                    <tr>
                      <th className="p-2 text-center font-bold text-[#452B1C]">Fecha de salida</th>
                      <th className="p-2 text-center font-bold text-[#452B1C]">Unidad</th>
                      <th className="p-2 text-center font-bold text-[#452B1C]">Destino</th>
                      <th className="p-2 text-center font-bold text-[#452B1C]"></th>
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
        

        {/* Columna derecha: Tabla lista pasajeros */}
        <div className="bg-white p-4 rounded-md shadow-md w-full mx-auto">
          <h3 className="text-lg font-bold text-orange-700 mb-3">Lista de pasajeros</h3>
          <div className="overflow-x-auto overflow-y-auto max-h-[500px] custom-scroll">
            <table className="min-w-[900px] w-full border-collapse text-sm">

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
                  <th className="p-2 text-center font-bold text-[#452B1C]"></th>
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

                      <td className="p-3 text-center">{viajeSeleccionado.unidad?.nombre || "N/A"}</td>
                      <td className="p-3 text-center">{p.asiento}</td>
                      <td className="p-3 text-center">{new Date(viajeSeleccionado.fechaSalida).toLocaleDateString("es-MX")}</td>
                      <td className="p-3 text-center">{p.nombre} {p.apellido}</td>
                      <td className="p-3 text-center">{p.tipoPago}</td>
                      <td className="p-3 text-center">{p.tipo}</td>
                      <td className="p-3 text-center font-semibold">${parseFloat(p.importe || 0).toFixed(2)}</td>

                      <td className="p-3 text-center">
                        {/* Botón Ticket*/}
                        <button
                          onClick={async () => {
                            try {
                              await window.ticket.imprimirPasajero(
                                p,
                                viajeSeleccionado // <-- usa el viaje seleccionado, que tiene todos los datos
                              );
                              alert('Ticket impreso correctamente');
                            } catch (err) {
                              console.error(err);
                              alert('Error al imprimir ticket: ' + err);
                            }
                          }}
                          className="p-2 text-[#C14600] hover:text-orange-800 transition"
                          title="Imprimir ticket"
                          aria-label="Imprimir ticket"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="1.8em" height="1.8em" viewBox="0 0 24 24">
                            <g fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18.353 14H19c.943 0 1.414 0 1.707-.293S21 12.943 21 12v-1c0-1.886 0-2.828-.586-3.414S18.886 7 17 7H7c-1.886 0-2.828 0-3.414.586S3 9.114 3 11v2c0 .471 0 .707.146.854C3.293 14 3.53 14 4 14h1.647" />
                              <path d="M6 20.306V12c0-.943 0-1.414.293-1.707S7.057 10 8 10h8c.943 0 1.414 0 1.707.293S18 11.057 18 12v8.306c0 .317 0 .475-.104.55s-.254.025-.554-.075l-2.184-.728c-.078-.026-.117-.04-.158-.04s-.08.014-.158.04l-2.684.894c-.078.026-.117.04-.158.04s-.08-.014-.158-.04l-2.684-.894c-.078-.026-.117-.04-.158-.04s-.08.014-.158.04l-2.184.728c-.3.1-.45.15-.554.075S6 20.623 6 20.306ZM18 7V5.88c0-1.008 0-1.512-.196-1.897a1.8 1.8 0 0 0-.787-.787C16.632 3 16.128 3 15.12 3H8.88c-1.008 0-1.512 0-1.897.196a1.8 1.8 0 0 0-.787.787C6 4.368 6 4.872 6 5.88V7" />
                              <path strokeLinecap="round" d="M10 14h3m-3 3h4.5" />
                            </g>
                          </svg>
                        </button>


                        <button
                          onClick={() => eliminarPasajero(p.idPasajero)}
                          className="p-2 text-[#C14600] hover:text-orange-800 transition"
                          title="Eliminar"
                          aria-label="Eliminar"
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
        </div>





      </div>
    </div>
  );


}