// Paper plane — the V chevron forms the wing's fold detail.
export default function SendBroadcast(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20.5 3.5L3 10.2l6.3 2.5L20.5 3.5Z" />
      <path d="M9.3 12.7V19l3-3.6" />
      <path className="v-icon-chevron" d="M9.3 12.7l3.4-1.1 7.8-8.1" />
    </svg>
  );
}
