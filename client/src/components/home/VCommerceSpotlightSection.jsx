import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  IconArrowRight,
  IconMapPin,
  IconShieldCheck,
  IconStarFilled,
  IconWallet,
} from "@tabler/icons-react";
import { getVCommerceFeatured } from "../vcommerce/shared/vcommerceApi.js";
import { mapBusiness } from "../vcommerce/marketplace/lib/mappers.js";
import artisanLamp from "../../assets/VCommerce/mockup/artisan-lamp-mobile.png";
import "../../styles/vcommerce-spotlight-section.css";

const FALLBACK = {
  name: "The Artisan Space",
  categoryLabel: "Home & Living",
  location: "Rotterdam, NL",
  rating: 4.8,
  reviewCount: 128,
  tags: ["Handmade", "Sustainable", "Premium"],
  cashbackPercent: 10,
  description: "Handcrafted home décor with timeless designs. Thoughtfully made and sustainably sourced.",
  shopUrl: "/vcommerce/businesses",
};

export default function VCommerceSpotlightSection() {
  const [business, setBusiness] = useState(FALLBACK);

  useEffect(() => {
    let active = true;
    getVCommerceFeatured()
      .then((data) => {
        const mapped = data?.business ? mapBusiness(data.business) : null;
        if (active && mapped) setBusiness({ ...FALLBACK, ...mapped });
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const rating = Number(business.rating || FALLBACK.rating).toFixed(1);
  const tags = (business.tags?.length ? business.tags : FALLBACK.tags).slice(0, 3);

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
            <img src={artisanLamp} alt="Handcrafted artisan lamp from the featured business" />
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
            <p className="vcommerce-spotlight__rating"><IconStarFilled aria-hidden="true" /> <strong>{rating}</strong> ({business.reviewCount || FALLBACK.reviewCount} reviews)</p>

            <div className="vcommerce-spotlight__tags">
              {tags.map((tag) => <span key={tag}>{tag}</span>)}
            </div>

            <p className="vcommerce-spotlight__cashback"><IconWallet aria-hidden="true" /> {business.cashbackPercent || FALLBACK.cashbackPercent}% V.Wallet Cashback</p>
            <p className="vcommerce-spotlight__description">{business.description || FALLBACK.description}</p>

            <div className="vcommerce-spotlight__actions">
              <Link className="vcommerce-spotlight__primary" to={business.shopUrl || FALLBACK.shopUrl}>Visit Shop <IconArrowRight aria-hidden="true" /></Link>
              <Link className="vcommerce-spotlight__secondary" to="/vcommerce">Explore V.Commerce <IconArrowRight aria-hidden="true" /></Link>
            </div>
          </div>
        </article>

        <p className="vcommerce-spotlight__disclosure">Sponsored placement supports Stichting The V.O.I.C.E. NL programmes.</p>
      </div>
    </section>
  );
}
