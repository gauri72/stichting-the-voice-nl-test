import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IconEye, IconEyeOff, IconLock } from "@tabler/icons-react";
import { apiFetch, authHeaders } from "../../../utils/api.js";
import { PROFILE_ROUTES } from "../profileUtils.js";

const EMPTY = { currentPassword: "", newPassword: "", confirmPassword: "" };

export default function ProfileChangePasswordCard() {
  const { t } = useTranslation(["misc"]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function toggleShow(key) {
    setShow((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function startEdit() {
    setForm(EMPTY);
    setShow({ current: false, next: false, confirm: false });
    setError("");
    setSuccess("");
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setForm(EMPTY);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setError(t("misc:profile.changePassword.errorAllFields"));
      return;
    }
    if (form.newPassword.length < 8) {
      setError(t("misc:profile.changePassword.errorTooShort"));
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError(t("misc:profile.changePassword.errorMismatch"));
      return;
    }
    if (form.newPassword === form.currentPassword) {
      setError(t("misc:profile.changePassword.errorSameAsCurrent"));
      return;
    }

    setSaving(true);
    try {
      const result = await apiFetch("/api/auth/password", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      setSuccess(result?.message || t("misc:profile.changePassword.updateSuccessDefault"));
      setForm(EMPTY);
      setEditing(false);
    } catch (e) {
      setError(e.message || t("misc:profile.changePassword.updateError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="profile-card">
      <div className="profile-card__head">
        <span className="profile-card__icon" aria-hidden>
          <IconLock size={20} stroke={1.75} />
        </span>
        <span className="profile-card__head-copy">
          <strong className="profile-card__title">{t("misc:profile.changePassword.title")}</strong>
          <span className="profile-card__subtitle">{t("misc:profile.changePassword.subtitle")}</span>
        </span>
        {!editing ? (
          <button type="button" className="profile-btn profile-btn--compact" onClick={startEdit}>
            {t("misc:profile.changePassword.change")}
          </button>
        ) : null}
      </div>

      {!editing ? (
        <div className="profile-card__body profile-password__row">
          <IconLock className="profile-password__icon" size={16} aria-hidden />
          <span className="profile-password__label">{t("misc:profile.changePassword.password")}</span>
          <span className="profile-password__divider" aria-hidden />
          <span className="profile-password__dots" aria-label={t("misc:profile.changePassword.hidden")}>
            ••••••••
          </span>
          <Link to={PROFILE_ROUTES.resetPassword} className="profile-btn profile-btn--outline">
            {t("misc:profile.changePassword.forgot")}
          </Link>
        </div>
      ) : (
        <form className="profile-card__body profile-form" onSubmit={handleSubmit}>
          <div className="profile-form__grid profile-form__grid--single">
            <PasswordField
              label={t("misc:profile.changePassword.currentPassword")}
              name="currentPassword"
              value={form.currentPassword}
              visible={show.current}
              onToggle={() => toggleShow("current")}
              onChange={(v) => updateField("currentPassword", v)}
              autoComplete="current-password"
            />
            <PasswordField
              label={t("misc:profile.changePassword.newPassword")}
              name="newPassword"
              value={form.newPassword}
              visible={show.next}
              onToggle={() => toggleShow("next")}
              onChange={(v) => updateField("newPassword", v)}
              autoComplete="new-password"
              hint={t("misc:profile.changePassword.newPasswordHint")}
            />
            <PasswordField
              label={t("misc:profile.changePassword.confirmNewPassword")}
              name="confirmPassword"
              value={form.confirmPassword}
              visible={show.confirm}
              onToggle={() => toggleShow("confirm")}
              onChange={(v) => updateField("confirmPassword", v)}
              autoComplete="new-password"
            />
          </div>

          {error ? (
            <p className="profile-form__error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="profile-form__actions">
            <button
              type="button"
              className="profile-btn profile-btn--outline"
              onClick={cancelEdit}
              disabled={saving}
            >
              {t("misc:profile.changePassword.cancel")}
            </button>
            <button type="submit" className="profile-btn profile-btn--solid" disabled={saving}>
              {saving ? t("misc:profile.changePassword.updating") : t("misc:profile.changePassword.update")}
            </button>
          </div>
        </form>
      )}

      {success ? (
        <p className="profile-form__success profile-form__success--padded" role="status">
          {success}
        </p>
      ) : null}
    </article>
  );
}

function PasswordField({ label, name, value, visible, onToggle, onChange, autoComplete, hint }) {
  const { t } = useTranslation(["misc"]);
  return (
    <label className="profile-form__field">
      <span>{label}</span>
      <span className="profile-form__password">
        <input
          type={visible ? "text" : "password"}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          maxLength={200}
          required
        />
        <button
          type="button"
          className="profile-form__password-toggle"
          onClick={onToggle}
          aria-label={visible ? t("misc:profile.changePassword.hidePassword") : t("misc:profile.changePassword.showPassword")}
        >
          {visible ? <IconEyeOff size={16} stroke={1.75} /> : <IconEye size={16} stroke={1.75} />}
        </button>
      </span>
      {hint ? <small className="profile-form__hint">{hint}</small> : null}
    </label>
  );
}
