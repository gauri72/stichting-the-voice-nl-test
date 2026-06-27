// Membership card — the V chevron reads as a tier stripe across the card.
export default function ManageMembership(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="5.5" width="18" height="13" rx="2.2" />
      <path d="M3 9.5h18" />
      <path className="v-icon-chevron" d="M7.5 14l2.3 2 2.2-2 2.2 2 2.3-2" />
    </svg>
  );
}
