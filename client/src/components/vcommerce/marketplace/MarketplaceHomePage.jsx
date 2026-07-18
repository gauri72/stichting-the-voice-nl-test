import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
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
import artisanLamp from "../../../assets/VCommerce/mockup/artisan-lamp.png";
import artisanLampMobile from "../../../assets/VCommerce/mockup/artisan-lamp-mobile.png";
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
  return <Link to="/" className="vcm-brand"><img src={logo} alt="V.O.I.C.E. NL" /><span><b>STICHTING<br />THE V.O.I.C.E. NL</b><small>The Vision of International<br />Cultural Exchange</small></span></Link>;
}

function DesktopBrand() {
  return <Link to="/" className="vcm-desktop-brand" aria-label="Stichting The V.O.I.C.E. NL — go to homepage"><img className="vcm-desktop-brand__dark" src={desktopBrand} alt="" aria-hidden="true" /><img className="vcm-desktop-brand__light" src={desktopBrandTransparent} alt="" aria-hidden="true" /></Link>;
}

function MobileToolbar() {
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

  return (
    <>
      <header className="vcm-mobile-head">
        <button
          type="button"
          aria-label="Open navigation menu"
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
              aria-label="Open notifications"
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
                aria-label="Notifications"
              >
                <strong>Notifications</strong>
                <div>
                  <IconBell aria-hidden="true" />
                  <p>No new notifications</p>
                  <small>Updates about your orders and marketplace activity will appear here.</small>
                </div>
              </section>
            ) : null}
          </div>
          <Link
            to="/vcommerce/checkout"
            aria-label={`Shopping cart${itemCount > 0 ? `, ${itemCount} item${itemCount === 1 ? "" : "s"}` : ", empty"}`}
          >
            <IconShoppingCart />
            {itemCount > 0 ? <em aria-hidden="true">{itemCount > 99 ? "99+" : itemCount}</em> : null}
          </Link>
        </div>
      </header>

      <button
        type="button"
        className={`vcm-mobile-menu-backdrop${menuOpen ? " is-open" : ""}`}
        aria-label="Close navigation menu"
        tabIndex={menuOpen ? 0 : -1}
        onClick={closeMenu}
      />
      <nav
        id="vcm-mobile-drawer"
        className={`vcm-mobile-menu${menuOpen ? " is-open" : ""}`}
        aria-label="Mobile navigation"
        aria-hidden={!menuOpen}
      >
        <div className="vcm-mobile-menu__header">
          <strong>Menu</strong>
          <button type="button" aria-label="Close navigation menu" onClick={closeMenu}><IconX /></button>
        </div>
        <div className="vcm-mobile-menu__links">
          <Link to="/" onClick={closeMenu}>Home</Link>
          <Link to="/events" onClick={closeMenu}>Events</Link>
          <details>
            <summary>Our Pillars <IconChevronDown /></summary>
            <div>
              <Link to="/events" onClick={closeMenu}>Experience</Link>
              <Link to="/stories" onClick={closeMenu}>Stories</Link>
              <Link to="/impact" onClick={closeMenu}>Impact</Link>
              <Link to="/voice-venture-studio" onClick={closeMenu}>Innovation</Link>
            </div>
          </details>
          <details>
            <summary>Partner With Us <IconChevronDown /></summary>
            <div>
              <Link to="/sponsorship" onClick={closeMenu}>Sponsorship</Link>
              <Link to="/donate" onClick={closeMenu}>Donate</Link>
              <Link to="/vcommerce" onClick={closeMenu}>V.Commerce</Link>
            </div>
          </details>
          <Link to="/about-us" onClick={closeMenu}>About Us</Link>
        </div>
        <div className="vcm-mobile-menu__marketplace">
          <span>V.Commerce</span>
          <Link to="/vcommerce/businesses" onClick={closeMenu}>Explore Shops</Link>
          <Link to="/vcommerce/categories" onClick={closeMenu}>Categories</Link>
          <Link to="/vcommerce/apply" onClick={closeMenu}>List Your Business</Link>
          <Link to="/dashboard" onClick={closeMenu}>My Dashboard</Link>
        </div>
        <div className="vcm-mobile-menu__preferences">
          <span>Preferences &amp; App</span>
          <div>
            <div className="vcm-mobile-menu__theme">
              <ThemeToggle />
              <span>Theme</span>
            </div>
            <SiteInstallPwaPrompt embedded />
          </div>
        </div>
      </nav>
    </>
  );
}

function Hero({ mobile = false }) {
  if (mobile) return <section className="vcm-mhero"><div><h1 className="vcm-page-title">V.Commerce</h1><p className="vcm-marketplace-tagline">V.O.I.C.E. NL COMMUNITY MARKETPLACE</p><h2 className="vcm-campaign-title">Shop. Support.<br /><span>Grow.</span></h2><p className="vcm-hero-description">Discover trusted businesses, products and services from our global community.</p><Link to="/vcommerce/businesses">Explore Shops <IconArrowRight /></Link></div><img className="vcm-mhero-art" src={mobileHeroGlobalCart} alt="Global online marketplace" /></section>;
  return <section className="vcm-hero"><div className="vcm-hero-copy"><h1 className="vcm-page-title">V.Commerce</h1><p className="vcm-marketplace-tagline">V.O.I.C.E. NL COMMUNITY MARKETPLACE</p><h2 className="vcm-campaign-title">Shop. Support. <span>Grow.</span></h2><p className="vcm-hero-description">Discover trusted businesses, products and services from our global community.<br />Shop with confidence and earn V.Wallet cashback on every purchase.</p><div className="vcm-promises"><span><IconBriefcase />Earn V.Wallet<br />Cashback</span><span><IconUsers />Support Local &<br />Global Businesses</span><span><IconShieldCheck />Verified & Trusted<br />Community</span><span><IconShoppingBag />Secure & Easy<br />Shopping</span></div><div className="vcm-hero-buttons"><Link to="/vcommerce/businesses">Explore Shops <IconArrowRight /></Link><Link to="/vcommerce/apply"><IconBuildingStore /> List Your Business</Link></div></div><div className="vcm-mosaic">{[heroOpen,heroShopkeeper,heroBusinesswoman,heroWarehouse,heroGlobalCart].map((src,i)=><img key={src} src={src} alt={i === 0 ? "Community marketplace businesses" : ""} />)}</div></section>;
}

const actions = [
  [IconShoppingBag,"Explore Shops","/vcommerce/businesses"], [IconPackage,"My Orders","/dashboard"],
  [IconWallet,"V.Wallet","/dashboard/wallet"], [IconBuildingStore,"List Your Business","/vcommerce/apply"],
  [IconCategory,"Categories","/vcommerce/categories"], [IconTicket,"Deals","/vcommerce/businesses?deals=1"],
  [IconHeart,"Favourites","/vcommerce/favourites"], [IconSparkles,"V.Assist","/dashboard/ai-assistant"],
];
function QuickActions(){return <nav className="vcm-actions">{actions.map(([Icon,label,to])=><Link key={label} to={to}><Icon /><span>{label}</span></Link>)}</nav>}

function BusinessWeek({ business }) {
  const biz = business || { name:"The Artisan Space", categoryLabel:"Home & Living", location:"Rotterdam, NL", rating:4.8, reviewCount:128, tags:["Handmade","Sustainable","Premium"], shopUrl:"/vcommerce/businesses" };
  return <section className="vcm-week"><header><h2><IconStar /> BUSINESS OF THE WEEK</h2><Link to="/vcommerce/businesses">View All <IconArrowRight /></Link></header><div className="vcm-week-card"><div className="vcm-week-photo"><picture><source media="(max-width: 767px)" srcSet={artisanLampMobile} /><ImageWithFallback src={artisanLamp} alt="Handcrafted artisan lamp" /></picture></div><div className="vcm-week-info"><i>Featured</i><h3>{biz.name}</h3><p>{biz.categoryLabel}</p><p>⌖ &nbsp;{biz.location}</p><p className="vcm-rating">★ <b>{biz.rating || "4.8"}</b> ({biz.reviewCount || 128} reviews)</p><div>{(biz.tags?.length ? biz.tags : ["Handmade","Sustainable","Premium"]).slice(0,3).map(t=><span key={t}>{t}</span>)}</div><Link to={biz.shopUrl || "/vcommerce/businesses"}>Visit Shop <IconArrowRight /></Link></div></div><footer><b /><i /><i /><i /><i /><i /></footer></section>;
}

function getProducts(products) {
  return Array.from({length:6},(_,i)=>({ ...(products?.[i] || {}), id:products?.[i]?.id || `fallback-${i}`, name:products?.[i]?.name || FALLBACK_NAMES[i], businessName:products?.[i]?.businessName || FALLBACK_NAMES[i], category:products?.[i]?.category || FALLBACK_CATS[i], price:products?.[i]?.price || FALLBACK_PRICES[i], cashbackPercent:products?.[i]?.cashbackPercent || FALLBACK_CASHBACK[i], imageUrl:MOCKUP_PRODUCTS[i], businessSlug:products?.[i]?.businessSlug || "" }));
}
function Popular({ products }) {
  return <section className="vcm-popular"><header><h2>POPULAR PICKS FOR YOU</h2><Link to="/vcommerce/businesses">View All <IconArrowRight /></Link></header><div>{getProducts(products).map((p,i)=><Link key={p.id || i} to={p.businessSlug ? `/vcommerce/${p.businessSlug}` : "/vcommerce/businesses"} className="vcm-product"><figure><ImageWithFallback src={p.imageUrl} alt={p.name} /><button className="vcm-product-favourite-hit" aria-label={`Add ${p.businessName || p.name} to favourites`} onClick={(event)=>event.preventDefault()} /></figure><h3>{p.businessName || p.name}</h3><p>{p.category}</p><b>€{Number(p.price || FALLBACK_PRICES[i]).toFixed(2)}</b><small><IconWallet /> {p.cashbackPercent || FALLBACK_CASHBACK[i]}% Cashback</small></Link>)}</div></section>;
}

function SearchCategories() {
  return <section className="vcm-discover"><form onSubmit={e=>e.preventDefault()}><IconSearch /><input aria-label="Search marketplace" placeholder="Search businesses, products, services..." /><select aria-label="Category" defaultValue=""><option value="">All Categories</option>{BUSINESS_CATEGORIES.map((category)=><option key={category} value={category}>{BUSINESS_CATEGORY_LABELS[category]}</option>)}</select><button aria-label="Search"><IconSearch /></button></form><nav>{[[IconPlane,"Travel & Stay"],[IconYoga,"Yoga"],[IconShoppingBag,"Fashion"],[IconSparkles,"Beauty"],[IconHome,"Home & Living"],[IconShoppingBag,"Food & Drink"],[IconCategory,"Tech & Digital"],[IconHeart,"Health & Wellness"],[IconCategory,"More"]].map(([Icon,n])=><Link key={n} to="/vcommerce/categories"><Icon /><small>{n}</small></Link>)}</nav></section>;
}

function BottomContent(){return <><section className="vcm-why"><h2>Why Shop on V.Commerce?</h2><div>{[[IconWallet,"Cashback Rewards","Earn V.Wallet cashback on every purchase"],[IconShieldCheck,"Verified Businesses","Every shop is verified for your protection"],[IconSparkles,"Wide Selection","Thousands of quality products & services"],[IconUsers,"Community Driven","Empowering local, national & global sellers"],[IconShoppingBag,"Secure Payments","Safe, encrypted & trusted checkout"]].map(([Icon,t,s])=><span key={t}><Icon /><b>{t}</b><small>{s}</small></span>)}</div></section><section className="vcm-impact"><div><h2>Make an Impact</h2><p>Every purchase you make helps strengthen our community and support meaningful initiatives.</p><Link to="/impact">Learn More <IconArrowRight /></Link></div><IconHeart /></section><section className="vcm-owner"><span><IconGlobe /><b>Shop Globally</b><small>From a trusted community<br />across the world</small></span><span><IconUsers /><b>Support Real People</b><small>Your purchase empowers<br />entrepreneurs</small></span><span><IconHeart /><b>Grow Together</b><small>Stronger community,<br />stronger future</small></span><span><IconBuildingStore /><b>Are you a business owner?</b><small>List your business and reach thousands of potential customers.</small></span><Link to="/vcommerce/apply">Apply Now <IconArrowRight /></Link></section></>}

function BottomNav(){return <nav className="vcm-bottom">{[[IconHome,"Home","/vcommerce"],[IconCategory,"Categories","/vcommerce/categories"],[IconPackage,"Orders","/dashboard"],[IconWallet,"V.Wallet","/dashboard/wallet"],[IconUser,"Profile","/my-account"]].map(([Icon,n,to],i)=><Link className={i===0?"active":""} key={n} to={to}><Icon /><span>{n}</span></Link>)}</nav>}

export default function MarketplaceHomePage(){
  const mobile=useSyncExternalStore(subscribe,getSnapshot,()=>false);
  const {featured,products}=useMarketplaceData();
  useEffect(()=>{document.title="V.Commerce — Community Marketplace | V.O.I.C.E. NL"; document.body.classList.toggle("vco-mobile-active",mobile); return()=>document.body.classList.remove("vco-mobile-active")},[mobile]);
  if(mobile)return <div className="vcm-page vcm-mobile"><MobileToolbar/><main><Hero mobile/><QuickActions/><BusinessWeek business={featured}/><Popular products={products}/><div className="vcm-lower"><BottomContent/></div></main><BottomNav/></div>;
  return <div className="vcm-page vcm-desktop"><DesktopBrand/><main><Hero/><SearchCategories/><div className="vcm-content"><BusinessWeek business={featured}/><Popular products={products}/></div><div className="vcm-lower"><BottomContent/></div></main></div>;
}
