import { getCategorySettings } from "./settingsService.js";

export async function getBankSettings() {
  return getCategorySettings("bank");
}
