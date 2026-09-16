"use client";
import { useState } from "react";

const LIVE_STATUSES = ["1H", "2H", "HT", "ET", "LIVE"];
const FINISHED_STATUSES = ["FT", "AET", "PEN"];

export default function MatchCard({ fixture, lang, t }) {
  const [analysis, setAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  const home = fixture.teams.home;
  const away = fixture.teams.away;
  const statusCode = fixture.fixture.status?.short || "NS";
  const isLive = LIVE_STATUSES.includes(statusCode);
  const isFinished = FINISHED_STATUSES.includes(statusCode);
  const round = fixture.league?.round || fixture.league?.name || "";
  const statusLabel = isLive ? t.statusLive : isFinished ? t.statusFinished : t.statusUpcoming;

  let when;
  try {
    when = new Date(fixture.fixture.date).toLocaleString(t.locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    when = new Date(fixture.fixture.date).toLocaleString();
  }

  async function generateAnalysis() {
    setLoadingAnalysis(true);
    setAnalysisError("");
    try {
      const r = await fetch("/api/pronos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: fixture.fixture.id,
          home: home.name,
          away: away.name,
          league: fixture.league?.name,
          date: fixture.fixture.date,
          lang,
        }),
      });
      const data = await r.json();
      if (!data.ok) {
        setAnalysisError(data.error || t.errLoad);
        return;
      }
      setAnalysis(data.prono);
    } catch {
      setAnalysisError(t.errServer);
    } finally {
      setLoadingAnalysis(false);
    }
  }

  return (
    <div className="card">
      <div className="top">
        <span>{round}</span>
        <span className={isLive ? "badge-live" : ""}>{statusLabel}</span>
      </div>
      <div className="teams">
        <div className="team">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={home.logo}
            alt=""
            onError={(e) => {
              e.currentTarget.style.opacity = "0.2";
            }}
          />
          <span>{home.name}</span>
        </div>
        {isFinished || isLive ? (
          <div className="score">
            {fixture.goals.home ?? 0} – {fixture.goals.away ?? 0}
          </div>
        ) : (
          <div className="vs">{t.vs}</div>
        )}
        <div className="team">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={away.logo}
            alt=""
            onError={(e) => {
              e.currentTarget.style.opacity = "0.2";
            }}
          />
          <span>{away.name}</span>
        </div>
      </div>
      <div className="when">{when}</div>

      {analysis ? (
        <div className="prono">{analysis}</div>
      ) : (
        <button className="ai-btn" type="button" onClick={generateAnalysis} disabled={loadingAnalysis}>
          {loadingAnalysis ? (
            <>
              <span className="spinner" /> {t.aiLoading}
            </>
          ) : (
            t.aiBtn
          )}
        </button>
      )}
      {analysisError && <div className="prono">⚠️ {analysisError}</div>}
    </div>
  );
}
