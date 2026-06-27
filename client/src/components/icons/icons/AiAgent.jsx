// Chat bubble — the V chevron reads as a friendly, alert "face" inside it.
export default function AiAgent(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 6.5A2 2 0 0 1 6 4.5h12a2 2 0 0 1 2 2V14a2 2 0 0 1-2 2H9.5L6 19.5V16H6a2 2 0 0 1-2-2V6.5Z" />
      <path className="v-icon-chevron" d="M8.5 9.5l3.5 3.5 3.5-3.5" />
    </svg>
  );
}
