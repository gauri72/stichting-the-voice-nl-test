// Wallet outline — the fold-flap line doubles as the V chevron's resting line.
export default function PayWallet(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="6.5" width="18" height="13" rx="2.5" />
      <path d="M3 10.5h18" />
      <path className="v-icon-chevron" d="M8.5 14l3.5 2.8L15.5 14" />
    </svg>
  );
}
