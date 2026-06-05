import MembershipBreadcrumbSection from "./MembershipBreadcrumbSection";
import MembershipComparisonTableSection from "./MembershipComparisonTableSection";
import MembershipPlansCardsSection from "./MembershipPlansCardsSection";
import MembershipJoinCtaSection from "./MembershipJoinCtaSection";
import "../../styles/membership-page.css";

export default function MembershipPage() {
  return (
    <div id="membership-navbar-top" className="membership-page-shell">
      <MembershipBreadcrumbSection />
      <MembershipComparisonTableSection />
      <MembershipPlansCardsSection />
      <MembershipJoinCtaSection />
    </div>
  );
}
