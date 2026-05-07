import MembershipBreadcrumbSection from "./MembershipBreadcrumbSection";
import MembershipMatrixSection from "./MembershipMatrixSection";
import MembershipEventsSection from "./MembershipEventsSection";
import MembershipFaqSection from "./MembershipFaqSection";

export default function MembershipPage() {
  return (
    <div id="membership-navbar-top">
      <MembershipBreadcrumbSection />
      <MembershipMatrixSection />
      <MembershipEventsSection />
      <MembershipFaqSection />
    </div>
  );
}
