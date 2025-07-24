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
  const [folioEditando, setFolioEditando] = useState(null);

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

    if (modoEdicion && folioEditando) {
      await actualizarPaquete(folioEditando, data);
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
    setFolioEditando(null);
    cargarPaquetes();
    cargarViajes(); // importante para que se actualice la relación viaje -> paquete
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
      viaje: paquete.viaje?.idViaje || ""
    });
    setModoEdicion(true);
    setFolioEditando(paquete.folio);
  };

  const eliminar = async (folio) => {
    if (confirm("¿Estás seguro que deseas eliminar este paquete?")) {
      await eliminarPaquete(folio);
      cargarPaquetes();
      cargarViajes(); // para eliminarlo también del arreglo paquetes del viaje
    }
  };

  return (
    <div>
      <h2>Registro de Paquetería</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="remitente"
          placeholder="Remitente"
          value={formulario.remitente}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="destinatario"
          placeholder="Destinatario"
          value={formulario.destinatario}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="importe"
          placeholder="Importe"
          value={formulario.importe}
          onChange={handleChange}
          min="0"
        />
        <input
          type="text"
          name="contenido"
          placeholder="Contenido del paquete"
          value={formulario.contenido}
          onChange={handleChange}
          required
        />
        <select
          name="viaje"
          value={formulario.viaje}
          onChange={handleChange}
          required
          
        >
          <option value="">Seleccionar unidad</option>
          {viajes.map((v) => (
            <option key={v.idViaje} value={v.idViaje}>
              {v.unidad?.nombre || "Sin unidad"} - {v.origen} a {v.destino}
            </option>
          ))}
        </select>
        <label>
          <input
            type="checkbox"
            name="porCobrar"
            checked={formulario.porCobrar}
            onChange={handleChange}
          />
          Por cobrar
        </label>
        <button type="submit">
          {modoEdicion ? "Actualizar Paquete" : "Registrar Paquete"}
        </button>
      </form>

      <h3>Paquetes Registrados</h3>
      <table border="1">
        <thead>
          <tr>
            <th>Folio</th>
            <th>Remitente</th>
            <th>Destinatario</th>
            <th>Contenido</th>
            <th>Importe</th>
            <th>Unidad</th>
            <th>Por Cobrar</th>
            <th>Nota</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {paquetes.map((p) => (
            <tr key={p.folio}>
              <td>{p.folio}</td>
              <td>{p.remitente}</td>
              <td>{p.destinatario}</td>
              <td>{p.contenido}</td>
              <td>${p.importe.toFixed(2)}</td>
              <td>{obtenerNombreUnidad(p)}</td>
              <td>{p.porCobrar ? "Sí" : "No"}</td>
              <td>
                <input
                  type="text"
                  placeholder="Nota"
                  value={notas[p.folio] || ""}
                  onChange={(e) => handleNotaChange(p.folio, e.target.value)}
                />
              </td>
              <td>
                <button onClick={() => prepararEdicion(p)}>Editar</button>{" "}
                <button onClick={() => imprimirTicket(p)}>Ticket</button>{" "}
                <button onClick={() => eliminar(p.folio)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
