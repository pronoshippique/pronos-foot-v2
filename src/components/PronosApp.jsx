"use client";
import { useCallback, useEffect, useState } from "react";
import { TR } from "@/lib/i18n";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Tabs from "@/components/Tabs";
import MatchesGrid from "@/components/MatchesGrid";
import Footer from "@/components/Footer";

// Étape 1 (squelette) : ni compte ni paiement — tout le monde a accès à tout,
// y compris les analyses IA. Le verrouillage sera ajouté aux étapes 5 et 10
// de la feuille de route, une fois l'authentification et Stripe branchés.
export default function PronosApp() {
  const [lang, setLang] = useState("fr");
  const [comp, setComp] = useState("wc");
  const [fixtures, setFixtures] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | empty | error
  const [errorMsg, setErrorMsg] = useState("");

  const t = TR[lang] || TR.fr;

  // Langue mémorisée d'une visite à l'autre.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("pf_lang");
      if (saved && TR[saved]) setLang(saved);
    } catch {
      // localStorage indisponible (navigation privée, etc.) : on garde le français.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    try {
      window.localStorage.setItem("pf_lang", lang);
    } catch {
      // idem
    }
  }, [lang]);

  const loadMatches = useCallback(
    async (competition) => {
      setStatus("loading");
      setFixtures([]);
      try {
        const r = await fetch(`/api/matches?comp=${competition}`);
        const data = await r.json();
        if (!data.ok) {
          setStatus("error");
          setErrorMsg(data.error || t.errLoad);
          return;
        }
        const sorted = (data.fixtures || [])
          .slice()
          .sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date));
        setFixtures(sorted);
        setStatus(sorted.length ? "ready" : "empty");
      } catch {
        setStatus("error");
        setErrorMsg(t.errServer);
      }
    },
    [t]
  );

  useEffect(() => {
    loadMatches(comp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comp]);

  return (
    <>
      <Header lang={lang} onLangChange={setLang} />
      <main className="wrap">
        <Hero t={t} />
        <Tabs active={comp} onChange={setComp} t={t} />
        <MatchesGrid fixtures={fixtures} status={status} errorMsg={errorMsg} lang={lang} t={t} />
      </main>
      <Footer t={t} />
    </>
  );
}
