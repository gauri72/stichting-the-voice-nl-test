import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import AdminLayout from "../AdminLayout.jsx";
import VIcon, { COLOR_ROLES } from "../../icons/VIcon.jsx";
import VIconButton from "../../icons/VIconButton.jsx";
import { ICON_VARIANTS } from "../../icons/icons/index.js";
import "../../icons/VIcon.css";

const SIZES = ["sm", "md", "lg", "xl"];

// One-line category tag per icon, purely for the filter UI — grouped by the
// part of the app each CTA belongs to.
const CATEGORIES = {
  "book-tickets": "events",
  "manage-tickets": "events",
  "create-event": "events",
  "publish-event": "events",
  "pay-wallet": "wallet",
  "top-up": "wallet",
  "earn-points": "wallet",
  "redeem-points": "wallet",
  "apply-discount": "wallet",
  "confirm-booking": "wallet",
  "ai-agent": "ai",
  "new-chat": "ai",
  "save-prompt": "ai",
  "schedule-prompt": "ai",
  "generate-template": "content",
  "export-csv": "content",
  "view-history": "content",
  "manage-membership": "membership",
  broadcast: "communication",
  "send-broadcast": "communication",
};

function humanize(variant) {
  return variant.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

function componentName(variant) {
  return variant.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join("");
}

function buildSnippet(variant, color, size) {
  return `<VIconButton variant="${variant}" color="${color}" size="${size}" />`;
}

export default function AdminIconLibraryPage() {
  const [colorFilter, setColorFilter] = useState("all");
  const [sizeFilter, setSizeFilter] = useState("md");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [copiedVariant, setCopiedVariant] = useState("");
  const [activeVariant, setActiveVariant] = useState(ICON_VARIANTS[0]);
  const [activeColor, setActiveColor] = useState("accent");

  const categories = useMemo(() => ["all", ...new Set(Object.values(CATEGORIES))], []);

  const filtered = useMemo(
    () =>
      ICON_VARIANTS.filter((v) => categoryFilter === "all" || CATEGORIES[v] === categoryFilter),
    [categoryFilter]
  );

  async function handleCopy(variant, color) {
    const code = buildSnippet(variant, color, sizeFilter);
    try {
      await navigator.clipboard.writeText(code);
      setCopiedVariant(variant);
      setTimeout(() => setCopiedVariant(""), 1800);
    } catch {
      /* clipboard API unavailable — silently ignore */
    }
  }

  return (
    <AdminLayout pageTitle="V Icon Library" pageSubtitle="Every V-branded icon in the system, with live animation previews and copy-ready code.">
      <div className="mx-auto max-w-6xl px-1 py-2">
        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl bg-slate-900/60 p-4 ring-1 ring-white/10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Color</span>
            <select
              value={colorFilter}
              onChange={(e) => setColorFilter(e.target.value)}
              className="rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-sm text-white"
            >
              <option value="all">All</option>
              {COLOR_ROLES.map((c) => (
                <option key={c} value={c}>{humanize(c)}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Size</span>
            <select
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
              className="rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-sm text-white"
            >
              {SIZES.map((s) => (
                <option key={s} value={s}>{s.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-sm text-white"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{humanize(c)}</option>
              ))}
            </select>
          </div>
          <span className="ml-auto text-xs text-slate-500">{filtered.length} icons</span>
        </div>

        {/* Animation states live preview */}
        <section className="mb-8 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-black p-5 ring-1 ring-white/10">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-400">Live Animation States</h2>
          <p className="mb-4 text-xs text-slate-500">
            Pick an icon and color below, then hover/click the previews to see each state.
          </p>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <select
              value={activeVariant}
              onChange={(e) => setActiveVariant(e.target.value)}
              className="rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-sm text-white"
            >
              {ICON_VARIANTS.map((v) => (
                <option key={v} value={v}>{humanize(v)}</option>
              ))}
            </select>
            <select
              value={activeColor}
              onChange={(e) => setActiveColor(e.target.value)}
              className="rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-sm text-white"
            >
              {COLOR_ROLES.map((c) => (
                <option key={c} value={c}>{humanize(c)}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {[
              { label: "Default", props: {} },
              { label: "Hover (try it)", props: {}, hint: true },
              { label: "Loading", props: { loading: true } },
              { label: "Success", props: { success: true } },
              { label: "Disabled", props: { disabled: true } },
            ].map(({ label, props, hint }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <VIconButton variant={activeVariant} color={activeColor} size="lg" tooltip={hint ? "Hover me" : undefined} {...props} />
                <span className="text-xs text-slate-500">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Icon grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((variant, i) => (
            <motion.article
              key={variant}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 16) * 0.03, duration: 0.25 }}
              className="flex flex-col items-center gap-3 rounded-2xl bg-slate-900/60 p-4 text-center ring-1 ring-white/10"
            >
              <div className="flex gap-2">
                {(colorFilter === "all" ? COLOR_ROLES.slice(0, 3) : [colorFilter]).map((color) => (
                  <VIcon key={color} variant={variant} color={color} size={sizeFilter} label={humanize(variant)} />
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{humanize(variant)}</p>
                <p className="ai-text-11 text-slate-500">{componentName(variant)}</p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(variant, colorFilter === "all" ? "accent" : colorFilter)}
                className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
              >
                {copiedVariant === variant ? (
                  <>
                    <IconCheck size={13} className="text-emerald-400" /> Copied
                  </>
                ) : (
                  <>
                    <IconCopy size={13} /> Copy code
                  </>
                )}
              </button>
            </motion.article>
          ))}
        </div>

        {/* Usage examples */}
        <section className="mt-10 space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Usage Examples</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ExampleCard title="Primary CTA button">
              <button type="button" className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white">
                <VIcon variant="book-tickets" size="sm" color="accent" animated={false} />
                Book Tickets
              </button>
              <code className="ai-text-11 mt-3 block text-slate-500">{`<VIconButton variant="book-tickets" color="accent" size="md" />`}</code>
            </ExampleCard>

            <ExampleCard title="Navigation sidebar item">
              <div className="flex w-full items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5">
                <VIcon variant="pay-wallet" size="sm" color="accent" />
                <span className="text-sm font-medium text-slate-200">V.Wallet</span>
              </div>
              <code className="ai-text-11 mt-3 block text-slate-500">{`<VIcon variant="pay-wallet" size="sm" color="accent" />`}</code>
            </ExampleCard>

            <ExampleCard title="Data table action column">
              <div className="flex items-center gap-2">
                <VIconButton variant="view-history" color="neutral" size="sm" tooltip="View history" />
                <VIconButton variant="export-csv" color="accent" size="sm" tooltip="Export" />
                <VIconButton variant="apply-discount" color="danger" size="sm" tooltip="Apply discount" />
              </div>
              <code className="ai-text-11 mt-3 block text-slate-500">{`<VIconButton variant="export-csv" color="accent" size="sm" tooltip="Export" />`}</code>
            </ExampleCard>

            <ExampleCard title="Card header">
              <div className="flex w-full items-center justify-between">
                <span className="text-sm font-semibold text-white">V.Wallet</span>
                <VIcon variant="pay-wallet" size="sm" color="pro" />
              </div>
              <code className="ai-text-11 mt-3 block text-slate-500">{`<VIcon variant="pay-wallet" size="sm" color="pro" />`}</code>
            </ExampleCard>

            <ExampleCard title="Standalone floating action button">
              <VIconButton variant="ai-agent" color="pro" size="lg" tooltip="Ask V.Assist" />
              <code className="ai-text-11 mt-3 block text-slate-500">{`<VIconButton variant="ai-agent" color="pro" size="lg" tooltip="Ask V.Assist" />`}</code>
            </ExampleCard>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

function ExampleCard({ title, children }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl bg-slate-900/60 p-4 ring-1 ring-white/10">
      <h3 className="ai-text-11 font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      {children}
    </div>
  );
}
