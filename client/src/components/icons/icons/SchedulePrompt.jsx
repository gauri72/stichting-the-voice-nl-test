// Clock face with static hands — the V chevron sits at the base as the
// signature accent, reading like a "next run" indicator.
export default function SchedulePrompt(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5V11.5L14.5 13" />
      <path className="v-icon-chevron" d="M9 19l3 1.8 3-1.8" />
    </svg>
  );
}
