import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { apiFetch, authHeaders } from "../../utils/api.js";
import ProfileHeroSection from "./sections/ProfileHeroSection.jsx";
import ProfilePersonalDetailsCard from "./sections/ProfilePersonalDetailsCard.jsx";
import ProfileChangePasswordCard from "./sections/ProfileChangePasswordCard.jsx";
import ProfilePaymentMethodsCard from "./sections/ProfilePaymentMethodsCard.jsx";
import { PROFILE_ROUTES } from "./profileUtils.js";
import "../../styles/my-profile-page.css";
import "../../styles/my-profile-desktop.css";
import "../../styles/my-profile-mobile.css";

export default function MyProfilePage() {
  const { user, refreshUser } = useAuth();
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

  const handleSaveProfile = useCallback(
    async (values) => {
      const { user: updatedUser } = await apiFetch("/api/auth/me", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(values),
      });
      // Reflect the saved values immediately, then refresh global session.
      setProfile((prev) => ({
        ...(prev || {}),
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        fullName: [updatedUser.firstName, updatedUser.lastName].filter(Boolean).join(" "),
        phone: updatedUser.phone || "",
        email: updatedUser.email,
      }));
      await refreshUser();
      return updatedUser;
    },
    [refreshUser]
  );

  const firstName = profile?.firstName ?? user?.firstName ?? "";
  const lastName = profile?.lastName ?? user?.lastName ?? "";
  const email = profile?.email || user?.email || "";
  const phone = profile?.phone ?? user?.phone ?? "";

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
              <ProfilePersonalDetailsCard
                firstName={firstName}
                lastName={lastName}
                email={email}
                phone={phone}
                onSave={handleSaveProfile}
              />
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
