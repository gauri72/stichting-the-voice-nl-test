import { Link } from "react-router-dom";
import AdminLayout from "./AdminLayout.jsx";
import CheckInApp from "../checkin/CheckInApp.jsx";
import InstallPwaPrompt from "../checkin/InstallPwaPrompt.jsx";
import "../../styles/checkin-pwa.css";

export default function AdminCheckInPage() {
  return (
    <AdminLayout
      pageTitle="QR Check-in"
      pageSubtitle="Scan or enter a ticket QR code to validate entry."
      hideBottomNav
    >
      <InstallPwaPrompt />
      <p className="checkin-admin-link">
        <Link to="/check-in">Open fullscreen Check-in app (PWA)</Link>
      </p>
      <CheckInApp variant="admin" />
    </AdminLayout>
  );
}
