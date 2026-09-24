"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { TR } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Tabs from "@/components/Tabs";
import MatchesGrid from "@/components/MatchesGrid";
import Footer from "@/components/Footer";
import WelcomeModal from "@/components/WelcomeModal";

// Clé localStorage : une fois l'écran de bienvenue fermé, on ne le
// remontre plus jamais sur cet appareil (taux de rebond élevé -> on ne
// veut pas non plus agacer les visiteurs qui reviennent).
const WELCOME_SEEN_KEY = "pf_welcome_seen";

export default function PronosApp() {
  const [lang, setLang] = useState("fr");
  // "loading" tant qu'on ne sait pas encore -> on n'affiche la bannière
  // d'inscription gratuite (et l'écran de bienvenue) que quand on est SÛR
  // que le visiteur n'est pas connecté, pour éviter un flash chez les
  // utilisateurs déjà connectés.
  const [authState, setAuthState] = useState("loading"); // loading | in | out
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setAuthState(user ? "in" : "out"));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState(session?.user ? "in" : "out");
    });
    return () => subscription.unsubscribe();
  }, []);

  // Affiche l'écran de bienvenue une seule fois par visiteur non connecté.
  useEffect(() => {
    if (authState !== "out") return;
    try {
      if (!window.localStorage.getItem(WELCOME_SEEN_KEY)) setShowWelcome(true);
    } catch {
      // localStorage indisponible : tant pis, on ne montre pas la modale
      // plutôt que de risquer de la montrer à chaque visite.
    }
  }, [authState]);

  function closeWelcome() {
    setShowWelcome(false);
    try {
      window.localStorage.setItem(WELCOME_SEEN_KEY, "1");
    } catch {
      // idem
    }
  }

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
      {showWelcome && <WelcomeModal t={t} onClose={closeWelcome} />}
      <Header lang={lang} onLangChange={setLang} />
      <main className="wrap">
        <Hero t={t} showFreeBanner={authState === "out"} />
        <Tabs active={comp} onChange={setComp} t={t} />
        <MatchesGrid fixtures={fixtures} status={status} errorMsg={errorMsg} lang={lang} t={t} />
      </main>
      <Footer t={t} />
    </>
  );
}
