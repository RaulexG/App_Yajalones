// src/pages/Despachos/DespachoYaja.jsx
import { useEffect, useMemo, useState } from "react";
import { CrearDescuentoYajalon, ListarViajes,ListarChoferes } from "../../services/Admin/adminService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Swal from "sweetalert2";

/* ===== Helpers para el nombre del PDF ===== */

// Quita acentos y símbolos para que sea válido como nombre de archivo
const slug = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// CorteYajalon_Origen-a-Destino_YYYY-MM-DD_HH-mm.pdf
const buildYajalonPdfName = (viaje) => {
  const d = viaje?.fechaSalida ? new Date(viaje.fechaSalida) : new Date();
  const p = (n) => String(n).padStart(2, "0");
  const fecha = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}`;
  const od = `${slug(viaje?.origen)}-a-${slug(viaje?.destino)}`;
  return `CorteYajalon_${od}_${fecha}.pdf`;
};

export default function DespachoYaja() {
  const [viajes, setViajes] = useState([]);
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);

  const [descuentos, setDescuentos] = useState([]);
  const [formulario, setFormulario] = useState({
    concepto: "",
    descripcion: "",
    importe: "",
  });
  const [choferes, setChoferes] = useState([]);
  const [choferSeleccionado, setChoferSeleccionado] = useState(null);


  // Filtro HOY | TODOS
  const [filtroFecha, setFiltroFecha] = useState("HOY");

  useEffect(() => {
    (async () => {
      try {
        const [listaViajes, listaChoferes] = await Promise.all([
          ListarViajes(),
          ListarChoferes(),
        ]);

        setViajes(Array.isArray(listaViajes) ? listaViajes : []);
        setChoferes(Array.isArray(listaChoferes) ? listaChoferes : []);
      } catch (e) {
        console.error("Error al cargar datos", e);
      }
    })();
  }, []);


  // Helpers
  const esMismoDia = (d1, d2) => {
    const a = new Date(d1), b = new Date(d2);
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  };

  // Viajes mostrados según HOY/TODOS
const viajesFiltrados = useMemo(() => {
  const now = new Date();

  // Ayer a las 00:00:00
  const ayer = new Date(now);
  ayer.setDate(ayer.getDate() - 1);
  ayer.setHours(0, 0, 0, 0);

  const arr = (viajes || []).filter((v) => {
    const fs = new Date(v.fechaSalida);

    // Regla nueva: solo desde ayer hacia futuro
    const desdeAyer = fs >= ayer;

    // Si está en HOY, además debe ser mismo día
    const pasaHoy = filtroFecha === "HOY" ? esMismoDia(fs, now) : true;

    return desdeAyer && pasaHoy;
  });

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

  const totalDescuentos = descuentos.reduce((acc, d) => acc + N(d.importe), 0);
  const v                 = viajeSeleccionado || {};
  const totalPasajeros    = N(v.totalPasajeros);
  const totalPaqueteria   = N(v.totalPaqueteria);
  const paquetesPorCobrar = N(v.totalPorCobrar);
  const pagadoEnTuxtla    = N(v.totalPagadoTuxtla);
  const pagaAbordarSCLC   = N(v.totalPagadoSclc);
  const boletos = totalPasajeros;
  const paq = totalPaqueteria;
  const subTotal = boletos + paq;
  const viaticos = totalDescuentos;
  const totalFormato = subTotal - viaticos;




  // TOTAL (Yajalón): todo – (lo cobrado en Tuxtla) – por cobrar – descuentos
  const total = (totalPasajeros + totalPaqueteria )- totalDescuentos;

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
      setFormulario({ concepto: "", descripcion: "", importe: "" });
      await CrearDescuentoYajalon(nuevo);
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
    if (!choferSeleccionado) {
  Swal.fire({ icon: "warning", title: "Selecciona un chofer para el corte" });
  return;
}


    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const M = { l: 40, r: 40, t: 40, b: 40 };
    const pageW = doc.internal.pageSize.getWidth();

    const v = viajeSeleccionado;
    const conductor = choferSeleccionado?.nombre ?? "";

    // ====== Datos encabezado (como el formato) ======
    const fechaSalida = v?.fechaSalida ? new Date(v.fechaSalida) : new Date();
    const fechaTxt = fechaSalida.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
    const horaTxt  = fechaSalida.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

      const unidad = viajeSeleccionado?.unidad?.nombre ?? "";


    const pasajeros = Array.isArray(v?.pasajeros) ? v.pasajeros : [];
    const paquetes  = Array.isArray(v?.paquetes) ? v.paquetes : [];

    const N = (x) => (Number.isFinite(Number(x)) ? Number(x) : 0);
    const boletos = N(v?.totalPasajeros);
    const paq = N(v?.totalPaqueteria);
    const subTotal = boletos + paq;
    const viaticos = descuentos.reduce((acc, d) => acc + N(d.importe), 0);
    const totalFormato = subTotal - viaticos;

    const money = (n) =>
      new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n || 0));

    const drawHeader = () => {
      let y = M.t;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("UNION DE TRANSPORTISTAS LOS YAJALONES S.C. DE R.L. DE C.V.", pageW / 2, y, { align: "center" });
      y += 14;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("TERMINAL EN YAJALON", pageW / 2, y, { align: "center" });
      y += 12;
      doc.text("2a. PONIENTE NORTE S/N", pageW / 2, y, { align: "center" });
      y += 12;
      doc.text("YAJALON, CHIAPAS", pageW / 2, y, { align: "center" });
      y += 18;

      // Línea + campos FECHA / HORA / CONDUCTOR / UNIDAD (como el formato)
      doc.setLineWidth(0.7);
      doc.line(M.l, y, pageW - M.r, y);
      y += 12;

      doc.setFont("helvetica", "bold");
      doc.text("FECHA:", M.l, y);
      doc.setFont("helvetica", "normal");
      doc.text(fechaTxt, M.l + 45, y);

      doc.setFont("helvetica", "bold");
      doc.text("HORA:", pageW - M.r - 160, y);
      doc.setFont("helvetica", "normal");
      doc.text(horaTxt, pageW - M.r - 120, y);

      y += 14;

      doc.setFont("helvetica", "bold");
      doc.text("CONDUC:", M.l, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(conductor || "").toUpperCase(), M.l + 58, y);

      doc.setFont("helvetica", "bold");
      doc.text("UNIDAD:", pageW - M.r - 160, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(unidad), pageW - M.r - 110, y);

      y += 10;
      return y;
    };

    let y = drawHeader() + 10;

    // ====== PASAJEROS ======
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setFillColor(207, 227, 211);
    doc.rect(M.l, y, pageW - M.l - M.r, 18, "F");
    doc.text("PASAJEROS", pageW / 2, y + 12, { align: "center" });
    y += 22;

    autoTable(doc, {
      startY: y,
      theme: "grid",
      styles: { fontSize: 8.5, cellPadding: 4, lineWidth: 0.6 },
      headStyles: { fillColor: [230, 240, 233], textColor: [0, 0, 0], fontStyle: "bold" },
      margin: { left: M.l, right: M.r },
      head: [[ "No. de Asiento", "Nombre", "Destino", "Folio", "Importe" ]],
      body: pasajeros.map((p) => ([
        p.asiento ?? p.noAsiento ?? p.numAsiento ?? "",
        p.nombre ?? "",
        p.destino ?? v?.destino ?? "",
        p.folio ?? "",
        `$ ${money(p.importe)}`
      ])),
      didDrawPage: (data) => {
        if (data.pageNumber > 1) drawHeader();
      }
    });

    y = doc.lastAutoTable.finalY;

    // SUBTOTAL pasajeros
    autoTable(doc, {
      startY: y,
      theme: "grid",
      styles: { fontSize: 8.5, cellPadding: 4, lineWidth: 0.6 },
      margin: { left: M.l, right: M.r },
      body: [[
        { content: "SUB TOTAL", colSpan: 4, styles: { halign: "right", fontStyle: "bold", fillColor: [233, 244, 236] } },
        { content: `$ ${money(boletos)}`, styles: { halign: "right", fontStyle: "bold", fillColor: [233, 244, 236] } }
      ]]
    });

    y = doc.lastAutoTable.finalY + 14;

    // ====== PAQUETERÍA ======
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setFillColor(207, 227, 211);
    doc.rect(M.l, y, pageW - M.l - M.r, 18, "F");
    doc.text("PAQUETERIA", pageW / 2, y + 12, { align: "center" });
    y += 22;

    autoTable(doc, {
      startY: y,
      theme: "grid",
      styles: { fontSize: 8.5, cellPadding: 4, lineWidth: 0.6 },
      headStyles: { fillColor: [230, 240, 233], textColor: [0, 0, 0], fontStyle: "bold" },
      margin: { left: M.l, right: M.r },
      head: [[ "Guia", "Remitente", "Destinatario", "Contenido", "Importe" ]],
      body: paquetes.map((p) => {
        const destinatario = `${p.destinatario ?? ""}${p.porCobrar ? "(POR COBRAR)" : ""}`;
        return [
          p.folio ?? "",
          p.remitente ?? "",
          destinatario,
          p.contenido ?? "",
          `$ ${money(p.importe)}`
        ];
      }),
      didDrawPage: (data) => {
        if (data.pageNumber > 1) drawHeader();
      }
    });

    y = doc.lastAutoTable.finalY;

    // SUBTOTAL paquetería
    autoTable(doc, {
      startY: y,
      theme: "grid",
      styles: { fontSize: 8.5, cellPadding: 4, lineWidth: 0.6 },
      margin: { left: M.l, right: M.r },
      body: [[
        { content: "SUB TOTAL", colSpan: 4, styles: { halign: "right", fontStyle: "bold", fillColor: [233, 244, 236] } },
        { content: `$ ${money(paq)}`, styles: { halign: "right", fontStyle: "bold", fillColor: [233, 244, 236] } }
      ]]
    });

    y = doc.lastAutoTable.finalY + 14;

    // ====== DESCUENTOS + CUADRO FINAL ======
    const leftW = (pageW - M.l - M.r) * 0.62;
    const rightW = (pageW - M.l - M.r) - leftW - 12;

    // Encabezado DESCUENTOS
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setFillColor(207, 227, 211);
    doc.rect(M.l, y, leftW, 18, "F");
    doc.text("DESCUENTOS", M.l + leftW / 2, y + 12, { align: "center" });

    // Encabezado cuadrito totales
    doc.rect(M.l + leftW + 12, y, rightW, 18, "F");

    y += 22;

    // 4 renglones como el formato (aunque haya menos descuentos)
    const rows = Array.from({ length: 4 }).map((_, idx) => {
      const d = descuentos[idx];
      return [
        String(idx + 1),
        d?.descripcion ?? "",
        d?.concepto ?? "",
        d?.importe != null ? `$ ${money(d.importe)}` : ""
      ];
    });

    autoTable(doc, {
      startY: y,
      theme: "grid",
      tableWidth: leftW,
      margin: { left: M.l },
      styles: { fontSize: 8.5, cellPadding: 4, lineWidth: 0.6 },
      headStyles: { fillColor: [230, 240, 233], textColor: [0, 0, 0], fontStyle: "bold" },
      head: [[ "", "Descripcion", "Concepto", "Cantidad" ]],
      body: rows
    });

    // Cuadrito derecho (como el formato)
    const boxX = M.l + leftW + 12;
    const boxY = y;
    const rowH = 16;

    const boxRows = [
      ["BOLETOS", `$ ${money(boletos)}`],
      ["PAQUETERIA", `$ ${money(paq)}`],
      ["SUB TOTAL", `$ ${money(subTotal)}`],
      ["VIATICOS", `$ ${money(viaticos)}`],
      ["TOTAL", `$ ${money(totalFormato)}`],
    ];

    // Dibuja “tabla” simple a mano para que quede igualita
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.rect(boxX, boxY, rightW, rowH * boxRows.length);

    for (let i = 0; i < boxRows.length; i++) {
      const yy = boxY + i * rowH;

      // línea horizontal
      if (i > 0) doc.line(boxX, yy, boxX + rightW, yy);

      // división vertical
      doc.line(boxX + rightW * 0.62, yy, boxX + rightW * 0.62, yy + rowH);

      const [k, val] = boxRows[i];

      // fondo leve en TOTAL
      if (k === "TOTAL") {
        doc.setFillColor(233, 244, 236);
        doc.rect(boxX, yy, rightW, rowH, "F");
        doc.setDrawColor(0);
        doc.rect(boxX, yy, rightW, rowH);
      }

      doc.setTextColor(0);
      doc.text(k, boxX + 6, yy + 12);
      doc.text(val, boxX + rightW - 6, yy + 12, { align: "right" });
    }

    // Guardar
    const fileName = buildYajalonPdfName(viajeSeleccionado);
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
    <div className="flex gap-3 p-1 h-[calc(100vh-112px)] overflow-y-auto">
      {/* Izquierda: Descuento + Resumen */}
      <div className="w-1/3 flex flex-col gap-6 h-full min-h-0">
        <div className="bg-[#fff7ec] p-4 rounded-lg shadow-md">
          <h3 className="text-orange-700 font-bold mb-2 text-base">Agregar Descuento</h3>

          <label className="block text-orange-700 font-semibold mb-1 text-sm">Concepto</label>
          <input
            type="text"
            className="w-full p-2 rounded-md bg-[#ffe0b2] outline-none mb-2 text-sm"
            value={formulario.concepto}
            onChange={(e) => setFormulario({ ...formulario, concepto: e.target.value })}
          />

          <label className="block text-orange-700 font-semibold mb-1 text-sm">Descripción</label>
          <textarea
            className="w-full p-2 rounded-md bg-[#ffe0b2] outline-none mb-2 text-sm"
            value={formulario.descripcion}
            onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })}
          />

          <label className="block text-orange-700 font-semibold mb-1 text-sm">Importe</label>
          <input
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
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
                  {/* Selector de chofer (para el PDF) */}
        <div className="mt-4">
          <h3 className="text-orange-700 font-bold mb-2 text-base">Chofer</h3>

          <select
            value={choferSeleccionado?.idChofer || ""}
            onChange={(e) => {
              const id = Number(e.target.value);
              const ch = choferes.find(c => c.idChofer === id);
              setChoferSeleccionado(ch || null);
            }}
            className="w-full p-2 rounded-md bg-[#ffe0b2] outline-none ring-1 ring-orange-200 focus:ring-2 focus:ring-orange-300 text-sm"
          >
            <option value="">-- Selecciona un chofer --</option>
            {choferes.map((c) => (
              <option key={c.idChofer} value={c.idChofer}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        </div>



        <div className="bg-white p-4 rounded-lg shadow-md h-2/3">
          <h3 className="text-orange-700 font-bold mb-2 text-base">Resumen del viaje</h3>
          <ul className="space-y-2 text-[13px] text-orange-800">
            <li className="flex justify-between"><span>BOLETOS</span> <span>${boletos.toFixed(2)}</span></li>
            <li className="flex justify-between"><span>PAQUETERÍA</span> <span>${paq.toFixed(2)}</span></li>
            <li className="flex justify-between font-semibold"><span>SUB TOTAL</span> <span>${subTotal.toFixed(2)}</span></li>
            <li className="flex justify-between"><span>VIÁTICOS</span> <span>${viaticos.toFixed(2)}</span></li>
            <li className="flex justify-between font-bold text-base"><span>TOTAL</span> <span>${totalFormato.toFixed(2)}</span></li>
          </ul>

          <button
            className="bg-[#cc4500] text-white font-semibold py-2 rounded-md w-full mt-4 hover:bg-orange-800 text-sm"
            onClick={generarPDF}
          >
            PDF
          </button>
        </div>
      </div>

      {/* Derecha: selector + tablas */}
      <div className="w-2/3 flex flex-col gap-3 h-full min-h-0">
        <div className="bg-white p-3 rounded-lg shadow-md">
          <h3 className="text-orange-700 font-bold mb-2 text-base">Seleccionar Viaje</h3>

          <div className="flex items-center gap-3">
            {/* SELECT filtrado */}
            <select
              value={viajeSeleccionado?.idViaje || ""}
              onChange={(e) => seleccionarViaje(Number(e.target.value))}
              className="flex-1 p-2 rounded-md bg-[#ffe0b2] outline-none ring-1 ring-orange-200 focus:ring-2 focus:ring-orange-300 text-sm"
            >
              <option value="">-- Selecciona un viaje --</option>
              {viajesFiltrados.map((vv) => (
                <option key={vv.idViaje} value={vv.idViaje}>
                  {vv.origen} → {vv.destino} | {new Date(vv.fechaSalida).toLocaleString("es-MX", {
                    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
                  })}
                </option>
              ))}
            </select>

            {/* HOY / TODOS (compacto) */}
            <div className="shrink-0 inline-flex rounded-md overflow-hidden ring-1 ring-orange-200 bg-[#ffe0b2]">
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
                  className={`px-2.5 py-1.5 text-xs font-medium text-[#452B1C] transition
                    ${i > 0 ? "border-l border-orange-200" : ""}
                    ${filtroFecha === opt.key ? "bg-orange-600 text-white" : "bg-orange-100 text-orange-700 hover:bg-orange-200"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pasajeros */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-base font-bold text-orange-700 mb-2">PASAJEROS</h3>

            <div className="overflow-y-auto max-h-[240px] rounded-md ring-1 ring-orange-100">
              <table className="w-full table-fixed border-collapse text-xs">
                <thead className="bg-[#f8c98e] sticky top-0 z-10">
                  <tr className="h-9">
                    <th className="p-2 text-center text-[#452B1C] w-[70px]">No. Asiento</th>
                    <th className="p-2 text-center text-[#452B1C]">Nombre</th>
                    <th className="p-2 text-center text-[#452B1C] w-[90px]">Destino</th>
                    <th className="p-2 text-center text-[#452B1C] w-[90px]">Folio</th>
                    <th className="p-2 text-center text-[#452B1C] w-[90px]">Importe</th>
                  </tr>
                </thead>

                <tbody>
                  {pasajeros.map((p, i) => (
                    <tr key={i} className={`h-9 ${i % 2 === 0 ? "bg-[#f7fbf8]" : ""}`}>
                      <td className="p-2 text-center whitespace-nowrap">
                        {p.asiento ?? p.noAsiento ?? p.numAsiento ?? ""}
                      </td>
                      <td className="p-2 text-left whitespace-nowrap">{p.nombre ?? ""}</td>
                      <td className="p-2 text-center whitespace-nowrap">
                        {p.destino ?? viajeSeleccionado?.destino ?? ""}
                      </td>
                      <td className="p-2 text-center whitespace-nowrap">{p.folio ?? ""}</td>
                      <td className="p-2 text-right whitespace-nowrap">
                        ${Number(p.importe || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}

                  {/* SUBTOTAL como el formato */}
                  <tr className="font-bold bg-[#f8c98e]">
                    <td colSpan={4} className="p-2 text-right">SUB TOTAL</td>
                    <td className="p-2 text-right">${Number(totalPasajeros || 0).toFixed(2)}</td>
                  </tr>

                  {pasajeros.length === 0 && (
                    <tr><td colSpan="5" className="text-center py-3 text-gray-500">Sin registros.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>


      {/* Paquetería */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-base font-bold text-orange-700 mb-2">PAQUETERÍA</h3>

          <div className="overflow-y-auto max-h-[240px] rounded-md ring-1 ring-orange-100">
            <table className="w-full table-fixed border-collapse text-xs">
              <thead className="bg-[#f8c98e] sticky top-0 z-10">
                <tr className="h-9">
                  <th className="p-2 text-center text-[#452B1C] w-[110px]">Guía</th>
                  <th className="p-2 text-center text-[#452B1C]">Remitente</th>
                  <th className="p-2 text-center text-[#452B1C]">Destinatario</th>
                  <th className="p-2 text-center text-[#452B1C] w-[120px]">Contenido</th>
                  <th className="p-2 text-center text-[#452B1C] w-[90px]">Importe</th>
                </tr>
              </thead>

              <tbody>
                {paquetes.map((p, i) => {
                  const destinatario = `${p.destinatario ?? ""}${p.porCobrar ? " (POR COBRAR)" : ""}`;
                  return (
                    <tr key={i} className={`h-9 ${i % 2 === 0 ? "bg-[#f7fbf8]" : ""}`}>
                      <td className="p-2 text-center whitespace-nowrap">{p.folio ?? ""}</td>
                      <td className="p-2 text-left whitespace-nowrap">{p.remitente ?? ""}</td>
                      <td className="p-2 text-left whitespace-nowrap">{destinatario}</td>
                      <td className="p-2 text-center whitespace-nowrap">{p.contenido ?? ""}</td>
                      <td className="p-2 text-right whitespace-nowrap">${Number(p.importe || 0).toFixed(2)}</td>
                    </tr>
                  );
                })}

                {/* SUBTOTAL */}
                <tr className="font-bold bg-[#f8c98e]">
                  <td colSpan={4} className="p-2 text-right">SUB TOTAL</td>
                  <td className="p-2 text-right">${Number(totalPaqueteria || 0).toFixed(2)}</td>
                </tr>

                {paquetes.length === 0 && (
                  <tr><td colSpan="5" className="text-center py-3 text-gray-500">Sin registros.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
