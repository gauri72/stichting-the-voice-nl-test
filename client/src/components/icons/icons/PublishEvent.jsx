// Rocket — the V chevron forms the tail fins/exhaust flare at launch.
export default function PublishEvent(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2.5c2.5 1.8 4 5 4 9 0 2.3-.6 4-1.2 5.2H9.2C8.6 15.5 8 13.8 8 11.5c0-4 1.5-7.2 4-9Z" />
      <circle cx="12" cy="9.5" r="1.4" />
      <path className="v-icon-chevron" d="M8 16.7l-2 4 4-1.6M16 16.7l2 4-4-1.6" />
    </svg>
  );
}
