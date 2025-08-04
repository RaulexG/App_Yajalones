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
    porCobrar: false,
    viaje: ""
  });
  const [notas, setNotas] = useState({});
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);


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
    if (!formulario.viaje) return alert("Seleccione una unidad/viaje");

    const data = {
      remitente: formulario.remitente,
      destinatario: formulario.destinatario,
      importe: parseFloat(formulario.importe),
      contenido: formulario.contenido,
      porCobrar: formulario.porCobrar,
      estado: true,
      viaje: {
        idViaje: Number(formulario.viaje)
      },
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
    const nota = notas[paquete.folio] || "";
    const unidadNombre = obtenerNombreUnidad(paquete);
    const contenido = `
----- TICKET DE PAQUETERÍA -----

Folio: ${paquete.folio}
Remitente: ${paquete.remitente}
Destinatario: ${paquete.destinatario}
Contenido: ${paquete.contenido}
Importe: $${paquete.importe.toFixed(2)}
Por Cobrar: ${paquete.porCobrar ? "Sí" : "No"}
Unidad: ${unidadNombre}
${nota ? `\nNota: ${nota}` : ""}

-------------------------------
    `;

    const ventana = window.open("", "_blank");
    ventana.document.write(`<pre>${contenido}</pre>`);
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

        {/* Tipo y Unidad */}
        <div className="flex gap-2">
          <div className="w-1/2">
            <label className="block text-orange-700 font-semibold mb-1">Tipo</label>
            <input
              type="text"
              name="tipo"
              value={formulario.tipo || ""}
              onChange={handleChange}
              className="w-full p-2 rounded-md bg-[#ffe0b2] outline-none"
            />
          </div>
          <div className="w-1/2">
            <label className="block text-orange-700 font-semibold mb-1">Unidad</label>
            <select
              name="unidad"
              value={formulario.unidad}
              onChange={handleChange}
              className="w-full p-2 rounded-md bg-[#ffe0b2]"
              required
            >
              <option value="">Seleccionar</option>
              <option value="1">Unidad 1</option>
              <option value="2">Unidad 2</option>
              <option value="3">Unidad 3</option>
              <option value="4">Unidad 4</option>
              <option value="5">Unidad 5</option>
              <option value="6">Unidad 6</option>
              <option value="7">Unidad 7</option>
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

        {/* Checkbox */}
        <div className="flex items-center justify-end text-orange-700 font-medium">
          <input
            type="checkbox"
            name="porCobrar"
            checked={formulario.porCobrar}
            onChange={handleChange}
            className="mr-2"
          />
          Por cobrar
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
            className="bg-[#cc4500] text-white px-4 py-2 rounded-md w-1/2 font-semibold hover:bg-orange-800"
          >
            Imprimir ticket
          </button>
        </div>
        <button
          type="button"
          className="bg-[#cc4500] text-white px-4 py-2 rounded-md w-full font-semibold hover:bg-orange-800"
        >
          Pendiente
        </button>
      </form>

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
                  <td className="p-2 text-center">{p.fechaSalida || "—"}</td>
                  <td className="p-2 text-center">${p.importe.toFixed(2)}</td>
                  <td className="p-2 text-center">
                    {/* Botón eliminar con ícono */}
                    <button
                      onClick={() => eliminar(p.folio)}
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
