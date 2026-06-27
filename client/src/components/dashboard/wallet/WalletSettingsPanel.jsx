import { useState } from "react";
import { IconRobot, IconShieldX } from "@tabler/icons-react";
import { useWallet } from "../../../contexts/WalletContext.jsx";

function EuroInput({ label, valueMinor, onChange }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-slate-400">{label}</span>
      <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2">
        <span className="text-slate-500">€</span>
        <input
          type="number"
          min="0"
          value={(valueMinor / 100).toFixed(2)}
          onChange={(e) => onChange(Math.round(Number(e.target.value) * 100))}
          className="w-full bg-transparent text-white focus:outline-none"
        />
      </div>
    </label>
  );
}

export default function WalletSettingsPanel() {
  const { wallet, updateSettings, revokeAiBooking } = useWallet();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const settings = wallet?.settings;

  if (!settings) return null;

  async function handleUpdate(patch) {
    setSaving(true);
    try {
      await updateSettings(patch);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-xl bg-white/5 p-4 ring-1 ring-white/5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500/20 text-purple-300">
            <IconRobot size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">AI booking permission</p>
            <p className="ai-text-11 text-slate-500">Let V.Assist book tickets for you using your wallet</p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={settings.aiBookingEnabled}
          onClick={() => handleUpdate({ aiBookingEnabled: !settings.aiBookingEnabled })}
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${settings.aiBookingEnabled ? "bg-purple-500" : "bg-white/15"}`}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${settings.aiBookingEnabled ? "left-6" : "left-0.5"}`} />
        </button>
      </div>

      {settings.aiBookingEnabled && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <EuroInput
              label="Max spend per AI booking"
              valueMinor={settings.maxAISpendPerTransactionMinor}
              onChange={(v) => handleUpdate({ maxAISpendPerTransactionMinor: v })}
            />
            <EuroInput
              label="Daily AI spend limit"
              valueMinor={settings.dailyAISpendLimitMinor}
              onChange={(v) => handleUpdate({ dailyAISpendLimitMinor: v })}
            />
          </div>

          <label className="flex items-center justify-between rounded-xl bg-white/5 p-4 text-sm ring-1 ring-white/5">
            <span className="text-slate-200">Require confirmation before AI books anything</span>
            <input
              type="checkbox"
              checked={settings.confirmationStepEnabled}
              onChange={(e) => handleUpdate({ confirmationStepEnabled: e.target.checked })}
              className="h-4 w-4 accent-purple-500"
            />
          </label>

          <button
            type="button"
            onClick={revokeAiBooking}
            className="flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10"
          >
            <IconShieldX size={16} /> Revoke AI booking permission
          </button>
        </>
      )}

      <EuroInput
        label="Low balance alert threshold"
        valueMinor={settings.lowBalanceThresholdMinor}
        onChange={(v) => handleUpdate({ lowBalanceThresholdMinor: v })}
      />
      <EuroInput
        label="Default top-up amount"
        valueMinor={settings.defaultTopUpAmountMinor}
        onChange={(v) => handleUpdate({ defaultTopUpAmountMinor: v })}
      />

      {(saving || saved) && (
        <p className="ai-text-11 text-emerald-400">{saving ? "Saving…" : "Saved"}</p>
      )}
    </div>
  );
}
