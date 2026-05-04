import { Route, Routes } from "react-router-dom";
import AppSplash from "./components/layout/AppSplash";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import HomePage from "./components/home/HomePage";
import MembershipPage from "./components/membership/MembershipPage";

function EmptyPage() {
  return null;
}

export default function App() {
  return (
    <>
      <AppSplash />
    <div className="app-shell">
      <Header />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<EmptyPage />} />
          <Route path="/events" element={<EmptyPage />} />
          <Route path="/sponsorship" element={<EmptyPage />} />
          <Route path="/membership" element={<MembershipPage />} />
          <Route path="/donate" element={<EmptyPage />} />
          <Route path="/contact" element={<EmptyPage />} />
          <Route path="/film-festival" element={<EmptyPage />} />
          <Route path="/privacy-policy" element={<EmptyPage />} />
          <Route path="/terms-and-conditions" element={<EmptyPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
    </>
  );
}
