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

export default function Ajustes() {
  const [nombreCuenta, setNombreCuenta] = useState('Administrador'); // temporal

  const [turnoForm, setTurnoForm] = useState({ horario: '', idTurno: null });
  const [unidadForm, setUnidadForm] = useState({ nombre: '',numeroPasajeros: '', descripcion: '', idTurno: '', idUnidad: null });
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
    try{if (turnoForm.idTurno) {
      Swal.fire({
      title: "Guardando...",
      text: "Conectando al servidor",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // ⏱ Si después de 20s no responde, mostramos error
    const timeout = setTimeout(() => {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo conectar al servidor. Inténtalo de nuevo."
      });
    }, 10000);

      await ActualizarTurno(turnoForm.idTurno, { horario: turnoForm.horario });

      clearTimeout(timeout); 
    Swal.fire({
      icon: "success",
      title: "Guardado",
      text: "El turno se editó correctamente"
    });
    } else {
      Swal.fire({
      title: "Guardando...",
      text: "Conectando al servidor",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // ⏱ Si después de 20s no responde, mostramos error
    const timeout = setTimeout(() => {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo conectar al servidor. Inténtalo de nuevo."
      });
    }, 10000);

      await CrearTurno({ horario: turnoForm.horario });

      clearTimeout(timeout); 
    Swal.fire({
      icon: "success",
      title: "Guardado",
      text: "El turno se creó correctamente"
    });
    }
    setTurnoForm({ horario: '', idTurno: null });
    cargarDatos();
  }catch (err) {Swal.fire({
                    icon: "error",
                    title: "Error al guardar turno",
                    text: "Formato esperado HH:MM:SS",
                    timer: 1500,
                    showConfirmButton: false
                  });}
    
  };
  
  const handleGuardarUnidad = async () => {
    const datos = {
      nombre: unidadForm.nombre,
      numeroPasajeros: parseInt(unidadForm.numeroPasajeros),
      descripcion: unidadForm.descripcion,
      activo: true,
      turno: { idTurno: parseInt(unidadForm.idTurno) }
    };
    if (unidadForm.idUnidad) {
      Swal.fire({
      title: "Guardando...",
      text: "Conectando al servidor",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // ⏱ Si después de 20s no responde, mostramos error
    const timeout = setTimeout(() => {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo conectar al servidor. Inténtalo de nuevo."
      });
    }, 10000);
      await ActualizarUnidad(unidadForm.idUnidad, datos);
      clearTimeout(timeout); 
    Swal.fire({
      icon: "success",
      title: "Guardado",
      text: "La unidad se editó correctamente"
    });
    } else {
Swal.fire({
      title: "Guardando...",
      text: "Conectando al servidor",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // ⏱ Si después de 20s no responde, mostramos error
    const timeout = setTimeout(() => {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo conectar al servidor. Inténtalo de nuevo."
      });
    }, 10000);

      await CrearUnidad(datos);

      clearTimeout(timeout); 
    Swal.fire({
      icon: "success",
      title: "Guardado",
      text: "La unidad se creó correctamente"
    });


    }
    setUnidadForm({ nombre: '', numeroPasajeros: '', descripcion: '', idTurno: '', idUnidad: null });
    cargarDatos();
  };

  const handleGuardarViaje = async () => {
    const datos = {
      origen: viajeForm.origen,
      destino: viajeForm.destino,
      fechaSalida: viajeForm.fechaSalida,
      idUnidad: parseInt(viajeForm.idUnidad)
    };
    console.log('Datos del viaje:', datos);
    if (viajeForm.idViaje) {

      Swal.fire({
      title: "Guardando...",
      text: "Conectando al servidor",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // ⏱ Si después de 20s no responde, mostramos error
    const timeout = setTimeout(() => {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo conectar al servidor. Inténtalo de nuevo."
      });
    }, 10000);

      await ActualizarViaje(viajeForm.idViaje, datos);

      clearTimeout(timeout); 
    Swal.fire({
      icon: "success",
      title: "Guardado",
      text: "El viaje se editó correctamente"
    });
    } else {

      Swal.fire({
      title: "Guardando...",
      text: "Conectando al servidor",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // ⏱ Si después de 20s no responde, mostramos error
    const timeout = setTimeout(() => {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo conectar al servidor. Inténtalo de nuevo."
      });
    }, 10000);

      await CrearViaje(datos);

      clearTimeout(timeout); 
    Swal.fire({
      icon: "success",
      title: "Guardado",
      text: "El Viaje se creó correctamente"
    });
    }
    setViajeForm({ origen: '', destino: '', fechaSalida: '', idUnidad: '', idViaje: null });
    cargarDatos();
  };

  const cerrarTabla = () => setMostrarTabla(null);

  const TablaDatos = () => {
    const columnas = {
      turnos: ['ID', 'Horario', ''],
      unidades: ['ID', 'Nombre','Asientos', 'Descripción', 'Turno', ''],
      viajes: ['ID', 'Origen', 'Destino', 'Unidad', 'Fecha de Salida', '']
    };

    const datos = { turnos, unidades, viajes };

    const editar = (tipo, item) => {
      if (tipo === 'turnos') {
        setTurnoForm({ horario: item.horario, idTurno: item.idTurno });
      }
      if (tipo === 'unidades') {
        setUnidadForm({ nombre: item.nombre,asientos: item.numeroPasajeros, descripcion: item.descripcion, idTurno: item.turno?.idTurno || '', idUnidad: item.idUnidad });
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
      unidades: unidades.map(u => [u.idUnidad, u.nombre,u.numeroPasajeros, u.descripcion, u.turno?.horario || '', u]),
      viajes: viajes.map(v => [v.idViaje, v.origen, v.destino, v.unidad?.nombre, v.fechaSalida.toLocaleString() || '', v])
    };

    if (!mostrarTabla) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="">
          {/*Tabla*/}
          <div className="">
            {/* Card */}
            <div className="bg-white rounded-2xl w-[92vw] max-w-3xl shadow-2xl overflow-hidden">

              {/* Encabezado */}
              <div className="flex items-center justify-between px-6 py-4">
                <h2 className="text-xl font-bold text-orange-800 capitalize">
                  Lista de {mostrarTabla}
                </h2>

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
              <div className="px-6 pb-6">
                <div className="overflow-hidden rounded-xl ring-1 ring-orange-200">
                  <table className="w-full table-auto border-collapse">
                    {/* encabezado*/}
                    <thead className="sticky top-0 bg-orange-100 text-orange-900">
                      <tr>
                        {columnas[mostrarTabla].map((col) => (
                          <th key={col} className="px-4 py-3 text-left font-semibold">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    {/* filas zebra + hover */}
                    <tbody className="divide-y divide-orange-100">
                      {filas[mostrarTabla].map((fila, idx) => (
                        <tr
                          key={idx}
                          className="odd:bg-white even:bg-orange-50/40 hover:bg-orange-100 transition-colors"
                        >
                          {fila.map((cell, i) => {
                            const esUltima = i === fila.length - 1;

                            // Turnos/Unidades: última celda = Editar
                            if (esUltima && mostrarTabla !== 'viajes') {
                              return (
                                <td key={i} className="px-4 py-2 text-left">
                                  <button
                                    onClick={() => editar(mostrarTabla, cell)}
                                    aria-label="Editar"
                                    title="Editar"
                                    className="inline-flex items-center justify-center w-9 h-9 rounded-md text-[#C14600] hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-1"
                                  >
                                    {/* Ícono editar */}
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                      className="w-5 h-5">
                                      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
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
                                                      showCancelButton: true,         // Botón "No"
                                                      confirmButtonText: 'Sí',        // Botón "Sí"
                                                      cancelButtonText: 'No',
                                                      reverseButtons: true
                                                    });
                                                    if (result.isConfirmed) {try{
                                                      const turno = cell;
                                        await EliminarTurno(turno.idTurno);
                                        cargarDatos();
                                        Swal.fire({
                                                      icon: "success",
                                                      title: "Turno eliminado",
                                                      timer: 1500,
                                                      showConfirmButton: false
                                                    });}catch(err){Swal.fire({
                                                      icon: "error",
                                                      title: "Error al eliminar el turno",
                                                      timer: 1500,
                                                      showConfirmButton: false
                                                    });}
                                                      
                                                    }
                                      }
                                      if (mostrarTabla === 'unidades' ) {
                                        const result = await Swal.fire({
                                                      icon: 'question',
                                                      title: '¿Seguro que quieres eliminar esta unidad?',
                                                      showCancelButton: true,         // Botón "No"
                                                      confirmButtonText: 'Sí',        // Botón "Sí"
                                                      cancelButtonText: 'No',
                                                      reverseButtons: true
                                                    });
                                                    if (result.isConfirmed) {try{
                                                      const unidad = cell;
                                                      await EliminarUnidad(unidad.idUnidad);
                                                      cargarDatos();
                                                      Swal.fire({
                                                      icon: "success",
                                                      title: "Unidad eliminada",
                                                      timer: 1500,
                                                      showConfirmButton: false
                                                    });
                                                    }catch(err){Swal.fire({
                                                      icon: "error",
                                                      title: "Error al eliminar la unidad",
                                                      timer: 1500,
                                                      showConfirmButton: false
                                                    });}
                                        
                                                    }
                                      }
                                    }}
                                    aria-label="Eliminar"
                                    title="Eliminar" className="text-red-600 hover:text-red-800">
                                    {/* Ícono eliminar */}
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 24 24"
                                      className="w-6 h-6 cursor-pointer"
                                      style={{ color: "#C14600" }}
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

                            if (esUltima && mostrarTabla === 'viajes') {
                              const viaje = cell;
                              return (
                                <td key={i} className="px-4 py-2 text-right">
                                  {/* Botón Editar */}
                                  <button
                                    aria-label="Editar viaje"
                                    title="Editar"
                                    className="inline-flex items-center justify-center px-3 py-1.5 text-sm rounded-md text-[#C14600] hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-1"
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
                                      const result = await Swal.fire({
                                                    icon: 'question',
                                                    title: '¿Seguro que quieres eliminar el viaje?',
                                                    showCancelButton: true,         // Botón "No"
                                                    confirmButtonText: 'Sí',        // Botón "Sí"
                                                    cancelButtonText: 'No',
                                                    reverseButtons: true
                                                  });
                                      if (result.isConfirmed) {try{
                                        const viaje = cell;
                                        await EliminarViaje(viaje.idViaje);
                                        cargarDatos();
                                        Swal.fire({
                                                      icon: "success",
                                                      title: "Viaje eliminado",
                                                      timer: 1500,
                                                      showConfirmButton: false
                                                    });

                                      }catch (err) {Swal.fire({
                                                      icon: "error",
                                                      title: "Error al eliminar el viaje",
                                                      timer: 1500,
                                                      showConfirmButton: false
                                                    });
                                                    return;}
                                        
                                      }
                                    }}
                                    aria-label="Eliminar viaje"
                                    title="Eliminar"
                                    className="inline-flex items-center justify-center px-3 py-1.5 text-sm rounded-md text-[#C14600] hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-1"
                                  >
                                    {/* basura icono */}
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

                            // celdas normales
                            return (
                              <td key={i} className="px-4 py-2 text-left text-gray-800">
                                {cell}
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




        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 w-full">

      {/*Encabezado*/}
      <div>
        <h1 className="text-2xl font-bold text-orange-800">Ajustes del sistema</h1>
        <p className="text-gray-600">Bienvenido, {nombreCuenta}</p>
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sección Registrar Turno */}
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

        {/* Sección Registrar Unidad */}
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

            <div className="flex gap-4 justify-center mt-">
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
        <section className="bg-[#fff7ec] p-6 rounded-lg shadow-md w-full">
          <h2 className="text-orange-700 font-bold text-lg mb-4">Registrar viaje</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-orange-700 font-semibold mb-1">Origen</label>
              <select
                value={viajeForm.origen}
                onChange={(e) => {
                  const origenSeleccionado = e.target.value;
                  const destinoAutomatico =
                    origenSeleccionado === 'Tuxtla' ? 'Yajalon' : 'Tuxtla';
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
                value={viajeForm.fechaSalida}
                onChange={(e) => {
                  let valor = e.target.value;
                  // Si no tiene segundos, se los agregamos
                  if (valor && valor.length === 16) { // formato YYYY-MM-DDTHH:mm → 16 caracteres
                    valor = valor + ":00";
                  }
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


        {/* Tabla */}
        <TablaDatos />
      </div>
    </div>

  );
}