import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IconShieldCheck } from "@tabler/icons-react";
import { FavouriteButton, ImageWithFallback, SkeletonBlock, SectionHeader } from "./ui.jsx";
import { useFavourites } from "../lib/useFavourites.js";

function ProductCard({ product, variant = "desktop" }) {
  const { t } = useTranslation(["vcommerceShop"]);
  const { isFavourite, toggleFavourite } = useFavourites();
  const fav = isFavourite(product.id);
  const isDesktop = variant === "desktop";

  const imgHeight = isDesktop ? 148 : 108;
  const cardWidth = isDesktop ? 188 : 138;

  return (
    <Link
      to={`/vcommerce/${product.businessSlug}`}
      className={isDesktop ? "vcohp-desk__pick" : "vcohp-mob__pick"}
      style={{ background: "var(--mkt-surface)", borderColor: "var(--mkt-border)", color: "var(--mkt-text)", width: cardWidth, flexShrink: 0 }}
    >
      <div className={isDesktop ? "vcohp-desk__pick-img" : "vcohp-mob__pick-img"} style={{ height: imgHeight, position: "relative", overflow: "hidden" }}>
        <ImageWithFallback
          src={product.imageUrl}
          alt={product.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        <div
          className={isDesktop ? "vcohp-desk__pick-fav" : "vcohp-mob__pick-fav"}
          style={{ position: "absolute", top: isDesktop ? 10 : 8, right: isDesktop ? 10 : 8, background: "rgba(0,0,0,0.5)", borderRadius: "50%", width: isDesktop ? 30 : 26, height: isDesktop ? 30 : 26, display: "flex", alignItems: "center", justifyContent: "center", color: fav ? "var(--mkt-pink)" : "inherit" }}
        >
          <FavouriteButton
            active={fav}
            onToggle={() => toggleFavourite({ id: product.id, name: product.name, imageUrl: product.imageUrl, shopUrl: `/vcommerce/${product.businessSlug}` })}
            size={isDesktop ? 14 : 12}
            aria-label={fav
              ? t("vcommerceShop:popularPicks.removeFromFavourites", { name: product.name })
              : t("vcommerceShop:popularPicks.addToFavourites", { name: product.name })}
          />
        </div>
      </div>

      <div className={isDesktop ? "vcohp-desk__pick-body" : "vcohp-mob__pick-body"} style={{ padding: isDesktop ? 12 : 10 }}>
        <p className={isDesktop ? "vcohp-desk__pick-name" : "vcohp-mob__pick-name"}>{product.businessName}</p>
        <p className={isDesktop ? "vcohp-desk__pick-cat" : "vcohp-mob__pick-cat"} style={{ color: "var(--mkt-text-muted)" }}>{product.name}</p>
        <p className={isDesktop ? "vcohp-desk__pick-price" : "vcohp-mob__pick-price"}>
          €{product.price.toFixed(2)}
        </p>
        {product.cashbackPercent > 0 && (
          <p className={isDesktop ? "vcohp-desk__pick-cashback" : "vcohp-mob__pick-cashback"} style={{ color: "var(--mkt-green)" }}>
            <IconShieldCheck size={isDesktop ? 12 : 11} aria-hidden="true" /> {product.cashbackPercent}% {isDesktop ? t("vcommerceShop:popularPicks.cashbackDesktop") : t("vcommerceShop:popularPicks.cashbackMobile")}
          </p>
        )}
      </div>
    </Link>
  );
}

export function DesktopPopularPicks({ products, loading, error }) {
  const { t } = useTranslation(["vcommerceShop"]);
  if (loading) {
    return (
      <section aria-labelledby="vcohp-desk-picks-title">
        <div className="vcohp-desk__picks-hdr">
          <SkeletonBlock style={{ width: 200, height: 18 }} />
        </div>
        <div className="vcohp-desk__picks-scroll">
          {[0,1,2,3,4].map((i) => <SkeletonBlock key={i} style={{ width: 188, height: 250, flexShrink: 0, borderRadius: 12 }} />)}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <p style={{ color: "var(--mkt-text-muted)", fontSize: "0.8rem" }}>{t("vcommerceShop:popularPicks.unavailable")}</p>
      </section>
    );
  }

  if (!products.length) {
    return (
      <section>
        <p style={{ color: "var(--mkt-text-muted)", fontSize: "0.8rem" }}>{t("vcommerceShop:popularPicks.none")}</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="vcohp-desk-picks-title">
      <div className="vcohp-desk__picks-hdr">
        <h2 className="vcohp-desk__picks-title" id="vcohp-desk-picks-title">{t("vcommerceShop:popularPicks.desktopTitle")}</h2>
        <Link to="/vcommerce/businesses" className="vcohp-desk__picks-link" style={{ color: "var(--mkt-cyan)" }}>
          {t("vcommerceShop:popularPicks.viewAll")} <IconShieldCheck size={14} aria-hidden="true" />
        </Link>
      </div>
      <div className="vcohp-desk__picks-scroll" role="list">
        {products.map((p) => <ProductCard key={p.id} product={p} variant="desktop" />)}
      </div>
    </section>
  );
}

export function MobilePopularPicks({ products, loading, error }) {
  const { t } = useTranslation(["vcommerceShop"]);
  const title = t("vcommerceShop:popularPicks.mobileTitle");
  if (loading) {
    return (
      <section>
        <SectionHeader title={title} />
        <div className="vcohp-mob__picks">
          {[0,1,2,3].map((i) => <SkeletonBlock key={i} style={{ width: 138, height: 210, flexShrink: 0, borderRadius: 12 }} />)}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <SectionHeader title={title} />
        <p style={{ color: "var(--mkt-text-muted)", fontSize: "0.8rem" }}>{t("vcommerceShop:popularPicks.unavailable")}</p>
      </section>
    );
  }

  if (!products.length) {
    return (
      <section>
        <SectionHeader title={title} />
        <p style={{ color: "var(--mkt-text-muted)", fontSize: "0.8rem" }}>{t("vcommerceShop:popularPicks.none")}</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="vcohp-mob-picks-title">
      <SectionHeader title={title} linkLabel={t("vcommerceShop:popularPicks.viewAll")} linkHref="/vcommerce/businesses" />
      <div className="vcohp-mob__picks" role="list" aria-label={t("vcommerceShop:popularPicks.scrollableAriaLabel")}>
        {products.map((p) => <ProductCard key={p.id} product={p} variant="mobile" />)}
      </div>
    </section>
  );
}
