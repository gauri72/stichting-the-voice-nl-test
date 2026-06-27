// Price tag / diamond shape — the V chevron sits inside as the perforation mark.
export default function ApplyDiscount(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3.5l8 8a2 2 0 0 1 0 2.8l-5.7 5.7a2 2 0 0 1-2.8 0l-8-8a2 2 0 0 1-.5-.9L2 4l6.4 1c.3 0 .7.2.9.5l2.7 2" />
      <circle cx="8.2" cy="7.8" r="1.1" fill="currentColor" stroke="none" />
      <path className="v-icon-chevron" d="M9.5 13l2.5 2.5L17 10" />
    </svg>
  );
}
