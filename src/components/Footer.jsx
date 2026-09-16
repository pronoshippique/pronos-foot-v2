export default function Footer({ t }) {
  return (
    <footer>
      <div className="wrap foot">
        <div className="resp">
          <span className="age">18+</span>
          <div dangerouslySetInnerHTML={{ __html: t.respHtml }} />
        </div>
        <p>{t.about}</p>
        <div className="foot-links">
          <a href="/legal#mentions">{t.linkLegal}</a>
          <a href="/legal#cgv">{t.linkCgv}</a>
          <a href="/legal#confidentialite">{t.linkPrivacy}</a>
          <a href="/legal#faq">FAQ</a>
          <a href="https://anj.fr" target="_blank" rel="noopener noreferrer">
            ANJ
          </a>
          <a href="mailto:contact57.pronosfoot@gmail.com">{t.linkContact}</a>
        </div>
      </div>
    </footer>
  );
}
