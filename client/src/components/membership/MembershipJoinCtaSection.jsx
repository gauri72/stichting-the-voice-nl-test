import { IconChevronRight, IconTicket } from "@tabler/icons-react";
import "../../styles/membership-join-cta-section.css";

export default function MembershipJoinCtaSection() {
  return (
    <section className="membership-join-cta-section" aria-labelledby="membership-join-cta-title">
      <div className="membership-join-cta-section__inner">
        <div className="membership-join-cta" role="group" aria-label="Join membership">
          <div className="membership-join-cta__icon-wrap" aria-hidden="true">
            <span className="membership-join-cta__icon-glow" />
            <IconTicket className="membership-join-cta__icon" stroke={1.5} />
            <span className="membership-join-cta__icon-star">★</span>
          </div>

          <p id="membership-join-cta-title" className="membership-join-cta__copy">
            Join the V.O.I.C.E. NL community today and unlock amazing experiences, connections and
            opportunities.
          </p>

          <a className="membership-join-cta__button" href="#membership-plans">
            Join Now &amp; Be a Part of the Voice!
            <IconChevronRight className="membership-join-cta__button-icon" size={20} stroke={2.5} aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}
