import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaEnvelope, FaIdCard, FaPhone } from "react-icons/fa";
import { IconPencil, IconUser } from "@tabler/icons-react";
import { formatProfilePhone } from "../profileUtils.js";

export default function ProfilePersonalDetailsCard({
  firstName,
  lastName,
  phone,
  email,
  onSave,
}) {
  const { t } = useTranslation(["misc"]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!editing) {
      setForm({
        firstName: firstName || "",
        lastName: lastName || "",
        phone: phone || "",
      });
    }
  }, [editing, firstName, lastName, phone]);

  const fullName = [firstName, lastName].filter(Boolean).join(" ") || t("misc:profile.personalDetails.noValue");
  const phoneDisplay = formatProfilePhone(phone);

  function startEdit() {
    setError("");
    setSuccess("");
    setForm({
      firstName: firstName || "",
      lastName: lastName || "",
      phone: phone || "",
    });
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setError("");
  }

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError(t("misc:profile.personalDetails.namesRequired"));
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await onSave({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
      });
      setSuccess(t("misc:profile.personalDetails.updateSuccess"));
      setEditing(false);
    } catch (e) {
      setError(e.message || t("misc:profile.personalDetails.updateError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="profile-card">
      <div className="profile-card__head">
        <span className="profile-card__icon" aria-hidden>
          <IconUser size={20} stroke={1.75} />
        </span>
        <span className="profile-card__head-copy">
          <strong className="profile-card__title">{t("misc:profile.personalDetails.title")}</strong>
          <span className="profile-card__subtitle">{t("misc:profile.personalDetails.subtitle")}</span>
        </span>
        {!editing ? (
          <button
            type="button"
            className="profile-btn profile-btn--compact"
            onClick={startEdit}
          >
            <IconPencil size={14} stroke={2} aria-hidden /> {t("misc:profile.personalDetails.edit")}
          </button>
        ) : null}
      </div>

      {!editing ? (
        <div className="profile-card__body">
          <div className="profile-personal__grid">
            <div className="profile-personal__item">
              <FaIdCard aria-hidden />
              <span>{fullName}</span>
            </div>
            <span className="profile-personal__divider" aria-hidden />
            <div className="profile-personal__item">
              <FaEnvelope aria-hidden />
              <span>{email || t("misc:profile.personalDetails.noValue")}</span>
            </div>
            <span className="profile-personal__divider" aria-hidden />
            <div className="profile-personal__item">
              <FaPhone aria-hidden />
              <span>{phoneDisplay}</span>
            </div>
          </div>
          {success ? (
            <p className="profile-form__success" role="status">
              {success}
            </p>
          ) : null}
        </div>
      ) : (
        <form className="profile-card__body profile-form" onSubmit={handleSubmit}>
          <div className="profile-form__grid">
            <label className="profile-form__field">
              <span>{t("misc:profile.personalDetails.firstName")}</span>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                autoComplete="given-name"
                maxLength={80}
                required
              />
            </label>
            <label className="profile-form__field">
              <span>{t("misc:profile.personalDetails.lastName")}</span>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
                autoComplete="family-name"
                maxLength={80}
                required
              />
            </label>
            <label className="profile-form__field">
              <span>{t("misc:profile.personalDetails.phone")}</span>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                autoComplete="tel"
                maxLength={40}
                placeholder={t("misc:profile.personalDetails.phonePlaceholder")}
              />
            </label>
            <label className="profile-form__field profile-form__field--readonly">
              <span>{t("misc:profile.personalDetails.emailReadonly")}</span>
              <input type="email" value={email || ""} readOnly disabled />
            </label>
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
              {t("misc:profile.personalDetails.cancel")}
            </button>
            <button type="submit" className="profile-btn profile-btn--solid" disabled={saving}>
              {saving ? t("misc:profile.personalDetails.saving") : t("misc:profile.personalDetails.save")}
            </button>
          </div>
        </form>
      )}
    </article>
  );
}
