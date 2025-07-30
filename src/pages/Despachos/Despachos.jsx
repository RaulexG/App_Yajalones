import { useEffect, useState } from "react";
import { ListarPaquetes, ListarPasajeros } from "../../services/Admin/adminService";

export default function Despachos() {
  const [pasajeros, setPasajeros] = useState([]);
  const [paquetes, setPaquetes] = useState([]);
  const [descuentos, setDescuentos] = useState([]);
  const [nuevoDescuento, setNuevoDescuento] = useState({
    concepto: "",
    descripcion: "",
    importe: 0
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const listaPasajeros = await ListarPasajeros();
      const listaPaquetes = await ListarPaquetes();
      setPasajeros(listaPasajeros);
      setPaquetes(listaPaquetes);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    }
  };

  const agregarDescuento = () => {
    if (nuevoDescuento.importe > 0) {
      setDescuentos([...descuentos, nuevoDescuento]);
      setNuevoDescuento({ concepto: "", descripcion: "", importe: 0 });
    }
  };

  // Cálculos para resumen
  const totalPasajeros = pasajeros.reduce((acc, p) => acc + parseFloat(p.importe || 0), 0);
  const totalPaqueteria = paquetes.reduce((acc, p) => acc + parseFloat(p.importe || 0), 0);
  const comision = (totalPasajeros + totalPaqueteria) * 0.10;
  const totalDescuentos = descuentos.reduce((acc, d) => acc + parseFloat(d.importe || 0), 0);

  // Ahora "pagado en Yajalón" es cualquier pasajero cuyo tipoPago sea "DESTINO"
  const pagadoEnYajalon = pasajeros
    .filter(p => p.tipoPago === "DESTINO")
    .reduce((acc, p) => acc + parseFloat(p.importe || 0), 0);

  // Pasajeros que pagan al abordar en SCLC (tipoPago 'SAN_CRISTOBAL')
  const pagaAbordarSCLC = pasajeros
    .filter(p => p.tipoPago === "SAN_CRISTOBAL")
    .reduce((acc, p) => acc + parseFloat(p.importe || 0), 0);

  // Paquetes por cobrar (porCobrar === true)
  const paquetesPorCobrar = paquetes
  .filter(p => p.porCobrar)
  .reduce((acc, p) => acc + (Number(p.importe) || 0), 0);


  const total = totalPasajeros + totalPaqueteria
  - comision
  - totalDescuentos
  - pagadoEnYajalon
  - pagaAbordarSCLC
  - paquetesPorCobrar;


  return (
    <div className="flex gap-6 p-6">
    {/* Columna izquierda: Formulario y Resumen */}
    <div className="w-1/3 flex flex-col gap-6">
      
      {/* Formulario de Descuento */}
      <div className="bg-[#fff7ec] p-5 rounded-lg shadow-md">
        <h3 className="text-orange-700 font-bold mb-3">Agregar Descuento</h3>
        
        <label className="block text-orange-700 font-semibold mb-1">Concepto</label>
        <input
          type="text"
          placeholder=""
          className="w-full p-2 rounded-md bg-[#ffe0b2] outline-none mb-3"
          value={nuevoDescuento.concepto}
          onChange={(e) =>
            setNuevoDescuento({ ...nuevoDescuento, concepto: e.target.value })
          }
        />

        <label className="block text-orange-700 font-semibold mb-1">Descripción</label>
        <textarea
          placeholder=""
          className="w-full p-2 rounded-md bg-[#ffe0b2] outline-none mb-3"
          value={nuevoDescuento.descripcion}
          onChange={(e) =>
            setNuevoDescuento({ ...nuevoDescuento, descripcion: e.target.value })
          }
        />

        <label className="block text-orange-700 font-semibold mb-1">Importe</label>
        <input
          type="number"
          placeholder=""
          className="w-1/3 p-2 rounded-md bg-[#ffe0b2] outline-none mb-4"
          value={nuevoDescuento.importe}
          onChange={(e) =>
            setNuevoDescuento({ ...nuevoDescuento, importe: parseFloat(e.target.value) })
          }
        />

        <button
          className="bg-[#cc4500] text-white font-semibold py-2 px-4 rounded-md w-full hover:bg-orange-800"
          onClick={agregarDescuento}
        >
          Guardar descuento
        </button>
      </div>

      {/* Resumen del Día */}
      <div className="bg-white p-5 rounded-lg shadow-md">
        <h3 className="text-orange-700 font-bold mb-3">Resumen del Día</h3>
        <ul className="space-y-2 text-sm text-orange-800">
          <li className="flex justify-between">
            <span>Pasajeros</span> <span>${totalPasajeros.toFixed(2)}</span>
          </li>
          <li className="flex justify-between">
            <span>Paquetería</span> <span>${totalPaqueteria.toFixed(2)}</span>
          </li>
          <li className="flex justify-between">
            <span>Comisión (10%)</span> <span>${comision.toFixed(2)}</span>
          </li>
          <li className="flex justify-between">
            <span>Paquetes por cobrar</span> <span>${paquetesPorCobrar.toFixed(2)}</span>
          </li>
          <li className="flex justify-between">
            <span>Pagado en Yajalón</span> <span>${pagadoEnYajalon.toFixed(2)}</span>
          </li>
          <li className="flex justify-between">
            <span>Otros descuentos</span> <span>${totalDescuentos.toFixed(2)}</span>
          </li>
          <li className="flex justify-between">
            <span>Paga al abordar en SCLC</span> <span>${pagaAbordarSCLC.toFixed(2)}</span>
          </li>
          <li className="flex justify-between font-bold text-lg">
            <span>TOTAL</span> <span>${total.toFixed(2)}</span>
          </li>
        </ul>

        <button
          className="bg-[#cc4500] text-white font-semibold py-2 px-4 rounded-md w-full mt-4 hover:bg-orange-800"
          onClick={() => {
            // lógica para PDF
          }}
        >
          PDF
        </button>
      </div>
    </div>

    {/* Columna derecha: Tablas */}
    <div className="w-2/3 flex flex-col gap-6">
      {/* Tabla Pasajeros */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-bold text-orange-700 mb-3">Pasajeros</h3>
        <div className="overflow-y-auto max-h-[250px]">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#f8c98e]">
                <th className="p-2 text-center">Folio</th>
                <th className="p-2 text-center">Nombre</th>
                <th className="p-2 text-center">Tipo</th>
                <th className="p-2 text-center">Monto</th>
              </tr>
            </thead>
            <tbody>
              {pasajeros.map((p, i) => (
                <tr key={i} className={`${i % 2 === 0 ? "bg-[#fffaf3]" : ""}`}>
                  <td className="p-2 text-center">{p.folio}</td>
                  <td className="p-2 text-center">{p.nombre}</td>
                  <td className="p-2 text-center">{p.tipo}</td>
                  <td className="p-2 text-center">${parseFloat(p.importe || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabla Paquetería */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-2xl font-bold text-orange-700 mb-3">Paquetería</h3>
        <div className="overflow-y-auto max-h-[250px]">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#f8c98e]">
                <th className="p-2 text-center">Folio</th>
                <th className="p-2 text-center">Remitente</th>
                <th className="p-2 text-center">Destinatario</th>
                <th className="p-2 text-center">Por cobrar</th>
                <th className="p-2 text-center">Monto</th>
              </tr>
            </thead>
            <tbody>
              {paquetes.map((p, i) => (
                <tr key={i} className={`${i % 2 === 0 ? "bg-[#fffaf3]" : ""}`}>
                  <td className="p-2 text-center">{p.folio}</td>
                  <td className="p-2 text-center">{p.remitente}</td>
                  <td className="p-2 text-center">{p.destinatario}</td>
                  <td className="p-2 text-center">{p.porCobrar ? "Sí" : "No"}</td>
                  <td className="p-2 text-center">${parseFloat(p.importe || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  );
}
