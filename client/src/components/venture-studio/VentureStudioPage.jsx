import InnovationPage from "../innovation/InnovationPage.jsx";
import CmsAwarePage from "../cms/CmsAwarePage.jsx";

export default function VentureStudioPage() {
  return <CmsAwarePage slug="innovation" fallback={<InnovationPage />} />;
}
