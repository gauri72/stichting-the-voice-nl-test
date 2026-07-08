const SORT_OPTIONS = [
  { value: "date", label: "Date" },
  { value: "popularity", label: "Popularity" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

export default function SortControl({ value, onChange }) {
  return (
    <label className="flex items-center gap-2 whitespace-nowrap text-sm text-evx-text-secondary">
      Sort by
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-full border border-evx-border bg-transparent px-3 py-2 text-sm text-evx-text"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
