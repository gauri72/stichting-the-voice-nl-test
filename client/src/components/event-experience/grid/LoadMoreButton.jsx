export default function LoadMoreButton({ onClick, loading }) {
  return (
    <div className="flex justify-center py-8">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="rounded-full border border-evx-accent px-8 py-3 text-sm font-bold text-evx-accent transition hover:bg-evx-accent hover:text-white disabled:opacity-60"
      >
        {loading ? "Loading…" : "Load More Events"}
      </button>
    </div>
  );
}
