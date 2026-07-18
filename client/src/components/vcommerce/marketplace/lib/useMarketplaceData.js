import { useState, useEffect } from "react";
import {
  getVCommerceFeatured,
  getVCommerceStats,
  getVCommercePopularProducts,
} from "../../shared/vcommerceApi.js";
import { mapBusiness, mapProduct } from "./mappers.js";
import { KNVERS_FEATURED_BUSINESS } from "../../shared/knversFeatured.js";

/**
 * Fetches all marketplace landing-page data with independent loading/error
 * states per section so one failing API call doesn't take down the others.
 */
export function useMarketplaceData() {
  const [featured, setFeatured] = useState(KNVERS_FEATURED_BUSINESS);
  const [alternates, setAlternates] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [featuredError, setFeaturedError] = useState(null);

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    getVCommerceFeatured()
      .then((data) => {
        if (cancelled) return;
        const biz = data?.business ? mapBusiness(data.business) : null;
        const alts = Array.isArray(data?.alternates)
          ? data.alternates.map(mapBusiness).filter(Boolean)
          : [];
        setFeatured(KNVERS_FEATURED_BUSINESS);
        setAlternates(biz && biz.slug !== "knvers" ? [biz, ...alts.filter((item) => item.slug !== "knvers")] : alts);
      })
      .catch((err) => {
        if (!cancelled) setFeaturedError(null);
      })
      .finally(() => {
        if (!cancelled) setFeaturedLoading(false);
      });

    getVCommerceStats()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((err) => {
        if (!cancelled) setStatsError(err.message || "Could not load statistics.");
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });

    getVCommercePopularProducts({ limit: 12 })
      .then((data) => {
        if (cancelled) return;
        const mapped = Array.isArray(data?.products)
          ? data.products.map(mapProduct).filter(Boolean)
          : [];
        setProducts(mapped);
      })
      .catch((err) => {
        if (!cancelled) setProductsError(err.message || "Could not load products.");
      })
      .finally(() => {
        if (!cancelled) setProductsLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return {
    featured,
    alternates,
    featuredLoading,
    featuredError,
    stats,
    statsLoading,
    statsError,
    products,
    productsLoading,
    productsError,
  };
}
