import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  IconCopy,
  IconEdit,
  IconEye,
  IconHistory,
  IconLayout,
  IconPlus,
} from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import { useAdminAuth } from "../../contexts/AdminAuthContext.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import { canWritePages, formatDate, statusBadgeClass } from "../../utils/pagesAdmin.js";
import "../../styles/admin-cms-page.css";

export default function AdminPagesPage() {
  const { admin } = useAdminAuth();
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const readOnly = !canWritePages(admin?.role);

  const loadPages = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/admin/pages", { headers: adminAuthHeaders() });
      setPages(data.pages || []);
    } catch (err) {
      setError(err.message || "Could not load pages.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPages(); }, [loadPages]);

  async function handleDuplicate(slug) {
    try {
      const page = await apiFetch(`/api/admin/pages/${slug}/duplicate`, {
        method: "POST",
        headers: adminAuthHeaders(),
      });
      navigate(`/admin/pages/${page.slug}`);
    } catch (err) {
      alert(err.message || "Duplicate failed.");
    }
  }

  const specialPages = [
    { slug: "header", title: "Header / Navigation", route: "/admin/pages/header", isSpecial: true },
    { slug: "footer", title: "Footer", route: "/admin/pages/footer", isSpecial: true },
  ];

  return (
    <AdminLayout
      pageTitle="Website Pages"
      pageSubtitle="Edit website content, images, CTA links and page sections."
    >
      <div className="admin-cms">
        {error ? <p className="admin-cms__error">{error}</p> : null}
        {loading ? <p className="admin-cms__status">Loading pages…</p> : null}

        <div className="admin-cms__toolbar">
          <div className="admin-cms__toolbar-info">
            <IconLayout size={20} />
            <span>{pages.length} pages</span>
          </div>
          {!readOnly ? (
            <div className="admin-cms__toolbar-actions">
              <Link to="/admin/pages/header" className="admin-cms__btn admin-cms__btn--outline">Edit Header</Link>
              <Link to="/admin/pages/footer" className="admin-cms__btn admin-cms__btn--outline">Edit Footer</Link>
            </div>
          ) : null}
        </div>

        <div className="admin-cms__table-wrap">
          <table className="admin-cms__table">
            <thead>
              <tr>
                <th>Page</th>
                <th>Route</th>
                <th>Status</th>
                <th>Last updated</th>
                <th>Updated by</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {specialPages.map((sp) => (
                <tr key={sp.slug} className="admin-cms__table-row--special">
                  <td><strong>{sp.title}</strong></td>
                  <td><code>{sp.route}</code></td>
                  <td><span className="admin-cms__badge admin-cms__badge--published">Global</span></td>
                  <td>—</td>
                  <td>—</td>
                  <td>
                    <div className="admin-cms__actions">
                      <Link to={sp.route} className="admin-cms__btn admin-cms__btn--sm admin-cms__btn--primary">
                        <IconEdit size={14} /> Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {pages.map((page) => (
                <tr key={page.slug}>
                  <td><strong>{page.title}</strong></td>
                  <td><code>{page.route}</code></td>
                  <td>
                    <span className={`admin-cms__badge ${statusBadgeClass(page.status)}`}>{page.status}</span>
                  </td>
                  <td>{formatDate(page.updatedAt)}</td>
                  <td>{page.updatedBy || "—"}</td>
                  <td>
                    <div className="admin-cms__actions">
                      <Link to={`/admin/pages/${page.slug}`} className="admin-cms__btn admin-cms__btn--sm admin-cms__btn--primary">
                        <IconEdit size={14} /> Edit
                      </Link>
                      <a href={`/preview/${page.slug}?version=draft`} target="_blank" rel="noopener noreferrer" className="admin-cms__btn admin-cms__btn--sm">
                        <IconEye size={14} /> Preview
                      </a>
                      {!readOnly ? (
                        <>
                          <button type="button" className="admin-cms__btn admin-cms__btn--sm" onClick={() => handleDuplicate(page.slug)}>
                            <IconCopy size={14} /> Duplicate
                          </button>
                          <Link to={`/admin/pages/${page.slug}?tab=versions`} className="admin-cms__btn admin-cms__btn--sm">
                            <IconHistory size={14} /> Versions
                          </Link>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
