import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  IconArrowRight, IconBell, IconBriefcase, IconBuildingStore, IconCategory,
  IconGlobe, IconHeart, IconHome, IconMenu2, IconPackage, IconPlane, IconSearch,
  IconShieldCheck, IconShoppingBag, IconShoppingCart, IconSparkles,
  IconStar, IconTicket, IconUser, IconUsers, IconWallet, IconYoga,
  IconChevronDown, IconX,
} from "@tabler/icons-react";
import { useMarketplaceData } from "./lib/useMarketplaceData.js";
import { ImageWithFallback } from "./components/ui.jsx";
import ThemeToggle from "../../layout/ThemeToggle.jsx";
import LanguageSwitcher from "../../layout/LanguageSwitcher.jsx";
import HeroActionCluster from "../../layout/HeroActionCluster.jsx";
import SiteInstallPwaPrompt from "../../pwa/SiteInstallPwaPrompt.jsx";
import { BUSINESS_CATEGORIES, BUSINESS_CATEGORY_LABELS } from "../shared/BUSINESS_CATEGORIES.js";
import { useCart } from "../cart/useCart.js";
import logo from "../../../assets/header-logo.png";
import heroOpen from "../../../assets/VCommerce/mockup/hero-open.png";
import heroShopkeeper from "../../../assets/VCommerce/mockup/hero-shopkeeper.png";
import heroBusinesswoman from "../../../assets/VCommerce/mockup/hero-businesswoman.png";
import heroWarehouse from "../../../assets/VCommerce/mockup/hero-warehouse.png";
import heroGlobalCart from "../../../assets/VCommerce/mockup/hero-global-cart.png";
import mobileHeroGlobalCart from "../../../assets/VCommerce/mockup/mobile-hero-global-cart.png";
import productTechnova from "../../../assets/VCommerce/mockup/product-technova.png";
import productAaray from "../../../assets/VCommerce/mockup/product-aaray.png";
import productSpice from "../../../assets/VCommerce/mockup/product-spice-route.png";
import productSoulful from "../../../assets/VCommerce/mockup/product-soulful.png";
import productUrban from "../../../assets/VCommerce/mockup/product-urban.png";
import productArtvilla from "../../../assets/VCommerce/mockup/product-artvilla.png";
import desktopBrand from "../../../assets/VCommerce/vcommerce-header-brand.png";
import desktopBrandTransparent from "../../../assets/VCommerce/vcommerce-header-brand-transparent.png";

const BREAKPOINT = 768;
const subscribe = (callback) => {
  const query = window.matchMedia(`(max-width: ${BREAKPOINT - 1}px)`);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
};
const getSnapshot = () => window.matchMedia(`(max-width: ${BREAKPOINT - 1}px)`).matches;
const FALLBACK_NAMES = ["TechNova Hub", "Aaray Naturals", "Spice Route NL", "Soulful Elements", "Urban Threads", "Artvilla Creations"];
const FALLBACK_CATS = ["Tech & Digital", "Health & Wellness", "Food & Beverages", "Home Decor", "Fashion & Accessories", "Art & Creative"];
const FALLBACK_PRICES = [89, 25, 14.5, 39.9, 49.9, 120];
const FALLBACK_CASHBACK = [7, 10, 8, 10, 6, 12];
const MOCKUP_PRODUCTS = [productTechnova, productAaray, productSpice, productSoulful, productUrban, productArtvilla];

function Brand() {
  // NOTE: The org name and the literal expansion of the "V.O.I.C.E." acronym are
  // intentionally left untranslated — translating "Vision of International Cultural
  // Exchange" would break the acronym the name is built from.
  return <Link to="/" className="vcm-brand"><img src={logo} alt="V.O.I.C.E. NL" /><span><b>STICHTING<br />THE V.O.I.C.E. NL</b><small>The Vision of International<br />Cultural Exchange</small></span></Link>;
}

function DesktopBrand() {
  const { t } = useTranslation(["vcommerceShop"]);
  return <Link to="/" className="vcm-desktop-brand" aria-label={t("vcommerceShop:marketplaceHome.desktopBrandAriaLabel")}><img className="vcm-desktop-brand__dark" src={desktopBrand} alt="" aria-hidden="true" /><img className="vcm-desktop-brand__light" src={desktopBrandTransparent} alt="" aria-hidden="true" /></Link>;
}

function MobileToolbar() {
  const { t } = useTranslation(["vcommerceShop"]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);
  const { itemCount } = useCart();

  useEffect(() => {
    if (!menuOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!notificationsOpen) return undefined;
    const closeNotifications = (event) => {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
        return;
      }
      if (event.type === "pointerdown" && !notificationsRef.current?.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("keydown", closeNotifications);
    document.addEventListener("pointerdown", closeNotifications);
    return () => {
      document.removeEventListener("keydown", closeNotifications);
      document.removeEventListener("pointerdown", closeNotifications);
    };
  }, [notificationsOpen]);

  const closeMenu = () => setMenuOpen(false);

  const cartAriaLabel = itemCount > 0
    ? t("vcommerceShop:marketplaceHome.cartAriaLabelWithCount", { count: itemCount })
    : t("vcommerceShop:marketplaceHome.cartAriaLabelEmpty");

  return (
    <>
      <header className="vcm-mobile-head">
        <button
          type="button"
          aria-label={t("vcommerceShop:marketplaceHome.menuOpenAriaLabel")}
          aria-expanded={menuOpen}
          aria-controls="vcm-mobile-drawer"
          onClick={() => setMenuOpen(true)}
        >
          <IconMenu2 />
        </button>
        <Brand />
        <div>
          <LanguageSwitcher header />
          <div className="vcm-mobile-notifications" ref={notificationsRef}>
            <button
              type="button"
              aria-label={t("vcommerceShop:marketplaceHome.notificationsOpenAriaLabel")}
              aria-expanded={notificationsOpen}
              aria-controls="vcm-mobile-notifications-panel"
              onClick={() => setNotificationsOpen((open) => !open)}
            >
              <IconBell />
            </button>
            {notificationsOpen ? (
              <section
                id="vcm-mobile-notifications-panel"
                className="vcm-mobile-notifications__panel"
                aria-label={t("vcommerceShop:marketplaceHome.notificationsPanelAriaLabel")}
              >
                <strong>{t("vcommerceShop:marketplaceHome.notificationsHeading")}</strong>
                <div>
                  <IconBell aria-hidden="true" />
                  <p>{t("vcommerceShop:marketplaceHome.noNotifications")}</p>
                  <small>{t("vcommerceShop:marketplaceHome.notificationsHint")}</small>
                </div>
              </section>
            ) : null}
          </div>
          <Link
            to="/vcommerce/checkout"
            className="vcm-cart-btn-mobile"
            aria-label={cartAriaLabel}
          >
            <IconShoppingCart />
            {itemCount > 0 ? <em aria-hidden="true">{itemCount > 99 ? "99+" : itemCount}</em> : null}
          </Link>
        </div>
        <HeroActionCluster anchorSelector=".vcm-cart-btn-desktop" mobileAnchorSelector=".vcm-cart-btn-mobile" />
      </header>

      <button
        type="button"
        className={`vcm-mobile-menu-backdrop${menuOpen ? " is-open" : ""}`}
        aria-label={t("vcommerceShop:marketplaceHome.closeMenuAriaLabel")}
        tabIndex={menuOpen ? 0 : -1}
        onClick={closeMenu}
      />
      <nav
        id="vcm-mobile-drawer"
        className={`vcm-mobile-menu${menuOpen ? " is-open" : ""}`}
        aria-label={t("vcommerceShop:marketplaceHome.mobileNavAriaLabel")}
        aria-hidden={!menuOpen}
      >
        <div className="vcm-mobile-menu__header">
          <strong>{t("vcommerceShop:marketplaceHome.menuHeading")}</strong>
          <button type="button" aria-label={t("vcommerceShop:marketplaceHome.closeMenuAriaLabel")} onClick={closeMenu}><IconX /></button>
        </div>
        <div className="vcm-mobile-menu__links">
          <Link to="/" onClick={closeMenu}>{t("vcommerceShop:marketplaceHome.nav.home")}</Link>
          <Link to="/events" onClick={closeMenu}>{t("vcommerceShop:marketplaceHome.nav.events")}</Link>
          <details>
            <summary>{t("vcommerceShop:marketplaceHome.nav.ourPillars")} <IconChevronDown /></summary>
            <div>
              <Link to="/events" onClick={closeMenu}>{t("vcommerceShop:marketplaceHome.nav.experience")}</Link>
              <Link to="/stories" onClick={closeMenu}>{t("vcommerceShop:marketplaceHome.nav.stories")}</Link>
              <Link to="/impact" onClick={closeMenu}>{t("vcommerceShop:marketplaceHome.nav.impact")}</Link>
              <Link to="/voice-venture-studio" onClick={closeMenu}>{t("vcommerceShop:marketplaceHome.nav.innovation")}</Link>
            </div>
          </details>
          <details>
            <summary>{t("vcommerceShop:marketplaceHome.nav.partnerWithUs")} <IconChevronDown /></summary>
            <div>
              <Link to="/sponsorship" onClick={closeMenu}>{t("vcommerceShop:marketplaceHome.nav.sponsorship")}</Link>
              <Link to="/donate" onClick={closeMenu}>{t("vcommerceShop:marketplaceHome.nav.donate")}</Link>
              <Link to="/vcommerce" onClick={closeMenu}>{t("vcommerceShop:marketplaceHome.nav.vcommerce")}</Link>
            </div>
          </details>
          <Link to="/about-us" onClick={closeMenu}>{t("vcommerceShop:marketplaceHome.nav.aboutUs")}</Link>
        </div>
        <div className="vcm-mobile-menu__marketplace">
          <span>{t("vcommerceShop:marketplaceHome.marketplaceMenu.heading")}</span>
          <Link to="/vcommerce/businesses" onClick={closeMenu}>{t("vcommerceShop:marketplaceHome.marketplaceMenu.exploreShops")}</Link>
          <Link to="/vcommerce/categories" onClick={closeMenu}>{t("vcommerceShop:marketplaceHome.marketplaceMenu.categories")}</Link>
          <Link to="/vcommerce/apply" onClick={closeMenu}>{t("vcommerceShop:marketplaceHome.marketplaceMenu.listYourBusiness")}</Link>
          <Link to="/dashboard" onClick={closeMenu}>{t("vcommerceShop:marketplaceHome.marketplaceMenu.myDashboard")}</Link>
        </div>
        <div className="vcm-mobile-menu__preferences">
          <span>{t("vcommerceShop:marketplaceHome.preferences.heading")}</span>
          <div>
            <div className="vcm-mobile-menu__theme">
              <ThemeToggle />
              <span>{t("vcommerceShop:marketplaceHome.preferences.theme")}</span>
            </div>
            <SiteInstallPwaPrompt embedded />
          </div>
        </div>
      </nav>
    </>
  );
}

function Hero({ mobile = false }) {
  const { t } = useTranslation(["vcommerceShop"]);
  if (mobile) return <section className="vcm-mhero"><div><h1 className="vcm-page-title">V.Commerce</h1><p className="vcm-marketplace-tagline">{t("vcommerceShop:marketplaceHome.hero.tagline")}</p><h2 className="vcm-campaign-title">{t("vcommerceShop:marketplaceHome.hero.titlePart1")}<br /><span>{t("vcommerceShop:marketplaceHome.hero.titlePart2")}</span></h2><p className="vcm-hero-description">{t("vcommerceShop:marketplaceHome.hero.descriptionMobile")}</p><Link className="cta-pulse" to="/vcommerce/businesses">{t("vcommerceShop:marketplaceHome.hero.exploreShops")} <IconArrowRight /></Link></div><img className="vcm-mhero-art" src={mobileHeroGlobalCart} alt={t("vcommerceShop:marketplaceHome.hero.mobileHeroArtAlt")} /></section>;
  return <section className="vcm-hero"><HeroActionCluster anchorSelector=".vcm-cart-btn-desktop" mobileAnchorSelector=".vcm-cart-btn-mobile" /><div className="vcm-hero-copy"><h1 className="vcm-page-title">V.Commerce</h1><p className="vcm-marketplace-tagline">{t("vcommerceShop:marketplaceHome.hero.tagline")}</p><h2 className="vcm-campaign-title">{t("vcommerceShop:marketplaceHome.hero.titlePart1")} <span>{t("vcommerceShop:marketplaceHome.hero.titlePart2")}</span></h2><p className="vcm-hero-description">{t("vcommerceShop:marketplaceHome.hero.descriptionDesktopLine1")}<br />{t("vcommerceShop:marketplaceHome.hero.descriptionDesktopLine2")}</p><div className="vcm-promises"><span><IconBriefcase />{t("vcommerceShop:marketplaceHome.hero.promises.cashback.line1")}<br />{t("vcommerceShop:marketplaceHome.hero.promises.cashback.line2")}</span><span><IconUsers />{t("vcommerceShop:marketplaceHome.hero.promises.support.line1")}<br />{t("vcommerceShop:marketplaceHome.hero.promises.support.line2")}</span><span><IconShieldCheck />{t("vcommerceShop:marketplaceHome.hero.promises.verified.line1")}<br />{t("vcommerceShop:marketplaceHome.hero.promises.verified.line2")}</span><span><IconShoppingBag />{t("vcommerceShop:marketplaceHome.hero.promises.secure.line1")}<br />{t("vcommerceShop:marketplaceHome.hero.promises.secure.line2")}</span></div><div className="vcm-hero-buttons"><Link className="cta-pulse" to="/vcommerce/businesses">{t("vcommerceShop:marketplaceHome.hero.exploreShops")} <IconArrowRight /></Link><Link className="cta-pulse" to="/vcommerce/apply"><IconBuildingStore /> {t("vcommerceShop:marketplaceHome.hero.listYourBusiness")}</Link></div></div><div className="vcm-mosaic">{[heroOpen,heroShopkeeper,heroBusinesswoman,heroWarehouse,heroGlobalCart].map((src,i)=><img key={src} src={src} alt={i === 0 ? t("vcommerceShop:marketplaceHome.hero.mosaicAlt") : ""} />)}</div></section>;
}

const actionDefs = [
  [IconBriefcase, "businessHub", "/dashboard/vcommerce"],
  [IconShoppingBag, "exploreShops", "/vcommerce/businesses"], [IconPackage, "myOrders", "/dashboard"],
  [IconWallet, "vWallet", "/dashboard/wallet"], [IconBuildingStore, "listYourBusiness", "/vcommerce/apply"],
  [IconCategory, "categories", "/vcommerce/categories"], [IconTicket, "deals", "/vcommerce/businesses?deals=1"],
  [IconHeart, "favourites", "/vcommerce/favourites"], [IconSparkles, "vAssist", "/dashboard/ai-assistant"],
];
function QuickActions(){
  const { t } = useTranslation(["vcommerceShop"]);
  return <nav className="vcm-actions">{actionDefs.map(([Icon,key,to])=><Link key={key} to={to}><Icon /><span>{t(`vcommerceShop:marketplaceHome.quickActions.${key}`)}</span></Link>)}</nav>;
}

function BusinessWeek({ business }) {
  const { t } = useTranslation(["vcommerceShop"]);
  const biz = business;
  return <section className="vcm-week"><header><h2><IconStar /> {t("vcommerceShop:marketplaceHome.businessOfWeek.heading")}</h2><Link to="/vcommerce/businesses">{t("vcommerceShop:marketplaceHome.businessOfWeek.viewAll")} <IconArrowRight /></Link></header><div className="vcm-week-card"><div className="vcm-week-photo"><picture><source media="(max-width: 767px)" srcSet={biz.mobileImageUrl || biz.imageUrl} /><ImageWithFallback src={biz.imageUrl} alt={t("vcommerceShop:marketplaceHome.businessOfWeek.knversAlt")} /></picture></div><div className="vcm-week-info"><i>{t("vcommerceShop:marketplaceHome.businessOfWeek.featured")}</i><h3>{biz.name}</h3><p>{biz.categoryLabel}</p><p>⌖ &nbsp;{biz.location}</p>{biz.reviewCount > 0 && <p className="vcm-rating">★ <b>{biz.rating}</b> {t("vcommerceShop:marketplaceHome.businessOfWeek.reviewsCount", { count: biz.reviewCount })}</p>}<div>{biz.tags.slice(0,3).map(tag=><span key={tag}>{tag}</span>)}</div><Link to={biz.shopUrl}>{t("vcommerceShop:marketplaceHome.businessOfWeek.visitShop")} <IconArrowRight /></Link></div></div><footer><b /><i /><i /><i /><i /><i /></footer></section>;
}

function getProducts(products) {
  return Array.from({length:6},(_,i)=>({ ...(products?.[i] || {}), id:products?.[i]?.id || `fallback-${i}`, name:products?.[i]?.name || FALLBACK_NAMES[i], businessName:products?.[i]?.businessName || FALLBACK_NAMES[i], category:products?.[i]?.category || FALLBACK_CATS[i], price:products?.[i]?.price || FALLBACK_PRICES[i], cashbackPercent:products?.[i]?.cashbackPercent || FALLBACK_CASHBACK[i], imageUrl:MOCKUP_PRODUCTS[i], businessSlug:products?.[i]?.businessSlug || "" }));
}
function Popular({ products }) {
  const { t } = useTranslation(["vcommerceShop"]);
  return <section className="vcm-popular"><header><h2>{t("vcommerceShop:marketplaceHome.popular.heading")}</h2><Link to="/vcommerce/businesses">{t("vcommerceShop:marketplaceHome.popular.viewAll")} <IconArrowRight /></Link></header><div>{getProducts(products).map((p,i)=><Link key={p.id || i} to={p.businessSlug ? `/vcommerce/${p.businessSlug}` : "/vcommerce/businesses"} className="vcm-product"><figure><ImageWithFallback src={p.imageUrl} alt={p.name} /><button className="vcm-product-favourite-hit" aria-label={t("vcommerceShop:marketplaceHome.popular.addToFavouritesAriaLabel", { name: p.businessName || p.name })} onClick={(event)=>event.preventDefault()} /></figure><h3>{p.businessName || p.name}</h3><p>{p.category}</p><b>€{Number(p.price || FALLBACK_PRICES[i]).toFixed(2)}</b><small><IconWallet /> {t("vcommerceShop:marketplaceHome.popular.cashback", { percent: p.cashbackPercent || FALLBACK_CASHBACK[i] })}</small></Link>)}</div></section>;
}

function SearchCategories() {
  const { t } = useTranslation(["vcommerceShop"]);
  const shortcuts = [
    [IconPlane, "travel"], [IconYoga, "yoga"], [IconShoppingBag, "fashion"], [IconSparkles, "beauty"],
    [IconHome, "home"], [IconShoppingBag, "food"], [IconCategory, "tech"], [IconHeart, "health"], [IconCategory, "more"],
  ];
  return <section className="vcm-discover"><form onSubmit={e=>e.preventDefault()}><IconSearch /><input aria-label={t("vcommerceShop:marketplaceHome.search.ariaLabel")} placeholder={t("vcommerceShop:marketplaceHome.search.placeholder")} /><select aria-label={t("vcommerceShop:marketplaceHome.search.categoryAriaLabel")} defaultValue=""><option value="">{t("vcommerceShop:marketplaceHome.search.allCategories")}</option>{BUSINESS_CATEGORIES.map((category)=><option key={category} value={category}>{BUSINESS_CATEGORY_LABELS[category]}</option>)}</select><button aria-label={t("vcommerceShop:marketplaceHome.search.searchButtonAriaLabel")}><IconSearch /></button></form><nav>{shortcuts.map(([Icon,key])=><Link key={key} to="/vcommerce/categories"><Icon /><small>{t(`vcommerceShop:marketplaceHome.search.shortcuts.${key}`)}</small></Link>)}</nav></section>;
}

function BottomContent(){
  const { t } = useTranslation(["vcommerceShop"]);
  const benefitDefs = [
    [IconWallet, "cashback"], [IconShieldCheck, "verified"], [IconSparkles, "selection"],
    [IconUsers, "community"], [IconShoppingBag, "payments"],
  ];
  return <><section className="vcm-why"><h2>{t("vcommerceShop:marketplaceHome.why.heading")}</h2><div>{benefitDefs.map(([Icon,key])=><span key={key}><Icon /><b>{t(`vcommerceShop:marketplaceHome.why.benefits.${key}.title`)}</b><small>{t(`vcommerceShop:marketplaceHome.why.benefits.${key}.body`)}</small></span>)}</div></section><section className="vcm-impact"><div><h2>{t("vcommerceShop:marketplaceHome.impact.heading")}</h2><p>{t("vcommerceShop:marketplaceHome.impact.body")}</p><Link to="/impact">{t("vcommerceShop:marketplaceHome.impact.learnMore")} <IconArrowRight /></Link></div><IconHeart /></section><section className="vcm-owner"><span><IconGlobe /><b>{t("vcommerceShop:marketplaceHome.owner.shopGlobally.title")}</b><small>{t("vcommerceShop:marketplaceHome.owner.shopGlobally.line1")}<br />{t("vcommerceShop:marketplaceHome.owner.shopGlobally.line2")}</small></span><span><IconUsers /><b>{t("vcommerceShop:marketplaceHome.owner.supportRealPeople.title")}</b><small>{t("vcommerceShop:marketplaceHome.owner.supportRealPeople.line1")}<br />{t("vcommerceShop:marketplaceHome.owner.supportRealPeople.line2")}</small></span><span><IconHeart /><b>{t("vcommerceShop:marketplaceHome.owner.growTogether.title")}</b><small>{t("vcommerceShop:marketplaceHome.owner.growTogether.line1")}<br />{t("vcommerceShop:marketplaceHome.owner.growTogether.line2")}</small></span><span><IconBuildingStore /><b>{t("vcommerceShop:marketplaceHome.owner.businessOwner.title")}</b><small>{t("vcommerceShop:marketplaceHome.owner.businessOwner.body")}</small></span><Link className="cta-pulse" to="/vcommerce/apply">{t("vcommerceShop:marketplaceHome.owner.applyNow")} <IconArrowRight /></Link></section></>;
}

function BottomNav(){
  const { t } = useTranslation(["vcommerceShop"]);
  const tabs = [
    [IconHome, "home", "/vcommerce"], [IconCategory, "categories", "/vcommerce/categories"],
    [IconPackage, "orders", "/dashboard"], [IconWallet, "wallet", "/dashboard/wallet"], [IconUser, "profile", "/my-account"],
  ];
  return <nav className="vcm-bottom">{tabs.map(([Icon,key,to],i)=><Link className={i===0?"active":""} key={key} to={to}><Icon /><span>{t(`vcommerceShop:marketplaceHome.bottomNav.${key}`)}</span></Link>)}</nav>;
}

export default function MarketplaceHomePage(){
  const { t } = useTranslation(["vcommerceShop"]);
  const mobile=useSyncExternalStore(subscribe,getSnapshot,()=>false);
  const {featured,products}=useMarketplaceData();
  useEffect(()=>{document.title=t("vcommerceShop:marketplaceHome.documentTitle"); document.body.classList.toggle("vco-mobile-active",mobile); return()=>document.body.classList.remove("vco-mobile-active")},[mobile,t]);
  if(mobile)return <div className="vcm-page vcm-mobile"><MobileToolbar/><main><Hero mobile/><QuickActions/><BusinessWeek business={featured}/><Popular products={products}/><div className="vcm-lower"><BottomContent/></div></main><BottomNav/></div>;
  return <div className="vcm-page vcm-desktop"><DesktopBrand/><main><Hero/><QuickActions/><SearchCategories/><div className="vcm-content"><BusinessWeek business={featured}/><Popular products={products}/></div><div className="vcm-lower"><BottomContent/></div></main></div>;
}
