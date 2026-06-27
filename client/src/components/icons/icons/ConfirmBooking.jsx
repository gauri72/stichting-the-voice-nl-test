// Circle with the V chevron stretched into a checkmark — the V *is* the tick.
export default function ConfirmBooking(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path className="v-icon-chevron" d="M8 12.5l2.8 2.8L16.5 9" />
    </svg>
  );
}
