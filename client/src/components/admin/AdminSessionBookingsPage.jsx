import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";

export default function AdminSessionBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      const data = await apiFetch("/api/admin/session-bookings", { headers: adminAuthHeaders() });
      setBookings(data.bookings || []);
    } catch (err) {
      setError(err.message || "Could not load session bookings.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id, bookingStatus) {
    await apiFetch(`/api/admin/session-bookings/${id}`, {
      method: "PATCH",
      headers: adminAuthHeaders(),
      body: JSON.stringify({ bookingStatus }),
    });
    load();
  }

  return (
    <AdminLayout pageTitle="Session Bookings" pageSubtitle="Reschedule, cancel, check-in and payment follow-up.">
      {error ? <p className="admin-tickets__error">{error}</p> : null}
      <div className="admin-tickets__table-wrap">
        <table className="admin-tickets__table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Customer</th>
              <th>Session</th>
              <th>Date & Time</th>
              <th>Participants</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td>{b.bookingId}</td>
                <td>{b.customerName}<span className="admin-tickets__sub">{b.customerEmail}</span></td>
                <td>{b.sessionId}</td>
                <td>{new Date(b.startsAt).toLocaleString()}</td>
                <td>{b.participants}</td>
                <td>{b.total}</td>
                <td>{b.bookingStatus}</td>
                <td>{b.paymentStatus}</td>
                <td className="admin-tickets__actions">
                  <button type="button" onClick={() => updateStatus(b.id, "rescheduled")}>Reschedule</button>
                  <button type="button" onClick={() => updateStatus(b.id, "cancelled")}>Cancel</button>
                  <button type="button" onClick={() => updateStatus(b.id, "attended")}>Check-in</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
