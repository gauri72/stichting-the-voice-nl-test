import { useTranslation } from "react-i18next";
import PlaceholderPage from "../pages/PlaceholderPage.jsx";
import CmsAwarePage from "../cms/CmsAwarePage.jsx";

function ContactPageFallback() {
  const { t } = useTranslation(["common"]);
  return <PlaceholderPage title={t("common:nav.contactUs")} />;
}

export default function ContactPage() {
  return <CmsAwarePage slug="contact" fallback={<ContactPageFallback />} />;
}
