import {
  listComponentRegistry,
  listComponentSchemas,
  ensureComponentRegistry,
} from "../services/componentRegistryService.js";

import { handleError as handleErrorBase } from "../utils/handleError.js";

function handleError(res, error) {
  return handleErrorBase(res, error, { logTag: "[component-registry]" });
}

export async function listComponentRegistryAdmin(req, res) {
  try {
    const [components, schemas] = await Promise.all([listComponentRegistry(), listComponentSchemas()]);
    const schemaByKey = new Map(schemas.map((s) => [s.componentKey, s]));
    const merged = components.map((c) => ({ ...c, schema: schemaByKey.get(c.componentKey) || null }));
    return res.json({ components: merged });
  } catch (error) {
    return handleError(res, error);
  }
}

// Manual refresh only — never invoked automatically. Re-syncs the stored
// registry from server/src/config/componentRegistryDefaults.js.
export async function refreshComponentRegistryAdmin(req, res) {
  try {
    const registered = await ensureComponentRegistry();
    return res.json({ registered });
  } catch (error) {
    return handleError(res, error);
  }
}
