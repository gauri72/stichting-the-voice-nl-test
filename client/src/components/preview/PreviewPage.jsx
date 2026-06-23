import { useParams, useSearchParams } from "react-router-dom";
import CmsAwarePage from "../cms/CmsAwarePage.jsx";
import HomePage from "../home/HomePage.jsx";
import EventsPage from "../events/EventsPage.jsx";
import AboutUsPage from "../about/AboutUsPage.jsx";
import MembershipPage from "../membership/MembershipPage.jsx";
import SponsorshipPage from "../sponsorship/SponsorshipPage.jsx";
import DonatePage from "../donate/DonatePage.jsx";
import StoriesPage from "../stories/StoriesPage.jsx";
import ImpactPage from "../impact/ImpactPage.jsx";
import VentureStudioPage from "../venture-studio/VentureStudioPage.jsx";
import PoliciesPage from "../policies/PoliciesPage.jsx";
import PlaceholderPage from "../pages/PlaceholderPage.jsx";
import "../../styles/cms-page.css";

const FALLBACKS = {
  home: <HomePage />,
  events: <EventsPage />,
  experience: <EventsPage />,
  membership: <MembershipPage />,
  stories: <StoriesPage />,
  impact: <ImpactPage />,
  innovation: <VentureStudioPage />,
  "sponsor-us": <SponsorshipPage />,
  donate: <DonatePage />,
  "about-us": <AboutUsPage />,
  contact: <PlaceholderPage title="Contact Us" />,
  "privacy-policy": <PoliciesPage />,
  "terms-and-conditions": <PoliciesPage />,
  "policies-terms-conditions": <PoliciesPage />,
  testimonials: null,
};

export default function PreviewPage() {
  const { pageSlug } = useParams();
  const [searchParams] = useSearchParams();
  const version = searchParams.get("version") || "draft";
  const fallback = FALLBACKS[pageSlug] ?? <PlaceholderPage title={pageSlug} />;

  return (
    <div className="preview-page">
      <CmsAwarePage slug={pageSlug} fallback={fallback} preview version={version} />
    </div>
  );
}
