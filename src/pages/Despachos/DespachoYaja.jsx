import { useEffect, useState } from "react";
import {CrearDescuentoYajalon, ListarViajes
} from "../../services/Admin/adminService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Swal from "sweetalert2";

export default function Despachos() {
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);
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
    
     // Fecha de ayer
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1); // resta 1 día
    ayer.setHours(0, 0, 0, 0); // inicio del día


    const viajesDesdeAyer = listaViajes.filter((v) => {
      const fechaViaje = new Date(v.fechaSalida);
      return fechaViaje >= ayer; // todos desde ayer en adelante
    });

    const todosPasajeros = viajesDesdeAyer.flatMap(viaje =>
      (viaje.pasajeros || []).map(p => ({
        ...p,
        origen: viaje.origen,
        destino: viaje.destino,
        idViaje: viaje.idViaje,
      }))
    );

    const todosPaquetes = viajesDesdeAyer.flatMap(viaje =>
      (viaje.paquetes || []).map(p => ({
        ...p,
        origen: viaje.origen,
        destino: viaje.destino,
        idViaje: viaje.idViaje,
      }))
    );

    setViajes(viajesDesdeAyer);
    setPasajeros(todosPasajeros);
    setPaquetes(todosPaquetes);
  } catch (error) {
    console.error("Error al cargar datos:", error);
  }
}

const seleccionarViaje = (idViaje) => {
  const viaje = viajes.find(v => v.idViaje === idViaje);
  setViajeSeleccionado(viaje || null);

  if (viaje) {
    setPasajeros(viaje.pasajeros || []);
    setPaquetes(viaje.paquetes || []);
  } else {
    setPasajeros([]);
    setPaquetes([]);
  }
};

  const pasajeros = viajeSeleccionado?.pasajeros || [];
  const paquetes = viajeSeleccionado?.paquetes || [];

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
      Swal.fire({
              icon: "warning",
              title: "Llene los campos obligatorios",
              timer: 1500,
              showConfirmButton: false
            });
            return;
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

const v = viajeSeleccionado || {};
const N = (x) => Number(x || 0);

// Totales crudos
const totalPasajeros    = N(v.totalPasajeros);
const totalPaqueteria   = N(v.totalPaqueteria);
const comision          = N(v.comision);
const paquetesPorCobrar = N(v.totalPorCobrar);

// Desglose por sede/tipo de cobro
const pagadoEnTuxtla  = N(v.totalPagadoTuxtla);
const pagadoEnYajalon = N(v.totalPagadoYajalon);
const pagaAbordarSCLC = N(v.totalPagadoSclc);

// Descuentos locales
const totalDescuentos = descuentos.reduce((acc, d) => acc + N(d.importe), 0);

// 🔹 Definición recomendada de TOTAL (monto que entrega Yajalón):
//   (todo lo cobrado del viaje) – (lo que cobró Tuxtla) – comisión – por cobrar – descuentos
const total = (totalPasajeros + totalPaqueteria - pagadoEnTuxtla)
            - comision - paquetesPorCobrar - totalDescuentos;




// ✅ Formato moneda MXN
const fmt = (n) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(Number(n || 0));

const generarPDF = async () => {
  try {
    
    const fechaHoy = obtenerFechaFormateada();
    const doc = new jsPDF({ unit: "pt", format: "letter" }); // tamaño carta en puntos

    // Márgenes
    const M = { l: 40, r: 40, t: 40, b: 40 };

    // ====== Encabezado (repite en cada página) ======
    const drawHeader = () => {
      doc.setFontSize(12);
      doc.text("TRANSPORTES LOS YAJALONES S.A. DE C.V.", M.l, M.t);
      doc.setFontSize(9);
      doc.text(
        "Dirección: Segunda calle Poniente Norte s/n, Centro. Yajalón, Chiapas",
        M.l,
        M.t + 16
      );
      doc.text("Teléfono fijo: 919 674 21 14", M.l, M.t + 30);
      doc.text("Teléfono Celular: 919 145 97 11", M.l, M.t + 40);

      // Fecha alineada a la derecha
      doc.text(
        `Fecha de corte: ${fechaHoy}`,
        doc.internal.pageSize.getWidth() - M.r,
        M.t,
        { align: "right" }
      );
      doc.setLineWidth(0.5);
      doc.line(M.l, M.t + 45, doc.internal.pageSize.getWidth() - M.r, M.t + 45);
    };

    // ====== Pie de página (paginación) ======
    const drawFooter = () => {
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const w = doc.internal.pageSize.getWidth();
        const h = doc.internal.pageSize.getHeight();
        doc.setFontSize(8);
        doc.text(`Página ${i} de ${pageCount}`, w / 2, h - 20, { align: "center" });
      }
    };

    // Dibuja encabezado inicial
    drawHeader();

    let y = M.t + 60; 

// === Tabla de Pasajeros ===
doc.setFontSize(12);
doc.text("Pasajeros", M.l, y);
y += 8;

autoTable(doc, {
  startY: y,
  head: [["Folio", "Nombre", "Tipo", "Pago", "Monto"]],
  body: pasajeros.map((p) => [
    p.folio,
    p.nombre,
    p.tipo,
    p.tipoPago,
    fmt(p.importe)
  ]),
  theme: "grid",
  styles: { fontSize: 9, cellPadding: 5 },
  headStyles: { fillColor: [248, 201, 142], textColor: [69, 43, 28] },
  margin: { left: M.l, right: M.r },
  didDrawPage: (data) => {
    if (data.pageNumber > 1) drawHeader();
  },
});

y = doc.lastAutoTable.finalY + 20;

// === Tabla de Paquetería ===
doc.setFontSize(12);
doc.text("Paquetería", M.l, y);
y += 8;

autoTable(doc, {
  startY: y,
  head: [["Folio", "Remitente", "Destinatario", "Por Cobrar", "Monto"]],
  body: paquetes.map((p) => [
    p.folio,
    p.remitente,
    p.destinatario,
    p.porCobrar ? "Sí" : "No",
    fmt(p.importe)
  ]),
  theme: "grid",
  styles: { fontSize: 9, cellPadding: 5 },
  headStyles: { fillColor: [248, 201, 142], textColor: [69, 43, 28] },
  margin: { left: M.l, right: M.r },
  didDrawPage: (data) => {
    if (data.pageNumber > 1) drawHeader();
  },
});

y = doc.lastAutoTable.finalY + 20;

doc.setFontSize(12);
doc.text("Otros descuentos", M.l, y);
y += 8;

autoTable(doc, {
  startY: y,
  head: [["Concepto", "Descripción", "Monto"]],
  body: descuentos.map((d) => [
    d.concepto,
    d.descripcion,
    fmt(d.importe)
  ]),
  theme: "grid",
  styles: { fontSize: 9, cellPadding: 5 },
  headStyles: { fillColor: [248, 201, 142], textColor: [69, 43, 28] },
  margin: { left: M.l, right: M.r },
  didDrawPage: (data) => {
    if (data.pageNumber > 1) drawHeader();
  },
});

y = doc.lastAutoTable.finalY + 30;

    // ====== Resumen del Día (igual que tu panel, pero en PDF) ======
    doc.setFontSize(12);
    doc.text("Resumen del Día ", M.l, y);
    y += 8;

    const resumen = [
      ["Pasajeros", fmt(totalPasajeros)],
      ["Paquetería", fmt(totalPaqueteria)],
      ["Comisión (10%)", fmt(comision)],
      ["Paquetes por cobrar", fmt(paquetesPorCobrar)],
      ["Pagado en Tuxtla", fmt(pagadoEnTuxtla)],
      ["Viajes de SCLC", fmt(pagaAbordarSCLC)],
      ["Otros descuentos", fmt(totalDescuentos)],
      ["TOTAL", fmt(total)],
    ];

    autoTable(doc, {
      startY: y,
      body: resumen.map(([k, v]) => [
        { content: k, styles: { halign: "left" } },
        { content: v, styles: { halign: "right" } },
      ]),
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 6 },
      columnStyles: {
        0: { cellWidth: 240 },
        1: { cellWidth: 160 },
      },
      margin: { left: M.l, right: M.r },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) drawHeader();
      },
    });

    y = doc.lastAutoTable.finalY + 30;

    // ====== Firmas ======
    const w = doc.internal.pageSize.getWidth();
    const colW = (w - M.l - M.r) / 2 - 20;

    doc.setFontSize(10);
    doc.text("Corte del dia: "+ fechaHoy, M.l + colW / 2, y, { align: "center" });

    doc.setLineWidth(0.7);
    doc.line(M.l, y +35, M.l + colW, y+35);
    doc.line(M.l + colW + 40, y+35, M.l + colW + 40 + colW, y +35);

    doc.setFontSize(10);
    doc.text("Elaboró", M.l + colW / 2, y + 55, { align: "center" });
    doc.text("Recibió", M.l + colW + 40 + colW / 2, y + 55, { align: "center" });

    // ====== Paginación ======
    drawFooter();

    // ====== Guardar (web + Electron) ======
    try {
      if (window?.pdf?.saveBuffer) {
        const ab = doc.output("arraybuffer");         // jsPDF -> ArrayBuffer
        await window.pdf.saveBuffer(ab, "CorteDia.pdf"); // diálogo de guardar en la app
      } else {
        doc.save("CorteDia.pdf"); // web
      }
    } catch (e) {
      // Fallback web por si acaso
      const ab = doc.output("arraybuffer");
      const blob = new Blob([ab], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "CorteDia.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
  } catch (err) {
    console.error("Error al generar PDF:", err);
    Swal.fire({
            icon: "warning",
            title: "Error al generar PDF",
            timer: 1500,
            showConfirmButton: false
          });
          return;
  }
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
          className="w-full p-2 rounded-md bg-[#ffe0b2] outline-none mb-4"
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
      <div className="bg-white p-5 rounded-lg shadow-md h-2/3">
        <h3 className="text-orange-700 font-bold mb-3">Resumen del viaje</h3>
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
          className="bg-[#cc4500] text-white font-semibold py-3 px-4 rounded-md w-full mt-8 hover:bg-orange-800"
          onClick={generarPDF}
        >
          PDF
        </button>
      </div>
    </div>


    {/* Columna derecha: Tablas */}
    <div className="w-2/3 flex flex-col gap-6">

              {/* Selección de viaje */}
              <div className="bg-white p-4 rounded-lg shadow-md">
                  <h3 className="text-orange-700 font-bold mb-2">Seleccionar Viaje</h3>
                  <select
            value={viajeSeleccionado?.idViaje || ""}
            onChange={(e) => seleccionarViaje(Number(e.target.value))}
            className="w-full p-2 rounded-md bg-[#ffe0b2] outline-none mb-4"
          >
            <option value="">-- Selecciona un viaje --</option>
            {viajes.map((v) => (
              <option key={v.idViaje} value={v.idViaje}>
                {v.origen} → {v.destino} | {new Date(v.fechaSalida).toLocaleString()}
              </option>
            ))}
          </select>
      </div>

          
        {/* Tabla Pasajeros (scroll a 4 filas visibles) */}
        <div className="bg-white p-5 rounded-lg shadow-md">
          <h3 className="text-lg font-bold text-orange-700 mb-3">Pasajeros</h3>
          <div className="overflow-y-auto max-h-[240px] rounded-md ring-1 ring-orange-100">
            <table className="w-full table-fixed border-collapse text-sm">
              <thead className="bg-[#f8c98e] sticky top-0 z-10">
                <tr className="h-10">
                  <th className="p-2 text-center text-[#452B1C]">Folio</th>
                  <th className="p-2 text-center text-[#452B1C]">Nombre</th>
                  <th className="p-2 text-center text-[#452B1C]">Tipo</th>
                  <th className="p-2 text-center text-[#452B1C]">Pago</th>
                  <th className="p-2 text-center text-[#452B1C]">Monto</th>
                </tr>
              </thead>
              <tbody>
                {pasajeros.map((p, i) => (
                  <tr key={i} className={`h-10 ${i % 2 === 0 ? "bg-[#fffaf3]" : ""}`}>
                    <td className="p-2 text-center whitespace-nowrap">{p.folio}</td>
                    <td className="p-2 text-center whitespace-nowrap">{p.nombre}</td>
                    <td className="p-2 text-center whitespace-nowrap">{p.tipo}</td>
                    <td className="p-2 text-center whitespace-nowrap">{p.tipoPago}</td>
                    <td className="p-2 text-center whitespace-nowrap">
                      ${parseFloat(p.importe || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      {/*Tabla Paquetería (scroll a 4 filas) */}
      <div className="bg-white p-5 rounded-lg shadow-md">
        <h3 className="text-lg font-bold text-orange-700 mb-3">Paquetería</h3>
        <div className="overflow-y-auto max-h-[240px] rounded-md ring-1 ring-orange-100">
          <table className="w-full table-fixed border-collapse text-sm">
            <thead className="bg-[#f8c98e] sticky top-0 z-10">
              <tr className="h-10">
                <th className="p-2 text-center text-[#452B1C]">Folio</th>
                <th className="p-2 text-center text-[#452B1C]">Remitente</th>
                <th className="p-2 text-center text-[#452B1C]">Destinatario</th>
                <th className="p-2 text-center text-[#452B1C]">Por cobrar</th>
                <th className="p-2 text-center text-[#452B1C]">Monto</th>
              </tr>
            </thead>
            <tbody>
              {paquetes.map((p, i) => (
                <tr key={i} className={`h-11 ${i % 2 === 0 ? "bg-[#fffaf3]" : ""}`}>
                  <td className="p-2 text-center whitespace-nowrap">{p.folio}</td>
                  <td className="p-2 text-center whitespace-nowrap">{p.remitente}</td>
                  <td className="p-2 text-center whitespace-nowrap">{p.destinatario}</td>
                  <td className="p-2 text-center whitespace-nowrap">{p.porCobrar ? "Sí" : "No"}</td>
                  <td className="p-2 text-center whitespace-nowrap">
                    ${parseFloat(p.importe || 0).toFixed(2)}
                  </td>
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
