import { IconShieldCheck } from "@tabler/icons-react";
import { POLICIES_DISCLAIMER } from "../../data/policiesDisplay.js";

export default function PoliciesDisclaimerSection() {
  return (
    <section className="policies-disclaimer" aria-label="Policy acknowledgment">
      <div className="policies-disclaimer__inner">
        <IconShieldCheck className="policies-disclaimer__icon" size={18} stroke={1.8} aria-hidden />
        <p className="policies-disclaimer__text">{POLICIES_DISCLAIMER}</p>
      </div>
    </section>
  );
}
