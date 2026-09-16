"use client";
import MatchCard from "@/components/MatchCard";

export default function MatchesGrid({ fixtures, status, errorMsg, lang, t }) {
  return (
    <>
      <div className="grid">
        {fixtures.slice(0, 30).map((fx) => (
          <MatchCard key={fx.fixture.id} fixture={fx} lang={lang} t={t} />
        ))}
      </div>
      <div className="state">
        {status === "loading" && (
          <>
            <span className="spinner" /> {t.loading}
          </>
        )}
        {status === "empty" && t.noMatches}
        {status === "error" && `⚠️ ${errorMsg}`}
      </div>
    </>
  );
}
