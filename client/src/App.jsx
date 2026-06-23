import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AppSplash from "./components/layout/AppSplash";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import CookieConsentBanner from "./components/layout/CookieConsentBanner";
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
const DashboardEventTicketsPage = lazy(() => import("./components/dashboard/DashboardEventTicketsPage"));
import MyProfilePage from "./components/profile/MyProfilePage";
import VentureStudioPage from "./components/venture-studio/VentureStudioPage";
import StoriesPage from "./components/stories/StoriesPage";
import ImpactPage from "./components/impact/ImpactPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import MaintenancePage from "./components/maintenance/MaintenancePage";
import PlaceholderPage from "./components/pages/PlaceholderPage";
import PoliciesPage from "./components/policies/PoliciesPage";
import AdminLoginPage from "./components/admin/AdminLoginPage";
import AdminDashboardPage from "./components/admin/AdminDashboardPage";
import AdminDashboardBuilderPage from "./components/admin/AdminDashboardBuilderPage.jsx";
import AdminCustomerDashboardBuilderPage from "./components/admin/AdminCustomerDashboardBuilderPage.jsx";
import AdminCustomerDashboardPreviewPage from "./components/admin/AdminCustomerDashboardPreviewPage.jsx";
import AdminBroadcastPage from "./components/admin/AdminBroadcastPage";
import AdminTemplateUploadPage from "./components/admin/AdminTemplateUploadPage";
import AdminDiscountsPage from "./components/admin/AdminDiscountsPage";
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
import AdminApiBuilderLogsPage from "./components/admin/AdminApiBuilderLogsPage.jsx";
import AccessManagementLayout from "./components/admin/access/AccessManagementLayout.jsx";
import AccessTeamMembersPage from "./components/admin/access/AccessTeamMembersPage.jsx";
import AccessRolesPage from "./components/admin/access/AccessRolesPage.jsx";
import AccessPermissionsPage from "./components/admin/access/AccessPermissionsPage.jsx";
import AccessInvitationsPage from "./components/admin/access/AccessInvitationsPage.jsx";
import AccessAuditLogsPage from "./components/admin/access/AccessAuditLogsPage.jsx";
import AccessSettingsPage from "./components/admin/access/AccessSettingsPage.jsx";
import AdminAcceptInvitePage from "./components/admin/AdminAcceptInvitePage.jsx";
import AdminSectionPlaceholder from "./components/admin/AdminSectionPlaceholder";
import AdminProtectedRoute from "./components/auth/AdminProtectedRoute";
import ManifestRouter from "./components/pwa/ManifestRouter.jsx";
import SiteInstallPwaPrompt from "./components/pwa/SiteInstallPwaPrompt.jsx";

// Enable by setting VITE_MAINTENANCE_MODE=true in your .env / hosting environment.
const MAINTENANCE_MODE = import.meta.env.VITE_MAINTENANCE_MODE === "true";

function EmptyPage() {
  return null;
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
          <Route path="/our-pillars" element={<PlaceholderPage title="Our Pillars" />} />
          <Route path="/about-us" element={<AboutUsPage />} />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:eventIdOrSlug/tickets" element={<TicketBookingPage />} />
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
          <Route path="/contact-us" element={<PlaceholderPage title="Contact Us" />} />
          <Route path="/contact" element={<PlaceholderPage title="Contact Us" />} />
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
            path="/admin/pages/header"
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
            path="/dashboard/profile"
            element={
              <ProtectedRoute>
                <MyProfilePage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      {!hideSiteChrome && <Footer />}
      {!hideSiteChrome && <SiteInstallPwaPrompt />}
      {!hideSiteChrome && <CookieConsentBanner />}
    </div>
    </>
  );
}
