// Stacked tickets — the V chevron sits on the front ticket, like BookTickets'
// sibling but offset behind a second ticket to read as a managed stack.
export default function ManageTickets(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 4.5h12a1.5 1.5 0 0 1 1.5 1.5v2a1 1 0 0 0 0 2v2a1 1 0 0 0 0 2v2a1.5 1.5 0 0 1-1.5 1.5H6" opacity="0.45" />
      <path d="M3 7.5A2 2 0 0 1 5 5.5h10a2 2 0 0 1 2 2v1.6a1.3 1.3 0 0 0 0 2.6v1.6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1.6a1.3 1.3 0 0 0 0-2.6V7.5Z" />
      <path className="v-icon-chevron" d="M7.5 11l2.5 2.4L12.5 11" />
    </svg>
  );
}
