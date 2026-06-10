import AdminLayout from "./AdminLayout.jsx";
import "../../styles/admin-broadcast-page.css";

export default function AdminSectionPlaceholder({ pageTitle, pageSubtitle, message }) {
  return (
    <AdminLayout pageTitle={pageTitle} pageSubtitle={pageSubtitle}>
      <p className="admin-broadcast__status">{message}</p>
    </AdminLayout>
  );
}
