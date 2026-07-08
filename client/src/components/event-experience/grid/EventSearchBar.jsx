import { IconSearch } from "@tabler/icons-react";

export default function EventSearchBar({ value, onChange }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-evx-border bg-evx-surface px-4 py-2.5">
      <IconSearch size={18} className="text-evx-text-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search events by name, venue, or category…"
        aria-label="Search events"
        className="w-full bg-transparent text-sm text-evx-text outline-none placeholder:text-evx-text-muted"
      />
    </div>
  );
}
