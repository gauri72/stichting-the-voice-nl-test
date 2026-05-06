import MembershipBreadcrumbSection from "./MembershipBreadcrumbSection";
import MembershipMatrixSection from "./MembershipMatrixSection";
import MembershipTiersSection from "./MembershipTiersSection";
import MembershipEventsSection from "./MembershipEventsSection";

export default function MembershipPage() {
  return (
    <>
      <MembershipBreadcrumbSection />
      <MembershipTiersSection />
      <MembershipEventsSection />
      <MembershipMatrixSection />
    </>
  );
}
