"use client";
// Persiste el código de referido del agente en localStorage por 30 días.
// Si el usuario llega con ?ref=CODIGO, lo guarda.
// Si después visita sin ?ref=, sigue usando el guardado durante 30 días.
// El CalculatorSection y PricingSection leen vs_ref de localStorage como fallback.

import { useEffect } from "react";

const KEY = "vs_ref";
const EXPIRY_DAYS = 30;

export default function RefPersistence({ refCode }: { refCode?: string }) {
  useEffect(() => {
    if (refCode) {
      // Nueva visita con ref: guardar con fecha de expiración
      const expiry = Date.now() + EXPIRY_DAYS * 86400000;
      localStorage.setItem(KEY, JSON.stringify({ code: refCode, expiry }));
      return;
    }
    // Sin ref en URL: limpiar si expiró
    try {
      const stored = localStorage.getItem(KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (Date.now() > parsed.expiry) {
        localStorage.removeItem(KEY);
      }
    } catch {
      localStorage.removeItem(KEY);
    }
  }, [refCode]);

  return null; // componente invisible
}

// Helper para leer el ref guardado desde otros componentes
export function getStoredRef(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (Date.now() > parsed.expiry) {
      localStorage.removeItem(KEY);
      return null;
    }
    return parsed.code;
  } catch {
    return null;
  }
}
