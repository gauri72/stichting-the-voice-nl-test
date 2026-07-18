import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useSearchParams } from "react-router-dom";
import {
  IconArrowRight,
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
} from "@tabler/icons-react";
import { useAiAssistant } from "../../../contexts/AiAssistantContext.jsx";
import { useWallet } from "../../../contexts/WalletContext.jsx";
import { apiFetch, apiUrl, authHeaders } from "../../../utils/api.js";
import {
  getMyBusiness,
  getVCommercePopularProducts,
} from "../../vcommerce/shared/vcommerceApi.js";
import { KNVERS_FEATURED_BUSINESS } from "../../vcommerce/shared/knversFeatured.js";
import { buildQrSrc, membershipBadgeLabel, PREMIUM_BENEFITS } from "../dashboardUtils.js";
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
          <button type="button" onClick={onClose} aria-label={`Close ${title}`}>
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
  const { wallet, loadWallet } = useWallet();
  const { openAssistant } = useAiAssistant();
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

  const firstName = String(displayName || "Member").trim().split(/\s+/)[0];
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
  const membershipTier = String(planShort || "Member").replace(/\s+(Family|Single)$/i, "") || "Member";
  const membershipVariant = String(planShort || "").match(/\b(Family|Single)\b/i)?.[1] || "";

  const cards = [
    { id: "profile", title: "Profile & Settings", value: "Manage Account", tone: "cyan", to: "/dashboard/profile" },
    { id: "donations", title: "My Donations", value: donationLabel, tone: "pink", to: "/dashboard/donations" },
    { id: "sponsorships", title: "Sponsorships", value: `${sponsorshipCount} Contribution${sponsorshipCount === 1 ? "" : "s"}`, tone: "violet", to: "/dashboard/sponsorships" },
    {
      id: "referral",
      title: "Referral Code",
      value: referral?.referralCode?.code || "Invite & Earn",
      tone: "gold",
      onClick: () => openSheet("referral"),
    },
    ...(isBusinessOwner ? [{ id: "business", title: "Business Hub", value: "Manage Listings", tone: "green", to: "/dashboard/vcommerce" }] : []),
  ];

  const featuredShopUrl = featuredBusiness?.slug
    ? `/vcommerce/${featuredBusiness.slug}`
    : featuredBusiness?.shopUrl || "/vcommerce/businesses";
  const featuredImage = featuredBusiness.bannerUrl;
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
      setMembershipActionMessage(error.message || "This membership action is temporarily unavailable.");
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
        <div className="mobile-dash-hero__content">
          <p>Welcome back</p>
          <h1 id="mobile-dash-name">{firstName}</h1>
          <span className="mobile-dash-hero__membership"><IconCrown aria-hidden /> {membershipLabel}</span>
          <div className="mobile-dash-hero__metrics" aria-label="Member account summary">
            <button type="button" className="mobile-dash-hero__metric mobile-dash-hero__metric--rewards" onClick={() => openSheet("rewards")} aria-label={`Open Rewards Center, ${rewards} points`}>
              <IconSparkles aria-hidden /><b>{rewards}</b><small>Points</small><IconArrowRight className="mobile-dash-hero__metric-arrow" aria-hidden />
            </button>
            <Link className="mobile-dash-hero__metric mobile-dash-hero__metric--wallet" to="/dashboard/wallet" aria-label={`Open V.Wallet, balance ${formatMoney(balance)}`}>
              <IconWallet aria-hidden /><b>{formatMoney(balance)}</b><small>V.Wallet</small><IconArrowRight className="mobile-dash-hero__metric-arrow" aria-hidden />
            </Link>
            <button type="button" className="mobile-dash-hero__metric mobile-dash-hero__metric--tickets" onClick={() => openSheet("tickets")} aria-label={`Open My Tickets, ${ticketCount} tickets`}>
              <IconTicket aria-hidden /><b>{ticketCount}</b><small>Tickets</small><IconArrowRight className="mobile-dash-hero__metric-arrow" aria-hidden />
            </button>
            <button type="button" className="mobile-dash-hero__metric mobile-dash-hero__metric--membership" onClick={() => openSheet("membership")} aria-label={`Open ${membershipLabel}`}>
              <IconCrown aria-hidden /><b>{membershipTier}</b><small>Membership</small>{membershipVariant ? <em>{membershipVariant} Plan</em> : null}<IconArrowRight className="mobile-dash-hero__metric-arrow" aria-hidden />
            </button>
          </div>
        </div>
      </section>

      <main className="mobile-dash__body">
        <button type="button" className="mobile-dash-assist" onClick={openAssistant}>
          <span className="mobile-dash-assist__orb"><IconRobot aria-hidden /></span>
          <span>
            <small>Your AI Community Concierge</small>
            <strong>V.Assist</strong>
            <em>Events · Membership · Discounts · Businesses · Community</em>
          </span>
          <span className="mobile-dash-assist__open">Open <IconArrowRight aria-hidden /></span>
        </button>

        <section className="mobile-dash-next" aria-labelledby="mobile-dash-next-title">
          <img className="mobile-dash-next__image" src={nextEvent?.heroImage || eventFallback} alt="" />
          <span className="mobile-dash-next__scrim" />
          <div className="mobile-dash-next__badge"><IconCalendarEvent aria-hidden /> Featured Event</div>
          <div className="mobile-dash-next__content">
            {nextEvent ? (
              <>
                <h2 id="mobile-dash-next-title">{nextEvent.title}</h2>
                <p>{nextEvent.dateLabel || nextEvent.date || "Date to be announced"}</p>
                <Link className="mobile-dash-next__buy" to={nextEvent.bookingUrl || "/events"}>
                  Buy Tickets <IconTicket aria-hidden />
                </Link>
              </>
            ) : (
              <>
                <h2 id="mobile-dash-next-title">Discover your next experience</h2>
                <p>New community events are added regularly.</p>
                <Link className="mobile-dash-next__buy" to="/events">Explore Events <IconArrowRight aria-hidden /></Link>
              </>
            )}
          </div>
        </section>

        <section className="mobile-dash-commerce" aria-labelledby="mobile-dash-commerce-title">
          <header>
            <div>
              <span>Member marketplace</span>
              <h2 id="mobile-dash-commerce-title">V.Commerce Spotlight</h2>
            </div>
            <Link to="/vcommerce">Explore All <IconArrowRight aria-hidden /></Link>
          </header>
          <Link className="mobile-dash-commerce__feature" to={featuredShopUrl}>
            <img src={featuredImage} alt="" />
            <span className="mobile-dash-commerce__scrim" />
            <div>
              <small>Featured community business</small>
              <strong>{featuredBusiness.name}</strong>
              <span>{featuredBusiness.categoryLabel}</span>
              <b>Visit Shop <IconArrowRight aria-hidden /></b>
            </div>
          </Link>
          {marketplaceProducts.length ? (
            <div className="mobile-dash-commerce__offers" aria-label="V.Commerce offers">
              {marketplaceProducts.slice(0, 3).map((product) => (
                <Link key={product.id || product._id} to={product.businessSlug ? `/vcommerce/${product.businessSlug}` : "/vcommerce/businesses"}>
                  {product.imageUrl ? <img src={product.imageUrl} alt="" /> : <IconShoppingBag aria-hidden />}
                  <span><strong>{product.businessName || product.name}</strong><small>{product.cashbackPercent || 5}% cashback</small></span>
                </Link>
              ))}
            </div>
          ) : null}
        </section>

        <section className="mobile-dash-section" aria-labelledby="mobile-dash-overview">
          <div className="mobile-dash-section__heading">
            <div><span>Member tools</span><h2 id="mobile-dash-overview">More for You</h2></div>
          </div>
          <div className="mobile-dash-grid">
            {cards.map((card) => <SummaryCard key={card.id} {...card} />)}
          </div>
        </section>

        <button type="button" className="mobile-dash-impact" onClick={() => openSheet("impact")}>
          <span><IconChartDots aria-hidden /></span>
          <div>
            <small>Your Impact</small>
            <strong>{eventCount} experiences · {donationLabel} donated · {sponsorshipCount} sponsorships</strong>
            <p>Thank you for supporting the V.O.I.C.E. NL mission.</p>
          </div>
          <IconArrowRight aria-hidden />
        </button>

        <section className="mobile-dash-movement" aria-label="Thank you for being part of the movement">
          <span className="mobile-dash-movement__glow" aria-hidden="true" />
          <img src={voiceVMark} alt="" aria-hidden="true" />
          <div>
            <h2>Thank You For Being <strong>Part Of The Movement</strong></h2>
            <p>Together we create Experiences. Share Stories. Drive Impact. Spark Innovation.</p>
          </div>
        </section>
      </main>

      <nav className="mobile-dash-nav" aria-label="Member dashboard">
        <NavLink to="/dashboard" end><IconHome aria-hidden /><span>Home</span></NavLink>
        <NavLink to="/dashboard/events"><IconCalendarEvent aria-hidden /><span>Events</span></NavLink>
        <NavLink to="/vcommerce" className="mobile-dash-nav__commerce"><IconShoppingBag aria-hidden /><span>V.Commerce</span></NavLink>
        <NavLink to="/dashboard/wallet"><IconWallet aria-hidden /><span>Wallet</span></NavLink>
        <NavLink to="/dashboard/profile"><IconUser aria-hidden /><span>Profile</span></NavLink>
      </nav>

      {sheet === "membership" ? (
        <MobileSheet title="Membership Card" onClose={closeSheet}>
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
                alt={`Membership QR code ${membershipId}`}
                decoding="async"
                onError={handleMembershipQrError}
              />
              <span className="mobile-sheet-membership__pass-label">Member pass</span>
              <h3>{membershipLabel}</h3>
              <dl>
                <div><dt>Membership ID</dt><dd>{membershipId}</dd></div>
                <div><dt>Member since</dt><dd>{memberSince}</dd></div>
                <div><dt>Valid until</dt><dd>{validUntil}</dd></div>
              </dl>
            </div>
            <div className="mobile-sheet-membership__actions" aria-label="Membership card actions">
              <button
                type="button"
                disabled={Boolean(membershipAction)}
                onClick={() => runMembershipAction("download", () => downloadMembershipEcard(membershipCardRef.current, membershipId))}
              >
                <IconDownload aria-hidden />
                <span>{membershipAction === "download" ? "Preparing…" : "Download E-Card"}</span>
              </button>
              <button
                type="button"
                disabled={!googleWalletAvailable || Boolean(membershipAction)}
                title={googleWalletAvailable ? "Save this membership to Google Wallet" : "Google Wallet is not configured yet"}
                onClick={() => runMembershipAction("google", addMembershipToGoogleWallet)}
              >
                <IconBrandGoogle aria-hidden />
                <span>{membershipAction === "google" ? "Opening…" : "Add to Google Wallet"}</span>
              </button>
            </div>
            {membershipActionMessage ? <p className="mobile-sheet-membership__message" role="alert">{membershipActionMessage}</p> : null}
            {!googleWalletAvailable && !membershipActionMessage ? (
              <p className="mobile-sheet-membership__message">E-card download is available now. Google Wallet will appear when it is configured.</p>
            ) : null}
            <section className="mobile-sheet-membership__benefits" aria-labelledby="mobile-membership-benefits-title">
              <header>
                <span>Included with your plan</span>
                <h3 id="mobile-membership-benefits-title">Membership Benefits</h3>
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
            <Link className="mobile-dash-sheet__primary" to="/membership">Manage Membership</Link>
          </div>
        </MobileSheet>
      ) : null}

      {sheet === "tickets" ? (
        <MobileSheet title="My Tickets" onClose={closeSheet}>
          {bookings.length ? (
            <div className="mobile-sheet-tickets">
              {bookings.map((booking) => (
                <section key={booking.eventId} className="mobile-sheet-tickets__booking">
                  <header>
                    <div>
                      <small>Booked experience</small>
                      <h3>{booking.eventTitle}</h3>
                      <p>{booking.dateLabel}{booking.timeLabel ? ` · ${booking.timeLabel}` : ""}</p>
                    </div>
                    <span>{booking.ticketCount} ticket{booking.ticketCount === 1 ? "" : "s"}</span>
                  </header>
                  <div className="mobile-sheet-tickets__list">
                    {(booking.tickets || []).map((ticket) => {
                      const qrSrc = ticket.verificationToken
                        ? `/api/tickets/qr/${ticket.verificationToken}.png`
                        : ticket.qrCodeUrl;
                      return (
                        <article key={ticket.id || ticket.ticketNumber} className="mobile-sheet-ticket">
                          {qrSrc ? <img src={apiUrl(qrSrc)} alt={`QR code for ${ticket.ticketTypeName}`} /> : <IconTicket aria-hidden />}
                          <div>
                            <strong>{ticket.ticketTypeName || "Event Ticket"}</strong>
                            <span>{ticket.attendeeName}</span>
                            <small>{ticket.ticketNumber}</small>
                          </div>
                          {ticket.pdfUrl ? (
                            <a href={apiUrl(ticket.pdfUrl)} target="_blank" rel="noreferrer" aria-label={`Download ${ticket.ticketTypeName || "ticket"}`}>
                              Download
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
              <h3>No booked tickets yet</h3>
              <p>Your ticket QR codes will appear here after booking.</p>
            </div>
          )}
          <Link className="mobile-dash-sheet__primary" to="/dashboard/events">View All Upcoming Experiences</Link>
        </MobileSheet>
      ) : null}

      {sheet === "rewards" ? (
        <MobileSheet title="Rewards Center" onClose={closeSheet}>
          <div className="mobile-sheet-rewards">
            <IconGift aria-hidden />
            <small>Available to redeem</small>
            <strong>{rewards}</strong>
            <span>reward points</span>
            <p>Use your points for member benefits, event discounts and selected V.Commerce rewards.</p>
            <Link className="mobile-dash-sheet__primary" to="/dashboard/wallet">Open Rewards in V.Wallet</Link>
          </div>
        </MobileSheet>
      ) : null}

      {sheet === "impact" ? (
        <MobileSheet title="Your Impact" onClose={closeSheet}>
          <div className="mobile-sheet-impact">
            <div><IconCalendarEvent aria-hidden /><strong>{eventCount}</strong><span>Experiences attended</span></div>
            <div><IconHeartHandshake aria-hidden /><strong>{donationLabel}</strong><span>Donations made</span></div>
            <div><IconBuildingStore aria-hidden /><strong>{sponsorshipCount}</strong><span>Sponsorship contributions</span></div>
          </div>
          <p className="mobile-sheet-impact__thanks">Your participation helps create meaningful cultural exchange and stronger communities.</p>
          <Link className="mobile-dash-sheet__primary" to="/impact">Explore Our Impact</Link>
        </MobileSheet>
      ) : null}

      {sheet === "referral" ? (
        <MobileSheet title="My Referral Code" onClose={closeSheet}>
          <div className="mobile-sheet-referral">
            <span className="mobile-sheet-referral__icon"><IconShare aria-hidden /></span>
            <p>Invite friends to V.O.I.C.E. NL and earn rewards when they join.</p>
            {referral?.referralCode?.code ? (
              <>
                <small>Your referral code</small>
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
                  <IconCopy aria-hidden /> {referralCopied ? "Code Copied" : "Copy Referral Code"}
                </button>
              </>
            ) : (
              <p>Your referral code will appear here as soon as it is activated.</p>
            )}
          </div>
        </MobileSheet>
      ) : null}
    </div>
  );
}
