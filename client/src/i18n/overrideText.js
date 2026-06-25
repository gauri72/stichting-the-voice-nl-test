// Many sections store admin-editable text in the generic content-overrides
// system (see CmsOverrideSectionEditor) with an English default baked into
// both the component and the settings-service defaults. If an admin has
// changed the text away from that English default, their wording is
// respected as-is (same boundary used for all other CMS-entered content).
// Otherwise, the field is still showing its untouched default, so the
// current UI language's translation is shown instead.
export function resolveOverrideText(overrideValue, englishDefault, translatedText) {
  return overrideValue && overrideValue !== englishDefault ? overrideValue : translatedText;
}
