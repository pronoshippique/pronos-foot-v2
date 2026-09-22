"use client";
import { useEffect } from "react";

// Enregistre le service worker minimal (public/sw.js), condition nécessaire
// avec le manifest pour que le navigateur propose l'installation de l'app.
export default function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installation impossible (navigateur non compatible, etc.) : le
        // site reste utilisable normalement dans un onglet classique.
      });
    }
  }, []);

  return null;
}
