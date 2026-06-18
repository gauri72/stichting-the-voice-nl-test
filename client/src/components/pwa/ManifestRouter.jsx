import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  getManifestHref,
  getPwaMeta,
  getPwaVariantForPath,
} from "../../pwa/manifestConfig.js";

function upsertMeta(name, content) {
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

export default function ManifestRouter() {
  const { pathname } = useLocation();
  const variant = getPwaVariantForPath(pathname);
  const meta = getPwaMeta(variant);

  useEffect(() => {
    const href = getManifestHref(variant);

    let manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) {
      manifestLink = document.createElement("link");
      manifestLink.setAttribute("rel", "manifest");
      document.head.appendChild(manifestLink);
    }
    manifestLink.setAttribute("href", href);

    upsertMeta("theme-color", meta.themeColor);
    upsertMeta("apple-mobile-web-app-title", meta.appleTitle);
  }, [variant, meta.appleTitle, meta.themeColor]);

  return null;
}
