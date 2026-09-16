// GET /api/matches?comp=... — récupère les matchs depuis API-Football
// sans jamais exposer la clé au navigateur (elle reste côté serveur).
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const COMPETITIONS = {
  wc: { league: 1, season: 2026 }, // Coupe du Monde 2026
  l1: { league: 61 }, // Ligue 1
  pl: { league: 39 }, // Premier League
  liga: { league: 140 }, // La Liga
  seriea: { league: 135 }, // Serie A
  bundes: { league: 78 }, // Bundesliga
};

// Grandes compétitions à garder pour l'onglet "Matchs du jour"
// (sinon l'API renvoie des centaines de matchs de petits championnats).
const MAJOR_LEAGUES = [
  1, // Coupe du Monde
  2, // Ligue des Champions
  3, // Ligue Europa
  848, // Ligue Conférence
  4, // Euro
  5, // Ligue des Nations
  15, // Coupe du Monde des Clubs
  39, // Premier League
  61, // Ligue 1
  78, // Bundesliga
  135, // Serie A
  140, // La Liga
  88, // Eredivisie
  94, // Primeira Liga
];

export async function GET(request) {
  const key = process.env.APIFOOTBALL_KEY;
  if (!key) {
    return NextResponse.json(
      { ok: false, error: "Variable APIFOOTBALL_KEY manquante." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const comp = searchParams.get("comp") || "wc";

  try {
    // --- Cas spécial : "Matchs du jour" ---
    if (comp === "today") {
      const today = new Date().toISOString().slice(0, 10); // AAAA-MM-JJ (UTC)
      const r = await fetch(`https://v3.football.api-sports.io/fixtures?date=${today}`, {
        headers: { "x-apisports-key": key },
      });
      const data = await r.json();
      let fixtures = Array.isArray(data.response) ? data.response : [];
      fixtures = fixtures.filter((f) => MAJOR_LEAGUES.includes(f.league && f.league.id));
      return NextResponse.json(
        { ok: true, comp, count: fixtures.length, fixtures },
        { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" } }
      );
    }

    // --- Cas normal : une compétition précise ---
    const conf = COMPETITIONS[comp] || COMPETITIONS.wc;
    const params = new URLSearchParams();
    params.set("league", String(conf.league));
    if (conf.season) {
      params.set("season", String(conf.season)); // Coupe du Monde : tous les matchs
    } else {
      params.set("next", "20"); // Championnats : les 20 prochains matchs
    }

    const r = await fetch(`https://v3.football.api-sports.io/fixtures?${params.toString()}`, {
      headers: { "x-apisports-key": key },
    });
    const data = await r.json();
    const fixtures = Array.isArray(data.response) ? data.response : [];

    return NextResponse.json(
      { ok: true, comp, count: fixtures.length, fixtures },
      { headers: { "Cache-Control": "s-maxage=10800, stale-while-revalidate=86400" } }
    );
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "Impossible de récupérer les matchs.", detail: String(e) },
      { status: 502 }
    );
  }
}
