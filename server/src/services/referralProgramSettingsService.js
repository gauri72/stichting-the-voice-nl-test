import ReferralProgramSettings from "../models/ReferralProgramSettings.js";

export async function getReferralProgramSettings() {
  return ReferralProgramSettings.findOneAndUpdate(
    { key: "default" },
    { $setOnInsert: { key: "default" } },
    { upsert: true, new: true }
  );
}

const ALLOWED_FIELDS = [
  "enabled",
  "autoIssueOnDashboardVisit",
  "defaultDiscountType",
  "defaultDiscountValue",
  "defaultRewardType",
  "defaultRewardValue",
  "holdDays",
  "monthlyCapMinor",
];

export async function updateReferralProgramSettings(updates) {
  const settings = await getReferralProgramSettings();
  for (const key of ALLOWED_FIELDS) {
    if (updates[key] === undefined) continue;
    if (key === "enabled" || key === "autoIssueOnDashboardVisit") {
      settings[key] = Boolean(updates[key]);
    } else if (key === "defaultDiscountValue" || key === "defaultRewardValue") {
      settings[key] = Math.max(0, Number(updates[key]) || 0);
    } else if (key === "holdDays" || key === "monthlyCapMinor") {
      settings[key] = Math.max(0, Math.round(Number(updates[key]) || 0));
    } else {
      settings[key] = updates[key];
    }
  }
  await settings.save();
  return settings;
}
