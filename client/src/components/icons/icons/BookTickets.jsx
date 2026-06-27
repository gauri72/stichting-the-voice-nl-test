// Ticket outline with the signature V chevron cut into its center.
export default function BookTickets(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 8.5A2 2 0 0 1 6 6.5h12a2 2 0 0 1 2 2V10a1.5 1.5 0 0 0 0 3v1.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V13a1.5 1.5 0 0 0 0-3V8.5Z" />
      <path d="M9 6.5v2M9 17.5v-2" strokeDasharray="2 2" />
      <path className="v-icon-chevron" d="M8.5 10l3.5 3.5L15.5 10" />
    </svg>
  );
}
