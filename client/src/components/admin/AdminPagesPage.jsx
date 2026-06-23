import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  IconArchive,
  IconCopy,
  IconEdit,
  IconEye,
  IconHistory,
  IconLayout,
  IconPlus,
  IconRestore,
  IconTrash,
} from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import { useAdminAuth } from "../../contexts/AdminAuthContext.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import {
  canWritePages,
  filterPages,
  formatDate,
  isSystemPageSlug,
  PAGE_FILTER_OPTIONS,
  statusBadgeClass,
} from "../../utils/pagesAdmin.js";
import "../../styles/admin-cms-page.css";

export default function AdminPagesPage() {
  const { admin } = useAdminAuth();
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [newPage, setNewPage] = useState({ title: "", route: "", slug: "" });
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

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  const visiblePages = useMemo(() => filterPages(pages, filter), [pages, filter]);

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

  async function handleArchive(slug) {
    if (!window.confirm("Archive this page? It will be hidden from the public site.")) return;
    try {
      await apiFetch(`/api/admin/pages/${slug}/archive`, { method: "POST", headers: adminAuthHeaders() });
      loadPages();
    } catch (err) {
      alert(err.message || "Archive failed.");
    }
  }

  async function handleRestore(slug) {
    try {
      await apiFetch(`/api/admin/pages/${slug}/restore`, { method: "POST", headers: adminAuthHeaders() });
      loadPages();
    } catch (err) {
      alert(err.message || "Restore failed.");
    }
  }

  async function handleDelete(slug) {
    if (isSystemPageSlug(slug)) {
      alert("System pages cannot be deleted. Archive or hide them instead.");
      return;
    }
    if (!window.confirm("Delete this page? It will be archived and removed from public navigation.")) return;
    try {
      await apiFetch(`/api/admin/pages/${slug}`, { method: "DELETE", headers: adminAuthHeaders() });
      loadPages();
    } catch (err) {
      alert(err.message || "Delete failed.");
    }
  }

  async function handleCreatePage(event) {
    event.preventDefault();
    const slug = (newPage.slug || newPage.title).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    try {
      const page = await apiFetch("/api/admin/pages", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({
          title: newPage.title.trim(),
          route: newPage.route.trim() || `/${slug}`,
          slug,
          status: "draft",
        }),
      });
      setShowCreate(false);
      setNewPage({ title: "", route: "", slug: "" });
      navigate(`/admin/pages/${page.slug}`);
    } catch (err) {
      alert(err.message || "Could not create page.");
    }
  }

  const specialPages = [
    { slug: "header", title: "Header / Navigation", route: "/admin/cms/navigation", isSpecial: true },
    { slug: "footer", title: "Footer", route: "/admin/pages/footer", isSpecial: true },
    { slug: "dashboard", title: "Dashboard (Member)", route: "/admin/customer-dashboard-builder", isSpecial: true },
    { slug: "team", title: "Team Members", route: "/admin/cms/team-members", isSpecial: true },
  ];

  return (
    <AdminLayout pageTitle="Website Pages" pageSubtitle="Edit website content, navigation, dashboard sections and team.">
      <div className="admin-cms">
        {error ? <p className="admin-cms__error">{error}</p> : null}
        {loading ? <p className="admin-cms__status">Loading pages…</p> : null}

        <div className="admin-cms__toolbar">
          <div className="admin-cms__toolbar-info">
            <IconLayout size={20} />
            <span>{visiblePages.length} of {pages.length} pages</span>
          </div>
          {!readOnly ? (
            <div className="admin-cms__toolbar-actions">
              <Link to="/admin/cms/navigation" className="admin-cms__btn admin-cms__btn--outline">Navigation</Link>
              <Link to="/admin/customer-dashboard-builder" className="admin-cms__btn admin-cms__btn--outline">Dashboard</Link>
              <Link to="/admin/cms/team-members" className="admin-cms__btn admin-cms__btn--outline">Team</Link>
              <button type="button" className="admin-cms__btn admin-cms__btn--primary" onClick={() => setShowCreate(true)}>
                <IconPlus size={16} /> New page
              </button>
            </div>
          ) : null}
        </div>

        <div className="admin-cms__filter-row">
          {PAGE_FILTER_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`admin-cms__filter-chip${filter === option.id ? " admin-cms__filter-chip--active" : ""}`}
              onClick={() => setFilter(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {showCreate ? (
          <form className="admin-cms__create-card" onSubmit={handleCreatePage}>
            <h3>Create page</h3>
            <input className="admin-cms__input" placeholder="Page title" value={newPage.title} onChange={(e) => setNewPage((p) => ({ ...p, title: e.target.value }))} required />
            <input className="admin-cms__input" placeholder="Route (e.g. /about-us)" value={newPage.route} onChange={(e) => setNewPage((p) => ({ ...p, route: e.target.value }))} />
            <input className="admin-cms__input" placeholder="Slug (optional)" value={newPage.slug} onChange={(e) => setNewPage((p) => ({ ...p, slug: e.target.value }))} />
            <div className="admin-cms__create-actions">
              <button type="button" className="admin-cms__btn admin-cms__btn--outline" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit" className="admin-cms__btn admin-cms__btn--primary">Create</button>
            </div>
          </form>
        ) : null}

        <div className="admin-cms__table-wrap">
          <table className="admin-cms__table">
            <thead>
              <tr>
                <th>Page</th>
                <th>Slug</th>
                <th>Route</th>
                <th>Status</th>
                <th>Last updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {specialPages.map((sp) => (
                <tr key={sp.slug} className="admin-cms__table-row--special">
                  <td><strong>{sp.title}</strong></td>
                  <td><code>{sp.slug}</code></td>
                  <td><code>{sp.route}</code></td>
                  <td><span className="admin-cms__badge admin-cms__badge--published">System</span></td>
                  <td>—</td>
                  <td>
                    <Link to={sp.route} className="admin-cms__btn admin-cms__btn--sm admin-cms__btn--primary">
                      <IconEdit size={14} /> Edit
                    </Link>
                  </td>
                </tr>
              ))}
              {visiblePages.map((page) => (
                <tr key={page.slug}>
                  <td>
                    <strong>{page.title}</strong>
                    {page.isSystem ? <span className="admin-cms__tag">System</span> : null}
                  </td>
                  <td><code>{page.slug}</code></td>
                  <td><code>{page.route}</code></td>
                  <td>
                    <span className={`admin-cms__badge ${statusBadgeClass(page.status)}`}>{page.status}</span>
                  </td>
                  <td>{formatDate(page.updatedAt)}</td>
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
                          {page.status === "archived" ? (
                            <button type="button" className="admin-cms__btn admin-cms__btn--sm" onClick={() => handleRestore(page.slug)}>
                              <IconRestore size={14} /> Restore
                            </button>
                          ) : (
                            <button type="button" className="admin-cms__btn admin-cms__btn--sm" onClick={() => handleArchive(page.slug)}>
                              <IconArchive size={14} /> Archive
                            </button>
                          )}
                          {!page.isSystem ? (
                            <button type="button" className="admin-cms__btn admin-cms__btn--sm admin-cms__btn--danger" onClick={() => handleDelete(page.slug)}>
                              <IconTrash size={14} /> Delete
                            </button>
                          ) : null}
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
