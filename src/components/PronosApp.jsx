"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { TR } from "@/lib/i18n";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Tabs from "@/components/Tabs";
import MatchesGrid from "@/components/MatchesGrid";
import Footer from "@/components/Footer";

export default function PronosApp() {
  const [lang, setLang] = useState("fr");
  // Mondial 2026 terminé : on ouvre sur "Matchs du jour" plutôt que sur la
  // Coupe du Monde. Si "Matchs du jour" est vide au tout premier chargement,
  // on bascule automatiquement (une seule fois) sur Ligue 1 — voir plus bas.
  const [comp, setComp] = useState("today");
  const [fixtures, setFixtures] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | empty | error
  const [errorMsg, setErrorMsg] = useState("");
  const isFirstLoad = useRef(true);

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
      // Le tout premier chargement de la page arrive toujours avec
      // competition === "today" : c'est le seul moment où on autorise le
      // repli automatique vers Ligue 1. On verrouille l'indicateur tout de
      // suite, avant même de connaître le résultat, pour qu'un aller-retour
      // manuel de l'utilisateur vers "Matchs du jour" plus tard ne déclenche
      // plus jamais ce repli (comportement surprenant sinon).
      const canFallback = isFirstLoad.current && competition === "today";
      isFirstLoad.current = false;

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

        if (canFallback && sorted.length === 0) {
          setComp("l1");
        }
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
