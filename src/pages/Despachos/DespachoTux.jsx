// DespachosTuxtla.jsx
import { useEffect, useMemo, useState } from "react";
import { CrearDescuentoTuxtla, ListarViajes } from "../../services/Admin/adminService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Swal from "sweetalert2";

/* ================= Helpers para el nombre del PDF ================= */

// Convierte a algo apto para nombre de archivo: sin acentos/espacios/símbolos
const slug = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .replace(/[^a-zA-Z0-9]+/g, "-") // resto -> guiones
    .replace(/^-+|-+$/g, ""); // limpia extremos

// CorteTuxtla_Origen-a-Destino_YYYY-MM-DD_HH-mm.pdf
const buildTuxtlaPdfName = (viaje) => {
  const d = viaje?.fechaSalida ? new Date(viaje.fechaSalida) : new Date();
  const p = (n) => String(n).padStart(2, "0");
  const fecha = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}`;
  const od = `${slug(viaje?.origen)}-a-${slug(viaje?.destino)}`;
  return `CorteTuxtla_${od}_${fecha}.pdf`;
};

/* ===================== Componente ===================== */

export default function DespachosTuxtla() {
  const [viajes, setViajes] = useState([]);
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);

  const [descuentos, setDescuentos] = useState([]);
  const [formulario, setFormulario] = useState({
    concepto: "",
    descripcion: "",
    importe: "",
  });

  // HOY | TODOS
  const [filtroFecha, setFiltroFecha] = useState("HOY");

  useEffect(() => {
    (async () => {
      try {
        const listaViajes = await ListarViajes();
        setViajes(Array.isArray(listaViajes) ? listaViajes : []);
      } catch (e) {
        console.error("Error al listar viajes", e);
      }
    })();
  }, []);

  // ---- helpers ----
  const esMismoDia = (d1, d2) => {
    const a = new Date(d1), b = new Date(d2);
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  };

  // Viajes que se muestran en el select según HOY/TODOS
  const viajesFiltrados = useMemo(() => {
    const hoy = new Date();
    const arr = (viajes || []).filter(v =>
      filtroFecha === "HOY" ? esMismoDia(v.fechaSalida, hoy) : true
    );
    arr.sort((a, b) => new Date(a.fechaSalida) - new Date(b.fechaSalida));
    return arr;
  }, [viajes, filtroFecha]);

  const seleccionarViaje = (idViaje) => {
    const v = viajes.find(x => x.idViaje === idViaje);
    setViajeSeleccionado(v || null);
  };

  // Tablas
  const pasajeros = viajeSeleccionado?.pasajeros || [];
  const paquetes  = viajeSeleccionado?.paquetes  || [];

  // --------- resumen / totales ----------
  const obtenerFechaFormateada = () => {
    const fecha = new Date();
    const dia = String(fecha.getDate()).padStart(2, "0");
    const meses = [
      "enero","febrero","marzo","abril","mayo","junio",
      "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];
    return `${dia} de ${meses[fecha.getMonth()]}, ${fecha.getFullYear()}`;
  };

  const N = (x) => (Number.isFinite(Number(x)) ? Number(x) : 0);

  const v                      = viajeSeleccionado || {};
  const totalPasajeros         = N(v.totalPasajeros);
  const totalPaqueteria        = N(v.totalPaqueteria);
  const paquetesPorCobrar      = N(v.totalPorCobrar);
  const pagadoEnTuxtla         = N(v.totalPagadoTuxtla);
  const pagadoEnYajalon        = N(v.totalPagadoYajalon);
  const pagaAbordarSCLC        = N(v.totalPagadoSclc);

  const totalDescuentos = descuentos.reduce((acc, d) => acc + N(d.importe), 0);

  // TOTAL (Tuxtla): todo – (Yajalón) – comisión – por cobrar – descuentos
  const total = (totalPasajeros + totalPaqueteria - pagadoEnYajalon)
  - paquetesPorCobrar - totalDescuentos;


  const fmt = (n) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" })
      .format(Number(n || 0));

  const agregarDescuento = async (e) => {
    e.preventDefault();
    if (!formulario.concepto || !formulario.importe) {
      Swal.fire({
        icon: "warning",
        title: "Llene los campos obligatorios",
        timer: 1500,
        showConfirmButton: false
      });
      return;
    }
    try {
      const nuevo = {
        concepto: formulario.concepto,
        descripcion: formulario.descripcion,
        importe: Number(formulario.importe),
      };
      setDescuentos(prev => [...prev, nuevo]);
      setFormulario({ concepto: "", descripcion: "" , importe: "" });
      await CrearDescuentoTuxtla(nuevo);
    } catch (err) {
      console.error("Error al agregar descuento:", err);
    }
  };

  const generarPDF = async () => {
    try {
      if (!viajeSeleccionado) {
        Swal.fire({ icon: "warning", title: "Selecciona un viaje primero" });
        return;
      }

      const fechaHoy = obtenerFechaFormateada();
      const doc = new jsPDF({ unit: "pt", format: "letter" });
      const M = { l: 40, r: 40, t: 40, b: 40 };

      const drawHeader = () => {
        doc.setFontSize(12);
        doc.text("TRANSPORTES LOS YAJALONES S.A. DE C.V.", M.l, M.t);
        doc.setFontSize(9);
        doc.text("Dirección: Segunda calle Poniente Norte s/n, Centro. Yajalón, Chiapas", M.l, M.t + 16);
        doc.text("Teléfono fijo: 919 674 21 14", M.l, M.t + 30);
        doc.text("Teléfono Celular: 919 145 97 11", M.l, M.t + 40);
        doc.text(`Fecha de corte: ${fechaHoy}`, doc.internal.pageSize.getWidth() - M.r, M.t, { align: "right" });
        doc.setLineWidth(0.5);
        doc.line(M.l, M.t + 45, doc.internal.pageSize.getWidth() - M.r, M.t + 45);
      };

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

      drawHeader();
      let y = M.t + 60;

      doc.setFontSize(12);
      doc.text("Pasajeros", M.l, y);
      y += 8;
      autoTable(doc, {
        startY: y,
        head: [["Folio", "Nombre", "Tipo", "Pago", "Monto"]],
        body: pasajeros.map(p => [p.folio, p.nombre, p.tipo, p.tipoPago, fmt(p.importe)]),
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 5 },
        headStyles: { fillColor: [248,201,142], textColor: [69,43,28] },
        margin: { left: M.l, right: M.r },
        didDrawPage: ({ pageNumber }) => { if (pageNumber > 1) drawHeader(); }
      });

      y = doc.lastAutoTable.finalY + 20;

      doc.setFontSize(12);
      doc.text("Paquetería", M.l, y);
      y += 8;
      autoTable(doc, {
        startY: y,
        head: [["Folio","Remitente","Destinatario","Por Cobrar","Monto"]],
        body: paquetes.map(p => [p.folio, p.remitente, p.destinatario, p.porCobrar ? "Sí" : "No", fmt(p.importe)]),
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 5 },
        headStyles: { fillColor: [248,201,142], textColor: [69,43,28] },
        margin: { left: M.l, right: M.r },
        didDrawPage: ({ pageNumber }) => { if (pageNumber > 1) drawHeader(); }
      });

      y = doc.lastAutoTable.finalY + 20;

      doc.setFontSize(12);
      doc.text("Otros descuentos", M.l, y);
      y += 8;
      autoTable(doc, {
        startY: y,
        head: [["Concepto","Descripción","Monto"]],
        body: descuentos.map(d => [d.concepto, d.descripcion, fmt(d.importe)]),
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 5 },
        headStyles: { fillColor: [248,201,142], textColor: [69,43,28] },
        margin: { left: M.l, right: M.r },
        didDrawPage: ({ pageNumber }) => { if (pageNumber > 1) drawHeader(); }
      });

      y = doc.lastAutoTable.finalY + 30;

      doc.setFontSize(12);
      doc.text("Resumen del Día", M.l, y);
      y += 8;
      const resumen = [
        ["Pasajeros", fmt(totalPasajeros)],
        ["Paquetería", fmt(totalPaqueteria)],
        ["Paquetes por cobrar", fmt(paquetesPorCobrar)],
        ["Pagado en Yajalón", fmt(pagadoEnYajalon)],
        ["Viajes de SCLC", fmt(pagaAbordarSCLC)],
        ["Otros descuentos", fmt(totalDescuentos)],
        ["TOTAL", fmt(total)],
      ];      
      autoTable(doc, {
        startY: y,
        body: resumen.map(([k,v]) => [{ content: k, styles: { halign: "left" } }, { content: v, styles: { halign: "right" } }]),
        theme: "grid",
        styles: { fontSize: 10, cellPadding: 6 },
        columnStyles: { 0: { cellWidth: 240 }, 1: { cellWidth: 160 } },
        margin: { left: M.l, right: M.r },
        didDrawPage: ({ pageNumber }) => { if (pageNumber > 1) drawHeader(); }
      });

      y = doc.lastAutoTable.finalY + 30;

      const w = doc.internal.pageSize.getWidth();
      const colW = (w - M.l - M.r) / 2 - 20;

      doc.setFontSize(10);
      doc.text("Corte del dia: " + obtenerFechaFormateada(), M.l + colW / 2, y, { align: "center" });
      doc.setLineWidth(0.7);
      doc.line(M.l, y + 35, M.l + colW, y + 35);
      doc.line(M.l + colW + 40, y + 35, M.l + colW + 40 + colW, y + 35);
      doc.text("Elaboró", M.l + colW / 2, y + 55, { align: "center" });
      doc.text("Recibió", M.l + colW + 40 + colW / 2, y + 55, { align: "center" });

      // Paginación al pie
      drawFooter();

      /* ===== Guardar con nombre basado en el viaje seleccionado ===== */
      const fileName = buildTuxtlaPdfName(viajeSeleccionado);

      try {
        if (window?.pdf?.saveBuffer) {
          const ab = doc.output("arraybuffer");
          await window.pdf.saveBuffer(ab, fileName);
        } else {
          doc.save(fileName);
        }
      } catch {
        const ab = doc.output("arraybuffer");
        const blob = new Blob([ab], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Error al generar PDF:", err);
      Swal.fire({ icon: "warning", title: "Error al generar PDF", timer: 1500, showConfirmButton: false });
    }
  };

  return (
    <div className="h-dvh w-full overflow-hidden p-2 md:p-3">
      {/* Grid fluida: 1 col en sm, 3 fracciones en lg (1/3 | 2/3) */}
      <div className="grid h-full grid-cols-1 gap-3 lg:grid-cols-3">
        
        {/* IZQUIERDA (1/3) */}
        <section className="min-h-0 flex flex-col gap-3 lg:col-span-1">
          {/* Descuento (contenido compacto) */}
          <div className="bg-[#fff7ec] rounded-lg shadow-md p-3 md:p-4">
            <h3 className="text-orange-700 font-bold mb-2 text-sm md:text-base">Agregar Descuento</h3>
  
            <label className="block text-orange-700 font-semibold mb-1 text-xs md:text-sm">Concepto</label>
            <input
              type="text"
              className="w-full p-2 rounded-md bg-[#ffe0b2] outline-none mb-2 text-sm"
              value={formulario.concepto}
              onChange={(e) => setFormulario({ ...formulario, concepto: e.target.value })}
            />
  
            <label className="block text-orange-700 font-semibold mb-1 text-xs md:text-sm">Descripción</label>
            <textarea
              className="w-full p-2 rounded-md bg-[#ffe0b2] outline-none mb-2 text-sm"
              value={formulario.descripcion}
              onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })}
            />
  
            <label className="block text-orange-700 font-semibold mb-1 text-xs md:text-sm">Importe</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="w-full p-2 rounded-md bg-[#ffe0b2] outline-none mb-3 text-sm
                        [appearance:textfield]
                        [&::-webkit-outer-spin-button]:appearance-none
                        [&::-webkit-inner-spin-button]:appearance-none"
              value={formulario.importe ?? ""}
              onChange={(e) => setFormulario({ ...formulario, importe: e.target.value })}
            />
  
            <button
              className="bg-[#cc4500] text-white font-semibold py-2 px-3 rounded-md w-full hover:bg-orange-800 text-sm"
              onClick={agregarDescuento}
            >
              Guardar descuento
            </button>
          </div>
  
          {/* Resumen (toma el resto y scrollea si hace falta) */}
          <div className="bg-white rounded-lg shadow-md p-3 md:p-4 min-h-0 flex flex-col">
            <h3 className="text-orange-700 font-bold mb-2 text-sm md:text-base">Resumen del viaje</h3>
  
            <div className="min-h-0 overflow-auto">
              <ul className="space-y-2 text-[12px] md:text-[13px] text-orange-800">
                <li className="flex justify-between"><span>Pasajeros</span> <span>${totalPasajeros.toFixed(2)}</span></li>
                <li className="flex justify-between"><span>Paquetería</span> <span>${totalPaqueteria.toFixed(2)}</span></li>
                <li className="flex justify-between"><span>Paquetes por cobrar</span> <span>${paquetesPorCobrar.toFixed(2)}</span></li>
                <li className="flex justify-between"><span>Pagado en Yajalón</span> <span>${pagadoEnYajalon.toFixed(2)}</span></li>
                <li className="flex justify-between"><span>Otros descuentos</span> <span>${totalDescuentos.toFixed(2)}</span></li>
                <li className="flex justify-between"><span>Viajes de SCLC</span> <span>${pagaAbordarSCLC.toFixed(2)}</span></li>
                <li className="flex justify-between font-bold text-base"><span>TOTAL</span> <span>${total.toFixed(2)}</span></li>
              </ul>
            </div>
  
            <button
              className="bg-[#cc4500] text-white font-semibold py-2 rounded-md w-full mt-3 hover:bg-orange-800 text-sm"
              onClick={generarPDF}
            >
              PDF
            </button>
          </div>
        </section>
  
        {/* DERECHA (2/3) */}
        <section className="min-h-0 flex flex-col gap-3 lg:col-span-2">
          {/* Selector (no crece) */}
          <div className="bg-white p-3 md:p-4 rounded-lg shadow-md">
            <h3 className="text-orange-700 font-bold mb-2 text-sm md:text-base">Seleccionar Viaje</h3>
  
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <select
                value={viajeSeleccionado?.idViaje || ""}
                onChange={(e) => seleccionarViaje(Number(e.target.value))}
                className="flex-1 p-2 rounded-md bg-[#ffe0b2] outline-none ring-1 ring-orange-200 focus:ring-2 focus:ring-orange-300 text-sm"
              >
                <option value="">-- Selecciona un viaje --</option>
                {viajesFiltrados.map((v) => (
                  <option key={v.idViaje} value={v.idViaje}>
                    {v.origen} → {v.destino} | {new Date(v.fechaSalida).toLocaleString("es-MX", {
                      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
                    })}
                  </option>
                ))}
              </select>
  
              <div className="sm:shrink-0 inline-flex rounded-md overflow-hidden ring-1 ring-orange-200 bg-[#ffe0b2]">
                {[
                  { key: "HOY", label: "Hoy" },
                  { key: "TODOS", label: "Todos" },
                ].map((opt, i) => (
                  <button
                    key={opt.key}
                    type="button"
                    aria-pressed={filtroFecha === opt.key}
                    onClick={() => {
                      setFiltroFecha(opt.key);
                      const existe = viajesFiltrados.some(
                        (v) => String(v.idViaje) === String(viajeSeleccionado?.idViaje || "")
                      );
                      if (!existe) setViajeSeleccionado(null);
                    }}
                    className={`px-3 py-1.5 text-xs font-medium transition
                      ${i > 0 ? "border-l border-orange-200" : ""}
                      ${filtroFecha === opt.key ? "bg-orange-600 text-white" : "bg-orange-100 text-orange-700 hover:bg-orange-200"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
  
          {/* Pasajeros (flex-1, scroll interno; sin min-width fija) */}
          <div className="bg-white rounded-lg shadow-md p-3 md:p-4 min-h-0 flex flex-col flex-1">
            <h3 className="text-sm md:text-base font-bold text-orange-700 mb-2">Pasajeros</h3>
  
            <div className="min-h-0 overflow-auto rounded-md ring-1 ring-orange-100">
              <table className="w-full table-auto border-collapse text-xs">
                <thead className="bg-[#f8c98e] sticky top-0 z-10">
                  <tr className="h-9">
                    <th className="p-2 text-center text-[#452B1C]">Folio</th>
                    <th className="p-2 text-center text-[#452B1C]">Nombre</th>
                    <th className="p-2 text-center text-[#452B1C]">Tipo</th>
                    <th className="p-2 text-center text-[#452B1C]">Pago</th>
                    <th className="p-2 text-center text-[#452B1C]">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {pasajeros.map((p, i) => (
                    <tr key={i} className={`h-9 ${i % 2 === 0 ? "bg-[#fffaf3]" : ""}`}>
                      <td className="p-2 text-center whitespace-nowrap">{p.folio}</td>
                      <td className="p-2 text-center truncate">{p.nombre}</td>
                      <td className="p-2 text-center whitespace-nowrap">{p.tipo}</td>
                      <td className="p-2 text-center whitespace-nowrap">{p.tipoPago}</td>
                      <td className="p-2 text-center whitespace-nowrap">${Number(p.importe || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                  {pasajeros.length === 0 && (
                    <tr><td colSpan="5" className="text-center py-3 text-gray-500">Sin registros.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
  
          {/* Paquetería (flex-1, scroll interno) */}
          <div className="bg-white rounded-lg shadow-md p-3 md:p-4 min-h-0 flex flex-col flex-1">
            <h3 className="text-sm md:text-base font-bold text-orange-700 mb-2">Paquetería</h3>
  
            <div className="min-h-0 overflow-auto rounded-md ring-1 ring-orange-100">
              <table className="w-full table-auto border-collapse text-xs">
                <thead className="bg-[#f8c98e] sticky top-0 z-10">
                  <tr className="h-9">
                    <th className="p-2 text-center text-[#452B1C]">Folio</th>
                    <th className="p-2 text-center text-[#452B1C]">Remitente</th>
                    <th className="p-2 text-center text-[#452B1C]">Destinatario</th>
                    <th className="p-2 text-center text-[#452B1C]">Por cobrar</th>
                    <th className="p-2 text-center text-[#452B1C]">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {paquetes.map((p, i) => (
                    <tr key={i} className={`h-9 ${i % 2 === 0 ? "bg-[#fffaf3]" : ""}`}>
                      <td className="p-2 text-center whitespace-nowrap">{p.folio}</td>
                      <td className="p-2 text-center truncate">{p.remitente}</td>
                      <td className="p-2 text-center truncate">{p.destinatario}</td>
                      <td className="p-2 text-center whitespace-nowrap">{p.porCobrar ? "Sí" : "No"}</td>
                      <td className="p-2 text-center whitespace-nowrap">${Number(p.importe || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                  {paquetes.length === 0 && (
                    <tr><td colSpan="5" className="text-center py-3 text-gray-500">Sin registros.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}  