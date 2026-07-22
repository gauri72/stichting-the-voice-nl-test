import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IconArrowRight, IconBuildingStore } from "@tabler/icons-react";
import { getMyBusiness } from "../../vcommerce/shared/vcommerceApi.js";
import "../../../styles/dashboard-business-hub-banner.css";

export default function DashboardBusinessHubBanner() {
  const { t } = useTranslation(["dashboardSections", "dashboardMobile"]);
  const [ownBusiness, setOwnBusiness] = useState(null);

  useEffect(() => {
    getMyBusiness()
      .then((data) => setOwnBusiness(data?.business || null))
      .catch(() => setOwnBusiness(null));
  }, []);

  if (!ownBusiness) return null;

  return (
    <Link to="/dashboard/vcommerce" className="dash-business-hub-banner">
      <span className="dash-business-hub-banner__icon" aria-hidden="true">
        <IconBuildingStore size={22} stroke={1.75} />
      </span>
      <span className="dash-business-hub-banner__copy">
        <strong>{t("dashboardMobile:commandCenter.cards.business.title")}</strong>
        <span>{t("dashboardSections:vcommerceHighlights.ownerBannerBody", { businessName: ownBusiness.businessName })}</span>
      </span>
      <span className="dash-business-hub-banner__cta">
        {t("dashboardSections:vcommerceHighlights.ownerBannerCta")} <IconArrowRight size={16} aria-hidden="true" />
      </span>
    </Link>
  );
}
