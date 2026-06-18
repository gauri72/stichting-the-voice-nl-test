import AdminProtectedRoute from "../auth/AdminProtectedRoute.jsx";
import CheckInApp from "./CheckInApp.jsx";
import CheckInPwaShell from "./CheckInPwaShell.jsx";

export default function CheckInPwaPage() {
  return (
    <AdminProtectedRoute>
      <CheckInPwaShell>
        <CheckInApp variant="pwa" />
      </CheckInPwaShell>
    </AdminProtectedRoute>
  );
}
