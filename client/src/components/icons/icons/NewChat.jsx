// Chat bubble with a plus badge — the V chevron rests inside the bubble.
export default function NewChat(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3.5 6.5A2 2 0 0 1 5.5 4.5h11a2 2 0 0 1 2 2V13a2 2 0 0 1-2 2H9l-3.5 3.2V15h-.5a2 2 0 0 1-2-2V6.5Z" />
      <path className="v-icon-chevron" d="M7.5 8.5l3 3 3-3" />
      <path d="M19 8v4M17 10h4" stroke="currentColor" />
    </svg>
  );
}
