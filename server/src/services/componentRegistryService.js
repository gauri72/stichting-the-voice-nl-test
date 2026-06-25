import ComponentRegistry from "../models/ComponentRegistry.js";
import ComponentSchemaRegistry from "../models/ComponentSchemaRegistry.js";
import { BASE_SECTION_FIELDS, COMPONENT_DEFINITIONS } from "../config/componentRegistryDefaults.js";

/**
 * Idempotently writes the curated component + schema definitions. Safe to
 * re-run after editing componentRegistryDefaults.js (manual refresh) — never
 * called automatically at request time.
 */
export async function ensureComponentRegistry() {
  const registered = [];
  for (const def of COMPONENT_DEFINITIONS) {
    const result = await ComponentRegistry.findOneAndUpdate(
      { componentKey: def.componentKey },
      { $set: def },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await ComponentSchemaRegistry.findOneAndUpdate(
      { componentKey: def.componentKey },
      { $set: { componentKey: def.componentKey, fields: BASE_SECTION_FIELDS } },
      { upsert: true, setDefaultsOnInsert: true }
    );
    registered.push(result.componentKey);
  }
  return registered;
}

export async function listComponentRegistry() {
  return ComponentRegistry.find({}).sort({ category: 1, displayName: 1 }).lean();
}

export async function listComponentSchemas() {
  return ComponentSchemaRegistry.find({}).lean();
}
