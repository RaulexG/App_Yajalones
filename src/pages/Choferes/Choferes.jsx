import { useEffect, useState } from "react";
import {
  CrearChofer,
  ListarChoferes,
  ActualizarChofer,
  ListarUnidades,
} from "../../services/Admin/adminService";

export default function Choferes() {
  const [formulario, setFormulario] = useState({
    nombre: "",
    apellido: "",
    unidad: "",
    telefono: "",
    activo: true,
  });

  const [choferes, setChoferes] = useState([]);
  const [idChoferEditando, setIdChoferEditando] = useState(null);
  const [unidades, setUnidades] = useState([]);

  useEffect(() => {
  ListarUnidades()
    .then((res) => {
      setUnidades(res); // Asegúrate que `res` sea un array de unidades
    })
    .catch((err) => {
      console.error('Error al cargar unidades:', err);
    });
}, []);


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Si es el checkbox de activo
    if (name === "activo") {
      setFormulario((prev) => ({
        ...prev,
        activo: checked,
        unidad: checked ? prev.unidad : "", 
      }));
    } else {
      setFormulario({ ...formulario, [name]: value });
    }
  };

  const cargarChoferes = async () => {
    try {
      const data = await ListarChoferes();
      setChoferes(data);
    } catch (err) {
      console.error("Error al obtener choferes:", err);
    }
  };

const seleccionarChofer = (chofer) => {
  setFormulario({
    nombre: chofer.nombre || "",
    apellido: chofer.apellido || "",
    unidad: chofer.unidad?.idUnidad || "",
    telefono: chofer.telefono,
    activo: chofer.activo ?? true,
  });
  setIdChoferEditando(chofer.idChofer);
};


  const guardarChofer = async (e) => {
    e.preventDefault();
    try {
      const unidadSeleccionada = unidades.find(
      (u) => u.idUnidad === parseInt(formulario.unidad)
    );
      

      const datos = {
        nombre: formulario.nombre,
        apellido: formulario.apellido,
        unidad: formulario.activo ? { idUnidad: unidadSeleccionada?.idUnidad } : null,
        telefono: formulario.telefono,
        activo: formulario.activo,
      };
      

      if (idChoferEditando) {
        await ActualizarChofer(idChoferEditando, datos);
      } else {
        await CrearChofer(datos);
      }

      setFormulario({
        nombre: "",
        apellido: "",
        unidad: null,
        telefono: "",
        activo: true,
      });
      setIdChoferEditando(null);
      cargarChoferes();
    } catch (err) {
      console.error("Error al guardar chofer:", err);
    }
  };

  useEffect(() => {
    cargarChoferes();
  }, []);

  return (
    <div className="flex gap-6 p-6">
      {/* Formulario */}
      <form
        onSubmit={guardarChofer}
        className="w-1/3 bg-[#fff7ec] p-5 rounded-lg shadow-md flex flex-col gap-4"
      >
        <label className="text-orange-700 font-semibold">Nombre</label>
        <input
          type="text"
          name="nombre"
          value={formulario.nombre}
          onChange={handleChange}
          className="p-2 rounded-md bg-[#ffe0b2] outline-none"
          required
        />

        <label className="text-orange-700 font-semibold">Apellido</label>
        <input
          type="text"
          name="apellido"
          value={formulario.apellido}
          onChange={handleChange}
          className="p-2 rounded-md bg-[#ffe0b2] outline-none"
          required
        />

        <label className="text-orange-700 font-semibold">Unidad</label>
<select
  name="unidad"
  value={formulario.unidad}
  onChange={handleChange}
  className="p-2 rounded-md bg-[#ffe0b2] outline-none"
  required={formulario.activo}
  disabled={!formulario.activo}
>
  <option value="">Selecciona una unidad</option>
  {unidades.map((unidad) => (
    <option key={unidad.idUnidad} value={unidad.idUnidad}>
      {unidad.nombre}
    </option>
  ))}
</select>


        <label className="text-orange-700 font-semibold">Teléfono</label>
        <input
          type="text"
          name="telefono"
          value={formulario.telefono}
          onChange={handleChange}
          className="p-2 rounded-md bg-[#ffe0b2] outline-none"
          required
        />

        {idChoferEditando !== null && (
          <label className="flex items-center gap-2 text-orange-700 font-semibold">
            <input
              type="checkbox"
              name="activo"
              checked={formulario.activo}
              onChange={handleChange}
              className="accent-orange-700"
            />
            Activo
          </label>
        )}

        <button
          type="submit"
          className="bg-[#cc4500] text-white font-semibold px-4 py-2 rounded-md hover:bg-orange-800"
        >
          {idChoferEditando ? "Actualizar" : "Guardar"}
        </button>
      </form>

      {/* Tabla */}
      <div className="w-2/3 bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-bold text-orange-700 mb-3">Choferes</h3>
        <div className="overflow-y-auto max-h-[500px]">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#f8c98e]">
                <th className="p-2 text-center">Nombre</th>
                <th className="p-2 text-center">Unidad</th>
                <th className="p-2 text-center">Teléfono</th>
              </tr>
            </thead>
            <tbody>
              {choferes.map((c, i) => (
                <tr key={i} className={`${i % 2 === 0 ? "bg-[#fffaf3]" : ""}`}>
                  <td className="p-2 text-center">{`${c.nombre} ${c.apellido}`}</td>
                  <td className="p-2 text-center">{c.unidad?.nombre || "-"}</td>
                  <td className="p-2 text-center">{c.telefono}</td>
                  <td className="p-2 flex gap-4 justify-center">
                    <button
                      onClick={() => seleccionarChofer(c)}
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => eliminarChofer(c.idChofer)}
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
              {choferes.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-gray-500">
                    No hay choferes registrados.
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
