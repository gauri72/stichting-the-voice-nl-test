// Small CSS-only help icon shown next to a field label. Give it plain-language
// guidance and a concrete example so non-technical applicants know exactly what
// to enter without leaving the page.
export default function FieldHelp({ text, example }) {
  if (!text) return null;
  const fullText = example ? `${text} Example: ${example}` : text;
  return (
    <span className="vco-help" tabIndex={0} aria-label={fullText}>
      <span className="vco-help__icon" aria-hidden="true">?</span>
      <span className="vco-help__bubble" aria-hidden="true">
        {text}
        {example && <><br /><em>e.g. {example}</em></>}
      </span>
    </span>
  );
}
