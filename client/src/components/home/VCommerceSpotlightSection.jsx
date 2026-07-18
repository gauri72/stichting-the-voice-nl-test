import { Link } from "react-router-dom";
import {
  IconArrowRight,
  IconMapPin,
  IconShieldCheck,
  IconStarFilled,
  IconWallet,
} from "@tabler/icons-react";
import { KNVERS_FEATURED_BUSINESS } from "../vcommerce/shared/knversFeatured.js";
import "../../styles/vcommerce-spotlight-section.css";

export default function VCommerceSpotlightSection() {
  const business = KNVERS_FEATURED_BUSINESS;
  const tags = business.tags.slice(0, 3);

  return (
    <section className="vcommerce-spotlight" aria-labelledby="partner-with-us-title">
      <div className="vcommerce-spotlight__inner">
        <header className="vcommerce-spotlight__heading">
          <p className="vcommerce-spotlight__eyebrow">Create Meaningful Impact Together</p>
          <h2 id="partner-with-us-title">Partner With Us</h2>
          <p>Support our mission through sponsorship, donations, or by growing with our community marketplace.</p>
        </header>

        <div className="vcommerce-spotlight__subheading">
          <h3>V.Commerce Spotlight</h3>
          <span>Discover businesses powering our community.</span>
        </div>

        <article className="vcommerce-spotlight__card">
          <div className="vcommerce-spotlight__media">
            <picture>
              <source media="(max-width: 760px)" srcSet={business.mobileSpotlightImageUrl} />
              <img src={business.bannerUrl} alt="Knvers digital commerce and IT solutions" />
            </picture>
            <span className="vcommerce-spotlight__image-label">Featured Community Business</span>
          </div>

          <div className="vcommerce-spotlight__content">
            <div className="vcommerce-spotlight__badges">
              <span className="vcommerce-spotlight__sponsored">Sponsored</span>
              <span className="vcommerce-spotlight__verified"><IconShieldCheck aria-hidden="true" /> Verified Business</span>
            </div>

            <h3>{business.name}</h3>
            <p className="vcommerce-spotlight__category">{business.categoryLabel}</p>
            <p className="vcommerce-spotlight__location"><IconMapPin aria-hidden="true" /> {business.location}</p>
            {business.reviewCount > 0 && <p className="vcommerce-spotlight__rating"><IconStarFilled aria-hidden="true" /> <strong>{Number(business.rating).toFixed(1)}</strong> ({business.reviewCount} reviews)</p>}

            <div className="vcommerce-spotlight__tags">
              {tags.map((tag) => <span key={tag}>{tag}</span>)}
            </div>

            {business.cashbackPercent > 0 && <p className="vcommerce-spotlight__cashback"><IconWallet aria-hidden="true" /> {business.cashbackPercent}% V.Wallet Cashback</p>}
            <p className="vcommerce-spotlight__description">{business.description}</p>

            <div className="vcommerce-spotlight__actions">
              <Link className="vcommerce-spotlight__primary" to={business.shopUrl}>Visit Shop <IconArrowRight aria-hidden="true" /></Link>
              <Link className="vcommerce-spotlight__secondary" to="/vcommerce">Explore V.Commerce <IconArrowRight aria-hidden="true" /></Link>
            </div>
          </div>
        </article>

        <p className="vcommerce-spotlight__disclosure">Sponsored placement supports Stichting The V.O.I.C.E. NL programmes.</p>
      </div>
    </section>
  );
}
