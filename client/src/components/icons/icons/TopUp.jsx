// Wallet with an upward arrow — the V chevron flips upward to form the arrowhead.
export default function TopUp(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="10" width="18" height="10.5" rx="2.5" />
      <path d="M3 14h18" />
      <path d="M12 9.5V4" />
      <path className="v-icon-chevron" d="M8.5 7l3.5-3.5L15.5 7" />
    </svg>
  );
}
