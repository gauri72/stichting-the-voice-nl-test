import { useTranslation } from "react-i18next";
import {
  IconLock,
  IconScale,
  IconShieldCheck,
  IconUsersGroup,
} from "@tabler/icons-react";
import { POLICIES_COMMITMENT } from "../../data/policiesDisplay.js";
import { useContentOverrides } from "../../hooks/useCmsPage.js";
import { resolveOverrideText } from "../../i18n/overrideText.js";

const PILLAR_ICONS = {
  shield: IconShieldCheck,
  lock: IconLock,
  people: IconUsersGroup,
  scale: IconScale,
};

export default function PoliciesCommitmentSection() {
  const { t } = useTranslation(["policies"]);
  const overrides = useContentOverrides();
  const { pillars } = POLICIES_COMMITMENT;

  return (
    <section className="policies-commitment" aria-labelledby="policies-commitment-title">
      <div className="policies-commitment__card">
        <div className="policies-commitment__main">
          <span className="policies-commitment__icon" aria-hidden="true">
            <IconShieldCheck size={28} stroke={1.5} />
          </span>
          <div className="policies-commitment__copy">
            <h2 id="policies-commitment-title" className="policies-commitment__title">
              {resolveOverrideText(overrides.policiesCommitmentTitle, POLICIES_COMMITMENT.title, t("policies:commitment.title"))}
            </h2>
            <p className="policies-commitment__description">
              {resolveOverrideText(overrides.policiesCommitmentDescription, POLICIES_COMMITMENT.description, t("policies:commitment.description"))}
            </p>
          </div>
        </div>

        <div className="policies-commitment__pillars" role="list">
          {pillars.map(({ key, icon, label }, index) => {
            const Icon = PILLAR_ICONS[icon] || IconShieldCheck;
            const overrideKey = `policiesCommitmentPillar${index + 1}`;
            const pillarKey = `pillar${index + 1}`;

            return (
              <div key={key} className="policies-commitment__pillar" role="listitem">
                <span className="policies-commitment__pillar-icon" aria-hidden="true">
                  <Icon size={22} stroke={1.6} />
                </span>
                <span className="policies-commitment__pillar-label">
                  {resolveOverrideText(overrides[`${overrideKey}Label`], label, t(`policies:commitment.${pillarKey}`))}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
