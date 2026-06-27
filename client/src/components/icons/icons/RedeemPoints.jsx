// Gift box with a ribbon — the V chevron stands in for the ribbon's knot.
export default function RedeemPoints(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4" y="9.5" width="16" height="10.5" rx="1.5" />
      <path d="M4 13.5h16" />
      <path d="M9 4.8C7.5 4.8 6.5 5.8 6.5 7c0 1.5 1.3 2.5 2.5 2.5h6c1.2 0 2.5-1 2.5-2.5 0-1.2-1-2.2-2.5-2.2-2 0-3.5 2-3.5 4.7" />
      <path className="v-icon-chevron" d="M9 16l3 2.2L15 16" />
    </svg>
  );
}
