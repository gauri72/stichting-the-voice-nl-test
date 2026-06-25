import { useTranslation } from "react-i18next";
import { IconShieldCheck } from "@tabler/icons-react";

export default function PoliciesDisclaimerSection() {
  const { t } = useTranslation(["policies"]);

  return (
    <section className="policies-disclaimer" aria-label="Policy acknowledgment">
      <div className="policies-disclaimer__inner">
        <IconShieldCheck className="policies-disclaimer__icon" size={18} stroke={1.8} aria-hidden />
        <p className="policies-disclaimer__text">{t("policies:disclaimer")}</p>
      </div>
    </section>
  );
}
