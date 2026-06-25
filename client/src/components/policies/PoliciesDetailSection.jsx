import { useTranslation } from "react-i18next";
import { POLICIES_DETAILS, POLICIES_TERMS_CONTENT } from "../../data/policiesDisplay.js";
import { useContentOverrides } from "../../hooks/useCmsPage.js";

// Each policy's full text is exposed as ONE long-text override field
// (paragraphs joined by a blank line) rather than per-paragraph fields —
// this is genuinely long-form legal content, not card-style copy.
const POLICY_OVERRIDE_KEYS = [
  "policyPrivacy",
  "policyDataProtection",
  "policyCookie",
  "policyCommunity",
  "policyEventTerms",
  "policyPurchaseRefund",
  "policyCodeOfConduct",
  "policyContent",
];

const POLICY_I18N_KEYS = [
  "privacy",
  "dataProtection",
  "cookie",
  "community",
  "eventTerms",
  "purchaseRefund",
  "codeOfConduct",
  "content",
];

export default function PoliciesDetailSection() {
  const { t } = useTranslation(["policies"]);
  const overrides = useContentOverrides();

  return (
    <section className="policies-detail" aria-label="Policy and terms content">
      <div className="policies-detail__inner">
        {POLICIES_DETAILS.map(({ id, title, paragraphs }, index) => {
          const rawOverrideText = overrides[POLICY_OVERRIDE_KEYS[index]];
          const isCustomized = rawOverrideText && rawOverrideText !== paragraphs.join("\n\n");
          const i18nKey = POLICY_I18N_KEYS[index];
          const displayTitle = isCustomized ? title : t(`policies:details.${i18nKey}.title`);
          const displayParagraphs = isCustomized
            ? rawOverrideText.split("\n\n").filter(Boolean)
            : [
                t(`policies:details.${i18nKey}.p1`),
                t(`policies:details.${i18nKey}.p2`),
                t(`policies:details.${i18nKey}.p3`),
              ];
          return (
            <article key={id} id={id} className="policies-detail__block">
              <h2 className="policies-detail__title">{displayTitle}</h2>
              {displayParagraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="policies-detail__paragraph">
                  {paragraph}
                </p>
              ))}
            </article>
          );
        })}

        <article id={POLICIES_TERMS_CONTENT.id} className="policies-detail__block policies-detail__block--terms">
          <h2 className="policies-detail__title">
            {overrides.policiesTermsConditionsText ? POLICIES_TERMS_CONTENT.title : t("policies:terms.title")}
          </h2>
          {overrides.policiesTermsConditionsText ? (
            overrides.policiesTermsConditionsText.split("\n\n").filter(Boolean).map((paragraph) => (
              <p key={paragraph.slice(0, 40)} className="policies-detail__paragraph">
                {paragraph}
              </p>
            ))
          ) : (
            POLICIES_TERMS_CONTENT.sections.map((_, index) => {
              const sectionKey = `section${index + 1}`;
              return (
                <div key={sectionKey} className="policies-detail__section">
                  <h3 className="policies-detail__heading">{t(`policies:terms.${sectionKey}.heading`)}</h3>
                  <p className="policies-detail__paragraph">{t(`policies:terms.${sectionKey}.body`)}</p>
                </div>
              );
            })
          )}
        </article>
      </div>
    </section>
  );
}
