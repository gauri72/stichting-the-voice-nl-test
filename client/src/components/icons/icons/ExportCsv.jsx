// File outline with a downward arrow — the V chevron forms the arrowhead.
export default function ExportCsv(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7 3.5h6.5L18 8v11.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
      <path d="M13.5 3.5V8H18" />
      <path d="M12 11v5" />
      <path className="v-icon-chevron" d="M8.5 13.5L12 17l3.5-3.5" />
    </svg>
  );
}
