import { useCallback, useState } from "react";
import MembershipBreadcrumbSection from "./MembershipBreadcrumbSection";
import MembershipMatrixSection from "./MembershipMatrixSection";
import MembershipEventsSection from "./MembershipEventsSection";
import MembershipFaqSection from "./MembershipFaqSection";

export default function MembershipPage() {
  const [membershipsVisible, setMembershipsVisible] = useState(false);

  const openMemberships = useCallback(() => {
    setMembershipsVisible(true);
    window.setTimeout(() => {
      document.getElementById("voice-nl-memberships")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 160);
  }, []);

  const closeMemberships = useCallback(() => {
    setMembershipsVisible(false);
  }, []);

  return (
    <div id="membership-navbar-top">
      <MembershipBreadcrumbSection />
      <MembershipMatrixSection onOpenMemberships={openMemberships} />
      <MembershipEventsSection visible={membershipsVisible} onClose={closeMemberships} />
      <MembershipFaqSection />
    </div>
  );
}
