import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { apiFetch, authHeaders } from "../../utils/api.js";
import ProfileHeroSection from "./sections/ProfileHeroSection.jsx";
import ProfilePersonalDetailsCard from "./sections/ProfilePersonalDetailsCard.jsx";
import ProfileChangePasswordCard from "./sections/ProfileChangePasswordCard.jsx";
import ProfilePaymentMethodsCard from "./sections/ProfilePaymentMethodsCard.jsx";
import { formatProfilePhone, PROFILE_ROUTES } from "./profileUtils.js";
import "../../styles/my-profile-page.css";
import "../../styles/my-profile-desktop.css";
import "../../styles/my-profile-mobile.css";

export default function MyProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await apiFetch("/api/dashboard", { headers: authHeaders() });
      setProfile(data?.profile || null);
    } catch (e) {
      setLoadError(e.message || "Could not load your profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const fullName =
    profile?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "Member";
  const email = profile?.email || user?.email || "";
  const phone = formatProfilePhone(profile?.phone || user?.phone);

  return (
    <div className="my-profile-page">
      <div className="my-profile-page__body">
        <ProfileHeroSection />

        <div className="my-profile-page__content">
          {loading ? (
            <p className="my-profile-page__status" role="status">
              Loading your profile…
            </p>
          ) : null}

          {!loading && loadError ? (
            <div className="my-profile-page__status my-profile-page__status--error" role="alert">
              <p>{loadError}</p>
              <button type="button" className="profile-btn profile-btn--outline" onClick={load}>
                Try again
              </button>
            </div>
          ) : null}

          {!loading && !loadError ? (
            <>
              <ProfilePersonalDetailsCard fullName={fullName} email={email} phone={phone} />
              <ProfileChangePasswordCard />
              <ProfilePaymentMethodsCard />
            </>
          ) : null}

          <Link to={PROFILE_ROUTES.dashboard} className="my-profile-page__back">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
