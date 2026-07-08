import { lazy, Suspense, useEffect } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import AppSplash from "./components/layout/AppSplash";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import LanguageSwitcher from "./components/layout/LanguageSwitcher.jsx";
import CookieConsentBanner from "./components/layout/CookieConsentBanner";
import CookiePreferencesModal from "./components/layout/CookiePreferencesModal.jsx";
import HomePage from "./components/home/HomePage";
import AboutUsPage from "./components/about/AboutUsPage";
import MembershipPage from "./components/membership/MembershipPage";
import SponsorshipPage from "./components/sponsorship/SponsorshipPage";
import DonatePage from "./components/donate/DonatePage";
import EventsPage from "./components/events/EventsPage";
import LoginPage from "./components/login/LoginPage";
import ResetPasswordPage from "./components/login/ResetPasswordPage";
const DashboardPage = lazy(() => import("./components/dashboard/DashboardPage"));
const DashboardMyEventsPage = lazy(() => import("./components/dashboard/DashboardMyEventsPage"));
const DashboardGivingPage = lazy(() => import("./components/dashboard/DashboardGivingPage.jsx"));
const DashboardEventTicketsPage = lazy(() => import("./components/dashboard/DashboardEventTicketsPage"));
const AiChatPage = lazy(() => import("./components/dashboard/ai-assistant/AiChatPage.jsx"));
const AiPromptLibraryPage = lazy(() => import("./components/dashboard/ai-assistant/AiPromptLibraryPage.jsx"));
const AiScheduledPromptsPage = lazy(() => import("./components/dashboard/ai-assistant/AiScheduledPromptsPage.jsx"));
const WalletPage = lazy(() => import("./components/dashboard/wallet/WalletPage.jsx"));
const EventExperiencePage = lazy(() => import("./components/event-experience/EventExperiencePage.jsx"));
const VCommercePage = lazy(() => import("./components/vcommerce/VCommercePage.jsx"));
const VCommerceProfilePage = lazy(() => import("./components/vcommerce/VCommerceProfilePage.jsx"));
const VCommerceApplicationPage = lazy(() => import("./components/vcommerce/VCommerceApplicationPage.jsx"));
const VCommerceApplicationSuccessPage = lazy(() => import("./components/vcommerce/VCommerceApplicationSuccessPage.jsx"));
const VCommerceCheckoutPage = lazy(() => import("./components/vcommerce/checkout/VCommerceCheckoutPage.jsx"));
const VCommercePortalPage = lazy(() => import("./components/dashboard/vcommerce/VCommercePortalPage.jsx"));
import AiAssistantPageShell from "./components/dashboard/ai-assistant/AiAssistantPageShell.jsx";
import AiAssistantOverlay from "./components/dashboard/ai-assistant/AiAssistantOverlay.jsx";
import MyProfilePage from "./components/profile/MyProfilePage";
import VentureStudioPage from "./components/venture-studio/VentureStudioPage";
import StoriesPage from "./components/stories/StoriesPage";
import ImpactPage from "./components/impact/ImpactPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import MaintenancePage from "./components/maintenance/MaintenancePage";
import OurPillarsPlaceholderPage from "./components/pages/OurPillarsPlaceholderPage.jsx";
import ContactPage from "./components/contact/ContactPage.jsx";
import PoliciesPage from "./components/policies/PoliciesPage";
import AdminLoginPage from "./components/admin/AdminLoginPage";
import AdminDashboardPage from "./components/admin/AdminDashboardPage";
import AdminDashboardBuilderPage from "./components/admin/AdminDashboardBuilderPage.jsx";
import AdminCustomerDashboardBuilderPage from "./components/admin/AdminCustomerDashboardBuilderPage.jsx";
import AdminCustomerDashboardPreviewPage from "./components/admin/AdminCustomerDashboardPreviewPage.jsx";
import AdminBroadcastPage from "./components/admin/AdminBroadcastPage";
import AdminTemplateUploadPage from "./components/admin/AdminTemplateUploadPage";
import AdminDiscountsPage from "./components/admin/AdminDiscountsPage";
import AdminMembershipDiscountsPage from "./components/admin/AdminMembershipDiscountsPage.jsx";
import AdminUsersPage from "./components/admin/AdminUsersPage";
import AdminEventsPage from "./components/admin/AdminEventsPage.jsx";
import AdminSeatMapEditor from "./components/admin/AdminSeatMapEditor.jsx";
import AdminEventHighlightsPage from "./components/admin/AdminEventHighlightsPage.jsx";
import AdminTicketsPage from "./components/admin/AdminTicketsPage.jsx";
import AdminCheckInPage from "./components/admin/AdminCheckInPage.jsx";
import CheckInPwaPage from "./components/checkin/CheckInPwaPage.jsx";
import AdminVouchersPage from "./components/admin/AdminVouchersPage.jsx";
import AdminMembershipsPage from "./components/admin/AdminMembershipsPage.jsx";
import AdminMemberProfilePage from "./components/admin/AdminMemberProfilePage.jsx";
import AdminSponsorshipsPage from "./components/admin/AdminSponsorshipsPage.jsx";
import AdminSponsorshipDetailPage from "./components/admin/AdminSponsorshipDetailPage.jsx";
import AdminDonationsPage from "./components/admin/AdminDonationsPage.jsx";
import AdminDonationDetailPage from "./components/admin/AdminDonationDetailPage.jsx";
import AdminFinanceInvoicesPage from "./components/admin/AdminFinanceInvoicesPage.jsx";
import AdminFinanceEventBudgetsPage from "./components/admin/AdminFinanceEventBudgetsPage.jsx";
import AdminFinanceEventBudgetDetailPage from "./components/admin/AdminFinanceEventBudgetDetailPage.jsx";
import AdminFinanceTransactionsPage from "./components/admin/AdminFinanceTransactionsPage.jsx";
import AdminFinanceAuditReportsPage from "./components/admin/AdminFinanceAuditReportsPage.jsx";
import AdminFinanceReportsPage from "./components/admin/AdminFinanceReportsPage.jsx";
import AdminFinanceSettingsPage from "./components/admin/AdminFinanceSettingsPage.jsx";
import AdminReportsPage from "./components/admin/AdminReportsPage.jsx";
import AdminCustomReportsPage from "./components/admin/AdminCustomReportsPage.jsx";
import AdminPagesPage from "./components/admin/AdminPagesPage.jsx";
import AdminPageEditorPage from "./components/admin/AdminPageEditorPage.jsx";
import AdminCmsHubPage from "./components/admin/AdminCmsHubPage.jsx";
import AdminMediaLibraryPage from "./components/admin/AdminMediaLibraryPage.jsx";
import AdminDesignSystemPage from "./components/admin/AdminDesignSystemPage.jsx";
import AdminComponentLibraryPage from "./components/admin/AdminComponentLibraryPage.jsx";
import AdminTemplatesPage from "./components/admin/AdminTemplatesPage.jsx";
import AdminCmsAuditLogPage from "./components/admin/AdminCmsAuditLogPage.jsx";
import AdminCmsSeoPage from "./components/admin/AdminCmsSeoPage.jsx";
import AdminHeaderEditorPage from "./components/admin/AdminHeaderEditorPage.jsx";
import AdminFooterEditorPage from "./components/admin/AdminFooterEditorPage.jsx";
import AdminSettingsLayout from "./components/admin/settings/AdminSettingsLayout.jsx";
import AdminSettingsCategoryPage from "./components/admin/settings/AdminSettingsCategoryPage.jsx";
import AdminStripeSettingsPage from "./components/admin/settings/AdminStripeSettingsPage.jsx";
import AdminBankSettingsPage from "./components/admin/settings/AdminBankSettingsPage.jsx";
import AdminEmailProviderSettingsPage from "./components/admin/settings/AdminEmailProviderSettingsPage.jsx";
import AdminEmailTemplatesPage from "./components/admin/settings/AdminEmailTemplatesPage.jsx";
import AdminEmailTemplateEditorPage from "./components/admin/settings/AdminEmailTemplateEditorPage.jsx";
import AdminPdfTemplatesPage from "./components/admin/settings/AdminPdfTemplatesPage.jsx";
import AdminSettingsAuditPage from "./components/admin/settings/AdminSettingsAuditPage.jsx";
import PreviewPage from "./components/preview/PreviewPage.jsx";
import VerifyMembershipPage from "./components/membership/VerifyMembershipPage.jsx";
import TicketBookingPage from "./components/events/TicketBookingPage.jsx";
import RouteErrorBoundary from "./components/layout/RouteErrorBoundary.jsx";
import TicketConfirmationPage from "./components/events/TicketConfirmationPage.jsx";
import SessionsPage from "./components/sessions/SessionsPage.jsx";
import SessionDetailPage from "./components/sessions/SessionDetailPage.jsx";
import SessionBookingPage from "./components/sessions/SessionBookingPage.jsx";
import RsvpPage from "./components/rsvp/RsvpPage.jsx";
import AdminSessionsPage from "./components/admin/AdminSessionsPage.jsx";
import AdminSessionCalendarPage from "./components/admin/AdminSessionCalendarPage.jsx";
import AdminSessionBookingsPage from "./components/admin/AdminSessionBookingsPage.jsx";
import AdminResourcesPage from "./components/admin/AdminResourcesPage.jsx";
import AdminRsvpsPage from "./components/admin/AdminRsvpsPage.jsx";
import AdminCheckoutFormsPage from "./components/admin/AdminCheckoutFormsPage.jsx";
import AdminReviewsPage from "./components/admin/AdminReviewsPage.jsx";
import AdminTeamMembersPage from "./components/admin/AdminTeamMembersPage.jsx";
import AdminApiBuilderPage from "./components/admin/AdminApiBuilderPage.jsx";
import AdminAiAssistantPage from "./components/admin/AdminAiAssistantPage.jsx";
import AdminWalletPage from "./components/admin/AdminWalletPage.jsx";
import AdminIconLibraryPage from "./components/admin/icon-library/AdminIconLibraryPage.jsx";
import AdminVCommercePage from "./components/admin/AdminVCommercePage.jsx";
import AdminApiBuilderLogsPage from "./components/admin/AdminApiBuilderLogsPage.jsx";
import AccessManagementLayout from "./components/admin/access/AccessManagementLayout.jsx";
import AccessTeamMembersPage from "./components/admin/access/AccessTeamMembersPage.jsx";
import AccessRolesPage from "./components/admin/access/AccessRolesPage.jsx";
import AccessPermissionsPage from "./components/admin/access/AccessPermissionsPage.jsx";
import AccessInvitationsPage from "./components/admin/access/AccessInvitationsPage.jsx";
import AccessAuditLogsPage from "./components/admin/access/AccessAuditLogsPage.jsx";
import AccessSettingsPage from "./components/admin/access/AccessSettingsPage.jsx";
import AdminAcceptInvitePage from "./components/admin/AdminAcceptInvitePage.jsx";
import EventOperationsLayout from "./components/admin/operations/EventOperationsLayout.jsx";
import EventOperationsOverviewPage from "./components/admin/operations/EventOperationsOverviewPage.jsx";
import EventInventoryPage from "./components/admin/operations/EventInventoryPage.jsx";
import EventTechnicalRiderPage from "./components/admin/operations/EventTechnicalRiderPage.jsx";
import EventStagePlanPage from "./components/admin/operations/EventStagePlanPage.jsx";
import EventDocumentsPage from "./components/admin/operations/EventDocumentsPage.jsx";
import AdminGlobalInventoryPage from "./components/admin/operations/AdminGlobalInventoryPage.jsx";
import AdminGlobalDocumentsPage from "./components/admin/operations/AdminGlobalDocumentsPage.jsx";
import AdminProtectedRoute from "./components/auth/AdminProtectedRoute";
import ManifestRouter from "./components/pwa/ManifestRouter.jsx";
import SiteInstallPwaPrompt from "./components/pwa/SiteInstallPwaPrompt.jsx";

// Enable by setting VITE_MAINTENANCE_MODE=true in your .env / hosting environment.
const MAINTENANCE_MODE = import.meta.env.VITE_MAINTENANCE_MODE === "true";

function EmptyPage() {
  return (
    <div className="coming-soon-page">
      <div className="coming-soon-page__inner">
        <p className="coming-soon-page__eyebrow">Coming soon</p>
        <h1 className="coming-soon-page__title">This page is on its way</h1>
        <p className="coming-soon-page__body">
          We're still putting this section together. Check back soon, or head back to the homepage in the meantime.
        </p>
        <Link to="/" className="coming-soon-page__link">
          Back to homepage
        </Link>
      </div>
    </div>
  );
}

function ScrollToHash() {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const id = hash.replace("#", "");
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [hash, pathname]);

  return null;
}

function AuthAliasRedirect() {
  const location = useLocation();
  return <Navigate to={`/my-account${location.search}`} replace />;
}

export default function App() {
  const location = useLocation();
  const isStandalonePage =
    location.pathname.startsWith("/admin") || location.pathname === "/check-in";
  const hideSiteChrome = isStandalonePage;
  const hideSplash = location.pathname === "/check-in";

  if (MAINTENANCE_MODE) return <MaintenancePage />;

  return (
    <>
      <AppSplash disabled={hideSplash} />
    <div className="app-shell">
      <ManifestRouter />
      <ScrollToHash />
      {!hideSiteChrome && <Header />}
      <main className={`app-main${isStandalonePage ? " app-main--standalone" : ""}`}>
        <Routes>
          <Route path="/preview/:pageSlug" element={<PreviewPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/our-pillars" element={<OurPillarsPlaceholderPage />} />
          <Route path="/about-us" element={<AboutUsPage />} />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route
            path="/event-experience"
            element={
              <RouteErrorBoundary name="event-experience" title="Events page unavailable">
                <Suspense fallback={<div className="member-dashboard__status">Loading events…</div>}>
                  <EventExperiencePage />
                </Suspense>
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/vcommerce"
            element={
              <Suspense fallback={<div className="member-dashboard__status">Loading VCommerce…</div>}>
                <VCommercePage />
              </Suspense>
            }
          />
          <Route
            path="/vcommerce/checkout"
            element={
              <Suspense fallback={<div className="member-dashboard__status">Loading checkout…</div>}>
                <VCommerceCheckoutPage />
              </Suspense>
            }
          />
          <Route
            path="/vcommerce/apply"
            element={
              <Suspense fallback={<div className="member-dashboard__status">Loading…</div>}>
                <VCommerceApplicationPage />
              </Suspense>
            }
          />
          <Route
            path="/vcommerce/apply/success"
            element={
              <Suspense fallback={<div className="member-dashboard__status">Loading…</div>}>
                <VCommerceApplicationSuccessPage />
              </Suspense>
            }
          />
          <Route
            path="/vcommerce/:slug"
            element={
              <Suspense fallback={<div className="member-dashboard__status">Loading business…</div>}>
                <VCommerceProfilePage />
              </Suspense>
            }
          />
          <Route
            path="/events/:eventIdOrSlug/tickets"
            element={
              <RouteErrorBoundary name="checkout" title="Checkout unavailable">
                <TicketBookingPage />
              </RouteErrorBoundary>
            }
          />
          <Route path="/events/:eventIdOrSlug/tickets/confirmation/:orderNumber" element={<TicketConfirmationPage />} />
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/sessions/:slug" element={<SessionDetailPage />} />
          <Route path="/sessions/:slug/book" element={<SessionBookingPage />} />
          <Route path="/rsvp/:eventSlug" element={<RsvpPage />} />
          <Route path="/stories" element={<StoriesPage />} />
          <Route path="/impact" element={<ImpactPage />} />
          <Route path="/sponsorship" element={<SponsorshipPage />} />
          <Route path="/membership" element={<MembershipPage />} />
          <Route path="/segments/vision-of-sounds" element={<EmptyPage />} />
          <Route path="/segments/vownl" element={<ImpactPage />} />
          <Route path="/segments/voice-of-visionaries" element={<EmptyPage />} />
          <Route path="/testimonials" element={<EmptyPage />} />
          <Route path="/blogs" element={<EmptyPage />} />
          <Route path="/donate" element={<DonatePage />} />
          <Route path="/contact-us" element={<ContactPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/voice-venture-studio" element={<VentureStudioPage />} />
          <Route path="/film-festival" element={<EmptyPage />} />
          <Route path="/verify-membership/:token" element={<VerifyMembershipPage />} />
          <Route path="/privacy-policy" element={<PoliciesPage />} />
          <Route path="/terms-and-conditions" element={<PoliciesPage />} />
          <Route path="/my-account" element={<LoginPage />} />
          <Route path="/login" element={<AuthAliasRedirect />} />
          <Route path="/register" element={<AuthAliasRedirect />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/accept-invite" element={<AdminAcceptInvitePage />} />
          <Route
            path="/admin/dashboard"
            element={
              <AdminProtectedRoute>
                <AdminDashboardPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard-builder"
            element={
              <AdminProtectedRoute>
                <AdminDashboardBuilderPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/customer-dashboard-builder"
            element={
              <AdminProtectedRoute>
                <AdminCustomerDashboardBuilderPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/customer-dashboard-builder/preview"
            element={
              <AdminProtectedRoute>
                <AdminCustomerDashboardPreviewPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <AdminProtectedRoute>
                <AdminSettingsLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<Navigate to="general" replace />} />
            <Route path="general" element={<AdminSettingsCategoryPage />} />
            <Route path="payment" element={<AdminSettingsCategoryPage />} />
            <Route path="ticketing" element={<AdminSettingsCategoryPage />} />
            <Route path="membership" element={<AdminSettingsCategoryPage />} />
            <Route path="sponsorship" element={<AdminSettingsCategoryPage />} />
            <Route path="donation" element={<AdminSettingsCategoryPage />} />
            <Route path="invoice" element={<AdminSettingsCategoryPage />} />
            <Route path="security" element={<AdminSettingsCategoryPage />} />
            <Route path="integrations" element={<AdminSettingsCategoryPage />} />
            <Route path="content-overrides" element={<AdminSettingsCategoryPage />} />
            <Route path="stripe" element={<AdminStripeSettingsPage />} />
            <Route path="bank" element={<AdminBankSettingsPage />} />
            <Route path="email-provider" element={<AdminEmailProviderSettingsPage />} />
            <Route path="email-templates" element={<AdminEmailTemplatesPage />} />
            <Route path="email-templates/:id" element={<AdminEmailTemplateEditorPage />} />
            <Route path="pdf-templates" element={<AdminPdfTemplatesPage />} />
            <Route path="audit-logs" element={<AdminSettingsAuditPage />} />
          </Route>
          <Route
            path="/admin/templates"
            element={
              <AdminProtectedRoute>
                <AdminTemplateUploadPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/discounts"
            element={
              <AdminProtectedRoute>
                <AdminDiscountsPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/membership-discounts"
            element={
              <AdminProtectedRoute>
                <AdminMembershipDiscountsPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminProtectedRoute>
                <AdminUsersPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/communication"
            element={
              <AdminProtectedRoute>
                <AdminBroadcastPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/events/highlights"
            element={
              <AdminProtectedRoute>
                <AdminEventHighlightsPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/events/:eventId/seat-map"
            element={
              <AdminProtectedRoute>
                <AdminSeatMapEditor />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/events/:eventId"
            element={
              <AdminProtectedRoute>
                <EventOperationsLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<Navigate to="operations" replace />} />
            <Route path="operations" element={<EventOperationsOverviewPage />} />
            <Route path="inventory" element={<EventInventoryPage />} />
            <Route path="technical-rider" element={<EventTechnicalRiderPage />} />
            <Route path="stage-plan" element={<EventStagePlanPage />} />
            <Route path="documents" element={<EventDocumentsPage />} />
          </Route>
          <Route
            path="/admin/inventory"
            element={
              <AdminProtectedRoute permission="inventory.view">
                <AdminGlobalInventoryPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/documents"
            element={
              <AdminProtectedRoute permission="documents.view">
                <AdminGlobalDocumentsPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/events"
            element={
              <AdminProtectedRoute>
                <AdminEventsPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/sessions"
            element={
              <AdminProtectedRoute>
                <AdminSessionsPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/session-bookings"
            element={
              <AdminProtectedRoute>
                <AdminSessionBookingsPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/session-calendar"
            element={
              <AdminProtectedRoute>
                <AdminSessionCalendarPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/resources"
            element={
              <AdminProtectedRoute>
                <AdminResourcesPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/rsvps"
            element={
              <AdminProtectedRoute>
                <AdminRsvpsPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/checkout-forms"
            element={
              <AdminProtectedRoute>
                <AdminCheckoutFormsPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/checkout-forms/responses"
            element={
              <AdminProtectedRoute>
                <AdminCheckoutFormsPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/reviews"
            element={
              <AdminProtectedRoute>
                <AdminReviewsPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/team-members"
            element={
              <AdminProtectedRoute>
                <AdminTeamMembersPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/cms/team-members"
            element={
              <AdminProtectedRoute>
                <AdminTeamMembersPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/personal-ai"
            element={
              <AdminProtectedRoute>
                <AdminAiAssistantPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/wallet"
            element={
              <AdminProtectedRoute>
                <AdminWalletPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/icon-library"
            element={
              <AdminProtectedRoute>
                <AdminIconLibraryPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/vcommerce"
            element={
              <AdminProtectedRoute>
                <AdminVCommercePage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/api-builder"
            element={
              <AdminProtectedRoute>
                <AdminApiBuilderPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/api-builder/logs"
            element={
              <AdminProtectedRoute>
                <AdminApiBuilderLogsPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/access-management"
            element={
              <AdminProtectedRoute permission="access_management.view">
                <AccessManagementLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<Navigate to="team" replace />} />
            <Route path="team" element={<AccessTeamMembersPage />} />
            <Route path="roles" element={<AccessRolesPage />} />
            <Route path="permissions" element={<AccessPermissionsPage />} />
            <Route path="invitations" element={<AccessInvitationsPage />} />
            <Route path="audit" element={<AccessAuditLogsPage />} />
            <Route path="settings" element={<AccessSettingsPage />} />
          </Route>
          <Route
            path="/admin/tickets"
            element={
              <AdminProtectedRoute>
                <AdminTicketsPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/vouchers"
            element={
              <AdminProtectedRoute>
                <AdminVouchersPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/check-in"
            element={<CheckInPwaPage />}
          />
          <Route
            path="/admin/check-in"
            element={
              <AdminProtectedRoute>
                <AdminCheckInPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/memberships"
            element={
              <AdminProtectedRoute>
                <AdminMembershipsPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/memberships/:id"
            element={
              <AdminProtectedRoute>
                <AdminMemberProfilePage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/members"
            element={
              <AdminProtectedRoute>
                <AdminMembershipsPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/sponsorships"
            element={
              <AdminProtectedRoute>
                <AdminSponsorshipsPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/sponsorships/:id"
            element={
              <AdminProtectedRoute>
                <AdminSponsorshipDetailPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/donations"
            element={
              <AdminProtectedRoute>
                <AdminDonationsPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/donations/:id"
            element={
              <AdminProtectedRoute>
                <AdminDonationDetailPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/finance/invoices"
            element={<AdminProtectedRoute><AdminFinanceInvoicesPage /></AdminProtectedRoute>}
          />
          <Route
            path="/admin/finance/event-budgets"
            element={<AdminProtectedRoute><AdminFinanceEventBudgetsPage /></AdminProtectedRoute>}
          />
          <Route
            path="/admin/finance/event-budgets/:id"
            element={<AdminProtectedRoute><AdminFinanceEventBudgetDetailPage /></AdminProtectedRoute>}
          />
          <Route
            path="/admin/finance/transactions"
            element={<AdminProtectedRoute><AdminFinanceTransactionsPage /></AdminProtectedRoute>}
          />
          <Route
            path="/admin/finance/audit-reports"
            element={<AdminProtectedRoute><AdminFinanceAuditReportsPage /></AdminProtectedRoute>}
          />
          <Route
            path="/admin/finance/reports"
            element={<AdminProtectedRoute><AdminFinanceReportsPage /></AdminProtectedRoute>}
          />
          <Route
            path="/admin/finance/settings"
            element={<AdminProtectedRoute><AdminFinanceSettingsPage /></AdminProtectedRoute>}
          />
          <Route
            path="/admin/reports"
            element={<AdminProtectedRoute><AdminReportsPage /></AdminProtectedRoute>}
          />
          <Route
            path="/admin/reports/custom"
            element={<AdminProtectedRoute><AdminCustomReportsPage /></AdminProtectedRoute>}
          />
          <Route
            path="/admin/pages"
            element={<AdminProtectedRoute><AdminPagesPage /></AdminProtectedRoute>}
          />
          <Route
            path="/admin/cms"
            element={<AdminProtectedRoute><AdminCmsHubPage /></AdminProtectedRoute>}
          />
          <Route
            path="/admin/cms/media-library"
            element={<AdminProtectedRoute><AdminMediaLibraryPage /></AdminProtectedRoute>}
          />
          <Route
            path="/admin/cms/design-system"
            element={<AdminProtectedRoute><AdminDesignSystemPage /></AdminProtectedRoute>}
          />
          <Route
            path="/admin/cms/component-library"
            element={<AdminProtectedRoute><AdminComponentLibraryPage /></AdminProtectedRoute>}
          />
          <Route
            path="/admin/cms/templates"
            element={<AdminProtectedRoute><AdminTemplatesPage /></AdminProtectedRoute>}
          />
          <Route
            path="/admin/cms/audit-log"
            element={<AdminProtectedRoute><AdminCmsAuditLogPage /></AdminProtectedRoute>}
          />
          <Route
            path="/admin/cms/seo"
            element={<AdminProtectedRoute><AdminCmsSeoPage /></AdminProtectedRoute>}
          />
          <Route
            path="/admin/cms/pages"
            element={<AdminProtectedRoute><AdminPagesPage /></AdminProtectedRoute>}
          />
          <Route
            path="/admin/cms/pages/dashboard"
            element={<Navigate to="/admin/customer-dashboard-builder" replace />}
          />
          <Route
            path="/admin/cms/pages/:pageSlug/visual-editor"
            element={<AdminProtectedRoute><AdminPageEditorPage defaultVisualMode /></AdminProtectedRoute>}
          />
          <Route
            path="/admin/pages/header"
            element={<AdminProtectedRoute><AdminHeaderEditorPage /></AdminProtectedRoute>}
          />
          <Route
            path="/admin/cms/navigation"
            element={<AdminProtectedRoute><AdminHeaderEditorPage /></AdminProtectedRoute>}
          />
          <Route
            path="/admin/pages/footer"
            element={<AdminProtectedRoute><AdminFooterEditorPage /></AdminProtectedRoute>}
          />
          <Route
            path="/admin/pages/:pageSlug"
            element={<AdminProtectedRoute><AdminPageEditorPage /></AdminProtectedRoute>}
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Suspense fallback={<div className="member-dashboard__status">Loading your dashboard…</div>}>
                  <DashboardPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/events"
            element={
              <ProtectedRoute>
                <Suspense fallback={<div className="member-dashboard__status">Loading your events…</div>}>
                  <DashboardMyEventsPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/events/:eventId/tickets"
            element={
              <ProtectedRoute>
                <Suspense fallback={<div className="member-dashboard__status">Loading your tickets…</div>}>
                  <DashboardEventTicketsPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/donations"
            element={
              <ProtectedRoute>
                <Suspense fallback={<div className="member-dashboard__status">Loading your donations…</div>}>
                  <DashboardGivingPage kind="donations" />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/sponsorships"
            element={
              <ProtectedRoute>
                <Suspense fallback={<div className="member-dashboard__status">Loading your sponsorships…</div>}>
                  <DashboardGivingPage kind="sponsorships" />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/profile"
            element={
              <ProtectedRoute>
                <MyProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/wallet"
            element={
              <ProtectedRoute>
                <Suspense fallback={<div className="member-dashboard__status">Loading your wallet…</div>}>
                  <WalletPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/vcommerce"
            element={
              <ProtectedRoute>
                <Suspense fallback={<div className="member-dashboard__status">Loading your business…</div>}>
                  <VCommercePortalPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/ai-assistant"
            element={
              <ProtectedRoute>
                <Suspense fallback={<div className="member-dashboard__status">Loading your assistant…</div>}>
                  <AiAssistantPageShell>
                    <AiChatPage />
                  </AiAssistantPageShell>
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/ai-assistant/prompts"
            element={
              <ProtectedRoute>
                <Suspense fallback={<div className="member-dashboard__status">Loading your prompts…</div>}>
                  <AiAssistantPageShell>
                    <AiPromptLibraryPage />
                  </AiAssistantPageShell>
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/ai-assistant/schedule"
            element={
              <ProtectedRoute>
                <Suspense fallback={<div className="member-dashboard__status">Loading your schedules…</div>}>
                  <AiAssistantPageShell>
                    <AiScheduledPromptsPage />
                  </AiAssistantPageShell>
                </Suspense>
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      {!hideSiteChrome && <Footer />}
      {!hideSiteChrome && <LanguageSwitcher />}
      {!hideSiteChrome && <SiteInstallPwaPrompt />}
      {!hideSiteChrome && <CookieConsentBanner />}
      {!hideSiteChrome && <CookiePreferencesModal />}
      <AiAssistantOverlay />
    </div>
    </>
  );
}
