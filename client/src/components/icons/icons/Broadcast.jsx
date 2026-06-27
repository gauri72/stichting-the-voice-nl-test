// Signal waves radiating up from a source point — the V chevron is that source.
export default function Broadcast(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8.5 13.3a5 5 0 0 1 0-7" />
      <path d="M15.5 13.3a5 5 0 0 0 0-7" />
      <path d="M5.3 16.5a9.5 9.5 0 0 1 0-12.6" />
      <path d="M18.7 16.5a9.5 9.5 0 0 0 0-12.6" />
      <path className="v-icon-chevron" d="M9 17l3 2.5 3-2.5" />
    </svg>
  );
}
