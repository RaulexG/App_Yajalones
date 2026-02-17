import { useEffect, useState, useMemo } from 'react';
import {
  CrearPasajeros,
  ListarTurnos,
  ListarViajes,
  ObtenerViajePorId,
  ActualizarPasajero,
  EliminarPasajero,
  ListarChoferes
} from '../../services/Admin/adminService';
import Swal from 'sweetalert2';
import { useTerminal } from "../../hooks/useTerminal";

/* -------------------- Helpers -------------------- */
const esTuxtla = (s = "") => s.toLowerCase().includes("tuxtla");
const esYajalon = (s = "") => s.toLowerCase().includes("yajal");

const getCobroPorTerminal = (viaje, pasajero) => {
  const origenViaje = viaje?.origen || "";
  const destinoViaje = viaje?.destino || "";

  const rutaTuxtlaYajalon = esTuxtla(origenViaje) && esYajalon(destinoViaje);
  const rutaYajalonTuxtla = esYajalon(origenViaje) && esTuxtla(destinoViaje);

  const importe = Number(pasajero?.importe || 0);

  // default: nada
  let pagoTuxtla = 0;
  let pagoYajalon = 0;

  // Reglas:
  // - tipoPago === "PAGADO": se cobra en el ORIGEN del viaje
  // - tipoPago === "DESTINO": se cobra en el DESTINO del viaje
  // - tipoPago === "SCLC": SIEMPRE se cobra en YAJALÓN (como dijiste)
  if (pasajero?.tipoPago === "SCLC") {
    pagoYajalon = importe;
    return { pagoTuxtla, pagoYajalon };
  }

  if (pasajero?.tipoPago === "PAGADO") {
    if (esTuxtla(origenViaje)) pagoTuxtla = importe;
    else if (esYajalon(origenViaje)) pagoYajalon = importe;
    return { pagoTuxtla, pagoYajalon };
  }

  if (pasajero?.tipoPago === "DESTINO") {
    if (esTuxtla(destinoViaje)) pagoTuxtla = importe;
    else if (esYajalon(destinoViaje)) pagoYajalon = importe;
    return { pagoTuxtla, pagoYajalon };
  }

  // fallback por si llega algo raro
  if (rutaTuxtlaYajalon) {
    // si no sabemos, ponlo en origen
    pagoTuxtla = importe;
  } else if (rutaYajalonTuxtla) {
    pagoYajalon = importe;
  }

  return { pagoTuxtla, pagoYajalon };
};

const formatFecha = (dLike) => {
  const d = new Date(dLike);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
};
const formatHora = (dLike) => { const d = new Date(dLike); if (Number.isNaN(d.getTime())) return ''; const p = (n) => String(n).padStart(2, '0'); return `${p(d.getHours())}:${p(d.getMinutes())}`; };
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const startOfYesterday = () => {
  const d = startOfToday();
  d.setDate(d.getDate() - 1);
  return d;
};

const getOrigenDestinoPasajero = (viaje, pasajero) => {
  const origenViaje = viaje?.origen || "";
  const destinoViaje = viaje?.destino || "";

  const rutaTuxtlaYajalon = esTuxtla(origenViaje) && esYajalon(destinoViaje);
  const rutaYajalonTuxtla = esYajalon(origenViaje) && esTuxtla(destinoViaje);

  // default: lo del viaje
  let origen = origenViaje;
  let destino = destinoViaje;

  if (pasajero?.tipoPago === "SCLC") {
    if (rutaTuxtlaYajalon) {
      // Tuxtla -> Yajalón, comprado en SCLC: origen SCLC, destino Yajalón
      origen = "SCLC";
      destino = destinoViaje; // Yajalón
    } else if (rutaYajalonTuxtla) {
      // Yajalón -> Tuxtla, comprado en SCLC: origen Yajalón, destino SCLC
      origen = origenViaje;   // Yajalón
      destino = "SCLC";
    }
  }

  return { origen, destino };
};


/* -------------------- Componente -------------------- */
export default function Pasajeros() {
  const [turnos, setTurnos] = useState([]);
  const [viajes, setViajes] = useState([]);
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);
  const [asientosOcupados, setAsientosOcupados] = useState([]);
  const [idPasajeroEditando, setIdPasajeroEditando] = useState(null);
  const terminal = useTerminal();
  const esTuxtla1 = terminal === "TUXTLA"

  const [turnoSeleccionado, setTurnoSeleccionado] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('HOY'); // HOY | TODOS

  const [choferes, setChoferes] = useState([]);
  const esTuxtla = (s = "") => s.toLowerCase().includes("tuxtla");
  const esYajalon = (s = "") => s.toLowerCase().includes("yajal");


const [formulario, setFormulario] = useState({
  nombreCompleto: '',
  nombre: '',
  apellido: '',
  origen: '',
  destino: '',
  fechaSalida: '',
  hora: '',
  tipo: 'ADULTO',
  tipoPago: 'PAGADO',
  asiento: null,
  viaje: null
});


  /* Carga inicial */
  useEffect(() => {
    (async () => {
      try {
        const [dataTurnos, dataViajes, dataChoferes] = await Promise.all([
          ListarTurnos(),
          ListarViajes(),
          ListarChoferes()
        ]);
        setTurnos(Array.isArray(dataTurnos) ? dataTurnos : []);
        setViajes(Array.isArray(dataViajes) ? dataViajes : []);
        setChoferes(Array.isArray(dataChoferes) ? dataChoferes : []);
      } catch {
        Swal.fire({
          icon: 'error',
          title: 'No se pudieron cargar datos',
          text: 'Verifica tu conexión.'
        });
      }
    })();
  }, []);

  const pagoOptions = useMemo(() => {
  const origen = viajeSeleccionado?.origen || "";
  // Regla:
  // - Si el viaje es Tuxtla → Yajalón:
  //     "Tuxtla"    => PAGADO
  //     "Yajalón"   => DESTINO
  // - Si el viaje es Yajalón → Tuxtla:
  //     "Yajalón"   => PAGADO
  //     "Tuxtla"    => DESTINO
  // - "San Cristóbal" siempre => SCLC

  const tuxtlaEsPagado  = esTuxtla(origen);
  const yajalEsPagado   = esYajalon(origen);

  return [
    { label: "Tuxtla",      value: tuxtlaEsPagado ? "PAGADO" : "DESTINO" },
    { label: "Yajalón",     value: yajalEsPagado  ? "PAGADO" : "DESTINO" },
    { label: "San Cristóbal", value: "SCLC" },
  ];
}, [viajeSeleccionado]);


  /* Viajes filtrados por turno + fecha */
  const viajesFiltrados = useMemo(() => {
    const hoy0 = startOfToday();
    const mañana0 = new Date(hoy0.getTime() + 24 * 60 * 60 * 1000);
    const desdeAyer = startOfYesterday(); // para evitar saturación en "Todos"

    const pasaFiltroFecha = (fecha) => {
      const f = new Date(fecha);
      if (Number.isNaN(f.getTime())) return false;
      if (filtroFecha === 'HOY') return f >= hoy0 && f < mañana0;
      // "TODOS": mostramos desde ayer en adelante para no saturar
      return f >= desdeAyer;
    };

    const porTurno = (v) =>
      !turnoSeleccionado ||
      (v?.unidad?.turno?.idTurno ?? null) === Number(turnoSeleccionado);

    return (viajes || [])
      .filter((v) => porTurno(v) && pasaFiltroFecha(v.fechaSalida))
      .sort((a, b) => new Date(a.fechaSalida) - new Date(b.fechaSalida));
  }, [viajes, turnoSeleccionado, filtroFecha]);

  const manejarCambio = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

const manejarCambioAsiento = (numero) => {
  setFormulario((prev) => ({ ...prev, asiento: numero }));
};

const manejarNombreCompleto = (e) => {
  const value = e.target.value;

  setFormulario((prev) => {
    // Separa usando la versión "limpia" SOLO para calcular,
    // pero NO le quites al input el valor que el usuario está escribiendo.
    const clean = value.replace(/\s+/g, ' ').trim();

    const firstSpace = clean.indexOf(' ');

    let nombre = '';
    let apellido = '';

    if (firstSpace === -1) {
      nombre = clean;
      apellido = '';
    } else {
      nombre = clean.slice(0, firstSpace).trim();
      apellido = clean.slice(firstSpace + 1).trim();
    }

    return {
      ...prev,
      nombreCompleto: value, //  aquí se guarda tal cual lo escribe (con espacios)
      nombre,
      apellido
    };
  });
};



  const limpiarFormulario = () => {
    if (!viajeSeleccionado) {
      setFormulario({
        nombreCompleto: '',
        nombre: '',
        apellido: '',
        origen: '',
        destino: '',
        fechaSalida: '',
        hora: '',
        tipo: 'ADULTO',
        tipoPago: 'PAGADO',
        asiento: null,
        viaje: null
      });
      setIdPasajeroEditando(null);
      return;
    }

    setFormulario({
      nombreCompleto: '',
      nombre: '',
      apellido: '',
      origen: viajeSeleccionado.origen,
      destino: viajeSeleccionado.destino,
      fechaSalida: formatFecha(viajeSeleccionado.fechaSalida),
      hora: '',
      tipo: 'ADULTO',
      tipoPago: 'PAGADO',
      asiento: null,
      viaje: viajeSeleccionado
    });
    setIdPasajeroEditando(null);
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();

    if (!formulario.nombre.trim()) {
      Swal.fire({ icon: 'warning', title: 'Falta nombre' });
      return;
    }
    if (!formulario.viaje?.idViaje) {
      Swal.fire({ icon: 'warning', title: 'Selecciona un viaje' });
      return;
    }
    if (!formulario.asiento) {
      Swal.fire({ icon: 'warning', title: 'Selecciona un asiento' });
      return;
    }

    try {
      const viajeId = formulario.viaje.idViaje;
      const payload = {
        nombre: formulario.nombre.trim(),
        apellido: (formulario.apellido || 'xx').trim(),
        tipo: formulario.tipo,
        tipoPago: formulario.tipoPago,
        asiento: formulario.asiento,
        idViaje: viajeId
      };

      if (idPasajeroEditando) {
        await ActualizarPasajero(idPasajeroEditando, payload);
        Swal.fire({ icon: 'success', title: 'Pasajero actualizado', timer: 1200, showConfirmButton: false });
      } else {
        await CrearPasajeros(payload);
        Swal.fire({ icon: 'success', title: 'Pasajero agregado', timer: 1200, showConfirmButton: false });
      }

      const viajeActualizado = await ObtenerViajePorId(viajeId);
      setViajeSeleccionado({ ...viajeActualizado });
      setAsientosOcupados((viajeActualizado.pasajeros || []).map((p) => p.asiento));

      limpiarFormulario();
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: 'error', title: 'Error al guardar pasajero' });
    }
  };


  const empezarEdicionPasajero = (pasajero) => {
  if (!viajeSeleccionado) return;

  setIdPasajeroEditando(pasajero.idPasajero);

  setFormulario((prev) => ({
    ...prev,
    nombreCompleto: `${pasajero.nombre || ''}${pasajero.apellido ? ' ' + pasajero.apellido : ''}`,
    nombre: pasajero.nombre || '',
    apellido: pasajero.apellido || '',
    tipo: pasajero.tipo || 'ADULTO',
    tipoPago: pasajero.tipoPago || 'PAGADO',
    asiento: pasajero.asiento,
    viaje: viajeSeleccionado,
    origen: viajeSeleccionado.origen,
    destino: viajeSeleccionado.destino,
    fechaSalida: formatFecha(viajeSeleccionado.fechaSalida),
    hora: '',
  }));
};

  const eliminarPasajero = async (idPasajero) => {
    try {
      const result = await Swal.fire({
        icon: 'question',
        title: '¿Eliminar pasajero?',
        showCancelButton: true,
        confirmButtonText: 'Sí',
        cancelButtonText: 'No',
        reverseButtons: true
      });

      if (!result.isConfirmed) return;

      await EliminarPasajero(idPasajero);
      Swal.fire({ icon: 'success', title: 'Pasajero eliminado', timer: 1100, showConfirmButton: false });

      if (formulario.viaje?.idViaje) {
        const v = await ObtenerViajePorId(formulario.viaje.idViaje);
        setViajeSeleccionado(v);
        setAsientosOcupados((v.pasajeros || []).map((p) => p.asiento));
      }
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: 'error', title: 'Error al eliminar pasajero' });
    }
  };

  const ObtenerAsientos = (unidad) => parseInt(unidad?.numeroPasajeros || 20, 10);

const manejarSeleccionViaje = (viaje) => {
  setViajeSeleccionado(viaje);

  // por defecto: origen = PAGADO
  const tipoPagoDefault = esTuxtla(viaje.origen)
    ? "PAGADO"   // si el origen es Tuxtla
    : esYajalon(viaje.origen)
      ? "PAGADO" // si el origen es Yajalón
      : "PAGADO"; // fallback

  setFormulario((prev) => ({
    ...prev,
    viaje,
    origen: viaje.origen,
    destino: viaje.destino,
    fechaSalida: formatFecha(viaje.fechaSalida),
    hora: '',
    asiento: null,
    tipoPago: tipoPagoDefault,
  }));

  setAsientosOcupados((viaje.pasajeros || []).map((p) => p.asiento));
  setIdPasajeroEditando(null);
};
const getLugarPago = (viaje, pasajero) => {
  const origenViaje = viaje?.origen || "";
  const destinoViaje = viaje?.destino || "";

  // SCLC: siempre se cobra/paga en Yajalón (según tu regla)
  if (pasajero?.tipoPago === "SCLC") return "Yajalón";

  // PAGADO: pagó en el ORIGEN del viaje
  if (pasajero?.tipoPago === "PAGADO") {
    if (esTuxtla(origenViaje)) return "Tuxtla";
    if (esYajalon(origenViaje)) return "Yajalón";
    return origenViaje || "Origen";
  }

  // DESTINO: paga en el DESTINO del viaje
  if (pasajero?.tipoPago === "DESTINO") {
    if (esTuxtla(destinoViaje)) return "Tuxtla";
    if (esYajalon(destinoViaje)) return "Yajalón";
    return destinoViaje || "Destino";
  }

  return "N/D";
};



  const choferAsignado = viajeSeleccionado
    ? choferes.find((c) => c.unidad?.idUnidad === viajeSeleccionado.unidad?.idUnidad)
    : null;

function generarTicketHTML(pasajero, viaje, escala = 1, width = 58, margin = 0) {
  const { origen, destino } = getOrigenDestinoPasajero(viaje, pasajero);
  const lugarPago = getLugarPago(viaje, pasajero);

  const fechaSalida = new Date(viaje?.fechaSalida);
  const fechaHoraStr = Number.isNaN(fechaSalida.getTime())
    ? ""
    : `${fechaSalida.toLocaleDateString("es-MX")} ${fechaSalida.toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;

  const costo = Number(pasajero?.importe ?? 0).toFixed(2);

  return `
  <html>
  <head>
    <style>
      @page { size: auto; margin: 0; }
      body {
        margin: ${margin}mm;
        padding: 0;
        width: ${width}mm;
        font-family: monospace;
        font-size: 3.2mm;
        line-height: 1.35;
      }
      .ticket {
        width: ${width}mm;
        margin: ${margin}mm;
        padding: 0;
        transform: scale(${escala});
        transform-origin: top left;
      }
      .center { text-align: center; }
      .bold { font-weight: bold; font-size: 4mm; }
      .sep {
        border-top: 2px dashed #000;
        margin: 10px 0;
      }
      .data {
        font-size: 3.4mm;
        border-top: 2px dashed #000;
        border-bottom: 2px dashed #000;
        padding: 10px 0;
      }
      .row { margin: 3px 0; }
      .label { font-weight: bold; }
      .box {
        border: 2px dashed #000;
        margin: 14px 0;
        padding: 10px;
        font-size: 2.6mm;
        text-align: center;
      }
    </style>
  </head>

  <body>
    <div class="ticket">
      <div class="center bold">
        Unión de Transportistas<br>
        Los Yajalones S.C. de R.L. de C.V.
      </div>

      <div class="center" style="font-size:3.2mm; margin-bottom:10px;">
        R.F.C. UTY-090617-ANA<br>
        2da. Calle Poniente Norte S/N, Centro, Yajalón, Chiapas<br>
        Tel: 919 67 4 2114 — Whatsapp: 919 145 9711
      </div>

      <div class="center" style="font-size:3.2mm; margin-bottom:10px;">
        Terminal Tuxtla Gutiérrez<br>
        15 Oriente sur #817 entre 7ma y 8va sur<br>
        Tel: 961 106 6523
      </div>

      <div class="data">
        <div class="row"><span class="label">Fecha:</span> ${fechaHoraStr}</div>
        <div class="row"><span class="label">Folio:</span> ${pasajero?.folio ?? ""}</div>
        <div class="row"><span class="label">Asiento:</span> ${pasajero?.asiento ?? ""}</div>
        <div class="row"><span class="label">Nombre:</span> ${(pasajero?.nombre ?? "")} ${(pasajero?.apellido ?? "")}</div>
        <div class="row"><span class="label">Origen:</span> ${origen ?? ""}</div>
        <div class="row"><span class="label">Destino:</span> ${destino ?? ""}</div>
        <div class="row"><span class="label">Lugar de pago:</span> ${lugarPago}</div>
        <div class="row"><span class="label">Costo del boleto:</span> $${costo}</div>
      </div>

      <div style="font-size:3.0mm; margin-top:10px; text-align:justify;">
        Favor de estar 20 minutos antes de la salida.<br>
        Verifique fecha y hora; la empresa no se hace responsable.
      </div>

      <div class="box">
        Este boleto le da derecho al seguro del viajero.<br>
        Consérvelo para validación.
      </div>

      <div class="center" style="font-size:3.0mm; margin-top:10px;">
        Fecha de venta: ${new Date().toLocaleDateString("es-MX")}
      </div>
    </div>
  </body>
  </html>
  `;
}







  /* -------------------- UI -------------------- */
  return (
    // Altura visible del viewport menos la barra superior
    <div className="min-h-[calc(100dvh-88px)] w-full">
      {/* ancho útil amplio en FHD y centrado */}
      <div className="mx-auto h-full w-full max-w-[1760px] 2xl:max-w-[1880px] px-3 md:px-4 xl:px-6 py-2 box-border">
  
        {/* Grid maestro: panel izquierdo + tabla derecha */}
        <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[minmax(280px,320px)_1fr] xl:grid-cols-[minmax(300px,360px)_1fr] gap-4">
  
          {/* IZQUIERDA */}
          <div className="min-w-0">
            <form onSubmit={manejarEnvio} className="bg-white p-4 rounded-md shadow-md text-[12px] md:text-[13px] lg:text-sm">
              {/* Nombre completo */}
                <div>
                  <label className="block text-orange-700 font-semibold mb-1">Nombre</label>
                  <input
                    type="text"
                    name="nombreCompleto"
                    value={formulario.nombreCompleto}
                    onChange={manejarNombreCompleto}
                    className="w-full p-2.5 rounded-md bg-orange-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ej: Juan Pérez López"
                    required
                  />

                </div>
  
              {/* Tipo de boleto / pago */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2.5">
                <div>
                  <label className="block text-orange-700 font-semibold mb-1">Tipo de boleto</label>
                  <select
                    name="tipo"
                    value={formulario.tipo}
                    onChange={manejarCambio}
                    className="w-full p-2 rounded-md bg-orange-100 text-gray-800"
                  >
                    <option value="ADULTO">Adulto</option>
                    <option value="NIÑO">Niño</option>
                    <option value="INCENT_INAPAM">INAPAM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-orange-700 font-semibold mb-1">Tipo de pago</label>
                  <select
                    name="tipoPago"
                    value={formulario.tipoPago}
                    onChange={manejarCambio}
                    className="w-full p-2 rounded-md bg-orange-100 text-gray-800"
                    disabled={!viajeSeleccionado} // opcional: obliga a elegir viaje primero
                  >
                    {pagoOptions.map(opt => (
                      <option key={opt.label} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

              </div>
  
              {/* Asientos */}
              <div className="bg-orange-50 p-3 rounded-md mt-3">
                <p className="text-orange-700 font-semibold mb-2">Seleccionar asiento</p>
                <div className="grid grid-cols-4 gap-2.5 justify-items-center">
                  {[...Array(ObtenerAsientos(viajeSeleccionado?.unidad))].map((_, i) => {
                    const numero = i + 1;
                    const ocupado = asientosOcupados.includes(numero);
                    const seleccionado = formulario.asiento === numero;
                    return (
                      <button
                        key={numero}
                        type="button"
                        onClick={() => !ocupado && manejarCambioAsiento(numero)}
                        disabled={ocupado}
                        className="flex flex-col items-center"
                        title={ocupado ? 'Asiento ocupado' : 'Seleccionar asiento'}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                             className={`w-6 h-6 md:w-7 md:h-7 ${ocupado ? 'text-orange-900' : seleccionado ? 'text-orange-700' : 'text-orange-500'}`}>
                          <path fill="currentColor" d="M5.35 5.64c-.9-.64-1.12-1.88-.49-2.79c.63-.9 1.88-1.12 2.79-.49c.9.64 1.12 1.88.49 2.79c-.64.9-1.88 1.12-2.79.49M16 20c0-.55-.45-1-1-1H8.93c-1.48 0-2.74-1.08-2.96-2.54L4.16 7.78A.976.976 0 0 0 3.2 7c-.62 0-1.08.57-.96 1.18l1.75 8.58A5.01 5.01 0 0 0 8.94 21H15c.55 0 1-.45 1-1m-.46-5h-4.19l-1.03-4.1c1.28.72 2.63 1.28 4.1 1.3c.58.01 1.05-.49 1.05-1.07c0-.59-.49-1.04-1.08-1.06c-1.31-.04-2.63-.56-3.61-1.33L9.14 7.47c-.23-.18-.49-.3-.76-.38a2.2 2.2 0 0 0-.99-.06h-.02a2.27 2.27 0 0 0-1.84 2.61l1.35 5.92A3.01 3.01 0 0 0 9.83 18h6.85l3.09 2.42c.42.33 1.02.29 1.39-.08c.45-.45.4-1.18-.1-1.57l-4.29-3.35a2 2 0 0 0-1.23-.42"/>
                        </svg>
                        <span className={`text-[10px] md:text-[11px] font-bold ${ocupado ? 'text-orange-900' : seleccionado ? 'text-orange-700' : 'text-orange-500'}`}>
                          {numero.toString().padStart(2, '0')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
  
              {/* Unidad / Chofer */}
              <div className="text-center mt-2 text-orange-700 font-semibold text-[12px]">
                Unidad {viajeSeleccionado?.unidad?.nombre || 'N/A'} — {choferAsignado ? `${choferAsignado.nombre} ${choferAsignado.apellido}` : 'No asignado'}
              </div>
  
              {/* Botón */}
              <div className="flex justify-center mt-3">
                <button type="submit" className="bg-[#C44706] text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-800 transition">
                  Guardar
                </button>
              </div>
            </form>
          </div>
  
          {/* DERECHA */}
          <div className="min-w-0 flex flex-col">
            {/* Filtros */}
            <div className="bg-[#FDF7F0] p-3 rounded-md shadow-md text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_auto_2fr] gap-3 items-end">
                {/* Turno */}
                <div className="min-w-0">
                  <label className="block text-orange-700 font-semibold mb-1">Turno</label>
                  <select
                    className="w-full p-2.5 rounded-md bg-orange-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    value={turnoSeleccionado}
                    onChange={(e) => setTurnoSeleccionado(e.target.value)}
                  >
                    <option value="">Todos</option>
                    {turnos.map((t) => (
                      <option key={t.idTurno} value={t.idTurno}>{t.horario}</option>
                    ))}
                  </select>
                </div>
  
                {/* Mostrar */}
                <div className="shrink-0">
                  <label className="block text-orange-700 font-semibold mb-1">Mostrar</label>
                  <div className="inline-flex rounded-lg overflow-hidden ring-1 ring-orange-200">
                    {[
                      { key: 'HOY', label: 'Hoy' },
                      { key: 'TODOS', label: 'Todos' }
                    ].map(opt => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setFiltroFecha(opt.key)}
                        className={`px-4 py-2 text-sm font-semibold ${
                          filtroFecha === opt.key ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                        }`}
                        aria-pressed={filtroFecha === opt.key}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
  
                {/* Viaje */}
                <div className="min-w-0">
                  <label className="block text-orange-700 font-semibold mb-1">Viaje</label>
                  <select
                    className="w-full p-2.5 rounded-md bg-orange-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    value={String(viajeSeleccionado?.idViaje ?? '')}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      const v = viajesFiltrados.find(x => x.idViaje === id) || null;
                      if (v) manejarSeleccionViaje(v);
                      else {
                        setViajeSeleccionado(null);
                        setAsientosOcupados([]);
                        setFormulario(prev => ({ ...prev, viaje: null, origen: '', destino: '', fechaSalida: '', hora: '', asiento: null }));
                      }
                    }}
                  >
                    <option value="">Selecciona un viaje</option>
                    {viajesFiltrados.map(v => (
                      <option key={v.idViaje} value={String(v.idViaje)}>
                        {formatFecha(v.fechaSalida)} • {formatHora(v.fechaSalida)} — {v.unidad?.nombre || 'N/A'} → {v.destino || 'N/A'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
  
         {/* Columna derecha: Tabla */}
         <div className="bg-white p-4 rounded-md shadow-md w-full mx-auto">
          <h3 className="text-lg font-bold text-orange-700 mb-3">Lista de pasajeros</h3>
          <div className="overflow-x-auto overflow-y-auto max-h-[500px] custom-scroll">
            <table className="min-w-[900px] w-full border-collapse text-sm">

              {/* Encabezado */}
              <thead className="bg-[#FECF9D] text-orange-700 sticky top-0">
                    <tr>
                      <th className="px-2 py-2 text-center font-bold text-[#452B1C]">Folio</th>
                      <th className="px-2 py-2 text-center font-bold text-[#452B1C]">Asiento</th>
                      <th className="px-2 py-2 text-center font-bold text-[#452B1C] whitespace-nowrap">Fecha de salida</th>
                      <th className="px-2 py-2 text-center font-bold text-[#452B1C]">Nombre</th>
                      <th className="px-2 py-2 text-center font-bold text-[#452B1C]">Tipo</th>
                      <th className="px-2 py-2 text-center font-bold text-[#452B1C]">Origen</th>
                      <th className="px-2 py-2 text-center font-bold text-[#452B1C]">Destino</th>
                      <th className="px-2 py-2 text-center font-bold text-[#452B1C]">Pago Tuxtla</th>
                      <th className="px-2 py-2 text-center font-bold text-[#452B1C]">Pago Yajalon</th>
                      <th className="px-2 py-2 text-center font-bold text-[#452B1C]">Acciones</th>
                    </tr>
                  </thead>
  
                  <tbody className="align-top">
                    {viajeSeleccionado?.pasajeros?.length > 0 ? (
                      viajeSeleccionado.pasajeros.map((p, index) => {
                        const { origen, destino } = getOrigenDestinoPasajero(viajeSeleccionado, p);
                        const { pagoTuxtla, pagoYajalon } = getCobroPorTerminal(viajeSeleccionado, p);

                        return (
                          <tr
                            key={p.folio ?? `${p.idPasajero}-${index}`}
                            className={`hover:bg-orange-50 ${index % 2 === 0 ? 'bg-orange-50/40' : 'bg-white'}`}
                          >
                            <td className="px-2 py-1.5 text-center break-words">{p.folio ?? '-'}</td>
                            <td className="px-2 py-1.5 text-center">{p.asiento}</td>
                            <td className="px-2 py-1.5 text-center whitespace-nowrap">
                              {formatFecha(viajeSeleccionado.fechaSalida)}
                            </td>
                            <td className="px-2 py-1.5 text-center overflow-hidden text-ellipsis whitespace-nowrap">
                              {`${p.nombre ?? ''} ${p.apellido ?? ''}`.trim()}
                            </td>
                            <td className="px-2 py-1.5 text-center break-words">{p.tipo}</td>

                            {/* ORIGEN / DESTINO calculados */}
                            <td className="px-2 py-1.5 text-center break-words">{origen}</td>
                            <td className="px-2 py-1.5 text-center break-words">{destino}</td>

                            <td className="px-2 py-1.5 text-center font-semibold">
                                {pagoTuxtla > 0 ? `$${pagoTuxtla.toFixed(2)}` : "-"}
                              </td>
                              <td className="px-2 py-1.5 text-center font-semibold">
                                {pagoYajalon > 0 ? `$${pagoYajalon.toFixed(2)}` : "-"}
                              </td>
                            <td className="px-1 py-1.5 text-center">
                              {/* Botón Ticket */}
                              <button
                                onClick={async () => {
                                  try {
                                    const escala = esTuxtla1 ? 0.85 : 1;
                                    const width = esTuxtla1 ? 54 : 58;
                                    const margin = esTuxtla1 ? 2.5 : 0;
                                    const html = generarTicketHTML(p, viajeSeleccionado, escala, width, margin);
                                    await window.electronAPI.imprimirHTML({ html, copies: 1 });
                                    Swal.fire({ icon: 'success', title: 'Ticket impreso', timer: 1000, showConfirmButton: false });
                                  } catch (err) {
                                    console.error(err);
                                    Swal.fire({ icon: 'error', title: 'Error al imprimir ticket', timer: 1000, text: err.message || '' });
                                  }
                                }}
                                className="p-1 text-[#C14600] hover:text-orange-800 transition"
                                title="Imprimir ticket"
                                aria-label="Imprimir ticket"
                              >
                                {/* icono */}
                                <svg xmlns="http://www.w3.org/2000/svg" width="1.8em" height="1.8em" viewBox="0 0 24 24">
                                  <g fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18.353 14H19c.943 0 1.414 0 1.707-.293S21 12.943 21 12v-1c0-1.886 0-2.828-.586-3.414S18.886 7 17 7H7c-1.886 0-2.828 0-3.414.586S3 9.114 3 11v2c0 .471 0 .707.146.854C3.293 14 3.53 14 4 14h1.647" />
                                    <path d="M6 20.306V12c0-.943 0-1.414.293-1.707S7.057 10 8 10h8c.943 0 1.414 0 1.707.293S18 11.057 18 12v8.306c0 .317 0 .475-.104.55s-.254.025-.554-.075l-2.184-.728c-.078-.026-.117-.04-.158-.04s-.08.014-.158.04l-2.684.894c-.078.026-.117.04-.158.04s-.08-.014-.158-.04l-2.684-.894c-.078-.026-.117-.04-.158-.04s-.08.014-.158.04l-2.184.728c-.3.1-.45.15-.554.075S6 20.623 6 20.306ZM18 7V5.88c0-1.008 0-1.512-.196-1.897a1.8 1.8 0 0 0-.787-.787C16.632 3 16.128 3 15.12 3H8.88c-1.008 0-1.512 0-1.897.196a1.8 1.8 0 0 0-.787.787C6 4.368 6 4.872 6 5.88V7" />
                                    <path strokeLinecap="round" d="M10 14h3m-3 3h4.5" />
                                  </g>
                                </svg>
                              </button>

                              {/* Editar */}
                              <button
                                onClick={() => empezarEdicionPasajero(p)}
                                aria-label="Editar"
                                title="Editar"
                                className="p-1 rounded-md hover:bg-orange-100 text-[#C14600]"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 512 512"
                                  className="w-5 h-5"
                                >
                                  <path
                                    fill="currentColor"
                                    d="M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1L377.9 88L407 58.9c9.4-9.4 24.6-9.4 33.9 0zM209.8 256.2L344 121.9l46.1 46.1l-134.3 134.2c-2.9 2.9-6.5 5-10.4 6.1L186.9 325l16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6 100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487 138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25c-28.1-28.1-73.7-28.1-101.8 0M88 64c-48.6 0-88 39.4-88 88v272c0 48.6 39.4 88 88 88h272c48.6 0 88-39.4 88-88V312c0-13.3-10.7-24-24-24s-24 10.7-24 24v112c0 22.1-17.9 40-40 40H88c-22.1 0-40-17.9-40-40V152c0-22.1 17.9-40 40-40h112c13.3 0 24-10.7 24-24s-10.7-24-24-24z"
                                  />
                                </svg>
                              </button>

                              {/* Eliminar */}
                              <button
                                onClick={() => eliminarPasajero(p.idPasajero)}
                                className="p-1 text-[#C14600] hover:text-orange-800 transition"
                                title="Eliminar"
                                aria-label="Eliminar"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="1.8em" height="1.8em" viewBox="0 0 24 24">
                                  <path
                                    fill="currentColor"
                                    d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6z"
                                  />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ); 
                      })   
                    ) : (
                      <tr>
                        <td colSpan={10} className="text-center text-gray-500 p-4">
                          No hay pasajeros registrados
                        </td>
                      </tr>
                    )}

                  </tbody>
                </table>
              </div>
            </div>  
          </div>
        </div>
      </div>
    </div>
  );
}  


