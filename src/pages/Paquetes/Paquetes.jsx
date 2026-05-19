import { useEffect, useMemo, useState, useCallback } from "react";
import {
  ListarViajes,
  ListarPaquetes,
  crearPaquete,
  actualizarPaquete,
  eliminarPaquete,
  asignarPaqueteAViaje,
} from "../../services/Admin/adminService";
import Swal from "sweetalert2";
import { useTerminal } from "../../hooks/useTerminal";

// Helper optimizado fuera del componente para evitar recrearlo
const esMismoDia = (d1, d2) => {
  const a = new Date(d1), b = new Date(d2);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
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

export default function Paqueteria() {
  const [viajes, setViajes] = useState([]);
  const [paquetes, setPaquetes] = useState([]);
  const terminal = useTerminal();
  const esTuxtla = terminal === "TUXTLA";

  const [formulario, setFormulario] = useState({
    remitente: "",
    destinatario: "",
    importe: "",
    contenido: "",
    porCobrar: "",
    idViaje: "",
    destino: "", 
    metodoPago: "EFECTIVO"
  });

  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [modalAsignar, setModalAsignar] = useState(false);
  const [paqueteAsignando, setPaqueteAsignando] = useState(null);
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);
  const [viajeSeleccionadoId, setViajeSeleccionadoId] = useState("");
  const [viajeAsignacionSeleccionado, setViajeAsignacionSeleccionado] = useState("");
  const [isGuardando, setIsGuardando] = useState(false);

  // Filtros generales
  const [filtroFecha, setFiltroFecha] = useState("HOY");
  const [filtroIdViaje, setFiltroIdViaje] = useState("");
  const [modalFiltroFecha, setModalFiltroFecha] = useState("HOY");

  // Envoltura de peticiones en useCallback
  const cargarViajes = useCallback(async () => {
    const response = await ListarViajes();
    setViajes(Array.isArray(response) ? response : []);
  }, []);

  const cargarPaquetes = useCallback(async () => {
    const response = await ListarPaquetes();
    setPaquetes(Array.isArray(response) ? response : []);
  }, []);

  useEffect(() => {
    cargarViajes();
    cargarPaquetes();
  }, [cargarViajes, cargarPaquetes]);

  // Mapa indexado O(1) por idViaje para búsquedas instantáneas de viajes
  const mapaViajesPorId = useMemo(() => {
    const mapa = new Map();
    for (const viaje of viajes) {
      mapa.set(String(viaje.idViaje), viaje);
    }
    return mapa;
  }, [viajes]);

  // Mapa de paquete a viaje cuando el paquete está presente dentro de viajes[].paquetes
  const mapaViajesPorPaquete = useMemo(() => {
    const mapa = new Map();
    for (const viaje of viajes) {
      if (!Array.isArray(viaje.paquetes)) continue;
      for (const paquete of viaje.paquetes) {
        if (paquete?.idPaquete != null) {
          mapa.set(paquete.idPaquete, viaje);
        }
      }
    }
    return mapa;
  }, [viajes]);

  // Filtro de viajes optimizado (solo recalcula si cambia 'viajes' o 'filtroFecha')
  const viajesFiltrados = useMemo(() => {
    const hoy0 = startOfToday();
    const ayer0 = startOfYesterday();

    return (viajes || [])
      .filter((v) => {
        const f = new Date(v.fechaSalida);
        if (Number.isNaN(f.getTime())) return false;
        return filtroFecha === "HOY" ? esMismoDia(f, hoy0) : f >= ayer0;
      })
      .sort((a, b) => new Date(a.fechaSalida).getTime() - new Date(b.fechaSalida).getTime());
  }, [viajes, filtroFecha]);

  const viajesFiltradosModal = useMemo(() => {
    const hoy0 = startOfToday();
    const ayer0 = startOfYesterday();

    return (viajes || [])
      .filter((v) => {
        const f = new Date(v.fechaSalida);
        if (Number.isNaN(f.getTime())) return false;
        return modalFiltroFecha === "HOY" ? esMismoDia(f, hoy0) : f >= ayer0;
      })
      .sort((a, b) => new Date(a.fechaSalida).getTime() - new Date(b.fechaSalida).getTime());
  }, [viajes, modalFiltroFecha]);

  const viajeFormulario = useMemo(() => {
    if (!formulario.idViaje) return null;
    return viajes.find((v) => String(v.idViaje) === String(formulario.idViaje)) || null;
  }, [viajes, formulario.idViaje]);

  useEffect(() => {
    const viajeId = String(formulario.idViaje || "");
    if (!viajeId) {
      setViajeSeleccionado(null);
      setViajeSeleccionadoId("");
      setFiltroIdViaje("");
      return;
    }

    const viajeSel = viajes.find((v) => String(v.idViaje) === viajeId) || null;
    setViajeSeleccionado(viajeSel);
    setViajeSeleccionadoId(viajeId);
    setFiltroIdViaje(viajeId);
  }, [formulario.idViaje, viajes]);

  const obtenerIdViajePaquete = (paquete) => {
    if (paquete?.idViaje != null) return String(paquete.idViaje);
    if (paquete?.viaje?.idViaje != null) return String(paquete.viaje.idViaje);
    if (paquete?.viaje?.id != null) return String(paquete.viaje.id);
    if (paquete?.viajeId != null) return String(paquete.viajeId);
    if (paquete?.viaje_id != null) return String(paquete.viaje_id);
    return "";
  };

  const obtenerIdPaquete = (paquete) => {
    if (paquete?.idPaquete != null) return String(paquete.idPaquete);
    if (paquete?.id != null) return String(paquete.id);
    if (paquete?.folio != null) return String(paquete.folio);
    return null;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nuevoValor = type === "checkbox" ? checked : value;

    setFormulario((prev) => (prev[name] === nuevoValor ? prev : { ...prev, [name]: nuevoValor }));

    if (name === "idViaje") {
      const viajeSel = viajes.find((v) => String(v.idViaje) === String(value));
      const nuevoId = String(value || "");
      setFiltroIdViaje(nuevoId);
      setViajeSeleccionado(viajeSel || "");
      setViajeSeleccionadoId(nuevoId);
    }
  };

  const obtenerDestinoFinal = (form, listaViajes) => {
    if (form.destino && form.destino.trim() !== "") return form.destino;
    const viajeSel = listaViajes.find((v) => String(v.idViaje) === String(form.idViaje || ""));
    return viajeSel?.destino || null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isGuardando) return;
    setIsGuardando(true);
    try {
      if (!formulario.porCobrar) {
        return Swal.fire({ icon: "warning", title: "Llene los campos obligatorios", timer: 1500, showConfirmButton: false });
      }
      if (!formulario.idViaje) {
        return Swal.fire({ icon: "warning", title: "Seleccione un viaje", timer: 1500, showConfirmButton: false });
      }

      const destinoFinal = obtenerDestinoFinal(formulario, viajes);
      const data = {
        remitente: formulario.remitente.trim(),
        destinatario: formulario.destinatario.trim(),
        importe: Number(formulario.importe) || 0,
        contenido: formulario.contenido.trim(),
        porCobrar: formulario.porCobrar === "si",
        idViaje: formulario.idViaje ? parseInt(formulario.idViaje) : null,
        destino: destinoFinal,
        metodoPago: formulario.metodoPago,
      };

      const paqueteGuardado = modoEdicion && idEditando
        ? await actualizarPaquete(idEditando, data)
        : await crearPaquete(data);

      if (data.idViaje) {
        const nuevoId = String(data.idViaje);
        const viajeSel = viajes.find((v) => String(v.idViaje) === nuevoId);
        setFiltroIdViaje(nuevoId);
        setViajeSeleccionado(viajeSel || "");
        setViajeSeleccionadoId(nuevoId);
      }

      setFormulario((prev) => ({
        remitente: "",
        destinatario: "",
        importe: "",
        contenido: "",
        porCobrar: "",
        idViaje: prev.idViaje || data.idViaje || "",
        destino: prev.destino || destinoFinal || "",
        metodoPago: "EFECTIVO",
      }));
      setModoEdicion(false);
      setIdEditando(null);

      if (paqueteGuardado) {
        setPaquetes((prev) => {
          const idActual = paqueteGuardado.idPaquete || paqueteGuardado.id;
          if (!idActual) return prev;

          if (modoEdicion) {
            return prev.map((p) => (String(p.idPaquete || p.id) === String(idActual) ? { ...p, ...paqueteGuardado } : p));
          }

          return [...prev, paqueteGuardado];
        });
      }

      await cargarPaquetes();
      await cargarViajes();

      Swal.fire({
        icon: "success",
        title: modoEdicion ? "Paquete actualizado" : "Paquete registrado",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error guardando paquete:", error);
      Swal.fire({
        icon: "error",
        title: "Error al guardar",
        text: error?.response?.data?.message || error?.message || "Ocurrió un error inesperado",
      });
    } finally {
      setIsGuardando(false);
    }
  };

  const prepararEdicion = (paquete) => {
    const viaje = mapaViajesPorId.get(String(paquete.idViaje)) || mapaViajesPorPaquete.get(paquete.idPaquete) || paquete.viaje;
    const idViajeEncontrado = obtenerIdViajePaquete(paquete) || String(viaje?.idViaje || viaje?.id || "");

    setFormulario({
      remitente: paquete.remitente,
      destinatario: paquete.destinatario,
      importe: paquete.importe,
      contenido: paquete.contenido,
      porCobrar: paquete.porCobrar ? "si" : "no",
      idViaje: String(idViajeEncontrado || ""),
      destino: paquete.destino || viaje?.destino || "",
      metodoPago: paquete.metodoPago || "EFECTIVO",
    });
    setModoEdicion(true);
    setIdEditando(paquete.idPaquete);
    const nuevoId = String(idViajeEncontrado || "");
    setFiltroIdViaje(nuevoId);
    setViajeSeleccionado(viaje || "");
    setViajeSeleccionadoId(nuevoId);
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
      try {
        await eliminarPaquete(id);
        setPaquetes((prev) => prev.filter((p) => obtenerIdPaquete(p) !== String(id)));
        await cargarPaquetes();
        Swal.fire({ icon: "success", title: "Paquete eliminado", timer: 1500, showConfirmButton: false });
      } catch (error) {
        console.error("Error eliminando paquete:", error);
        Swal.fire({ icon: "error", title: "No se pudo eliminar el paquete", text: error?.message || "Intente de nuevo" });
      }
    }
  };

  const confirmarAsignacion = async () => {
    if (!viajeAsignacionSeleccionado) {
      return Swal.fire({ icon: "warning", title: "Llene los campos obligatorios", timer: 1500, showConfirmButton: false });
    }
    try {
      await asignarPaqueteAViaje(paqueteAsignando.idPaquete, parseInt(viajeAsignacionSeleccionado));
      await cargarPaquetes();
      setModalAsignar(false);
      setViajeAsignacionSeleccionado("");
      setPaqueteAsignando(null);
    } catch (error) {
      console.error("Error asignando paquete:", error);
    }
  };

  // ¡SÚPER OPTIMIZACIÓN AQUÍ!: Primero filtramos de forma eficiente y mapeamos sólo lo necesario
  const paquetesFiltrados = useMemo(() => {
    const viajeIdSeleccionado = String(formulario.idViaje || viajeSeleccionadoId || filtroIdViaje || "");
    if (!viajeIdSeleccionado) return [];

    return paquetes
      .map((p) => {
        const viaje = mapaViajesPorId.get(obtenerIdViajePaquete(p)) || mapaViajesPorPaquete.get(p.idPaquete) || p.viaje;
        const idViajePaquete = obtenerIdViajePaquete(p) || String(viaje?.idViaje || viaje?.id || "");
        return {
          ...p,
          viajeAsociado: viaje || null,
          idViajePaquete,
        };
      })
      .filter((p) => {
        if (p.pendiente) return false;
        return String(p.idViajePaquete) === viajeIdSeleccionado;
      })
      .map((p) => ({
        ...p,
        unidadNombre: p.viajeAsociado?.unidad?.nombre || "Unidad no encontrada",
        destinoViaje: p.viajeAsociado?.destino || "Destino no encontrado",
        fechaSalidaFormateada: p.viajeAsociado?.fechaSalida
          ? new Date(p.viajeAsociado.fechaSalida).toLocaleDateString("es-MX")
          : "-",
        viajeCompleto: p.viajeAsociado,
      }));
  }, [paquetes, filtroIdViaje, viajeSeleccionadoId, mapaViajesPorId, mapaViajesPorPaquete]);

  // Función de renderizado de HTML para guías de ticket
  function generarGuiaHTML(paquete, viaje, escala = 1, width = 58, margin = 0) {
    const destinoReal = paquete?.destino || viaje?.destino || "";
    return `
  <html>
  <head>
    <style>
      @page { size: auto; margin: 0; }
      body { margin: ${margin}mm; padding: 0; width: ${width}mm; font-family: monospace; font-size: 3.2mm; line-height: 1.4; }
      .ticket { width: ${width}mm; margin: ${margin}mm; padding: 0; transform: scale(${escala}); transform-origin: top left; }
      .center { text-align: center; }
      .bold { font-weight: bold; font-size: 4mm; }
      .firma { margin: 60px 0 30px 0; text-align: center; }
      .firma-line { border-top: 2px solid #000; width: 56mm; margin: 0 auto 8px auto; }
      .firma-text { font-size: 3.2mm; }
    </style>
  </head>
  <body>
    <div class="ticket">
      <div class="center bold">Unión de Transportistas<br>Los Yajalones S.C. de R.L. de C.V.</div>
      <div class="center" style="font-size:3.2mm; margin-bottom:2.7mm;">R.F.C. UTY-090617-ANA<br>2da. Calle Poniente Norte S/N<br>Centro, Yajalón, Chiapas<br>Tel: 919 67 4 2114</div>
      <div class="center" style="font-size:3.2mm; margin-bottom:2.7mm;">Terminal Tuxtla Gutiérrez<br>15 Oriente sur #752 entre 6ta y 7ma sur<br>Tel: 961 106 6523</div>
      <div style="font-size:3.2mm; border-top:2px dashed #000; border-bottom:2px dashed #000; padding:16px 0; margin-bottom:2.7mm;">
        Fecha/Hora: ${viaje?.fechaSalida ? new Date(viaje.fechaSalida).toLocaleDateString("es-MX") : ""}<br>
        Salida: ${viaje?.fechaSalida ? new Date(viaje.fechaSalida).toLocaleTimeString("es-MX", {hour:"2-digit", minute:"2-digit"}) : ""}<br>
        Guía/Folio: ${paquete?.folio ?? ""}<br>
        Unidad: ${viaje?.unidad?.nombre ?? ""}
      </div>
      <div style="font-size:3.2mm; margin:2.7mm 0;">
        Remitente: ${paquete?.remitente ?? ""}<br>
        Consignatario: ${paquete?.destinatario ?? ""}<br>
        Destino: ${destinoReal}<br>
        Contenido: ${paquete?.contenido ?? ""}<br>
        Costo: $${Number(paquete?.importe ?? 0).toFixed(2)}<br>
        Status: ${paquete?.porCobrar ? "Por cobrar" : "Pagado"}<br>
        Forma de pago: ${paquete?.metodoPago ?? "EFECTIVO"}
      </div>
      <div class="firma">
        <div class="firma-line"></div>
        <div class="firma-text">Firma de conformidad / recibido</div>
      </div>
    </div>
  </body>
  </html>`;
  }

  return (
    <div className="flex gap-6 p-6">
      {/* Formulario */}
      <form onSubmit={handleSubmit} className="w-1/3 bg-white p-5 rounded-lg shadow-md flex flex-col gap-3">
        <label className="font-semibold text-orange-700">Remitente</label>
        <input type="text" name="remitente" value={formulario.remitente} onChange={handleChange} className="p-2 rounded-md bg-[#ffe0b2]" required />

        <label className="font-semibold text-orange-700">Destinatario</label>
        <input type="text" name="destinatario" value={formulario.destinatario} onChange={handleChange} className="p-2 rounded-md bg-[#ffe0b2]" required />

        <div className="w-full">
          <label className="block text-orange-700 font-semibold mb-1">Viaje</label>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 sm:gap-3 items-stretch min-w-0">
            <select
              name="idViaje"
              value={formulario.idViaje}
              onChange={handleChange}
              required
              className="w-full min-w-0 max-w-full p-2.5 rounded-md bg-orange-100 text-gray-800 ring-1 ring-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="" disabled>Seleccionar viaje</option>
              {viajesFiltrados.map((viaje) => (
                <option key={viaje.idViaje} value={viaje.idViaje}>
                  {`${viaje.origen} → ${viaje.destino} | ${new Date(viaje.fechaSalida).toLocaleString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}`}
                </option>
              ))}
            </select>

            <div className="w-full sm:w-auto inline-flex rounded-md overflow-hidden ring-1 ring-orange-200 bg-[#ffe0b2]">
              {[{ key: "HOY", label: "Hoy" }, { key: "TODOS", label: "Todos" }].map((opt, i) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setFiltroFecha(opt.key);
                    const existe = viajesFiltrados.some((v) => String(v.idViaje) === String(formulario.idViaje || ""));
                    if (!existe) {
                      setFormulario((p) => ({ ...p, idViaje: "", destino: "" }));
                      setFiltroIdViaje("");
                    }
                  }}
                  className={`px-3 py-2 text-sm font-medium transition ${i > 0 ? "border-l border-orange-200" : ""} ${filtroFecha === opt.key ? "bg-orange-600 text-white" : "bg-orange-100 text-orange-700 hover:bg-orange-200"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <label className="font-semibold text-orange-700">Destino del paquete</label>
        <select name="destino" value={formulario.destino} onChange={handleChange} className="p-2 rounded-md bg-[#ffe0b2]">
          <option value="">{viajeFormulario ? `Mismo destino del viaje (${viajeFormulario.destino})` : "Mismo destino del viaje"}</option>
          <option value="San Cristóbal">San Cristóbal</option>
        </select>

        <label className="font-semibold text-orange-700">Contenido</label>
        <textarea name="contenido" value={formulario.contenido} onChange={handleChange} className="p-2 rounded-md bg-[#ffe0b2]" required />

        <label className="font-semibold text-orange-700">Importe</label>
        <input type="number" name="importe" value={formulario.importe} onChange={handleChange} className="p-2 rounded-md bg-[#ffe0b2]" required />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2.5">
          <div>
            <label className="block text-orange-700 font-semibold mb-1">Por Cobrar</label>
            <select name="porCobrar" value={formulario.porCobrar} onChange={handleChange} className="w-full p-2 rounded-md bg-[#ffe0b2]" required>
              <option value="">Seleccione...</option>
              <option value="si">Sí</option>
              <option value="no">No</option>
            </select>
          </div>
          <div>
            <label className="block text-orange-700 font-semibold mb-1">MetodoPago</label>
            <select name="metodoPago" value={formulario.metodoPago} onChange={handleChange} className="w-full p-2 rounded-md bg-[#ffe0b2]" required>
              <option value="EFECTIVO">Efectivo</option>
              <option value="TARJETA">Tarjeta</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          disabled={isGuardando}
          className={`bg-[#cc4500] text-white px-4 py-2 rounded-md w-full mt-2 transition ${isGuardando ? "opacity-70 cursor-not-allowed" : "hover:bg-[#b63b00]"}`}
        >
          {isGuardando ? (
            <span className="inline-flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
                <path d="M22 12a10 10 0 0 1-10 10" />
              </svg>
              Guardando...
            </span>
          ) : (
            "Guardar"
          )}
        </button>
      </form>

      {/* Modal Asignar */}
      {modalAsignar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[92vw] max-w-lg shadow-xl p-6">
            <h2 className="text-xl font-bold text-orange-800 mb-4">Asignar viaje a paquete</h2>
            <div className="space-y-1 text-sm mb-4">
              <p><span className="font-semibold text-orange-700">Folio:</span> {paqueteAsignando?.folio}</p>
              <p><span className="font-semibold text-orange-700">Remitente:</span> {paqueteAsignando?.remitente}</p>
            </div>
            <select value={viajeAsignacionSeleccionado} onChange={(e) => setViajeAsignacionSeleccionado(e.target.value)} className="w-full p-2.5 rounded-md bg-[#ffe0b2] mb-4 outline-none">
              <option value="" disabled>Seleccione viaje</option>
              {viajesFiltradosModal.map((viaje) => (
                <option key={viaje.idViaje} value={viaje.idViaje}>
                  {`${viaje.origen} → ${viaje.destino} | ${new Date(viaje.fechaSalida).toLocaleString("es-MX")}`}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-3">
              <button onClick={() => setModalAsignar(false)} className="px-4 py-2 rounded-md text-orange-800 bg-orange-100">Cancelar</button>
              <button onClick={confirmarAsignacion} className="px-4 py-2 rounded-md text-white bg-[#cc4500]">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="w-2/3 bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-bold text-orange-700 mb-3">Paquetes</h3>
        <div className="relative overflow-y-auto max-h-[500px]">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-[#f8c98e]">
              <tr>
                <th className="p-2 text-center text-[#452B1C]">Folio</th>
                <th className="p-2 text-center text-[#452B1C]">Unidad</th>
                <th className="p-2 text-center text-[#452B1C]">Remitente</th>
                <th className="p-2 text-center text-[#452B1C]">Destinatario</th>
                <th className="p-2 text-center text-[#452B1C]">Destino</th>
                <th className="p-2 text-center text-[#452B1C]">Por Cobrar</th>
                <th className="p-2 text-center text-[#452B1C]">Fecha salida</th>
                <th className="p-2 text-center text-[#452B1C]">Importe</th>
                <th className="p-2 text-center text-[#452B1C]">Método pago</th>
                <th className="p-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paquetesFiltrados.map((p, i) => (
                <tr key={obtenerIdPaquete(p) || p.folio} className={i % 2 === 0 ? "bg-[#fffaf3]" : ""}>
                  <td className="p-2 text-center">{p.folio}</td>
                  <td className="p-2 text-center">{p.unidadNombre}</td>
                  <td className="p-2 text-center">{p.remitente}</td>
                  <td className="p-2 text-center">{p.destinatario}</td>
                  <td className="p-2 text-center">{p.destino || p.destinoViaje}</td>
                  <td className="p-2 text-center">{p.porCobrar ? "Sí" : "No"}</td>
                  <td className="p-2 text-center">{p.fechaSalidaFormateada}</td>
                  <td className="p-2 text-center">${Number(p.importe || 0).toFixed(2)}</td>
                  <td className="p-2 text-center">{p.metodoPago}</td>
                  <td className="p-2 text-center flex gap-2 justify-center">
                    <button
                      onClick={async () => {
                        const v = p.viajeCompleto;
                        if (!window?.electronAPI?.imprimirHTML) return;
                        const escala = esTuxtla ? 0.85 : 1;
                        const width = esTuxtla ? 54 : 58;
                        const margin = esTuxtla ? 2.5 : 0;
                        const html = generarGuiaHTML(p, v, escala, width, margin);
                        await window.electronAPI.imprimirHTML({ html, copies: 2 });
                      }}
                      className="text-[#C14600] p-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="1.8em" height="1.8em" viewBox="0 0 24 24">
                                  <g fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18.353 14H19c.943 0 1.414 0 1.707-.293S21 12.943 21 12v-1c0-1.886 0-2.828-.586-3.414S18.886 7 17 7H7c-1.886 0-2.828 0-3.414.586S3 9.114 3 11v2c0 .471 0 .707.146.854C3.293 14 3.53 14 4 14h1.647" />
                                    <path d="M6 20.306V12c0-.943 0-1.414.293-1.707S7.057 10 8 10h8c.943 0 1.414 0 1.707.293S18 11.057 18 12v8.306c0 .317 0 .475-.104.55s-.254.025-.554-.075l-2.184-.728c-.078-.026-.117-.04-.158-.04s-.08.014-.158.04l-2.684.894c-.078.026-.117.04-.158.04s-.08-.014-.158-.04l-2.684-.894c-.078-.026-.117-.04-.158-.04s-.08.014-.158.04l-2.184.728c-.3.1-.45.15-.554.075S6 20.623 6 20.306ZM18 7V5.88c0-1.008 0-1.512-.196-1.897a1.8 1.8 0 0 0-.787-.787C16.632 3 16.128 3 15.12 3H8.88c-1.008 0-1.512 0-1.897.196a1.8 1.8 0 0 0-.787.787C6 4.368 6 4.872 6 5.88V7" />
                                    <path strokeLinecap="round" d="M10 14h3m-3 3h4.5" />
                                  </g>
                                </svg>
                    </button>
                    <button onClick={() => prepararEdicion(p)} className="text-[#C14600] p-1">
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
                    <button onClick={() => eliminar(p.idPaquete)} className="text-red-600 p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="1.8em" height="1.8em" viewBox="0 0 24 24">
                                  <path
                                    fill="currentColor"
                                    d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6z"
                                  />
                                </svg></button>
                  </td>
                </tr>
              ))}
              {paquetesFiltrados.length === 0 && (
                <tr>
                  <td colSpan="10" className="text-center py-4 text-gray-500">No hay paquetes para el viaje seleccionado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}