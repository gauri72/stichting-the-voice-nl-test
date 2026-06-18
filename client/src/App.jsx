import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
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
import AdminBroadcastPage from "./components/admin/AdminBroadcastPage";
import AdminTemplateUploadPage from "./components/admin/AdminTemplateUploadPage";
import AdminDiscountsPage from "./components/admin/AdminDiscountsPage";
import AdminUsersPage from "./components/admin/AdminUsersPage";
import AdminEventsPage from "./components/admin/AdminEventsPage.jsx";
import AdminTicketsPage from "./components/admin/AdminTicketsPage.jsx";
import AdminCheckInPage from "./components/admin/AdminCheckInPage.jsx";
import CheckInPwaPage from "./components/checkin/CheckInPwaPage.jsx";
import AdminVouchersPage from "./components/admin/AdminVouchersPage.jsx";
import AdminMembershipsPage from "./components/admin/AdminMembershipsPage.jsx";
import AdminMemberProfilePage from "./components/admin/AdminMemberProfilePage.jsx";
import VerifyMembershipPage from "./components/membership/VerifyMembershipPage.jsx";
import TicketBookingPage from "./components/events/TicketBookingPage.jsx";
import TicketConfirmationPage from "./components/events/TicketConfirmationPage.jsx";
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
          <Route path="/" element={<HomePage />} />
          <Route path="/our-pillars" element={<PlaceholderPage title="Our Pillars" />} />
          <Route path="/about-us" element={<AboutUsPage />} />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:eventIdOrSlug/tickets" element={<TicketBookingPage />} />
          <Route path="/events/:eventIdOrSlug/tickets/confirmation/:orderNumber" element={<TicketConfirmationPage />} />
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
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin/dashboard"
            element={
              <AdminProtectedRoute>
                <AdminDashboardPage />
              </AdminProtectedRoute>
            }
          />
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
            path="/admin/events"
            element={
              <AdminProtectedRoute>
                <AdminEventsPage />
              </AdminProtectedRoute>
            }
          />
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
            path="/admin/reports"
            element={
              <AdminProtectedRoute>
                <AdminSectionPlaceholder
                  pageTitle="Reports"
                  pageSubtitle="Campaign analytics are coming soon."
                  message="Recent campaign summaries are available under Communication."
                />
              </AdminProtectedRoute>
            }
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
