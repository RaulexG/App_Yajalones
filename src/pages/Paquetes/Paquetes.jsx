import { useEffect, useState } from "react";
import {
  ListarViajes,
  ListarPaquetes,
  crearPaquete,
  actualizarPaquete,
  eliminarPaquete
} from "../../services/Admin/adminService";

export default function Paqueteria() {
  const [viajes, setViajes] = useState([]);
  const [paquetes, setPaquetes] = useState([]);
  const [formulario, setFormulario] = useState({
    remitente: "",
    destinatario: "",
    importe: 70,
    contenido: "",
    estado: false,
    porCobrar: false,
    viaje: ""
  });
  const [notas, setNotas] = useState({});
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
const [activo, setActivo] = useState(false);

useEffect(() => {
  // Supongamos que `viajes` ya está cargado con la estructura que mencionaste
  const paquetesConViaje = viajes.flatMap((viaje) =>
    viaje.paquetes.map((paquete) => ({
      ...paquete,
      idViaje: viaje.idViaje,
      fechaSalida: viaje.fechaSalida,
      unidad: viaje.unidad, // si quieres mostrar también
    }))
  );

  setPaquetes(paquetesConViaje);
}, [viajes]);





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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormulario((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Formulario enviado:", formulario);
    if (!formulario.viaje?.idViaje) return alert("Seleccione una unidad/viaje");


    const data = {
      remitente: formulario.remitente,
      destinatario: formulario.destinatario,
      importe: parseFloat(formulario.importe),
      contenido: formulario.contenido,
      porCobrar: formulario.porCobrar,
      estado: formulario.estado,
      viaje: formulario.estado ? formulario.viaje : null,

    };
    

    if (modoEdicion && idEditando) {
      await actualizarPaquete(idEditando, data);
    } else {
      await crearPaquete(data);
    }

    setFormulario({
      remitente: "",
      destinatario: "",
      importe: 70,
      contenido: "",
      porCobrar: false,
      viaje: ""
    });
    setModoEdicion(false);
    setIdEditando(null);
    cargarPaquetes();
    cargarViajes();
  };

  const handleNotaChange = (folio, value) => {
    setNotas((prev) => ({
      ...prev,
      [folio]: value
    }));
  };

  const obtenerNombreUnidad = (paquete) => {
    for (const viaje of viajes) {
      if (viaje.paquetes?.some(p => p.folio === paquete.folio)) {
        return viaje.unidad?.nombre || "Unidad sin nombre";
      }
    }
    return "Unidad no encontrada";
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
    ventana.document.write(`<p><strong>Por cobrar:</strong> ${paquete.porCobrar? "Si" : "No"}</p>`);
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

  const prepararEdicion = (paquete) => {
    setFormulario({
      remitente: paquete.remitente,
      destinatario: paquete.destinatario,
      importe: paquete.importe,
      contenido: paquete.contenido,
      porCobrar: paquete.porCobrar,
      viaje: paquete.viaje?.idViaje?.toString() || "",
      estado: paquete.estado

    });

    setModoEdicion(true);
    setIdEditando(paquete.idPaquete);
  };

  const eliminar = async (id) => {
    
    if (confirm("¿Estás seguro que deseas eliminar este paquete?")) {
      await eliminarPaquete(id);
      cargarPaquetes();
      cargarViajes();
    }
  };

  return (
    <div className="flex gap-6 p-6">
      {/* Formulario Paquetería */}
      <form
        onSubmit={handleSubmit}
        className="w-1/3 bg-white p-5 rounded-lg shadow-md flex flex-col gap-4"
      >
        {/* Remitente */}
        <div>
          <label className="block text-orange-700 font-semibold mb-1">Remitente</label>
          <input
            type="text"
            name="remitente"
            value={formulario.remitente}
            onChange={handleChange}
            className="w-full p-2 rounded-md bg-[#ffe0b2] outline-none"
            required
          />
        </div>

        {/* Destinatario */}
        <div>
          <label className="block text-orange-700 font-semibold mb-1">Destinatario</label>
          <input
            type="text"
            name="destinatario"
            value={formulario.destinatario}
            onChange={handleChange}
            className="w-full p-2 rounded-md bg-[#ffe0b2] outline-none"
            required
          />
        </div>

        
        <div className="flex gap-2">
          {/* Viajes */}
          <div >
            <label className="block text-orange-700 font-semibold mb-1">Viaje</label>
            <select
  name="viaje"
  value={formulario.viaje?.idViaje || ''}
  onChange={(e) => {
  const idSeleccionado = parseInt(e.target.value);
  const viajeSeleccionado = viajes.find(v => v.idViaje === idSeleccionado);
  setFormulario({
    ...formulario,
    viaje: viajeSeleccionado ? { idViaje: idSeleccionado } : "",
  });
}}

  className="w-full p-2 rounded-md bg-[#ffe0b2]"
  required
>
  <option value="">Seleccionar</option>
  {viajes.map((viaje) => (
    <option key={viaje.idViaje} value={viaje.idViaje}>
      {`${viaje.origen} → ${viaje.destino} | ${new Date(viaje.fechaSalida).toLocaleString('es-MX', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })}`}
    </option>
  ))}
</select>

          </div>

        </div>

        {/* Contenido */}
        <div>
          <label className="block text-orange-700 font-semibold mb-1">Contenido</label>
          <textarea
            name="contenido"
            value={formulario.contenido}
            onChange={handleChange}
            className="w-full p-2 rounded-md bg-[#ffe0b2] h-24 outline-none"
            required
          />
        </div>

        
        {/* Importe */}
        <div>
          <label className="block text-orange-700 font-semibold mb-1">Importe</label>
          <input
            type="number"
            name="importe"
            value={formulario.importe}
            onChange={handleChange}
            className="w-full p-2 rounded-md bg-[#ffe0b2] outline-none"
            required
          />
        </div>
        <div className="flex items-center justify-end text-orange-700 font-medium gap-6">
  {/* Checkbox Activo */}
  <label className="flex items-center">
    <input
      type="checkbox"
      name="estado"
      checked={formulario.estado}
      onChange={handleChange}
      className="mr-2"
    />
    Activo
  </label>

  {/* Checkbox Por cobrar */}
  <label className="flex items-center">
    <input
      type="checkbox"
      name="porCobrar"
      checked={formulario.porCobrar}
      onChange={handleChange}
      className="mr-2"
    />
    Por cobrar
  </label>
</div>


        {/* Botones */}
        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-[#cc4500] text-white px-4 py-2 rounded-md w-1/2 font-semibold hover:bg-orange-800"
          >
            Guardar
          </button>
          <button
  type="button"
  onClick={() => setMostrarModal(true)}
  className="bg-[#cc4500] text-white px-4 py-2 rounded-md w-1/2 font-semibold hover:bg-orange-800"
>
  Pendiente
</button>

        </div>
        
      </form>
      {/* Tabla de inactivos/pendientes */}
      {mostrarModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg w-[90%] max-w-3xl max-h-[90vh] overflow-y-auto">
      <h2 className="text-2xl font-semibold mb-4">Paquetes Pendientes</h2>
      <table className="w-full border mb-4">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Folio</th>
            <th className="border p-2">Remitente</th>
            <th className="border p-2">Contenido</th>
            <th className="border p-2">Acción</th>
          </tr>
        </thead>
        <tbody>
          {paquetes.filter(p => p.estado === false).map(paquete => (
            <tr key={paquete.idPaquete}>
              <td className="border p-2">{paquete.folio}</td>
              <td className="border p-2">{paquete.remitente}</td>
              <td className="border p-2">{paquete.contenido}</td>
              <td className="border p-2">
                <button
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                  onClick={() => {
  prepararEdicion(paquete);       // Llena el formulario con los datos
  setMostrarModal(false);         // Cierra el modal
}}

                >
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={() => setMostrarModal(false)}
        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
      >
        Cerrar
      </button>
    </div>
  </div>
)}



      {/* Tabla a la derecha */}
      <div className="w-2/3 bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-bold text-orange-700 mb-3">Paquetes</h3>
        <div className="overflow-y-auto max-h-[500px]">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#f8c98e]">
                <th className="p-2 text-center font-bold text-[#452B1C]">Folio</th>
                <th className="p-2 text-center font-bold text-[#452B1C]">Unidad</th>
                <th className="p-2 text-center font-bold text-[#452B1C]">Remitente</th>
                <th className="p-2 text-center font-bold text-[#452B1C]">Destinatario</th>
                <th className="p-2 text-center font-bold text-[#452B1C]">Contenido</th>
                <th className="p-2 text-center font-bold text-[#452B1C]">Fecha de salida</th>
                <th className="p-2 text-center font-bold text-[#452B1C]">Importe</th>
              </tr>
            </thead>
            <tbody>
              {paquetes.map((p, i) => (
                <tr key={p.folio} className={`${i % 2 === 0 ? "bg-[#fffaf3]" : ""}`}>
                  <td className="p-2 text-center">{p.folio}</td>
                  <td className="p-2 text-center">{obtenerNombreUnidad(p)}</td>
                  <td className="p-2 text-center">{p.remitente}</td>
                  <td className="p-2 text-center">{p.destinatario}</td>
                  <td className="p-2 text-center">{p.contenido}</td>
                  <td className="p-2 text-center">
  {new Date(p.fechaSalida).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })}
</td>
                  <td className="p-2 text-center">${p.importe.toFixed(2)}</td>
                  <td className="p-2 text-center">
                    <button
            onClick={() => prepararEdicion(p)}
            className="bg-orange-700 text-white px-3 py-1 rounded hover:bg-orange-800 transition"
            title="Imprimir ticket"
          >
            Editar
          </button>
                    <button
            onClick={() => imprimirTicket(p)}
            className="bg-orange-700 text-white px-3 py-1 rounded hover:bg-orange-800 transition"
            title="Imprimir ticket"
          >
            Ticket
          </button>
                    {/* Botón eliminar con ícono */}
                    <button
                      onClick={() => eliminar(p.idPaquete)}
                      className="text-red-600 hover:scale-110 transition"
                      title="Eliminar"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
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
                  <td colSpan="8" className="text-center py-4 text-gray-500">
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
