import { useTranslation } from "react-i18next";
import PlaceholderPage from "./PlaceholderPage.jsx";

export default function OurPillarsPlaceholderPage() {
  const { t } = useTranslation(["common"]);
  return <PlaceholderPage title={t("common:nav.ourPillars")} />;
}
