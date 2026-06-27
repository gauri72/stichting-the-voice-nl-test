// Calendar — the V chevron marks a confirmed date on the grid.
export default function CreateEvent(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v3.5M16 3v3.5" />
      <path className="v-icon-chevron" d="M8.5 14l2.7 2.7L15.5 12" />
    </svg>
  );
}
