import { useState } from "react";
import { useTranslation } from "react-i18next";
import { IconClockHour4 } from "@tabler/icons-react";

export default function WaitlistJoinForm({
  eventId,
  ticketTypeId,
  ticketTypeName,
  maxQuantity = 4,
  defaultAttendee = {},
  onJoinWaitlist,
}) {
  const { t } = useTranslation(["checkout"]);
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState(defaultAttendee.firstName || "");
  const [lastName, setLastName] = useState(defaultAttendee.lastName || "");
  const [email, setEmail] = useState(defaultAttendee.email || "");
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError(t("checkout:waitlist.fillNameEmail"));
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const data = await onJoinWaitlist({
        resourceType: "ticket_type",
        resourceId: ticketTypeId,
        eventId,
        ticketTypeId,
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        quantity,
      });
      setResult(data);
    } catch (err) {
      setError(err.message || t("checkout:waitlist.couldNotJoin"));
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <p className="ticket-booking__waitlist-success" role="status">
        {result.alreadyJoined
          ? t("checkout:waitlist.alreadyJoined")
          : t("checkout:waitlist.positionMessage", {
              position: result.entry?.position || "",
              ticketTypeName,
            })}
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        className="ticket-booking__waitlist-trigger"
        onClick={() => setOpen(true)}
      >
        <IconClockHour4 size={16} /> {t("checkout:waitlist.joinWaitlist")}
      </button>
    );
  }

  return (
    <form className="ticket-booking__waitlist-form" onSubmit={handleSubmit}>
      <div className="ticket-booking__waitlist-fields">
        <input
          placeholder={t("checkout:waitlist.firstName")}
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
        <input
          placeholder={t("checkout:waitlist.lastName")}
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder={t("checkout:waitlist.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <select
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          aria-label={`Quantity for ${ticketTypeName} waitlist`}
        >
          {Array.from({ length: maxQuantity }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
      {error ? (
        <p className="ticket-booking__waitlist-error" role="alert">{error}</p>
      ) : null}
      <div className="ticket-booking__waitlist-actions">
        <button
          type="button"
          className="ticket-booking__back"
          onClick={() => setOpen(false)}
          disabled={submitting}
        >
          {t("checkout:waitlist.cancel")}
        </button>
        <button
          type="submit"
          className="ticket-booking__cta ticket-booking__cta--small"
          disabled={submitting}
        >
          {submitting ? t("checkout:waitlist.joining") : t("checkout:waitlist.confirm")}
        </button>
      </div>
    </form>
  );
}
