import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api.js";
import { slugFromPath } from "../utils/pagesAdmin.js";

export function useCmsPage(slugOrPath, { preview = false, version = "published" } = {}) {
  const slug = slugOrPath?.startsWith("/") ? slugFromPath(slugOrPath) : slugOrPath;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasCms, setHasCms] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const path = preview
          ? `/api/public/pages/${slug}/preview?version=${version}`
          : `/api/public/pages/${slug}`;
        const result = await apiFetch(path);
        if (!cancelled) {
          setData(result);
          setHasCms(true);
        }
      } catch {
        if (!cancelled) {
          setData(null);
          setHasCms(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (slug) load();
    return () => { cancelled = true; };
  }, [slug, preview, version]);

  return { data, loading, hasCms, slug };
}

export function useCmsHeader() {
  const [header, setHeader] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/public/site/header")
      .then((data) => { if (!cancelled) setHeader(data); })
      .catch(() => { if (!cancelled) setHeader(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { header, loading };
}

export function useCmsFooter() {
  const [footer, setFooter] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/public/site/footer")
      .then((data) => { if (!cancelled) setFooter(data); })
      .catch(() => { if (!cancelled) setFooter(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { footer, loading };
}

export function useContentOverrides() {
  const [overrides, setOverrides] = useState({});

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/public/content-overrides")
      .then((data) => { if (!cancelled) setOverrides(data || {}); })
      .catch(() => { if (!cancelled) setOverrides({}); });
    return () => { cancelled = true; };
  }, []);

  return overrides;
}

export function useCmsDesignSystem() {
  const [designSystem, setDesignSystem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/public/site/design-system")
      .then((data) => { if (!cancelled) setDesignSystem(data); })
      .catch(() => { if (!cancelled) setDesignSystem(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { designSystem, loading };
}

export function useCmsSeo(pageData) {
  useEffect(() => {
    if (!pageData?.seo) return;
    const { seo, title } = pageData;
    if (seo.metaTitle || title) {
      document.title = seo.metaTitle || title;
    }
    const setMeta = (name, content) => {
      if (!content) return;
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    setMeta("description", seo.metaDescription);
    if (seo.keywords) setMeta("keywords", seo.keywords);
    if (seo.robotsIndex === false) setMeta("robots", "noindex, nofollow");
  }, [pageData]);
}
