import { useEffect, useState } from "react";
import {CrearDescuentoYajalon, ListarViajes
} from "../../services/Admin/adminService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Despachos() {
  const [pasajeros, setPasajeros] = useState([]);
  const [paquetes, setPaquetes] = useState([]);
  const [descuentos, setDescuentos] = useState([]);
  const [formulario, setFormulario] = useState({
    concepto: "",
    descripcion: "",
    importe: 0,
  });
  const [viajes, setViajes] = useState([]);


  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {


      const listaViajes = await ListarViajes();
      const todosPasajeros = listaViajes.flatMap(viaje =>
      (viaje.pasajeros || []).map(p => ({
        ...p,
        origen: viaje.origen,
        destino: viaje.destino,
        idViaje: viaje.idViaje
      }))
    );
    const todosPaquetes = listaViajes.flatMap(viaje =>
      (viaje.paquetes || []).map(p => ({
        ...p,
        origen: viaje.origen,
        destino: viaje.destino,
        idViaje: viaje.idViaje
      }))
    );


      setViajes(listaViajes);
       setPasajeros(todosPasajeros);
        setPaquetes(todosPaquetes);

      
    } catch (error) {
      console.error("Error al cargar datos:", error);
    }
  };
  function obtenerFechaFormateada() {
  const fecha = new Date();
  const dia = fecha.getDate().toString().padStart(2, '0');

  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  
  const mes = meses[fecha.getMonth()];
  const año = fecha.getFullYear();

  return `${dia} de ${mes}, ${año}`;
}



  const agregarDescuento = (e) => {
  e.preventDefault();
  try {
    if (!formulario.concepto || !formulario.importe) {
      alert("Por favor, complete los campos de concepto e importe.");
      return;
    }

    const nuevoDescuento = {
      concepto: formulario.concepto,
      descripcion: formulario.descripcion,
      importe: parseFloat(formulario.importe),
    };

    setDescuentos((prev) => [...prev, nuevoDescuento]);
    setFormulario({ concepto: "", descripcion: "", importe: 0 });

    CrearDescuentoYajalon(nuevoDescuento);
  } catch (error) {
    console.error("Error al agregar descuento:", error);
  }
};


// Filtrar viajes 
const viajesTuxtla = viajes.filter(v => v.origen === "Tuxtla");
const viajesYajalon = viajes.filter(v => v.origen === "Yajalon");

// Totales para viajes Yajalon
const totalPasajeros = viajesYajalon.reduce((acc, v) => acc + (v.totalPasajeros || 0), 0) +
viajesTuxtla.reduce((acc, v) => acc + (v.totalPagadoYajalon || 0), 0) + 
viajesTuxtla.reduce((acc, v) => acc + (v.totalPagadoSclc || 0), 0) +
viajesYajalon.reduce((acc, v) => acc + (v.totalPagadoSclc || 0), 0);
const totalPaqueteria = viajesYajalon.reduce((acc, v) => acc + (v.totalPaqueteria || 0), 0) + 
viajesTuxtla.reduce((acc, v) => acc + (v.totalPorCobrar || 0), 0);
const comision = viajesYajalon.reduce((acc, v) => acc + (v.comision || 0), 0);
const paquetesPorCobrar = viajesYajalon.reduce((acc, v) => acc + (v.totalPorCobrar || 0), 0);


const pagadoEnYajalon = 
  // de viajes de Tuxtla
  viajesTuxtla.reduce((acc, v) => acc + (v.totalPagadoYajalon || 0), 0) +

  // y además, lo pagado en SCLC pero de viajes Yajalón
  viajesYajalon.reduce((acc, v) => acc + (v.totalPagadoSclc || 0), 0) +
  viajesYajalon.reduce((acc, v) => acc + (v.totalPagadoYajalon || 0), 0);

const pagadoEnTuxtla =
  // de viajes de Tuxtla
  viajesTuxtla.reduce((acc, v) => acc + (v.totalPagadoTuxtla || 0), 0) +
  // y además, lo pagado en destino pero de viajes Yajalón
  viajesYajalon.reduce((acc, v) => acc + (v.totalPagadoTuxtla || 0), 0);

const pagaAbordarSCLC = viajesTuxtla.reduce((acc, v) => acc + (v.totalPagadoSclc || 0), 0);


const totalDescuentos = descuentos.reduce((acc, d) => acc + parseFloat(d.importe || 0), 0);


const total =  - totalDescuentos+ pagadoEnYajalon + viajesTuxtla.reduce((acc, v) => acc + (v.totalPorCobrar || 0), 0) + 
pagaAbordarSCLC - comision;


const generarPDF = () => {
  const observaciones = prompt("Escriba alguna observación(opcional):") || '';
  const fechaHoy = obtenerFechaFormateada();
  const doc = new jsPDF();

  // 1. Encabezado
  doc.setFontSize(14);
  doc.text('TRANSPORTES LOS YAJALONES S.A. DE C.V.', 20, 20);
  doc.setFontSize(10);
  doc.text('Dirección: 15 Oriente esquina 7 sur #817, Tuxtla Gutiérrez, Chiapas', 20, 26);
  doc.text('Teléfono: 9613023642 ', 20, 32);

  let y = 40;

  // 2. Tabla de Viajes Yajalon
  doc.setFontSize(12);
  doc.text('Resumen de Viajes (Yajalón)', 20, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [['ID Viaje', 'Origen', 'Destino', 'Pasajeros', 'Paquetería', 'Comisión']],
    body: viajesYajalon.map(v => [
      v.idViaje,
      v.origen,
      v.destino,
      `$${parseFloat(v.totalPasajeros || 0).toFixed(2)}`,
      `$${parseFloat(v.totalPaqueteria || 0).toFixed(2)}`,
      `$${parseFloat(v.comision || 0).toFixed(2)}`
    ]),
    theme: 'grid',
  });

  y = doc.lastAutoTable.finalY + 10;

  // 3. Observaciones
  if (observaciones.trim()) {
    doc.setFontSize(12);
    doc.text('Observaciones:', 20, y);
    y += 6;

    doc.setFontSize(10);
    const lines = doc.splitTextToSize(observaciones, 170);
    doc.text(lines, 20, y);
    y += lines.length * 5 + 5;
  }

  // 4. Resumen final
  doc.setFontSize(12);
  doc.text('Resumen del Día (solo Tuxtla)', 20, y);
  y += 6;

  const resumen = [
    ['Pasajeros', `$${totalPasajeros.toFixed(2)}`],
    ['Paquetería', `$${totalPaqueteria.toFixed(2)}`],
    ['Comisión (10%)', `$${comision.toFixed(2)}`],
    ['Paquetes por cobrar', `$${paquetesPorCobrar.toFixed(2)}`],
    ['Pagado en Tuxtla', `$${pagadoEnTuxtla.toFixed(2)}`],
    ['Viajes de SCLC', `$${pagaAbordarSCLC.toFixed(2)}`],
    ['Otros descuentos', `$${totalDescuentos.toFixed(2)}`],
    ['TOTAL', `$${total.toFixed(2)}`],
  ];

  resumen.forEach(([etiqueta, valor]) => {
    doc.setFontSize(10);
    doc.text(`${etiqueta}:`, 25, y);
    doc.text(valor, 150, y, { align: 'right' });
    y += 6;
  });

  // 5. Fecha
  doc.setFontSize(10);
  doc.text('Fecha de corte:', 20, y);
  doc.text(fechaHoy, 55, y);

  doc.save('CorteDia.pdf');
};



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
          value={formulario.concepto}
          onChange={(e) =>
            setFormulario({ ...formulario, concepto: e.target.value })
          }
        />

        <label className="block text-orange-700 font-semibold mb-1">Descripción</label>
        <textarea
          placeholder=""
          className="w-full p-2 rounded-md bg-[#ffe0b2] outline-none mb-3"
          value={formulario.descripcion}
          onChange={(e) =>
            setFormulario({ ...formulario, descripcion: e.target.value })
          }
        />

        <label className="block text-orange-700 font-semibold mb-1">Importe</label>
        <input
          type="number"
          placeholder=""
          className="w-1/3 p-2 rounded-md bg-[#ffe0b2] outline-none mb-4"
          value={formulario.importe}
          onChange={(e) =>
            setFormulario({ ...formulario, importe: parseFloat(e.target.value) })
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
            <span>Pagado en Tuxtla</span> <span>${pagadoEnTuxtla.toFixed(2)}</span>
          </li>
          <li className="flex justify-between">
            <span>Otros descuentos</span> <span>${totalDescuentos.toFixed(2)}</span>
          </li>
          <li className="flex justify-between">
            <span>Viajes de SCLC</span> <span>${pagaAbordarSCLC.toFixed(2)}</span>
          </li>
          <li className="flex justify-between font-bold text-lg">
            <span>TOTAL</span> <span>${total.toFixed(2)}</span>
          </li>
        </ul>

        <button
          className="bg-[#cc4500] text-white font-semibold py-2 px-4 rounded-md w-full mt-4 hover:bg-orange-800"
          onClick={generarPDF}
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
                <th className="p-2 text-center text-[#452B1C]">Folio</th>
                <th className="p-2 text-center text-[#452B1C]">Nombre</th>
                <th className="p-2 text-center text-[#452B1C]">Origen</th>
                <th className="p-2 text-center text-[#452B1C]">Destino</th>
                <th className="p-2 text-center text-[#452B1C]">Tipo</th>
                <th className="p-2 text-center text-[#452B1C]">Pago</th>
                <th className="p-2 text-center text-[#452B1C]">Monto</th>
              </tr>
            </thead>
            <tbody>
              {pasajeros.map((p, i) => (
                <tr key={i} className={`${i % 2 === 0 ? "bg-[#fffaf3]" : ""}`}>
                  <td className="p-2 text-center">{p.folio}</td>
                  <td className="p-2 text-center">{p.nombre}</td>
                  <td className="p-2 text-center">{p.origen}</td>
                    <td className="p-2 text-center">{p.destino}</td>
                  <td className="p-2 text-center">{p.tipo}</td>
                  <td className="p-2 text-center">{p.tipoPago}</td>
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
                <th className="p-2 text-center text-[#452B1C]">Folio</th>
                <th className="p-2 text-center text-[#452B1C]">Remitente</th>
                <th className="p-2 text-center text-[#452B1C]">Destinatario</th>
                <th className="p-2 text-center text-[#452B1C]">Origen</th>
                <th className="p-2 text-center text-[#452B1C]">Destino</th>
                <th className="p-2 text-center text-[#452B1C]">Por cobrar</th>
                <th className="p-2 text-center text-[#452B1C]">Monto</th>
              </tr>
            </thead>
            <tbody>
              {paquetes.map((p, i) => (
                <tr key={i} className={`${i % 2 === 0 ? "bg-[#fffaf3]" : ""}`}>
                  <td className="p-2 text-center">{p.folio}</td>
                  <td className="p-2 text-center">{p.remitente}</td>
                  <td className="p-2 text-center">{p.destinatario}</td>
                    <td className="p-2 text-center">{p.origen}</td>
                    <td className="p-2 text-center">{p.destino}</td>
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
