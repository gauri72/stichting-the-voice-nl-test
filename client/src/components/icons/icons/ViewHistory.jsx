// List rows — the V chevron replaces the bullet indicator on the active row.
export default function ViewHistory(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10.5 6.5h9.5M10.5 12h9.5M10.5 17.5h9.5" />
      <circle cx="5" cy="6.5" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="5" cy="17.5" r="1.4" fill="currentColor" stroke="none" />
      <path className="v-icon-chevron" d="M3.3 11l1.7 1.7L6.7 11" />
    </svg>
  );
}
