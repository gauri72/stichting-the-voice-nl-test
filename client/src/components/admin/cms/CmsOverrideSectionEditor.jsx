import { useEffect, useState } from "react";
import AiAssistantButton from "./AiAssistantButton.jsx";
import CmsImageField from "./CmsImageField.jsx";
import { useAdminAuth } from "../../../contexts/AdminAuthContext.jsx";
import { adminAuthHeaders, apiFetch } from "../../../utils/api.js";
import { canWriteSettingsCategory } from "../../../utils/settingsAdmin.js";

// Some sections across the site are still hardcoded React components (not
// CMS-driven) — only their text/links/images are editable, via the same
// content_overrides settings store used by /admin/settings/content-overrides.
// Saving here writes straight to that store (instant, live) — it
// intentionally has nothing to do with any page's Save Draft / Publish
// buttons. Keyed by "pageSlug:sectionKey" since some sectionKeys (e.g.
// "breadcrumb") repeat across many pages with page-specific content.
const OVERRIDE_SECTIONS = {
  "home:pillars": {
    label: "Four Pillars cards",
    items: [
      { prefix: "pillar1", name: "Pillar 1 — V.O.I.C.E. Experience", fields: ["Title", "Description", "Link"] },
      { prefix: "pillar2", name: "Pillar 2 — V.O.I.C.E. Stories", fields: ["Title", "Description", "Link"] },
      { prefix: "pillar3", name: "Pillar 3 — V.O.I.C.E. Impact", fields: ["Title", "Description", "Link"] },
      { prefix: "pillar4", name: "Pillar 4 — V.O.I.C.E. Innovation", fields: ["Title", "Description", "Link"] },
    ],
  },
  "home:get-involved": {
    label: "Get Involved cards",
    items: [
      { prefix: "involved1", name: "Card 1 — Sponsor Us", fields: ["Title", "Description", "Link"] },
      { prefix: "involved2", name: "Card 2 — Donate Now", fields: ["Title", "Description", "Link"] },
      { prefix: "involved3", name: "Card 3 — Volunteer (opens the form modal — no link)", fields: ["Title", "Description"] },
    ],
  },
  "home:impact-stats": {
    label: "Impact stats",
    items: [
      { prefix: "stat1", name: "Stat 1", fields: ["Value", "Label"] },
      { prefix: "stat2", name: "Stat 2", fields: ["Value", "Label"] },
      { prefix: "stat3", name: "Stat 3", fields: ["Value", "Label"] },
      { prefix: "stat4", name: "Stat 4", fields: ["Value", "Label"] },
    ],
  },
  "events:breadcrumb": {
    label: "Events breadcrumb banner",
    items: [
      { prefix: "eventsBreadcrumbImageLight", name: "Background image — light theme", fields: ["Image"] },
      { prefix: "eventsBreadcrumbImageDark", name: "Background image — dark theme", fields: ["Image"] },
    ],
  },
  "events:our-impact": {
    label: "Our Impact section",
    items: [
      { prefix: "impact1", name: "Action card 1 — Join Us", fields: ["Label", "Heading", "Description", "CtaText", "CtaLink"] },
      { prefix: "impact2", name: "Action card 2 — Sponsor Us", fields: ["Label", "Heading", "Description", "CtaText", "CtaLink"] },
      { prefix: "impact3", name: "Action card 3 — Donate", fields: ["Label", "Heading", "Description", "CtaText", "CtaLink"] },
      { prefix: "stat1", name: "Impact stat 1 (shared with Home)", fields: ["Value", "Label"] },
      { prefix: "stat2", name: "Impact stat 2 (shared with Home)", fields: ["Value", "Label"] },
      { prefix: "stat3", name: "Impact stat 3 (shared with Home)", fields: ["Value", "Label"] },
      { prefix: "stat4", name: "Impact stat 4 (shared with Home)", fields: ["Value", "Label"] },
    ],
  },
  "stories:breadcrumb": {
    label: "Stories — site-wide tagline & breadcrumb image",
    items: [
      { prefix: "siteBrandTagline", name: "Shared tagline (shown on every breadcrumb-style page across the site)", fields: ["Value"], plain: true },
      { prefix: "sitePillarLine1", name: "Pillar line 1 (shared)", fields: ["Value"], plain: true },
      { prefix: "sitePillarLine2", name: "Pillar line 2 (shared)", fields: ["Value"], plain: true },
      { prefix: "sitePillarLine3", name: "Pillar line 3 (shared)", fields: ["Value"], plain: true },
      { prefix: "sitePillarLine4", name: "Pillar line 4 (shared)", fields: ["Value"], plain: true },
      { prefix: "storiesBreadcrumbImageLight", name: "Stories background image — light theme", fields: ["Image"] },
      { prefix: "storiesBreadcrumbImageDark", name: "Stories background image — dark theme", fields: ["Image"] },
    ],
  },
  "sponsor-us:breadcrumb": {
    label: "Sponsorship breadcrumb banner",
    items: [
      { prefix: "sponsorshipBreadcrumbImageLight", name: "Background image — light theme", fields: ["Image"] },
      { prefix: "sponsorshipBreadcrumbImageDark", name: "Background image — dark theme", fields: ["Image"] },
    ],
  },
  "sponsor-us:sponsorship-why": {
    label: "Why Sponsor Us section",
    items: [
      { prefix: "sponsorshipWhyHeading", name: "Section heading", fields: ["Value"], plain: true },
      { prefix: "sponsorWhy1", name: "Reason 1 — Community Impact", fields: ["Title", "Description"] },
      { prefix: "sponsorWhy2", name: "Reason 2 — Global Exposure", fields: ["Title", "Description"] },
      { prefix: "sponsorWhy3", name: "Reason 3 — Brand Visibility", fields: ["Title", "Description"] },
      { prefix: "sponsorWhy4", name: "Reason 4 — Positive Association", fields: ["Title", "Description"] },
      { prefix: "sponsorWhy5", name: "Reason 5 — Long-term Value", fields: ["Title", "Description"] },
    ],
  },
  "impact:breadcrumb": {
    label: "Impact breadcrumb banner",
    items: [
      { prefix: "impactPageBreadcrumbImageLight", name: "Background image — light theme", fields: ["Image"] },
      { prefix: "impactPageBreadcrumbImageDark", name: "Background image — dark theme", fields: ["Image"] },
    ],
  },
  "impact:impact-herbeats": {
    label: "VOWNL — HerBeats section",
    items: [
      { prefix: "impactPageHerbeats", name: "HerBeats", fields: ["BrandName", "Tagline", "Motto", "Title", "Description", "Quote"] },
      { prefix: "impactPageHerbeatsCta", name: "HerBeats CTA", fields: ["Title", "Subtitle", "Link"] },
    ],
  },
  "impact:impact-highlight": {
    label: "HerBeats Her Night highlight",
    items: [
      { prefix: "impactPageHighlight", name: "Highlight", fields: ["Label", "Title", "Description", "LinkLabel", "Link"] },
      { prefix: "impactPageHighlightFeature1", name: "Feature 1 — Empower", fields: ["Title", "Description"] },
      { prefix: "impactPageHighlightFeature2", name: "Feature 2 — Support", fields: ["Title", "Description"] },
      { prefix: "impactPageHighlightFeature3", name: "Feature 3 — Advocate", fields: ["Title", "Description"] },
    ],
  },
  "impact:impact-areas": {
    label: "Our Areas Of Impact",
    items: [
      { prefix: "impactPageAreasHeading", name: "Section heading", fields: ["Value"], plain: true },
      { prefix: "impactPageArea1", name: "Area 1 — Social Impact (VOWNL)", fields: ["TitleLead", "TitleAccent", "Description", "Bullets", "ButtonLabel", "ButtonLink"] },
      { prefix: "impactPageArea2", name: "Area 2 — Youth (Venture Studio)", fields: ["TitleLead", "TitleAccent", "Description", "Bullets", "ButtonLabel", "ButtonLink"] },
      { prefix: "impactPageArea3", name: "Area 3 — Helping Other NGOs", fields: ["TitleLead", "TitleAccent", "Description", "Bullets", "ButtonLabel", "ButtonLink"] },
    ],
  },
  "about-us:breadcrumb": {
    label: "About Us breadcrumb banner",
    items: [
      { prefix: "aboutUsBreadcrumbImageLight", name: "Background image — light theme", fields: ["Image"] },
      { prefix: "aboutUsBreadcrumbImageDark", name: "Background image — dark theme", fields: ["Image"] },
    ],
  },
  "about-us:about-hero": {
    label: "About Us hero",
    items: [
      { prefix: "aboutHero", name: "Hero", fields: ["TitleLead", "TitleAccent", "TaglineLead", "TaglineAccent", "Description"] },
    ],
  },
  "about-us:about-mission": {
    label: "Our Mission section",
    items: [
      { prefix: "aboutMissionLabel", name: "Label", fields: ["Value"], plain: true },
      { prefix: "aboutMissionText", name: "Mission text", fields: ["Value"], plain: true, textarea: true },
    ],
  },
  "about-us:about-what-we-do": {
    label: "What We Do cards",
    items: [
      { prefix: "aboutWhatWeDoHeading", name: "Section heading", fields: ["Value"], plain: true },
      { prefix: "aboutWhatWeDo1", name: "Card 1 — V.O.I.C.E. Experiences", fields: ["Title", "Description", "Link"] },
      { prefix: "aboutWhatWeDo2", name: "Card 2 — Voice of Visionaries", fields: ["Title", "Description", "Link"] },
      { prefix: "aboutWhatWeDo3", name: "Card 3 — V.O.I.C.E. Impact", fields: ["Title", "Description", "Link"] },
      { prefix: "aboutWhatWeDo4", name: "Card 4 — V.O.I.C.E. Innovation", fields: ["Title", "Description", "Link"] },
    ],
  },
  "about-us:about-values": {
    label: "Our Values (5 Is) cards",
    items: [
      { prefix: "aboutValuesHeading", name: "Section heading", fields: ["Value"], plain: true },
      { prefix: "aboutValue1", name: "Value 1 — Inclusion", fields: ["Title", "Description"] },
      { prefix: "aboutValue2", name: "Value 2 — Integrity", fields: ["Title", "Description"] },
      { prefix: "aboutValue3", name: "Value 3 — Innovation", fields: ["Title", "Description"] },
      { prefix: "aboutValue4", name: "Value 4 — Integration", fields: ["Title", "Description"] },
      { prefix: "aboutValue5", name: "Value 5 — Impact", fields: ["Title", "Description"] },
    ],
  },
  "donate:breadcrumb": {
    label: "Donate breadcrumb banner",
    items: [
      { prefix: "donateBreadcrumbImageLight", name: "Background image — light theme", fields: ["Image"] },
      { prefix: "donateBreadcrumbImageDark", name: "Background image — dark theme", fields: ["Image"] },
    ],
  },
  "donate:donate-allocation": {
    label: "Where Your Donation Goes",
    items: [
      { prefix: "donateAllocationHeading", name: "Section heading", fields: ["Value"], plain: true },
      { prefix: "donateAllocation1", name: "Item 1 — Arts & Culture", fields: ["Title", "Description"] },
      { prefix: "donateAllocation2", name: "Item 2 — Community Programs", fields: ["Title", "Description"] },
      { prefix: "donateAllocation3", name: "Item 3 — Education & Youth", fields: ["Title", "Description"] },
      { prefix: "donateAllocation4", name: "Item 4 — Health & Wellness", fields: ["Title", "Description"] },
      { prefix: "donateAllocation5", name: "Item 5 — Cultural Exchange", fields: ["Title", "Description"] },
      { prefix: "donateAllocation6", name: "Item 6 — Sustainability", fields: ["Title", "Description"] },
    ],
  },
  "donate:donate-real-impact": {
    label: "Real Impact. Real Change.",
    items: [
      { prefix: "donateImpactTitleLine", name: "Title line 1", fields: ["Value"], plain: true },
      { prefix: "donateImpactTitleAccent", name: "Title line 2 (accent)", fields: ["Value"], plain: true },
      { prefix: "donateStat1", name: "Stat 1", fields: ["Value", "Label"] },
      { prefix: "donateStat2", name: "Stat 2", fields: ["Value", "Label"] },
      { prefix: "donateStat3", name: "Stat 3", fields: ["Value", "Label"] },
      { prefix: "donateStat4", name: "Stat 4", fields: ["Value", "Label"] },
      { prefix: "donateStat5", name: "Stat 5", fields: ["Value", "Label"] },
    ],
  },
  "donate:donate-other-ways": {
    label: "Other Ways to Give",
    items: [
      { prefix: "donateOtherWaysHeading", name: "Section heading", fields: ["Value"], plain: true },
      { prefix: "donateOtherWay1", name: "Card 1 — Corporate Partnerships", fields: ["Title", "Description", "Link"] },
      { prefix: "donateOtherWay2", name: "Card 2 — In-Kind Donations", fields: ["Title", "Description", "Link"] },
      { prefix: "donateOtherWay3", name: "Card 3 — Volunteer With Us", fields: ["Title", "Description", "Link"] },
    ],
  },
  "innovation:venture-hero": {
    label: "Venture Studio hero",
    items: [
      { prefix: "ventureHero", name: "Hero", fields: ["TitleLead", "TitleAccent", "Description"] },
    ],
  },
  "innovation:venture-digital": {
    label: "V.O.I.C.E. Digital section",
    items: [
      { prefix: "ventureDigitalTitle", name: "Title", fields: ["Value"], plain: true },
      { prefix: "ventureDigitalDescription", name: "Description", fields: ["Value"], plain: true, textarea: true },
      { prefix: "ventureDigitalPillar1", name: "Pillar 1", fields: ["Label"] },
      { prefix: "ventureDigitalPillar2", name: "Pillar 2", fields: ["Label"] },
      { prefix: "ventureDigitalPillar3", name: "Pillar 3", fields: ["Label"] },
      { prefix: "ventureDigitalPillar4", name: "Pillar 4", fields: ["Label"] },
    ],
  },
  "innovation:venture-initiatives": {
    label: "Our Key Initiatives",
    items: [
      { prefix: "ventureInitiativesHeading", name: "Section heading", fields: ["Value"], plain: true },
      { prefix: "ventureInitiative1", name: "Card 1 — V.O.I.C.E. Venture Studio", fields: ["Title", "Tagline", "Description", "Bullets"] },
      { prefix: "ventureInitiative2", name: "Card 2 — Consultancy Solutions", fields: ["Title", "Tagline", "Description", "Bullets"] },
      { prefix: "ventureInitiative3", name: "Card 3 — Digital Growth", fields: ["Title", "Tagline", "Description", "Bullets"] },
    ],
  },
  "innovation:venture-deliver": {
    label: "What We Deliver",
    items: [
      { prefix: "ventureDeliverHeading", name: "Section heading", fields: ["Value"], plain: true },
      { prefix: "ventureDeliver1", name: "Item 1 — Purpose Driven Innovation", fields: ["Title", "Description"] },
      { prefix: "ventureDeliver2", name: "Item 2 — Empowered Communities", fields: ["Title", "Description"] },
      { prefix: "ventureDeliver3", name: "Item 3 — Sustainable Growth", fields: ["Title", "Description"] },
      { prefix: "ventureDeliver4", name: "Item 4 — Technology With Integrity", fields: ["Title", "Description"] },
    ],
  },
  "innovation:venture-cta": {
    label: "Innovate. Transform. Impact. CTA",
    items: [
      { prefix: "ventureCta", name: "CTA", fields: ["TitleLead", "TitleAccent", "Description", "ButtonText", "ButtonLink"] },
    ],
  },
  "innovation:venture-contact": {
    label: "Venture Studio contact info",
    items: [
      { prefix: "ventureContactPhone", name: "Phone number", fields: ["Value"], plain: true },
      { prefix: "ventureContactPhoneHref", name: "Phone link (tel:...)", fields: ["Value"], plain: true },
      { prefix: "ventureContactAddress", name: "Address (one line per line)", fields: ["Value"], plain: true, textarea: true },
      { prefix: "ventureContactKvk", name: "KVK number", fields: ["Value"], plain: true },
    ],
  },
};

// Policies content is identical whether the visitor is on /terms-and-conditions
// or /privacy-policy (same PoliciesPageFallback component) — register the same
// sections under both CMS slugs so either page's editor can reach them.
const POLICIES_SECTIONS = {
  "policies-hero": {
    label: "Policies hero",
    items: [
      { prefix: "policiesHero", name: "Hero", fields: ["TitleLead", "TitleAccent", "Tagline", "Description"] },
    ],
  },
  "policies-commitment": {
    label: "Our Commitment To You",
    items: [
      { prefix: "policiesCommitmentTitle", name: "Title", fields: ["Value"], plain: true },
      { prefix: "policiesCommitmentDescription", name: "Description", fields: ["Value"], plain: true, textarea: true },
      { prefix: "policiesCommitmentPillar1", name: "Pillar 1 — Integrity", fields: ["Label"] },
      { prefix: "policiesCommitmentPillar2", name: "Pillar 2 — Privacy", fields: ["Label"] },
      { prefix: "policiesCommitmentPillar3", name: "Pillar 3 — Respect", fields: ["Label"] },
      { prefix: "policiesCommitmentPillar4", name: "Pillar 4 — Fairness", fields: ["Label"] },
    ],
  },
  "policies-grid": {
    label: "Our Policies grid",
    items: [
      { prefix: "policiesGridHeading", name: "Section heading", fields: ["Value"], plain: true },
      { prefix: "policiesGrid1", name: "Card 1 — Privacy Policy", fields: ["Title", "Description"] },
      { prefix: "policiesGrid2", name: "Card 2 — Data Protection Policy", fields: ["Title", "Description"] },
      { prefix: "policiesGrid3", name: "Card 3 — Cookie Policy", fields: ["Title", "Description"] },
      { prefix: "policiesGrid4", name: "Card 4 — Community Guidelines", fields: ["Title", "Description"] },
      { prefix: "policiesGrid5", name: "Card 5 — Event Terms & Conditions", fields: ["Title", "Description"] },
      { prefix: "policiesGrid6", name: "Card 6 — Purchase & Refund Policy", fields: ["Title", "Description"] },
      { prefix: "policiesGrid7", name: "Card 7 — Code of Conduct", fields: ["Title", "Description"] },
      { prefix: "policiesGrid8", name: "Card 8 — Content Policy", fields: ["Title", "Description"] },
    ],
  },
  "policies-terms-banner": {
    label: "Terms & Conditions banner",
    items: [
      { prefix: "policiesTermsBannerTitle", name: "Title", fields: ["Value"], plain: true },
      { prefix: "policiesTermsBannerDescription", name: "Description", fields: ["Value"], plain: true, textarea: true },
    ],
  },
  "policies-help": {
    label: "Need Help? section",
    items: [
      { prefix: "policiesHelp", name: "Help", fields: ["Title", "Description", "ButtonText", "ButtonLink"] },
    ],
  },
  "policies-detail": {
    label: "Full policy texts (long-form legal content)",
    items: [
      { prefix: "policyPrivacy", name: "Privacy Policy — full text", fields: ["Value"], plain: true, textarea: true },
      { prefix: "policyDataProtection", name: "Data Protection Policy — full text", fields: ["Value"], plain: true, textarea: true },
      { prefix: "policyCookie", name: "Cookie Policy — full text", fields: ["Value"], plain: true, textarea: true },
      { prefix: "policyCommunity", name: "Community Guidelines — full text", fields: ["Value"], plain: true, textarea: true },
      { prefix: "policyEventTerms", name: "Event Terms & Conditions — full text", fields: ["Value"], plain: true, textarea: true },
      { prefix: "policyPurchaseRefund", name: "Purchase & Refund Policy — full text", fields: ["Value"], plain: true, textarea: true },
      { prefix: "policyCodeOfConduct", name: "Code of Conduct — full text", fields: ["Value"], plain: true, textarea: true },
      { prefix: "policyContent", name: "Content Policy — full text", fields: ["Value"], plain: true, textarea: true },
      { prefix: "policiesTermsConditionsText", name: "Terms & Conditions (all 8 subsections, blank = use the structured default below)", fields: ["Value"], plain: true, textarea: true },
    ],
  },
};

for (const slug of ["terms-and-conditions", "privacy-policy"]) {
  for (const [sectionKey, config] of Object.entries(POLICIES_SECTIONS)) {
    OVERRIDE_SECTIONS[`${slug}:${sectionKey}`] = config;
  }
}

OVERRIDE_SECTIONS["membership:breadcrumb"] = {
  label: "Membership breadcrumb banner",
  items: [
    { prefix: "membershipBreadcrumbImageLight", name: "Background image — light theme", fields: ["Image"] },
    { prefix: "membershipBreadcrumbImageDark", name: "Background image — dark theme", fields: ["Image"] },
  ],
};

const FIELD_TYPES = {
  Description: "textarea",
  Bullets: "textarea",
  Link: "link",
  CtaLink: "link",
  ButtonLink: "link",
  Image: "image",
};

export function isOverrideBackedSection(pageSlug, sectionKey) {
  return Boolean(OVERRIDE_SECTIONS[`${pageSlug}:${sectionKey}`]);
}

export default function CmsOverrideSectionEditor({ pageSlug, sectionKey }) {
  const { admin } = useAdminAuth();
  const canWrite = canWriteSettingsCategory(admin?.role, "content_overrides");
  const config = OVERRIDE_SECTIONS[`${pageSlug}:${sectionKey}`];

  const [values, setValues] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setMessage("");
    setError("");
    apiFetch("/api/admin/settings/content_overrides", { headers: adminAuthHeaders() })
      .then((d) => setValues(d.settings || {}))
      .catch((err) => setError(err.message || "Could not load this section's content."));
  }, [pageSlug, sectionKey]);

  function valueKeyFor(item, fieldKey) {
    return fieldKey === "Image" || item.plain ? item.prefix : `${item.prefix}${fieldKey}`;
  }

  function setField(item, fieldKey, value) {
    setValues((v) => ({ ...v, [valueKeyFor(item, fieldKey)]: value }));
  }

  async function save() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await apiFetch("/api/admin/settings/content_overrides", {
        method: "PATCH",
        headers: adminAuthHeaders(),
        body: JSON.stringify(values),
      });
      setMessage("Saved — already live on the site.");
    } catch (err) {
      setError(err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!config) return null;

  return (
    <div className="admin-cms__section-editor">
      <header className="admin-cms__section-editor-header">
        <h3>{config.label}</h3>
        <span className="admin-cms__badge">Page content</span>
      </header>
      <p className="admin-cms__repeater-note">
        This section's design, layout and icons are fixed in code — only the text, links and images below
        are editable. Saving here applies instantly to the live site; it does not use this page's Save
        Draft / Publish buttons.
      </p>

      {error ? <p className="admin-cms__error">{error}</p> : null}
      {!values ? (
        <p className="admin-cms__status">Loading…</p>
      ) : (
        config.items.map((item) => (
          <div key={item.prefix} className="admin-cms__repeater-item">
            <strong>{item.name}</strong>
            {item.fields.map((fieldKey) => {
              const isPlainValue = item.plain && fieldKey === "Value";
              const type = isPlainValue && item.textarea ? "textarea" : FIELD_TYPES[fieldKey] || "text";
              const valueKey = valueKeyFor(item, fieldKey);
              const label = isPlainValue ? null : fieldKey.replace(/^Cta/, "Button ").replace(/^Title/, "Title ").replace(/^Button/, "Button ");

              if (type === "image") {
                return (
                  <CmsImageField
                    key={fieldKey}
                    label=""
                    value={values[valueKey]}
                    onChange={(val) => setField(item, fieldKey, val)}
                    disabled={!canWrite}
                  />
                );
              }

              return (
                <div key={fieldKey} className="admin-cms__field-row">
                  {label ? (
                    <label className="admin-cms__label">
                      {label}
                      {type !== "link" ? (
                        <AiAssistantButton
                          text={values[valueKey]}
                          actions={type === "textarea" ? ["rewrite", "shorten", "expand"] : ["rewrite", "shorten"]}
                          onApply={(v) => setField(item, fieldKey, v)}
                          disabled={!canWrite}
                        />
                      ) : null}
                    </label>
                  ) : null}
                  {type === "textarea" ? (
                    <textarea
                      className="admin-cms__textarea"
                      rows={isPlainValue ? 4 : 2}
                      value={values[valueKey] || ""}
                      onChange={(e) => setField(item, fieldKey, e.target.value)}
                      disabled={!canWrite}
                    />
                  ) : (
                    <input
                      className="admin-cms__input"
                      value={values[valueKey] || ""}
                      placeholder={type === "link" ? "/page or https://..." : ""}
                      onChange={(e) => setField(item, fieldKey, e.target.value)}
                      disabled={!canWrite}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))
      )}

      {message ? <p className="admin-cms__success">{message}</p> : null}
      {canWrite ? (
        <button type="button" className="admin-cms__btn admin-cms__btn--primary" onClick={save} disabled={saving || !values}>
          {saving ? "Saving…" : "Save (instant)"}
        </button>
      ) : (
        <p className="admin-cms__status">Read-only access.</p>
      )}
    </div>
  );
}
