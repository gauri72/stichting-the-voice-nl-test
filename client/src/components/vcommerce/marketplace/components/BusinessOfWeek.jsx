import { Link } from "react-router-dom";
import { IconStar, IconMapPin, IconArrowRight, IconCrown } from "@tabler/icons-react";
import { useState } from "react";
import { Badge, FavouriteButton, StarRating, SkeletonBlock, ImageWithFallback } from "./ui.jsx";
import { useFavourites } from "../lib/useFavourites.js";

function BOTWCard({ business, isFeatured }) {
  const { isFavourite, toggleFavourite } = useFavourites();
  const fav = isFavourite(business.id);

  return (
    <div className="vcohp-mob__botw-card" style={{ background: "var(--mkt-surface)", borderColor: "var(--mkt-border)" }}>
      <div className="vcohp-mob__botw-img" style={{ position: "relative" }}>
        <ImageWithFallback src={business.imageUrl} alt={business.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        {isFeatured && (
          <div className="vcohp-mob__botw-crown" aria-label="Featured business" style={{ background: "rgba(0,0,0,0.55)", color: "var(--mkt-gold)" }}>
            <IconCrown size={14} aria-hidden="true" />
          </div>
        )}
        <div className="vcohp-mob__botw-fav" style={{ background: "rgba(0,0,0,0.55)" }}>
          <FavouriteButton
            active={fav}
            onToggle={() => toggleFavourite({ id: business.id, name: business.name, imageUrl: business.imageUrl, shopUrl: business.shopUrl })}
            size={14}
            aria-label={`${fav ? "Remove" : "Add"} ${business.name} from favourites`}
          />
        </div>
      </div>

      <div className="vcohp-mob__botw-content">
        {isFeatured && <Badge color="purple">Featured</Badge>}
        <p className="vcohp-mob__botw-name" style={{ color: "var(--mkt-text)" }}>{business.name}</p>
        <p className="vcohp-mob__botw-cat" style={{ color: "var(--mkt-text-muted)" }}>{business.categoryLabel}</p>
        <p className="vcohp-mob__botw-loc" style={{ color: "var(--mkt-text-muted)" }}>
          <IconMapPin size={12} aria-hidden="true" /> {business.location}
        </p>
        <p className="vcohp-mob__botw-rating">
          <StarRating rating={business.rating} />
          <span style={{ color: "var(--mkt-text)", fontSize: "0.75rem" }}>
            {business.rating > 0 ? `${business.rating.toFixed(1)} (${business.reviewCount} reviews)` : "No reviews yet"}
          </span>
        </p>
        {business.tags.length > 0 && (
          <div className="vcohp-mob__botw-tags">
            {business.tags.map((t) => (
              <span key={t} className="vcohp-mob__botw-tag" style={{ background: "var(--mkt-border)", borderColor: "var(--mkt-border-md)", color: "var(--mkt-text-2)" }}>{t}</span>
            ))}
          </div>
        )}
        <Link to={business.shopUrl} className="vcohp-mob__botw-visit" style={{ borderColor: "var(--mkt-border-strong)", color: "var(--mkt-cyan)" }}>
          Visit Shop <IconArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

/** Mobile Business of the Week section. */
export function MobileBOTW({ featured, alternates, loading, error }) {
  const [activeIdx, setActiveIdx] = useState(0);

  const allCards = featured
    ? [{ ...featured, _isFeatured: true }, ...alternates.map((b) => ({ ...b, _isFeatured: false }))]
    : alternates.map((b) => ({ ...b, _isFeatured: false }));

  const current = allCards[activeIdx];

  if (loading) {
    return (
      <section>
        <SkeletonBlock style={{ height: 200, borderRadius: 16, marginBottom: 8 }} />
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <p style={{ color: "var(--mkt-text-muted)", fontSize: "0.8rem", textAlign: "center", padding: "20px 0" }}>
          Business spotlight unavailable right now.
        </p>
      </section>
    );
  }

  if (!current) {
    return (
      <section>
        <p style={{ color: "var(--mkt-text-muted)", fontSize: "0.8rem", textAlign: "center", padding: "20px 0" }}>
          No featured businesses yet — check back soon!
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="vcohp-mob-botw-title">
      <div className="vcohp-mob__sec-hdr">
        <h2 className="vcohp-mob__sec-title" id="vcohp-mob-botw-title" style={{ color: "var(--mkt-text)" }}>
          Business of the Week
        </h2>
        <Link to="/vcommerce/businesses" className="vcohp-mob__sec-link" style={{ color: "var(--mkt-cyan)" }}>
          View All ›
        </Link>
      </div>

      <BOTWCard business={current} isFeatured={current._isFeatured} />

      {allCards.length > 1 && (
        <div className="vcohp-mob__botw-dots" role="tablist" aria-label="Business spotlight carousel">
          {allCards.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === activeIdx}
              aria-label={`Show business ${i + 1}`}
              onClick={() => setActiveIdx(i)}
              className={`vcohp-mob__botw-dot${i === activeIdx ? " vcohp-mob__botw-dot--active" : ""}`}
              style={{ background: i === activeIdx ? "var(--mkt-cyan)" : "var(--mkt-border-md)", border: "none", cursor: "pointer" }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/** Desktop Business of the Week card. */
export function DesktopBOTW({ featured, alternates, loading, error }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const { isFavourite, toggleFavourite } = useFavourites();

  const allCards = featured
    ? [{ ...featured, _isFeatured: true }, ...alternates.map((b) => ({ ...b, _isFeatured: false }))]
    : alternates.map((b) => ({ ...b, _isFeatured: false }));

  const biz = allCards[activeIdx];

  if (loading) {
    return (
      <aside>
        <SkeletonBlock style={{ height: 420, borderRadius: 16 }} />
      </aside>
    );
  }

  if (error || !biz) {
    return (
      <aside>
        <div className="vcohp-desk__botw" style={{ background: "var(--mkt-surface)", borderColor: "var(--mkt-border)", padding: "32px 16px", textAlign: "center" }}>
          <p style={{ color: "var(--mkt-text-muted)", fontSize: "0.82rem" }}>
            {error ? "Spotlight unavailable." : "No featured businesses yet."}
          </p>
        </div>
      </aside>
    );
  }

  const fav = isFavourite(biz.id);

  return (
    <aside aria-labelledby="vcohp-desk-botw-label">
      <div className="vcohp-desk__botw" style={{ background: "var(--mkt-surface)", borderColor: "var(--mkt-border)" }}>
        <div className="vcohp-desk__botw-label" id="vcohp-desk-botw-label" style={{ borderBottomColor: "var(--mkt-border)", color: "var(--mkt-gold)" }}>
          <IconStar size={14} aria-hidden="true" /> Business of the Week
        </div>

        <div className="vcohp-desk__botw-img" style={{ position: "relative" }}>
          <ImageWithFallback src={biz.imageUrl} alt={biz.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

        <div className="vcohp-desk__botw-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            {biz._isFeatured && <Badge color="purple">Featured</Badge>}
            <FavouriteButton
              active={fav}
              onToggle={() => toggleFavourite({ id: biz.id, name: biz.name, imageUrl: biz.imageUrl, shopUrl: biz.shopUrl })}
              aria-label={`${fav ? "Remove" : "Add"} ${biz.name} from favourites`}
            />
          </div>
          <p className="vcohp-desk__botw-name" style={{ color: "var(--mkt-text)" }}>{biz.name}</p>
          <p className="vcohp-desk__botw-cat" style={{ color: "var(--mkt-text-muted)" }}>{biz.categoryLabel}</p>
          <p className="vcohp-desk__botw-loc" style={{ color: "var(--mkt-text-muted)" }}>
            <IconMapPin size={13} aria-hidden="true" /> {biz.location}
          </p>
          <p className="vcohp-desk__botw-rating">
            <StarRating rating={biz.rating} />
            <span style={{ color: "var(--mkt-text)", marginLeft: 4 }}>{biz.rating > 0 ? biz.rating.toFixed(1) : ""}</span>
            <span style={{ color: "var(--mkt-text-muted)" }}>{biz.reviewCount > 0 ? ` (${biz.reviewCount} reviews)` : ""}</span>
          </p>
          {biz.tags.length > 0 && (
            <div className="vcohp-desk__botw-tags">
              {biz.tags.map((t) => (
                <span key={t} className="vcohp-desk__botw-tag" style={{ background: "var(--mkt-border)", borderColor: "var(--mkt-border-md)", color: "var(--mkt-text-2)" }}>{t}</span>
              ))}
            </div>
          )}
          <Link to={biz.shopUrl} className="vcohp-desk__botw-visit" style={{ borderColor: "var(--mkt-border-strong)", color: "var(--mkt-cyan)" }}>
            Visit Shop <IconArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        {allCards.length > 1 && (
          <div className="vcohp-desk__botw-dots" role="tablist" aria-label="Business spotlight carousel">
            {allCards.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === activeIdx}
                aria-label={`Show business ${i + 1}`}
                onClick={() => setActiveIdx(i)}
                className={`vcohp-desk__botw-dot${i === activeIdx ? " vcohp-desk__botw-dot--active" : ""}`}
                style={{ background: i === activeIdx ? "var(--mkt-cyan)" : "var(--mkt-border-md)", border: "none", cursor: "pointer" }}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
