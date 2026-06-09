import { useEffect, useState } from "react";
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

  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "—";
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
      setError("First and last name are required.");
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
      setSuccess("Your details have been updated.");
      setEditing(false);
    } catch (e) {
      setError(e.message || "Could not save your details. Please try again.");
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
          <strong className="profile-card__title">Personal Details</strong>
          <span className="profile-card__subtitle">View and update your personal information.</span>
        </span>
        {!editing ? (
          <button
            type="button"
            className="profile-btn profile-btn--compact"
            onClick={startEdit}
          >
            <IconPencil size={14} stroke={2} aria-hidden /> Edit
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
              <span>{email || "—"}</span>
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
              <span>First name</span>
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
              <span>Last name</span>
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
              <span>Phone</span>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                autoComplete="tel"
                maxLength={40}
                placeholder="+31 6 1234 5678"
              />
            </label>
            <label className="profile-form__field profile-form__field--readonly">
              <span>Email (cannot be changed)</span>
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
              Cancel
            </button>
            <button type="submit" className="profile-btn profile-btn--solid" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      )}
    </article>
  );
}
