import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import AppSplash from "./components/layout/AppSplash";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import HomePage from "./components/home/HomePage";
import MembershipPage from "./components/membership/MembershipPage";
import SponsorshipPage from "./components/sponsorship/SponsorshipPage";
import DonatePage from "./components/donate/DonatePage";
import EventsPage from "./components/events/EventsPage";
import LoginPage from "./components/login/LoginPage";
import ResetPasswordPage from "./components/login/ResetPasswordPage";
import DashboardPage from "./components/dashboard/DashboardPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";

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
  return (
    <>
      <AppSplash />
    <div className="app-shell">
      <ScrollToHash />
      <Header />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<EmptyPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/sponsorship" element={<SponsorshipPage />} />
          <Route path="/membership" element={<MembershipPage />} />
          <Route path="/segments/vision-of-sounds" element={<EmptyPage />} />
          <Route path="/segments/vownl" element={<EmptyPage />} />
          <Route path="/segments/voice-of-visionaries" element={<EmptyPage />} />
          <Route path="/testimonials" element={<EmptyPage />} />
          <Route path="/blogs" element={<EmptyPage />} />
          <Route path="/donate" element={<DonatePage />} />
          <Route path="/contact" element={<EmptyPage />} />
          <Route path="/voice-venture-studio" element={<EmptyPage />} />
          <Route path="/film-festival" element={<EmptyPage />} />
          <Route path="/privacy-policy" element={<EmptyPage />} />
          <Route path="/terms-and-conditions" element={<EmptyPage />} />
          <Route path="/my-account" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
    </>
  );
}
