import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  IconArrowRight,
  IconMapPin,
  IconShieldCheck,
  IconStarFilled,
  IconWallet,
} from "@tabler/icons-react";
import { getVCommerceFeatured } from "../vcommerce/shared/vcommerceApi.js";
import { BUSINESS_CATEGORY_LABELS } from "../vcommerce/shared/BUSINESS_CATEGORIES.js";
import "../../styles/vcommerce-spotlight-section.css";

function mapFeaturedBusiness(business) {
  if (!business) return null;
  return {
    name: business.businessName,
    categoryLabel: BUSINESS_CATEGORY_LABELS[business.category] || business.category,
    location: [business.location?.city, business.location?.country].filter(Boolean).join(", "),
    rating: business.avgRating,
    reviewCount: business.reviewCount || 0,
    imageUrl: business.bannerUrl || business.logoUrl || "",
    tags: [BUSINESS_CATEGORY_LABELS[business.category] || business.category].filter(Boolean),
    // TravelArc has no cashback offer — this mirrors the same slug-scoped
    // suppression used on its own V.Commerce profile page.
    cashbackPercent: business.slug === "travelarc" ? 0 : (business.cashbackPercent || 0),
    description: business.tagline || business.description || "",
    shopUrl: `/vcommerce/${business.slug}`,
  };
}

export default function VCommerceSpotlightSection() {
  const { t } = useTranslation(["home"]);
  const [business, setBusiness] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getVCommerceFeatured()
      .then((data) => setBusiness(mapFeaturedBusiness(data.business)))
      .catch(() => setBusiness(null))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || !business) return null;

  const tags = business.tags.slice(0, 3);

  return (
    <section className="vcommerce-spotlight" aria-labelledby="partner-with-us-title">
      <div className="vcommerce-spotlight__inner">
        <header className="vcommerce-spotlight__heading">
          <p className="vcommerce-spotlight__eyebrow">{t("home:vcommerceSpotlight.eyebrow")}</p>
          <h2 id="partner-with-us-title">{t("home:vcommerceSpotlight.title")}</h2>
          <p>{t("home:vcommerceSpotlight.subtitle")}</p>
        </header>

        <div className="vcommerce-spotlight__subheading">
          <h3>{t("home:vcommerceSpotlight.spotlightTitle")}</h3>
          <span>{t("home:vcommerceSpotlight.spotlightSubtitle")}</span>
        </div>

        <article className="vcommerce-spotlight__card">
          <div className="vcommerce-spotlight__media">
            {business.imageUrl ? (
              <picture>
                <source media="(max-width: 760px)" srcSet={business.imageUrl} />
                <img src={business.imageUrl} alt={t("home:vcommerceSpotlight.imageAlt", { name: business.name })} />
              </picture>
            ) : null}
            <span className="vcommerce-spotlight__image-label">{t("home:vcommerceSpotlight.imageLabel")}</span>
          </div>

          <div className="vcommerce-spotlight__content">
            <div className="vcommerce-spotlight__badges">
              <span className="vcommerce-spotlight__sponsored">{t("home:vcommerceSpotlight.sponsored")}</span>
              <span className="vcommerce-spotlight__verified"><IconShieldCheck aria-hidden="true" /> {t("home:vcommerceSpotlight.verifiedBusiness")}</span>
            </div>

            <h3>{business.name}</h3>
            <p className="vcommerce-spotlight__category">{business.categoryLabel}</p>
            {business.location ? (
              <p className="vcommerce-spotlight__location"><IconMapPin aria-hidden="true" /> {business.location}</p>
            ) : null}
            {business.reviewCount > 0 && (
              <p className="vcommerce-spotlight__rating">
                <IconStarFilled aria-hidden="true" /> <strong>{Number(business.rating).toFixed(1)}</strong>{" "}
                {t("home:vcommerceSpotlight.reviewCount", { count: business.reviewCount })}
              </p>
            )}

            <div className="vcommerce-spotlight__tags">
              {tags.map((tag) => <span key={tag}>{tag}</span>)}
            </div>

            {business.cashbackPercent > 0 && (
              <p className="vcommerce-spotlight__cashback">
                <IconWallet aria-hidden="true" /> {t("home:vcommerceSpotlight.cashback", { percent: business.cashbackPercent })}
              </p>
            )}
            {business.description ? <p className="vcommerce-spotlight__description">{business.description}</p> : null}

            <div className="vcommerce-spotlight__actions">
              <Link className="vcommerce-spotlight__primary cta-pulse" to={business.shopUrl}>{t("home:vcommerceSpotlight.visitShop")} <IconArrowRight aria-hidden="true" /></Link>
              <Link className="vcommerce-spotlight__secondary cta-pulse" to="/vcommerce">{t("home:vcommerceSpotlight.exploreVCommerce")} <IconArrowRight aria-hidden="true" /></Link>
            </div>
          </div>
        </article>

        <p className="vcommerce-spotlight__disclosure">{t("home:vcommerceSpotlight.disclosure")}</p>
      </div>
    </section>
  );
}
