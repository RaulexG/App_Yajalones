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
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-semibold">Despacho del Día</h2>

      {/* Tabla de Pasajeros */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Pasajeros</h3>
        <table className="w-full table-auto border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">Folio</th>
              <th className="border px-2 py-1">Nombre</th>
              <th className="border px-2 py-1">Tipo</th>
              <th className="border px-2 py-1">Monto</th>
            </tr>
          </thead>
          <tbody>
            {pasajeros.map((p, i) => (
              <tr key={i}>
                <td className="border px-2 py-1">{p.folio}</td>
                <td className="border px-2 py-1">{p.nombre}</td>
                <td className="border px-2 py-1">{p.tipo}</td>
                <td className="border px-2 py-1">${parseFloat(p.importe || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tabla de Paquetería */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Paquetería</h3>
        <table className="w-full table-auto border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">Folio</th>
              <th className="border px-2 py-1">Remitente</th>
              <th className="border px-2 py-1">Destinatario</th>
              <th className="border px-2 py-1">Por cobrar</th>
              <th className="border px-2 py-1">Monto</th>
            </tr>
          </thead>
          <tbody>
            {paquetes.map((p, i) => (
              <tr key={i}>
                <td className="border px-2 py-1">{p.folio}</td>
                <td className="border px-2 py-1">{p.remitente}</td>
                <td className="border px-2 py-1">{p.destinatario}</td>
                <td className="border px-2 py-1">{p.porCobrar ? "Sí" : "No"}</td>
                <td className="border px-2 py-1">${parseFloat(p.importe || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Formulario de Descuento */}
      <div className="border p-4 rounded shadow bg-gray-50">
        <h3 className="font-semibold mb-2">Agregar Descuento</h3>
        <div className="grid grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Concepto"
            className="border px-2 py-1 rounded"
            value={nuevoDescuento.concepto}
            onChange={(e) =>
              setNuevoDescuento({ ...nuevoDescuento, concepto: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Descripción"
            className="border px-2 py-1 rounded"
            value={nuevoDescuento.descripcion}
            onChange={(e) =>
              setNuevoDescuento({ ...nuevoDescuento, descripcion: e.target.value })
            }
          />
          <input
            type="number"
            placeholder="Importe"
            className="border px-2 py-1 rounded"
            value={nuevoDescuento.importe}
            onChange={(e) =>
              setNuevoDescuento({ ...nuevoDescuento, importe: parseFloat(e.target.value) })
            }
          />
        </div>
        <button
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-4 rounded mt-2"
          onClick={agregarDescuento}
        >
          Agregar descuento
        </button>
      </div>

      {/* Resumen del Día */}
      <div className="border p-4 rounded shadow bg-white">
        <h3 className="font-semibold text-lg mb-2">Resumen del Día</h3>
        <ul className="space-y-1">
          <li>Pasajeros: ${totalPasajeros.toFixed(2)}</li>
          <li>Paquetería: ${totalPaqueteria.toFixed(2)}</li>
          <li>Comisión (10%): ${comision.toFixed(2)}</li>
          <li>Otros descuentos: ${totalDescuentos.toFixed(2)}</li>
          <li>Paquetes por cobrar: ${paquetesPorCobrar.toFixed(2)}</li>
          <li>Pagado en Yajalón: ${pagadoEnYajalon.toFixed(2)}</li>
          <li>Paga al abordar en SCLC: ${pagaAbordarSCLC.toFixed(2)}</li>
          <li className="font-bold text-lg">
            Total neto del día: ${total.toFixed(2)}
          </li>
        </ul>
      </div>

      {/* Botón PDF */}
      <div className="text-right">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded mt-6"
          onClick={() => {
            // Aquí podrías agregar la lógica para generar el PDF
          }}
        >
          Generar PDF
        </button>
      </div>
    </div>
  );
}
