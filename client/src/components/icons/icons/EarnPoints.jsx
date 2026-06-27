// Five-point star badge with the V chevron sitting at its center.
export default function EarnPoints(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3.5l2.5 5.1 5.6.8-4.1 4 1 5.6L12 16.4l-5 2.6 1-5.6-4.1-4 5.6-.8L12 3.5Z" />
      <path className="v-icon-chevron" d="M9 12.5l3 2.3 3-2.3" />
    </svg>
  );
}
