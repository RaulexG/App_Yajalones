import { useEffect, useMemo, useState } from "react";
import {
  ListarViajes,
  ListarPaquetes,
  crearPaquete,
  actualizarPaquete,
  eliminarPaquete,
  paquetePendiente,
  obtenerPaquetesPendientes,
  asignarPaqueteAViaje,
  ponerPaqueteComoPendiente,
} from "../../services/Admin/adminService";
import Swal from "sweetalert2";

export default function Paqueteria() {
  const [viajes, setViajes] = useState([]);
  const [paquetes, setPaquetes] = useState([]);
  const [pendientes, setPendientes] = useState([]);

  const [formulario, setFormulario] = useState({
    remitente: "",
    destinatario: "",
    importe: 70,
    contenido: "",
    pendiente: false,
    porCobrar: false,
    idViaje: "",
  });

  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [modalAsignar, setModalAsignar] = useState(false);
  const [paqueteAsignando, setPaqueteAsignando] = useState(null);
  const [viajeSeleccionado, setViajeSeleccionado] = useState("");

  // Filtros generales
  const [filtroFecha, setFiltroFecha] = useState("HOY"); // HOY | TODOS
  const [filtroIdViaje, setFiltroIdViaje] = useState("");

  // Filtro del SELECT del modal "Asignar viaje"
  const [modalFiltroFecha, setModalFiltroFecha] = useState("HOY"); // HOY | TODOS

  useEffect(() => {
    cargarViajes();
    cargarPaquetes();
  }, []);

  const cargarViajes = async () => {
    const response = await ListarViajes();
    setViajes(Array.isArray(response) ? response : []);
  };

  const cargarPaquetes = async () => {
    const response = await ListarPaquetes();
    setPaquetes(Array.isArray(response) ? response : []);
  };

  const cargarPendientes = async () => {
    const response = await obtenerPaquetesPendientes();
    setPendientes(Array.isArray(response) ? response : []);
    setMostrarModal(true);
  };

  // ---- helpers de fecha / viaje ----
  const esMismoDia = (d1, d2) => {
    const a = new Date(d1),
      b = new Date(d2);
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  };

  const obtenerViajeDePaquete = (paquete) => {
    for (const viaje of viajes) {
      if (viaje.paquetes?.some((p) => p.folio === paquete.folio)) {
        return viaje;
      }
    }
    return null;
  };

  const obtenerNombreUnidad = (paquete) => {
    const v = obtenerViajeDePaquete(paquete);
    return v?.unidad?.nombre || "Unidad no encontrada";
  };

  const obtenerDestino = (paquete) => {
    const v = obtenerViajeDePaquete(paquete);
    return v?.destino || "Destino no encontrado";
  };

  const obtenerFechaSalida = (paquete) => {
    const v = obtenerViajeDePaquete(paquete);
    return v?.fechaSalida
      ? new Date(v.fechaSalida).toLocaleDateString("es-MX")
      : "-";
  };

  // ---- viajes filtrados (para el SELECT del formulario) ----
  const viajesFiltrados = useMemo(() => {
    const hoy = new Date();
    const arr = (viajes || []).filter((v) =>
      filtroFecha === "HOY" ? esMismoDia(v.fechaSalida, hoy) : true
    );
    arr.sort(
      (a, b) =>
        new Date(a.fechaSalida).getTime() - new Date(b.fechaSalida).getTime()
    );
    return arr;
  }, [viajes, filtroFecha]);

  // ---- viajes filtrados (para el SELECT del modal asignar) ----
  const viajesFiltradosModal = useMemo(() => {
    const hoy = new Date();
    const arr = (viajes || []).filter((v) =>
      modalFiltroFecha === "HOY" ? esMismoDia(v.fechaSalida, hoy) : true
    );
    arr.sort(
      (a, b) =>
        new Date(a.fechaSalida).getTime() - new Date(b.fechaSalida).getTime()
    );
    return arr;
  }, [viajes, modalFiltroFecha]);

  // ---- handlers ----
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormulario((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // sincroniza el filtro de tabla con el select de viaje del formulario
    if (name === "idViaje") setFiltroIdViaje(String(value || ""));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formulario.pendiente) {
      const dataPendiente = {
        remitente: formulario.remitente,
        destinatario: formulario.destinatario,
        importe: parseFloat(formulario.importe),
        contenido: formulario.contenido,
        porCobrar: formulario.porCobrar,
        idViaje: formulario.idViaje ? parseInt(formulario.idViaje) : null,
      };

      if (modoEdicion && idEditando) {
        await ponerPaqueteComoPendiente(idEditando, dataPendiente.idViaje);
      } else {
        await paquetePendiente(dataPendiente);
      }

      await cargarPendientes();
    } else {
      if (!formulario.idViaje)
        return Swal.fire({
          icon: "warning",
          title: "Llene los campos obligatorios",
          timer: 1500,
          showConfirmButton: false,
        });

      const data = {
        remitente: formulario.remitente,
        destinatario: formulario.destinatario,
        importe: parseFloat(formulario.importe),
        contenido: formulario.contenido,
        porCobrar: formulario.porCobrar,
        idViaje: parseInt(formulario.idViaje),
      };

      if (modoEdicion && idEditando) {
        await actualizarPaquete(idEditando, data);
      } else {
        await crearPaquete(data);
      }
    }

    // Resetear formulario
    setFormulario({
      remitente: "",
      destinatario: "",
      importe: 70,
      contenido: "",
      pendiente: false,
      porCobrar: false,
      idViaje: "",
    });
    setModoEdicion(false);
    setIdEditando(null);
    await Promise.all([cargarPaquetes(), cargarViajes()]);
  };

  const prepararEdicion = (paquete) => {
    // buscar idViaje del paquete en la lista de viajes
    let idViajeEncontrado = "";
    for (const viaje of viajes) {
      if (viaje.paquetes?.some((p) => p.folio === paquete.folio)) {
        idViajeEncontrado = viaje.idViaje;
        break;
      }
    }

    setFormulario({
      remitente: paquete.remitente,
      destinatario: paquete.destinatario,
      importe: paquete.importe,
      contenido: paquete.contenido,
      pendiente: paquete.pendiente || false,
      porCobrar: paquete.porCobrar || false,
      idViaje: idViajeEncontrado,
    });
    setModoEdicion(true);
    setIdEditando(paquete.idPaquete);
    setMostrarModal(false);
    setFiltroIdViaje(String(idViajeEncontrado || ""));
  };

  const eliminar = async (id) => {
    const result = await Swal.fire({
      icon: "question",
      title: "¿Seguro que quieres eliminar el paquete?",
      showCancelButton: true,
      confirmButtonText: "Sí",
      cancelButtonText: "No",
      reverseButtons: true,
    });
    if (result.isConfirmed) {
      await eliminarPaquete(id);
      await Promise.all([cargarPaquetes(), cargarViajes()]);
      Swal.fire({
        icon: "success",
        title: "Paquete eliminado",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  const confirmarAsignacion = async () => {
    if (!viajeSeleccionado)
      return Swal.fire({
        icon: "warning",
        title: "Llene los campos obligatorios",
        timer: 1500,
        showConfirmButton: false,
      });
    try {
      await asignarPaqueteAViaje(
        paqueteAsignando.idPaquete,
        parseInt(viajeSeleccionado)
      );

      // Quitar de pendientes inmediatamente
      setPendientes((prev) =>
        prev.filter((p) => p.idPaquete !== paqueteAsignando.idPaquete)
      );

      // Actualizar listas para que el paquete aparezca en la tabla SIN cambiar de sección
      await Promise.all([cargarPaquetes(), cargarViajes()]);

      setModalAsignar(false);
      setViajeSeleccionado("");
      setPaqueteAsignando(null);
    } catch (error) {
      console.error("Error asignando paquete:", error);
    }
  };

  // -------- impresión (HTML) ----------

function generarGuiaHTML(paquete, viaje) {
  return `
  <html>
  <head>
    <style>
      @page {
        size: auto;
        margin: 0; /* sin márgenes en la impresión */
      }
      body {
        margin: 0;
        padding: 0;
        width: 218px; /* ancho seguro para 58mm */
        font-family: monospace;
        font-size: 13px; /* base más grande */
        line-height: 1.5; /* más alto para alargar */
      }
      .ticket {
        width: 218px;
        margin: 0;
        padding: 0;
      }
      .center { text-align: center; }
      .bold { font-weight: bold; font-size: 15px; }
      .box {
        border: 1px dashed #000;
        margin: 14px 0;
        padding: 6px;
        font-size: 12px;
        text-align: center;
      }
      .firma {
        margin: 30px 0 14px 0;
        text-align: center;
      }
      .firma-line {
        border-top: 1px solid #000;
        width: 180px;
        margin: 0 auto 4px auto;
      }
      .firma-text {
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div class="ticket">
      <div class="center bold">
        Unión de Transportistas<br>
        Los Yajalones S.C. de R.L. de C.V.
      </div>
      <div class="center" style="font-size:12px; margin-bottom:12px;">
        R.F.C. UTY-090617-ANA<br>
        2da. Calle Poniente Norte S/N<br>
        Centro, Yajalón, Chiapas
      </div>

      <div class="center" style="font-size:12px; margin-bottom:12px;">
        Terminal Tuxtla Gutiérrez<br>
        14 Norte No. 245, entre Central y 2a Oriente<br>
        Tel: 961 224 52 61 – C.P. 29000
      </div>

      <div style="font-size:13px; border-top:1px dashed #000; border-bottom:1px dashed #000; padding:8px 0; margin-bottom:12px;">
        Fecha/Hora: ${viaje?.fechaSalida ? new Date(viaje.fechaSalida).toLocaleDateString("es-MX") : ""}<br>
        Salida: ${viaje?.fechaSalida ? new Date(viaje.fechaSalida).toLocaleTimeString("es-MX", {hour:"2-digit", minute:"2-digit"}) : ""}<br>
        Guía/Folio: ${paquete?.folio ?? ""}<br>
        Unidad: ${viaje?.unidad?.nombre ?? ""}
      </div>

      <div style="font-size:13px; margin:10px 0;">
        Remitente: ${paquete?.remitente ?? ""}<br>
        Consignatario: ${paquete?.destinatario ?? ""}<br>
        Contenido: ${paquete?.contenido ?? ""}<br>
        Costo: $${Number(paquete?.importe ?? 0).toFixed(2)}
      </div>

      <div style="font-size:12px; margin-top:10px; text-align:justify;">
        La empresa no se responsabiliza por paquetería después de 72 horas.<br>
        Alimentos y perecederos viajan a cuenta y riesgo del interesado.<br>
        Paquetería no recogida después de tres días genera recargo por bodegaje.
      </div>

      <div class="box">
        Este boleto le da derecho al seguro del viajero.<br>
        Consérvelo para validación.
      </div>

      <div class="firma">
        <div class="firma-line"></div>
        <div class="firma-text">Firma de conformidad / recibido</div>
      </div>

      <div class="center" style="font-size:12px; margin-top:10px;">
        Fecha de venta: ${new Date().toLocaleDateString("es-MX")}
      </div>

      <!-- Espacio extra al final para alargar -->
      <div style="height:50px;"></div>
    </div>
  </body>
  </html>
  `;
}




  // ---------- UI ----------
  return (
    <div className="flex gap-6 p-6">
      {/* Formulario */}
      <form
        onSubmit={handleSubmit}
        className="w-1/3 bg-white p-5 rounded-lg shadow-md flex flex-col gap-3"
      >
        <label className="font-semibold text-orange-700">Remitente</label>
        <input
          type="text"
          name="remitente"
          value={formulario.remitente}
          onChange={handleChange}
          className="p-2 rounded-md bg-[#ffe0b2]"
          required
        />

        <label className="font-semibold text-orange-700">Destinatario</label>
        <input
          type="text"
          name="destinatario"
          value={formulario.destinatario}
          onChange={handleChange}
          className="p-2 rounded-md bg-[#ffe0b2]"
          required
        />

          {/* Viaje + filtro Hoy/Todos (responsivo, sin desbordes) */}
          <div className="w-full">
            <label className="block text-orange-700 font-semibold mb-1">Viaje</label>

            {/* 1 col en móviles, 2 cols desde sm; permite colapsar y no desbordar */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 sm:gap-3 items-stretch min-w-0">
              {/* SELECT */}
              <select
                name="idViaje"
                value={formulario.idViaje}
                onChange={handleChange}
                disabled={formulario.pendiente}
                required={!formulario.pendiente}
                className="w-full min-w-0 max-w-full p-2.5 rounded-md bg-orange-100 text-gray-800 ring-1 ring-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="" disabled>Seleccionar viaje</option>
                {viajesFiltrados.map((viaje) => (
                  <option key={viaje.idViaje} value={viaje.idViaje}>
                    {`${viaje.origen} → ${viaje.destino} | ${new Date(viaje.fechaSalida).toLocaleString("es-MX", {
                      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
                    })}`}
                  </option>
                ))}
              </select>

              {/* Segmentado: Hoy / Todos */}
              <div className="w-full sm:w-auto inline-flex rounded-md overflow-hidden ring-1 ring-orange-200 bg-[#ffe0b2]">
                {[
                  { key: "HOY", label: "Hoy" },
                  { key: "TODOS", label: "Todos" },
                ].map((opt, i) => (
                  <button
                    key={opt.key}
                    type="button"
                    aria-pressed={filtroFecha === opt.key}
                    onClick={() => {
                      setFiltroFecha(opt.key);
                      const existe = viajesFiltrados.some(
                        (v) => String(v.idViaje) === String(formulario.idViaje || "")
                      );
                      if (!existe) {
                        setFormulario((p) => ({ ...p, idViaje: "" }));
                        setFiltroIdViaje("");
                      }
                    }}
                    className={`px-3 py-2 text-sm font-medium transition
                      ${i > 0 ? "border-l border-orange-200" : ""}
                      ${filtroFecha === opt.key ? "bg-orange-600 text-white" : "bg-orange-100 text-orange-700 hover:bg-orange-200"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>


        <label className="font-semibold text-orange-700">Contenido</label>
        <textarea
          name="contenido"
          value={formulario.contenido}
          onChange={handleChange}
          className="p-2 rounded-md bg-[#ffe0b2]"
          required
        />

        <label className="font-semibold text-orange-700">Importe</label>
        <input
          type="number"
          name="importe"
          value={formulario.importe}
          onChange={handleChange}
          className="p-2 rounded-md bg-[#ffe0b2]"
          required
        />

        <div className="flex gap-4 text-orange-700">
          <label>
            <input
              type="checkbox"
              name="pendiente"
              checked={formulario.pendiente}
              onChange={handleChange}
              className="mr-2"
            />
            Pendiente
          </label>
          <label>
            <input
              type="checkbox"
              name="porCobrar"
              checked={formulario.porCobrar}
              onChange={handleChange}
              className="mr-2"
            />
            Por Cobrar
          </label>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-[#cc4500] text-white px-4 py-2 rounded-md w-1/2"
          >
            Guardar
          </button>
          <button
            type="button"
            onClick={cargarPendientes}
            className="bg-[#cc4500] text-white px-4 py-2 rounded-md w-1/2"
          >
            Paquetes pendientes
          </button>
        </div>
      </form>

      {/* Modal de pendientes */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[92vw] max-w-3xl max-h-[90vh] shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="text-xl font-bold text-orange-800">
                Paquetes pendientes
              </h2>
              <button
                onClick={() => setMostrarModal(false)}
                aria-label="Cerrar"
                className="p-2 rounded-md text-orange-700 hover:bg-orange-100"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                >
                  <path
                    fill="currentColor"
                    d="m12 13.4l-4.9 4.9q-.275.275-.7.275t-.7-.275t-.275-.7t.275-.7l4.9-4.9l-4.9-4.9q-.275-.275-.275-.7t.275-.7t.7-.275t.7.275l4.9 4.9l4.9-4.9q.275-.275.7-.275t.7.275t.275.7t-.275.7L13.4 12l4.9 4.9q.275.275.275.7t-.275.7t-.7.275t-.7-.275z"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="overflow-hidden rounded-xl ring-1 ring-orange-200">
                <table className="w-full table-auto border-collapse">
                  <thead className="sticky top-0 bg-orange-100 text-orange-900">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold ">Folio</th>
                      <th className="px-4 py-3 text-left font-semibold">Remitente</th>
                      <th className="px-4 py-3 text-left font-semibold">Contenido</th>
                      <th className="px-4 py-3 text-center font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-100">
                    {pendientes.map((paquete) => (
                      <tr
                        key={paquete.idPaquete}
                        className="odd:bg-white even:bg-orange-50/40 hover:bg-orange-100 transition-colors"
                      >
                        <td className="px-4 py-2">{paquete.folio}</td>
                        <td className="px-4 py-2">{paquete.remitente}</td>
                        <td className="px-4 py-2">{paquete.contenido}</td>
                        <td className="px-4 py-2 text-center">
                          <button
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-white bg-[#cc4500] hover:bg-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-1"
                            onClick={() => {
                              setPaqueteAsignando(paquete);
                              setModalAsignar(true);
                              cargarPaquetes();
                            }}
                          >
                            Asignar viaje
                          </button>
                        </td>
                      </tr>
                    ))}
                    {pendientes.length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center py-4 text-gray-500">
                          No hay paquetes pendientes.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal asignar (con HOY/TODOS) */}
      {modalAsignar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[92vw] max-w-lg shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="text-xl font-bold text-orange-800">
                Asignar viaje a paquete
              </h2>
              <button
                onClick={() => {
                  setModalAsignar(false);
                  cargarPaquetes();
                }}
                aria-label="Cerrar"
                className="p-2 rounded-md text-orange-700 hover:bg-transparent focus:outline-none focus:ring-0"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                >
                  <path
                    fill="currentColor"
                    d="m12 13.4l-4.9 4.9q-.275.275-.7.275t-.7-.275t-.275-.7t.275-.7l4.9-4.9l-4.9-4.9q-.275-.275-.275-.7t.275-.7t.7-.275t.7.275l4.9 4.9l4.9-4.9q.275-.275.7-.275t.7.275t.275.7t-.275.7L13.4 12l4.9 4.9q.275.275.275.7t-.275.7t-.7.275t-.7-.275z"
                  />
                </svg>
              </button>
            </div>

            <div className="px-6 pb-6">
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-semibold text-orange-700">Folio:</span>{" "}
                  {paqueteAsignando?.folio}
                </p>
                <p>
                  <span className="font-semibold text-orange-700">Remitente:</span>{" "}
                  {paqueteAsignando?.remitente}
                </p>
              </div>

              <label className="block mt-4 mb-1 font-medium text-orange-700">
                Seleccione un viaje
              </label>

              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <select
                    value={viajeSeleccionado}
                    onChange={(e) => setViajeSeleccionado(e.target.value)}
                    className="w-full appearance-none p-2.5 pr-10 rounded-md bg-[#ffe0b2] outline-none ring-1 ring-orange-200 focus:ring-2 focus:ring-orange-300"
                  >
                    <option value="" disabled>
                      Seleccione viaje
                    </option>
                    {viajesFiltradosModal.map((viaje) => (
                      <option key={viaje.idViaje} value={viaje.idViaje}>
                        {`${viaje.origen} → ${viaje.destino} | ${new Date(
                          viaje.fechaSalida
                        ).toLocaleString("es-MX", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`}
                      </option>
                    ))}
                  </select>

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-700"
                  >
                    <path fill="currentColor" d="M7 10l5 5 5-5z" />
                  </svg>
                </div>

                {/* Segmentado HOY/TODOS del modal (suave) */}
                <div className="shrink-0 inline-flex rounded-md overflow-hidden ring-1 ring-orange-200 bg-[#ffe0b2]">
                  {[
                    { key: "HOY", label: "Hoy" },
                    { key: "TODOS", label: "Todos" },
                  ].map((opt, i) => (
                    <button
                      key={opt.key}
                      type="button"
                      aria-pressed={modalFiltroFecha === opt.key}
                      onClick={() => setModalFiltroFecha(opt.key)}
                      className={`px-3 py-2 text-sm font-medium text-[#452B1C] transition
                        ${i > 0 ? "border-l border-orange-200" : ""}
                        ${
                          modalFiltroFecha === opt.key
                          ? "bg-orange-600 text-white"
                          : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                      } ${i === 0 ? "border-r border-orange-200" : ""}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setModalAsignar(false);
                    cargarPaquetes();
                  }}
                  className="px-4 py-2 rounded-md text-orange-800 bg-orange-100 hover:bg-orange-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarAsignacion}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-white bg-[#cc4500] hover:bg-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-1"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabla paquetes */}
      <div className="w-2/3 bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-end gap-3 mb-3">
          <h3 className="text-lg font-bold text-orange-700">Paquetes</h3>
        </div>

        <div className="relative overflow-y-auto max-h-[500px]">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-[#f8c98e]">
              <tr className="bg-[#f8c98e]">
                <th className="p-2 text-center text-[#452B1C]">Folio</th>
                <th className="p-2 text-center text-[#452B1C]">Unidad</th>
                <th className="p-2 text-center text-[#452B1C]">Remitente</th>
                <th className="p-2 text-center text-[#452B1C]">Destinatario</th>
                <th className="p-2 text-center text-[#452B1C]">Destino</th>
                <th className="p-2 text-center text-[#452B1C]">Por Cobrar</th>
                <th className="p-2 text-center text-[#452B1C]">Fecha de salida</th>
                <th className="p-2 text-center text-[#452B1C]">Importe</th>
                <th className="p-2 text-center"></th>
              </tr>
            </thead>
            <tbody>
              {paquetes
                .filter((p) => {
                  const v = obtenerViajeDePaquete(p);
                  if (!v) return false;

                  // filtro de fecha (HOY/TODOS)
                  if (filtroFecha === "HOY" && !esMismoDia(v.fechaSalida, new Date())) {
                    return false;
                  }

                  // filtro por viaje específico (si se eligió en el formulario)
                  if (filtroIdViaje && String(v.idViaje) !== String(filtroIdViaje)) {
                    return false;
                  }

                  return true;
                })
                .map((p, i) => (
                  <tr key={p.folio} className={i % 2 === 0 ? "bg-[#fffaf3]" : ""}>
                    <td className="p-2 text-center">{p.folio}</td>
                    <td className="p-2 text-center">{obtenerNombreUnidad(p)}</td>
                    <td className="p-2 text-center">{p.remitente}</td>
                    <td className="p-2 text-center">{p.destinatario}</td>
                    <td className="p-2 text-center">{obtenerDestino(p)}</td>
                    <td className="p-2 text-center">{p.porCobrar ? "Sí" : "No"}</td>
                    <td className="p-2 text-center">{obtenerFechaSalida(p)}</td>
                    <td className="p-2 text-center">
                      ${Number(p.importe || 0).toFixed(2)}
                    </td>
                    <td className="p-2 text-center flex gap-2 justify-center">
                      {/* Ticket */}
                      <button
                        onClick={async () => {
                          try {
                            const v = obtenerViajeDePaquete(p);
                            if (!window?.electronAPI?.imprimirHTML) {
                              Swal.fire({
                                icon: "error",
                                title: "Impresión no disponible",
                                text: "No se encontró el método imprimirHTML.",
                              });
                              return;
                            }
                            const html = generarGuiaHTML(p, v);
                            await window.electronAPI.imprimirHTML({ html, copies: 2 });
                            
                            Swal.fire({
                              icon: "success",
                              title: "Guía impresa",
                              timer: 1500,
                              showConfirmButton: false,
                            });
                          } catch (err) {
                            Swal.fire({
                              icon: "error",
                              title: "Error al imprimir",
                              text: err?.message || "Intenta de nuevo",
                              timer: 1500,
                              showConfirmButton: false,
                            });
                          }
                        }}
                        className="p-2 rounded-md hover:bg-orange-100 text-[#C14600]"
                        aria-label="Imprimir ticket"
                        title="Imprimir ticket"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M18.353 14H19c.943 0 1.414 0 1.707-.293S21 12.943 21 12v-1c0-1.886 0-2.828-.586-3.414S18.886 7 17 7H7c-1.886 0-2.828 0-3.414.586S3 9.114 3 11v2c0 .471 0 .707.146.854C3.293 14 3.53 14 4 14h1.647" />
                          <path d="M6 20.306V12c0-.943 0-1.414.293-1.707S7.057 10 8 10h8c.943 0 1.414 0 1.707.293S18 11.057 18 12v8.306c0 .317 0 .475-.104.55s-.254.025-.554-.075l-2.184-.728c-.078-.026-.117-.04-.158-.04s-.08.014-.158.04l-2.684.894c-.078.026-.117.04-.158.04s-.08-.014-.158-.04l-2.684-.894c-.078-.026-.117-.04-.158-.04s-.08.014-.158.04l-2.184.728c-.3.1-.45.15-.554.075S6 20.623 6 20.306ZM18 7V5.88c0-1.008 0-1.512-.196-1.897a1.8 1.8 0 0 0-.787-.787C16.632 3 16.128 3 15.12 3H8.88c-1.008 0-1.512 0-1.897.196a1.8 1.8 0 0 0-.787.787C6 4.368 6 4.872 6 5.88V7" />
                          <path d="M10 14h3m-3 3h4.5" strokeLinecap="round" />
                        </svg>
                      </button>

                      {/* Editar */}
                      <button
                        onClick={() => prepararEdicion(p)}
                        aria-label="Editar"
                        title="Editar"
                        className="p-2 rounded-md hover:bg-orange-100 text-[#C14600]"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 512 512"
                          className="w-5 h-5"
                        >
                          <path
                            fill="currentColor"
                            d="M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1L377.9 88L407 58.9c9.4-9.4 24.6-9.4 33.9 0zM209.8 256.2L344 121.9l46.1 46.1l-134.3 134.2c-2.9 2.9-6.5 5-10.4 6.1L186.9 325l16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6 100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487 138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25c-28.1-28.1-73.7-28.1-101.8 0M88 64c-48.6 0-88 39.4-88 88v272c0 48.6 39.4 88 88 88h272c48.6 0 88-39.4 88-88V312c0-13.3-10.7-24-24-24s-24 10.7-24 24v112c0 22.1-17.9 40-40 40H88c-22.1 0-40-17.9-40-40V152c0-22.1 17.9-40 40-40h112c13.3 0 24-10.7 24-24s-10.7-24-24-24z"
                          />
                        </svg>
                      </button>

                      {/* Eliminar */}
                      <button
                        onClick={() => eliminar(p.idPaquete)}
                        aria-label="Eliminar"
                        title="Eliminar"
                        className="p-2 rounded-md hover:bg-red-50 text-red-600"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          className="w-5 h-5"
                        >
                          <path
                            fill="currentColor"
                            d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6z"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              {paquetes.length === 0 && (
                <tr>
                  <td colSpan="9" className="text-center py-4 text-gray-500">
                    No hay paquetes registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
