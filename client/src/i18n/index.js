import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enCommon from "./locales/en/common.json";
import enHome from "./locales/en/home.json";
import enEvents from "./locales/en/events.json";
import enAbout from "./locales/en/about.json";
import enDonate from "./locales/en/donate.json";
import enMembership from "./locales/en/membership.json";
import enSponsorship from "./locales/en/sponsorship.json";
import enInnovation from "./locales/en/innovation.json";
import enImpact from "./locales/en/impact.json";
import enStories from "./locales/en/stories.json";
import enPolicies from "./locales/en/policies.json";
import enAuth from "./locales/en/auth.json";
import enCheckout from "./locales/en/checkout.json";
import enMisc from "./locales/en/misc.json";
import enCookies from "./locales/en/cookies.json";

import nlCommon from "./locales/nl/common.json";
import nlHome from "./locales/nl/home.json";
import nlEvents from "./locales/nl/events.json";
import nlAbout from "./locales/nl/about.json";
import nlDonate from "./locales/nl/donate.json";
import nlMembership from "./locales/nl/membership.json";
import nlSponsorship from "./locales/nl/sponsorship.json";
import nlInnovation from "./locales/nl/innovation.json";
import nlImpact from "./locales/nl/impact.json";
import nlStories from "./locales/nl/stories.json";
import nlPolicies from "./locales/nl/policies.json";
import nlAuth from "./locales/nl/auth.json";
import nlCheckout from "./locales/nl/checkout.json";
import nlMisc from "./locales/nl/misc.json";
import nlCookies from "./locales/nl/cookies.json";

import deCommon from "./locales/de/common.json";
import deHome from "./locales/de/home.json";
import deEvents from "./locales/de/events.json";
import deAbout from "./locales/de/about.json";
import deDonate from "./locales/de/donate.json";
import deMembership from "./locales/de/membership.json";
import deSponsorship from "./locales/de/sponsorship.json";
import deInnovation from "./locales/de/innovation.json";
import deImpact from "./locales/de/impact.json";
import deStories from "./locales/de/stories.json";
import dePolicies from "./locales/de/policies.json";
import deAuth from "./locales/de/auth.json";
import deCheckout from "./locales/de/checkout.json";
import deMisc from "./locales/de/misc.json";
import deCookies from "./locales/de/cookies.json";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "nl", label: "Dutch", nativeLabel: "Nederlands" },
  { code: "de", label: "German", nativeLabel: "Deutsch" },
];

export const LANGUAGE_STORAGE_KEY = "voice_lang";

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        home: enHome,
        events: enEvents,
        about: enAbout,
        donate: enDonate,
        membership: enMembership,
        sponsorship: enSponsorship,
        innovation: enInnovation,
        impact: enImpact,
        stories: enStories,
        policies: enPolicies,
        auth: enAuth,
        checkout: enCheckout,
        misc: enMisc,
        cookies: enCookies,
      },
      nl: {
        common: nlCommon,
        home: nlHome,
        events: nlEvents,
        about: nlAbout,
        donate: nlDonate,
        membership: nlMembership,
        sponsorship: nlSponsorship,
        innovation: nlInnovation,
        impact: nlImpact,
        stories: nlStories,
        policies: nlPolicies,
        auth: nlAuth,
        checkout: nlCheckout,
        misc: nlMisc,
        cookies: nlCookies,
      },
      de: {
        common: deCommon,
        home: deHome,
        events: deEvents,
        about: deAbout,
        donate: deDonate,
        membership: deMembership,
        sponsorship: deSponsorship,
        innovation: deInnovation,
        impact: deImpact,
        stories: deStories,
        policies: dePolicies,
        auth: deAuth,
        checkout: deCheckout,
        misc: deMisc,
        cookies: deCookies,
      },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "nl", "de"],
    load: "languageOnly",
    ns: [
      "common",
      "home",
      "events",
      "about",
      "donate",
      "membership",
      "sponsorship",
      "innovation",
      "impact",
      "stories",
      "policies",
      "auth",
      "checkout",
      "misc",
      "cookies",
    ],
    defaultNS: "common",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ["localStorage"],
    },
    react: { useSuspense: false },
  });

if (typeof document !== "undefined") {
  document.documentElement.lang = i18next.language || "en";
  i18next.on("languageChanged", (lng) => {
    document.documentElement.lang = lng;
  });
}

export default i18next;
