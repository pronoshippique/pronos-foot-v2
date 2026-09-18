"use client";
import { LANG_CODES, LANG_FLAGS } from "@/lib/i18n";
import AuthStatus from "@/components/AuthStatus";

export default function Header({ lang, onLangChange }) {
  return (
    <header>
      <div className="wrap nav">
        <a className="brand" href="#">
          <span className="dot" />
          <b>
            PRONOS<span>FOOT</span>
          </b>
        </a>
        <div className="nav-right">
          <select
            className="lang"
            aria-label="Language"
            value={lang}
            onChange={(e) => onLangChange(e.target.value)}
          >
            {LANG_CODES.map((code) => (
              <option key={code} value={code}>
                {LANG_FLAGS[code]} {code.toUpperCase()}
              </option>
            ))}
          </select>
          <AuthStatus />
        </div>
      </div>
    </header>
  );
}
