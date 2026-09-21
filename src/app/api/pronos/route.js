// POST /api/pronos — génère une ANALYSE d'avant-match via Claude Haiku 4.5
// (la clé Anthropic reste côté serveur, jamais exposée au navigateur).
// Cache mémoire simple par match pour éviter de repayer plusieurs fois la
// même analyse. IMPORTANT : le prompt interdit toute promesse de gain
// (protection juridique — service d'information, pas de paris).
//
// Étape 10 : mur payant. On vérifie l'accès AVANT d'appeler Claude, pour ne
// jamais payer une génération à quelqu'un qui n'a pas le droit d'y accéder.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { aAcces } from "@/lib/abonnement";

export const runtime = "nodejs";

const cache = new Map();

const LANGS = {
  fr: "français",
  en: "English",
  es: "español",
  pt: "português",
  ar: "Arabic (العربية)",
  de: "Deutsch",
  it: "italiano",
};

export async function POST(request) {
  // Mur payant : abonnement actif/essai en cours, ou LANCEMENT_GRATUIT allumé.
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let profile = null;
  if (authUser) {
    const { data } = await supabase
      .from("profiles")
      .select("abonnement_statut, created_at")
      .eq("id", authUser.id)
      .maybeSingle();
    profile = data;
  }

  if (!aAcces(profile)) {
    return NextResponse.json(
      {
        ok: false,
        locked: true,
        error: authUser
          ? "Abonne-toi pour débloquer les analyses IA."
          : "Connecte-toi et abonne-toi pour débloquer les analyses IA.",
      },
      { status: 403 }
    );
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return NextResponse.json(
      { ok: false, error: "Variable ANTHROPIC_API_KEY manquante." },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const { id, home, away, league, date, lang } = body || {};
  if (!home || !away) {
    return NextResponse.json({ ok: false, error: "Données du match incomplètes." }, { status: 400 });
  }

  const langName = LANGS[lang] || LANGS.fr;
  const cacheKey = `${lang || "fr"}:${id || `${home}-${away}-${date}`}`;
  if (cache.has(cacheKey)) {
    return NextResponse.json({ ok: true, cached: true, prono: cache.get(cacheKey) });
  }

  const system = [
    "Tu es analyste football pour un média de pronostics.",
    `Rédige TOUTE ta réponse en ${langName}.`,
    "Tu produis une ANALYSE éditoriale d'avant-match riche et structurée, factuelle et nuancée.",
    "",
    "RÈGLES STRICTES (obligation juridique, à respecter absolument) :",
    "- Ne JAMAIS garantir un gain.",
    "- Ne JAMAIS affirmer ou suggérer que suivre l'analyse augmente les chances de gagner.",
    "- Ne JAMAIS écrire « pari sûr », « gain assuré », « coup sûr », « banco » ou équivalent.",
    "- Chaque tendance est une OPINION d'analyste exprimée en probabilité, jamais une certitude ni un ordre de parier.",
    "- N'utilise PAS de symboles markdown (pas d'astérisques **). Texte simple uniquement.",
    "",
    "FORMAT (rédige dans la langue de sortie, garde exactement ces rubriques avec ces émojis en début de ligne) :",
    "D'abord 2 à 3 phrases d'analyse (forces en présence, contexte, enjeux, joueurs clés si pertinent).",
    "Puis une ligne vide, puis ces 5 lignes :",
    "🏆 Issue du match : ton avis nuancé (ex. victoire, nul, double chance)",
    "⚽ Nombre de buts : tendance plus ou moins de 2,5 buts, courte justification",
    "🎯 Les deux équipes marquent : tendance oui ou non",
    "🥅 Première équipe à marquer : ton avis prudent",
    "🔢 Score envisageable : un score plausible présenté comme simple hypothèse",
    "Puis une ligne vide, puis termine EXACTEMENT par une phrase, dans la langue de sortie, signifiant :",
    "« Analyse à titre informatif. 18+. Les paris comportent des risques. »",
    "Reste concis : environ 150 à 180 mots au total.",
  ].join("\n");

  const user = `Match à analyser :
- Équipe à domicile : ${home}
- Équipe à l'extérieur : ${away}
- Compétition : ${league || "non précisée"}
- Date : ${date || "à venir"}

Rédige l'analyse en respectant strictement le format et les règles ci-dessus.`;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001", // modèle économique, suffisant pour des analyses courtes
        max_tokens: 700,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    const data = await r.json();
    if (data.error) {
      return NextResponse.json(
        { ok: false, error: data.error.message || "Erreur Anthropic." },
        { status: 502 }
      );
    }
    const text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    cache.set(cacheKey, text);
    return NextResponse.json({ ok: true, prono: text });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "Erreur lors de la génération de l'analyse.", detail: String(e) },
      { status: 502 }
    );
  }
}
