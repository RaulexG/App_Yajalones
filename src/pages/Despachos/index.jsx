// src/pages/Despachos/index.jsx
import { useEffect, useState } from "react";
import DespachoYaja from "./DespachoYaja";
import DespachoTux from "./DespachoTux";

export default function DespachosIndex() {
  const [terminal, setTerminal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const user = await window.session?.getUser?.();
        if (mounted) {
          setTerminal(user?.terminal || null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return null; // o spinner

  if (terminal === "YAJALON") return <DespachoYaja />;
  if (terminal === "TUXTLA") return <DespachoTux />;

  // fallback (si no detecta terminal)
  return <div>No se pudo determinar la terminal</div>;
}
