import { useEffect, useState } from "react";
import {
  ListarViajes,
  ListarPaquetes,
  crearPaquete,
  actualizarPaquete,
  eliminarPaquete,
  paquetePendiente,
  obtenerPaquetesPendientes,
  asignarPaqueteAViaje
} from "../../services/Admin/adminService";

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
    idViaje: ""
  });
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modalAsignar, setModalAsignar] = useState(false);
const [paqueteAsignando, setPaqueteAsignando] = useState(null);
const [viajeSeleccionado, setViajeSeleccionado] = useState("");


  useEffect(() => {
    cargarViajes();
    cargarPaquetes();
  }, []);

  const cargarViajes = async () => {
    const response = await ListarViajes();
    setViajes(response);
  };

  const cargarPaquetes = async () => {
    const response = await ListarPaquetes();
    setPaquetes(response);
  };

  const cargarPendientes = async () => {
    const response = await obtenerPaquetesPendientes();
    setPendientes(response);
    setMostrarModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormulario((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    

    if (formulario.pendiente) {
      const dataPendiente = {
        remitente: formulario.remitente,
        destinatario: formulario.destinatario,
        importe: parseFloat(formulario.importe),
        contenido: formulario.contenido,
        porCobrar: formulario.porCobrar
      };
      console.log("Datos del paquete:", dataPendiente);
      if (modoEdicion && idEditando) {
        await actualizarPaquete(idEditando, dataPendiente);
        setPendientes(prev => prev.filter(p => p.idPaquete !== idEditando));
      } else {
        await paquetePendiente(dataPendiente);
      }
      await cargarPendientes();
    } else {
      if (!formulario.idViaje) return alert("Seleccione un viaje");
      const data = {
        remitente: formulario.remitente,
        destinatario: formulario.destinatario,
        importe: parseFloat(formulario.importe),
        contenido: formulario.contenido,
        porCobrar: formulario.porCobrar,
        idViaje: parseInt(formulario.idViaje)
      };
      
      if (modoEdicion && idEditando) {
        await actualizarPaquete(idEditando, data);
      } else {
        await crearPaquete(data);
      }
    }

    setFormulario({
      remitente: "",
      destinatario: "",
      importe: 70,
      contenido: "",
      pendiente: false,
      porCobrar: false,
      idViaje: ""
    });
    setModoEdicion(false);
    setIdEditando(null);
    cargarPaquetes();
    cargarViajes();
  };

  const prepararEdicion = (paquete) => {
    setFormulario({
      remitente: paquete.remitente,
      destinatario: paquete.destinatario,
      importe: paquete.importe,
      contenido: paquete.contenido,
      pendiente: paquete.pendiente || false,
      porCobrar: paquete.porCobrar || false,
      idViaje: paquete.idViaje || ""
    });
    setModoEdicion(true);
    setIdEditando(paquete.idPaquete);
    setMostrarModal(false);
  };

  const eliminar = async (id) => {
    if (confirm("¿Estás seguro que deseas eliminar este paquete?")) {
      await eliminarPaquete(id);
      cargarPaquetes();
      cargarViajes();
    }
  };
  const confirmarAsignacion = async () => {
  if (!viajeSeleccionado) return alert("Seleccione un viaje");
  try {
    await asignarPaqueteAViaje(paqueteAsignando.idPaquete, parseInt(viajeSeleccionado));
    setPendientes(prev => prev.filter(p => p.idPaquete !== paqueteAsignando.idPaquete));
    await cargarPaquetes();
    setModalAsignar(false);
    setViajeSeleccionado("");
    setPaqueteAsignando(null);
    
  } catch (error) {
    console.error("Error asignando paquete:", error);
  }
};


  const obtenerNombreUnidad = (paquete) => {
    for (const viaje of viajes) {
      if (viaje.paquetes?.some((p) => p.folio === paquete.folio)) {
        return viaje.unidad?.nombre || "Unidad sin nombre";
      }
    }
    return "Unidad no encontrada";
  };

    const obtenerFechaSalida = (paquete) => {
    for (const viaje of viajes) {
      if (viaje.paquetes?.some((p) => p.folio === paquete.folio)) {
        return new Date(viaje.fechaSalida).toLocaleDateString("es-MX") || "-";
      }
    }
    return "Fecha no encontrada";
  };

  const imprimirTicket = (paquete) => {
    const Nota = prompt("Ingrese Nota (opcional):") || '';
    const ventana = window.open('', '', 'width=400,height=600');
    ventana.document.write('<html><head><title>Envío de paquetería</title></head><body>');
    ventana.document.write('<h2>Los Yajalones</h2>');
    ventana.document.write(`<p><strong>Folio:</strong> ${paquete.folio}</p>`);
    ventana.document.write(`<p><strong>Remitente:</strong> ${paquete.remitente}</p>`);
    ventana.document.write(`<p><strong>Destinatario:</strong> ${paquete.destinatario}</p>`);
    ventana.document.write(`<p><strong>Contenido:</strong> ${paquete.contenido}</p>`);
    ventana.document.write(`<p><strong>Por cobrar:</strong> ${paquete.porCobrar ? "Sí" : "No"}</p>`);
    ventana.document.write(`<p><strong>Importe:</strong> ${parseFloat(paquete.importe || 0).toFixed(2)}</p>`);
    if (Nota.trim()) {
      ventana.document.write('<hr/>');
      ventana.document.write(`<p><strong>Nota:</strong> ${Nota}</p>`);
    }
    ventana.document.write('<hr/><p>Gracias por su preferencia.</p>');
    ventana.document.write('</body></html>');
    ventana.document.close();
    ventana.focus();
    ventana.print();
    ventana.close();
  };

  return (
    <div className="flex gap-6 p-6">
      {/* Formulario */}
      <form onSubmit={handleSubmit} className="w-1/3 bg-white p-5 rounded-lg shadow-md flex flex-col gap-4">
        <label className="font-semibold text-orange-700">Remitente</label>
        <input type="text" name="remitente" value={formulario.remitente} onChange={handleChange} className="p-2 rounded-md bg-[#ffe0b2]" required />

        <label className="font-semibold text-orange-700">Destinatario</label>
        <input type="text" name="destinatario" value={formulario.destinatario} onChange={handleChange} className="p-2 rounded-md bg-[#ffe0b2]" required />

        <label className="font-semibold text-orange-700">Viaje</label>
        <select
          name="idViaje"
          value={formulario.idViaje}
          onChange={handleChange}
          className="p-2 rounded-md bg-[#ffe0b2]"
          disabled={formulario.pendiente}
          required={!formulario.pendiente}
        >
          <option value="">Seleccionar</option>
          {viajes.map((viaje) => (
            <option key={viaje.idViaje} value={viaje.idViaje}>
              {`${viaje.origen} → ${viaje.destino} | ${new Date(viaje.fechaSalida).toLocaleString("es-MX", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}`}
            </option>
          ))}
        </select>

        <label className="font-semibold text-orange-700">Contenido</label>
        <textarea name="contenido" value={formulario.contenido} onChange={handleChange} className="p-2 rounded-md bg-[#ffe0b2]" required />

        <label className="font-semibold text-orange-700">Importe</label>
        <input type="number" name="importe" value={formulario.importe} onChange={handleChange} className="p-2 rounded-md bg-[#ffe0b2]" required />

        <div className="flex gap-4 text-orange-700">
          <label>
            <input type="checkbox" name="pendiente" checked={formulario.pendiente} onChange={handleChange} className="mr-2" />
            Pendiente
          </label>
          <label>
            <input type="checkbox" name="porCobrar" checked={formulario.porCobrar} onChange={handleChange} className="mr-2" />
            Por Cobrar
          </label>
        </div>

        <div className="flex gap-3">
          <button type="submit" className="bg-[#cc4500] text-white px-4 py-2 rounded-md w-1/2">Guardar</button>
          <button type="button" onClick={cargarPendientes} className="bg-[#cc4500] text-white px-4 py-2 rounded-md w-1/2">Pendiente</button>
        </div>
      </form>

      {/* Modal de pendientes */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-[90%] max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Paquetes Pendientes</h2>
            <table className="w-full border">
              <thead>
                <tr>
                  <th className="p-2 border">Folio</th>
                  <th className="p-2 border">Remitente</th>
                  <th className="p-2 border">Contenido</th>
                  <th className="p-2 border">Acción</th>
                </tr>
              </thead>
              <tbody>
                {pendientes.map((paquete) => (
                  <tr key={paquete.idPaquete}>
                    <td className="p-2 border">{paquete.folio}</td>
                    <td className="p-2 border">{paquete.remitente}</td>
                    <td className="p-2 border">{paquete.contenido}</td>
                    <td className="p-2 border">
                      <button
  className="bg-blue-600 text-white px-3 py-1 rounded"
  onClick={() => {
    setPaqueteAsignando(paquete);
    setModalAsignar(true);
  }}
>
  Asignar viaje
</button>

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={() => setMostrarModal(false)} className="bg-gray-500 text-white px-4 py-2 rounded mt-4">Cerrar</button>
          </div>
        </div>
      )}
      {modalAsignar && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-white p-6 rounded-lg w-[400px]">
      <h2 className="text-lg font-bold mb-4">Asignar viaje a paquete</h2>
      <p><strong>Folio:</strong> {paqueteAsignando?.folio}</p>
      <p><strong>Remitente:</strong> {paqueteAsignando?.remitente}</p>

      <label className="block mt-4">Seleccione un viaje:</label>
      <select
        value={viajeSeleccionado}
        onChange={(e) => setViajeSeleccionado(e.target.value)}
        className="w-full p-2 border rounded"
      >
        <option value="">-- Seleccionar --</option>
        {viajes.map((v) => (
          <option key={v.idViaje} value={v.idViaje}>
            {`${v.origen} → ${v.destino} | ${new Date(v.fechaSalida).toLocaleString("es-MX")}`}
          </option>
        ))}
      </select>

      <div className="flex gap-2 mt-4">
        <button
          onClick={confirmarAsignacion}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Confirmar
        </button>
        <button
          onClick={() => setModalAsignar(false)}
          className="bg-gray-500 text-white px-4 py-2 rounded"
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
)}


      {/* Tabla paquetes */}
      <div className="w-2/3 bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-bold text-orange-700 mb-3">Paquetes</h3>
        <div className="overflow-y-auto max-h-[500px]">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#f8c98e]">
                <th className="p-2 text-center">Folio</th>
                <th className="p-2 text-center">Unidad</th>
                <th className="p-2 text-center">Remitente</th>
                <th className="p-2 text-center">Destinatario</th>
                <th className="p-2 text-center">Contenido</th>
                <th className="p-2 text-center">Fecha de salida</th>
                <th className="p-2 text-center">Importe</th>
                <th className="p-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paquetes.map((p, i) => (
                <tr key={p.folio} className={i % 2 === 0 ? "bg-[#fffaf3]" : ""}>
                  <td className="p-2 text-center">{p.folio}</td>
                  <td className="p-2 text-center">{obtenerNombreUnidad(p)}</td>
                  <td className="p-2 text-center">{p.remitente}</td>
                  <td className="p-2 text-center">{p.destinatario}</td>
                  <td className="p-2 text-center">{p.contenido}</td>
                  <td className="p-2 text-center">{obtenerFechaSalida(p)}</td>
                  <td className="p-2 text-center">${p.importe.toFixed(2)}</td>
                  <td className="p-2 text-center flex gap-1 justify-center">
                    <button onClick={() => prepararEdicion(p)} className="bg-orange-700 text-white px-3 py-1 rounded hover:bg-orange-800">Editar</button>
                    <button onClick={() => imprimirTicket(p)} className="bg-orange-700 text-white px-3 py-1 rounded hover:bg-orange-800">Ticket</button>
                    <button onClick={() => eliminar(p.idPaquete)} className="text-red-600 hover:scale-110 transition">🗑</button>
                  </td>
                </tr>
              ))}
              {paquetes.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-gray-500">No hay paquetes registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
