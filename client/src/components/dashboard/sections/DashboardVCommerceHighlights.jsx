import { Link } from "react-router-dom";
import { IconArrowRight, IconMapPin, IconShieldCheck, IconStar } from "@tabler/icons-react";
import { useMarketplaceData } from "../../vcommerce/marketplace/lib/useMarketplaceData.js";
import { KNVERS_FEATURED_BUSINESS } from "../../vcommerce/shared/knversFeatured.js";
import productTechnova from "../../../assets/VCommerce/mockup/product-technova.png";
import productAaray from "../../../assets/VCommerce/mockup/product-aaray.png";
import productSpice from "../../../assets/VCommerce/mockup/product-spice-route.png";
import productSoulful from "../../../assets/VCommerce/mockup/product-soulful.png";
import productUrban from "../../../assets/VCommerce/mockup/product-urban.png";
import productArtvilla from "../../../assets/VCommerce/mockup/product-artvilla.png";
import "../../../styles/dashboard-vcommerce-highlights.css";

const fallbackProducts = [
  ["TechNova Hub", "Wireless Speaker", "Tech & Digital", 89, 7, productTechnova],
  ["Aaray Naturals", "Natural Wellness", "Health & Wellness", 25, 10, productAaray],
  ["Spice Route NL", "Artisan Spices", "Food & Beverages", 14.5, 8, productSpice],
  ["Soulful Elements", "Home Collection", "Home Decor", 39.9, 10, productSoulful],
  ["Urban Threads", "Fashion Collection", "Fashion & Accessories", 49.9, 6, productUrban],
  ["Artvilla Creations", "Original Artwork", "Art & Creative", 120, 12, productArtvilla],
].map(([businessName, name, category, price, cashbackPercent, imageUrl], index) => ({
  id: `dashboard-fallback-${index}`,
  businessName,
  name,
  category,
  price,
  cashbackPercent,
  imageUrl,
  businessSlug: "",
}));

function LoadingCard() {
  return <div className="dash-vcommerce__skeleton" aria-hidden="true" />;
}

export default function DashboardVCommerceHighlights() {
  const {
    featured,
    featuredLoading,
    featuredError,
    products,
    productsLoading,
    productsError,
  } = useMarketplaceData();

  const business = featured || KNVERS_FEATURED_BUSINESS;
  const displayedProducts = products.length ? products.slice(0, 6) : fallbackProducts;

  return (
    <section className="dash-vcommerce" aria-labelledby="dash-vcommerce-title">
      <header className="dash-vcommerce__intro">
        <div>
          <p>V.O.I.C.E. NL Community Marketplace</p>
          <h2 id="dash-vcommerce-title">Discover V.Commerce</h2>
        </div>
        <Link to="/vcommerce">
          Explore Marketplace <IconArrowRight size={18} aria-hidden="true" />
        </Link>
      </header>

      <div className="dash-vcommerce__layout">
        <article className="dash-vcommerce__featured">
          <div className="dash-vcommerce__section-heading">
            <h3><IconStar size={19} aria-hidden="true" /> Business of the Week</h3>
            <Link to="/vcommerce/businesses">View All <IconArrowRight size={15} /></Link>
          </div>

          {featuredLoading ? <LoadingCard /> : (
            <div className="dash-vcommerce__featured-card">
              <div className="dash-vcommerce__featured-media">
                <img src={business.mobileSpotlightImageUrl || KNVERS_FEATURED_BUSINESS.mobileSpotlightImageUrl} alt={business.name} />
                <span>Featured Community Business</span>
              </div>
              <div>
                <h4>{business.name}</h4>
                <p>{business.categoryLabel}</p>
                <p><IconMapPin size={14} /> {business.location}</p>
                <p className="dash-vcommerce__rating">
                  ★ {business.rating ? Number(business.rating).toFixed(1) : "New"}
                  {business.reviewCount ? ` (${business.reviewCount} reviews)` : ""}
                </p>
                <div className="dash-vcommerce__tags">
                  {(business.tags || []).slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
                </div>
                <Link to={business.shopUrl || "/vcommerce/businesses"}>
                  Visit Shop <IconArrowRight size={17} />
                </Link>
              </div>
            </div>
          )}
          {featuredError && <small className="dash-vcommerce__notice">Showing our latest marketplace spotlight.</small>}
        </article>

        <article className="dash-vcommerce__popular">
          <div className="dash-vcommerce__section-heading">
            <h3>Popular Picks For You</h3>
            <Link to="/vcommerce/businesses">View All <IconArrowRight size={15} /></Link>
          </div>
          <div className="dash-vcommerce__products">
            {productsLoading
              ? [0, 1, 2, 3].map((item) => <LoadingCard key={item} />)
              : displayedProducts.map((product) => (
                <Link
                  key={product.id}
                  className="dash-vcommerce__product"
                  to={product.businessSlug ? `/vcommerce/${product.businessSlug}` : "/vcommerce/businesses"}
                >
                  <img src={product.imageUrl} alt={product.name} />
                  <div>
                    <h4>{product.businessName || product.name}</h4>
                    <p>{product.name || product.category}</p>
                    <strong>€{Number(product.price || 0).toFixed(2)}</strong>
                    {Number(product.cashbackPercent) > 0 && (
                      <small><IconShieldCheck size={12} /> {product.cashbackPercent}% Cashback</small>
                    )}
                  </div>
                </Link>
              ))}
          </div>
          {productsError && <small className="dash-vcommerce__notice">Showing a curated marketplace selection.</small>}
        </article>
      </div>
    </section>
  );
}
