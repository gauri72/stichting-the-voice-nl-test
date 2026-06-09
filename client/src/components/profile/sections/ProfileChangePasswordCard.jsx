import { useState } from "react";
import { Link } from "react-router-dom";
import { IconEye, IconEyeOff, IconLock } from "@tabler/icons-react";
import { apiFetch, authHeaders } from "../../../utils/api.js";
import { PROFILE_ROUTES } from "../profileUtils.js";

const EMPTY = { currentPassword: "", newPassword: "", confirmPassword: "" };

export default function ProfileChangePasswordCard() {
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
      setError("Please fill in all password fields.");
      return;
    }
    if (form.newPassword.length < 8) {
      setError("Your new password must be at least 8 characters long.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    if (form.newPassword === form.currentPassword) {
      setError("Your new password must be different from your current password.");
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
      setSuccess(
        result?.message ||
          "Your password has been updated. A confirmation email has been sent to you."
      );
      setForm(EMPTY);
      setEditing(false);
    } catch (e) {
      setError(e.message || "Could not update your password. Please try again.");
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
          <strong className="profile-card__title">Change Password</strong>
          <span className="profile-card__subtitle">Update your password to keep your account secure.</span>
        </span>
        {!editing ? (
          <button type="button" className="profile-btn profile-btn--compact" onClick={startEdit}>
            Change
          </button>
        ) : null}
      </div>

      {!editing ? (
        <div className="profile-card__body profile-password__row">
          <IconLock className="profile-password__icon" size={16} aria-hidden />
          <span className="profile-password__label">Password</span>
          <span className="profile-password__divider" aria-hidden />
          <span className="profile-password__dots" aria-label="Password hidden">
            ••••••••
          </span>
          <Link to={PROFILE_ROUTES.resetPassword} className="profile-btn profile-btn--outline">
            Forgot?
          </Link>
        </div>
      ) : (
        <form className="profile-card__body profile-form" onSubmit={handleSubmit}>
          <div className="profile-form__grid profile-form__grid--single">
            <PasswordField
              label="Current password"
              name="currentPassword"
              value={form.currentPassword}
              visible={show.current}
              onToggle={() => toggleShow("current")}
              onChange={(v) => updateField("currentPassword", v)}
              autoComplete="current-password"
            />
            <PasswordField
              label="New password"
              name="newPassword"
              value={form.newPassword}
              visible={show.next}
              onToggle={() => toggleShow("next")}
              onChange={(v) => updateField("newPassword", v)}
              autoComplete="new-password"
              hint="At least 8 characters."
            />
            <PasswordField
              label="Confirm new password"
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
              Cancel
            </button>
            <button type="submit" className="profile-btn profile-btn--solid" disabled={saving}>
              {saving ? "Updating…" : "Update password"}
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
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <IconEyeOff size={16} stroke={1.75} /> : <IconEye size={16} stroke={1.75} />}
        </button>
      </span>
      {hint ? <small className="profile-form__hint">{hint}</small> : null}
    </label>
  );
}
