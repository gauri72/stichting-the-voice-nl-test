// Bookmark ribbon — its natural bottom notch *is* the V chevron.
export default function SavePrompt(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6.5 4.5h11a1 1 0 0 1 1 1V20l-6.5-4-6.5 4V5.5a1 1 0 0 1 1-1Z" />
      <path className="v-icon-chevron" d="M9 4.5v6l3-2 3 2v-6" />
    </svg>
  );
}
