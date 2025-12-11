// src/hooks/useTerminal.js
import { useEffect, useState } from "react";

export function useTerminal() {
  const [terminal, setTerminal] = useState(null); // 'YAJALON' | 'TUXTLA' | null

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const u = await window.session?.getUser?.(); // mismo que usas en DespachosGate
        if (!alive) return;
        setTerminal(u?.terminal || null);
      } catch (e) {
        console.error("Error obteniendo terminal:", e);
        if (alive) setTerminal(null);
      }
    })();
    return () => { alive = false; };
  }, []);

  return terminal;
}
