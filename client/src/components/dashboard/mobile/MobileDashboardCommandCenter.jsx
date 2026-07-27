import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  IconArrowRight,
  IconBellRinging,
  IconBuildingStore,
  IconCalendarEvent,
  IconChartDots,
  IconCrown,
  IconBrandGoogle,
  IconCheck,
  IconDownload,
  IconGift,
  IconHeartHandshake,
  IconHome,
  IconRobot,
  IconShoppingBag,
  IconSparkles,
  IconTicket,
  IconUser,
  IconWallet,
  IconX,
  IconShare,
  IconCopy,
  IconBrandWhatsapp,
  IconMail,
} from "@tabler/icons-react";
import HeroActionCluster from "../../layout/HeroActionCluster.jsx";
import { useAiAssistant } from "../../../contexts/AiAssistantContext.jsx";
import { useWallet } from "../../../contexts/WalletContext.jsx";
import { apiFetch, apiUrl, authHeaders } from "../../../utils/api.js";
import {
  getMyBusiness,
  getVCommercePopularProducts,
} from "../../vcommerce/shared/vcommerceApi.js";
import { KNVERS_FEATURED_BUSINESS } from "../../vcommerce/shared/knversFeatured.js";
import { buildQrSrc, membershipBadgeLabel, PREMIUM_BENEFITS } from "../dashboardUtils.js";
import { formatDiscountLabel, buildReferralUrl, buildWhatsAppShareLink, buildEmailShareLink } from "../../../utils/referralShare.js";
import {
  addMembershipToGoogleWallet,
  downloadMembershipEcard,
} from "../../../utils/membershipEcard.js";
import voiceVMark from "../../../assets/Home/voice-v-mark.png";
import heroLight from "../../../assets/Dashboard/breadcrumb-bg-light.png";
import heroDark from "../../../assets/Dashboard/breadcrumb-bg-dark.png";
import eventFallback from "../../../assets/Dashboard/upcoming-event-1.png";
import "../../../styles/mobile-dashboard-command-center.css";

const CARD_ICONS = {
  bookings: IconTicket,
  experiences: IconCalendarEvent,
  membership: IconCrown,
  wallet: IconWallet,
  impact: IconHeartHandshake,
  rewards: IconGift,
  commerce: IconShoppingBag,
  business: IconBuildingStore,
  profile: IconUser,
  donations: IconHeartHandshake,
  sponsorships: IconSparkles,
  referral: IconShare,
};

function formatMoney(minor = 0) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(Number(minor || 0) / 100);
}

function MobileSheet({ title, onClose, children }) {
  const { t } = useTranslation(["dashboardMobile"]);
  useEffect(() => {
    const previous = document.body.style.overflow;
    const onKeyDown = (event) => event.key === "Escape" && onClose();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div className="mobile-dash-sheet-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="mobile-dash-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-dash-sheet-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="mobile-dash-sheet__header">
          <div>
            <span>V.O.I.C.E. NL</span>
            <h2 id="mobile-dash-sheet-title">{title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label={t("dashboardMobile:commandCenter.sheet.closeAria", { title })}>
            <IconX aria-hidden />
          </button>
        </header>
        <div className="mobile-dash-sheet__body">{children}</div>
      </section>
    </div>
  );
}

function SummaryCard({ id, title, value, tone, to, onClick }) {
  const Icon = CARD_ICONS[id];
  const content = (
    <>
      <span className="mobile-dash-card__icon" aria-hidden><Icon /></span>
      <span className="mobile-dash-card__copy">
        <strong>{title}</strong>
        <small>{value}</small>
      </span>
      <IconArrowRight className="mobile-dash-card__arrow" aria-hidden />
    </>
  );

  if (to) {
    return <Link className={`mobile-dash-card mobile-dash-card--${tone}`} to={to}>{content}</Link>;
  }
  return <button type="button" className={`mobile-dash-card mobile-dash-card--${tone}`} onClick={onClick}>{content}</button>;
}

export default function MobileDashboardCommandCenter({
  displayName,
  overview,
  membership,
  planShort,
  membershipId,
  memberSince,
  validUntil,
  qrSrc,
}) {
  const { t } = useTranslation(["dashboardMobile"]);
  const { wallet, loadWallet } = useWallet();
  const { openAssistant, unreadResultsCount } = useAiAssistant();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [events, setEvents] = useState([]);
  const [isBusinessOwner, setIsBusinessOwner] = useState(false);
  const featuredBusiness = KNVERS_FEATURED_BUSINESS;
  const [marketplaceProducts, setMarketplaceProducts] = useState([]);
  const [referral, setReferral] = useState(null);
  const [referralCopied, setReferralCopied] = useState(false);
  const [membershipAction, setMembershipAction] = useState("");
  const [membershipActionMessage, setMembershipActionMessage] = useState("");
  const [membershipQrImageSrc, setMembershipQrImageSrc] = useState(() =>
    qrSrc ? apiUrl(qrSrc) : buildQrSrc(membershipId),
  );
  const membershipCardRef = useRef(null);
  const sheet = searchParams.get("panel") || "";

  useEffect(() => {
    setMembershipQrImageSrc(qrSrc ? apiUrl(qrSrc) : buildQrSrc(membershipId));
  }, [qrSrc, membershipId]);

  function handleMembershipQrError() {
    const fallback = buildQrSrc(membershipId);
    if (membershipQrImageSrc !== fallback) {
      setMembershipQrImageSrc(fallback);
    }
  }

  function openSheet(panel) {
    const next = new URLSearchParams(searchParams);
    next.set("panel", panel);
    setSearchParams(next);
  }

  function closeSheet() {
    const next = new URLSearchParams(searchParams);
    next.delete("panel");
    setSearchParams(next, { replace: true });
  }

  useEffect(() => {
    loadWallet();
    Promise.allSettled([
      apiFetch("/api/dashboard/bookings", { headers: authHeaders() }),
      apiFetch("/api/dashboard/events", { headers: authHeaders() }),
      getMyBusiness(),
      getVCommercePopularProducts({ limit: 3 }),
      apiFetch("/api/dashboard/referrals", { headers: authHeaders() }),
    ]).then(([bookingResult, eventResult, businessResult, productsResult, referralResult]) => {
      if (bookingResult.status === "fulfilled") setBookings(bookingResult.value?.bookings || []);
      if (eventResult.status === "fulfilled") {
        const upcoming = eventResult.value?.upcoming || [];
        setEvents(upcoming.length ? upcoming : eventResult.value?.events || []);
      }
      setIsBusinessOwner(businessResult.status === "fulfilled" && Boolean(businessResult.value?.business));
      if (productsResult.status === "fulfilled") setMarketplaceProducts(productsResult.value?.products || []);
      if (referralResult.status === "fulfilled" && referralResult.value?.enabled) {
        setReferral(referralResult.value.referral || null);
      }
    });
  }, [loadWallet]);

  const firstName = String(displayName || t("dashboardMobile:commandCenter.hero.memberFallback")).trim().split(/\s+/)[0];
  const ticketCount = useMemo(
    () => bookings.reduce((sum, booking) => sum + Number(booking.ticketCount || booking.tickets?.length || 0), 0),
    [bookings],
  );
  const nextEvent = events[0] || null;
  const rewards = wallet?.rewardPoints ?? 0;
  const balance = wallet?.balanceMinor ?? membership?.wallet?.balanceMinor ?? 0;
  const donationLabel = overview?.donations?.totalLabel || overview?.donations?.value || "€0.00";
  const eventCount = overview?.events?.count ?? 0;
  const sponsorshipCount = overview?.sponsorships?.count ?? 0;
  const membershipLabel = membershipBadgeLabel(planShort);
  const membershipTier = String(planShort || t("dashboardMobile:commandCenter.hero.memberFallback")).replace(/\s+(Family|Single)$/i, "") || t("dashboardMobile:commandCenter.hero.memberFallback");
  const membershipVariant = String(planShort || "").match(/\b(Family|Single)\b/i)?.[1] || "";

  const cards = [
    { id: "profile", title: t("dashboardMobile:commandCenter.cards.profile.title"), value: t("dashboardMobile:commandCenter.cards.profile.value"), tone: "cyan", to: "/dashboard/profile" },
    { id: "donations", title: t("dashboardMobile:commandCenter.cards.donations.title"), value: donationLabel, tone: "pink", to: "/dashboard/donations" },
    { id: "sponsorships", title: t("dashboardMobile:commandCenter.cards.sponsorships.title"), value: t("dashboardMobile:commandCenter.cards.sponsorships.value", { count: sponsorshipCount }), tone: "violet", to: "/dashboard/sponsorships" },
    {
      id: "referral",
      title: t("dashboardMobile:commandCenter.cards.referral.title"),
      value: referral?.referralCode?.code || t("dashboardMobile:commandCenter.cards.referral.value"),
      tone: "gold",
      onClick: () => openSheet("referral"),
    },
    ...(isBusinessOwner ? [{ id: "business", title: t("dashboardMobile:commandCenter.cards.business.title"), value: t("dashboardMobile:commandCenter.cards.business.value"), tone: "green", to: "/dashboard/vcommerce" }] : []),
  ];

  const featuredShopUrl = featuredBusiness?.slug
    ? `/vcommerce/${featuredBusiness.slug}`
    : featuredBusiness?.shopUrl || "/vcommerce/businesses";
  const featuredImage = featuredBusiness.mobileSpotlightImageUrl;
  const membershipBenefits = membership?.active?.benefits?.length
    ? membership.active.benefits
    : PREMIUM_BENEFITS;
  const googleWalletAvailable = Boolean(membership?.wallet?.googleAvailable);

  async function runMembershipAction(action, task) {
    setMembershipAction(action);
    setMembershipActionMessage("");
    try {
      await task();
    } catch (error) {
      setMembershipActionMessage(error.message || t("dashboardMobile:commandCenter.membershipSheet.actionUnavailable"));
    } finally {
      setMembershipAction("");
    }
  }

  return (
    <div className="mobile-dash">
      <section className="mobile-dash-hero" aria-labelledby="mobile-dash-name">
        <picture className="mobile-dash-hero__media">
          <source srcSet={heroLight} media="(prefers-color-scheme: light)" />
          <img className="mobile-dash-hero__image mobile-dash-hero__image--dark" src={heroDark} alt="" />
        </picture>
        <div className="mobile-dash-hero__scrim" />
        <HeroActionCluster />
        <button type="button" className="mobile-dash-hero__assist" onClick={openAssistant}
          aria-label={t("dashboardMobile:commandCenter.hero.assistAria")}>
          <IconRobot aria-hidden />
          <span>{t("dashboardMobile:commandCenter.hero.assist")}</span>
        </button>
        {unreadResultsCount > 0 ? (
          <button
            type="button"
            className="mobile-dash-hero__notif-bell"
            onClick={() => navigate("/dashboard/ai-assistant/schedule", { state: { openTab: "updates" } })}
            aria-label={t("dashboardMobile:commandCenter.hero.notifBellAria", { count: unreadResultsCount })}
          >
            <IconBellRinging aria-hidden />
            <span className="mobile-dash-hero__notif-bell-badge" aria-hidden="true">
              {unreadResultsCount > 99 ? "99+" : unreadResultsCount}
            </span>
          </button>
        ) : null}
        <div className="mobile-dash-hero__content">
          <p>{t("dashboardMobile:commandCenter.hero.welcomeBack")}</p>
          <h1 id="mobile-dash-name">{firstName}</h1>
          <span className="mobile-dash-hero__membership"><IconCrown aria-hidden /> {membershipLabel}</span>
          <div className="mobile-dash-hero__metrics" aria-label={t("dashboardMobile:commandCenter.hero.metricsAria")}>
            <button type="button" className="mobile-dash-hero__metric mobile-dash-hero__metric--rewards" onClick={() => openSheet("rewards")} aria-label={t("dashboardMobile:commandCenter.hero.rewardsAria", { count: rewards })}>
              <IconSparkles aria-hidden /><b>{rewards}</b><small>{t("dashboardMobile:commandCenter.hero.pointsLabel")}</small><IconArrowRight className="mobile-dash-hero__metric-arrow" aria-hidden />
            </button>
            <Link className="mobile-dash-hero__metric mobile-dash-hero__metric--wallet" to="/dashboard/wallet" aria-label={t("dashboardMobile:commandCenter.hero.walletAria", { balance: formatMoney(balance) })}>
              <IconWallet aria-hidden /><b>{formatMoney(balance)}</b><small>{t("dashboardMobile:commandCenter.hero.walletLabel")}</small><IconArrowRight className="mobile-dash-hero__metric-arrow" aria-hidden />
            </Link>
            <button type="button" className="mobile-dash-hero__metric mobile-dash-hero__metric--tickets" onClick={() => openSheet("tickets")} aria-label={t("dashboardMobile:commandCenter.hero.ticketsAria", { count: ticketCount })}>
              <IconTicket aria-hidden /><b>{ticketCount}</b><small>{t("dashboardMobile:commandCenter.hero.ticketsLabel")}</small><IconArrowRight className="mobile-dash-hero__metric-arrow" aria-hidden />
            </button>
            <button type="button" className="mobile-dash-hero__metric mobile-dash-hero__metric--membership" onClick={() => openSheet("membership")} aria-label={t("dashboardMobile:commandCenter.hero.membershipAria", { label: membershipLabel })}>
              <IconCrown aria-hidden /><b>{membershipTier}</b><small>{t("dashboardMobile:commandCenter.hero.membershipLabel")}</small>{membershipVariant ? <em>{t("dashboardMobile:commandCenter.hero.planSuffix", { variant: membershipVariant })}</em> : null}<IconArrowRight className="mobile-dash-hero__metric-arrow" aria-hidden />
            </button>
          </div>
        </div>
      </section>

      <main className="mobile-dash__body">
        <section className="mobile-dash-next" aria-labelledby="mobile-dash-next-title">
          <img className="mobile-dash-next__image" src={nextEvent?.heroImage || eventFallback} alt="" />
          <span className="mobile-dash-next__scrim" />
          <div className="mobile-dash-next__badge"><IconCalendarEvent aria-hidden /> {t("dashboardMobile:commandCenter.nextEvent.badge")}</div>
          <div className="mobile-dash-next__content">
            {nextEvent ? (
              <>
                <h2 id="mobile-dash-next-title">{nextEvent.title}</h2>
                <p>{nextEvent.dateLabel || nextEvent.date || t("dashboardMobile:commandCenter.nextEvent.dateTba")}</p>
                <Link className="mobile-dash-next__buy" to={nextEvent.bookingUrl || "/events"}>
                  {t("dashboardMobile:commandCenter.nextEvent.buyTickets")} <IconTicket aria-hidden />
                </Link>
              </>
            ) : (
              <>
                <h2 id="mobile-dash-next-title">{t("dashboardMobile:commandCenter.nextEvent.discoverTitle")}</h2>
                <p>{t("dashboardMobile:commandCenter.nextEvent.discoverBody")}</p>
                <Link className="mobile-dash-next__buy" to="/events">{t("dashboardMobile:commandCenter.nextEvent.exploreEvents")} <IconArrowRight aria-hidden /></Link>
              </>
            )}
          </div>
        </section>

        <section className="mobile-dash-commerce" aria-labelledby="mobile-dash-commerce-title">
          <header>
            <div>
              <span>{t("dashboardMobile:commandCenter.commerce.eyebrow")}</span>
              <h2 id="mobile-dash-commerce-title">{t("dashboardMobile:commandCenter.commerce.title")}</h2>
            </div>
            <Link to="/vcommerce">{t("dashboardMobile:commandCenter.commerce.exploreAll")} <IconArrowRight aria-hidden /></Link>
          </header>
          <Link className="mobile-dash-commerce__feature" to={featuredShopUrl}>
            <img src={featuredImage} alt="" />
            <span className="mobile-dash-commerce__scrim" />
            <small className="mobile-dash-commerce__featured-badge">{t("dashboardMobile:commandCenter.commerce.featuredBadge")}</small>
            <div>
              <strong>{featuredBusiness.name}</strong>
              <span>{featuredBusiness.categoryLabel}</span>
              <b>{t("dashboardMobile:commandCenter.commerce.visitShop")} <IconArrowRight aria-hidden /></b>
            </div>
          </Link>
          {marketplaceProducts.length ? (
            <div className="mobile-dash-commerce__offers" aria-label={t("dashboardMobile:commandCenter.commerce.offersAria")}>
              {marketplaceProducts.slice(0, 3).map((product) => (
                <Link key={product.id || product._id} to={product.businessSlug ? `/vcommerce/${product.businessSlug}` : "/vcommerce/businesses"}>
                  {product.imageUrl ? <img src={product.imageUrl} alt="" /> : <IconShoppingBag aria-hidden />}
                  <span><strong>{product.businessName || product.name}</strong><small>{t("dashboardMobile:commandCenter.commerce.cashback", { percent: product.cashbackPercent || 5 })}</small></span>
                </Link>
              ))}
            </div>
          ) : null}
        </section>

        <section className="mobile-dash-section" aria-labelledby="mobile-dash-overview">
          <div className="mobile-dash-section__heading">
            <div><span>{t("dashboardMobile:commandCenter.moreForYou.eyebrow")}</span><h2 id="mobile-dash-overview">{t("dashboardMobile:commandCenter.moreForYou.title")}</h2></div>
          </div>
          <div className="mobile-dash-grid">
            {cards.map((card) => <SummaryCard key={card.id} {...card} />)}
          </div>
        </section>

        <button type="button" className="mobile-dash-impact" onClick={() => openSheet("impact")}>
          <span><IconChartDots aria-hidden /></span>
          <div>
            <small>{t("dashboardMobile:commandCenter.impactBanner.label")}</small>
            <strong>{t("dashboardMobile:commandCenter.impactBanner.summary", { eventCount, donationLabel, sponsorshipCount })}</strong>
            <p>{t("dashboardMobile:commandCenter.impactBanner.thanks")}</p>
          </div>
          <IconArrowRight aria-hidden />
        </button>

        <section className="mobile-dash-movement" aria-label={t("dashboardMobile:commandCenter.movement.ariaLabel")}>
          <span className="mobile-dash-movement__glow" aria-hidden="true" />
          <img src={voiceVMark} alt="" aria-hidden="true" />
          <div>
            <h2>{t("dashboardMobile:commandCenter.movement.titleLead")} <strong>{t("dashboardMobile:commandCenter.movement.titleAccent")}</strong></h2>
            <p>{t("dashboardMobile:commandCenter.movement.tagline")}</p>
          </div>
        </section>
      </main>

      <nav className="mobile-dash-nav" aria-label={t("dashboardMobile:commandCenter.nav.ariaLabel")}>
        <NavLink to="/dashboard" end><IconHome aria-hidden /><span>{t("dashboardMobile:commandCenter.nav.home")}</span></NavLink>
        <NavLink to="/dashboard/events"><IconCalendarEvent aria-hidden /><span>{t("dashboardMobile:commandCenter.nav.events")}</span></NavLink>
        <NavLink to="/vcommerce" className="mobile-dash-nav__commerce"><IconShoppingBag aria-hidden /><span>{t("dashboardMobile:commandCenter.nav.commerce")}</span></NavLink>
        <NavLink to="/dashboard/wallet"><IconWallet aria-hidden /><span>{t("dashboardMobile:commandCenter.nav.wallet")}</span></NavLink>
        <NavLink to="/dashboard/profile"><IconUser aria-hidden /><span>{t("dashboardMobile:commandCenter.nav.profile")}</span></NavLink>
      </nav>

      {sheet === "membership" ? (
        <MobileSheet title={t("dashboardMobile:commandCenter.membershipSheet.title")} onClose={closeSheet}>
          <div className="mobile-sheet-membership">
            <div className="mobile-sheet-membership__card" ref={membershipCardRef}>
              <span className="mobile-sheet-membership__ribbon" aria-hidden="true" />
              <img className="mobile-sheet-membership__watermark" src={voiceVMark} alt="" aria-hidden="true" />
              <div className="mobile-sheet-membership__brand" aria-label="Stichting The V.O.I.C.E. NL">
                <img className="mobile-sheet-membership__brand-mark" src={voiceVMark} alt="" aria-hidden="true" />
                <span className="mobile-sheet-membership__brand-name">
                  Stichting<br />The <strong>V.O.I.C.E.</strong> NL
                </span>
              </div>
              <img
                className="mobile-sheet-membership__qr"
                src={membershipQrImageSrc}
                alt={t("dashboardMobile:commandCenter.membershipSheet.qrAlt", { membershipId })}
                decoding="async"
                onError={handleMembershipQrError}
              />
              <span className="mobile-sheet-membership__pass-label">{t("dashboardMobile:commandCenter.membershipSheet.passLabel")}</span>
              <h3>{membershipLabel}</h3>
              <dl>
                <div><dt>{t("dashboardMobile:commandCenter.membershipSheet.idLabel")}</dt><dd>{membershipId}</dd></div>
                <div><dt>{t("dashboardMobile:commandCenter.membershipSheet.memberSinceLabel")}</dt><dd>{memberSince}</dd></div>
                <div><dt>{t("dashboardMobile:commandCenter.membershipSheet.validUntilLabel")}</dt><dd>{validUntil}</dd></div>
              </dl>
            </div>
            <div className="mobile-sheet-membership__actions" aria-label={t("dashboardMobile:commandCenter.membershipSheet.actionsAria")}>
              <button
                type="button"
                disabled={Boolean(membershipAction)}
                onClick={() => runMembershipAction("download", () => downloadMembershipEcard(membershipCardRef.current, membershipId))}
              >
                <IconDownload aria-hidden />
                <span>{membershipAction === "download" ? t("dashboardMobile:commandCenter.membershipSheet.preparing") : t("dashboardMobile:commandCenter.membershipSheet.downloadCard")}</span>
              </button>
              <button
                type="button"
                disabled={!googleWalletAvailable || Boolean(membershipAction)}
                title={googleWalletAvailable ? t("dashboardMobile:commandCenter.membershipSheet.googleWalletAvailableTitle") : t("dashboardMobile:commandCenter.membershipSheet.googleWalletUnavailableTitle")}
                onClick={() => runMembershipAction("google", addMembershipToGoogleWallet)}
              >
                <IconBrandGoogle aria-hidden />
                <span>{membershipAction === "google" ? t("dashboardMobile:commandCenter.membershipSheet.opening") : t("dashboardMobile:commandCenter.membershipSheet.addGoogleWallet")}</span>
              </button>
            </div>
            {membershipActionMessage ? <p className="mobile-sheet-membership__message" role="alert">{membershipActionMessage}</p> : null}
            {!googleWalletAvailable && !membershipActionMessage ? (
              <p className="mobile-sheet-membership__message">{t("dashboardMobile:commandCenter.membershipSheet.googleWalletComingSoon")}</p>
            ) : null}
            <section className="mobile-sheet-membership__benefits" aria-labelledby="mobile-membership-benefits-title">
              <header>
                <span>{t("dashboardMobile:commandCenter.membershipSheet.benefitsEyebrow")}</span>
                <h3 id="mobile-membership-benefits-title">{t("dashboardMobile:commandCenter.membershipSheet.benefitsTitle")}</h3>
              </header>
              <ul>
                {membershipBenefits.map((benefit, index) => {
                  const label = typeof benefit === "string" ? benefit : benefit.label || benefit.name;
                  return (
                    <li key={benefit.id || label || index}>
                      <span aria-hidden><IconCheck /></span>
                      <strong>{label}</strong>
                    </li>
                  );
                })}
              </ul>
            </section>
            <Link className="mobile-dash-sheet__primary" to="/membership">{t("dashboardMobile:commandCenter.membershipSheet.manageMembership")}</Link>
          </div>
        </MobileSheet>
      ) : null}

      {sheet === "tickets" ? (
        <MobileSheet title={t("dashboardMobile:commandCenter.ticketsSheet.title")} onClose={closeSheet}>
          {bookings.length ? (
            <div className="mobile-sheet-tickets">
              {bookings.map((booking) => (
                <section key={booking.eventId} className="mobile-sheet-tickets__booking">
                  <header>
                    <div>
                      <small>{t("dashboardMobile:commandCenter.ticketsSheet.bookedExperience")}</small>
                      <h3>{booking.eventTitle}</h3>
                      <p>{booking.dateLabel}{booking.timeLabel ? ` · ${booking.timeLabel}` : ""}</p>
                    </div>
                    <span>{t("dashboardMobile:commandCenter.ticketsSheet.ticketCount", { count: booking.ticketCount })}</span>
                  </header>
                  <div className="mobile-sheet-tickets__list">
                    {(booking.tickets || []).map((ticket) => {
                      const qrSrc = ticket.verificationToken
                        ? `/api/tickets/qr/${ticket.verificationToken}.png`
                        : ticket.qrCodeUrl;
                      const ticketTypeLabel = ticket.ticketTypeName || t("dashboardMobile:commandCenter.ticketsSheet.genericTicket");
                      return (
                        <article key={ticket.id || ticket.ticketNumber} className="mobile-sheet-ticket">
                          {qrSrc ? <img src={apiUrl(qrSrc)} alt={t("dashboardMobile:commandCenter.ticketsSheet.qrAlt", { ticketType: ticket.ticketTypeName })} /> : <IconTicket aria-hidden />}
                          <div>
                            <strong>{ticket.ticketTypeName || t("dashboardMobile:commandCenter.ticketsSheet.eventTicketFallback")}</strong>
                            <span>{ticket.attendeeName}</span>
                            <small>{ticket.ticketNumber}</small>
                          </div>
                          {ticket.pdfUrl ? (
                            <a href={apiUrl(ticket.pdfUrl)} target="_blank" rel="noreferrer" aria-label={t("dashboardMobile:commandCenter.ticketsSheet.downloadAria", { ticketType: ticketTypeLabel })}>
                              {t("dashboardMobile:commandCenter.ticketsSheet.download")}
                            </a>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="mobile-sheet-tickets__empty">
              <IconTicket aria-hidden />
              <h3>{t("dashboardMobile:commandCenter.ticketsSheet.emptyTitle")}</h3>
              <p>{t("dashboardMobile:commandCenter.ticketsSheet.emptyBody")}</p>
            </div>
          )}
          <Link className="mobile-dash-sheet__primary" to="/dashboard/events">{t("dashboardMobile:commandCenter.ticketsSheet.viewAll")}</Link>
        </MobileSheet>
      ) : null}

      {sheet === "rewards" ? (
        <MobileSheet title={t("dashboardMobile:commandCenter.rewardsSheet.title")} onClose={closeSheet}>
          <div className="mobile-sheet-rewards">
            <IconGift aria-hidden />
            <small>{t("dashboardMobile:commandCenter.rewardsSheet.availableLabel")}</small>
            <strong>{rewards}</strong>
            <span>{t("dashboardMobile:commandCenter.rewardsSheet.pointsUnit")}</span>
            <p>{t("dashboardMobile:commandCenter.rewardsSheet.description")}</p>
            <Link className="mobile-dash-sheet__primary" to="/dashboard/wallet">{t("dashboardMobile:commandCenter.rewardsSheet.openInWallet")}</Link>
          </div>
        </MobileSheet>
      ) : null}

      {sheet === "impact" ? (
        <MobileSheet title={t("dashboardMobile:commandCenter.impactSheet.title")} onClose={closeSheet}>
          <div className="mobile-sheet-impact">
            <div><IconCalendarEvent aria-hidden /><strong>{eventCount}</strong><span>{t("dashboardMobile:commandCenter.impactSheet.experiencesAttended")}</span></div>
            <div><IconHeartHandshake aria-hidden /><strong>{donationLabel}</strong><span>{t("dashboardMobile:commandCenter.impactSheet.donationsMade")}</span></div>
            <div><IconBuildingStore aria-hidden /><strong>{sponsorshipCount}</strong><span>{t("dashboardMobile:commandCenter.impactSheet.sponsorshipContributions")}</span></div>
          </div>
          <p className="mobile-sheet-impact__thanks">{t("dashboardMobile:commandCenter.impactSheet.thanksParagraph")}</p>
          <Link className="mobile-dash-sheet__primary" to="/impact">{t("dashboardMobile:commandCenter.impactSheet.exploreLink")}</Link>
        </MobileSheet>
      ) : null}

      {sheet === "referral" ? (
        <MobileSheet title={t("dashboardMobile:commandCenter.referralSheet.title")} onClose={closeSheet}>
          <div className="mobile-sheet-referral">
            <span className="mobile-sheet-referral__icon"><IconShare aria-hidden /></span>
            <p>{t("dashboardMobile:commandCenter.referralSheet.intro")}</p>
            {referral?.referralCode?.code ? (
              <>
                <small>{t("dashboardMobile:commandCenter.referralSheet.yourCodeLabel")}</small>
                <strong>{referral.referralCode.code}</strong>
                <button
                  type="button"
                  className="mobile-dash-sheet__primary"
                  onClick={async () => {
                    await navigator.clipboard.writeText(referral.referralCode.code);
                    setReferralCopied(true);
                    window.setTimeout(() => setReferralCopied(false), 1800);
                  }}
                >
                  <IconCopy aria-hidden /> {referralCopied ? t("dashboardMobile:commandCenter.referralSheet.copied") : t("dashboardMobile:commandCenter.referralSheet.copyCode")}
                </button>
                {(() => {
                  const code = referral.referralCode.code;
                  const discountLabel = formatDiscountLabel(referral.referralCode.discountType, referral.referralCode.discountValue);
                  const shareUrl = buildReferralUrl(code);
                  const shareText = discountLabel
                    ? t("dashboardMobile:commandCenter.referralSheet.shareTextWithDiscount", { code, discount: discountLabel })
                    : t("dashboardMobile:commandCenter.referralSheet.shareText", { code });
                  const shareMessage = `${shareText} ${shareUrl}`;
                  return (
                    <div className="mobile-sheet-referral__share-row">
                      <a href={buildWhatsAppShareLink(shareMessage)} target="_blank" rel="noopener noreferrer" className="mobile-sheet-referral__share-btn">
                        <IconBrandWhatsapp aria-hidden /> {t("dashboardMobile:commandCenter.referralSheet.shareViaWhatsApp")}
                      </a>
                      <a href={buildEmailShareLink({ subject: t("dashboardMobile:commandCenter.referralSheet.title"), body: shareMessage })} className="mobile-sheet-referral__share-btn">
                        <IconMail aria-hidden /> {t("dashboardMobile:commandCenter.referralSheet.shareViaEmail")}
                      </a>
                      {navigator.share ? (
                        <button
                          type="button"
                          className="mobile-sheet-referral__share-btn"
                          onClick={() => navigator.share({ title: t("dashboardMobile:commandCenter.referralSheet.title"), text: shareText, url: shareUrl }).catch(() => {})}
                        >
                          <IconShare aria-hidden /> {t("dashboardMobile:commandCenter.referralSheet.shareMoreOptions")}
                        </button>
                      ) : null}
                    </div>
                  );
                })()}
              </>
            ) : (
              <p>{t("dashboardMobile:commandCenter.referralSheet.pendingActivation")}</p>
            )}
          </div>
        </MobileSheet>
      ) : null}
    </div>
  );
}
